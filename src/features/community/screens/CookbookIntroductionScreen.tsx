// src/features/community/screens/CookbookIntroductionScreen.tsx
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
import { ArrowLeft, BookOpen, ChefHat, Sparkles } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface CookbookIntroductionScreenProps {
  navigation: any;
  route: {
    params: {
      cookbook: any;
    };
  };
}

const CookbookIntroductionScreen: React.FC<CookbookIntroductionScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { cookbook } = route.params;

  const handleNext = () => {
    navigation.navigate('CookbookRecipePage', { 
      cookbook, 
      recipeIndex: 0 
    });
  };

  const handleRecreate = () => {
    navigation.navigate('RecipeCustomization', {
      dishId: 'intro-recipe-1',
      dishName: 'Featured Recipe from Introduction',
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
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonContent}>
            <ArrowLeft size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>Introduction</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Welcome Title */}
          <Text style={styles.introTitle}>
            Welcome to{'\n'}{cookbook.title}
          </Text>
          
          {/* Cookbook Cover Image */}
          <Image
            source={{ uri: cookbook.coverImage }}
            style={styles.introImage}
            resizeMode="cover"
          />

          {/* Author Card */}
          <View style={styles.authorCard}>
            <Text style={styles.authorLabel}>A Note from the Author</Text>
            <Text style={styles.authorName}>{cookbook.author}</Text>
          </View>

          {/* Introduction Paragraphs */}
          <Text style={styles.introText}>
            Growing up in Sri Lanka, food was always the heart of our family gatherings. 
            The aroma of freshly ground spices, the sizzle of curry leaves in hot oil, 
            and the warmth of sharing meals with loved ones--these are the memories that 
            inspired this cookbook.
          </Text>

          <Text style={styles.introText}>
            In these pages, you'll discover {cookbook.recipesCount} authentic Sri Lankan recipes, 
            each one carefully selected to represent the rich culinary heritage of our island. 
            From traditional curries to modern twists on classic dishes, every recipe tells a story.
          </Text>

          {/* Highlight Box */}
          <View style={styles.highlightBox}>
            <Sparkles
              size={scaleFontSize(28)}
              color={COLORS.pastelOrange.main}
              strokeWidth={2}
              style={styles.highlightIcon}
            />
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>What Makes This Special</Text>
              <Text style={styles.highlightText}>
                - Authentic family recipes passed down through generations{'\n'}
                - Local ingredient alternatives and substitutes{'\n'}
                - Step-by-step guidance with helpful tips{'\n'}
                - Cultural insights and cooking techniques{'\n'}
                - Beautiful photography for every dish
              </Text>
            </View>
          </View>

          {/* More Introduction Text */}
          <Text style={styles.introText}>
            Whether you're a beginner or an experienced cook, these recipes are designed 
            to be accessible and enjoyable. Each dish has been tested multiple times to 
            ensure perfect results every time you cook.
          </Text>

          <Text style={styles.introText}>
            I believe that cooking is not just about following instructions--it's about 
            understanding the ingredients, feeling the textures, and tasting as you go. 
            Let's embark on this flavorful journey together!
          </Text>

          {/* Journey Info Box */}
          <View style={styles.journeyBox}>
            <View style={styles.journeyHeader}>
              <BookOpen
                size={scaleFontSize(24)}
                color={COLORS.pastelOrange.main}
                strokeWidth={2}
                style={styles.journeyIcon}
              />
              <Text style={styles.journeyTitle}>What's Ahead</Text>
            </View>
            <View style={styles.journeyStats}>
              <View style={styles.journeyStat}>
                <Text style={styles.journeyStatNumber}>{cookbook.recipesCount}</Text>
                <Text style={styles.journeyStatLabel}>Recipes</Text>
              </View>
              <View style={styles.journeyStat}>
                <Text style={styles.journeyStatNumber}>50+</Text>
                <Text style={styles.journeyStatLabel}>Photos</Text>
              </View>
              <View style={styles.journeyStat}>
                <Text style={styles.journeyStatNumber}>100+</Text>
                <Text style={styles.journeyStatLabel}>Tips</Text>
              </View>
            </View>
          </View>

          {/* Closing Message */}
          <View style={styles.closingCard}>
            <Text style={styles.closingText}>
              Ready to start cooking-- Turn the page to discover your first recipe!
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
          <ChefHat
            size={scaleFontSize(18)}
            color={COLORS.text.primary}
            strokeWidth={2}
            style={styles.secondaryButtonIcon}
          />
          <Text style={styles.secondaryButtonText}>Recreate Recipe</Text>
        </TouchableOpacity>
        
        <Button
          variant="primary"
          size="medium"
          onPress={handleNext}
          style={styles.nextButton}
        >
          Next
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
  pageIndicator: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
    flex: 1,
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
  introTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xl),
    textAlign: 'center',
    lineHeight: scaleFontSize(TYPOGRAPHY.fontSize['3xl']) * 1.3,
  },
  introImage: {
    width: '100%',
    height: moderateScale(280),
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: moderateScale(SPACING.xl),
    ...SHADOWS.medium,
  },
  authorCard: {
    backgroundColor: COLORS.pastelOrange.light,
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: moderateScale(SPACING.xl),
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pastelOrange.main,
    ...SHADOWS.small,
  },
  authorLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: moderateScale(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authorName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
  },
  introText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    marginBottom: moderateScale(SPACING.lg),
    textAlign: 'justify',
  },
  highlightBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelYellow.light,
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    marginVertical: moderateScale(SPACING.xl),
    borderWidth: 2,
    borderColor: COLORS.pastelYellow.main,
    ...SHADOWS.small,
  },
  highlightIcon: {
    marginRight: moderateScale(SPACING.md),
    marginTop: moderateScale(4),
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  highlightText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  journeyBox: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    marginVertical: moderateScale(SPACING.xl),
    ...SHADOWS.medium,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.md),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  journeyIcon: {
    marginRight: moderateScale(SPACING.md),
  },
  journeyTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  journeyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  journeyStat: {
    alignItems: 'center',
  },
  journeyStatNumber: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.main,
    marginBottom: moderateScale(SPACING.xs),
  },
  journeyStatLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  closingCard: {
    backgroundColor: COLORS.pastelGreen.light + '30',
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.lg,
    marginTop: moderateScale(SPACING.lg),
    borderWidth: 2,
    borderColor: COLORS.pastelGreen.light,
  },
  closingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.lg),
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

export default CookbookIntroductionScreen;
