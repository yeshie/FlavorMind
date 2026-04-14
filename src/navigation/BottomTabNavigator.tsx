// src/navigation/BottomTabNavigator.tsx - PASTEL ORANGE
import React from 'react';
import { Image, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { moderateScale, scaleFontSize } from '../common/utils/responsive';
import MemoryScreen from '../features/memory/screens/MemoryScreen';
import Header from '../common/components/Header/Header';


// Screens
import HomeScreen from '../features/home/screens/HomeScreen';
import CreateHubScreen from '../features/create/screens/CreateScreen';
import ProfileSettingsScreen from '../features/profile/screens/ProfileSettingsScreen';
import DigitalCookbookScreen from '../features/cookbook/screens/DigitalCookbookScreen';
import ChangeEmailScreen from '../features/profile/screens/ChangeEmailScreen';
import ChangePasswordScreen from '../features/profile/screens/ChangePasswordScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import SimilarDishesScreen from '../features/memory/screens/SimilarDishesScreen';
import RecipeCustomizationScreen from '../features/memory/screens/RecipeCustomizationScreen';
import CookingStepsScreen from '../features/memory/screens/CookingStepsScreen';
import DoneScreen from '../features/memory/screens/DoneScreen';
import FeedbackScreen from '../features/memory/screens/FeedbackScreen';
import LocalAdaptationScreen from '../features/adaptation/screens/LocalAdaptationScreen';
import SeasonalFoodScreen from '../features/adaptation/screens/SeasonalFoodScreen';
import AddRecipeScreen from '../features/adaptation/screens/AddRecipeScreen';
import AddAdaptationScreen from '../features/adaptation/screens/AddAdaptationScreen';
import SmartScalingScreen from '../features/scaling/screens/SmartScalingScreen';
import ScaledRecipeResultsScreen from '../features/scaling/screens/ScaledRecipeResultsScreen';
import SmartScalingSearchResultsScreen from '../features/scaling/screens/SmartScalingSearchResultsScreen';
import DigitalCommitteeScreen from '../features/community/screens/DigitalCommitteeScreen';
import RecipeDescriptionScreen from '../features/community/screens/RecipeDescriptionScreen';
import CookbookReferenceScreen from '../features/community/screens/CookbookReferenceScreen';
import CookbookIntroductionScreen from '../features/community/screens/CookbookIntroductionScreen';
import CookbookRecipePageScreen from '../features/community/screens/CookbookRecipePageScreen';
import CookbookThankYouScreen from '../features/community/screens/CookbookThankYouScreen';
import PublishedRecipePageScreen from '../features/cookbook/screens/PublishedRecipePageScreen';
import DraftRecipePageScreen from '../features/cookbook/screens/DraftRecipePageScreen';
import SelectRecipesPageScreen from '../features/cookbook/screens/SelectRecipesPageScreen';
import CookbookCoverSetupScreen from '../features/cookbook/screens/CookbookCoverSetupScreen';
import CookbookCreationSummaryScreen from '../features/cookbook/screens/CookbookCreationSummaryScreen';
import SearchRecipeScreen from '../features/search/screens/SearchRecipeScreen';
import NotificationScreen from '../features/notifications/screens/NotificationScreen';
import NotificationSettingsScreen from '../features/notifications/screens/NotificationSettingsScreen';



const CreateScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <ScrollView
    style={styles.createScreen}
    contentContainerStyle={styles.createContent}
    showsVerticalScrollIndicator={false}
  >
    <Text style={styles.createEyebrow}>Create</Text>
    <Text style={styles.createTitle}>Start building something new</Text>
    <Text style={styles.createSubtitle}>
      Add recipes, submit local swaps, or build a cookbook from one place.
    </Text>

    <TouchableOpacity
      style={[styles.createCard, styles.createCardPrimary]}
      onPress={() => navigation.navigate('AddRecipe')}
      activeOpacity={0.9}
    >
      <Text style={styles.createCardTitle}>Add Your Own Recipe</Text>
      <Text style={styles.createCardText}>
        Create a recipe, keep it as a draft, or submit it for review.
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.createCard}
      onPress={() => navigation.navigate('SelectRecipesPage')}
      activeOpacity={0.9}
    >
      <Text style={styles.createCardTitle}>Build a Cookbook</Text>
      <Text style={styles.createCardText}>
        Package recipes from your library into a cookbook for community approval.
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.createCard}
      onPress={() => navigation.navigate('AddAdaptation')}
      activeOpacity={0.9}
    >
      <Text style={styles.createCardTitle}>Submit a Local Swap</Text>
      <Text style={styles.createCardText}>
        Suggest a local ingredient replacement for committee review.
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.createCard}
      onPress={() => navigation.navigate('Memory')}
      activeOpacity={0.9}
    >
      <Text style={styles.createCardTitle}>Recall a Dish From Memory</Text>
      <Text style={styles.createCardText}>
        Start the AI-assisted cooking flow when you only remember part of a recipe.
      </Text>
    </TouchableOpacity>
  </ScrollView>
);

