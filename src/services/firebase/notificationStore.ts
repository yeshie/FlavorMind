import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';
import { getFirebaseUser } from './authService';
import feedbackStore from './feedbackStore';
import recipeStore, { FirestoreRecipe } from './recipeStore';
import userService, { UserProfile } from '../api/user.service';
import {
  getRecipeActivity,
  getSearchHistory,
  type RecipeActivityEntry,
  type SearchHistoryEntry,
} from '../storage/asyncStorage';

export type NotificationType = 'comment' | 'approval' | 'recipe' | 'system';
export type NotificationStatus = 'read' | 'unread';
export type NotificationFrequency = 'instant' | 'daily' | 'weekly';

export interface NotificationSettings {
  frequency: NotificationFrequency;
  types: {
    comments: boolean;
    approvals: boolean;
    recommendations: boolean;
    push: boolean;
    sound: boolean;
  };
  privacy: {
    showPreview: boolean;
    showSenderName: boolean;
  };
  doNotDisturbEnabled: boolean;
  doNotDisturbStart: string;
  doNotDisturbEnd: string;
  lastRecommendationSyncAt?: unknown;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatar?: string | null;
  recipeId?: string | null;
  recipeTitle?: string | null;
  recipeImage?: string | null;
  recipe?: Record<string, any> | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface SyncResult {
  notifications: UserNotification[];
  settings: NotificationSettings;
}

const COMMENT_SYNC_WINDOW_DAYS = 45;
const APPROVAL_SYNC_WINDOW_DAYS = 90;
const RECOMMENDATION_SYNC_WINDOW_DAYS = 30;
const MAX_COMMENT_RECIPES = 12;
const MAX_FEEDBACK_PER_RECIPE = 8;
const MAX_RECIPE_NOTIFICATIONS_PER_SYNC = 3;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'best',
  'by',
  'for',
  'from',
  'how',
  'in',
  'my',
  'of',
  'on',
  'or',
  'recipe',
  'recipes',
  'the',
  'to',
  'with',
  'your',
]);
const KNOWN_CUISINES = [
  'sri lankan',
  'indian',
  'italian',
  'chinese',
  'thai',
  'japanese',
  'korean',
  'mexican',
  'mediterranean',
  'american',
  'french',
  'middle eastern',
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  frequency: 'instant',
  types: {
    comments: true,
    approvals: true,
    recommendations: true,
    push: true,
    sound: true,
  },
  privacy: {
    showPreview: true,
    showSenderName: true,
  },
  doNotDisturbEnabled: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  lastRecommendationSyncAt: null,
};

const requireDb = (): Firestore => {
  if (!hasFirebaseConfig || !db) {
    throw new Error(
      'Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* env vars to enable Firebase.'
    );
  }
  return db;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toBoolean = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const normalizeString = (value?: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeTerm = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value?: string | null) =>
  normalizeTerm(value)
    .split(' ')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 1 && !STOP_WORDS.has(entry));

const addScore = (target: Map<string, number>, term: string, score: number) => {
  const normalized = normalizeTerm(term);
  if (!normalized || score <= 0) return;
  target.set(normalized, (target.get(normalized) || 0) + score);
};

const addPhraseAndTokens = (target: Map<string, number>, value: string, score: number) => {
  const normalized = normalizeTerm(value);
  if (!normalized) return;

  addScore(target, normalized, score);
  tokenize(normalized).forEach((token) => addScore(target, token, Math.max(1, score - 1)));
};

const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object') {
    const anyValue = value as { seconds?: number; toMillis?: () => number; toDate?: () => Date };
    if (typeof anyValue.toMillis === 'function') {
      return anyValue.toMillis();
    }
    if (typeof anyValue.toDate === 'function') {
      return anyValue.toDate().getTime();
    }
    if (typeof anyValue.seconds === 'number') {
      return anyValue.seconds * 1000;
    }
  }
  return 0;
};

const isRecentEnough = (value: unknown, days: number) => {
  const millis = toMillis(value);
  if (!millis) return false;
  return Date.now() - millis <= days * 24 * 60 * 60 * 1000;
};

