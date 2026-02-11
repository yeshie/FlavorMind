// src/services/api/cookbookDashboard.service.ts
import apiClient, { ApiResponse } from './client';

export interface CookbookDashboardRecipe {
  id: string;
  title?: string;
  dishName?: string;
  image?: string;
  imageUrl?: string;
  creator?: string;
  author?: string;
  rating?: number;
  feedbackCount?: number;
  isPublished?: boolean;
}

export interface CookbookDashboardCookbook {
  id: string;
  title: string;
  coverImage?: string;
  coverImageUrl?: string;
  recipeCount?: number;
  recipesCount?: number;
  isPublished?: boolean;
}

export interface CookbookDashboardData {
  savedRecipes?: CookbookDashboardRecipe[];
  publishedRecipes?: CookbookDashboardRecipe[];
  draftRecipes?: CookbookDashboardRecipe[];
  publishedCookbooks?: CookbookDashboardCookbook[];
  savedCookbooks?: CookbookDashboardCookbook[];
}

class CookbookDashboardService {
  async getDashboard(): Promise<ApiResponse<CookbookDashboardData>> {
    const response = await apiClient.get('/my-cookbook');
    return response.data;
  }
}

export default new CookbookDashboardService();
