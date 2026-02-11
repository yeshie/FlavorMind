// src/features/adaptation/screens/SeasonalFoodScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Circle } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import recipeService, { Recipe } from '../../../services/api/recipe.service';

interface SeasonalFoodScreenProps {
  navigation: any;
  route: any;
}

interface SuggestedRecipe {
  id: string;
  title: string;
  image?: string;
  prepTime: number;
  difficulty: string;
  recipe?: Recipe;
}

const SeasonalFoodScreen: React.FC<SeasonalFoodScreenProps> = ({ navigation, route }) => {
  const { food } = route.params;
  const [suggestedRecipes, setSuggestedRecipes] = useState<SuggestedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  const mapSuggestedRecipe = (recipe: Recipe): SuggestedRecipe => ({
    id: recipe.id || recipe.title || recipe.dish || `${Date.now()}`,
    title: recipe.title || recipe.dish || 'Recipe',
    image: recipe.imageUrl || recipe.image,
    prepTime: recipe.prepTime || recipe.cookTime || 0,
    difficulty: recipe.difficulty || 'medium',
    recipe,
  });

  const loadSuggestedRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      let recipes: Recipe[] = [];
      try {
        const response = await recipeService.getSimilarRecipes({
          ingredient: food?.name,
          category: food?.category,
          q: food?.name,
          limit: 5,
        });
        recipes = response.data.recipes || [];
      } catch (error) {
        console.error('Similar recipes load error:', error);
      }

      if (recipes.length > 0) {
        setSuggestedRecipes(recipes.map(mapSuggestedRecipe));
        return;
      }

      try {
        const generated = await recipeService.generateRecipeByDish({
          dish: food?.name || 'Seasonal recipe',
          servings: 2,
          locale: 'Sri Lanka',
        });
        const recipe = generated.data?.recipe;
        if (recipe) {
          setSuggestedRecipes([mapSuggestedRecipe(recipe)]);
        } else {
          setSuggestedRecipes([]);
        }
      } catch (error) {
        console.error('Recipe generation fallback error:', error);
        setSuggestedRecipes([]);
      }
    } finally {
      setLoadingRecipes(false);
    }
  }, [food?.category, food?.name]);

  const handleRecipePress = (recipe: SuggestedRecipe) => {
    // Navigate to Recipe Ingredient Page (using existing RecipeCustomizationScreen)
    navigation.navigate('RecipeCustomization', {
      dishName: recipe.title,
      dishId: recipe.recipe ? undefined : recipe.id,
      recipe: recipe.recipe,
      autoAdapt: true,
      sourceIngredient: food?.name,
    });
  };

  useEffect(() => {
    loadSuggestedRecipes();
  }, [loadSuggestedRecipes]);

  const seasonLabel = food?.season || food?.badge || 'Seasonal';
  const availabilityLabel = food?.availability || 'Available now';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonContent}>
            <ArrowLeft size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Food Image */}
        <View style={styles.imageContainer}>
          <Image
            source={
              food?.image
                ? { uri: food.image }
                : require('../../../assets/icon.png')
            }
            style={styles.foodImage}
            resizeMode="cover"
          />
          <View style={styles.titleOverlay}>
            <Text style={styles.foodTitle}>{food.name}</Text>
            <View style={styles.availabilityTag}>
              <Text style={styles.availabilityText}>{seasonLabel}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Benefits & Uses</Text>
          <Text style={styles.descriptionText}>
            {food.name} is {availabilityLabel.toLowerCase()} and packed with nutrients.
            It's perfect for traditional dishes and adds a unique flavor to your cooking.
            Available fresh during {seasonLabel.toLowerCase()} season.
          </Text>
        </View>

        {/* Suggested Recipes */}
        <View style={styles.recipesSection}>
          <Text style={styles.sectionTitle}>Suggested Recipes</Text>
          <Text style={styles.sectionSubtitle}>
            Delicious ways to use {food.name} in your cooking
          </Text>

          {loadingRecipes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingText}>Finding recipes...</Text>
            </View>
          ) : suggestedRecipes.length > 0 ? (
            suggestedRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe)}
                activeOpacity={0.9}
              >
                <Image
                  source={
                    recipe.image
                      ? { uri: recipe.image }
                      : require('../../../assets/icon.png')
                  }
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <View style={styles.recipeMeta}>
                    <Text style={styles.recipeTime}>Time {recipe.prepTime} min</Text>
                    <View style={styles.recipeDifficulty}>
                      <Circle
                        size={scaleFontSize(10)}
                        color={getDifficultyColor(recipe.difficulty)}
                        fill={getDifficultyColor(recipe.difficulty)}
                      />
                      <Text style={styles.recipeDifficultyText}>{recipe.difficulty}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.arrowIcon}>
                  <ChevronRight size={scaleFontSize(20)} color={COLORS.text.tertiary} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No recipe suggestions yet.</Text>
            </View>
          )}
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
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  recipeDifficultyText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(SPACING.sm),
  },
  loadingText: {
    marginLeft: moderateScale(SPACING.sm),
    color: COLORS.text.secondary,
  },
});

export default SeasonalFoodScreen;
