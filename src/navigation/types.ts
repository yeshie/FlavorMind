// src/navigation/types.ts
export type RootStackParamList = {
  // Main App
  MainTabs: undefined;
  
  // Profile Settings
  ProfileSettings: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;

  // Memory-Based Cooking Flow
  SimilarDishes: {
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