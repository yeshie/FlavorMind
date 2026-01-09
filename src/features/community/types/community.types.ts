// src/features/community/types/community.types.ts

export interface CommunityRecipe {
  id: string;
  title: string;
  creator: string;
  creatorId: string;
  creatorAvatar: string;
  image: string;
  description: string;
  rating: number;
  comments: number;
  views: number;
  category: 'Sweet' | 'Savory' | 'Vegan' | 'Spicy' | 'Traditional' | 'Healthy' | 'Desserts';
  prepTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients?: string[];
  instructions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Cookbook {
  id: string;
  title: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  coverImage: string;
  description?: string;
  rating: number;
  reviewsCount: number;
  recipesCount: number;
  readers: number;
  tags: string[];
  introduction?: string;
  recipes: CookbookRecipe[];
  createdAt: string;
  updatedAt?: string;
  isPremium?: boolean;
  price?: number;
}

export interface CookbookRecipe {
  id: string;
  title: string;
  image: string;
  description: string;
  notes: string[];
  ingredients?: string[];
  instructions?: string[];
  prepTime?: number;
  servings?: number;
}

export interface RecipeComment {
  id: string;
  recipeId: string;
  userId: string;
  userAvatar: string;
  userName: string;
  comment: string;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  recipesCount: number;
  cookbooksCount: number;
  followers: number;
  following: number;
  joinedDate: string;
}

export interface CookbookReview {
  id: string;
  cookbookId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  review: string;
  helpful: number;
  createdAt: string;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  isActive: boolean;
}

export interface SearchResult {
  recipes: CommunityRecipe[];
  cookbooks: Cookbook[];
  users: UserProfile[];
  totalCount: number;
}

// API Request/Response Types
export interface GetRecipesParams {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: 'popular' | 'recent' | 'rating';
  searchQuery?: string;
}

export interface GetCookbooksParams {
  page?: number;
  limit?: number;
  sortBy?: 'popular' | 'recent' | 'rating';
  searchQuery?: string;
}

export interface SubmitRecipeData {
  title: string;
  description: string;
  category: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  difficulty?: string;
  tags?: string[];
}

export interface SubmitCookbookReviewData {
  rating: number;
  review?: string;
}

export interface RecipeInteraction {
  recipeId: string;
  userId: string;
  type: 'view' | 'like' | 'save' | 'recreate' | 'share';
  timestamp: string;
}