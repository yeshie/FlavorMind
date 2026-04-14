// src/services/api/recipe.service.ts
import apiClient, { ApiResponse } from './client';
import aiClient from './aiClient';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'beverage' | '';
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: Instruction[];
  image?: string;
  imageUrl?: string;
  isLocal?: boolean;
  isLocalIngredients?: boolean;
  isPublished?: boolean;
  publishStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  author?: string;
  authorId?: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhotoUrl?: string | null;
  rating?: number;
  feedbackCount?: number;
  views?: number;
  source?: string;
  sourceLabel?: string;
  externalId?: string;
  isFirebaseRecipe?: boolean;
  isCurrentUserRecipe?: boolean;
  matchScore?: number;
  region?: string;
  style?: string;
  substitutionOptions?: string;
  localSubstitutions?: Array<{
    original?: string;
    substitute?: string;
    reason?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  isLocal?: boolean;
}

export interface Instruction {
  step: number;
  description: string;
  duration?: number;
}

export interface RecipesQuery {
  page?: number;
  limit?: number;
  cuisine?: string;
  category?: string;
  difficulty?: string;
  ownerId?: string;
  published?: boolean;
}

export interface SimilarRecipesQuery {
  category?: string;
  ingredient?: string;
  q?: string;
  limit?: number;
}

export interface LocalAdaptationQuery {
  dishName?: string;
  ingredients?: string | string[];
  limit?: number;
  q?: string;
}

export interface IngredientGuide {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  yield?: string;
  ingredients?: Array<{
    name: string;
    qty?: string;
    unit?: string;
    note?: string;
  }>;
  equipment?: string[];
  steps?: string[];
  tips?: string[];
}

export interface ScaleQueryPayload {
  query?: string;
  ingredient?: string;
  amount?: string | number;
  unit?: string;
  includeRecipes?: boolean;
  recipesLimit?: number;
}

export interface GenerateRecipePayload {
  dish: string;
  servings?: number;
  locale?: string;
}

const KNOWN_UNITS = new Set([
  'g', 'kg', 'mg', 'lb', 'lbs', 'oz', 'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp',
  'teaspoon', 'teaspoons', 'tablespoon', 'tablespoons', 'piece', 'pieces', 'clove',
  'cloves', 'slice', 'slices', 'sprig', 'sprigs', 'can', 'cans', 'pinch', 'dash',
  'packet', 'packets', 'medium', 'large', 'small',
]);

const shouldSkipIngredient = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return !normalized
    || normalized.startsWith('special equipment')
    || normalized.startsWith('equipment:')
    || normalized.startsWith('for serving:')
    || normalized === 'to serve';
};

const splitIntoSentences = (value: string): string[] =>
  (value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((item) => item.trim())
    .filter(Boolean);

const splitIngredientText = (value: string): string[] =>
  value
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*[;|]\s*/))
    .map((line) => line.replace(/^[\-\u2022*]\s*/, '').trim())
    .filter(Boolean)
    .filter((line) => !shouldSkipIngredient(line));

const parseIngredientText = (value: string): Ingredient => {
  const cleaned = value
    .replace(/^[\-\u2022*]\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+for serving$/i, '')
    .trim();

  const trailingMatch = cleaned.match(/^(.+?)\s*[-,:]\s*(\d+(?:[./]\d+)?)\s*([A-Za-z]+)?$/);
  if (trailingMatch) {
    return {
      name: trailingMatch[1].trim(),
      quantity: trailingMatch[2] || '',
      unit: trailingMatch[3] || '',
    };
  }

  const leadingMatch = cleaned.match(/^(\d+(?:[./]\d+)?)\s*([A-Za-z]+)?\s+(.+)$/);
  if (leadingMatch) {
    const parsedUnit = (leadingMatch[2] || '').toLowerCase();
    return {
      quantity: leadingMatch[1] || '',
      unit: parsedUnit && KNOWN_UNITS.has(parsedUnit) ? leadingMatch[2] || '' : '',
      name: parsedUnit && KNOWN_UNITS.has(parsedUnit)
        ? leadingMatch[3].trim()
        : `${leadingMatch[2] || ''} ${leadingMatch[3]}`.trim(),
    };
  }

  return {
    name: cleaned,
    quantity: '',
    unit: '',
  };
};

