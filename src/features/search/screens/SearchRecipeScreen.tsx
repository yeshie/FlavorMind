import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import recipeService, { Recipe } from '../../../services/api/recipe.service';

interface SearchRecipeScreenProps {
  navigation: any;
}

const STORAGE_KEY = 'search_history';

const SearchRecipeScreen: React.FC<SearchRecipeScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [adaptations, setAdaptations] = useState<any[]>([]);
  const [intent, setIntent] = useState<string | undefined>(undefined);

  const normalizeRecipes = (items: any[] = [], seed = 'recipe'): Recipe[] => {
    const base = Date.now();
    return items.map((recipe: any, index: number) => ({
      ...recipe,
      id: recipe.id || recipe.title || recipe.dish || `${seed}-${base}-${index}`,
      title: recipe.title || recipe.dish || recipe.name || 'Recipe',
    }));
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load search history', error);
      }
    };

    loadHistory();
  }, []);

  const persistHistory = async (nextHistory: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
    } catch (error) {
      console.warn('Failed to save search history', error);
    }
  };

  const handleSubmit = async (term?: string) => {
    const finalTerm = (term ?? query).trim();
    if (!finalTerm) {
      return;
    }

    const updated = [
      finalTerm,
      ...history.filter(
        (item) => item.toLowerCase() !== finalTerm.toLowerCase()
      ),
    ];
    setHistory(updated);
    await persistHistory(updated);
    setQuery(finalTerm);
    Keyboard.dismiss();
    setLoading(true);
    setErrorText('');
    try {
      const response = await recipeService.searchRecipes(finalTerm);
      let recipes = response.data?.recipes || [];
      const nextIntent = response.data?.intent;
      const nextAdaptations = response.data?.adaptations || [];

      if (nextIntent === 'ingredient' && recipes.length === 0) {
        try {
          const fallback = await recipeService.getSimilarRecipes({
            ingredient: finalTerm,
            limit: 5,
          });
          recipes = fallback.data?.recipes || [];
        } catch (fallbackError) {
          console.warn('Similar recipes fallback error:', fallbackError);
        }
      }

      setIntent(nextIntent);
      setAdaptations(nextAdaptations);
      setResults(normalizeRecipes(recipes));
    } catch (error) {
      console.error('Search recipes error:', error);
      setErrorText('Could not load recipes. Please try again.');
      setResults([]);
      setAdaptations([]);
      setIntent(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHistory = async (term: string) => {
    const nextHistory = history.filter((item) => item !== term);
    setHistory(nextHistory);
    await persistHistory(nextHistory);
  };

  const handleClearAll = async () => {
    setHistory([]);
    await persistHistory([]);
  };

  const emptyState = useMemo(() => history.length === 0, [history.length]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TouchableOpacity onPress={() => handleSubmit()} activeOpacity={0.7}>
              <Image
                source={require('../../../assets/icons/search.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor={COLORS.text.tertiary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => handleSubmit()}
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setQuery('')}
                activeOpacity={0.7}
              >
                <Text style={styles.clearText}>x</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            {!emptyState && (
              <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {emptyState ? (
            <Text style={styles.emptyText}>No recent searches yet</Text>
          ) : (
            history.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.historyItem}
                onPress={() => handleSubmit(term)}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../../assets/icons/clock.png')}
                  style={styles.historyIcon}
                  resizeMode="contain"
                />
                <Text style={styles.historyText} numberOfLines={1}>
                  {term}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveHistory(term)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeText}>x</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {intent === 'ingredient' ? 'Similar Dishes' : 'Results'}
            </Text>
            {loading && <Text style={styles.resultsHint}>Searching...</Text>}
          </View>

          {intent === 'ingredient' && adaptations.length > 0 && (
            <View style={styles.adaptationSection}>
              <Text style={styles.adaptationTitle}>Local Alternatives</Text>
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

          {errorText ? (
            <Text style={styles.errorText}>{errorText}</Text>
          ) : results.length === 0 && !loading ? (
            <Text style={styles.emptyText}>No recipes found yet</Text>
          ) : (
            results.map((recipe) => {
              const recipeImage = recipe.imageUrl || recipe.image;
              const authorName = recipe.author || (recipe as any).authorName || 'FlavorMind';
              const ratingValue =
                (recipe as any).rating ??
                (recipe as any).ratingAverage ??
                (recipe as any).ratingAvg ??
                4.5;

              return (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.resultCard}
                  onPress={() =>
                    navigation.navigate('RecipeDescription', {
                      recipe: {
                        id: recipe.id,
                        title: recipe.title,
                        creator: authorName,
                        creatorAvatar: 'https://i.pravatar.cc/150?img=12',
                        image: recipeImage || 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
                        description: recipe.description || '',
                        rating: ratingValue,
                        comments: 0,
                        category: recipe.category || 'Recipe',
                        servings: recipe.servings,
                        ingredients: recipe.ingredients,
                      },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri:
                        recipeImage ||
                        'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
                    }}
                    style={styles.resultImage}
                    resizeMode="cover"
                  />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <Text style={styles.resultSubtitle} numberOfLines={1}>
                      {recipe.cuisine || 'Sri Lankan'} | {recipe.category || 'Recipe'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
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
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  searchIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.text.secondary,
    marginRight: moderateScale(SPACING.sm),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    paddingVertical: moderateScale(SPACING.md),
  },
  clearButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  historySection: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  historyTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  clearAllText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  emptyText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: moderateScale(SPACING.sm),
    paddingHorizontal: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  historyIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: COLORS.text.secondary,
    marginRight: moderateScale(SPACING.sm),
  },
  historyText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
  },
  removeButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  resultsSection: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
  },
  adaptationSection: {
    marginBottom: moderateScale(SPACING.lg),
  },
  adaptationTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
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
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(SPACING.md),
  },
  resultsTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  resultsHint: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  errorText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.status.error,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  resultImage: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: BORDER_RADIUS.md,
    marginRight: moderateScale(SPACING.sm),
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  resultSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SearchRecipeScreen;
