import { useCallback } from 'react';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import { UserProfile } from '../../../services/api/user.service';
import { getFirebaseUser } from '../../../services/firebase/authService';
import { hasFirebaseConfig } from '../../../services/firebase/firebase';
import feedbackStore, { FirestoreFeedback } from '../../../services/firebase/feedbackStore';
import recipeStore, { SavedRecipeDoc } from '../../../services/firebase/recipeStore';
import {
  getRecipeActivity,
  getSearchHistory,
  RecipeActivityEntry,
  SearchHistoryEntry,
} from '../../../services/storage/asyncStorage';

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

const normalizeTerm = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value?: string | null) =>
  normalizeTerm(value)
    .split(' ')
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && !STOP_WORDS.has(item));

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

const addCuisineSignals = (target: Map<string, number>, value: string, score: number) => {
  const normalized = normalizeTerm(value);
  if (!normalized) return;

  KNOWN_CUISINES.forEach((cuisine) => {
    if (normalized.includes(cuisine)) {
      addScore(target, cuisine, score);
    }
  });
};

const buildSearchSignals = (
  history: SearchHistoryEntry[],
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>
) => {
  history.forEach((entry, index) => {
    const recencyWeight = Math.max(1, 4 - index * 0.35);
    addPhraseAndTokens(keywordScores, entry.query, recencyWeight + 1);
    addCuisineSignals(cuisineScores, entry.query, recencyWeight + 1);

    if (entry.recipeTitle) {
      addPhraseAndTokens(keywordScores, entry.recipeTitle, recencyWeight + 2);
      addCuisineSignals(cuisineScores, entry.recipeTitle, recencyWeight + 1);
    }
  });
};

const ACTION_WEIGHTS: Record<RecipeActivityEntry['actionType'], number> = {
  view: 2,
  save: 4,
  cook: 6,
};

const buildActivitySignals = (
  activity: RecipeActivityEntry[],
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>
) => {
  activity.forEach((entry, index) => {
    const baseWeight = ACTION_WEIGHTS[entry.actionType] + Math.min(entry.count, 3);
    const recencyBoost = Math.max(1, 3 - index * 0.15);
    const weight = baseWeight + recencyBoost;

    addPhraseAndTokens(keywordScores, entry.recipeTitle, weight);
    addCuisineSignals(cuisineScores, entry.cuisine || '', weight);
    entry.ingredients.forEach((ingredient) => addPhraseAndTokens(keywordScores, ingredient, Math.max(2, weight - 1)));
  });
};

const buildSavedRecipeSignals = (
  savedRecipes: SavedRecipeDoc[],
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>
) => {
  savedRecipes.forEach((recipe, index) => {
    const weight = Math.max(3, 6 - index * 0.4);
    addPhraseAndTokens(keywordScores, recipe.title, weight);
    addCuisineSignals(cuisineScores, recipe.title, weight);
  });
};

const buildFeedbackSignals = (
  feedback: FirestoreFeedback[],
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>,
  negativeTerms: Map<string, number>
) => {
  feedback.forEach((entry, index) => {
    const recencyWeight = Math.max(1, 5 - index * 0.35);
    const dishName = entry.dishName || entry.comment || entry.publicComment || '';

    if (entry.rating >= 4) {
      addPhraseAndTokens(keywordScores, dishName, recencyWeight + entry.rating);
      addCuisineSignals(cuisineScores, dishName, recencyWeight);
    } else if (entry.rating > 0 && entry.rating <= 2) {
      tokenize(dishName).forEach((term) => addScore(negativeTerms, term, 3));
    }
  });
};

const buildProfileSignals = (
  profile: UserProfile | null | undefined,
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>,
  negativeTerms: Map<string, number>
) => {
  const preferences = profile?.preferences;
  if (!preferences) return;

  preferences.cuisines?.forEach((cuisine) => {
    addScore(cuisineScores, cuisine, 6);
    addPhraseAndTokens(keywordScores, cuisine, 4);
  });

  preferences.favoriteIngredients?.forEach((ingredient) => {
    addPhraseAndTokens(keywordScores, ingredient, 6);
  });

  preferences.diet?.forEach((diet) => {
    addPhraseAndTokens(keywordScores, diet, 5);
  });

  preferences.dislikedIngredients?.forEach((ingredient) => {
    addScore(negativeTerms, ingredient, 8);
  });

  preferences.allergies?.forEach((allergy) => {
    addScore(negativeTerms, allergy, 10);
  });

  if (preferences.spiceLevel) {
    addPhraseAndTokens(keywordScores, preferences.spiceLevel, 4);
  }
};

const hasBehaviorSignals = (
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>,
  negativeTerms: Map<string, number>
) => keywordScores.size > 0 || cuisineScores.size > 0 || negativeTerms.size > 0;

const mergeRecipes = (...lists: Recipe[][]): Recipe[] => {
  const merged = new Map<string, Recipe>();

  lists.flat().forEach((recipe) => {
    const key = normalizeTerm(recipe.id || recipe.title || `${recipe.title}-${recipe.cuisine}`);
    if (!key || merged.has(key)) return;
    merged.set(key, recipe);
  });

  return [...merged.values()];
};

