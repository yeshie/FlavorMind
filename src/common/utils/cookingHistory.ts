export type CookingFeedbackTarget = 'recipes' | 'publicRecipes';

export interface CookingHistorySessionInput {
  id: string;
  dishName: string;
  dishImage?: string;
  recipeId?: string;
  feedbackRecipeId?: string;
  feedbackTarget?: CookingFeedbackTarget;
  servingSize?: number;
  prepTime?: number;
  cookTime?: number;
  totalCookTime?: number;
}

export interface CookingHistoryFeedbackInput {
  id: string;
  rating: number;
  publicComment?: string;
  changes?: string;
  localImprovements?: string;
  personalTips?: string;
  comment?: string;
}

const sanitizeIdPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const createCookingHistoryId = (dishName: string) => {
  const safeDishName = sanitizeIdPart(dishName || 'dish') || 'dish';
  return `cook-${Date.now()}-${safeDishName}`;
};

export const calculateElapsedMinutes = (
  startedAt: number,
  endedAt: number = Date.now()
) => {
  const elapsedMilliseconds = Math.max(0, endedAt - startedAt);
  const elapsedMinutes = Math.round(elapsedMilliseconds / 60000);
  return Math.max(1, elapsedMinutes);
};
