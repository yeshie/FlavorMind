// src/navigation/types.ts
export type RootStackParamList = {
  // Main App
  MainTabs: undefined;

  // Profile Settings
  ProfileSettings: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;

  // Memory-Based Cooking Flow
  SimilarDishesScreen: {
    memoryQuery: string;
  };

  RecipeCustomization: {
    dishName: string;
    dishId?: string;
    memoryQuery?: string;
  };

  CookingSteps: {
    dishName: string;
    servingSize: number;
    ingredients: any[];
  };

  CookingTimer: {
    dishName: string;
    totalCookTime: number;
    servingSize: number;
  };

  Done: {
    dishName: string;
    servingSize: number;
  };

  Feedback: {
    dishName: string;
    servingSize: number;
  };

  // Community Screens
  DigitalCommittee: undefined;
  RecipeDescription: {
    recipeId: string;
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