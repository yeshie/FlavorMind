// src/features/community/screens/RecipeDescriptionScreen.tsx
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

interface RecipeDescriptionScreenProps {
  navigation: any;
  route: {
    params: {
      recipe: any;
    };
  };
}

const RecipeDescriptionScreen: React.FC<RecipeDescriptionScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { recipe } = route.params;

  const highlights = [
    '🔥 Perfect balance of sweet and spicy',
    '🥥 Fresh coconut adds authentic flavor',
    '⏱️ Quick and easy to prepare',
    '🌿 Uses locally available ingredients',
  ];

  const tips = [
    'Use freshly grated coconut for best results',
    'Adjust chili according to your spice preference',
    'Toast the coconut lightly before mixing',
    'Best served immediately with hot rice',
  ];

  const handleRecreateRecipe = () => {
    // Navigate to Recipe Customization (existing cooking flow)
    navigation.navigate('RecipeCustomization', {
      dishId: recipe.id,
      dishName: recipe.title,
      fromCommunity: true,
    });
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
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconEmoji}>🔖</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconEmoji}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Image
          source={{ uri: recipe.image }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Creator */}
          <View style={styles.titleSection}>
            <Text style={styles.dishTitle}>{recipe.title}</Text>
            
            <View style={styles.creatorRow}>
              <Image
                source={{ uri: recipe.creatorAvatar }}
                style={styles.creatorAvatar}
                resizeMode="cover"
              />
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorLabel}>Created by</Text>
                <Text style={styles.creatorName}>{recipe.creator}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{recipe.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>💬</Text>
                <Text style={styles.statValue}>{recipe.comments}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>👁️</Text>
                <Text style={styles.statValue}>2.4k</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Dish</Text>
            <Text style={styles.descriptionText}>
              {recipe.description}
            </Text>
            <Text style={styles.descriptionText}>
              This traditional recipe has been passed down through generations and represents 
              the authentic flavors of Sri Lankan home cooking. Every ingredient plays a crucial 
              role in creating the perfect balance of taste and aroma.
            </Text>
          </View>

          {/* What Makes It Special */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Makes It Special</Text>
            <View style={styles.highlightsList}>
              {highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <View style={styles.highlightDot} />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Tips for Perfect Results</Text>
            <View style={styles.tipsList}>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Category Badge */}
          <View style={styles.categorySection}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>🏷️ {recipe.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={handleRecreateRecipe}
          icon={require('../../../assets/icons/sparkle.png')}
        >
          🍳 Recreate This Recipe
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
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.background.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: scaleFontSize(20),
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: moderateScale(300),
  },
  content: {
    padding: moderateScale(SPACING.base),
  },
  titleSection: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.lg),
    marginBottom: moderateScale(SPACING.lg),
    ...SHADOWS.medium,
  },
  dishTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
  },
  creatorAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(SPACING.md),
    borderWidth: 2,
    borderColor: COLORS.pastelOrange.light,
  },
  creatorInfo: {},
  creatorLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(2),
  },
  creatorName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
    paddingTop: moderateScale(SPACING.lg),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: scaleFontSize(24),
    marginBottom: moderateScale(SPACING.xs),
  },
  statValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  statLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: moderateScale(SPACING.xl),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  descriptionText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    marginBottom: moderateScale(SPACING.md),
  },
  highlightsList: {
    gap: moderateScale(SPACING.md),
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pastelYellow.light,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pastelYellow.main,
  },
  highlightDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.pastelOrange.main,
    marginRight: moderateScale(SPACING.md),
  },
  highlightText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  tipsList: {
    gap: moderateScale(SPACING.sm),
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  tipNumber: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.pastelGreen.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  tipNumberText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  tipText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  categorySection: {
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: COLORS.pastelGreen.light,
    paddingHorizontal: moderateScale(SPACING.xl),
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.pastelGreen.main,
  },
  categoryText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelGreen.dark,
  },
  footer: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.medium,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default RecipeDescriptionScreen;