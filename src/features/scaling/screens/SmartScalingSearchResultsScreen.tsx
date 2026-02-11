// src/features/scaling/screens/SmartScalingSearchResultsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
import { ArrowLeft, BookOpen, Search, Sparkles } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import recipeService, { Recipe } from '../../../services/api/recipe.service';

interface SmartScalingSearchResultsScreenProps {
  navigation: any;
  route: {
    params: {
      query: string;
    };
  };
}

interface RecipeCardItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  cuisine?: string;
  category?: string;
  matchScore?: number;
  source: 'library' | 'ai';
}

const SmartScalingSearchResultsScreen: React.FC<SmartScalingSearchResultsScreenProps> = ({
  navigation,
  route,
}) => {
  const query = route.params?.query?.trim() || '';
  const [loading, setLoading] = useState(true);
  const [libraryRecipes, setLibraryRecipes] = useState<RecipeCardItem[]>([]);
  const [aiRecipes, setAiRecipes] = useState<RecipeCardItem[]>([]);
  const [intent, setIntent] = useState<string | undefined>(undefined);
  const [adaptations, setAdaptations] = useState<any[]>([]);
  const [errorText, setErrorText] = useState('');

  const mapRecipeToCard = (recipe: any, source: 'library' | 'ai', index: number): RecipeCardItem => {
    const title = recipe?.title || recipe?.name || recipe?.dish || 'Recipe';
    const description =
      recipe?.description ||
      recipe?.summary ||
      recipe?.note ||
      (source === 'ai' ? 'AI-generated recipe suggestion.' : 'Library recipe suggestion.');

    return {
      id: recipe?.id || `${source}-${title}-${index}`,
      title,
      description,
      image: recipe?.imageUrl || recipe?.image || recipe?.photoUrl || recipe?.photoURL,
      cuisine: recipe?.cuisine || recipe?.region || 'Sri Lankan',
      category: recipe?.category || recipe?.style || 'Recipe',
      matchScore:
        recipe?.matchScore ??
        recipe?.match_score ??
        Math.max(70, 95 - index * 4),
      source,
    };
  };

  const loadResults = async () => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText('');
    try {
      const [searchResult, aiResult] = await Promise.allSettled([
        recipeService.searchRecipes(query),
        recipeService.getSimilarRecipes({ q: query, limit: 6 }),
      ]);

      let libraryMapped: RecipeCardItem[] = [];
      let aiMapped: RecipeCardItem[] = [];

      if (searchResult.status === 'fulfilled') {
        const recipes = searchResult.value.data?.recipes || [];
        setIntent(searchResult.value.data?.intent);
        setAdaptations(searchResult.value.data?.adaptations || []);
        libraryMapped = recipes.map((recipe: Recipe, index: number) =>
          mapRecipeToCard(recipe, 'library', index)
        );
      }

      if (aiResult.status === 'fulfilled') {
        const recipes = aiResult.value.data?.recipes || [];
        aiMapped = recipes.map((recipe: Recipe, index: number) =>
          mapRecipeToCard(recipe, 'ai', index)
        );
      }

      const libraryIds = new Set(libraryMapped.map((item) => item.id));
      const libraryTitles = new Set(
        libraryMapped.map((item) => item.title.toLowerCase())
      );
      const dedupedAi = aiMapped.filter(
        (item) =>
          !libraryIds.has(item.id) &&
          !libraryTitles.has(item.title.toLowerCase())
      );

      setLibraryRecipes(libraryMapped);
      setAiRecipes(dedupedAi);

      if (searchResult.status === 'rejected' && aiResult.status === 'rejected') {
        setErrorText('Could not load recipes. Please try again.');
      }
    } catch (error) {
      console.error('Smart scaling search error:', error);
      setErrorText('Could not load recipes. Please try again.');
      setLibraryRecipes([]);
      setAiRecipes([]);
      setAdaptations([]);
      setIntent(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [query]);

  const handleRecipeSelect = (recipe: RecipeCardItem) => {
    navigation.navigate('RecipeCustomization', {
      dishId: recipe.id,
      dishName: recipe.title,
    });
  };

  const emptyResults = useMemo(
    () =>
      !loading &&
      libraryRecipes.length === 0 &&
      aiRecipes.length === 0 &&
      adaptations.length === 0,
    [loading, libraryRecipes.length, aiRecipes.length, adaptations.length]
  );

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
        <Text style={styles.headerTitle}>Search Results</Text>
      </View>

      {/* Query Display */}
      <View style={styles.queryDisplay}>
        <View style={styles.queryIcon}>
          <Search size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
        </View>
        <View style={styles.queryContent}>
          <Text style={styles.queryLabel}>Results for</Text>
          <Text style={styles.queryText}>{query || 'Your search'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingInlineText}>Searching recipes...</Text>
          </View>
        )}

        {errorText ? (
          <Text style={styles.errorText}>{errorText}</Text>
        ) : null}

        {intent === 'ingredient' && adaptations.length > 0 && (
          <View style={styles.adaptationSection}>
            <Text style={styles.sectionTitle}>Local Alternatives</Text>
            {adaptations.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.adaptationCard}
                onPress={() =>
                  navigation.navigate('IngredientGuide', {
                    slug: item.guideSlug || undefined,
                    name: item.substitute || item.local || item.replacement || item.original,
                  })
                }
                activeOpacity={0.9}
              >
                <Text style={styles.adaptationLabel}>Original</Text>
                <Text style={styles.adaptationValue}>
                  {item.original || item.ingredient || item.from || 'Ingredient'}
                </Text>
                <Text style={styles.adaptationLabel}>Substitute</Text>
                <Text style={styles.adaptationValue}>
                  {item.substitute || item.local || item.replacement || 'Local alternative'}
                </Text>
                {item.reason ? (
                  <Text style={styles.adaptationReason}>{item.reason}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {libraryRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
              <Text style={styles.sectionTitle}>From Your Library</Text>
            </View>
            {libraryRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipeSelect(recipe)}
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
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeTitle} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <View style={[styles.matchBadge, styles.matchBadgeLibrary]}>
                      <Text style={styles.matchText}>
                        {Math.round(recipe.matchScore || 0)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recipeMeta} numberOfLines={1}>
                    {recipe.cuisine || 'Sri Lankan'} • {recipe.category || 'Recipe'}
                  </Text>
                  <Text style={styles.recipeDescription} numberOfLines={2}>
                    {recipe.description}
                  </Text>
                  <View style={styles.sourceTag}>
                    <Text style={styles.sourceTagText}>Library</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {aiRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
              <Text style={styles.sectionTitle}>AI Similar Recipes</Text>
            </View>
            {aiRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipeSelect(recipe)}
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
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeTitle} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <View style={[styles.matchBadge, styles.matchBadgeAi]}>
                      <Text style={styles.matchText}>
                        {Math.round(recipe.matchScore || 0)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recipeMeta} numberOfLines={1}>
                    {recipe.cuisine || 'Sri Lankan'} • {recipe.category || 'Recipe'}
                  </Text>
                  <Text style={styles.recipeDescription} numberOfLines={2}>
                    {recipe.description}
                  </Text>
                  <View style={[styles.sourceTag, styles.sourceTagAi]}>
                    <Text style={styles.sourceTagText}>AI Suggested</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {emptyResults && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recipes found yet.</Text>
          </View>
        )}

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
  queryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.md),
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  queryIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: COLORS.pastelOrange.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
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
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
  },
  loadingInlineText: {
    marginLeft: moderateScale(SPACING.sm),
    color: COLORS.text.secondary,
  },
  errorText: {
    paddingHorizontal: moderateScale(SPACING.base),
    color: COLORS.status.error,
    marginBottom: moderateScale(SPACING.sm),
  },
  section: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.sm),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  recipeImage: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: BORDER_RADIUS.md,
    marginRight: moderateScale(SPACING.sm),
  },
  recipeInfo: {
    flex: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(SPACING.xs),
  },
  recipeTitle: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  matchBadge: {
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(2),
    borderRadius: BORDER_RADIUS.full,
  },
  matchBadgeLibrary: {
    backgroundColor: COLORS.pastelGreen.light,
  },
  matchBadgeAi: {
    backgroundColor: COLORS.pastelYellow.light,
  },
  matchText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
  },
  recipeMeta: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginTop: moderateScale(2),
  },
  recipeDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.tertiary,
    marginTop: moderateScale(4),
  },
  sourceTag: {
    alignSelf: 'flex-start',
    marginTop: moderateScale(6),
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(2),
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.tertiary,
  },
  sourceTagAi: {
    backgroundColor: COLORS.pastelOrange.light,
  },
  sourceTagText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  adaptationSection: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
  },
  adaptationCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  adaptationLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(2),
  },
  adaptationValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: moderateScale(SPACING.xs),
  },
  adaptationReason: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  emptyState: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
  },
  emptyText: {
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SmartScalingSearchResultsScreen;
