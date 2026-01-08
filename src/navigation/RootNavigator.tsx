import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { isAuthenticated } from '../services/firebase/authService';

// Navigators
import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';

// Auth Screens
import SplashScreen from '../features/auth/screens/SplashScreen';

// Profile Screens
import ProfileSettingsScreen from '../features/profile/screens/ProfileSettingsScreen';
import ChangeEmailScreen from '../features/profile/screens/ChangeEmailScreen';
import ChangePasswordScreen from '../features/profile/screens/ChangePasswordScreen';

// Memory Cooking Flow Screens
import SimilarDishesScreen from '../features/memory/screens/SimilarDishesScreen';
import RecipeCustomizationScreen from '../features/memory/screens/RecipeCustomizationScreen';
import CookingStepsScreen from '../features/memory/screens/CookingStepsScreen';
import CookingTimerScreen from '../features/memory/screens/CookingTimerScreen';
import DoneScreen from '../features/memory/screens/DoneScreen';
import FeedbackScreen from '../features/memory/screens/FeedbackScreen';

// Adaptation Screens
import LocalAdaptationScreen from '../features/adaptation/screens/LocalAdaptationScreen';
import SeasonalFoodScreen from '../features/adaptation/screens/SeasonalFoodScreen';
import AddRecipeScreen from '../features/adaptation/screens/AddRecipeScreen';

type RootStackParamList = {
  MainTabs: undefined;
  ProfileSettings: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  SimilarDishesScreen: { [key: string]: any };
  RecipeCustomization: { [key: string]: any };
  CookingSteps: { [key: string]: any };
  CookingTimer: { [key: string]: any };
  Done: { [key: string]: any };
  Feedback: { [key: string]: any };
  LocalAdaptation: undefined;
  SeasonalFood: { food: any };
  AddRecipe: undefined;
  Auth: undefined;
};

type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authStatus = await isAuthenticated();
      setIsAuth(authStatus);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary.main} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuth ? (
          <>
            {/* Main Tab App */}
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

            {/* Profile Settings Screens */}
            <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
            <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

            {/* Memory-Based Cooking Flow */}
            <Stack.Screen
              name="SimilarDishesScreen"
              component={SimilarDishesScreen as React.ComponentType<any>}
            />
            <Stack.Screen name="RecipeCustomization" component={RecipeCustomizationScreen as React.ComponentType<any>} />
            <Stack.Screen name="CookingSteps" component={CookingStepsScreen as React.ComponentType<any>} />
            <Stack.Screen name="CookingTimer" component={CookingTimerScreen as React.ComponentType<any>} />
            <Stack.Screen name="Done" component={DoneScreen as React.ComponentType<any>} />
            <Stack.Screen name="Feedback" component={FeedbackScreen as React.ComponentType<any>} />

            {/* Adaptation Screens */}
            <Stack.Screen name="LocalAdaptation" component={LocalAdaptationScreen} />
            <Stack.Screen name="SeasonalFood" component={SeasonalFoodScreen} />
            <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
});

export default RootNavigator;