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
  isLocal?: boolean;
  author?: string;
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
  async searchRecipes(query: string): Promise<ApiResponse<{ recipes: Recipe[] }>> {
    const response = await apiClient.get('/recipes/search', { params: { q: query } });
    return response.data;
  }
}

export default new RecipeService();