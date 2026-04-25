// src/features/community/screens/CookbookRecipePageScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  ChefHat,
  ClipboardList,
  Clock,
  Flame,
  Lightbulb,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import recipeStore, { FirestoreRecipe } from '../../../services/firebase/recipeStore';

interface CookbookRecipePageScreenProps {
  navigation: any;
  route: {
    params: {
      cookbook: any;
      recipeIndex: number;
    };
  };
}

interface CookbookRecipe {
  id: string;
  title: string;
  image?: string;
  description: string;
  notes: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
}

const normalizeCookbookRecipe = (recipe: FirestoreRecipe | any): CookbookRecipe => {
  const instructions = Array.isArray(recipe?.instructions)
    ? recipe.instructions
        .map((item: any) =>
          typeof item === 'string'
            ? item
            : item?.description || item?.instruction || item?.text || ''
        )
        .filter(Boolean)
    : [];

  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
        .map((item: any) =>
          typeof item === 'string'
            ? item
            : [item?.quantity, item?.unit, item?.name || item?.ingredient]
                .filter(Boolean)
                .join(' ')
                .trim()
        )
        .filter(Boolean)
    : [];

  return {
    id: recipe?.id || recipe?.recipeId || recipe?.title || 'recipe',
    title: recipe?.title || recipe?.name || 'Cookbook Recipe',
    image: recipe?.imageUrl || recipe?.image || '',
    description: recipe?.description || 'A recipe from this community cookbook.',
    notes: instructions.length ? instructions : ingredients,
    prepTime: Number(recipe?.prepTime || 0),
    cookTime: Number(recipe?.cookTime || 0),
    servings: Number(recipe?.servings || 1),
  };
};