const buildCandidateQuery = (
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>
) => {
  const rankedTerms = [...keywordScores.entries(), ...cuisineScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([term]) => term)
    .filter((term, index, collection) => collection.indexOf(term) === index)
    .slice(0, 5);

  return rankedTerms.join(' ').trim();
};

const scoreRecipe = (
  recipe: Recipe,
  keywordScores: Map<string, number>,
  cuisineScores: Map<string, number>,
  negativeTerms: Map<string, number>
) => {
  const haystack = normalizeTerm([
    recipe.title,
    recipe.description,
    recipe.cuisine,
    recipe.category,
    recipe.ingredients?.map((item) => item.name).join(' '),
  ].join(' '));

  if (!haystack) return 0;

  let score = 0;
  let positiveMatches = 0;

  [...cuisineScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .forEach(([term, value]) => {
      if (haystack.includes(term)) {
        score += value * 2;
        positiveMatches += 1;
      }
    });

  [...keywordScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 18)
    .forEach(([term, value]) => {
      if (haystack.includes(term)) {
        score += value;
        positiveMatches += 1;
      }
    });

  negativeTerms.forEach((penalty, term) => {
    if (haystack.includes(term)) {
      score -= penalty;
    }
  });

  if (positiveMatches === 0 || score <= 0) {
    return 0;
  }

  const ratingBoost = Math.min(3, Number(recipe.rating || 0));
  const viewBoost = Math.min(2, Math.log10((recipe.views || 0) + 1));
  return score + ratingBoost + viewBoost;
};

const applyMatchScores = (recipes: Array<Recipe & { rawScore: number }>): Recipe[] => {
  const maxScore = recipes[0]?.rawScore || 1;
  return recipes.map((recipe, index) => ({
    ...recipe,
    matchScore: Math.min(
      98,
      Math.max(72, Math.round(72 + (recipe.rawScore / maxScore) * 24 - index))
    ),
  }));
};

export interface PersonalizedRecommendationsResult {
  hasSignals: boolean;
  recipes: Recipe[];
}

export const useRecommendations = () => {
  const loadRecommendations = useCallback(
    async (profile?: UserProfile | null): Promise<PersonalizedRecommendationsResult> => {
      const firebaseUser = getFirebaseUser();
      const [searchResult, activityResult, savedRecipesResult, feedbackResult] = await Promise.allSettled([
        getSearchHistory(),
        getRecipeActivity(),
        hasFirebaseConfig && firebaseUser
          ? recipeStore.getSavedRecipes(firebaseUser.uid)
          : Promise.resolve([] as SavedRecipeDoc[]),
        hasFirebaseConfig && firebaseUser
          ? feedbackStore.getUserFeedback(firebaseUser.uid)
          : Promise.resolve([] as FirestoreFeedback[]),
      ]);

      const searchHistory = searchResult.status === 'fulfilled' ? searchResult.value : [];
      const activityHistory = activityResult.status === 'fulfilled' ? activityResult.value : [];
      const savedRecipes = savedRecipesResult.status === 'fulfilled' ? savedRecipesResult.value : [];
      const userFeedback = feedbackResult.status === 'fulfilled' ? feedbackResult.value : [];

      const keywordScores = new Map<string, number>();
      const cuisineScores = new Map<string, number>();
      const negativeTerms = new Map<string, number>();

      buildProfileSignals(profile, keywordScores, cuisineScores, negativeTerms);
      buildSearchSignals(searchHistory, keywordScores, cuisineScores);
      buildActivitySignals(activityHistory, keywordScores, cuisineScores);
      buildSavedRecipeSignals(savedRecipes, keywordScores, cuisineScores);
      buildFeedbackSignals(userFeedback, keywordScores, cuisineScores, negativeTerms);

      const hasSignals = hasBehaviorSignals(keywordScores, cuisineScores, negativeTerms);
      if (!hasSignals) {
        return { hasSignals: false, recipes: [] };
      }

      const candidateQuery = buildCandidateQuery(keywordScores, cuisineScores);
      const [allRecipesResult, similarRecipesResult] = await Promise.allSettled([
        recipeService.getRecipes({ limit: 40 }),
        candidateQuery
          ? recipeService.getSimilarRecipes({ q: candidateQuery, limit: 12 })
          : Promise.resolve({ data: { recipes: [] as Recipe[] } }),
      ]);

      const allRecipes =
        allRecipesResult.status === 'fulfilled'
          ? allRecipesResult.value.data?.recipes || []
          : [];
      const similarRecipes =
        similarRecipesResult.status === 'fulfilled'
          ? similarRecipesResult.value.data?.recipes || []
          : [];

      const rankedRecipes = mergeRecipes(similarRecipes, allRecipes)
        .map((recipe) => ({
          ...recipe,
          rawScore: scoreRecipe(recipe, keywordScores, cuisineScores, negativeTerms),
        }))
        .filter((recipe) => recipe.rawScore > 0)
        .sort((left, right) => right.rawScore - left.rawScore)
        .slice(0, 5);

      return {
        hasSignals,
        recipes: applyMatchScores(rankedRecipes),
      };
    },
    []
  );

  return { loadRecommendations };
};

export default useRecommendations;
