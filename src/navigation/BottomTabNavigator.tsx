// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, TYPOGRAPHY, SPACING, LAYOUT } from '../constants/theme';
import { moderateScale, scaleFontSize } from '../common/utils/responsive';

// Screens
import HomeScreen from '../features/home/screens/HomeScreen';

// Placeholder screens - Replace with actual screens later
const MemoryScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Memory Screen</Text>
  </View>
);

const CreateScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Create Recipe Screen</Text>
  </View>
);

const CookbookScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Cookbook Screen</Text>
  </View>
);

const TrendsScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Trends & Analytics Screen</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary.main,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          height: LAYOUT.bottomTabHeight,
          paddingBottom: moderateScale(SPACING.xs),
          paddingTop: moderateScale(SPACING.xs),
          borderTopWidth: 1,
          borderTopColor: COLORS.border.light,
          backgroundColor: COLORS.background.white,
        },
        tabBarLabelStyle: {
          fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
          fontWeight: TYPOGRAPHY.fontWeight.medium,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconSource;

          switch (route.name) {
            case 'Home':
              iconSource = require('../assets/icons/home.png');
              break;
            case 'Memory':
              iconSource = require('../assets/icons/memory.png');
              break;
            case 'Create':
              iconSource = require('../assets/icons/plus.png');
              break;
            case 'Cookbook':
              iconSource = require('../assets/icons/book.png');
              break;
            case 'Trends':
              iconSource = require('../assets/icons/chart.png');
              break;
            default:
              iconSource = require('../assets/icons/home.png');
          }

          return (
            <View
              style={[
                tabStyles.iconContainer,
                focused && tabStyles.iconContainerActive,
              ]}
            >
              <Image
                source={iconSource}
                style={[
                  tabStyles.icon,
                  { tintColor: color },
                  route.name === 'Create' && tabStyles.createIcon,
                ]}
                resizeMode="contain"
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Memory"
        component={MemoryScreen}
        options={{ tabBarLabel: 'Recall' }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color }) => (
            <View style={tabStyles.createIconContainer}>
              <Image
                source={require('../assets/icons/plus.png')}
                style={[tabStyles.createIcon, { tintColor: COLORS.text.white }]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Cookbook"
        component={CookbookScreen}
        options={{ tabBarLabel: 'Library' }}
      />
      <Tab.Screen
        name="Trends"
        component={TrendsScreen}
        options={{ tabBarLabel: 'Trends' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.main,
  },
  placeholderText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.secondary,
  },
});

const tabStyles = StyleSheet.create({
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  createIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(-20),
    shadowColor: COLORS.primary.main,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
  },
});

export default BottomTabNavigator;