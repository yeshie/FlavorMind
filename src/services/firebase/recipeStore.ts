// src/services/firebase/recipeStore.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';

export type PublishStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type RecipeSource = 'user' | 'ai' | 'community' | 'api';

export interface FirestoreRecipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  image?: string | null;
  ownerId: string;
  ownerName?: string;
  ownerPhotoUrl?: string | null;
  publishStatus?: PublishStatus;
  source?: RecipeSource;
  externalId?: string;
  cuisine?: string;
  category?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: Array<{ name: string; quantity?: string | number; unit?: string }>;
  instructions?: Array<{ step: number; description: string }>;
  rating?: number;
  feedbackCount?: number;
  views?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SavedRecipeDoc {
  id: string;
  recipeId?: string;
  externalId?: string;
  source?: RecipeSource | string;
  sourceLabel?: string;
  title: string;
  imageUrl?: string | null;
  creator?: string;
  rating?: number;
  feedbackCount?: number;
  savedAt?: unknown;
}

export interface CreateRecipeInput {
  title: string;
  ownerId: string;
  ownerName?: string;
  ownerPhotoUrl?: string | null;
  publishStatus: PublishStatus;
  description?: string;
  imageUrl?: string | null;
  image?: string | null;
  source?: RecipeSource;
  externalId?: string;
  cuisine?: string;
  category?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: Array<{ name: string; quantity?: string | number; unit?: string }>;
  instructions?: Array<{ step: number; description: string }>;
}

export type UpdateRecipeInput = Partial<Omit<CreateRecipeInput, 'ownerId'>>;

export interface SaveRecipeInput {
  id?: string;
  recipeId?: string;
  externalId?: string;
  source?: RecipeSource | string;
  sourceLabel?: string;
  title: string;
  imageUrl?: string | null;
  creator?: string;
  rating?: number;
  feedbackCount?: number;
}

export interface EnsureRecipeDocumentInput {
  id?: string;
  externalId?: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  image?: string | null;
  ownerId?: string;
  ownerName?: string;
  ownerPhotoUrl?: string | null;
  publishStatus?: PublishStatus;
  source?: RecipeSource;
  cuisine?: string;
  category?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: Array<{ name: string; quantity?: string | number; unit?: string }>;
  instructions?: Array<{ step: number; description: string }>;
}

const requireDb = (): Firestore => {
  if (!hasFirebaseConfig || !db) {
    throw new Error(
      'Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* env vars to enable Firebase.'
    );
  }
  return db;
};

const mapRecipeDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): FirestoreRecipe => {
  const data = snapshot.data() as Omit<FirestoreRecipe, 'id'>;
  return { id: snapshot.id, ...data };
};

const mapRecipeSnapshot = (snapshot: { id: string; data: () => DocumentData | undefined }) => {
  const data = snapshot.data();
  if (!data) return null;
  return { id: snapshot.id, ...(data as Omit<FirestoreRecipe, 'id'>) } as FirestoreRecipe;
};

const mapSavedRecipeDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): SavedRecipeDoc => {
  const data = snapshot.data() as Omit<SavedRecipeDoc, 'id'>;
  return { id: snapshot.id, ...data };
};

const toSortableTime = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value === 'object') {
    const anyValue = value as { seconds?: number; toMillis?: () => number };
    if (typeof anyValue.toMillis === 'function') {
      return anyValue.toMillis();
    }
    if (typeof anyValue.seconds === 'number') {
      return anyValue.seconds * 1000;
    }
  }
  return 0;
};

const isPermissionDeniedError = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code || '';
  const message =
    (error as { message?: string } | null)?.message?.toLowerCase() || '';
  return code.includes('permission-denied') || message.includes('insufficient permissions');
};

const sanitizeId = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\/#?%]+/g, '-')
    .replace(/-+/g, '-');

const buildManagedRecipeId = (input: EnsureRecipeDocumentInput) => {
  if (input.ownerId && input.id) {
    return sanitizeId(input.id);
  }

  const seed =
    input.externalId ||
    input.id ||
    input.title ||
    `recipe-${Date.now()}`;
  return sanitizeId(`app-${seed.toLowerCase()}`);
};

const buildSavedRecipeId = (input: SaveRecipeInput): string => {
  if (input.id) return sanitizeId(input.id);
  if (input.recipeId) return sanitizeId(input.recipeId);
  if (input.externalId) {
    const prefix = input.source ? String(input.source) : 'external';
    return sanitizeId(`${prefix}-${input.externalId}`);
  }
  return `saved-${Date.now()}`;
};