const sanitizeId = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\/#?%]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const mapNotificationDoc = (
  snapshot: QueryDocumentSnapshot<DocumentData>
): UserNotification => {
  const data = snapshot.data() as Omit<UserNotification, 'id'>;
  return { id: snapshot.id, ...data };
};

const mapNotificationSnapshot = (
  snapshot: { id: string; data: () => DocumentData | undefined }
): UserNotification | null => {
  const data = snapshot.data();
  if (!data) return null;
  return {
    id: snapshot.id,
    ...(data as Omit<UserNotification, 'id'>),
  };
};

const buildRecipePreview = (recipe: FirestoreRecipe): Record<string, any> => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description || '',
  imageUrl: recipe.imageUrl || recipe.image || null,
  image: recipe.image || recipe.imageUrl || null,
  ownerId: recipe.ownerId,
  ownerName: recipe.ownerName || null,
  ownerPhotoUrl: recipe.ownerPhotoUrl || null,
  cuisine: recipe.cuisine || '',
  category: recipe.category || '',
  difficulty: recipe.difficulty || '',
  prepTime: recipe.prepTime ?? 0,
  cookTime: recipe.cookTime ?? 0,
  servings: recipe.servings ?? 1,
  ingredients: recipe.ingredients || [],
  instructions: recipe.instructions || [],
  publishStatus: recipe.publishStatus || 'approved',
  source: recipe.source || 'user',
});

const getUserDocRef = (firestore: Firestore, userId: string) =>
  doc(firestore, 'users', userId);

const getNotificationsRef = (firestore: Firestore, userId: string) =>
  collection(firestore, 'users', userId, 'notifications');

