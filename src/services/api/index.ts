// src/services/api/index.ts
export { default as apiClient } from './client';
export { default as recipeService } from './recipe.service';
export { default as memoryService } from './memory.service';
export { default as cookbookService } from './cookbook.service';
export { default as feedbackService } from './feedback.service';

export type { ApiResponse, ApiError } from './client';
export type { Recipe, Ingredient, Instruction, RecipesQuery } from './recipe.service';
export type { FoodMemory, CreateMemoryData } from './memory.service';
export type { SavedRecipe } from './cookbook.service';
export type { Feedback, SubmitFeedbackData } from './feedback.service';