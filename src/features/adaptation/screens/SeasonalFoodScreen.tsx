// src/features/adaptation/screens/SeasonalFoodScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';

interface SeasonalFoodScreenProps {
  navigation: any;
  route: any;
}

interface SuggestedRecipe {
  id: string;
  title: string;
  image: string;
  prepTime: number;
  difficulty: string;
}

const SeasonalFoodScreen: React.FC<SeasonalFoodScreenProps> = ({ navigation, route }) => {
  const { food } = route.params;

  const suggestedRecipes: SuggestedRecipe[] = [
    {
      id: '1',
      title: `${food.name} Curry`,
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
      prepTime: 35,
      difficulty: 'medium',
    },
    {
      id: '2',
      title: `${food.name} Salad`,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      prepTime: 15,
      difficulty: 'easy',
    },
    {
      id: '3',
      title: `${food.name} Pickle`,
      image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400',
      prepTime: 20,
      difficulty: 'easy',
    },
  ];

  const handleRecipePress = (recipe: SuggestedRecipe) => {
    // Navigate to Recipe Ingredient Page (using existing RecipeCustomizationScreen)
    navigation.navigate('RecipeCustomization', {
      dishName: recipe.title,
      dishId: recipe.id,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Food Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: food.image }}
            style={styles.foodImage}
            resizeMode="cover"
          />
          <View style={styles.titleOverlay}>
            <Text style={styles.foodTitle}>{food.name}</Text>
            <View style={styles.availabilityTag}>
              <Text style={styles.availabilityText}>{food.season}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Benefits & Uses</Text>
          <Text style={styles.descriptionText}>
            {food.name} is {food.availability.toLowerCase()} and packed with nutrients.
            It's perfect for traditional dishes and adds a unique flavor to your cooking.
            Available fresh during {food.season.toLowerCase()} season.
          </Text>
        </View>

        {/* Suggested Recipes */}
        <View style={styles.recipesSection}>
          <Text style={styles.sectionTitle}>Suggested Recipes</Text>
          <Text style={styles.sectionSubtitle}>
            Delicious ways to use {food.name} in your cooking
          </Text>

          {suggestedRecipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.recipeCard}
              onPress={() => handleRecipePress(recipe)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: recipe.image }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <View style={styles.recipeMeta}>
                  <Text style={styles.recipeTime}>⏱ {recipe.prepTime} min</Text>
                  <Text style={styles.recipeDifficulty}>
                    {recipe.difficulty === 'easy' ? '🟢' :
                     recipe.difficulty === 'medium' ? '🟡' : '🔴'} {recipe.difficulty}
                  </Text>
                </View>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    backgroundColor: COLORS.background.header,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    ...SHADOWS.small,
  },
  backButton: {
    marginBottom: moderateScale(SPACING.sm),
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: moderateScale(300),
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: moderateScale(SPACING.lg),
  },
  foodTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    marginBottom: moderateScale(SPACING.sm),
  },
  availabilityTag: {
    backgroundColor: COLORS.pastelGreen.main,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  descriptionSection: {
    padding: moderateScale(SPACING.base),
  },
  descriptionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
  },
  descriptionText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
  },
  recipesSection: {
    padding: moderateScale(SPACING.base),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.lg),
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  recipeImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: BORDER_RADIUS.md,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: moderateScale(SPACING.md),
  },
  recipeTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeTime: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginRight: moderateScale(SPACING.md),
  },
  recipeDifficulty: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  arrowIcon: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SeasonalFoodScreen;
