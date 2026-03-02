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
  title: string;
  imageUrl?: string | null;
  creator?: string;
  rating?: number;
  savedAt?: unknown;
}

export interface CreateRecipeInput {
  title: string;
  ownerId: string;
  ownerName?: string;
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

export interface SaveRecipeInput {
  id?: string;
  recipeId?: string;
  externalId?: string;
  source?: RecipeSource | string;
  title: string;
  imageUrl?: string | null;
  creator?: string;
  rating?: number;
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

const sanitizeId = (value: string) => value.replace(/[\/#?]+/g, '-');

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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(recipesRef, payload);
    return { id: docRef.id, ...input };
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
    await setDoc(
      savedRef,
      {
        recipeId: input.recipeId,
        externalId: input.externalId,
        source: input.source || 'external',
        title: input.title,
        imageUrl: input.imageUrl || null,
        creator: input.creator,
        rating: input.rating,
        savedAt: serverTimestamp(),
      },
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
