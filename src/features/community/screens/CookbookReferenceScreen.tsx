// src/features/community/screens/CookbookReferenceScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CookbookReferenceScreenProps {
  navigation: any;
  route: {
    params: {
      cookbook: any;
    };
  };
}

const CookbookReferenceScreen: React.FC<CookbookReferenceScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { cookbook } = route.params;

  const handleNext = () => {
    navigation.navigate('CookbookIntroduction', { cookbook });
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
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cookbook Cover */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: cookbook.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay}>
            <View style={styles.ratingBadge}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.ratingText}>{cookbook.rating}</Text>
            </View>
          </View>
        </View>

        {/* Book Info */}
        <View style={styles.infoCard}>
          <Text style={styles.bookTitle}>{cookbook.title}</Text>
          <Text style={styles.bookAuthor}>by {cookbook.author}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📖</Text>
              <Text style={styles.statText}>{cookbook.recipesCount} Recipes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statText}>2.4k Readers</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Traditional</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Sri Lankan</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Home Cooking</Text>
            </View>
          </View>

          <Text style={styles.previewText}>
            Discover the authentic flavors of Sri Lankan cuisine through this carefully curated 
            collection of traditional recipes. Each dish has been tested and perfected to bring 
            you the true taste of home cooking.
          </Text>
        </View>

        {/* What's Inside */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Inside</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✨</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Authentic Recipes</Text>
                <Text style={styles.featureDescription}>
                  Traditional dishes passed down through generations
                </Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📸</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Step-by-Step Photos</Text>
                <Text style={styles.featureDescription}>
                  Visual guides for every recipe
                </Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💡</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Expert Tips</Text>
                <Text style={styles.featureDescription}>
                  Pro cooking techniques and secrets
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reviews Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Readers Say</Text>
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?img=5' }}
                style={styles.reviewerAvatar}
                resizeMode="cover"
              />
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>Priya Jayasinghe</Text>
                <View style={styles.reviewStars}>
                  <Text style={styles.reviewStarsText}>⭐⭐⭐⭐⭐</Text>
                </View>
              </View>
            </View>
            <Text style={styles.reviewText}>
              "This cookbook is a treasure! Every recipe is authentic and easy to follow. 
              My family loves the traditional dishes I've learned from here."
            </Text>
          </View>
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
          icon={require('../../../assets/icons/book.png')}
        >
          Start Reading →
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
    padding: moderateScale(SPACING.xs),
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(SPACING['4xl']),
  },
  coverContainer: {
    width: SCREEN_WIDTH,
    height: moderateScale(400),
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: moderateScale(SPACING.lg),
    right: moderateScale(SPACING.lg),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.medium,
  },
  starIcon: {
    fontSize: scaleFontSize(20),
    marginRight: moderateScale(4),
  },
  ratingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  infoCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(-SPACING['3xl']),
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.large,
  },
  bookTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  bookAuthor: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.lg),
  },
  statsRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.xl),
    marginBottom: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.lg),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: scaleFontSize(20),
    marginRight: moderateScale(SPACING.xs),
  },
  statText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.lg),
  },
  tag: {
    backgroundColor: COLORS.pastelOrange.light,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.pastelOrange.dark,
  },
  previewText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
  },
  section: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  featuresList: {
    gap: moderateScale(SPACING.md),
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  featureIcon: {
    fontSize: scaleFontSize(32),
    marginRight: moderateScale(SPACING.md),
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  featureDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  reviewCard: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  reviewerAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(SPACING.md),
  },
  reviewerInfo: {},
  reviewerName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  reviewStars: {},
  reviewStarsText: {
    fontSize: scaleFontSize(14),
  },
  reviewText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontStyle: 'italic',
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

export default CookbookReferenceScreen;