const normalizeIngredients = (value: any): Ingredient[] => {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? splitIngredientText(value)
      : [];

  return rawItems
    .flatMap((item: any) => {
      if (typeof item === 'string') {
        return splitIngredientText(item).map((entry) => ({ raw: entry }));
      }

      const fallbackText =
        item?.text ||
        item?.raw ||
        item?.label ||
        item?.ingredient ||
        item?.name ||
        '';

      if (
        typeof fallbackText === 'string'
        && !item?.quantity
        && !item?.qty
        && !item?.amount
        && splitIngredientText(fallbackText).length > 1
      ) {
        return splitIngredientText(fallbackText).map((entry) => ({ raw: entry }));
      }

      return [item];
    })
    .map((item: any) => {
      if (typeof item === 'string' || item?.raw) {
        return parseIngredientText(typeof item === 'string' ? item : item.raw);
      }

      const fallbackText =
        item?.text ||
        item?.raw ||
        item?.label ||
        item?.ingredient ||
        item?.name ||
        '';
      const parsed = typeof fallbackText === 'string' ? parseIngredientText(fallbackText) : null;
      const name =
        item?.name ||
        item?.title ||
        item?.ingredientName ||
        parsed?.name ||
        item?.ingredient ||
        'Ingredient';

      return {
        name,
        quantity: item?.quantity ?? item?.qty ?? item?.amount ?? parsed?.quantity ?? '',
        unit: item?.unit ?? parsed?.unit ?? '',
      };
    })
    .filter((item) => item.name && !shouldSkipIngredient(item.name));
};

const splitInstructionText = (value: string): string[] => {
  const normalized = value.replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const lineSplit = normalized
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(step\s*)?\d+[\).\-\:]?\s*/i, '').trim())
    .filter(Boolean);
  if (lineSplit.length > 1) return lineSplit;

  const numberedInline = normalized
    .split(/\s(?=\d+[\).\-\:]\s)/)
    .map((line) => line.replace(/^\s*(step\s*)?\d+[\).\-\:]?\s*/i, '').trim())
    .filter(Boolean);
  if (numberedInline.length > 1) return numberedInline;

  const sentenceSplit = splitIntoSentences(normalized);
  if (sentenceSplit.length >= 3) return sentenceSplit;

  return [normalized];
};

const normalizeInstructions = (value: any): Instruction[] => {
  const rawItems = Array.isArray(value) ? value : typeof value === 'string' ? splitInstructionText(value) : [];

  return rawItems
    .flatMap((item: any) => {
      if (typeof item === 'string') {
        return splitInstructionText(item);
      }
      return splitInstructionText(item?.description || item?.instruction || item?.text || '');
    })
    .filter(Boolean)
    .map((description, index) => ({
      step: index + 1,
      description,
    }));
};

const resolveRecipeImage = (recipe: any): string | undefined =>
  recipe?.imageUrl
  || recipe?.image
  || recipe?.image_name
  || recipe?.imageName
  || recipe?.image_filename
  || recipe?.imagefile
  || undefined;

const normalizeRecipe = (recipe: any): Recipe => {
  const image = resolveRecipeImage(recipe);

  return {
    ...recipe,
    id: recipe?.id || recipe?.title || recipe?.name || recipe?.dish || '',
    title: recipe?.title || recipe?.name || recipe?.dish || 'Recipe',
    description: recipe?.description || recipe?.summary || '',
    cuisine: recipe?.cuisine || recipe?.region || '',
    category: recipe?.category || recipe?.style || '',
    difficulty: recipe?.difficulty || 'medium',
    prepTime: Number(recipe?.prepTime ?? recipe?.prep_time ?? 0),
    cookTime: Number(recipe?.cookTime ?? recipe?.cook_time ?? 0),
    servings: Number(recipe?.servings ?? 1),
    ingredients: normalizeIngredients(recipe?.ingredients),
    instructions: normalizeInstructions(recipe?.instructions || recipe?.steps),
    image,
    imageUrl: image,
    ownerId: recipe?.ownerId || recipe?.owner_id || recipe?.authorId,
    ownerName: recipe?.ownerName || recipe?.owner_name || recipe?.author,
    ownerPhotoUrl: recipe?.ownerPhotoUrl || recipe?.owner_photo_url || recipe?.photoUrl || recipe?.photoURL || null,
    rating: Number(recipe?.rating ?? recipe?.ratingAverage ?? recipe?.rating_average ?? 0),
    feedbackCount: Number(
      recipe?.feedbackCount
      ?? recipe?.feedback_count
      ?? recipe?.ratingCount
      ?? recipe?.totalReviews
      ?? recipe?.comments
      ?? 0
    ),
    views: Number(recipe?.views ?? recipe?.viewCount ?? recipe?.view_count ?? 0),
    source: recipe?.source,
    sourceLabel: recipe?.sourceLabel,
    externalId: recipe?.externalId || recipe?.external_id,
    isFirebaseRecipe: Boolean(recipe?.isFirebaseRecipe),
    isCurrentUserRecipe: Boolean(recipe?.isCurrentUserRecipe),
    substitutionOptions: recipe?.substitutionOptions || recipe?.substitution_options || '',
    localSubstitutions: Array.isArray(recipe?.localSubstitutions)
      ? recipe.localSubstitutions
      : Array.isArray(recipe?.local_substitutions)
        ? recipe.local_substitutions
        : [],
  };
};

const normalizeRecipeList = (items: any[] = []): Recipe[] => items.map(normalizeRecipe);

