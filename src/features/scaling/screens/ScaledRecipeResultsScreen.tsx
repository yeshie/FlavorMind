// src/features/scaling/screens/ScaledRecipeResultsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Lightbulb } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import recipeService, { Recipe } from '../../../services/api/recipe.service';

interface ScaledRecipeResultsScreenProps {
  navigation: any;
  route: {
    params: {
      scalingQuery: string;
    };
  };
}

interface ScaledRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  baseIngredient: string;
  baseAmount: string;
  scaledServings: number;
  prepTime: number;
  difficulty: string;
  matchScore: number;
}

const ScaledRecipeResultsScreen: React.FC<ScaledRecipeResultsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { scalingQuery } = route.params;
  const [loading, setLoading] = useState(true);
  const [scaledRecipes, setScaledRecipes] = useState<ScaledRecipe[]>([]);
  const [scaleMeta, setScaleMeta] = useState<{ baseIngredient?: string; baseAmount?: string }>({});

  useEffect(() => {
    const loadScaledRecipes = async () => {
      setLoading(true);
      try {
        const response = await recipeService.scaleByIngredientQuery({
          query: scalingQuery,
          includeRecipes: true,
          recipesLimit: 5,
        });
        const scale = response.data?.scale;
        const recipes = response.data?.recipes || [];
        const base = scale?.inputs?.[0];
        setScaleMeta({
          baseIngredient: base?.name,
          baseAmount: base ? `${base.qty ?? base.quantity ?? ''} ${base.unit || ''}`.trim() : undefined,
        });

        const mapped = (recipes as Recipe[]).map((recipe) => ({
          id: recipe.id,
          name: recipe.title,
          description: recipe.description || 'AI scaled recipe suggestion',
          image: recipe.imageUrl || recipe.image || '',
          baseIngredient: base?.name || 'Ingredient',
          baseAmount: base ? `${base.qty ?? base.quantity ?? ''} ${base.unit || ''}`.trim() : '',
          scaledServings: recipe.servings || 1,
          prepTime: recipe.prepTime || recipe.cookTime || 0,
          difficulty: recipe.difficulty || 'medium',
          matchScore: recipe.matchScore || 85,
        }));

        setScaledRecipes(mapped);
      } catch (error) {
        console.error('Scaled recipes load error:', error);
        setScaledRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    loadScaledRecipes();
  }, [scalingQuery]);

  const handleRecipeSelect = (recipe: ScaledRecipe) => {
    navigation.navigate('RecipeCustomization', {
      dishId: recipe.id,
      dishName: recipe.name,
      scalingQuery: scalingQuery,
      isScaled: true,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return COLORS.pastelGreen.main;
      case 'medium':
        return COLORS.pastelYellow.main;
      case 'hard':
        return COLORS.status.error;
      default:
        return COLORS.text.secondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.pageIntro}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonContent}>
            <ArrowLeft size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scaled Recipes</Text>
      </View>

      {/* Query Display */}
      <View style={styles.queryDisplay}>
        <View style={styles.queryIcon}>
          <Image
            source={require('../../../assets/icons/ruler.png')}
            style={styles.queryIconImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.queryContent}>
          <Text style={styles.queryLabel}>Scaling based on:</Text>
          <Text style={styles.queryText}>
            {scaleMeta.baseAmount && scaleMeta.baseIngredient
              ? `${scaleMeta.baseAmount} ${scaleMeta.baseIngredient}`.trim()
              : scalingQuery}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recipesContainer}>
          {loading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingInlineText}>Finding scaled recipes...</Text>
            </View>
          ) : scaledRecipes.length > 0 ? (
            scaledRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipeSelect(recipe)}
                activeOpacity={0.9}
              >
                {/* Match Score Badge */}
                <View style={styles.matchBadge}>
                  <Text style={styles.matchText}>{recipe.matchScore}% Match</Text>
                </View>

                {/* Recipe Image */}
                <Image
                  source={
                    recipe.image
                      ? { uri: recipe.image }
                      : require('../../../assets/icon.png')
                  }
                  style={styles.recipeImage}
                  resizeMode="cover"
                />

                {/* Recipe Info */}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <Text style={styles.recipeDescription}>{recipe.description}</Text>

                  {/* Scaling Info */}
                  <View style={styles.scalingInfo}>
                    <View style={styles.scalingBadge}>
                      <Image
                        source={require('../../../assets/icons/ruler.png')}
                        style={styles.scalingBadgeIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.scalingBadgeText}>
                        Scaled to {recipe.baseAmount}
                      </Text>
                    </View>
                  </View>

                  {/* Meta Info */}
                  <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                      <Image
                        source={require('../../../assets/icons/clock.png')}
                        style={styles.metaIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.metaText}>{recipe.prepTime} min</Text>
                    </View>

                    <View style={styles.metaItem}>
                      <View
                        style={[
                          styles.difficultyDot,
                          { backgroundColor: getDifficultyColor(recipe.difficulty) },
                        ]}
                      />
                      <Text style={styles.metaText}>
                        {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Text style={styles.metaIconText}>Serves</Text>
                      <Text style={styles.metaText}>
                        {recipe.scaledServings} {recipe.scaledServings === 1 ? 'serving' : 'servings'}
                      </Text>
                    </View>
                  </View>

                  {/* Select Button */}
                  <View style={styles.selectButton}>
                    <View style={styles.selectButtonContent}>
                      <Text style={styles.selectButtonText}>Select & Customize</Text>
                      <ChevronRight size={scaleFontSize(16)} color={COLORS.text.white} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.loadingInline}>
              <Text style={styles.loadingInlineText}>No scaled recipes found yet.</Text>
            </View>
          )}
        </View>

        {/* Help Box */}
        <View style={styles.helpBox}>
          <Lightbulb size={scaleFontSize(24)} color={COLORS.pastelYellow.dark} strokeWidth={2} style={styles.helpIcon} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>All ingredients adjusted</Text>
            <Text style={styles.helpText}>
              These recipes have been automatically scaled to match your ingredient amount. You can further customize serving sizes in the next step!
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>Preparing scaled recipe...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  pageIntro: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.sm),
  },
  backButton: {
    marginBottom: moderateScale(SPACING.md),
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
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
    marginBottom: moderateScale(2),
  },
  headerSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  queryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pastelGreen.light + '30',
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.md),
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelGreen.light,
  },
  queryIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.pastelGreen.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  queryIconImage: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.pastelGreen.dark,
  },
  queryContent: {
    flex: 1,
  },
  queryLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: moderateScale(2),
  },
  queryText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  recipesContainer: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
  },
  recipeCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: moderateScale(SPACING.lg),
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  matchBadge: {
    position: 'absolute',
    top: moderateScale(SPACING.md),
    right: moderateScale(SPACING.md),
    backgroundColor: COLORS.pastelGreen.main,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
    zIndex: 1,
    ...SHADOWS.small,
  },
  matchText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  recipeImage: {
    width: '100%',
    height: moderateScale(200),
  },
  recipeInfo: {
    padding: moderateScale(SPACING.lg),
  },
  recipeName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  recipeDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
    marginBottom: moderateScale(SPACING.md),
  },
  scalingInfo: {
    marginBottom: moderateScale(SPACING.md),
  },
  scalingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pastelOrange.light,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  scalingBadgeIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    tintColor: COLORS.pastelOrange.dark,
    marginRight: moderateScale(SPACING.xs),
  },
  scalingBadgeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.md),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    tintColor: COLORS.text.secondary,
    marginRight: moderateScale(4),
  },
  metaIconText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginRight: moderateScale(4),
  },
  metaText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  difficultyDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(4),
  },
  selectButton: {
    backgroundColor: COLORS.pastelOrange.main,
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
  },
  selectButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.white,
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelYellow.light,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
  },
  helpIcon: {
    marginRight: moderateScale(SPACING.md),
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  helpText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING['2xl']),
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(SPACING.sm),
  },
  loadingInlineText: {
    marginLeft: moderateScale(SPACING.sm),
    color: COLORS.text.secondary,
  },
  loadingText: {
    marginTop: moderateScale(SPACING.md),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default ScaledRecipeResultsScreen;