const CookbookRecipePageScreen: React.FC<CookbookRecipePageScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { cookbook, recipeIndex = 0 } = route.params;
  const recipeRefs = useMemo(
    () => (Array.isArray(cookbook?.recipes) ? cookbook.recipes : []),
    [cookbook]
  );
  const embeddedRecipes = useMemo(
    () =>
      recipeRefs
        .filter((item: any) => item && typeof item === 'object')
        .map(normalizeCookbookRecipe),
    [recipeRefs]
  );
  const [loadedRecipes, setLoadedRecipes] = useState<CookbookRecipe[]>(embeddedRecipes);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  useEffect(() => {
    const recipeIds = recipeRefs.filter(
      (item: any): item is string => typeof item === 'string' && item.trim().length > 0
    );
    if (recipeIds.length === 0) {
      setLoadedRecipes(embeddedRecipes);
      return;
    }

    let isActive = true;
    setLoadingRecipes(true);

    Promise.all(recipeIds.map((id: string) => recipeStore.getRecipeById(id).catch(() => null)))
      .then((items) => {
        if (!isActive) return;
        const recipesFromStore = items.filter(Boolean).map((item) => normalizeCookbookRecipe(item));
        setLoadedRecipes([...embeddedRecipes, ...recipesFromStore]);
      })
      .finally(() => {
        if (isActive) {
          setLoadingRecipes(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [embeddedRecipes, recipeRefs]);

  const recipes = loadedRecipes;
  const safeRecipeIndex = recipes.length ? Math.min(recipeIndex, recipes.length - 1) : 0;
  const currentRecipe = recipes[safeRecipeIndex];
  const isLastRecipe = recipes.length === 0 || safeRecipeIndex >= recipes.length - 1;
  const isFirstRecipe = safeRecipeIndex === 0;

  const handleBack = () => {
    if (safeRecipeIndex > 0) {
      navigation.navigate('CookbookRecipePage', {
        cookbook,
        recipeIndex: safeRecipeIndex - 1,
      });
    } else {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (isLastRecipe) {
      navigation.navigate('CookbookThankYou', { cookbook });
    } else {
      navigation.navigate('CookbookRecipePage', {
        cookbook,
        recipeIndex: safeRecipeIndex + 1,
      });
    }
  };

  const handleRecreate = () => {
    if (!currentRecipe) return;
    navigation.navigate('RecipeCustomization', {
      dishId: currentRecipe.id,
      dishName: currentRecipe.title,
      recipe: currentRecipe,
      fromCookbook: true,
      cookbookTitle: cookbook.title,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <View style={styles.backButtonContent}>
            <ArrowLeft size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
            <Text style={styles.backButtonText}>
              {isFirstRecipe ? 'Back' : 'Previous'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.pageIndicatorContainer}>
          <Text style={styles.pageIndicator}>
            Recipe {recipes.length ? safeRecipeIndex + 1 : 0} of {recipes.length}
          </Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loadingRecipes && !currentRecipe ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>Loading cookbook recipes...</Text>
          </View>
        ) : !currentRecipe ? (
          <View style={styles.content}>
            <Text style={styles.recipeTitle}>No Recipes Available</Text>
            <Text style={styles.recipeDescription}>
              This cookbook does not have readable recipes attached yet.
            </Text>
          </View>
        ) : (
        <View style={styles.content}>
          {/* Recipe Title */}
          <Text style={styles.recipeTitle}>{currentRecipe.title}</Text>
          
          {/* Recipe Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={scaleFontSize(16)} color={COLORS.text.secondary} strokeWidth={2} style={styles.metaIcon} />
              <Text style={styles.metaText}>{currentRecipe.prepTime} min prep</Text>
            </View>
            <View style={styles.metaItem}>
              <Flame size={scaleFontSize(16)} color={COLORS.pastelOrange.main} strokeWidth={2} style={styles.metaIcon} />
              <Text style={styles.metaText}>{currentRecipe.cookTime} min cook</Text>
            </View>
            <View style={styles.metaItem}>
              <Utensils size={scaleFontSize(16)} color={COLORS.text.secondary} strokeWidth={2} style={styles.metaIcon} />
              <Text style={styles.metaText}>{currentRecipe.servings} servings</Text>
            </View>
          </View>

          {/* Recipe Image */}
          <Image
            source={
              currentRecipe.image
                ? { uri: currentRecipe.image }
                : require('../../../assets/icon.png')
            }
            style={styles.recipeImage}
            resizeMode="cover"
          />

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionLabel}>About This Dish</Text>
            <Text style={styles.recipeDescription}>
              {currentRecipe.description}
            </Text>
          </View>

          {/* Key Notes Section */}
          <View style={styles.notesSection}>
            <View style={styles.notesSectionHeader}>
              <ClipboardList size={scaleFontSize(20)} color={COLORS.pastelOrange.main} strokeWidth={2} style={styles.notesIcon} />
              <Text style={styles.notesTitle}>Key Notes for Success</Text>
            </View>
            
            {(currentRecipe.notes.length ? currentRecipe.notes : ['No steps were added for this recipe yet.']).map((note, index) => (
              <View key={index} style={styles.noteItem}>
                <View style={styles.noteNumberBadge}>
                  <Text style={styles.noteNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </View>

          {/* Pro Tip Box */}
          <View style={styles.proTipBox}>
            <Lightbulb size={scaleFontSize(22)} color={COLORS.pastelYellow.main} strokeWidth={2} style={styles.proTipIcon} />
            <View style={styles.proTipContent}>
              <Text style={styles.proTipTitle}>Pro Tip</Text>
              <Text style={styles.proTipText}>
                Take your time with each step. The best dishes come from patience 
                and attention to detail. Don't rush the process!
              </Text>
            </View>
          </View>

          {/* Navigation Hint */}
          <View style={styles.navigationHint}>
            {isLastRecipe ? (
              <View style={styles.navigationHintRow}>
                <Sparkles size={scaleFontSize(18)} color={COLORS.pastelOrange.main} strokeWidth={2} />
                <Text style={styles.navigationHintText}>
                  This is the last recipe. Ready to finish?
                </Text>
              </View>
            ) : (
              <View style={styles.navigationHintRow}>
                <BookOpen size={scaleFontSize(18)} color={COLORS.text.secondary} strokeWidth={2} />
                <Text style={styles.navigationHintText}>
                  {recipes.length - safeRecipeIndex - 1} more {recipes.length - safeRecipeIndex - 1 === 1 ? 'recipe' : 'recipes'} to discover!
                </Text>
              </View>
            )}
          </View>
        </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleRecreate}
          disabled={!currentRecipe}
          activeOpacity={0.7}
        >
          <ChefHat size={scaleFontSize(18)} color={COLORS.text.primary} strokeWidth={2} style={styles.secondaryButtonIcon} />
          <Text style={styles.secondaryButtonText}>Recreate</Text>
        </TouchableOpacity>
        
        <Button
          variant="primary"
          size="medium"
          onPress={handleNext}
          style={styles.nextButton}
        >
          {isLastRecipe ? 'Finish' : 'Next'}
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
  backButton: {
    padding: moderateScale(SPACING.xs),
    flex: 1,
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
  pageIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pageIndicator: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    backgroundColor: COLORS.pastelOrange.light,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
  },
  placeholder: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(SPACING['4xl']),
  },
  content: {
    padding: moderateScale(SPACING.base),
  },
  loadingContainer: {
    padding: moderateScale(SPACING['2xl']),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(SPACING.md),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
  },
  recipeTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.lg),
    lineHeight: scaleFontSize(TYPOGRAPHY.fontSize['3xl']) * 1.2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.xl),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.small,
  },
  metaIcon: {
    marginRight: moderateScale(SPACING.xs),
  },
  metaText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  recipeImage: {
    width: '100%',
    height: moderateScale(280),
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: moderateScale(SPACING.xl),
    ...SHADOWS.medium,
  },
  descriptionSection: {
    marginBottom: moderateScale(SPACING.xl),
  },
  sectionLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: moderateScale(SPACING.sm),
  },
  recipeDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontStyle: 'italic',
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pastelOrange.main,
    ...SHADOWS.small,
  },
  notesSection: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: moderateScale(SPACING.xl),
    ...SHADOWS.medium,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.md),
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border.light,
  },
  notesIcon: {
    marginRight: moderateScale(SPACING.md),
  },
  notesTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.lg),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  noteNumberBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.pastelGreen.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
    marginTop: moderateScale(2),
  },
  noteNumber: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  noteText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
  },
  proTipBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelYellow.light,
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: moderateScale(SPACING.lg),
    borderWidth: 2,
    borderColor: COLORS.pastelYellow.main,
  },
  proTipIcon: {
    marginRight: moderateScale(SPACING.md),
    marginTop: moderateScale(4),
  },
  proTipContent: {
    flex: 1,
  },
  proTipTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  proTipText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  navigationHint: {
    backgroundColor: COLORS.pastelGreen.light + '30',
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelGreen.light,
  },
  navigationHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
  },
  navigationHintText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: moderateScale(SPACING.md),
    ...SHADOWS.medium,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1.5,
    borderColor: COLORS.border.main,
  },
  secondaryButtonIcon: {
    marginRight: moderateScale(SPACING.xs),
  },
  secondaryButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  nextButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default CookbookRecipePageScreen;
