// src/features/community/screens/DigitalCommitteeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';

interface DigitalCommitteeScreenProps {
  navigation: any;
}

interface CommunityRecipe {
  id: string;
  title: string;
  creator: string;
  creatorAvatar: string;
  image: string;
  description: string;
  rating: number;
  comments: number;
  category: string;
}

interface Cookbook {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  rating: number;
  recipesCount: number;
}

const DigitalCommitteeScreen: React.FC<DigitalCommitteeScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const filters = ['All', 'Sweet', 'Savory', 'Vegan', 'Spicy', 'Traditional', 'Healthy', 'Desserts'];

  const popularRecipes: CommunityRecipe[] = [
    {
      id: '1',
      title: 'Grandmother\'s Secret Coconut Sambol',
      creator: 'Amara Perera',
      creatorAvatar: 'https://i.pravatar.cc/150?img=1',
      image: 'https://images.unsplash.com/photo-1596040033229-a0b9ce3f9c41?w=800',
      description: 'Traditional Sri Lankan coconut sambol passed down through generations',
      rating: 4.9,
      comments: 247,
      category: 'Traditional',
    },
    {
      id: '2',
      title: 'Spicy Devilled Chicken',
      creator: 'Kasun Silva',
      creatorAvatar: 'https://i.pravatar.cc/150?img=2',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800',
      description: 'Fiery and flavorful chicken dish perfect for spice lovers',
      rating: 4.8,
      comments: 189,
      category: 'Spicy',
    },
    {
      id: '3',
      title: 'Healthy Buddha Bowl',
      creator: 'Nisha Fernando',
      creatorAvatar: 'https://i.pravatar.cc/150?img=3',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
      description: 'Nutritious and colorful bowl packed with goodness',
      rating: 4.7,
      comments: 156,
      category: 'Healthy',
    },
    {
      id: '4',
      title: 'Vegan Jackfruit Curry',
      creator: 'Dilshan Raj',
      creatorAvatar: 'https://i.pravatar.cc/150?img=4',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
      description: 'Plant-based curry that tastes like meat!',
      rating: 4.9,
      comments: 203,
      category: 'Vegan',
    },
  ];

  const popularCookbooks: Cookbook[] = [
    {
      id: '1',
      title: 'Flavors of Sri Lanka',
      author: 'Chef Rohan Mendis',
      coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
      rating: 4.9,
      recipesCount: 25,
    },
    {
      id: '2',
      title: 'Healthy Lankan Kitchen',
      author: 'Dr. Priya Gunasekara',
      coverImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
      rating: 4.8,
      recipesCount: 30,
    },
    {
      id: '3',
      title: 'Quick & Easy Sri Lankan',
      author: 'Sachini Jayawardena',
      coverImage: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600',
      rating: 4.7,
      recipesCount: 20,
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleRecipePress = (recipe: CommunityRecipe) => {
    navigation.navigate('RecipeDescription', { recipe });
  };

  const handleCookbookPress = (cookbook: Cookbook) => {
    navigation.navigate('CookbookReference', { cookbook });
  };

  const handleNotification = () => {
    // TODO: Navigate to notifications
  };

  const handleProfile = () => {
    navigation.navigate('ProfileSettings');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleProfile}>
            <Image
              source={require('../../../assets/icons/user.png')}
              style={styles.profileAvatar}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Digital Committee</Text>
            <Text style={styles.greetingSubtext}>Community & Cookbooks</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotification}
        >
          <Image
            source={require('../../../assets/icons/bell.png')}
            style={styles.notificationIcon}
            resizeMode="contain"
          />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.pastelOrange.main}
          />
        }
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
              placeholder="Search community recipes or cookbooks"
              placeholderTextColor={COLORS.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Most Popular Recipes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Most Popular Recipes</Text>
            <Text style={styles.sectionSubtitle}>From our community</Text>
          </View>

          {popularRecipes.map((recipe) => (
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
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {recipe.title}
                </Text>
                
                <View style={styles.creatorRow}>
                  <Image
                    source={{ uri: recipe.creatorAvatar }}
                    style={styles.creatorAvatar}
                    resizeMode="cover"
                  />
                  <Text style={styles.creatorName}>{recipe.creator}</Text>
                </View>

                <Text style={styles.recipeDescription} numberOfLines={2}>
                  {recipe.description}
                </Text>

                <View style={styles.recipeStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.statText}>{recipe.rating}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.commentIcon}>💬</Text>
                    <Text style={styles.statText}>{recipe.comments}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{recipe.category}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Cookbooks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Cookbooks</Text>
            <Text style={styles.sectionSubtitle}>Curated collections</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cookbookScroll}
          >
            {popularCookbooks.map((cookbook) => (
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
                  <Text style={styles.cookbookAuthor} numberOfLines={1}>
                    {cookbook.author}
                  </Text>
                  <View style={styles.cookbookStats}>
                    <View style={styles.cookbookStat}>
                      <Text style={styles.starIcon}>⭐</Text>
                      <Text style={styles.cookbookRating}>{cookbook.rating}</Text>
                    </View>
                    <Text style={styles.recipeCount}>
                      {cookbook.recipesCount} recipes
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.header,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    ...SHADOWS.small,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 2,
    borderColor: COLORS.pastelOrange.main,
  },
  greetingContainer: {
    marginLeft: moderateScale(SPACING.md),
    flex: 1,
  },
  greetingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  greetingSubtext: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  notificationButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: COLORS.pastelOrange.dark,
  },
  notificationBadge: {
    position: 'absolute',
    top: moderateScale(6),
    right: moderateScale(6),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.status.error,
    borderWidth: 1.5,
    borderColor: COLORS.background.white,
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
  filterSection: {
    marginTop: moderateScale(SPACING.lg),
  },
  filterScroll: {
    paddingLeft: moderateScale(SPACING.base),
    paddingRight: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.sm),
  },
  filterChip: {
    paddingHorizontal: moderateScale(SPACING.lg),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.white,
    borderWidth: 1.5,
    borderColor: COLORS.border.light,
  },
  filterChipActive: {
    backgroundColor: COLORS.pastelOrange.main,
    borderColor: COLORS.pastelOrange.main,
  },
  filterChipText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
  },
  filterChipTextActive: {
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  section: {
    marginTop: moderateScale(SPACING['2xl']),
  },
  sectionHeader: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  recipeImage: {
    width: moderateScale(120),
    height: moderateScale(140),
  },
  recipeInfo: {
    flex: 1,
    padding: moderateScale(SPACING.md),
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.xs),
  },
  creatorAvatar: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    marginRight: moderateScale(SPACING.xs),
  },
  creatorName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  recipeDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.sm),
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.md),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: scaleFontSize(14),
    marginRight: moderateScale(4),
  },
  commentIcon: {
    fontSize: scaleFontSize(14),
    marginRight: moderateScale(4),
  },
  statText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  categoryBadge: {
    backgroundColor: COLORS.pastelGreen.light,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(4),
    borderRadius: BORDER_RADIUS.xs,
    marginLeft: 'auto',
  },
  categoryText: {
    fontSize: scaleFontSize(10),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelGreen.dark,
  },
  cookbookScroll: {
    paddingLeft: moderateScale(SPACING.base),
    paddingRight: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.md),
  },
  cookbookCard: {
    width: moderateScale(180),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cookbookCover: {
    width: '100%',
    height: moderateScale(220),
  },
  cookbookInfo: {
    padding: moderateScale(SPACING.md),
  },
  cookbookTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  cookbookAuthor: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.sm),
  },
  cookbookStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cookbookStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cookbookRating: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  recipeCount: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default DigitalCommitteeScreen;
