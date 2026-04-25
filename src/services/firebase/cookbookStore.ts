// src/services/firebase/cookbookStore.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';

export type CookbookPublishStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type CookbookSource = 'user' | 'community' | 'api';

export interface FirestoreCookbook {
  id: string;
  title: string;
  ownerId: string;
  authorName?: string;
  coverImageUrl?: string | null;
  introImageUrl?: string | null;
  thankYouImageUrl?: string | null;
  introduction?: string;
  occupation?: string;
  aboutAuthor?: string;
  thankYouMessage?: string;
  categories?: string[];
  shareVisibility?: 'public' | 'private';
  recipes?: string[];
  recipesCount?: number;
  publishStatus?: CookbookPublishStatus;
  approvalStatus?: CookbookPublishStatus;
  source?: CookbookSource;
  externalId?: string;
  ratingAverage?: number;
  ratingCount?: number;
  reviewedBy?: string | null;
  reviewedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SavedCookbookDoc {
  id: string;
  cookbookId?: string;
  externalId?: string;
  source?: CookbookSource | string;
  title: string;
  coverImageUrl?: string | null;
  author?: string;
  rating?: number;
  recipesCount?: number;
  savedAt?: unknown;
}

export interface CreateCookbookInput {
  title: string;
  ownerId: string;
  authorName?: string;
  coverImageUrl?: string | null;
  introImageUrl?: string | null;
  thankYouImageUrl?: string | null;
  introduction?: string;
  occupation?: string;
  aboutAuthor?: string;
  thankYouMessage?: string;
  categories?: string[];
  shareVisibility?: 'public' | 'private';
  recipes: string[];
  recipesCount: number;
  publishStatus?: CookbookPublishStatus;
}

export interface SaveCookbookInput {
  id?: string;
  cookbookId?: string;
  externalId?: string;
  source?: CookbookSource | string;
  title: string;
  coverImageUrl?: string | null;
  author?: string;
  rating?: number;
  recipesCount?: number;
}

const requireDb = (): Firestore => {
  if (!hasFirebaseConfig || !db) {
    throw new Error(
      'Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* env vars to enable Firebase.'
    );
  }
  return db;
};

const mapCookbookDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): FirestoreCookbook => {
  const data = snapshot.data() as Omit<FirestoreCookbook, 'id'>;
  return { id: snapshot.id, ...data };
};

const mapSavedCookbookDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): SavedCookbookDoc => {
  const data = snapshot.data() as Omit<SavedCookbookDoc, 'id'>;
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

const buildSavedCookbookId = (input: SaveCookbookInput): string => {
  if (input.id) return sanitizeId(input.id);
  if (input.cookbookId) return sanitizeId(input.cookbookId);
  if (input.externalId) {
    const prefix = input.source ? String(input.source) : 'external';
    return sanitizeId(`${prefix}-${input.externalId}`);
  }
  return `saved-${Date.now()}`;
};

const cookbookStore = {
  async createCookbook(input: CreateCookbookInput): Promise<FirestoreCookbook> {
    const firestore = requireDb();
    const cookbooksRef = collection(firestore, 'cookbooks');
    const payload = {
      ...input,
      publishStatus: input.publishStatus || 'pending',
      approvalStatus: input.publishStatus || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(cookbooksRef, payload);
    return { id: docRef.id, ...input };
  },

  async getUserCookbooks(ownerId: string): Promise<FirestoreCookbook[]> {
    const firestore = requireDb();
    const cookbooksRef = collection(firestore, 'cookbooks');
    const snapshot = await getDocs(query(cookbooksRef, where('ownerId', '==', ownerId)));
    const cookbooks = snapshot.docs.map(mapCookbookDoc);
    return cookbooks.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
  },

  async getApprovedCookbooks(): Promise<FirestoreCookbook[]> {
    const firestore = requireDb();
    const cookbooksRef = collection(firestore, 'cookbooks');
    const snapshot = await getDocs(query(cookbooksRef, where('publishStatus', '==', 'approved')));
    const cookbooks = snapshot.docs.map(mapCookbookDoc);
    return cookbooks.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
  },

  async updateCookbookPublishStatus(
    cookbookId: string,
    publishStatus: CookbookPublishStatus
  ): Promise<void> {
    const firestore = requireDb();
    const cookbookRef = doc(firestore, 'cookbooks', cookbookId);
    await updateDoc(cookbookRef, {
      publishStatus,
      approvalStatus: publishStatus,
      updatedAt: serverTimestamp(),
    });
  },

  async rateCookbook(cookbookId: string, userId: string, rating: number): Promise<void> {
    const firestore = requireDb();
    const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
    const cookbookRef = doc(firestore, 'cookbooks', cookbookId);
    const ratingRef = doc(firestore, 'cookbooks', cookbookId, 'ratings', userId);

    await runTransaction(firestore, async (transaction) => {
      const [cookbookSnap, ratingSnap] = await Promise.all([
        transaction.get(cookbookRef),
        transaction.get(ratingRef),
      ]);

      if (!cookbookSnap.exists()) {
        throw new Error('Cookbook not found');
      }

      const cookbookData = cookbookSnap.data() as FirestoreCookbook;
      const previousRating = ratingSnap.exists()
        ? Number((ratingSnap.data() as { rating?: number }).rating || 0)
        : 0;
      const currentCount = Number(cookbookData.ratingCount || 0);
      const currentAverage = Number(cookbookData.ratingAverage || 0);
      const previousTotal = currentAverage * currentCount;
      const nextCount = previousRating > 0 ? currentCount : currentCount + 1;
      const nextTotal = previousRating > 0
        ? previousTotal - previousRating + safeRating
        : previousTotal + safeRating;
      const nextAverage = nextCount > 0 ? Math.round((nextTotal / nextCount) * 10) / 10 : safeRating;

      transaction.set(
        ratingRef,
        {
          userId,
          rating: safeRating,
          updatedAt: serverTimestamp(),
          createdAt: ratingSnap.exists() ? ratingSnap.data()?.createdAt || serverTimestamp() : serverTimestamp(),
        },
        { merge: true }
      );
      transaction.update(cookbookRef, {
        ratingAverage: nextAverage,
        ratingCount: nextCount,
        updatedAt: serverTimestamp(),
      });
    });
  },

  async deleteCookbook(cookbookId: string): Promise<void> {
    const firestore = requireDb();
    const cookbookRef = doc(firestore, 'cookbooks', cookbookId);
    await deleteDoc(cookbookRef);
  },

  async saveCookbookToLibrary(userId: string, input: SaveCookbookInput): Promise<void> {
    const firestore = requireDb();
    const savedId = buildSavedCookbookId(input);
    const savedRef = doc(firestore, 'users', userId, 'savedCookbooks', savedId);
    await setDoc(
      savedRef,
      {
        cookbookId: input.cookbookId,
        externalId: input.externalId,
        source: input.source || 'external',
        title: input.title,
        coverImageUrl: input.coverImageUrl || null,
        author: input.author,
        rating: input.rating,
        recipesCount: input.recipesCount,
        savedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async getSavedCookbooks(userId: string): Promise<SavedCookbookDoc[]> {
    const firestore = requireDb();
    const savedRef = collection(firestore, 'users', userId, 'savedCookbooks');
    const snapshot = await getDocs(savedRef);
    const cookbooks = snapshot.docs.map(mapSavedCookbookDoc);
    return cookbooks.sort((a, b) => toSortableTime(b.savedAt) - toSortableTime(a.savedAt));
  },

  async removeSavedCookbook(userId: string, savedId: string): Promise<void> {
    const firestore = requireDb();
    const savedRef = doc(firestore, 'users', userId, 'savedCookbooks', savedId);
    await deleteDoc(savedRef);
  },
};

export default cookbookStore;
