// src/features/cookbook/screens/DigitalCookbookScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

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
  const [activeTab, setActiveTab] = useState<'published' | 'saved'>('published');

  // Mock Data
  const savedRecipes: SavedRecipe[] = [
    {
      id: '1',
      dishName: 'Coconut Fish Curry',
      dishImage: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      creator: 'Chef Rohan',
      rating: 4.8,
    },
    {
      id: '2',
      dishName: 'Chicken Kottu',
      dishImage: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800',
      creator: 'Amara Kitchen',
      rating: 4.9,
    },
    {
      id: '3',
      dishName: 'Vegetable Biryani',
      dishImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      creator: 'Spice Masters',
      rating: 4.7,
    },
  ];

  const publishedRecipes: PublishedRecipe[] = [
    {
      id: '1',
      dishName: 'My Special Pol Sambol',
      dishImage: 'https://images.unsplash.com/photo-1596040033229-a0b9ce3f9c41?w=800',
      rating: 4.9,
      feedbackCount: 127,
    },
    {
      id: '2',
      dishName: 'Traditional Dhal Curry',
      dishImage: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
      rating: 4.8,
      feedbackCount: 89,
    },
  ];

  const draftRecipes: DraftRecipe[] = [
    {
      id: '1',
      dishName: 'Experimental Fusion Curry',
      dishImage: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
    },
    {
      id: '2',
      dishName: 'Grandmother\'s Secret Recipe',
      dishImage: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    },
  ];

  const publishedCookbooks: Cookbook[] = [
    {
      id: '1',
      title: 'My Sri Lankan Favorites',
      coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
      recipeCount: 15,
      isPublished: true,
    },
  ];

  const savedCookbooks: Cookbook[] = [
    {
      id: '1',
      title: 'Flavors of Sri Lanka',
      coverImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
      recipeCount: 25,
      isPublished: false,
    },
    {
      id: '2',
      title: 'Quick & Easy Lankan',
      coverImage: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600',
      recipeCount: 20,
      isPublished: false,
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Digital Cookbook</Text>
          <Text style={styles.headerSubtitle}>Your culinary collection</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Saved Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🗂</Text>
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
            {savedRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.savedRecipeCard}
                onPress={() => handleSavedRecipePress(recipe)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: recipe.dishImage }}
                  style={styles.savedRecipeImage}
                  resizeMode="cover"
                />
                <View style={styles.savedRecipeInfo}>
                  <Text style={styles.savedRecipeName} numberOfLines={2}>
                    {recipe.dishName}
                  </Text>
                  <Text style={styles.savedRecipeCreator} numberOfLines={1}>
                    by {recipe.creator}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.ratingText}>{recipe.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Published Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌍</Text>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Published Recipes</Text>
              <Text style={styles.sectionCount}>{publishedRecipes.length} recipes</Text>
            </View>
          </View>

          {publishedRecipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.publishedRecipeCard}
              onPress={() => handlePublishedRecipePress(recipe)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: recipe.dishImage }}
                style={styles.publishedRecipeImage}
                resizeMode="cover"
              />
              <View style={styles.publishedRecipeInfo}>
                <Text style={styles.publishedRecipeName} numberOfLines={2}>
                  {recipe.dishName}
                </Text>
                <View style={styles.publishedRecipeStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={styles.statText}>{recipe.rating}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>💬</Text>
                    <Text style={styles.statText}>{recipe.feedbackCount}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.arrowIcon}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Draft Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🧪</Text>
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
            {draftRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.draftRecipeCard}
                onPress={() => handleDraftRecipePress(recipe)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: recipe.dishImage }}
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
            ))}
          </ScrollView>
        </View>

        {/* My Cookbooks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📚</Text>
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
            {(activeTab === 'published' ? publishedCookbooks : savedCookbooks).map((cookbook) => (
              <TouchableOpacity
                key={cookbook.id}
                style={styles.cookbookCard}
                onPress={() => handleCookbookPress(cookbook)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: cookbook.coverImage }}
                  style={styles.cookbookCover}
                  resizeMode="cover"
                />
                <View style={styles.cookbookInfo}>
                  <Text style={styles.cookbookTitle} numberOfLines={2}>
                    {cookbook.title}
                  </Text>
                  <Text style={styles.cookbookCount}>
                    {cookbook.recipeCount} recipes
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            ))}
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
              ✨ Create Your Cookbook
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
  headerContent: {},
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
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
    fontSize: scaleFontSize(28),
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
  starIcon: {
    fontSize: scaleFontSize(14),
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
    fontSize: scaleFontSize(14),
    marginRight: moderateScale(4),
  },
  statText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  arrowIcon: {
    fontSize: scaleFontSize(32),
    color: COLORS.text.tertiary,
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
});

export default DigitalCookbookScreen;
