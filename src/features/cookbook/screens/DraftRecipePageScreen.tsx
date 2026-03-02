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
import { ArrowLeft, ChefHat, ClipboardList, Globe, Lightbulb, Pencil, Save, Trash2 } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import recipeStore, { PublishStatus } from '../../../services/firebase/recipeStore';

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
  const status = (recipe?.publishStatus || recipe?.status || 'draft') as PublishStatus;
  const canPublish = status === 'draft' || status === 'rejected';

  const statusLabel =
    status === 'approved'
      ? 'PUBLISHED'
      : status === 'pending'
        ? 'WAITING'
        : status === 'rejected'
          ? 'REJECTED'
          : 'DRAFT';
  const statusMessage =
    status === 'approved'
      ? 'Published and visible to the community'
      : status === 'pending'
        ? 'Awaiting admin approval'
        : status === 'rejected'
          ? 'Not accepted - update and resubmit'
          : 'Not yet published - Private to you';

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
    if (!canPublish) {
      Alert.alert('Pending Approval', 'This recipe is already waiting for admin approval.');
      return;
    }

    Alert.alert(
      'Publish Recipe',
      'Submit this recipe for admin approval?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await recipeStore.updateRecipePublishStatus(recipe.id, 'pending');
              Alert.alert(
                'Submitted',
                'Your recipe is waiting for admin approval.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Publish recipe error:', error);
              Alert.alert('Error', 'Could not submit this recipe right now.');
            }
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
          onPress: async () => {
            try {
              await recipeStore.deleteRecipe(recipe.id);
              Alert.alert('Deleted', 'Draft recipe deleted', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Delete draft error:', error);
              Alert.alert('Error', 'Could not delete this draft right now.');
            }
          },
        },
      ]
    );
  };

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Draft Recipe</Text>
          <View
            style={[
              styles.draftBadge,
              {
                backgroundColor:
                  status === 'approved'
                    ? COLORS.pastelGreen.main
                    : status === 'pending'
                      ? COLORS.pastelOrange.main
                      : status === 'rejected'
                        ? COLORS.status.error
                        : COLORS.pastelYellow.main,
              },
            ]}
          >
            <Text style={styles.draftBadgeText}>{statusLabel}</Text>
          </View>
        </View>
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
          <View
            style={[
              styles.draftOverlay,
              {
                backgroundColor:
                  status === 'approved'
                    ? COLORS.pastelGreen.main
                    : status === 'pending'
                      ? COLORS.pastelOrange.main
                      : status === 'rejected'
                        ? COLORS.status.error
                        : COLORS.pastelYellow.main,
              },
            ]}
          >
            <Text style={styles.draftOverlayText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Recipe Info */}
        <View style={styles.infoCard}>
          <Text style={styles.dishTitle}>{recipe.dishName}</Text>
          
          <Text style={styles.infoText}>
            This recipe is in draft mode. You can continue editing, recreate it for cooking, or publish it to share with the FlavorMind community.
          </Text>

          <View style={styles.statusBox}>
            <ClipboardList size={scaleFontSize(24)} color={COLORS.text.secondary} strokeWidth={2} style={styles.statusIcon} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Draft Status</Text>
              <Text style={styles.statusText}>
                {statusMessage}
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
                <ChefHat size={scaleFontSize(26)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionIcon} />
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
                <Pencil size={scaleFontSize(24)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionIcon} />
              </View>
              <Text style={styles.actionTitle}>Edit</Text>
              <Text style={styles.actionDescription}>
                Continue editing your recipe
              </Text>
            </TouchableOpacity>

            {/* Publish */}
            <TouchableOpacity
              style={[styles.actionCard, !canPublish && styles.actionCardDisabled]}
              onPress={canPublish ? handlePublish : undefined}
              activeOpacity={canPublish ? 0.8 : 1}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.pastelGreen.light }]}>
                <Globe size={scaleFontSize(24)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionIcon} />
              </View>
              <Text style={[styles.actionTitle, !canPublish && styles.actionTitleDisabled]}>Publish</Text>
              <Text style={styles.actionDescription}>
                {status === 'pending' ? 'Waiting for approval' : 'Share with the community'}
              </Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.background.tertiary }]}>
                <Save size={scaleFontSize(24)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionIcon} />
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
          <Lightbulb size={scaleFontSize(24)} color={COLORS.pastelYellow.dark} strokeWidth={2} style={styles.infoBoxIcon} />
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
          <Trash2 size={scaleFontSize(20)} color={COLORS.status.error} strokeWidth={2} style={styles.deleteIcon} />
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
  pageIntro: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.sm),
  },
  backButton: {
    padding: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.sm),
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.sm),
  },
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
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
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionIconContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  actionIcon: {},
  actionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
    textAlign: 'center',
  },
  actionTitleDisabled: {
    color: COLORS.text.secondary,
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
