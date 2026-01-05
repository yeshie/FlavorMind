// src/services/api/cookbook.service.ts
import apiClient, { ApiResponse } from './client';
import { Recipe } from './recipe.service';

export interface SavedRecipe {
  id: string;
  title: string;
  category: string;
  savedAt: string;
}

class CookbookService {
  /**
   * Get saved recipes
   */
  async getSavedRecipes(page = 1, limit = 10, category?: string): Promise<ApiResponse<{
    recipes: SavedRecipe[];
    pagination: any;
  }>> {
    const response = await apiClient.get('/cookbook', {
      params: { page, limit, category }
    });
    return response.data;
  }

  /**
   * Save recipe to cookbook
   */
  async saveRecipe(recipeId: string, category?: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/cookbook/${recipeId}`, { category });
    return response.data;
  }

  /**
   * Remove recipe from cookbook
   */
  async removeRecipe(recipeId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/cookbook/${recipeId}`);
    return response.data;
  }

  /**
   * Organize cookbook
   */
  async organizeCookbook(categories: string[]): Promise<ApiResponse> {
    const response = await apiClient.put('/cookbook/organize', { categories });
    return response.data;
  }
}

export default new CookbookService();