class RecipeService {
  /**
   * Get all recipes with optional filters
   */
  async getRecipes(query?: RecipesQuery): Promise<ApiResponse<{
    recipes: Recipe[];
    pagination: any;
  }>> {
    const response = await apiClient.get('/recipes', { params: query });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        recipes: normalizeRecipeList(response.data.data?.recipes || []),
      },
    };
  }

  /**
   * Get single recipe by ID
   */
  async getRecipe(id: string): Promise<ApiResponse<{
    data: Recipe; recipe: Recipe
}>> {
    const response = await apiClient.get(`/recipes/${id}`);
    const normalized = normalizeRecipe(
      response.data.data?.recipe || response.data.data?.data || response.data.data
    );
    return {
      ...response.data,
      data: {
        ...response.data.data,
        recipe: normalized,
        data: normalized,
      },
    };
  }

  /**
   * Create new recipe
   */
  async createRecipe(recipeData: Partial<Recipe>): Promise<ApiResponse<{ recipe: Recipe }>> {
    const response = await apiClient.post('/recipes', recipeData);
    return response.data;
  }

  /**
   * Upload recipe image
   */
  async uploadRecipeImage(file: {
    uri: string;
    name: string;
    type: string;
  }): Promise<ApiResponse<{ imageId: string; imageUrl: string; storagePath: string }>> {
    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post('/recipes/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  }

  /**
   * Update recipe
   */
  async updateRecipe(id: string, recipeData: Partial<Recipe>): Promise<ApiResponse<{ recipe: Recipe }>> {
    const response = await apiClient.put(`/recipes/${id}`, recipeData);
    return response.data;
  }

  /**
   * Delete recipe
   */
  async deleteRecipe(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/recipes/${id}`);
    return response.data;
  }

  /**
   * Scale recipe servings
   */
  async scaleRecipe(id: string, servings: number): Promise<ApiResponse> {
    const response = await apiClient.post(`/recipes/${id}/scale`, { servings });
    return response.data;
  }

  /**
   * Search recipes
   */
  async searchRecipes(query: string): Promise<ApiResponse<{ recipes: Recipe[]; intent?: string; adaptations?: any[] }>> {
    const response = await apiClient.get('/recipes/search', { params: { q: query } });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        recipes: normalizeRecipeList(response.data.data?.recipes || []),
      },
    };
  }

  /**
   * Get similar recipes (AI-assisted)
   */
  async getSimilarRecipes(query?: SimilarRecipesQuery): Promise<ApiResponse<{ recipes: Recipe[] }>> {
    const response = await aiClient.get('/recipes/similar', {
      params: query,
    });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        recipes: normalizeRecipeList(response.data.data?.recipes || []),
      },
    };
  }

  /**
   * Get local ingredient adaptations (AI-assisted)
   */
  async getLocalAdaptations(
    query?: LocalAdaptationQuery
  ): Promise<ApiResponse<{ adaptations: any[] }>> {
    const params = {
      ...query,
      ingredients: Array.isArray(query?.ingredients)
        ? query?.ingredients.join(',')
        : query?.ingredients,
    };
    const response = await apiClient.get('/recipes/local-adapt', {
      params,
      timeout: 60000,
    });
    return response.data;
  }

  /**
   * Scale by ingredient query (AI-assisted)
   */
  async scaleByIngredientQuery(
    payload: ScaleQueryPayload
  ): Promise<ApiResponse<{ scale: any; recipes: Recipe[] }>> {
    const response = await apiClient.post('/recipes/scale-query', payload, {
      timeout: 20000,
    });
    const scale = response.data.data?.scale || null;
    const topLevelRecipes = response.data.data?.recipes || [];
    const nestedRecipes = Array.isArray(scale?.recipes) ? scale.recipes : [];
    const recipes = normalizeRecipeList(
      [...topLevelRecipes, ...nestedRecipes].filter(Boolean)
    ).filter(
      (recipe, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.id === recipe.id
            || (candidate.title === recipe.title && candidate.source === recipe.source)
        ) === index
    );

    return {
      ...response.data,
      data: {
        ...response.data.data,
        scale: scale && Array.isArray(scale.recipes)
          ? {
              ...scale,
              recipes: normalizeRecipeList(scale.recipes),
            }
          : scale,
        recipes,
      },
    };
  }

  /**
   * Generate recipe by dish name (AI-assisted)
   */
  async generateRecipeByDish(
    payload: GenerateRecipePayload
  ): Promise<ApiResponse<{ recipe: Recipe }>> {
    const response = await aiClient.get('/recipes/generate', {
      params: payload,
      timeout: 60000,
    });
    const normalized = normalizeRecipe(
      response.data.data?.recipe || response.data.data
    );
    return {
      ...response.data,
      data: {
        ...response.data.data,
        recipe: normalized,
      },
    };
  }
}

export default new RecipeService();
