// src/services/api/feedback.service.ts
import apiClient, { ApiResponse } from './client';

export interface Feedback {
  id: string;
  recipeId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubmitFeedbackData {
  rating: number;
  comment?: string;
}

class FeedbackService {
  /**
   * Submit feedback for recipe
   */
  async submitFeedback(recipeId: string, data: SubmitFeedbackData): Promise<ApiResponse<Feedback>> {
    const response = await apiClient.post(`/feedback/recipes/${recipeId}`, data);
    return response.data;
  }

  /**
   * Get feedback for recipe
   */
  async getRecipeFeedback(recipeId: string, page = 1, limit = 10): Promise<ApiResponse<{
    feedback: Feedback[];
    averageRating: number;
    totalReviews: number;
    pagination: any;
  }>> {
    const response = await apiClient.get(`/feedback/recipes/${recipeId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Update own feedback
   */
  async updateFeedback(feedbackId: string, data: SubmitFeedbackData): Promise<ApiResponse<Feedback>> {
    const response = await apiClient.put(`/feedback/${feedbackId}`, data);
    return response.data;
  }

  /**
   * Delete own feedback
   */
  async deleteFeedback(feedbackId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/feedback/${feedbackId}`);
    return response.data;
  }
}

export default new FeedbackService();