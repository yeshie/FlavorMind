// src/features/cookbook/screens/DigitalCookbookScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronRight,
  FlaskConical,
  Globe,
  MessageCircle,
  Star,
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import cookbookDashboardService, {
  CookbookDashboardCookbook,
  CookbookDashboardRecipe,
} from '../../../services/api/cookbookDashboard.service';

interface DigitalCookbookScreenProps {
  navigation: any;
}

interface SavedRecipe {
  id: string;
  dishName: string;
  dishImage: string;
  creator: string;
  rating: number;
}

interface PublishedRecipe {
  id: string;
  dishName: string;
  dishImage: string;
  rating: number;
  feedbackCount: number;
}

interface DraftRecipe {
  id: string;
  dishName: string;
  dishImage: string;
}

interface Cookbook {
  id: string;
  title: string;
  coverImage: string;
  recipeCount: number;
  isPublished: boolean;
}

const DigitalCookbookScreen: React.FC<DigitalCookbookScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'saved'>('published');
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [publishedRecipes, setPublishedRecipes] = useState<PublishedRecipe[]>([]);
  const [draftRecipes, setDraftRecipes] = useState<DraftRecipe[]>([]);
  const [publishedCookbooks, setPublishedCookbooks] = useState<Cookbook[]>([]);
  const [savedCookbooks, setSavedCookbooks] = useState<Cookbook[]>([]);

  const mapDashboardRecipe = (recipe: CookbookDashboardRecipe): SavedRecipe => ({
    id: recipe.id,
    dishName: recipe.dishName || recipe.title || 'Recipe',
    dishImage: recipe.imageUrl || recipe.image,
    creator: recipe.creator || recipe.author || 'Unknown',
    rating: recipe.rating,
  });

  const mapPublishedRecipe = (recipe: CookbookDashboardRecipe): PublishedRecipe => ({
    id: recipe.id,
    dishName: recipe.dishName || recipe.title || 'Recipe',
    dishImage: recipe.imageUrl || recipe.image,
    rating: recipe.rating,
    feedbackCount: recipe.feedbackCount,
  });

  const mapDraftRecipe = (recipe: CookbookDashboardRecipe): DraftRecipe => ({
    id: recipe.id,
    dishName: recipe.dishName || recipe.title || 'Draft Recipe',
    dishImage: recipe.imageUrl || recipe.image,
  });

  const mapCookbook = (cookbook: CookbookDashboardCookbook): Cookbook => ({
    id: cookbook.id,
    title: cookbook.title,
    coverImage: cookbook.coverImageUrl || cookbook.coverImage,
    recipeCount: cookbook.recipeCount ?? cookbook.recipesCount ?? 0,
    isPublished: cookbook.isPublished,
  });

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await cookbookDashboardService.getDashboard();
      const data = response.data || {};

      setSavedRecipes((data.savedRecipes || []).map(mapDashboardRecipe));
      setPublishedRecipes((data.publishedRecipes || []).map(mapPublishedRecipe));
      setDraftRecipes((data.draftRecipes || []).map(mapDraftRecipe));
      setPublishedCookbooks((data.publishedCookbooks || []).map(mapCookbook));
      setSavedCookbooks((data.savedCookbooks || []).map(mapCookbook));
    } catch (error) {
      console.error('Cookbook dashboard load error:', error);
      setSavedRecipes([]);
      setPublishedRecipes([]);
      setDraftRecipes([]);
      setPublishedCookbooks([]);
      setSavedCookbooks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadDashboard(true);
  };

  const handleSavedRecipePress = (recipe: SavedRecipe) => {
    // Go to cooking flow
    navigation.navigate('RecipeCustomization', {
      dishId: recipe.id,
      dishName: recipe.dishName,
    });
  };

  const handlePublishedRecipePress = (recipe: PublishedRecipe) => {
    navigation.navigate('PublishedRecipePage', { recipe });
  };

  const handleDraftRecipePress = (recipe: DraftRecipe) => {
    navigation.navigate('DraftRecipePage', { recipe });
  };

  const handleCookbookPress = (cookbook: Cookbook) => {
    navigation.navigate('CookbookReference', { cookbook });
  };

  const handleCreateCookbook = () => {
    navigation.navigate('SelectRecipesPage');
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
        <Text style={styles.headerTitle}>Digital Cookbook</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>Loading your cookbook...</Text>
          </View>
        )}

        {/* Saved Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bookmark
              size={scaleFontSize(22)}
              color={COLORS.pastelOrange.main}
              strokeWidth={2}
              style={styles.sectionIcon}
            />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Saved Recipes</Text>
              <Text style={styles.sectionCount}>{savedRecipes.length} recipes</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {savedRecipes.length > 0 ? (
              savedRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.savedRecipeCard}
                  onPress={() => handleSavedRecipePress(recipe)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={
                      recipe.dishImage
                        ? { uri: recipe.dishImage }
                        : require('../../../assets/icon.png')
                    }
                    style={styles.savedRecipeImage}
                    resizeMode="cover"
                  />
                  <View style={styles.savedRecipeInfo}>
                    <Text style={styles.savedRecipeName} numberOfLines={2}>
                      {recipe.dishName}
                    </Text>
                    <Text style={styles.savedRecipeCreator} numberOfLines={1}>
                      by {recipe.creator || 'Unknown'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Star
                        size={scaleFontSize(14)}
                        color={COLORS.pastelOrange.main}
                        strokeWidth={2}
                        style={styles.ratingIcon}
                      />
                      <Text style={styles.ratingText}>
                        {recipe.rating !== undefined ? recipe.rating.toFixed(1) : '--'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No saved recipes yet.</Text>
                </View>
              )
            )}
          </ScrollView>
        </View>

        {/* Published Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe
              size={scaleFontSize(22)}
              color={COLORS.pastelGreen.main}
              strokeWidth={2}
              style={styles.sectionIcon}
            />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Published Recipes</Text>
              <Text style={styles.sectionCount}>{publishedRecipes.length} recipes</Text>
            </View>
          </View>

          {publishedRecipes.length > 0 ? (
            publishedRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.publishedRecipeCard}
                onPress={() => handlePublishedRecipePress(recipe)}
                activeOpacity={0.9}
              >
                <Image
                  source={
                    recipe.dishImage
                      ? { uri: recipe.dishImage }
                      : require('../../../assets/icon.png')
                  }
                  style={styles.publishedRecipeImage}
                  resizeMode="cover"
                />
                <View style={styles.publishedRecipeInfo}>
                  <Text style={styles.publishedRecipeName} numberOfLines={2}>
                    {recipe.dishName}
                  </Text>
                  <View style={styles.publishedRecipeStats}>
                    <View style={styles.statItem}>
                      <Star
                        size={scaleFontSize(14)}
                        color={COLORS.pastelOrange.main}
                        strokeWidth={2}
                        style={styles.statIcon}
                      />
                      <Text style={styles.statText}>
                        {recipe.rating !== undefined ? recipe.rating.toFixed(1) : '--'}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <MessageCircle
                        size={scaleFontSize(14)}
                        color={COLORS.text.secondary}
                        strokeWidth={2}
                        style={styles.statIcon}
                      />
                      <Text style={styles.statText}>{recipe.feedbackCount ?? '--'}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={scaleFontSize(20)} color={COLORS.text.tertiary} style={styles.arrowIcon} />
              </TouchableOpacity>
            ))
          ) : (
            !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No published recipes yet.</Text>
              </View>
            )
          )}
        </View>

        {/* Draft Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FlaskConical
              size={scaleFontSize(22)}
              color={COLORS.pastelYellow.main}
              strokeWidth={2}
              style={styles.sectionIcon}
            />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Unpublished (Drafts)</Text>
              <Text style={styles.sectionCount}>{draftRecipes.length} drafts</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {draftRecipes.length > 0 ? (
              draftRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.draftRecipeCard}
                  onPress={() => handleDraftRecipePress(recipe)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={
                      recipe.dishImage
                        ? { uri: recipe.dishImage }
                        : require('../../../assets/icon.png')
                    }
                    style={styles.draftRecipeImage}
                    resizeMode="cover"
                  />
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>DRAFT</Text>
                  </View>
                  <View style={styles.draftRecipeInfo}>
                    <Text style={styles.draftRecipeName} numberOfLines={2}>
                      {recipe.dishName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No draft recipes yet.</Text>
                </View>
              )
            )}
          </ScrollView>
        </View>

        {/* My Cookbooks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen
              size={scaleFontSize(22)}
              color={COLORS.secondary.main}
              strokeWidth={2}
              style={styles.sectionIcon}
            />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>My Cookbooks</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'published' && styles.tabActive]}
              onPress={() => setActiveTab('published')}
            >
              <Text style={[styles.tabText, activeTab === 'published' && styles.tabTextActive]}>
                Published ({publishedCookbooks.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
              onPress={() => setActiveTab('saved')}
            >
              <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
                Saved ({savedCookbooks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cookbook List */}
          <View style={styles.cookbookList}>
            {(activeTab === 'published' ? publishedCookbooks : savedCookbooks).length > 0 ? (
              (activeTab === 'published' ? publishedCookbooks : savedCookbooks).map((cookbook) => (
                <TouchableOpacity
                  key={cookbook.id}
                  style={styles.cookbookCard}
                  onPress={() => handleCookbookPress(cookbook)}
                  activeOpacity={0.9}
                >
                  <Image
                  source={
                    cookbook.coverImage
                      ? { uri: cookbook.coverImage }
                      : require('../../../assets/icon.png')
                  }
                    style={styles.cookbookCover}
                    resizeMode="cover"
                  />
                  <View style={styles.cookbookInfo}>
                    <Text style={styles.cookbookTitle} numberOfLines={2}>
                      {cookbook.title}
                    </Text>
                    <Text style={styles.cookbookCount}>
                      {cookbook.recipeCount ?? 0} recipes
                    </Text>
                  </View>
                  <ChevronRight size={scaleFontSize(20)} color={COLORS.text.tertiary} style={styles.arrowIcon} />
                </TouchableOpacity>
              ))
            ) : (
              !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {activeTab === 'published'
                      ? 'No published cookbooks yet.'
                      : 'No saved cookbooks yet.'}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Create Cookbook Button */}
          <View style={styles.createCookbookContainer}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleCreateCookbook}
              icon={require('../../../assets/icons/plus.png')}
            >
              Create Your Cookbook
            </Button>
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
  section: {
    marginTop: moderateScale(SPACING.xl),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
  },
  sectionIcon: {
    marginRight: moderateScale(SPACING.sm),
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  sectionCount: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginTop: moderateScale(2),
  },
  horizontalScroll: {
    paddingLeft: moderateScale(SPACING.base),
    paddingRight: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.md),
  },
  savedRecipeCard: {
    width: moderateScale(160),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  savedRecipeImage: {
    width: '100%',
    height: moderateScale(140),
  },
  savedRecipeInfo: {
    padding: moderateScale(SPACING.md),
  },
  savedRecipeName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  savedRecipeCreator: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.xs),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    marginRight: moderateScale(4),
  },
  ratingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  publishedRecipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  publishedRecipeImage: {
    width: moderateScale(100),
    height: moderateScale(100),
  },
  publishedRecipeInfo: {
    flex: 1,
    padding: moderateScale(SPACING.md),
  },
  publishedRecipeName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
  },
  publishedRecipeStats: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: moderateScale(4),
  },
  statText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  arrowIcon: {
    paddingRight: moderateScale(SPACING.md),
  },
  draftRecipeCard: {
    width: moderateScale(160),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.pastelYellow.main,
    borderStyle: 'dashed',
    ...SHADOWS.small,
  },
  draftRecipeImage: {
    width: '100%',
    height: moderateScale(140),
    opacity: 0.8,
  },
  draftBadge: {
    position: 'absolute',
    top: moderateScale(SPACING.sm),
    right: moderateScale(SPACING.sm),
    backgroundColor: COLORS.pastelYellow.main,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.xs,
  },
  draftBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  draftRecipeInfo: {
    padding: moderateScale(SPACING.md),
  },
  draftRecipeName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
    gap: moderateScale(SPACING.sm),
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(SPACING.md),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  tabActive: {
    backgroundColor: COLORS.pastelOrange.main,
    borderColor: COLORS.pastelOrange.main,
  },
  tabText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.secondary,
  },
  tabTextActive: {
    color: COLORS.text.white,
  },
  cookbookList: {
    paddingHorizontal: moderateScale(SPACING.base),
  },
  cookbookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: moderateScale(SPACING.md),
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cookbookCover: {
    width: moderateScale(100),
    height: moderateScale(130),
  },
  cookbookInfo: {
    flex: 1,
    padding: moderateScale(SPACING.md),
  },
  cookbookTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  cookbookCount: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  createCookbookContainer: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
  },
  loadingText: {
    marginLeft: moderateScale(SPACING.sm),
    color: COLORS.text.secondary,
  },
  emptyState: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.sm),
  },
  emptyStateText: {
    color: COLORS.text.secondary,
  },
});

export default DigitalCookbookScreen;

