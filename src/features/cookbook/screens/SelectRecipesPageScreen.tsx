// src/features/cookbook/screens/SelectRecipesPageScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import { getCurrentUser } from '../../../services/firebase/authService';

interface SelectRecipesPageScreenProps {
  navigation: any;
}

interface RecipeCard {
  id: string;
  title: string;
  image?: string;
  isPublished: boolean;
}

const SelectRecipesPageScreen: React.FC<SelectRecipesPageScreenProps> = ({ navigation }) => {
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [allRecipes, setAllRecipes] = useState<RecipeCard[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  const mapRecipeCard = (recipe: Recipe): RecipeCard => ({
    id: recipe.id,
    title: recipe.title,
    image: recipe.imageUrl || recipe.image,
    isPublished: recipe.isPublished ?? false,
  });

  const loadRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const user = await getCurrentUser();
      const response = await recipeService.getRecipes({
        limit: 50,
        ownerId: user?.uid,
      });
      const recipes = response.data.recipes || [];
      setAllRecipes(recipes.map(mapRecipeCard));
    } catch (error) {
      console.error('Recipe selection load error:', error);
      setAllRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

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
    const selectedRecipesData = allRecipes.filter((recipe) => selectedRecipes.has(recipe.id));
    
    navigation.navigate('CookbookCoverSetup', {
      selectedRecipes: selectedRecipesData,
    });
  };

  const handleSelectAll = () => {
    if (selectedRecipes.size === allRecipes.length) {
      setSelectedRecipes(new Set());
    } else {
      setSelectedRecipes(new Set(allRecipes.map((recipe) => recipe.id)));
    }
  };

  const selectedCount = selectedRecipes.size;
  const canProceed = selectedCount >= 10;

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

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
        <Text style={styles.headerTitle}>Select Recipes</Text>
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
        {loadingRecipes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>Loading recipes...</Text>
          </View>
        ) : allRecipes.length > 0 ? (
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
                        <Check size={scaleFontSize(16)} color={COLORS.text.white} strokeWidth={3} />
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
                    source={
                      recipe.image
                        ? { uri: recipe.image }
                        : require('../../../assets/icon.png')
                    }
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
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No recipes available to select.</Text>
          </View>
        )}

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
          {canProceed ? `Next (${selectedCount} selected)` : `Select ${10 - selectedCount} more`}
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
});

export default SelectRecipesPageScreen;
