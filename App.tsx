// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { COLORS } from './src/constants/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor={COLORS.background.main} />
        <BottomTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}