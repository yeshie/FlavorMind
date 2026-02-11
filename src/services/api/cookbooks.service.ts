// src/services/api/cookbooks.service.ts
import apiClient, { ApiResponse } from './client';
import { Recipe } from './recipe.service';

export interface Cookbook {
  id: string;
  title: string;
  author?: string;
  authorName?: string;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  introduction?: string;
  occupation?: string;
  aboutAuthor?: string;
  thankYouMessage?: string;
  recipes?: Recipe[];
  recipesCount?: number;
  isPublished?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CookbooksQuery {
  page?: number;
  limit?: number;
  ownerId?: string;
  published?: boolean;
}

export interface CreateCookbookData {
  title: string;
  introduction?: string;
  authorName?: string;
  occupation?: string;
  aboutAuthor?: string;
  thankYouMessage?: string;
  coverImage?: string | null;
  recipes: string[];
  isPublished?: boolean;
}

class CookbooksService {
  async getCookbooks(query?: CookbooksQuery): Promise<ApiResponse<{
    cookbooks: Cookbook[];
    pagination: any;
  }>> {
    const response = await apiClient.get('/cookbooks', { params: query });
    return response.data;
  }

  async getCookbook(id: string): Promise<ApiResponse<{ cookbook: Cookbook }>> {
    const response = await apiClient.get(`/cookbooks/${id}`);
    return response.data;
  }

  async createCookbook(data: CreateCookbookData): Promise<ApiResponse<{ cookbook: Cookbook }>> {
    const response = await apiClient.post('/cookbooks', data);
    return response.data;
  }
}

export default new CookbooksService();
