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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import { buildRemoteImageSource, normalizeDishName } from '../../../common/utils';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import recipeStore, { FirestoreRecipe } from '../../../services/firebase/recipeStore';
import { getFirebaseUser } from '../../../services/firebase/authService';
import { hasFirebaseConfig } from '../../../services/firebase/firebase';
import {
  clearSearchHistory,
  getSearchHistory,
  recordRecipeActivity,
  recordSearchQuery,
  recordSearchSelection,
  removeSearchHistoryEntry,
  SearchHistoryEntry,
} from '../../../services/storage/asyncStorage';

interface SearchRecipeScreenProps {
  navigation: any;
}

type SearchSourceType = 'api' | 'faiss' | 'firebase-approved' | 'firebase-user';

interface SearchResultRecipe extends Recipe {
  sourceType: SearchSourceType;
}

const SearchRecipeScreen: React.FC<SearchRecipeScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [results, setResults] = useState<SearchResultRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [adaptations, setAdaptations] = useState<any[]>([]);
  const [intent, setIntent] = useState<string | undefined>(undefined);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);

  const normalizeRecipes = (
    items: any[] = [],
    seed = 'recipe',
    sourceQuery?: string,
    sourceType: SearchSourceType = 'api',
    sourceLabel?: string
  ): SearchResultRecipe[] => {
    const base = Date.now();
    return items.map((recipe: any, index: number) => ({
      ...recipe,
      id: recipe.id || recipe.title || recipe.dish || `${seed}-${base}-${index}`,
      title: normalizeDishName(recipe.title || recipe.dish || recipe.name, sourceQuery),
      ownerName: recipe.ownerName || recipe.owner_name || recipe.author || recipe.creator,
      ownerId: recipe.ownerId || recipe.owner_id || recipe.authorId,
      ownerPhotoUrl: recipe.ownerPhotoUrl || recipe.owner_photo_url || recipe.photoUrl || recipe.photoURL,
      rating: typeof recipe.rating === 'number' ? recipe.rating : Number(recipe.rating ?? recipe.ratingAverage ?? 0),
      feedbackCount:
        typeof recipe.feedbackCount === 'number'
          ? recipe.feedbackCount
          : Number(recipe.feedbackCount ?? recipe.comments ?? 0),
      views: typeof recipe.views === 'number' ? recipe.views : Number(recipe.views ?? 0),
      sourceType,
      sourceLabel: recipe.sourceLabel || sourceLabel,
      isFirebaseRecipe: Boolean(recipe.isFirebaseRecipe),
      isCurrentUserRecipe: Boolean(recipe.isCurrentUserRecipe),
    }));
  };

  const mapFirebaseRecipe = (
    recipe: FirestoreRecipe,
    currentUserId?: string
  ): SearchResultRecipe => ({
    id: recipe.id,
    title: normalizeDishName(recipe.title || 'Recipe', recipe.title || 'Recipe'),
    description: recipe.description || '',
    cuisine: (recipe.cuisine as string) || '',
    category: (recipe.category as Recipe['category']) || '',
    difficulty: (recipe.difficulty as Recipe['difficulty']) || 'medium',
    prepTime: recipe.prepTime || 0,
    cookTime: recipe.cookTime || 0,
    servings: recipe.servings || 1,
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((item) => ({
          name: item.name,
          quantity: `${item.quantity ?? ''}`,
          unit: item.unit || '',
        }))
      : [],
    instructions: Array.isArray(recipe.instructions)
      ? recipe.instructions.map((item, index) => ({
          step: item.step ?? index + 1,
          description: item.description,
        }))
      : [],
    imageUrl: recipe.imageUrl || recipe.image || undefined,
    image: recipe.image || recipe.imageUrl || undefined,
    publishStatus: recipe.publishStatus,
    ownerId: recipe.ownerId,
    ownerName: recipe.ownerName,
    ownerPhotoUrl: recipe.ownerPhotoUrl || null,
    rating: recipe.rating ?? 0,
    feedbackCount: recipe.feedbackCount ?? 0,
    views: recipe.views ?? 0,
    source: recipe.source || 'user',
    sourceType: recipe.ownerId === currentUserId ? 'firebase-user' : 'firebase-approved',
    sourceLabel: recipe.ownerId === currentUserId ? 'Your Recipe' : 'Approved Recipe',
    isFirebaseRecipe: true,
    isCurrentUserRecipe: recipe.ownerId === currentUserId,
  });

  const matchesFirebaseRecipe = (recipe: FirestoreRecipe, searchTerm: string) => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return false;

    const ingredientText = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((item) => item.name).join(' ')
      : '';

    const haystack = [
      recipe.title,
      recipe.description,
      recipe.cuisine,
      recipe.category,
      recipe.ownerName,
      ingredientText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedTerm);
  };

  const mergeRecipes = (...recipeLists: SearchResultRecipe[][]) => {
    const merged = new Map<string, SearchResultRecipe>();

    recipeLists.flat().forEach((recipe) => {
      const titleKey = normalizeDishName(recipe.title || 'Recipe', recipe.title).toLowerCase();
      const creatorKey = recipe.isFirebaseRecipe ? recipe.ownerId || recipe.ownerName || '' : '';
      const key = `${titleKey}::${creatorKey.toLowerCase()}`;
      if (!merged.has(key)) {
        merged.set(key, recipe);
      }
    });

    return [...merged.values()];
  };

  const getRecipeSourceLabel = (recipe: SearchResultRecipe) => {
    if (recipe.sourceLabel) return recipe.sourceLabel;
    if (recipe.sourceType === 'firebase-user') return 'Your Recipe';
    if (recipe.sourceType === 'firebase-approved') return 'Approved Recipe';
    if (recipe.sourceType === 'faiss') return 'App Recipe';
    return 'App Recipe';
  };

  const getRecipeCreator = (recipe: SearchResultRecipe) => {
    const creator = recipe.ownerName || recipe.author;
    if (!creator) return undefined;
    const normalized = creator.trim().toLowerCase();
    if (!normalized || normalized === 'flavormind') {
      return undefined;
    }
    return creator;
  };

  const persistSearchSelection = async (recipe: SearchResultRecipe) => {
    const finalTerm = query.trim() || recipe.title;
    setHistory(
      await recordSearchSelection({
        query: finalTerm,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        image: recipe.imageUrl || recipe.image,
      })
    );
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistory(await getSearchHistory());
      } catch (error) {
        console.warn('Failed to load search history', error);
      }
    };

    loadHistory();
  }, []);

  const handleSubmit = async (term?: string) => {
    const finalTerm = (term ?? query).trim();
    if (!finalTerm) {
      return;
    }

    setHistory(await recordSearchQuery(finalTerm));
    setQuery(finalTerm);
    Keyboard.dismiss();
    setLoading(true);
    setErrorText('');
    try {
      const response = await recipeService.searchRecipes(finalTerm);
      const nextIntent = response.data?.intent;
      const nextAdaptations = response.data?.adaptations || [];
      const apiRecipes = normalizeRecipes(
        response.data?.recipes || [],
        'api-recipe',
        finalTerm,
        'api',
        'App Recipe'
      );

      const firebaseUser = getFirebaseUser();
      const faissQuery =
        nextIntent === 'ingredient'
          ? { ingredient: finalTerm, limit: 6 }
          : { q: finalTerm, limit: 6 };

      const [faissResult, approvedResult, userResult] = await Promise.allSettled([
        recipeService.getSimilarRecipes(faissQuery),
        hasFirebaseConfig ? recipeStore.getApprovedRecipes() : Promise.resolve([] as FirestoreRecipe[]),
        hasFirebaseConfig && firebaseUser
          ? recipeStore.getUserRecipes(firebaseUser.uid)
          : Promise.resolve([] as FirestoreRecipe[]),
      ]);

      if (faissResult.status === 'rejected') {
        console.warn('Similar recipes fallback error:', faissResult.reason);
      }

      const faissRecipes =
        faissResult.status === 'fulfilled'
          ? normalizeRecipes(
              faissResult.value.data?.recipes || [],
              'faiss-recipe',
              finalTerm,
              'faiss',
              'App Recipe'
            )
          : [];

      const approvedRecipes =
        approvedResult.status === 'fulfilled'
          ? approvedResult.value
              .filter((recipe) => matchesFirebaseRecipe(recipe, finalTerm))
              .map((recipe) => mapFirebaseRecipe(recipe, firebaseUser?.uid))
          : [];

      const userRecipes =
        userResult.status === 'fulfilled'
          ? userResult.value
              .filter((recipe) => matchesFirebaseRecipe(recipe, finalTerm))
              .map((recipe) => mapFirebaseRecipe(recipe, firebaseUser?.uid))
          : [];

      setIntent(nextIntent);
      setAdaptations(nextAdaptations);
      setResults(mergeRecipes(userRecipes, approvedRecipes, apiRecipes, faissRecipes));
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

  const handleRecipePress = async (recipe: SearchResultRecipe) => {
    try {
      await persistSearchSelection(recipe);
    } catch (error) {
      console.warn('Failed to save selected search result', error);
    }

    navigation.navigate('RecipeDescription', {
      recipeId: recipe.id,
      recipe,
    });
  };

  const handleRecreateRecipe = async (recipe: SearchResultRecipe) => {
    try {
      await persistSearchSelection(recipe);
    } catch (error) {
      console.warn('Failed to save recreated search result', error);
    }

    navigation.navigate('RecipeCustomization', {
      dishId: recipe.id,
      dishName: recipe.title,
      dishImage: recipe.imageUrl || recipe.image,
      recipe,
    });
  };

  const handleSaveRecipe = async (recipe: SearchResultRecipe) => {
    if (savingRecipeId) return;

    const firebaseUser = getFirebaseUser();
    if (!firebaseUser) {
      Alert.alert('Login Required', 'Please sign in to save recipes.');
      return;
    }

    setSavingRecipeId(recipe.id);
    try {
      await persistSearchSelection(recipe);

      const creator = getRecipeCreator(recipe);
      const hasFirestoreId = Boolean(recipe.isFirebaseRecipe);

      await recipeStore.saveRecipeToLibrary(firebaseUser.uid, {
        recipeId: hasFirestoreId ? recipe.id : undefined,
        externalId: hasFirestoreId ? undefined : recipe.externalId || recipe.id,
        source: hasFirestoreId ? 'user' : recipe.source || 'ai',
        sourceLabel: getRecipeSourceLabel(recipe),
        title: recipe.title,
        imageUrl: recipe.imageUrl || recipe.image,
        creator,
        rating: recipe.rating && recipe.rating > 0 ? recipe.rating : undefined,
        feedbackCount: recipe.feedbackCount,
      });

      await recordRecipeActivity({
        actionType: 'save',
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        cuisine: recipe.cuisine,
        ingredients: Array.isArray(recipe.ingredients)
          ? recipe.ingredients.map((item) => item.name).filter(Boolean)
          : [],
      });

      Alert.alert('Saved', 'Recipe added to your library.');
    } catch (error) {
      console.error('Save recipe error:', error);
      Alert.alert('Error', 'Could not save this recipe right now.');
    } finally {
      setSavingRecipeId(null);
    }
  };

  const handleRemoveHistory = async (term: string) => {
    setHistory(await removeSearchHistoryEntry(term));
  };

  const handleClearAll = async () => {
    setHistory([]);
    await clearSearchHistory();
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
            history.map((entry) => (
              <TouchableOpacity
                key={entry.query}
                style={styles.historyItem}
                onPress={() => handleSubmit(entry.query)}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../../assets/icons/clock.png')}
                  style={styles.historyIcon}
                  resizeMode="contain"
                />
                <View style={styles.historyTextContainer}>
                  <Text style={styles.historyText} numberOfLines={1}>
                    {entry.query}
                  </Text>
                  {entry.recipeTitle ? (
                    <Text style={styles.historyMetaText} numberOfLines={1}>
                      Last opened: {entry.recipeTitle}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveHistory(entry.query)}
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
              const creator = getRecipeCreator(recipe);
              const showStats =
                recipe.isFirebaseRecipe || Boolean((recipe.feedbackCount ?? 0) > 0) || Boolean((recipe.rating ?? 0) > 0);
              const subtitleParts = [recipe.cuisine, recipe.category].filter(Boolean);

              return (
                <View
                  key={recipe.id}
                  style={styles.resultCard}
                >
                  <TouchableOpacity
                    style={styles.resultMain}
                    onPress={() => void handleRecipePress(recipe)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={
                        buildRemoteImageSource(recipe.imageUrl || recipe.image)
                        || require('../../../assets/icons/book.png')
                      }
                      style={styles.resultImage}
                      resizeMode="cover"
                    />
                    <View style={styles.resultInfo}>
                      <View style={styles.resultTopRow}>
                        <Text style={styles.resultTitle} numberOfLines={2}>
                          {recipe.title}
                        </Text>
                        <View style={styles.sourceBadge}>
                          <Text style={styles.sourceBadgeText}>
                            {getRecipeSourceLabel(recipe)}
                          </Text>
                        </View>
                      </View>
                      {subtitleParts.length > 0 ? (
                        <Text style={styles.resultSubtitle} numberOfLines={1}>
                          {subtitleParts.join(' | ')}
                        </Text>
                      ) : null}
                      {creator ? (
                        <Text style={styles.resultCreator} numberOfLines={1}>
                          Created by {creator}
                        </Text>
                      ) : null}
                      {showStats ? (
                        <View style={styles.resultStatsRow}>
                          <Text style={styles.resultStatText}>
                            Rating: {recipe.rating && recipe.rating > 0 ? recipe.rating.toFixed(1) : '--'}
                          </Text>
                          <Text style={styles.resultStatText}>
                            Comments: {recipe.feedbackCount ?? 0}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.resultActionsRow}>
                    <TouchableOpacity
                      style={[styles.resultActionButton, styles.resultActionSecondary]}
                      onPress={() => void handleSaveRecipe(recipe)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resultActionSecondaryText}>
                        {savingRecipeId === recipe.id ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.resultActionButton, styles.resultActionPrimary]}
                      onPress={() => void handleRecreateRecipe(recipe)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resultActionPrimaryText}>Recreate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
  },
  historyTextContainer: {
    flex: 1,
    marginRight: moderateScale(SPACING.sm),
  },
  historyMetaText: {
    marginTop: moderateScale(2),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
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
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: moderateScale(SPACING.sm),
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  resultMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: moderateScale(SPACING.sm),
  },
  resultImage: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: BORDER_RADIUS.md,
    marginRight: moderateScale(SPACING.sm),
  },
  resultInfo: {
    flex: 1,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: moderateScale(SPACING.sm),
  },
  resultTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
    flex: 1,
  },
  resultSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  resultCreator: {
    marginTop: moderateScale(4),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
    marginTop: moderateScale(6),
  },
  resultStatText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.pastelGreen.light,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(4),
  },
  sourceBadgeText: {
    fontSize: scaleFontSize(10),
    color: COLORS.pastelGreen.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingBottom: moderateScale(SPACING.sm),
    paddingTop: moderateScale(2),
  },
  resultActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.md,
  },
  resultActionPrimary: {
    backgroundColor: COLORS.pastelOrange.main,
  },
  resultActionSecondary: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  resultActionPrimaryText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  resultActionSecondaryText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SearchRecipeScreen;
