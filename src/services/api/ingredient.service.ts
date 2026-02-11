// src/services/api/ingredient.service.ts
import apiClient, { ApiResponse } from './client';
import { IngredientGuide } from './recipe.service';

export interface IngredientGuideQuery {
  q?: string;
  name?: string;
  slug?: string;
}

export interface CreateAdaptationPayload {
  original: string;
  substitute: string;
  reason?: string;
  guide?: {
    name?: string;
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
  };
}

class IngredientService {
  async getGuide(query: IngredientGuideQuery): Promise<ApiResponse<{ guide: IngredientGuide }>> {
    const response = await apiClient.get('/ingredients/guides', { params: query });
    return response.data;
  }

  async createAdaptation(
    payload: CreateAdaptationPayload
  ): Promise<ApiResponse<{ adaptation: any }>> {
    const response = await apiClient.post('/ingredients/adaptations', payload);
    return response.data;
  }
}

export default new IngredientService();
