// src/services/firebase/feedbackStore.ts
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';

export interface FirestoreFeedback {
  id: string;
  recipeId: string;
  userId: string;
  userName?: string | null;
  userAvatar?: string | null;
  rating: number;
  publicComment?: string | null;
  comment?: string | null;
  ownerReply?: string | null;
  ownerReplyAt?: unknown;
  dishName?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SubmitFeedbackInput {
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

const mapFeedbackDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): FirestoreFeedback => {
  const data = snapshot.data() as Omit<FirestoreFeedback, 'id'>;
  return { id: snapshot.id, ...data };
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampRating = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(1, Math.round(value)));
};

const feedbackStore = {
  async submitFeedback(
    recipeId: string,
    input: SubmitFeedbackInput
  ): Promise<FirestoreFeedback> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'recipes', recipeId);
    const feedbackRef = collection(firestore, 'recipes', recipeId, 'feedback');
    const feedbackDoc = doc(feedbackRef, input.userId);
    const userFeedbackRef = doc(firestore, 'users', input.userId, 'feedback', recipeId);

    const rating = clampRating(input.rating);
    const trimmedComment = input.comment?.trim();
    const trimmedPublicComment = input.publicComment?.trim();

    const payload = {
      recipeId,
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
      if (!recipeSnap.exists()) {
        throw new Error('Recipe not found');
      }

      const recipeData = recipeSnap.data() as Record<string, unknown>;
      const currentCount = toNumber(recipeData.feedbackCount, 0);
      const currentRating = toNumber(recipeData.rating, 0);
      let newCount = currentCount;
      let newRating = rating;

      if (feedbackSnap.exists()) {
        const existingRating = toNumber((feedbackSnap.data() as Record<string, unknown>)?.rating, rating);
        if (currentCount > 0) {
          const total = currentRating * currentCount - existingRating + rating;
          newCount = currentCount;
          newRating = total / newCount;
        } else {
          newCount = 1;
          newRating = rating;
        }
      } else {
        newCount = currentCount + 1;
        newRating = newCount > 0 ? (currentRating * currentCount + rating) / newCount : rating;
      }
      const normalizedRating = Math.round(newRating * 100) / 100;

      transaction.set(feedbackDoc, payload, { merge: true });
      transaction.set(userFeedbackRef, payload, { merge: true });
      transaction.update(recipeRef, {
        rating: normalizedRating,
        feedbackCount: newCount,
        updatedAt: serverTimestamp(),
      });
    });

    return {
      id: feedbackDoc.id,
      recipeId,
      userId: input.userId,
      userName: input.userName || 'Anonymous',
      userAvatar: input.userAvatar || null,
      rating,
      publicComment: trimmedPublicComment || null,
      comment: trimmedComment || null,
      ownerReply: null,
      dishName: input.dishName || null,
      createdAt: new Date().toISOString(),
    };
  },

  async getRecipeFeedback(recipeId: string, maxCount = 20): Promise<FirestoreFeedback[]> {
    const firestore = requireDb();
    const feedbackRef = collection(firestore, 'recipes', recipeId, 'feedback');
    const snapshot = await getDocs(
      query(feedbackRef, orderBy('createdAt', 'desc'), limit(maxCount))
    );
    return snapshot.docs.map(mapFeedbackDoc);
  },

  async replyToFeedback(recipeId: string, feedbackId: string, reply: string): Promise<void> {
    const firestore = requireDb();
    const feedbackRef = doc(firestore, 'recipes', recipeId, 'feedback', feedbackId);
    const userFeedbackRef = doc(firestore, 'users', feedbackId, 'feedback', recipeId);
    const trimmedReply = reply.trim();
    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(feedbackRef);
      if (!snap.exists()) {
        throw new Error('Feedback not found');
      }
      transaction.update(feedbackRef, {
        ownerReply: trimmedReply || null,
        ownerReplyAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.set(
        userFeedbackRef,
        {
          ownerReply: trimmedReply || null,
          ownerReplyAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  },

  async deleteFeedback(recipeId: string, feedbackId: string): Promise<void> {
    const firestore = requireDb();
    const recipeRef = doc(firestore, 'recipes', recipeId);
    const feedbackRef = doc(firestore, 'recipes', recipeId, 'feedback', feedbackId);
    const userFeedbackRef = doc(firestore, 'users', feedbackId, 'feedback', recipeId);

    await runTransaction(firestore, async (transaction) => {
      const recipeSnap = await transaction.get(recipeRef);
      const feedbackSnap = await transaction.get(feedbackRef);
      if (!recipeSnap.exists()) {
        throw new Error('Recipe not found');
      }
      if (!feedbackSnap.exists()) {
        return;
      }

      const recipeData = recipeSnap.data() as Record<string, unknown>;
      const currentCount = toNumber(recipeData.feedbackCount, 0);
      const currentRating = toNumber(recipeData.rating, 0);
      const removedRating = toNumber((feedbackSnap.data() as Record<string, unknown>)?.rating, 0);
      const newCount = Math.max(0, currentCount - 1);
      const newRating =
        newCount > 0 ? (currentRating * currentCount - removedRating) / newCount : 0;
      const normalizedRating = Math.round(newRating * 100) / 100;

      transaction.delete(feedbackRef);
      transaction.delete(userFeedbackRef);
      transaction.update(recipeRef, {
        rating: normalizedRating,
        feedbackCount: newCount,
        updatedAt: serverTimestamp(),
      });
    });
  },
};

export default feedbackStore;
