export type RootStackParamList = {
  MainTabs: undefined;
  ProfileSettings: undefined;

  SimilarDishes: {
    memoryQuery: string;
  };

  RecipeCustomization: {
    dishName: string;
    dishId?: string;
    memoryQuery: string;
  };

  CookingSteps: {
    dishName: string;
    servingSize: number;
    ingredients: any[];
  };

  Auth: undefined;
};
