import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';

export interface FirestorePublicRecipe {
  id: string;
  recipeKey: string;
  title: string;
  titleLower: string;
  description?: string | null;
  source?: string;
  imageUrl?: string | null;
  image?: string | null;
  externalId?: string | null;
  rating?: number;
  feedbackCount?: number;
  views?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FirestorePublicRecipeFeedback {
  id: string;
  recipeId: string;
  userId: string;
  userName?: string | null;
  userAvatar?: string | null;
  rating: number;
  publicComment?: string | null;
  comment?: string | null;
  dishName?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EnsurePublicRecipeInput {
  id?: string;
  externalId?: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  image?: string | null;
  source?: string;
}

export interface SubmitPublicRecipeFeedbackInput {
  userId: string;
  userName?: string | null;
  userAvatar?: string | null;
  rating: number;
  publicComment?: string;
  comment?: string;
  dishName?: string;
}

const requireDb = (): Firestore => {
  if (!hasFirebaseConfig || !db) {
    throw new Error(
      'Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* env vars to enable Firebase.'
    );
  }
  return db;
};

const sanitizeId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[\/#?%:]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeSource = (value?: string | null) => {
  if (value === 'ai') return 'ai';
  if (value === 'retrieved') return 'retrieved';
  if (value === 'app') return 'app';
  return 'app';
};

const buildPublicRecipeKey = (input: EnsurePublicRecipeInput) => {
  const source = normalizeSource(input.source);
  const seed = sanitizeId(
    String(input.externalId || input.id || input.title || `public-recipe-${Date.now()}`)
  );
  if (!seed) {
    return `${source}-recipe-${Date.now()}`;
  }
  return seed.startsWith(`${source}-`) ? seed : `${source}-${seed}`;
};

export const getPublicRecipeKey = (input: EnsurePublicRecipeInput) =>
  buildPublicRecipeKey(input);

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampRating = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(1, Math.round(value)));
};

const mapFeedbackDoc = (
  snapshot: QueryDocumentSnapshot<DocumentData>
): FirestorePublicRecipeFeedback => {
  const data = snapshot.data() as Omit<FirestorePublicRecipeFeedback, 'id'>;
  return { id: snapshot.id, ...data };
};

