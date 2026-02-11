// src/features/adaptation/screens/LocalAdaptationScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Library, Lightbulb, Plus, Shuffle } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import seasonalService, { SeasonalFood as SeasonalFoodApi } from '../../../services/api/seasonal.service';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import * as Location from 'expo-location';

interface LocalAdaptationScreenProps {
  navigation: any;
}

interface SeasonalFoodCard {
  id: string;
  name: string;
  image?: string;
  season: string;
  availability: string;
}

interface AdaptationCard {
  id: string;
  original: string;
  substitute: string;
  reason?: string;
  guideSlug?: string | null;
}

interface SuggestedRecipeCard {
  id: string;
  title: string;
  image?: string;
  prepTime: number;
  difficulty: string;
  recipe?: Recipe;
}

const LocalAdaptationScreen: React.FC<LocalAdaptationScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonalFoods, setSeasonalFoods] = useState<SeasonalFoodCard[]>([]);
  const [loadingSeasonal, setLoadingSeasonal] = useState(true);
  const [adaptations, setAdaptations] = useState<AdaptationCard[]>([]);
  const [searchingAdaptations, setSearchingAdaptations] = useState(false);
  const [adaptationError, setAdaptationError] = useState('');
  const [suggestedRecipes, setSuggestedRecipes] = useState<SuggestedRecipeCard[]>([]);
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);

  const statusToSeason = (status?: string) => {
    if (status === 'high-harvest') return 'High Harvest';
    if (status === 'low-price') return 'Low Price';
    if (status === 'limited') return 'Limited';
    return 'Now in Season';
  };

  const statusToAvailability = (status?: string) => {
    if (status === 'high-harvest') return 'Peak Season';
    if (status === 'low-price') return 'Affordable';
    if (status === 'limited') return 'Limited Supply';
    return 'Available Now';
  };

  const mapSeasonalFood = (item: SeasonalFoodApi): SeasonalFoodCard => ({
    id: item.id,
    name: item.name,
    image: item.imageUrl || item.image,
    season: item.season || item.badge || statusToSeason(item.status),
    availability: item.availability || statusToAvailability(item.status),
  });

  const normalizeAdaptation = (item: any, index: number): AdaptationCard => ({
    id: item?.id || `${index}`,
    original:
      item?.original ||
      item?.ingredient ||
      item?.from ||
      item?.name ||
      item?.item ||
      `Ingredient ${index + 1}`,
    substitute:
      item?.substitute ||
      item?.replacement ||
      item?.to ||
      item?.local ||
      item?.suggested ||
      'Local alternative',
    reason: item?.reason || item?.note || item?.why || '',
    guideSlug: item?.guideSlug || item?.guideId || null,
  });

  const mapSuggestedRecipe = (recipe: Recipe, index: number): SuggestedRecipeCard => ({
    id: recipe.id || recipe.title || recipe.dish || `${Date.now()}-${index}`,
    title: recipe.title || recipe.dish || 'Recipe',
    image: recipe.imageUrl || recipe.image,
    prepTime: recipe.prepTime || recipe.cookTime || 0,
    difficulty: recipe.difficulty || 'medium',
    recipe,
  });

  const loadSeasonalFoods = useCallback(async () => {
    setLoadingSeasonal(true);
    try {
      const params = {
        limit: 10,
        ...(deviceCoords ? { lat: deviceCoords.lat, lng: deviceCoords.lng } : {}),
      };
      const response = await seasonalService.getSeasonalFoods(params);
      const items = response.data.items || [];
      setSeasonalFoods(items.map(mapSeasonalFood));
    } catch (error) {
      console.error('Seasonal foods load error:', error);
      setSeasonalFoods([]);
    } finally {
      setLoadingSeasonal(false);
    }
  }, [deviceCoords]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    setSearchingAdaptations(true);
    setAdaptationError('');
    setSuggestedRecipes([]);

    try {
      const response = await recipeService.searchRecipes(query);
      let recipes = response.data?.recipes || [];
      const intent = response.data?.intent || 'dish';
      const adaptationItems = response.data?.adaptations || [];

      if (intent === 'dish' && recipes.length > 0) {
        const recipe = recipes[0];
        navigation.navigate('RecipeCustomization', {
          dishName: recipe.title || query,
          recipe,
        });
        setSearchingAdaptations(false);
        return;
      }

      if (intent === 'ingredient') {
        if (recipes.length === 0) {
          try {
            const fallback = await recipeService.getSimilarRecipes({
              ingredient: query,
              limit: 5,
            });
            recipes = fallback.data?.recipes || [];
          } catch (fallbackError) {
            console.warn('Similar recipes fallback error:', fallbackError);
          }
        }

        setAdaptations(adaptationItems.map(normalizeAdaptation));
        setSuggestedRecipes(recipes.map(mapSuggestedRecipe));
      } else {
        setAdaptations([]);
      }
    } catch (error) {
      console.error('Local adaptation search error:', error);
      setAdaptationError('Could not load local adaptations.');
      setAdaptations([]);
    } finally {
      setSearchingAdaptations(false);
    }
  };

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleAddAdaptation = () => {
    navigation.navigate('AddAdaptation');
  };

  const handleLibrary = () => {
    navigation.navigate('RecipeLibrary');
  };

  const handleSeasonalFoodPress = (food: SeasonalFoodCard) => {
    navigation.navigate('SeasonalFood', { food });
  };

  const handleAdaptationPress = (adaptation: AdaptationCard) => {
    if (!adaptation.guideSlug && !adaptation.substitute) {
      return;
    }
    navigation.navigate('IngredientGuide', {
      slug: adaptation.guideSlug || undefined,
      name: adaptation.substitute,
    });
  };

  useEffect(() => {
    loadSeasonalFoods();
  }, [loadSeasonalFoods]);

  useEffect(() => {
    let isMounted = true;

    const loadDeviceLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted && position?.coords) {
          setDeviceCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      } catch (error) {
        console.warn('Location fetch failed:', error);
      }
    };

    loadDeviceLocation();

    return () => {
      isMounted = false;
    };
  }, []);

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
        <Text style={styles.headerTitle}>Local Adaptation</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Image
              source={require('../../../assets/icons/search.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dish or ingredient (e.g., Jackfruit curry)"
              placeholderTextColor={COLORS.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddRecipe}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Plus size={scaleFontSize(20)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionButtonIconText} />
            </View>
            <Text style={styles.actionButtonText}>Add Your Own Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddAdaptation}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Shuffle size={scaleFontSize(20)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionButtonIconText} />
            </View>
            <Text style={styles.actionButtonText}>Add Local Swap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLibrary}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Library size={scaleFontSize(20)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionButtonIconText} />
            </View>
            <Text style={styles.actionButtonText}>Library</Text>
          </TouchableOpacity>
        </View>

        {/* Local Adaptation Results */}
        <View style={styles.adaptationSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Local Ingredient Swaps</Text>
            <Text style={styles.sectionSubtitle}>
              Type a dish or ingredient to get Sri Lankan alternatives
            </Text>
          </View>

          {searchingAdaptations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingText}>Finding local adaptations...</Text>
            </View>
          ) : adaptationError ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{adaptationError}</Text>
            </View>
          ) : adaptations.length > 0 ? (
            adaptations.map((adaptation) => (
              <TouchableOpacity
                key={adaptation.id}
                style={styles.adaptationCard}
                onPress={() => handleAdaptationPress(adaptation)}
                activeOpacity={adaptation.guideSlug || adaptation.substitute ? 0.9 : 1}
              >
                <View style={styles.adaptationHeader}>
                  <Text style={styles.adaptationLabel}>Original</Text>
                  <Text style={styles.adaptationValue}>{adaptation.original}</Text>
                </View>
                <View style={styles.adaptationDivider} />
                <View style={styles.adaptationHeader}>
                  <Text style={styles.adaptationLabel}>Local Substitute</Text>
                  <Text style={styles.adaptationValue}>{adaptation.substitute}</Text>
                </View>
                {adaptation.reason ? (
                  <Text style={styles.adaptationReason}>{adaptation.reason}</Text>
                ) : null}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Search to see local ingredient swaps.
              </Text>
            </View>
          )}
        </View>

        {suggestedRecipes.length > 0 && (
          <View style={styles.suggestionSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suggested Dishes</Text>
              <Text style={styles.sectionSubtitle}>
                Recipes using {searchQuery.trim() || 'your ingredient'}
              </Text>
            </View>
            {suggestedRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.suggestedCard}
                onPress={() =>
                  navigation.navigate('RecipeCustomization', {
                    dishName: recipe.title,
                    recipe: recipe.recipe,
                    autoAdapt: true,
                    sourceIngredient: searchQuery.trim(),
                  })
                }
                activeOpacity={0.9}
              >
                <Image
                  source={
                    recipe.image
                      ? { uri: recipe.image }
                      : require('../../../assets/icon.png')
                  }
                  style={styles.suggestedImage}
                  resizeMode="cover"
                />
                <View style={styles.suggestedInfo}>
                  <Text style={styles.suggestedTitle}>{recipe.title}</Text>
                  <View style={styles.suggestedMeta}>
                    <Text style={styles.suggestedMetaText}>{recipe.prepTime} min</Text>
                    <Text style={styles.suggestedMetaText}>{recipe.difficulty}</Text>
                  </View>
                </View>
                <ChevronRight size={scaleFontSize(20)} color={COLORS.text.secondary} style={styles.suggestedArrow} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Seasonal Foods Section */}
        <View style={styles.seasonalSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Checkout New Seasonal Foods</Text>
            <Text style={styles.sectionSubtitle}>
              Fresh ingredients available now
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.seasonalScroll}
          >
            {loadingSeasonal ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
                <Text style={styles.loadingText}>Loading seasonal foods...</Text>
              </View>
            ) : seasonalFoods.length > 0 ? (
              seasonalFoods.map((food) => (
                <TouchableOpacity
                  key={food.id}
                  style={styles.seasonalCard}
                  onPress={() => handleSeasonalFoodPress(food)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={
                      food.image
                        ? { uri: food.image }
                        : require('../../../assets/icon.png')
                    }
                    style={styles.seasonalImage}
                    resizeMode="cover"
                  />
                  <View style={styles.seasonalBadge}>
                    <Text style={styles.seasonalBadgeText}>{food.season}</Text>
                  </View>
                  <View style={styles.seasonalInfo}>
                    <Text style={styles.seasonalName}>{food.name}</Text>
                    <Text style={styles.seasonalAvailability}>{food.availability}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No seasonal foods available.</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Lightbulb size={scaleFontSize(28)} color={COLORS.pastelYellow.dark} strokeWidth={2} style={styles.tipsIcon} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Pro Tip</Text>
            <Text style={styles.tipsText}>
              Using seasonal ingredients ensures fresher taste, better nutrition, and supports local farmers!
            </Text>
          </View>
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
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    gap: moderateScale(SPACING.md),
  },
  actionButton: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  actionButtonIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.pastelOrange.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.sm),
  },
  actionButtonIconText: {},
  actionButtonText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  adaptationSection: {
    marginTop: moderateScale(SPACING.xl),
    paddingHorizontal: moderateScale(SPACING.base),
  },
  adaptationCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  adaptationHeader: {
    marginBottom: moderateScale(SPACING.sm),
  },
  adaptationLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: moderateScale(2),
  },
  adaptationValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  adaptationDivider: {
    height: 1,
    backgroundColor: COLORS.background.tertiary,
    marginBottom: moderateScale(SPACING.sm),
  },
  adaptationReason: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginTop: moderateScale(SPACING.xs),
  },
  suggestionSection: {
    marginTop: moderateScale(SPACING.xl),
    paddingHorizontal: moderateScale(SPACING.base),
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  suggestedImage: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: BORDER_RADIUS.md,
  },
  suggestedInfo: {
    flex: 1,
    marginLeft: moderateScale(SPACING.md),
  },
  suggestedTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  suggestedMeta: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
  },
  suggestedMetaText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  suggestedArrow: {
    marginLeft: moderateScale(SPACING.sm),
  },
  seasonalSection: {
    marginTop: moderateScale(SPACING.xl),
  },
  sectionHeader: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  seasonalScroll: {
    paddingLeft: moderateScale(SPACING.base),
    paddingRight: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.md),
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
  seasonalCard: {
    width: moderateScale(160),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  seasonalImage: {
    width: '100%',
    height: moderateScale(140),
  },
  seasonalBadge: {
    position: 'absolute',
    top: moderateScale(SPACING.sm),
    right: moderateScale(SPACING.sm),
    backgroundColor: COLORS.pastelGreen.main,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
  },
  seasonalBadgeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  seasonalInfo: {
    padding: moderateScale(SPACING.md),
  },
  seasonalName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  seasonalAvailability: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  tipsSection: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelYellow.light,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
  },
  tipsIcon: {
    marginRight: moderateScale(SPACING.md),
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  tipsText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default LocalAdaptationScreen;