const parseSettings = (value: unknown): NotificationSettings => {
  if (!isRecord(value)) {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  const rawTypes = isRecord(value.types) ? value.types : {};
  const rawPrivacy = isRecord(value.privacy) ? value.privacy : {};
  const frequency = normalizeString(value.frequency);

  return {
    frequency:
      frequency === 'daily' || frequency === 'weekly' || frequency === 'instant'
        ? frequency
        : DEFAULT_NOTIFICATION_SETTINGS.frequency,
    types: {
      comments: toBoolean(rawTypes.comments, DEFAULT_NOTIFICATION_SETTINGS.types.comments),
      approvals: toBoolean(rawTypes.approvals, DEFAULT_NOTIFICATION_SETTINGS.types.approvals),
      recommendations: toBoolean(
        rawTypes.recommendations,
        DEFAULT_NOTIFICATION_SETTINGS.types.recommendations
      ),
      push: toBoolean(rawTypes.push, DEFAULT_NOTIFICATION_SETTINGS.types.push),
      sound: toBoolean(rawTypes.sound, DEFAULT_NOTIFICATION_SETTINGS.types.sound),
    },
    privacy: {
      showPreview: toBoolean(
        rawPrivacy.showPreview,
        DEFAULT_NOTIFICATION_SETTINGS.privacy.showPreview
      ),
      showSenderName: toBoolean(
        rawPrivacy.showSenderName,
        DEFAULT_NOTIFICATION_SETTINGS.privacy.showSenderName
      ),
    },
    doNotDisturbEnabled: toBoolean(
      value.doNotDisturbEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.doNotDisturbEnabled
    ),
    doNotDisturbStart:
      normalizeString(value.doNotDisturbStart) || DEFAULT_NOTIFICATION_SETTINGS.doNotDisturbStart,
    doNotDisturbEnd:
      normalizeString(value.doNotDisturbEnd) || DEFAULT_NOTIFICATION_SETTINGS.doNotDisturbEnd,
    lastRecommendationSyncAt:
      (value as { lastRecommendationSyncAt?: unknown }).lastRecommendationSyncAt || null,
  };
};

const getRecommendationSyncIntervalMs = (frequency: NotificationFrequency) => {
  if (frequency === 'daily') return 24 * 60 * 60 * 1000;
  if (frequency === 'weekly') return 7 * 24 * 60 * 60 * 1000;
  return 0;
};

const isRecommendationSyncDue = (settings: NotificationSettings) => {
  const interval = getRecommendationSyncIntervalMs(settings.frequency);
  if (interval === 0) return true;
  const lastRun = toMillis(settings.lastRecommendationSyncAt);
  if (!lastRun) return true;
  return Date.now() - lastRun >= interval;
};

const buildTasteSignals = (
  profile: UserProfile | null | undefined,
  searchHistory: SearchHistoryEntry[],
  activityHistory: RecipeActivityEntry[]
) => {
  const keywordScores = new Map<string, number>();
  const cuisineScores = new Map<string, number>();
  const ingredientScores = new Map<string, number>();
  const negativeTerms = new Map<string, number>();

  profile?.preferences?.cuisines?.forEach((cuisine) => {
    addScore(cuisineScores, cuisine, 7);
    addPhraseAndTokens(keywordScores, cuisine, 5);
  });

  profile?.preferences?.favoriteIngredients?.forEach((ingredient) => {
    addScore(ingredientScores, ingredient, 8);
    addPhraseAndTokens(keywordScores, ingredient, 5);
  });

  profile?.preferences?.diet?.forEach((diet) => {
    addPhraseAndTokens(keywordScores, diet, 4);
  });

  profile?.preferences?.dislikedIngredients?.forEach((ingredient) => {
    addScore(negativeTerms, ingredient, 10);
  });

  profile?.preferences?.allergies?.forEach((ingredient) => {
    addScore(negativeTerms, ingredient, 12);
  });

  if (profile?.preferences?.spiceLevel) {
    addPhraseAndTokens(keywordScores, profile.preferences.spiceLevel, 4);
  }

  searchHistory.forEach((entry, index) => {
    const weight = Math.max(1, 4 - index * 0.35);
    addPhraseAndTokens(keywordScores, entry.query, weight + 2);
    addPhraseAndTokens(keywordScores, entry.recipeTitle || '', weight + 2);
    KNOWN_CUISINES.forEach((cuisine) => {
      if (normalizeTerm(entry.query).includes(cuisine)) {
        addScore(cuisineScores, cuisine, weight + 2);
      }
    });
  });

  activityHistory.forEach((entry, index) => {
    const baseWeight =
      (entry.actionType === 'cook' ? 6 : entry.actionType === 'save' ? 4 : 2)
      + Math.min(entry.count, 3);
    const weight = baseWeight + Math.max(1, 3 - index * 0.15);

    addPhraseAndTokens(keywordScores, entry.recipeTitle, weight);
    addScore(cuisineScores, entry.cuisine || '', weight);
    entry.ingredients.forEach((ingredient) => addScore(ingredientScores, ingredient, weight));
  });

  return { keywordScores, cuisineScores, ingredientScores, negativeTerms };
};

const hasTasteSignals = (signals: ReturnType<typeof buildTasteSignals>) =>
  signals.keywordScores.size > 0
  || signals.cuisineScores.size > 0
  || signals.ingredientScores.size > 0;

const scoreRecipeForUser = (
  recipe: FirestoreRecipe,
  signals: ReturnType<typeof buildTasteSignals>
) => {
  const recipeText = normalizeTerm(
    [
      recipe.title,
      recipe.description,
      recipe.cuisine,
      recipe.category,
      recipe.difficulty,
    ].join(' ')
  );
  const ingredientText = (recipe.ingredients || [])
    .map((ingredient) => normalizeTerm(ingredient.name))
    .join(' ');
  const combinedText = `${recipeText} ${ingredientText}`.trim();

  if (!combinedText) {
    return 0;
  }

  for (const [term] of signals.negativeTerms.entries()) {
    if (combinedText.includes(term)) {
      return 0;
    }
  }

  let score = 0;
  let matches = 0;

  signals.cuisineScores.forEach((weight, term) => {
    if (recipeText.includes(term)) {
      score += weight * 2;
      matches += 1;
    }
  });

  signals.ingredientScores.forEach((weight, term) => {
    if (ingredientText.includes(term) || recipeText.includes(term)) {
      score += weight;
      matches += 1;
    }
  });

  [...signals.keywordScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 16)
    .forEach(([term, weight]) => {
      if (combinedText.includes(term)) {
        score += weight;
        matches += 1;
      }
    });

  return matches > 0 ? score : 0;
};

const getCurrentUserId = () => getFirebaseUser()?.uid || null;

const getUserNotificationSettings = async (
  firestore: Firestore,
  userId: string
): Promise<NotificationSettings> => {
  const userRef = getUserDocRef(firestore, userId);
  const snapshot = await getDoc(userRef);
  const settings = snapshot.data()?.notificationSettings;
  return parseSettings(settings);
};

const saveUserNotificationSettings = async (
  firestore: Firestore,
  userId: string,
  settings: NotificationSettings
) => {
  const userRef = getUserDocRef(firestore, userId);
  await setDoc(
    userRef,
    {
      notificationSettings: settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

const createNotificationIfMissing = async (
  firestore: Firestore,
  userId: string,
  notificationId: string,
  payload: Omit<UserNotification, 'id' | 'userId' | 'status' | 'updatedAt'>
) => {
  const notificationRef = doc(
    firestore,
    'users',
    userId,
    'notifications',
    sanitizeId(notificationId)
  );
  const snapshot = await getDoc(notificationRef);
  if (snapshot.exists()) {
    return;
  }

  await setDoc(notificationRef, {
    ...payload,
    userId,
    status: 'unread',
    updatedAt: serverTimestamp(),
    createdAt: payload.createdAt || serverTimestamp(),
  });
};

const loadCurrentProfile = async (providedProfile?: UserProfile | null) => {
  if (providedProfile) {
    return providedProfile;
  }

  try {
    const response = await userService.getProfile();
    return response.data?.user || null;
  } catch (error) {
    console.warn('Profile load for notifications failed:', error);
    return null;
  }
};

const syncCurrentUserProfile = async (
  firestore: Firestore,
  userId: string,
  profile?: UserProfile | null
) => {
  const firebaseUser = getFirebaseUser();
  const resolvedProfile = await loadCurrentProfile(profile);

  await setDoc(
    getUserDocRef(firestore, userId),
    {
      displayName:
        resolvedProfile?.displayName
        || resolvedProfile?.name
        || firebaseUser?.displayName
        || firebaseUser?.email?.split('@')[0]
        || 'User',
      photoURL:
        resolvedProfile?.photoUrl
        || resolvedProfile?.photoURL
        || firebaseUser?.photoURL
        || null,
      email: resolvedProfile?.email || firebaseUser?.email || null,
      profileSnapshot: {
        location: resolvedProfile?.location || null,
        preferences: resolvedProfile?.preferences || null,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return resolvedProfile;
};

const syncCommentNotifications = async (
  firestore: Firestore,
  userId: string,
  recipes: FirestoreRecipe[]
) => {
  const commentableRecipes = recipes
    .filter((recipe) => recipe.ownerId === userId && Number(recipe.feedbackCount || 0) > 0)
    .slice(0, MAX_COMMENT_RECIPES);

  const feedbackResults = await Promise.allSettled(
    commentableRecipes.map((recipe) => feedbackStore.getRecipeFeedback(recipe.id, MAX_FEEDBACK_PER_RECIPE))
  );

  for (let index = 0; index < feedbackResults.length; index += 1) {
    const result = feedbackResults[index];
    if (result.status !== 'fulfilled') {
      continue;
    }

    const recipe = commentableRecipes[index];
    for (const feedback of result.value) {
      const commentPreview = normalizeString(feedback.publicComment || feedback.comment);
      if (!commentPreview || feedback.userId === userId) {
        continue;
      }
      if (!isRecentEnough(feedback.createdAt, COMMENT_SYNC_WINDOW_DAYS)) {
        continue;
      }

      await createNotificationIfMissing(
        firestore,
        userId,
        `comment-${recipe.id}-${feedback.id}`,
        {
          type: 'comment',
          title: `New comment on ${recipe.title}`,
          message: `${feedback.userName || 'A user'} commented: ${commentPreview}`,
          actorId: feedback.userId,
          actorName: feedback.userName || 'User',
          actorAvatar: feedback.userAvatar || null,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          recipeImage: recipe.imageUrl || recipe.image || null,
          recipe: buildRecipePreview(recipe),
          createdAt: feedback.createdAt,
        }
      );
    }
  }
};

const syncApprovalNotifications = async (
  firestore: Firestore,
  userId: string,
  recipes: FirestoreRecipe[]
) => {
  const approvedRecipes = recipes.filter(
    (recipe) =>
      recipe.ownerId === userId
      && recipe.source === 'user'
      && recipe.publishStatus === 'approved'
      && isRecentEnough(recipe.updatedAt || recipe.createdAt, APPROVAL_SYNC_WINDOW_DAYS)
  );

  for (const recipe of approvedRecipes) {
    await createNotificationIfMissing(
      firestore,
      userId,
      `approval-${recipe.id}`,
      {
        type: 'approval',
        title: 'Recipe approved',
        message: `${recipe.title} is now approved and visible to the community.`,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeImage: recipe.imageUrl || recipe.image || null,
        recipe: buildRecipePreview(recipe),
        createdAt: recipe.updatedAt || recipe.createdAt,
      }
    );
  }
};

const syncRecommendationNotifications = async (
  firestore: Firestore,
  userId: string,
  settings: NotificationSettings,
  profile: UserProfile | null,
  approvedRecipes: FirestoreRecipe[]
) => {
  if (!settings.types.recommendations || !isRecommendationSyncDue(settings)) {
    return;
  }

  const [searchHistory, activityHistory] = await Promise.allSettled([
    getSearchHistory(),
    getRecipeActivity(),
  ]);

  const signals = buildTasteSignals(
    profile,
    searchHistory.status === 'fulfilled' ? searchHistory.value : [],
    activityHistory.status === 'fulfilled' ? activityHistory.value : []
  );

  if (!hasTasteSignals(signals)) {
    await saveUserNotificationSettings(firestore, userId, {
      ...settings,
      lastRecommendationSyncAt: serverTimestamp(),
    });
    return;
  }

  const rankedRecipes = approvedRecipes
    .filter(
      (recipe) =>
        recipe.ownerId !== userId
        && recipe.source === 'user'
        && recipe.publishStatus === 'approved'
        && isRecentEnough(recipe.updatedAt || recipe.createdAt, RECOMMENDATION_SYNC_WINDOW_DAYS)
    )
    .map((recipe) => ({
      recipe,
      score: scoreRecipeForUser(recipe, signals),
      recency: toMillis(recipe.updatedAt || recipe.createdAt),
    }))
    .filter((entry) => entry.score >= 8)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.recency - left.recency;
    })
    .slice(0, MAX_RECIPE_NOTIFICATIONS_PER_SYNC);

  for (const entry of rankedRecipes) {
    await createNotificationIfMissing(
      firestore,
      userId,
      `recipe-${entry.recipe.id}`,
      {
        type: 'recipe',
        title: 'New recipe for you',
        message: `${entry.recipe.title} matches your recent tastes and cooking preferences.`,
        actorId: entry.recipe.ownerId,
        actorName: entry.recipe.ownerName || null,
        actorAvatar: entry.recipe.ownerPhotoUrl || null,
        recipeId: entry.recipe.id,
        recipeTitle: entry.recipe.title,
        recipeImage: entry.recipe.imageUrl || entry.recipe.image || null,
        recipe: buildRecipePreview(entry.recipe),
        createdAt: entry.recipe.updatedAt || entry.recipe.createdAt,
      }
    );
  }

  await saveUserNotificationSettings(firestore, userId, {
    ...settings,
    lastRecommendationSyncAt: serverTimestamp(),
  });
};

const notificationStore = {
  async getCurrentUserNotificationSettings(): Promise<NotificationSettings> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
    return getUserNotificationSettings(firestore, userId);
  },

  async saveCurrentUserNotificationSettings(
    partial: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not signed in');
    }

    const current = await getUserNotificationSettings(firestore, userId);
    const nextSettings: NotificationSettings = {
      ...current,
      ...partial,
      types: {
        ...current.types,
        ...(partial.types || {}),
      },
      privacy: {
        ...current.privacy,
        ...(partial.privacy || {}),
      },
      doNotDisturbEnabled:
        typeof partial.doNotDisturbEnabled === 'boolean'
          ? partial.doNotDisturbEnabled
          : current.doNotDisturbEnabled,
      doNotDisturbStart: partial.doNotDisturbStart || current.doNotDisturbStart,
      doNotDisturbEnd: partial.doNotDisturbEnd || current.doNotDisturbEnd,
      frequency: partial.frequency || current.frequency,
      lastRecommendationSyncAt:
        partial.lastRecommendationSyncAt !== undefined
          ? partial.lastRecommendationSyncAt
          : current.lastRecommendationSyncAt,
    };

    await saveUserNotificationSettings(firestore, userId, nextSettings);
    return nextSettings;
  },

  async getCurrentUserNotifications(maxCount = 50): Promise<UserNotification[]> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) {
      return [];
    }

    const notificationsRef = getNotificationsRef(firestore, userId);
    const snapshot = await getDocs(
      query(notificationsRef, orderBy('createdAt', 'desc'), limit(maxCount))
    );
    return snapshot.docs.map(mapNotificationDoc);
  },

  async syncNotificationsForCurrentUser(profile?: UserProfile | null): Promise<SyncResult> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) {
      return {
        notifications: [],
        settings: DEFAULT_NOTIFICATION_SETTINGS,
      };
    }

    const [settings, syncedProfile, recipes, approvedRecipes] = await Promise.all([
      getUserNotificationSettings(firestore, userId),
      syncCurrentUserProfile(firestore, userId, profile),
      recipeStore.getUserRecipes(userId),
      recipeStore.getApprovedRecipes(),
    ]);

    if (settings.types.comments) {
      await syncCommentNotifications(firestore, userId, recipes);
    }

    if (settings.types.approvals) {
      await syncApprovalNotifications(firestore, userId, recipes);
    }

    await syncRecommendationNotifications(
      firestore,
      userId,
      settings,
      syncedProfile,
      approvedRecipes
    );

    return {
      notifications: await this.getCurrentUserNotifications(),
      settings: await getUserNotificationSettings(firestore, userId),
    };
  },

  async markCurrentUserNotificationAsRead(notificationId: string): Promise<void> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) return;

    const notificationRef = doc(firestore, 'users', userId, 'notifications', notificationId);
    const snapshot = await getDoc(notificationRef);
    const current = mapNotificationSnapshot(snapshot);
    if (!current || current.status === 'read') {
      return;
    }

    await updateDoc(notificationRef, {
      status: 'read',
      updatedAt: serverTimestamp(),
    });
  },

  async markAllCurrentUserNotificationsAsRead(): Promise<void> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) return;

    const notifications = await this.getCurrentUserNotifications();
    const unreadNotifications = notifications.filter((notification) => notification.status !== 'read');
    if (!unreadNotifications.length) {
      return;
    }

    const batch = writeBatch(firestore);
    unreadNotifications.forEach((notification) => {
      batch.update(doc(firestore, 'users', userId, 'notifications', notification.id), {
        status: 'read',
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  },

  async deleteCurrentUserNotification(notificationId: string): Promise<void> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) return;

    await deleteDoc(doc(firestore, 'users', userId, 'notifications', notificationId));
  },

  async deleteAllCurrentUserNotifications(): Promise<void> {
    const firestore = requireDb();
    const userId = getCurrentUserId();
    if (!userId) return;

    const notifications = await this.getCurrentUserNotifications();
    if (!notifications.length) {
      return;
    }

    const batch = writeBatch(firestore);
    notifications.forEach((notification) => {
      batch.delete(doc(firestore, 'users', userId, 'notifications', notification.id));
    });
    await batch.commit();
  },
};

export default notificationStore;
