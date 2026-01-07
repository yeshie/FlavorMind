// src/navigation/BottomTabNavigator.tsx - PASTEL ORANGE
import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { moderateScale, scaleFontSize } from '../common/utils/responsive';
import MemoryScreen from '../features/memory/screens/MemoryScreen';


// Screens
import HomeScreen from '../features/home/screens/HomeScreen';
import ProfileSettingsScreen from '../features/profile/screens/ProfileSettingsScreen';



const CreateScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Create Recipe Screen</Text>
  </View>
);

const SearchScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Search Recipes Screen</Text>
  </View>
);

const LibraryScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Saved Recipe Library Screen</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.pastelOrange.dark,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          height: moderateScale(70),
          paddingBottom: moderateScale(SPACING.sm),
          paddingTop: moderateScale(SPACING.sm),
          borderTopWidth: 0,
          backgroundColor: COLORS.background.header, // Pastel Orange
          elevation: 8,
          shadowColor: COLORS.pastelOrange.dark,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          marginTop: moderateScale(2),
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
            case 'Search':
              iconSource = require('../assets/icons/search.png');
              break;
            case 'Library':
              iconSource = require('../assets/icons/book.png');
              break;
            default:
              iconSource = require('../assets/icons/home.png');
          }

          // Special styling for Create button
          if (route.name === 'Create') {
            return (
              <View style={tabStyles.createIconContainer}>
                <Image
                  source={iconSource}
                  style={[tabStyles.createIcon, { tintColor: COLORS.text.white }]}
                  resizeMode="contain"
                />
              </View>
            );
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
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: 'Library' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
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
    transform: [{ scale: 1.05 }],
  },
  icon: {
    width: moderateScale(22),
    height: moderateScale(22),
  },
  createIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: COLORS.pastelOrange.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(-28),
    shadowColor: COLORS.pastelOrange.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createIcon: {
    width: moderateScale(26),
    height: moderateScale(26),
  },
});

export default BottomTabNavigator;