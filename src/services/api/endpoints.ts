export const API_ENDPOINTS = {
  recipes: '/recipes',
  recipeSearch: '/recipes/search',
  similarRecipes: '/recipes/similar',
  localAdaptations: '/recipes/local-adapt',
  scaleQuery: '/recipes/scale-query',
  seasonalFoods: '/seasonal',
  ingredientGuides: '/ingredients/guides',
  ingredientAdaptations: '/ingredients/adaptations',
  feedback: '/feedback',
} as const;

export const AI_ENDPOINTS = {
  similarRecipes: '/recipes/similar',
  generateRecipe: '/recipes/generate',
} as const;

export const DOA_ENDPOINTS = {
  seasonalCrops: '/seasonal-crops',
  marketPrices: '/market-prices',
} as const;
