// src/services/api/recipe.service.ts
import apiClient, { ApiResponse } from './client';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'beverage';
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
  author?: string;
  authorId?: string;
  matchScore?: number;
  region?: string;
  style?: string;
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

class RecipeService {
  /**
   * Get all recipes with optional filters
   */
  async getRecipes(query?: RecipesQuery): Promise<ApiResponse<{
    recipes: Recipe[];
    pagination: any;
  }>> {
    const response = await apiClient.get('/recipes', { params: query });
    return response.data;
  }

  /**
   * Get single recipe by ID
   */
  async getRecipe(id: string): Promise<ApiResponse<{ recipe: Recipe }>> {
    const response = await apiClient.get(`/recipes/${id}`);
    return response.data;
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
    return response.data;
  }

  /**
   * Get similar recipes (AI-assisted)
   */
  async getSimilarRecipes(query?: SimilarRecipesQuery): Promise<ApiResponse<{ recipes: Recipe[] }>> {
    const response = await apiClient.get('/recipes/similar', {
      params: query,
      timeout: 20000,
    });
    return response.data;
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
    return response.data;
  }

  /**
   * Generate recipe by dish name (AI-assisted)
   */
  async generateRecipeByDish(
    payload: GenerateRecipePayload
  ): Promise<ApiResponse<{ recipe: Recipe }>> {
    const response = await apiClient.get('/recipes/generate', {
      params: payload,
      timeout: 60000,
    });
    return response.data;
  }
}

export default new RecipeService();