const publicRecipeStore = {
  async ensurePublicRecipeDocument(
    input: EnsurePublicRecipeInput
  ): Promise<FirestorePublicRecipe> {
    const firestore = requireDb();
    const recipeKey = buildPublicRecipeKey(input);
    const recipeRef = doc(firestore, 'publicRecipes', recipeKey);
    const snapshot = await getDoc(recipeRef);
    const existing = snapshot.exists()
      ? (snapshot.data() as Omit<FirestorePublicRecipe, 'id'>)
      : undefined;

    const title = String(input.title || existing?.title || 'Recipe').trim() || 'Recipe';
    const payload = {
      recipeKey,
      title,
      titleLower: title.toLowerCase(),
      description: input.description ?? existing?.description ?? null,
      source: normalizeSource(input.source || existing?.source),
      imageUrl: input.imageUrl ?? input.image ?? existing?.imageUrl ?? existing?.image ?? null,
      image: input.image ?? input.imageUrl ?? existing?.image ?? existing?.imageUrl ?? null,
      externalId: input.externalId || input.id || existing?.externalId || null,
      rating: toNumber(existing?.rating, 0),
      feedbackCount: toNumber(existing?.feedbackCount, 0),
      views: toNumber(existing?.views, 0),
      createdAt: existing?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(recipeRef, payload, { merge: true });

    return {
      id: recipeKey,
      ...payload,
    };
  },

  async incrementRecipeViews(recipeKey: string): Promise<void> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'publicRecipes', recipeKey);
    await updateDoc(recipeRef, {
      views: increment(1),
      updatedAt: serverTimestamp(),
    });
  },

  async submitFeedback(
    recipeKey: string,
    input: SubmitPublicRecipeFeedbackInput
  ): Promise<FirestorePublicRecipeFeedback> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'publicRecipes', recipeKey);
    const feedbackRef = collection(firestore, 'publicRecipes', recipeKey, 'feedback');
    const feedbackDoc = doc(feedbackRef, input.userId);

    const rating = clampRating(input.rating);
    const trimmedComment = input.comment?.trim();
    const trimmedPublicComment = input.publicComment?.trim();

    const feedbackPayload = {
      recipeId: recipeKey,
      userId: input.userId,
      userName: input.userName || 'Anonymous',
      userAvatar: input.userAvatar || null,
      rating,
      publicComment: trimmedPublicComment || null,
      comment: trimmedComment || null,
      dishName: input.dishName || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await runTransaction(firestore, async (transaction) => {
      const recipeSnap = await transaction.get(recipeRef);
      const feedbackSnap = await transaction.get(feedbackDoc);
      const recipeData = recipeSnap.exists()
        ? (recipeSnap.data() as Record<string, unknown>)
        : {};

      const currentCount = toNumber(recipeData.feedbackCount, 0);
      const currentRating = toNumber(recipeData.rating, 0);
      let newCount = currentCount;
      let newRating = rating;

      if (feedbackSnap.exists()) {
        const existingRating = toNumber(
          (feedbackSnap.data() as Record<string, unknown>)?.rating,
          rating
        );
        if (currentCount > 0) {
          const total = currentRating * currentCount - existingRating + rating;
          newRating = total / currentCount;
        }
      } else {
        newCount = currentCount + 1;
        newRating =
          newCount > 0 ? (currentRating * currentCount + rating) / newCount : rating;
      }

      const normalizedRating = Math.round(newRating * 100) / 100;

      transaction.set(feedbackDoc, feedbackPayload, { merge: true });

      if (recipeSnap.exists()) {
        transaction.update(recipeRef, {
          rating: normalizedRating,
          feedbackCount: newCount,
          updatedAt: serverTimestamp(),
        });
      } else {
        const title =
          String(input.dishName || recipeKey.replace(/^(ai|app|retrieved)-/, ''))
            .replace(/-/g, ' ')
            .trim() || 'Recipe';
        transaction.set(
          recipeRef,
          {
            recipeKey,
            title,
            titleLower: title.toLowerCase(),
            description: null,
            source: recipeKey.startsWith('ai-') ? 'ai' : 'app',
            imageUrl: null,
            image: null,
            externalId: null,
            rating: normalizedRating,
            feedbackCount: newCount,
            views: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    });

    return {
      id: feedbackDoc.id,
      recipeId: recipeKey,
      userId: input.userId,
      userName: input.userName || 'Anonymous',
      userAvatar: input.userAvatar || null,
      rating,
      publicComment: trimmedPublicComment || null,
      comment: trimmedComment || null,
      dishName: input.dishName || null,
      createdAt: new Date().toISOString(),
    };
  },

  async getRecipeFeedback(
    recipeKey: string,
    maxCount = 20
  ): Promise<FirestorePublicRecipeFeedback[]> {
    const firestore = requireDb();
    const feedbackRef = collection(firestore, 'publicRecipes', recipeKey, 'feedback');
    const snapshot = await getDocs(
      query(feedbackRef, orderBy('createdAt', 'desc'), limit(maxCount))
    );
    return snapshot.docs.map(mapFeedbackDoc);
  },

  async deleteFeedback(recipeKey: string, feedbackId: string): Promise<void> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'publicRecipes', recipeKey);
    const feedbackRef = doc(firestore, 'publicRecipes', recipeKey, 'feedback', feedbackId);

    await runTransaction(firestore, async (transaction) => {
      const recipeSnap = await transaction.get(recipeRef);
      const feedbackSnap = await transaction.get(feedbackRef);

      if (!recipeSnap.exists() || !feedbackSnap.exists()) {
        return;
      }

      const recipeData = recipeSnap.data() as Record<string, unknown>;
      const currentCount = toNumber(recipeData.feedbackCount, 0);
      const currentRating = toNumber(recipeData.rating, 0);
      const removedRating = toNumber(
        (feedbackSnap.data() as Record<string, unknown>)?.rating,
        0
      );
      const newCount = Math.max(0, currentCount - 1);
      const newRating =
        newCount > 0 ? (currentRating * currentCount - removedRating) / newCount : 0;
      const normalizedRating = Math.round(newRating * 100) / 100;

      transaction.delete(feedbackRef);
      transaction.update(recipeRef, {
        rating: normalizedRating,
        feedbackCount: newCount,
        updatedAt: serverTimestamp(),
      });
    });
  },
};

export default publicRecipeStore;
