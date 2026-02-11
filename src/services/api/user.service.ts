// src/services/api/user.service.ts
import apiClient, { ApiResponse } from './client';

export interface UserProfile {
  id?: string;
  uid?: string;
  name?: string;
  displayName?: string;
  email?: string;
  photoUrl?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  location?: {
    city?: string;
    country?: string;
  };
  preferences?: {
    cuisines?: string[];
    diet?: string[];
    allergies?: string[];
    spiceLevel?: string;
    cookingSkill?: string;
    favoriteIngredients?: string[];
    dislikedIngredients?: string[];
  };
}

class UserService {
  async getProfile(): Promise<ApiResponse<{ user: UserProfile }>> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
}

export default new UserService();
