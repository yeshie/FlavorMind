// src/features/home/types/home.types.ts

export interface SeasonalItem {
  id: string;
  name: string;
  image: string;
  status: 'high-harvest' | 'low-price' | 'limited';
  badge: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  icon: any; // ImageSourcePropType
  route: string;
}

export interface RecipeRecommendation {
  id: string;
  title: string;
  image: string;
  matchScore: number;
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isLocalIngredients: boolean;
  tags: string[];
}

export interface UserLocation {
  city: string;
  country: string;
}

export interface MemoryQuery {
  text: string;
  isVoice: boolean;
}