const recipeStore = {
  async createRecipe(input: CreateRecipeInput): Promise<FirestoreRecipe> {
    const firestore = requireDb();
    const recipesRef = collection(firestore, 'recipes');
    const payload = {
      ...input,
      publishStatus: input.publishStatus,
      approvalStatus: input.publishStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(recipesRef, payload);
    return { id: docRef.id, ...input };
  },

  async ensureRecipeDocument(input: EnsureRecipeDocumentInput): Promise<FirestoreRecipe> {
    const firestore = requireDb();
    const recipeId = buildManagedRecipeId(input);
    const recipeRef = doc(firestore, 'recipes', recipeId);
    let existing: Omit<FirestoreRecipe, 'id'> | undefined;

    try {
      const snapshot = await getDoc(recipeRef);
      existing = snapshot.data() as Omit<FirestoreRecipe, 'id'> | undefined;
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        throw error;
      }
    }

    const source = input.source || existing?.source || 'api';
    const publishStatus =
      input.publishStatus
      || existing?.publishStatus
      || (source === 'user' ? 'draft' : 'approved');

    const payload = {
      title: input.title,
      description: input.description || existing?.description || '',
      imageUrl: input.imageUrl ?? input.image ?? existing?.imageUrl ?? existing?.image ?? null,
      image: input.image ?? input.imageUrl ?? existing?.image ?? existing?.imageUrl ?? null,
      ownerId: input.ownerId || existing?.ownerId || '',
      ownerName: input.ownerName || existing?.ownerName || null,
      ownerPhotoUrl: input.ownerPhotoUrl ?? existing?.ownerPhotoUrl ?? null,
      publishStatus,
      source,
      externalId: input.externalId || input.id || existing?.externalId || null,
      cuisine: input.cuisine || existing?.cuisine || '',
      category: input.category || existing?.category || '',
      difficulty: input.difficulty || existing?.difficulty || '',
      prepTime: input.prepTime ?? existing?.prepTime ?? 0,
      cookTime: input.cookTime ?? existing?.cookTime ?? 0,
      servings: input.servings ?? existing?.servings ?? 1,
      ingredients: input.ingredients || existing?.ingredients || [],
      instructions: input.instructions || existing?.instructions || [],
      rating: existing?.rating ?? 0,
      feedbackCount: existing?.feedbackCount ?? 0,
      views: existing?.views ?? 0,
      createdAt: existing?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(recipeRef, payload, { merge: true });

    return {
      id: recipeId,
      ...payload,
    } as FirestoreRecipe;
  },

  async getUserRecipes(ownerId: string): Promise<FirestoreRecipe[]> {
    const firestore = requireDb();
    const recipesRef = collection(firestore, 'recipes');
    const snapshot = await getDocs(query(recipesRef, where('ownerId', '==', ownerId)));
    const recipes = snapshot.docs.map(mapRecipeDoc);
    return recipes.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
  },

  async getApprovedRecipes(): Promise<FirestoreRecipe[]> {
    const firestore = requireDb();
    const recipesRef = collection(firestore, 'recipes');
    const snapshot = await getDocs(query(recipesRef, where('publishStatus', '==', 'approved')));
    const recipes = snapshot.docs.map(mapRecipeDoc);
    return recipes.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
  },

  async getRecipeById(recipeId: string): Promise<FirestoreRecipe | null> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'recipes', recipeId);
    const snapshot = await getDoc(recipeRef);
    return mapRecipeSnapshot(snapshot);
  },

  async updateRecipePublishStatus(recipeId: string, publishStatus: PublishStatus): Promise<void> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'recipes', recipeId);
    await updateDoc(recipeRef, {
      publishStatus,
      approvalStatus: publishStatus,
      updatedAt: serverTimestamp(),
    });
  },

  async updateRecipe(recipeId: string, input: UpdateRecipeInput): Promise<void> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'recipes', recipeId);
    const payload: Record<string, unknown> = {};

    Object.entries(input).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        payload[key] = value;
      }
    });

    if (input.publishStatus) {
      payload.approvalStatus = input.publishStatus;
    }

    await updateDoc(recipeRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteRecipe(recipeId: string): Promise<void> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'recipes', recipeId);
    await deleteDoc(recipeRef);
  },

  async saveRecipeToLibrary(userId: string, input: SaveRecipeInput): Promise<void> {
    const firestore = requireDb();
    const savedId = buildSavedRecipeId(input);
    const savedRef = doc(firestore, 'users', userId, 'savedRecipes', savedId);
    const payload: Record<string, unknown> = {
      source: input.source || 'external',
      title: input.title,
      imageUrl: input.imageUrl || null,
      creator: input.creator || null,
      rating: input.rating ?? null,
      feedbackCount: input.feedbackCount ?? null,
      savedAt: serverTimestamp(),
    };

    if (input.recipeId) {
      payload.recipeId = input.recipeId;
    }
    if (input.externalId) {
      payload.externalId = input.externalId;
    }
    if (input.sourceLabel) {
      payload.sourceLabel = input.sourceLabel;
    }

    await setDoc(
      savedRef,
      payload,
      { merge: true }
    );
  },

  async incrementRecipeViews(recipeId: string): Promise<void> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'recipes', recipeId);
    await updateDoc(recipeRef, {
      views: increment(1),
      updatedAt: serverTimestamp(),
    });
  },

  async getSavedRecipes(userId: string): Promise<SavedRecipeDoc[]> {
    const firestore = requireDb();
    const savedRef = collection(firestore, 'users', userId, 'savedRecipes');
    const snapshot = await getDocs(savedRef);
    const recipes = snapshot.docs.map(mapSavedRecipeDoc);
    return recipes.sort((a, b) => toSortableTime(b.savedAt) - toSortableTime(a.savedAt));
  },

  async removeSavedRecipe(userId: string, savedId: string): Promise<void> {
    const firestore = requireDb();
    const savedRef = doc(firestore, 'users', userId, 'savedRecipes', savedId);
    await deleteDoc(savedRef);
  },
};

export default recipeStore;
