import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';
import {
  CookingHistoryFeedbackInput,
  CookingHistorySessionInput,
  type CookingFeedbackTarget,
} from '../../common/utils/cookingHistory';

export interface FirestoreCookingHistory {
  id: string;
  dishName: string;
  dishImage?: string | null;
  recipeId?: string | null;
  feedbackRecipeId?: string | null;
  feedbackTarget?: CookingFeedbackTarget | null;
  servingSize?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalCookTime?: number | null;
  rating?: number | null;
  publicComment?: string | null;
  changes?: string | null;
  localImprovements?: string | null;
  personalTips?: string | null;
  comment?: string | null;
  cookedAt?: unknown;
  feedbackSavedAt?: unknown;
  updatedAt?: unknown;
}

const requireDb = (): Firestore => {
  if (!hasFirebaseConfig || !db) {
    throw new Error(
      'Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* env vars to enable Firebase.'
    );
  }
  return db;
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

const clampRating = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(1, Math.round(value)));
};

export const isPermissionDeniedError = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code || '';
  const message =
    (error as { message?: string } | null)?.message?.toLowerCase() || '';
  return code.includes('permission-denied') || message.includes('insufficient permissions');
};

const mapHistoryDoc = (
  snapshot: QueryDocumentSnapshot<DocumentData>
): FirestoreCookingHistory => {
  const data = snapshot.data() as Omit<FirestoreCookingHistory, 'id'>;
  return { id: snapshot.id, ...data };
};

const cookingHistoryStore = {
  async saveHistory(
    userId: string,
    input: CookingHistorySessionInput
  ): Promise<FirestoreCookingHistory> {
    const firestore = requireDb();
    const historyRef = doc(firestore, 'users', userId, 'cookingHistory', input.id);
    const existingSnapshot = await getDoc(historyRef);
    const existing = existingSnapshot.exists()
      ? (existingSnapshot.data() as Omit<FirestoreCookingHistory, 'id'>)
      : undefined;

    const payload = {
      dishName: input.dishName.trim(),
      dishImage: input.dishImage?.trim() || null,
      recipeId: input.recipeId?.trim() || null,
      feedbackRecipeId: input.feedbackRecipeId?.trim() || null,
      feedbackTarget: input.feedbackTarget || null,
      servingSize:
        typeof input.servingSize === 'number' && Number.isFinite(input.servingSize)
          ? input.servingSize
          : null,
      prepTime:
        typeof input.prepTime === 'number' && Number.isFinite(input.prepTime)
          ? Math.round(input.prepTime)
          : null,
      cookTime:
        typeof input.cookTime === 'number' && Number.isFinite(input.cookTime)
          ? Math.round(input.cookTime)
          : null,
      totalCookTime:
        typeof input.totalCookTime === 'number' && Number.isFinite(input.totalCookTime)
          ? Math.round(input.totalCookTime)
          : null,
      cookedAt: existing?.cookedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(historyRef, payload, { merge: true });

    return {
      id: input.id,
      ...payload,
      cookedAt: existing?.cookedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateHistoryFeedback(
    userId: string,
    input: CookingHistoryFeedbackInput
  ): Promise<void> {
    const firestore = requireDb();
    const historyRef = doc(firestore, 'users', userId, 'cookingHistory', input.id);

    await setDoc(
      historyRef,
      {
        rating: clampRating(input.rating),
        publicComment: input.publicComment?.trim() || null,
        changes: input.changes?.trim() || null,
        localImprovements: input.localImprovements?.trim() || null,
        personalTips: input.personalTips?.trim() || null,
        comment: input.comment?.trim() || null,
        feedbackSavedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async getCookingHistory(userId: string): Promise<FirestoreCookingHistory[]> {
    const firestore = requireDb();
    const historyRef = collection(firestore, 'users', userId, 'cookingHistory');
    const snapshot = await getDocs(historyRef);
    const history = snapshot.docs.map(mapHistoryDoc);
    return history.sort((left, right) => {
      const rightTime = Math.max(
        toSortableTime(right.updatedAt),
        toSortableTime(right.cookedAt)
      );
      const leftTime = Math.max(
        toSortableTime(left.updatedAt),
        toSortableTime(left.cookedAt)
      );
      return rightTime - leftTime;
    });
  },
};

export default cookingHistoryStore;
