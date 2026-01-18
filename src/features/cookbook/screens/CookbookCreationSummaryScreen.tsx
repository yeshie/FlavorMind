// src/features/cookbook/screens/CookbookCreationSummaryScreen.tsx
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

interface CookbookCreationSummaryScreenProps {
  navigation: any;
  route: {
    params: {
      selectedRecipes: any[];
      coverData: {
        title: string;
        introduction: string;
        authorName: string;
        occupation?: string;
        aboutAuthor?: string;
        thankYouMessage?: string;
      };
    };
  };
}

const CookbookCreationSummaryScreen: React.FC<CookbookCreationSummaryScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { selectedRecipes, coverData } = route.params;
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = () => {
    Alert.alert(
      'Publish Cookbook',
      'Your cookbook will be published and shared with the FlavorMind community. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            setIsPublishing(true);

            // Simulate publishing process
            setTimeout(() => {
              setIsPublishing(false);
              Alert.alert(
                '🎉 Published!',
                'Your cookbook has been published successfully!',
                [
                  {
                    text: 'View Cookbook',
                    onPress: () => {
                      // Navigate to the published cookbook
                      navigation.navigate('CookbookReference', {
                        cookbook: {
                          id: 'new-cookbook-id',
                          title: coverData.title,
                          author: coverData.authorName,
                          coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
                          rating: 0,
                          recipesCount: selectedRecipes.length,
                        },
                      });
                    },
                  },
                ]
              );
            }, 2000);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Edit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Cookbook</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Preview */}
        <View style={styles.coverPreview}>
          <View style={styles.coverImagePlaceholder}>
            <Text style={styles.coverImageIcon}>📚</Text>
          </View>
          <Text style={styles.coverTitle}>{coverData.title}</Text>
          <Text style={styles.coverAuthor}>by {coverData.authorName}</Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>📖</Text>
            <Text style={styles.summaryTitle}>Cookbook Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recipes:</Text>
            <Text style={styles.summaryValue}>{selectedRecipes.length}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Author:</Text>
            <Text style={styles.summaryValue}>{coverData.authorName}</Text>
          </View>

          {coverData.occupation && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Occupation:</Text>
              <Text style={styles.summaryValue}>{coverData.occupation}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.introSection}>
            <Text style={styles.introLabel}>Introduction</Text>
            <Text style={styles.introText}>{coverData.introduction}</Text>
          </View>

          {coverData.aboutAuthor && (
            <View style={styles.introSection}>
              <Text style={styles.introLabel}>About the Author</Text>
              <Text style={styles.introText}>{coverData.aboutAuthor}</Text>
            </View>
          )}

          {coverData.thankYouMessage && (
            <View style={styles.introSection}>
              <Text style={styles.introLabel}>Thank You Message</Text>
              <Text style={styles.introText}>{coverData.thankYouMessage}</Text>
            </View>
          )}
        </View>

        {/* Recipes Preview */}
        <View style={styles.recipesSection}>
          <View style={styles.recipesSectionHeader}>
            <Text style={styles.recipesSectionTitle}>Included Recipes</Text>
            <Text style={styles.recipesSectionSubtitle}>
              {selectedRecipes.length} recipes in this cookbook
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesScroll}
          >
            {selectedRecipes.map((recipe, index) => (
              <View key={recipe.id} style={styles.recipePreviewCard}>
                <Text style={styles.recipeNumber}>{index + 1}</Text>
                <Image
                  source={{ uri: recipe.image }}
                  style={styles.recipePreviewImage}
                  resizeMode="cover"
                />
                <Text style={styles.recipePreviewTitle} numberOfLines={2}>
                  {recipe.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxIcon}>🎉</Text>
          <View style={styles.infoBoxContent}>
            <Text style={styles.infoBoxTitle}>Ready to Publish?</Text>
            <Text style={styles.infoBoxText}>
              Once published, your cookbook will be available to the FlavorMind community. You can edit or unpublish it anytime from your library.
            </Text>
          </View>
        </View>

        {/* Publishing Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Publishing Guidelines</Text>
          <View style={styles.guidelineItem}>
            <Text style={styles.guidelineBullet}>✓</Text>
            <Text style={styles.guidelineText}>
              All recipes must have clear instructions
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <Text style={styles.guidelineBullet}>✓</Text>
            <Text style={styles.guidelineText}>
              Content must be appropriate for all audiences
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <Text style={styles.guidelineBullet}>✓</Text>
            <Text style={styles.guidelineText}>
              Respect copyright and give credit where due
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          disabled={isPublishing}
        >
          <Text style={styles.editIcon}>✏️</Text>
          <Text style={styles.editText}>Edit Details</Text>
        </TouchableOpacity>

        <Button
          variant="primary"
          size="large"
          onPress={handlePublish}
          loading={isPublishing}
          style={styles.publishButton}
        >
          🌍 Publish Cookbook
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
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  placeholder: {
    width: moderateScale(40),
  },
  scrollView: {
    flex: 1,
  },
  coverPreview: {
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    padding: moderateScale(SPACING['2xl']),
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.large,
  },
  coverImagePlaceholder: {
    width: moderateScale(200),
    height: moderateScale(260),
    backgroundColor: COLORS.pastelOrange.light,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
  },
  coverImageIcon: {
    fontSize: scaleFontSize(80),
  },
  coverTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING.xs),
  },
  coverAuthor: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.md),
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border.light,
  },
  summaryIcon: {
    fontSize: scaleFontSize(28),
    marginRight: moderateScale(SPACING.md),
  },
  summaryTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  summaryLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  summaryValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: moderateScale(SPACING.lg),
  },
  introSection: {
    marginBottom: moderateScale(SPACING.lg),
  },
  introLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  introText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  recipesSection: {
    marginTop: moderateScale(SPACING.xl),
  },
  recipesSectionHeader: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
  },
  recipesSectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  recipesSectionSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  recipesScroll: {
    paddingLeft: moderateScale(SPACING.base),
    paddingRight: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.md),
  },
  recipePreviewCard: {
    width: moderateScale(120),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  recipeNumber: {
    position: 'absolute',
    top: moderateScale(SPACING.xs),
    left: moderateScale(SPACING.xs),
    backgroundColor: COLORS.pastelOrange.main,
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(28),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    zIndex: 1,
  },
  recipePreviewImage: {
    width: '100%',
    height: moderateScale(100),
  },
  recipePreviewTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    padding: moderateScale(SPACING.sm),
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.xs),
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelGreen.light + '30',
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.pastelGreen.light,
  },
  infoBoxIcon: {
    fontSize: scaleFontSize(32),
    marginRight: moderateScale(SPACING.md),
  },
  infoBoxContent: {
    flex: 1,
  },
  infoBoxTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  infoBoxText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  guidelinesCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.small,
  },
  guidelinesTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.sm),
  },
  guidelineBullet: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelGreen.main,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginRight: moderateScale(SPACING.sm),
    marginTop: moderateScale(2),
  },
  guidelineText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(SPACING.md),
    paddingHorizontal: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border.main,
    backgroundColor: COLORS.background.white,
  },
  editIcon: {
    fontSize: scaleFontSize(20),
    marginRight: moderateScale(SPACING.xs),
  },
  editText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  publishButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default CookbookCreationSummaryScreen;
