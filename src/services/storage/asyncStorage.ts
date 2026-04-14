import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CookingHistoryFeedbackInput,
  CookingHistorySessionInput,
  type CookingFeedbackTarget,
} from '../../common/utils/cookingHistory';

const SEARCH_HISTORY_KEY = 'search_history';
const RECALL_HISTORY_KEY = 'recall_memory_history';
const RECIPE_ACTIVITY_KEY = 'recipe_activity_history';
const COOKING_HISTORY_KEY = 'cooking_history';
const MAX_HISTORY_ITEMS = 10;
const MAX_RECIPE_ACTIVITY_ITEMS = 40;
const MAX_COOKING_HISTORY_ITEMS = 50;

export interface SearchHistoryEntry {
  query: string;
  recipeId?: string;
  recipeTitle?: string;
  image?: string;
  updatedAt: string;
}

export interface RecallHistoryEntry {
  id: string;
  prompt: string;
  dishName: string;
  recipeId?: string;
  image?: string;
  updatedAt: string;
}

export type RecipeActivityAction = 'view' | 'save' | 'cook';

export interface RecipeActivityEntry {
  id: string;
  actionType: RecipeActivityAction;
  recipeId?: string;
  recipeTitle: string;
  cuisine?: string;
  ingredients: string[];
  count: number;
  updatedAt: string;
}

export interface CookingHistoryEntry {
  id: string;
  dishName: string;
  dishImage?: string;
  recipeId?: string;
  feedbackRecipeId?: string;
  feedbackTarget?: CookingFeedbackTarget;
  servingSize?: number;
  prepTime?: number;
  cookTime?: number;
  totalCookTime?: number;
  rating?: number;
  publicComment?: string;
  changes?: string;
  localImprovements?: string;
  personalTips?: string;
  comment?: string;
  cookedAt: string;
  feedbackSavedAt?: string;
  updatedAt: string;
}

interface SearchSelectionInput {
  query: string;
  recipeId?: string;
  recipeTitle?: string;
  image?: string;
}

interface RecallHistoryInput {
  prompt: string;
  dishName: string;
  recipeId?: string;
  image?: string;
}

interface RecipeActivityInput {
  actionType: RecipeActivityAction;
  recipeId?: string;
  recipeTitle: string;
  cuisine?: string;
  ingredients?: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const toIsoString = (value: unknown): string => {
  const parsed = typeof value === 'string' ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

const toPositiveNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
};

const clampRating = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(5, Math.max(1, Math.round(parsed)));
};

