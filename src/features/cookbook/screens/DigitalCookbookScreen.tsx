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
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronRight,
  Clock3,
  FlaskConical,
  Globe,
  MessageCircle,
  Star,
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import { buildRemoteImageSource } from '../../../common/utils';
import Button from '../../../common/components/Button/button';
import { getFirebaseUser } from '../../../services/firebase/authService';
import cookingHistoryStore, {
  FirestoreCookingHistory,
  isPermissionDeniedError,
} from '../../../services/firebase/cookingHistoryStore';
import recipeStore, {
  FirestoreRecipe,
  PublishStatus,
  SavedRecipeDoc,
} from '../../../services/firebase/recipeStore';
import cookbookStore, {
  FirestoreCookbook,
  SavedCookbookDoc,
} from '../../../services/firebase/cookbookStore';
import {
  getCookingHistory,
  type CookingHistoryEntry,
} from '../../../services/storage/asyncStorage';

interface DigitalCookbookScreenProps {
  navigation: any;
}

interface SavedRecipe {
  id: string;
  dishName: string;
  dishImage: string;
  source?: string;
  creator?: string;
  sourceLabel?: string;
  rating?: number;
  feedbackCount?: number;
}

interface PublishedRecipe {
  id: string;
  dishName: string;
  dishImage: string;
  rating?: number;
  feedbackCount?: number;
}

interface DraftRecipe {
  id: string;
  dishName: string;
  dishImage: string;
  status: PublishStatus;
}

interface Cookbook {
  id: string;
  title: string;
  coverImage: string;
  recipeCount: number;
  isPublished: boolean;
}

interface CookingHistoryItem {
  id: string;
  dishName: string;
  dishImage: string;
  servingSize?: number;
  prepTime?: number;
  cookTime?: number;
  totalCookTime?: number;
  rating?: number;
  publicComment?: string;
  changes?: string;
  localImprovements?: string;
  personalTips?: string;
  timestamp: number;
  relativeDate: string;
}

