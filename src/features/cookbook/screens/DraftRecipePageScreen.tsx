// src/features/cookbook/screens/DraftRecipePageScreen.tsx
import React from 'react';
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

interface DraftRecipePageScreenProps {
  navigation: any;
  route: {
    params: {
      recipe: any;
    };
  };
}

const DraftRecipePageScreen: React.FC<DraftRecipePageScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { recipe } = route.params;

  const handleRecreate = () => {
    // Navigate to cooking flow
    navigation.navigate('RecipeCustomization', {
      dishId: recipe.id,
      dishName: recipe.dishName,
    });
  };

  const handleEdit = () => {
    // Navigate to edit recipe page
    navigation.navigate('AddRecipe', {
      recipe: recipe,
      isEdit: true,
    });
  };

  const handlePublish = () => {
    Alert.alert(
      'Publish Recipe',
      'Are you sure you want to publish this recipe to the community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: () => {
            // TODO: Implement publish logic
            Alert.alert('Success', 'Recipe published successfully!', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          },
        },
      ]
    );
  };

  const handleSave = () => {
    Alert.alert('Saved', 'Recipe saved to your drafts');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', 'Draft recipe deleted', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          },
        },
      ]
    );
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Draft Recipe</Text>
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>DRAFT</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.dishImage }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <View style={styles.draftOverlay}>
            <Text style={styles.draftOverlayText}>DRAFT</Text>
          </View>
        </View>

        {/* Recipe Info */}
        <View style={styles.infoCard}>
          <Text style={styles.dishTitle}>{recipe.dishName}</Text>
          
          <Text style={styles.infoText}>
            This recipe is in draft mode. You can continue editing, recreate it for cooking, or publish it to share with the FlavorMind community.
          </Text>

          <View style={styles.statusBox}>
            <Text style={styles.statusIcon}>📝</Text>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Draft Status</Text>
              <Text style={styles.statusText}>
                Not yet published • Private to you
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Grid */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>What would you like to do?</Text>

          <View style={styles.actionsGrid}>
            {/* Recreate */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleRecreate}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.pastelOrange.light }]}>
                <Text style={styles.actionIcon}>🍳</Text>
              </View>
              <Text style={styles.actionTitle}>Recreate</Text>
              <Text style={styles.actionDescription}>
                Cook this recipe with step-by-step guidance
              </Text>
            </TouchableOpacity>

            {/* Edit */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleEdit}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.pastelYellow.light }]}>
                <Text style={styles.actionIcon}>✏️</Text>
              </View>
              <Text style={styles.actionTitle}>Edit</Text>
              <Text style={styles.actionDescription}>
                Continue editing your recipe
              </Text>
            </TouchableOpacity>

            {/* Publish */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handlePublish}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.pastelGreen.light }]}>
                <Text style={styles.actionIcon}>🌍</Text>
              </View>
              <Text style={styles.actionTitle}>Publish</Text>
              <Text style={styles.actionDescription}>
                Share with the community
              </Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.background.tertiary }]}>
                <Text style={styles.actionIcon}>💾</Text>
              </View>
              <Text style={styles.actionTitle}>Save</Text>
              <Text style={styles.actionDescription}>
                Keep as draft for later
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxIcon}>💡</Text>
          <View style={styles.infoBoxContent}>
            <Text style={styles.infoBoxTitle}>Publishing Tips</Text>
            <Text style={styles.infoBoxText}>
              Make sure your recipe has clear instructions, accurate measurements, and a good photo before publishing!
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer - Delete Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
          <Text style={styles.deleteText}>Delete Draft</Text>
        </TouchableOpacity>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.sm),
  },
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  draftBadge: {
    backgroundColor: COLORS.pastelYellow.main,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(4),
    borderRadius: BORDER_RADIUS.xs,
  },
  draftBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  placeholder: {
    width: moderateScale(40),
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: moderateScale(300),
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  draftOverlay: {
    position: 'absolute',
    top: moderateScale(SPACING.lg),
    right: moderateScale(SPACING.lg),
    backgroundColor: COLORS.pastelYellow.main,
    paddingHorizontal: moderateScale(SPACING.lg),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  draftOverlayText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  infoCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(-SPACING['2xl']),
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.large,
  },
  dishTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  infoText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    marginBottom: moderateScale(SPACING.lg),
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
  },
  statusIcon: {
    fontSize: scaleFontSize(32),
    marginRight: moderateScale(SPACING.md),
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  statusText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  actionsSection: {
    marginTop: moderateScale(SPACING.xl),
    paddingHorizontal: moderateScale(SPACING.base),
  },
  actionsTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.md),
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.lg),
    alignItems: 'center',
    ...SHADOWS.small,
  },
  actionIconContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  actionIcon: {
    fontSize: scaleFontSize(28),
  },
  actionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.xs),
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelYellow.light,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
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
  footer: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.status.error,
  },
  deleteIcon: {
    fontSize: scaleFontSize(20),
    marginRight: moderateScale(SPACING.xs),
  },
  deleteText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.status.error,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default DraftRecipePageScreen;