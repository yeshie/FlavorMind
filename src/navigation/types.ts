// src/navigation/types.ts
export type RootStackParamList = {
  // Main App
  MainTabs: undefined;

  // Profile Settings
  ProfileSettings: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  EditProfile: undefined;

  // Memory-Based Cooking Flow
  SimilarDishesScreen: {
    memoryQuery: string;
    memoryId?: string;
    similarDishes?: any[];
  };

  RecipeCustomization: {
    dishName: string;
    dishId?: string;
    dishImage?: string;
    memoryQuery?: string;
    recipe?: any;
    autoAdapt?: boolean;
    sourceIngredient?: string;
    feedbackRecipeId?: string;
    feedbackTarget?: 'recipes' | 'publicRecipes';
  };

  CookingSteps: {
    dishName: string;
    dishImage?: string;
    servingSize: number;
    ingredients: any[];
    instructions?: string[];
    actualPrepTime?: number;
    prepTime?: number;
    cookTime?: number;
    totalCookTime?: number;
    recipeId?: string;
    feedbackRecipeId?: string;
    feedbackTarget?: 'recipes' | 'publicRecipes';
  };

  Done: {
    dishName: string;
    dishImage?: string;
    servingSize: number;
    prepTime?: number;
    cookTime?: number;
    totalCookTime?: number;
    recipeId?: string;
    feedbackRecipeId?: string;
    feedbackTarget?: 'recipes' | 'publicRecipes';
    historyId?: string;
  };

  Feedback: {
    dishName: string;
    dishImage?: string;
    servingSize: number;
    prepTime?: number;
    cookTime?: number;
    totalCookTime?: number;
    recipeId?: string;
    feedbackRecipeId?: string;
    feedbackTarget?: 'recipes' | 'publicRecipes';
    historyId?: string;
  };

  // Community Screens
  DigitalCommittee: undefined;
  RecipeDescription: {
    recipeId?: string;
    recipe?: any;
    openComments?: boolean;
  };
  CookbookReference: {
    cookbook: any;
  };
  CookbookIntroduction: {
    cookbookId: string;
  };
  CookbookRecipePage: {
    cookbook: any;
    recipeIndex: number;
  };
  CookbookThankYou: {
    cookbook: any;
  };

  // Cookbook Screens
  DigitalCookbook: undefined;
  PublishedRecipePage: {
    recipe: any;
  };
  DraftRecipePage: {
    recipe: any;
  };
  SelectRecipesPage: undefined;
  CookbookCoverSetup: {
    selectedRecipes: any[];
  };
  CookbookCreationSummary: {
    selectedRecipes: any[];
    coverData: any;
  };
  AddRecipe: {
    recipe?: any;
    isEdit?: boolean;
  };
  AddAdaptation: undefined;

  // Auth
  Auth: undefined;
};

export type TabParamList = {
  Home: undefined;
  Memory: undefined;
  Create: undefined;
  Search: undefined;
  Library: undefined;
};
