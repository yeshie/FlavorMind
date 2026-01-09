// src/features/cookbook/screens/SelectRecipesPageScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface SelectRecipesPageScreenProps {
  navigation: any;
}

interface Recipe {
  id: string;
  title: string;
  image: string;
  isPublished: boolean;
}

const SelectRecipesPageScreen: React.FC<SelectRecipesPageScreenProps> = ({ navigation }) => {
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());

  // Mock recipes - published and drafts
  const allRecipes: Recipe[] = [
    {
      id: '1',
      title: 'Traditional Fish Curry',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
      isPublished: true,
    },
    {
      id: '2',
      title: 'Coconut Sambol',
      image: 'https://images.unsplash.com/photo-1596040033229-a0b9ce3f9c41?w=400',
      isPublished: true,
    },
    {
      id: '3',
      title: 'Chicken Curry',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
      isPublished: false,
    },
    {
      id: '4',
      title: 'Dhal Curry',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
      isPublished: true,
    },
    {
      id: '5',
      title: 'Pumpkin Curry',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
      isPublished: false,
    },
    {
      id: '6',
      title: 'Vegetable Stir Fry',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      isPublished: true,
    },
    {
      id: '7',
      title: 'Egg Hoppers',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
      isPublished: true,
    },
    {
      id: '8',
      title: 'Kottu Roti',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
      isPublished: false,
    },
    {
      id: '9',
      title: 'Devilled Chicken',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
      isPublished: true,
    },
    {
      id: '10',
      title: 'Pol Roti',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
      isPublished: true,
    },
    {
      id: '11',
      title: 'Parippu',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
      isPublished: false,
    },
    {
      id: '12',
      title: 'Watalappan',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
      isPublished: true,
    },
  ];

  const toggleRecipeSelection = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
  };

  const handleNext = () => {
    if (selectedRecipes.size < 10) {
      Alert.alert(
        'Minimum Required',
        `Please select at least 10 recipes. You have selected ${selectedRecipes.size}.`
      );
      return;
    }

    // Get selected recipes data
    const selectedRecipesData = allRecipes.filter(r => selectedRecipes.has(r.id));
    
    navigation.navigate('CookbookCoverSetup', {
      selectedRecipes: selectedRecipesData,
    });
  };

  const handleSelectAll = () => {
    if (selectedRecipes.size === allRecipes.length) {
      setSelectedRecipes(new Set());
    } else {
      setSelectedRecipes(new Set(allRecipes.map(r => r.id)));
    }
  };

  const selectedCount = selectedRecipes.size;
  const canProceed = selectedCount >= 10;

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
          <Text style={styles.headerTitle}>Select Recipes</Text>
          <Text style={styles.headerSubtitle}>Choose at least 10 recipes for your cookbook</Text>
        </View>
      </View>

      {/* Selection Counter */}
      <View style={styles.counterBar}>
        <View style={styles.counterLeft}>
          <Text style={styles.counterNumber}>{selectedCount}</Text>
          <Text style={styles.counterText}>
            {selectedCount === 1 ? 'recipe' : 'recipes'} selected
          </Text>
        </View>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={handleSelectAll}
          activeOpacity={0.7}
        >
          <Text style={styles.selectAllText}>
            {selectedRecipes.size === allRecipes.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      {selectedCount < 10 && (
        <View style={styles.progressBar}>
          <View style={styles.progressIndicator}>
            <View style={[styles.progressFill, { width: `${(selectedCount / 10) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {10 - selectedCount} more {10 - selectedCount === 1 ? 'recipe' : 'recipes'} needed
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.recipesGrid}>
          {allRecipes.map((recipe) => {
            const isSelected = selectedRecipes.has(recipe.id);
            
            return (
              <TouchableOpacity
                key={recipe.id}
                style={[
                  styles.recipeCard,
                  isSelected && styles.recipeCardSelected,
                ]}
                onPress={() => toggleRecipeSelection(recipe.id)}
                activeOpacity={0.9}
              >
                {/* Selection Checkbox */}
                <View style={styles.checkboxContainer}>
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>

                {/* Status Badge */}
                {!recipe.isPublished && (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>DRAFT</Text>
                  </View>
                )}

                {/* Recipe Image */}
                <Image
                  source={{ uri: recipe.image }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />

                {/* Recipe Title */}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={handleNext}
          disabled={!canProceed}
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
        >
          {canProceed ? `Next (${selectedCount} selected) →` : `Select ${10 - selectedCount} more`}
        </Button>
      </View>
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
  counterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.md),
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  counterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.main,
    marginRight: moderateScale(SPACING.sm),
  },
  counterText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  selectAllButton: {
    backgroundColor: COLORS.pastelOrange.light,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.sm,
  },
  selectAllText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.pastelOrange.dark,
  },
  progressBar: {
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.md),
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  progressIndicator: {
    height: moderateScale(8),
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: moderateScale(SPACING.sm),
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.pastelGreen.main,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: moderateScale(SPACING.lg),
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.md),
  },
  recipeCard: {
    width: '48%',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  recipeCardSelected: {
    borderColor: COLORS.pastelGreen.main,
    ...SHADOWS.medium,
  },
  checkboxContainer: {
    position: 'absolute',
    top: moderateScale(SPACING.sm),
    left: moderateScale(SPACING.sm),
    zIndex: 1,
  },
  checkbox: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: COLORS.background.white,
    borderWidth: 2,
    borderColor: COLORS.border.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  checkboxSelected: {
    backgroundColor: COLORS.pastelGreen.main,
    borderColor: COLORS.pastelGreen.main,
  },
  checkmark: {
    color: COLORS.text.white,
    fontSize: scaleFontSize(18),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  draftBadge: {
    position: 'absolute',
    top: moderateScale(SPACING.sm),
    right: moderateScale(SPACING.sm),
    backgroundColor: COLORS.pastelYellow.main,
    paddingHorizontal: moderateScale(SPACING.xs),
    paddingVertical: moderateScale(4),
    borderRadius: BORDER_RADIUS.xs,
    zIndex: 1,
  },
  draftBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  recipeImage: {
    width: '100%',
    height: moderateScale(140),
  },
  recipeInfo: {
    padding: moderateScale(SPACING.md),
  },
  recipeTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  footer: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.medium,
  },
  nextButton: {},
  nextButtonDisabled: {
    opacity: 0.5,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SelectRecipesPageScreen;