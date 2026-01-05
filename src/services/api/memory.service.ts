// src/services/api/memory.service.ts
import apiClient, { ApiResponse } from './client';

export interface FoodMemory {
  id: string;
  description: string;
  isVoiceInput: boolean;
  context?: any;
  status: 'processing' | 'completed' | 'failed';
  generatedRecipe?: any;
  createdAt: string;
}

export interface CreateMemoryData {
  description: string;
  isVoiceInput?: boolean;
  context?: {
    location?: string;
    occasion?: string;
    preferences?: string[];
  };
}

class MemoryService {
  /**
   * Create new food memory
   */
  async createMemory(data: CreateMemoryData): Promise<ApiResponse<{ memory: FoodMemory }>> {
    const response = await apiClient.post('/memories', data);
    return response.data;
  }

  /**
   * Get user's memories
   */
  async getMemories(page = 1, limit = 10): Promise<ApiResponse<{
    memories: FoodMemory[];
    pagination: any;
  }>> {
    const response = await apiClient.get('/memories', {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Get single memory
   */
  async getMemory(id: string): Promise<ApiResponse<{ memory: FoodMemory }>> {
    const response = await apiClient.get(`/memories/${id}`);
    return response.data;
  }

  /**
   * Delete memory
   */
  async deleteMemory(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/memories/${id}`);
    return response.data;
  }
}

export default new MemoryService();