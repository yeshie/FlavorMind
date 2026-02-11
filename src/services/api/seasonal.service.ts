// src/services/api/seasonal.service.ts
import apiClient, { ApiResponse } from './client';

export interface SeasonalFood {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  status?: 'high-harvest' | 'low-price' | 'limited';
  badge?: string;
  season?: string;
  availability?: string;
}

export interface SeasonalQuery {
  page?: number;
  limit?: number;
  status?: string;
  lat?: number;
  lng?: number;
  climateZone?: string;
}

class SeasonalService {
  async getSeasonalFoods(query?: SeasonalQuery): Promise<ApiResponse<{
    items: SeasonalFood[];
    pagination: any;
  }>> {
    const response = await apiClient.get('/seasonal', { params: query });
    return response.data;
  }
}

export default new SeasonalService();