const LibraryScreen = DigitalCookbookScreen;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppStackNavigator: React.FC<{ initialRouteName: string }> = ({
  initialRouteName,
}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        header: () => (
          <Header
            onNotificationPress={() => {
              navigation.navigate('Notifications' as never);
            }}
            onProfilePress={() => {
              navigation.navigate('ProfileSettings' as never);
            }}
          />
        ),
      })}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Memory" component={MemoryScreen} />
      <Stack.Screen name="Create" component={CreateHubScreen} />
      <Stack.Screen name="Search" component={SearchRecipeScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen as React.ComponentType<any>}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen as React.ComponentType<any>}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SimilarDishesScreen" component={SimilarDishesScreen as React.ComponentType<any>} />
      <Stack.Screen name="RecipeCustomization" component={RecipeCustomizationScreen as React.ComponentType<any>} />
      <Stack.Screen name="CookingSteps" component={CookingStepsScreen as React.ComponentType<any>} />
      <Stack.Screen name="Done" component={DoneScreen as React.ComponentType<any>} />
      <Stack.Screen name="Feedback" component={FeedbackScreen as React.ComponentType<any>} />
      <Stack.Screen name="LocalAdaptation" component={LocalAdaptationScreen} />
      <Stack.Screen name="SeasonalFood" component={SeasonalFoodScreen} />
      <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
      <Stack.Screen name="AddAdaptation" component={AddAdaptationScreen} />
      <Stack.Screen name="SmartScaling" component={SmartScalingScreen} />
      <Stack.Screen name="ScaledRecipeResults" component={ScaledRecipeResultsScreen as React.ComponentType<any>} />
      <Stack.Screen name="SmartScalingSearchResults" component={SmartScalingSearchResultsScreen as React.ComponentType<any>} />
      <Stack.Screen name="DigitalCommittee" component={DigitalCommitteeScreen} />
      <Stack.Screen name="RecipeDescription" component={RecipeDescriptionScreen as React.ComponentType<any>} />
      <Stack.Screen name="CookbookReference" component={CookbookReferenceScreen as React.ComponentType<any>} />
      <Stack.Screen name="CookbookIntroduction" component={CookbookIntroductionScreen as React.ComponentType<any>} />
      <Stack.Screen name="CookbookRecipePage" component={CookbookRecipePageScreen as React.ComponentType<any>} />
      <Stack.Screen name="CookbookThankYou" component={CookbookThankYouScreen as React.ComponentType<any>} />
      <Stack.Screen name="DigitalCookbook" component={DigitalCookbookScreen as React.ComponentType<any>} />
      <Stack.Screen name="PublishedRecipePage" component={PublishedRecipePageScreen as React.ComponentType<any>} />
      <Stack.Screen name="DraftRecipePage" component={DraftRecipePageScreen as React.ComponentType<any>} />
      <Stack.Screen name="SelectRecipesPage" component={SelectRecipesPageScreen as React.ComponentType<any>} />
      <Stack.Screen name="CookbookCoverSetup" component={CookbookCoverSetupScreen as React.ComponentType<any>} />
      <Stack.Screen name="CookbookCreationSummary" component={CookbookCreationSummaryScreen as React.ComponentType<any>} />
    </Stack.Navigator>
  );
};

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
            case 'HomeTab':
              iconSource = require('../assets/icons/home.png');
              break;
            case 'MemoryTab':
              iconSource = require('../assets/icons/memory.png');
              break;
            case 'CreateTab':
              iconSource = require('../assets/icons/plus.png');
              break;
            case 'SearchTab':
              iconSource = require('../assets/icons/search.png');
              break;
            case 'LibraryTab':
              iconSource = require('../assets/icons/book.png');
              break;
            default:
              iconSource = require('../assets/icons/home.png');
          }

          // Special styling for Create button
          if (route.name === 'CreateTab') {
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
        name="HomeTab"
        options={{ tabBarLabel: 'Home' }}
      >
        {() => <AppStackNavigator initialRouteName="Home" />}
      </Tab.Screen>
      <Tab.Screen
        name="MemoryTab"
        options={{ tabBarLabel: 'Recall' }}
      >
        {() => <AppStackNavigator initialRouteName="Memory" />}
      </Tab.Screen>
      <Tab.Screen
        name="CreateTab"
        options={{
          tabBarLabel: 'Create',
        }}
      >
        {() => <AppStackNavigator initialRouteName="Create" />}
      </Tab.Screen>
      <Tab.Screen
        name="SearchTab"
        options={{ tabBarLabel: 'Search' }}
      >
        {() => <AppStackNavigator initialRouteName="Search" />}
      </Tab.Screen>
      <Tab.Screen
        name="LibraryTab"
        options={{ tabBarLabel: 'Library' }}
      >
        {() => <AppStackNavigator initialRouteName="Library" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  createScreen: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  createContent: {
    padding: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.md),
  },
  createEyebrow: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
  },
  createTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  createSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.sm),
  },
  createCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(SPACING.xl),
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  createCardPrimary: {
    backgroundColor: COLORS.pastelOrange.light,
    borderColor: COLORS.pastelOrange.main,
  },
  createCardTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(SPACING.xs),
  },
  createCardText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
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
