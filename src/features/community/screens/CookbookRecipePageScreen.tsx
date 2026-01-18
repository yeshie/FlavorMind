// src/features/community/screens/CookbookRecipePageScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface CookbookRecipePageScreenProps {
  navigation: any;
  route: {
    params: {
      cookbook: any;
      recipeIndex: number;
    };
  };
}

const CookbookRecipePageScreen: React.FC<CookbookRecipePageScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { cookbook, recipeIndex = 0 } = route.params;
  
  // Mock cookbook recipes - In production, this comes from cookbook.recipes
  const recipes = [
    {
      id: '1',
      title: 'Traditional Chicken Curry',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800',
      description: 'A rich and aromatic curry that captures the essence of Sri Lankan home cooking. This recipe uses bone-in chicken pieces cooked slowly with roasted curry powder, coconut milk, and a blend of traditional spices.',
      notes: [
        'Use bone-in chicken pieces for maximum flavor and tender meat',
        'Toast the curry powder in a dry pan before adding to enhance the aroma',
        'Let the curry simmer on low heat - patience is key to developing flavors',
        'Add pandan leaves if available for an authentic touch',
      ],
      prepTime: 45,
      cookTime: 60,
      servings: 4,
    },
    {
      id: '2',
      title: 'Pol Sambol (Coconut Relish)',
      image: 'https://images.unsplash.com/photo-1596040033229-a0b9ce3f9c41?w=800',
      description: 'A fiery and flavorful coconut relish that is a staple in every Sri Lankan household. Made with freshly grated coconut, dried chili, and lime juice, this sambol pairs perfectly with rice and curry.',
      notes: [
        'Fresh coconut is essential - avoid using desiccated coconut',
        'Adjust dried chili flakes according to your heat preference',
        'The sambol should be slightly moist, not dry',
        'Best consumed fresh on the same day it\'s made',
      ],
      prepTime: 15,
      cookTime: 0,
      servings: 6,
    },
    {
      id: '3',
      title: 'Parippu (Red Lentil Curry)',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
      description: 'A creamy and comforting lentil curry that is both nutritious and delicious. This protein-rich dish is finished with a tempered mix of onions, curry leaves, and spices.',
      notes: [
        'Soak red lentils for 30 minutes for faster cooking',
        'Mash some of the cooked lentils for a creamier texture',
        'Add the tempered spices at the very end to preserve their aroma',
        'Perfect as a protein-rich side dish with rice',
      ],
      prepTime: 10,
      cookTime: 30,
      servings: 4,
    },
  ];

  const currentRecipe = recipes[recipeIndex];
  const isLastRecipe = recipeIndex >= recipes.length - 1;
  const isFirstRecipe = recipeIndex === 0;

  const handleBack = () => {
    if (recipeIndex > 0) {
      navigation.navigate('CookbookRecipePage', {
        cookbook,
        recipeIndex: recipeIndex - 1,
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
        recipeIndex: recipeIndex + 1,
      });
    }
  };

  const handleRecreate = () => {
    navigation.navigate('RecipeCustomization', {
      dishId: currentRecipe.id,
      dishName: currentRecipe.title,
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
          <Text style={styles.backButtonText}>
            ← {isFirstRecipe ? 'Back' : 'Previous'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.pageIndicatorContainer}>
          <Text style={styles.pageIndicator}>
            Recipe {recipeIndex + 1} of {recipes.length}
          </Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Recipe Title */}
          <Text style={styles.recipeTitle}>{currentRecipe.title}</Text>
          
          {/* Recipe Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{currentRecipe.prepTime} min prep</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🔥</Text>
              <Text style={styles.metaText}>{currentRecipe.cookTime} min cook</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🍽️</Text>
              <Text style={styles.metaText}>{currentRecipe.servings} servings</Text>
            </View>
          </View>

          {/* Recipe Image */}
          <Image
            source={{ uri: currentRecipe.image }}
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
              <Text style={styles.notesIcon}>📝</Text>
              <Text style={styles.notesTitle}>Key Notes for Success</Text>
            </View>
            
            {currentRecipe.notes.map((note, index) => (
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
            <Text style={styles.proTipIcon}>💡</Text>
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
            <Text style={styles.navigationHintText}>
              {isLastRecipe 
                ? '🎉 This is the last recipe. Ready to finish?' 
                : `📖 ${recipes.length - recipeIndex - 1} more ${recipes.length - recipeIndex - 1 === 1 ? 'recipe' : 'recipes'} to discover!`
              }
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleRecreate}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonIcon}>🍳</Text>
          <Text style={styles.secondaryButtonText}>Recreate</Text>
        </TouchableOpacity>
        
        <Button
          variant="primary"
          size="medium"
          onPress={handleNext}
          style={styles.nextButton}
        >
          {isLastRecipe ? 'Finish ✓' : 'Next →'}
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
    fontSize: scaleFontSize(16),
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
    fontSize: scaleFontSize(28),
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
    fontSize: scaleFontSize(32),
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.pastelGreen.light,
  },
  navigationHintText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textAlign: 'center',
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
    fontSize: scaleFontSize(20),
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
