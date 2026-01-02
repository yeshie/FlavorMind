// src/features/home/components/RecommendationFeed/RecommendationFeed.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../../common/utils/responsive';
import { RecipeRecommendation } from '../../types/home.types';

interface RecommendationFeedProps {
  recommendations: RecipeRecommendation[];
  onRecipePress: (recipe: RecipeRecommendation) => void;
}

const RecommendationFeed: React.FC<RecommendationFeedProps> = ({
  recommendations,
  onRecipePress,
}) => {
  const getDifficultyColor = (difficulty: RecipeRecommendation['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return COLORS.status.success;
      case 'medium':
        return COLORS.status.warning;
      case 'hard':
        return COLORS.status.error;
      default:
        return COLORS.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggested for Your Palette</Text>
        <Text style={styles.subtitle}>Based on your cooking habits</Text>
      </View>

      {recommendations.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.card}
          onPress={() => onRecipePress(recipe)}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={{ uri: recipe.image }}
            style={styles.imageBackground}
            imageStyle={styles.image}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.gradient}
            >
              {/* Match Badge */}
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>{recipe.matchScore}% Match</Text>
              </View>

              {/* Recipe Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {recipe.title}
                </Text>

                <View style={styles.metaContainer}>
                  <View style={styles.metaItem}>
                    <Image
                      source={require('../../../../assets/icons/clock.png')}
                      style={styles.metaIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.metaText}>{recipe.prepTime} mins</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <View
                      style={[
                        styles.difficultyDot,
                        { backgroundColor: getDifficultyColor(recipe.difficulty) },
                      ]}
                    />
                    <Text style={styles.metaText}>
                      {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                    </Text>
                  </View>

                  {recipe.isLocalIngredients && (
                    <View style={styles.localBadge}>
                      <Image
                        source={require('../../../../assets/icons/leaf.png')}
                        style={styles.localIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.localText}>Seasonal</Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: moderateScale(SPACING.xl),
    paddingBottom: moderateScale(SPACING['4xl']),
  },
  header: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  subtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  card: {
    marginHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.base),
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  imageBackground: {
    width: '100%',
    height: moderateScale(240),
  },
  image: {
    borderRadius: BORDER_RADIUS.xl,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: moderateScale(SPACING.base),
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.badge.match,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
  },
  matchText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  infoContainer: {
    gap: moderateScale(SPACING.sm),
  },
  recipeTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.md),
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  metaIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    tintColor: COLORS.text.white,
  },
  metaText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  difficultyDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: moderateScale(SPACING.xs),
    paddingVertical: moderateScale(4),
    borderRadius: BORDER_RADIUS.xs,
    gap: moderateScale(4),
  },
  localIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
    tintColor: COLORS.text.white,
  },
  localText: {
    fontSize: scaleFontSize(10),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.white,
  },
});

export default RecommendationFeed;