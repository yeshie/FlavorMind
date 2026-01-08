// src/features/adaptation/screens/LocalAdaptationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';

interface LocalAdaptationScreenProps {
  navigation: any;
}

interface SeasonalFood {
  id: string;
  name: string;
  image: string;
  season: string;
  availability: string;
}

const LocalAdaptationScreen: React.FC<LocalAdaptationScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const seasonalFoods: SeasonalFood[] = [
    {
      id: '1',
      name: 'Rambutan',
      image: 'https://images.unsplash.com/photo-1580990758000-33f5b22e5da6?w=400',
      season: 'Now in Season',
      availability: 'Peak Season',
    },
    {
      id: '2',
      name: 'Mango',
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
      season: 'Peak Season',
      availability: 'Abundant',
    },
    {
      id: '3',
      name: 'Jackfruit',
      image: 'https://images.unsplash.com/photo-1603893211657-cde8a0d50e80?w=400',
      season: 'Available Now',
      availability: 'In Season',
    },
    {
      id: '4',
      name: 'Moringa',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      season: 'Year Round',
      availability: 'Always Available',
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // TODO: Implement search
      console.log('Searching for:', searchQuery);
    }
  };

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleLibrary = () => {
    navigation.navigate('RecipeLibrary');
  };

  const handleSeasonalFoodPress = (food: SeasonalFood) => {
    navigation.navigate('SeasonalFood', { food });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Local Adaptation</Text>
          <Text style={styles.headerSubtitle}>
            Cook with seasonal & locally available ingredients
          </Text>
        </View>
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
              <Text style={styles.actionButtonIconText}>➕</Text>
            </View>
            <Text style={styles.actionButtonText}>Add Your Own Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLibrary}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>📚</Text>
            </View>
            <Text style={styles.actionButtonText}>Library</Text>
          </TouchableOpacity>
        </View>

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
            {seasonalFoods.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.seasonalCard}
                onPress={() => handleSeasonalFoodPress(food)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: food.image }}
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
            ))}
          </ScrollView>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsIcon}>💡</Text>
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
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    gap: moderateScale(SPACING.md),
  },
  actionButton: {
    flex: 1,
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
  actionButtonIconText: {
    fontSize: scaleFontSize(20),
  },
  actionButtonText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
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
    fontSize: scaleFontSize(32),
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