const readJson = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse AsyncStorage value for ${key}`, error);
    return null;
  }
};

const writeJson = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const sortByUpdatedAt = <T extends { updatedAt: string }>(items: T[]) =>
  [...items].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );

const normalizeSearchHistory = (value: unknown): SearchHistoryEntry[] => {
  if (!Array.isArray(value)) return [];

  const next = value
    .map((item): SearchHistoryEntry | null => {
      if (typeof item === 'string') {
        const query = toNonEmptyString(item);
        if (!query) return null;

        return {
          query,
          updatedAt: new Date().toISOString(),
        };
      }

      if (!isRecord(item)) return null;

      const query = toNonEmptyString(item.query);
      if (!query) return null;

      return {
        query,
        recipeId: toNonEmptyString(item.recipeId),
        recipeTitle: toNonEmptyString(item.recipeTitle),
        image: toNonEmptyString(item.image),
        updatedAt: toIsoString(item.updatedAt),
      };
    })
    .filter((item): item is SearchHistoryEntry => Boolean(item));

  const deduped = new Map<string, SearchHistoryEntry>();
  sortByUpdatedAt(next).forEach((item) => {
    const key = item.query.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  });

  return [...deduped.values()].slice(0, MAX_HISTORY_ITEMS);
};

const normalizeRecallHistory = (value: unknown): RecallHistoryEntry[] => {
  if (!Array.isArray(value)) return [];

  const next = value
    .map((item): RecallHistoryEntry | null => {
      if (!isRecord(item)) return null;

      const prompt = toNonEmptyString(item.prompt);
      const dishName = toNonEmptyString(item.dishName);
      if (!prompt || !dishName) return null;

      const recipeId = toNonEmptyString(item.recipeId);

      return {
        id:
          toNonEmptyString(item.id) ||
          `${recipeId || dishName.toLowerCase()}::${prompt.toLowerCase()}`,
        prompt,
        dishName,
        recipeId,
        image: toNonEmptyString(item.image),
        updatedAt: toIsoString(item.updatedAt),
      };
    })
    .filter((item): item is RecallHistoryEntry => Boolean(item));

  const deduped = new Map<string, RecallHistoryEntry>();
  sortByUpdatedAt(next).forEach((item) => {
    const recipeKey = `${item.recipeId || item.dishName}`.toLowerCase();
    const promptKey = item.prompt.toLowerCase();
    const compositeKey = `${recipeKey}::${promptKey}`;
    if (!deduped.has(compositeKey)) {
      deduped.set(compositeKey, item);
    }
  });

  return [...deduped.values()].slice(0, MAX_HISTORY_ITEMS);
};

const normalizeRecipeActivity = (value: unknown): RecipeActivityEntry[] => {
  if (!Array.isArray(value)) return [];

  const next = value
    .map((item): RecipeActivityEntry | null => {
      if (!isRecord(item)) return null;

      const actionType = toNonEmptyString(item.actionType) as RecipeActivityAction | undefined;
      const recipeTitle = toNonEmptyString(item.recipeTitle);
      if (
        !actionType
        || !recipeTitle
        || !['view', 'save', 'cook'].includes(actionType)
      ) {
        return null;
      }

      const recipeId = toNonEmptyString(item.recipeId);
      const id =
        toNonEmptyString(item.id)
        || `${actionType}::${recipeId || recipeTitle.toLowerCase()}`;
      const ingredients = Array.isArray(item.ingredients)
        ? item.ingredients
            .map((entry) => toNonEmptyString(entry))
            .filter((entry): entry is string => Boolean(entry))
        : [];

      return {
        id,
        actionType,
        recipeId,
        recipeTitle,
        cuisine: toNonEmptyString(item.cuisine),
        ingredients,
        count: Math.max(1, Number(item.count ?? 1) || 1),
        updatedAt: toIsoString(item.updatedAt),
      };
    })
    .filter((item): item is RecipeActivityEntry => Boolean(item));

  const deduped = new Map<string, RecipeActivityEntry>();
  sortByUpdatedAt(next).forEach((item) => {
    if (!deduped.has(item.id)) {
      deduped.set(item.id, item);
    }
  });

  return [...deduped.values()].slice(0, MAX_RECIPE_ACTIVITY_ITEMS);
};

const normalizeCookingHistory = (value: unknown): CookingHistoryEntry[] => {
  if (!Array.isArray(value)) return [];

  const next = value
    .map((item): CookingHistoryEntry | null => {
      if (!isRecord(item)) return null;

      const id = toNonEmptyString(item.id);
      const dishName = toNonEmptyString(item.dishName);
      if (!id || !dishName) return null;

      const feedbackTargetValue = toNonEmptyString(item.feedbackTarget);
      const feedbackTarget =
        feedbackTargetValue === 'recipes' || feedbackTargetValue === 'publicRecipes'
          ? feedbackTargetValue
          : undefined;

      return {
        id,
        dishName,
        dishImage: toNonEmptyString(item.dishImage),
        recipeId: toNonEmptyString(item.recipeId),
        feedbackRecipeId: toNonEmptyString(item.feedbackRecipeId),
        feedbackTarget,
        servingSize: toPositiveNumber(item.servingSize),
        prepTime: toPositiveNumber(item.prepTime),
        cookTime: toPositiveNumber(item.cookTime),
        totalCookTime: toPositiveNumber(item.totalCookTime),
        rating: clampRating(item.rating),
        publicComment: toNonEmptyString(item.publicComment),
        changes: toNonEmptyString(item.changes),
        localImprovements: toNonEmptyString(item.localImprovements),
        personalTips: toNonEmptyString(item.personalTips),
        comment: toNonEmptyString(item.comment),
        cookedAt: toIsoString(item.cookedAt),
        feedbackSavedAt: item.feedbackSavedAt ? toIsoString(item.feedbackSavedAt) : undefined,
        updatedAt: toIsoString(item.updatedAt),
      };
    })
    .filter((item): item is CookingHistoryEntry => Boolean(item));

  const deduped = new Map<string, CookingHistoryEntry>();
  sortByUpdatedAt(next).forEach((item) => {
    if (!deduped.has(item.id)) {
      deduped.set(item.id, item);
    }
  });

  return [...deduped.values()].slice(0, MAX_COOKING_HISTORY_ITEMS);
};

export const getSearchHistory = async (): Promise<SearchHistoryEntry[]> => {
  const stored = await readJson<unknown>(SEARCH_HISTORY_KEY);
  return normalizeSearchHistory(stored);
};

export const recordSearchQuery = async (
  queryValue: string
): Promise<SearchHistoryEntry[]> => {
  const query = queryValue.trim();
  if (!query) {
    return getSearchHistory();
  }

  const history = await getSearchHistory();
  const existing = history.find(
    (item) => item.query.toLowerCase() === query.toLowerCase()
  );

  const nextHistory = normalizeSearchHistory([
    {
      ...existing,
      query,
      updatedAt: new Date().toISOString(),
    },
    ...history.filter((item) => item.query.toLowerCase() !== query.toLowerCase()),
  ]);

  await writeJson(SEARCH_HISTORY_KEY, nextHistory);
  return nextHistory;
};

export const recordSearchSelection = async ({
  query: queryValue,
  recipeId,
  recipeTitle,
  image,
}: SearchSelectionInput): Promise<SearchHistoryEntry[]> => {
  const query = queryValue.trim();
  if (!query) {
    return getSearchHistory();
  }

  const history = await getSearchHistory();
  const existing = history.find(
    (item) => item.query.toLowerCase() === query.toLowerCase()
  );

  const nextHistory = normalizeSearchHistory([
    {
      ...existing,
      query,
      recipeId: recipeId?.trim() || existing?.recipeId,
      recipeTitle: recipeTitle?.trim() || existing?.recipeTitle,
      image: image?.trim() || existing?.image,
      updatedAt: new Date().toISOString(),
    },
    ...history.filter((item) => item.query.toLowerCase() !== query.toLowerCase()),
  ]);

  await writeJson(SEARCH_HISTORY_KEY, nextHistory);
  return nextHistory;
};

export const removeSearchHistoryEntry = async (
  queryValue: string
): Promise<SearchHistoryEntry[]> => {
  const query = queryValue.trim().toLowerCase();
  const nextHistory = (await getSearchHistory()).filter(
    (item) => item.query.toLowerCase() !== query
  );

  await writeJson(SEARCH_HISTORY_KEY, nextHistory);
  return nextHistory;
};

export const clearSearchHistory = async () => {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
};

export const getRecallHistory = async (): Promise<RecallHistoryEntry[]> => {
  const stored = await readJson<unknown>(RECALL_HISTORY_KEY);
  return normalizeRecallHistory(stored);
};

export const getRecipeActivity = async (): Promise<RecipeActivityEntry[]> => {
  const stored = await readJson<unknown>(RECIPE_ACTIVITY_KEY);
  return normalizeRecipeActivity(stored);
};

export const getCookingHistory = async (): Promise<CookingHistoryEntry[]> => {
  const stored = await readJson<unknown>(COOKING_HISTORY_KEY);
  return normalizeCookingHistory(stored);
};

export const saveRecallHistoryEntry = async ({
  prompt: promptValue,
  dishName: dishNameValue,
  recipeId,
  image,
}: RecallHistoryInput): Promise<RecallHistoryEntry[]> => {
  const prompt = promptValue.trim();
  const dishName = dishNameValue.trim();
  if (!prompt || !dishName) {
    return getRecallHistory();
  }

  const normalizedRecipeId = recipeId?.trim() || undefined;
  const nextEntry: RecallHistoryEntry = {
    id: `${normalizedRecipeId || dishName.toLowerCase()}::${prompt.toLowerCase()}`,
    prompt,
    dishName,
    recipeId: normalizedRecipeId,
    image: image?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  const history = await getRecallHistory();
  const nextHistory = normalizeRecallHistory([
    nextEntry,
    ...history.filter((item) => item.id !== nextEntry.id),
  ]);

  await writeJson(RECALL_HISTORY_KEY, nextHistory);
  return nextHistory;
};

export const recordRecipeActivity = async ({
  actionType,
  recipeId,
  recipeTitle: recipeTitleValue,
  cuisine,
  ingredients,
}: RecipeActivityInput): Promise<RecipeActivityEntry[]> => {
  const recipeTitle = recipeTitleValue.trim();
  if (!recipeTitle) {
    return getRecipeActivity();
  }

  const normalizedRecipeId = recipeId?.trim() || undefined;
  const normalizedId = `${actionType}::${normalizedRecipeId || recipeTitle.toLowerCase()}`;
  const history = await getRecipeActivity();
  const existing = history.find((item) => item.id === normalizedId);

  const nextEntry: RecipeActivityEntry = {
    id: normalizedId,
    actionType,
    recipeId: normalizedRecipeId,
    recipeTitle,
    cuisine: cuisine?.trim() || existing?.cuisine,
    ingredients:
      Array.isArray(ingredients) && ingredients.length > 0
        ? ingredients
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 12)
        : existing?.ingredients || [],
    count: (existing?.count || 0) + 1,
    updatedAt: new Date().toISOString(),
  };

  const nextHistory = normalizeRecipeActivity([
    nextEntry,
    ...history.filter((item) => item.id !== normalizedId),
  ]);

  await writeJson(RECIPE_ACTIVITY_KEY, nextHistory);
  return nextHistory;
};

export const saveCookingHistoryEntry = async ({
  id,
  dishName: dishNameValue,
  dishImage,
  recipeId,
  feedbackRecipeId,
  feedbackTarget,
  servingSize,
  prepTime,
  cookTime,
  totalCookTime,
}: CookingHistorySessionInput): Promise<CookingHistoryEntry[]> => {
  const dishName = dishNameValue.trim();
  if (!id.trim() || !dishName) {
    return getCookingHistory();
  }

  const history = await getCookingHistory();
  const existing = history.find((item) => item.id === id);
  const cookedAt = existing?.cookedAt || new Date().toISOString();

  const nextEntry: CookingHistoryEntry = {
    ...existing,
    id: id.trim(),
    dishName,
    dishImage: dishImage?.trim() || existing?.dishImage,
    recipeId: recipeId?.trim() || existing?.recipeId,
    feedbackRecipeId: feedbackRecipeId?.trim() || existing?.feedbackRecipeId,
    feedbackTarget: feedbackTarget || existing?.feedbackTarget,
    servingSize: toPositiveNumber(servingSize) ?? existing?.servingSize,
    prepTime: toPositiveNumber(prepTime) ?? existing?.prepTime,
    cookTime: toPositiveNumber(cookTime) ?? existing?.cookTime,
    totalCookTime: toPositiveNumber(totalCookTime) ?? existing?.totalCookTime,
    cookedAt,
    updatedAt: new Date().toISOString(),
  };

  const nextHistory = normalizeCookingHistory([
    nextEntry,
    ...history.filter((item) => item.id !== nextEntry.id),
  ]);

  await writeJson(COOKING_HISTORY_KEY, nextHistory);
  return nextHistory;
};

export const updateCookingHistoryFeedback = async ({
  id,
  rating,
  publicComment,
  changes,
  localImprovements,
  personalTips,
  comment,
}: CookingHistoryFeedbackInput): Promise<CookingHistoryEntry[]> => {
  const history = await getCookingHistory();
  const existing = history.find((item) => item.id === id.trim());
  if (!existing) {
    return history;
  }

  const nextEntry: CookingHistoryEntry = {
    ...existing,
    rating: clampRating(rating) ?? existing.rating,
    publicComment: publicComment?.trim() || undefined,
    changes: changes?.trim() || undefined,
    localImprovements: localImprovements?.trim() || undefined,
    personalTips: personalTips?.trim() || undefined,
    comment: comment?.trim() || undefined,
    feedbackSavedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextHistory = normalizeCookingHistory([
    nextEntry,
    ...history.filter((item) => item.id !== nextEntry.id),
  ]);

  await writeJson(COOKING_HISTORY_KEY, nextHistory);
  return nextHistory;
};
