import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';
import { isAuthenticated } from '../services/firebase/authService';
import SimilarDishesScreen from '../features/memory/screens/SimilarDishesScreen';
import RecipeCustomizationScreen from '../features/memory/screens/RecipeCustomizationScreen';



// Navigators
import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';

// Global Screens
import SplashScreen from '../features/auth/screens/SplashScreen';
import ProfileSettingsScreen from '../features/profile/screens/ProfileSettingsScreen';

const Stack = createNativeStackNavigator();

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

            {/* Global Overlay Screens */}
            <Stack.Screen
              name="ProfileSettings"
              component={ProfileSettingsScreen}
            />
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