const DigitalCookbookScreen: React.FC<DigitalCookbookScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'saved'>('published');
  const [cookingHistory, setCookingHistory] = useState<CookingHistoryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [publishedRecipes, setPublishedRecipes] = useState<PublishedRecipe[]>([]);
  const [draftRecipes, setDraftRecipes] = useState<DraftRecipe[]>([]);
  const [publishedCookbooks, setPublishedCookbooks] = useState<Cookbook[]>([]);
  const [savedCookbooks, setSavedCookbooks] = useState<Cookbook[]>([]);

  const normalizeStatus = (status?: PublishStatus): PublishStatus => status || 'draft';
  const normalizeSourceLabel = (value?: string | null) =>
    value === 'Retrieved Recipe' ? 'App Recipe' : value || undefined;
  const toSortableTime = (value: unknown): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Date.parse(value) || 0;
    if (typeof value === 'object') {
      const anyValue = value as { seconds?: number; toMillis?: () => number };
      if (typeof anyValue.toMillis === 'function') {
        return anyValue.toMillis();
      }
      if (typeof anyValue.seconds === 'number') {
        return anyValue.seconds * 1000;
      }
    }
    return 0;
  };
  const formatRelativeDate = (value: unknown) => {
    const timestamp = toSortableTime(value);
    if (!timestamp) return 'Recently';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  const mapLocalCookingHistory = (item: CookingHistoryEntry): CookingHistoryItem => {
    const timestamp = Math.max(
      toSortableTime(item.updatedAt),
      toSortableTime(item.cookedAt)
    );

    return {
      id: item.id,
      dishName: item.dishName,
      dishImage: item.dishImage || '',
      servingSize: item.servingSize,
      prepTime: item.prepTime,
      cookTime: item.cookTime,
      totalCookTime: item.totalCookTime,
      rating: item.rating,
      publicComment: item.publicComment,
      changes: item.changes,
      localImprovements: item.localImprovements,
      personalTips: item.personalTips,
      timestamp,
      relativeDate: formatRelativeDate(item.updatedAt || item.cookedAt),
    };
  };
  const mapRemoteCookingHistory = (item: FirestoreCookingHistory): CookingHistoryItem => {
    const timestamp = Math.max(
      toSortableTime(item.updatedAt),
      toSortableTime(item.cookedAt)
    );

    return {
      id: item.id,
      dishName: item.dishName || 'Recipe',
      dishImage: item.dishImage || '',
      servingSize: item.servingSize ?? undefined,
      prepTime: item.prepTime ?? undefined,
      cookTime: item.cookTime ?? undefined,
      totalCookTime: item.totalCookTime ?? undefined,
      rating: item.rating ?? undefined,
      publicComment: item.publicComment || undefined,
      changes: item.changes || undefined,
      localImprovements: item.localImprovements || undefined,
      personalTips: item.personalTips || undefined,
      timestamp,
      relativeDate: formatRelativeDate(item.updatedAt || item.cookedAt),
    };
  };
  const mergeCookingHistory = (
    localItems: CookingHistoryItem[],
    remoteItems: CookingHistoryItem[]
  ) => {
    const merged = new Map<string, CookingHistoryItem>();
    localItems.forEach((item) => {
      merged.set(item.id, item);
    });
    remoteItems.forEach((item) => {
      merged.set(item.id, item);
    });
    return [...merged.values()].sort((left, right) => right.timestamp - left.timestamp);
  };
  const getHistoryPreview = (item: CookingHistoryItem) =>
    item.publicComment
    || item.changes
    || item.localImprovements
    || item.personalTips
    || 'No feedback added yet.';

  const mapSavedRecipe = (recipe: SavedRecipeDoc): SavedRecipe => ({
    id: recipe.recipeId || recipe.externalId || recipe.id,
    dishName: recipe.title || 'Recipe',
    dishImage: recipe.imageUrl || '',
    source: recipe.source || undefined,
    creator: recipe.creator || undefined,
    sourceLabel: normalizeSourceLabel(recipe.sourceLabel),
    rating: recipe.rating ?? undefined,
    feedbackCount: recipe.feedbackCount ?? undefined,
  });

  const mapPublishedRecipe = (recipe: FirestoreRecipe): PublishedRecipe => ({
    id: recipe.id,
    dishName: recipe.title || 'Recipe',
    dishImage: recipe.imageUrl || recipe.image || '',
    rating: recipe.rating,
    feedbackCount: recipe.feedbackCount,
  });

  const mapDraftRecipe = (recipe: FirestoreRecipe): DraftRecipe => ({
    id: recipe.id,
    dishName: recipe.title || 'Draft Recipe',
    dishImage: recipe.imageUrl || recipe.image || '',
    status: normalizeStatus(recipe.publishStatus),
  });

  const mapCookbook = (cookbook: FirestoreCookbook): Cookbook => ({
    id: cookbook.id,
    title: cookbook.title,
    coverImage: cookbook.coverImageUrl || '',
    recipeCount: cookbook.recipesCount ?? cookbook.recipes?.length ?? 0,
    isPublished: cookbook.publishStatus === 'approved',
  });

  const mapSavedCookbook = (cookbook: SavedCookbookDoc): Cookbook => ({
    id: cookbook.cookbookId || cookbook.externalId || cookbook.id,
    title: cookbook.title,
    coverImage: cookbook.coverImageUrl || '',
    recipeCount: cookbook.recipesCount ?? 0,
    isPublished: true,
  });

  const getStatusLabel = (status: PublishStatus) => {
    if (status === 'pending') return 'WAITING';
    if (status === 'rejected') return 'REJECTED';
    return 'DRAFT';
  };

  const getStatusColor = (status: PublishStatus) => {
    if (status === 'pending') return COLORS.pastelOrange.main;
    if (status === 'rejected') return COLORS.status.error;
    return COLORS.pastelYellow.main;
  };

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const localHistoryPromise = getCookingHistory();
      const firebaseUser = getFirebaseUser();
      if (!firebaseUser) {
        const localHistory = await localHistoryPromise;
        setCookingHistory(localHistory.map(mapLocalCookingHistory));
        setSavedRecipes([]);
        setPublishedRecipes([]);
        setDraftRecipes([]);
        setPublishedCookbooks([]);
        setSavedCookbooks([]);
        return;
      }

      const results = await Promise.allSettled([
        recipeStore.getUserRecipes(firebaseUser.uid),
        recipeStore.getSavedRecipes(firebaseUser.uid),
        cookbookStore.getUserCookbooks(firebaseUser.uid),
        cookbookStore.getSavedCookbooks(firebaseUser.uid),
        localHistoryPromise,
        cookingHistoryStore.getCookingHistory(firebaseUser.uid),
      ]);

      const labels = [
        'recipes',
        'savedRecipes',
        'cookbooks',
        'savedCookbooks',
        'localCookingHistory',
        'cookingHistory',
      ];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          if (labels[index] === 'cookingHistory' && isPermissionDeniedError(result.reason)) {
            return;
          }
          console.error(`Cookbook dashboard load error (${labels[index]}):`, result.reason);
        }
      });

      const userRecipes = results[0].status === 'fulfilled' ? results[0].value : [];
      const savedRecipeDocs = results[1].status === 'fulfilled' ? results[1].value : [];
      const userCookbooks = results[2].status === 'fulfilled' ? results[2].value : [];
      const savedCookbookDocs = results[3].status === 'fulfilled' ? results[3].value : [];
      const localHistory = results[4].status === 'fulfilled' ? results[4].value : [];
      const remoteHistory = results[5].status === 'fulfilled' ? results[5].value : [];

      const published = userRecipes.filter((recipe) => recipe.publishStatus === 'approved');
      const drafts = userRecipes.filter((recipe) => recipe.publishStatus !== 'approved');
      const publishedUserCookbooks = userCookbooks.filter(
        (cookbook) => (cookbook.publishStatus || 'approved') === 'approved'
      );

      setSavedRecipes(savedRecipeDocs.map(mapSavedRecipe));
      setPublishedRecipes(published.map(mapPublishedRecipe));
      setDraftRecipes(drafts.map(mapDraftRecipe));
      setPublishedCookbooks(publishedUserCookbooks.map(mapCookbook));
      setSavedCookbooks(savedCookbookDocs.map(mapSavedCookbook));
      setCookingHistory(
        mergeCookingHistory(
          localHistory.map(mapLocalCookingHistory),
          remoteHistory.map(mapRemoteCookingHistory)
        )
      );
    } catch (error) {
      console.error('Cookbook dashboard load error:', error);
      try {
        const localHistory = await getCookingHistory();
        setCookingHistory(localHistory.map(mapLocalCookingHistory));
      } catch (historyError) {
        console.error('Cooking history load error:', historyError);
        setCookingHistory([]);
      }
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
    navigation.navigate('RecipeDescription', {
      recipeId: recipe.id,
      recipe: {
        id: recipe.id,
        title: recipe.dishName,
        image: recipe.dishImage,
        imageUrl: recipe.dishImage,
        source: recipe.source,
        ownerName: recipe.creator,
        creator: recipe.creator,
        sourceLabel: recipe.sourceLabel,
        rating: recipe.rating,
        feedbackCount: recipe.feedbackCount,
      },
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
                      buildRemoteImageSource(recipe.dishImage)
                      || require('../../../assets/icons/book.png')
                    }
                    style={styles.savedRecipeImage}
                    resizeMode="cover"
                  />
                  <View style={styles.savedRecipeInfo}>
                    <Text style={styles.savedRecipeName} numberOfLines={2}>
                      {recipe.dishName}
                    </Text>
                    {recipe.creator ? (
                      <Text style={styles.savedRecipeCreator} numberOfLines={1}>
                        Created by {recipe.creator}
                      </Text>
                    ) : recipe.sourceLabel ? (
                      <Text style={styles.savedRecipeCreator} numberOfLines={1}>
                        {recipe.sourceLabel}
                      </Text>
                    ) : null}
                    {(recipe.rating !== undefined || recipe.feedbackCount !== undefined) ? (
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
                    ) : null}
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
                    buildRemoteImageSource(recipe.dishImage)
                    || require('../../../assets/icons/book.png')
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
              <Text style={styles.sectionTitle}>Unpublished & Pending</Text>
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
                      buildRemoteImageSource(recipe.dishImage)
                      || require('../../../assets/icons/book.png')
                    }
                    style={styles.draftRecipeImage}
                    resizeMode="cover"
                  />
                  <View
                    style={[
                      styles.draftBadge,
                      { backgroundColor: getStatusColor(recipe.status) },
                    ]}
                  >
                    <Text style={styles.draftBadgeText}>
                      {getStatusLabel(recipe.status)}
                    </Text>
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
                      : require('../../../assets/icons/book.png')
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock3
              size={scaleFontSize(22)}
              color={COLORS.pastelOrange.dark}
              strokeWidth={2}
              style={styles.sectionIcon}
            />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Cooking History</Text>
              <Text style={styles.sectionCount}>{cookingHistory.length} cooked dishes</Text>
            </View>
          </View>

          <View style={styles.cookingHistoryList}>
            {cookingHistory.length > 0 ? (
              cookingHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <Image
                    source={
                      buildRemoteImageSource(item.dishImage)
                      || require('../../../assets/icons/book.png')
                    }
                    style={styles.historyCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.historyCardContent}>
                    <View style={styles.historyCardHeader}>
                      <Text style={styles.historyCardTitle} numberOfLines={2}>
                        {item.dishName}
                      </Text>
                      <Text style={styles.historyCardDate}>{item.relativeDate}</Text>
                    </View>

                    <View style={styles.historyMetaRow}>
                      {item.servingSize ? (
                        <Text style={styles.historyMetaText}>
                          Serves {item.servingSize}
                        </Text>
                      ) : null}
                      {item.rating ? (
                        <View style={styles.historyRatingRow}>
                          <Star
                            size={scaleFontSize(12)}
                            color={COLORS.pastelOrange.main}
                            strokeWidth={2}
                          />
                          <Text style={styles.historyMetaText}>{item.rating}/5</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.historyTimeRow}>
                      {item.prepTime ? (
                        <View style={styles.historyTimeChip}>
                          <Text style={styles.historyTimeChipText}>
                            Prep {item.prepTime} min
                          </Text>
                        </View>
                      ) : null}
                      {item.cookTime ? (
                        <View style={styles.historyTimeChip}>
                          <Text style={styles.historyTimeChipText}>
                            Cook {item.cookTime} min
                          </Text>
                        </View>
                      ) : null}
                      {item.totalCookTime ? (
                        <View style={styles.historyTimeChip}>
                          <Text style={styles.historyTimeChipText}>
                            Total {item.totalCookTime} min
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.historyPreviewText} numberOfLines={2}>
                      {getHistoryPreview(item)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No cooked dishes in history yet.</Text>
                </View>
              )
            )}
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
  cookingHistoryList: {
    paddingHorizontal: moderateScale(SPACING.base),
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: moderateScale(SPACING.md),
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  historyCardImage: {
    width: moderateScale(96),
    height: '100%',
    minHeight: moderateScale(132),
    backgroundColor: COLORS.background.tertiary,
  },
  historyCardContent: {
    flex: 1,
    padding: moderateScale(SPACING.md),
  },
  historyCardHeader: {
    marginBottom: moderateScale(SPACING.xs),
  },
  historyCardTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  historyCardDate: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.tertiary,
  },
  historyMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.sm),
  },
  historyRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  historyMetaText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  historyTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.sm),
  },
  historyTimeChip: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
  },
  historyTimeChipText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  historyPreviewText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
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

