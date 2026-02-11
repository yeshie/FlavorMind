// src/features/memory/screens/FeedbackScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Leaf, Lightbulb, Star } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import feedbackService from '../../../services/api/feedback.service';

interface FeedbackScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      servingSize: number;
      recipeId?: string;
    };
  };
}

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ navigation, route }) => {
  const { dishName, servingSize, recipeId } = route.params;

  const [rating, setRating] = useState(0);
  const [changes, setChanges] = useState('');
  const [localImprovements, setLocalImprovements] = useState('');
  const [personalTips, setPersonalTips] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    setLoading(true);

    try {
      const parts = [
        changes ? `Changes: ${changes}` : '',
        localImprovements ? `Local Improvements: ${localImprovements}` : '',
        personalTips ? `Tips: ${personalTips}` : '',
      ].filter(Boolean);
      const comment = parts.join('\n');

      if (recipeId) {
        await feedbackService.submitFeedback(recipeId, {
          rating,
          comment,
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      Alert.alert(
        'Thank You!',
        'Your feedback has been saved and will help improve future recommendations.',
        [
          {
            text: 'Done',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Feedback',
      'Are you sure you want to skip feedback? It helps us improve!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.pageIntro}>
          <Text style={styles.headerTitle}>Share Your Experience</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Rating Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>How did it turn out?</Text>
              <Star
                size={scaleFontSize(18)}
                color={COLORS.pastelOrange.main}
                strokeWidth={2}
              />
            </View>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Star
                    size={scaleFontSize(32)}
                    color={star <= rating ? COLORS.pastelOrange.main : COLORS.border.light}
                    fill={star <= rating ? COLORS.pastelOrange.main : 'transparent'}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating === 5 ? 'Perfect!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good!' : rating === 2 ? 'Okay' : 'Needs Work'}
              </Text>
            )}
          </View>

          {/* Changes Made */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Did you make any changes?</Text>
            <Text style={styles.sectionDescription}>
              Tell us about any modifications you made to the recipe
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., Added more chili, used less salt, cooked longer..."
              placeholderTextColor={COLORS.text.tertiary}
              value={changes}
              onChangeText={setChanges}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Local Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Local Ingredient Feedback</Text>
              <Leaf
                size={scaleFontSize(18)}
                color={COLORS.pastelGreen.main}
                strokeWidth={2}
              />
            </View>
            <Text style={styles.sectionDescription}>
              How did the local ingredient suggestions work for you?
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., Fresh coconut milk was perfect, couldn't find goraka so used tamarind..."
              placeholderTextColor={COLORS.text.tertiary}
              value={localImprovements}
              onChangeText={setLocalImprovements}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Personal Tips */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Any tips for others?</Text>
              <Lightbulb
                size={scaleFontSize(18)}
                color={COLORS.pastelYellow.main}
                strokeWidth={2}
              />
            </View>
            <Text style={styles.sectionDescription}>
              Share your personal cooking tips or insights
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., Best served hot with rice, taste better the next day..."
              placeholderTextColor={COLORS.text.tertiary}
              value={personalTips}
              onChangeText={setPersonalTips}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Bot
              size={scaleFontSize(28)}
              color={COLORS.text.secondary}
              strokeWidth={2}
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How this helps</Text>
              <Text style={styles.infoText}>
                Your feedback trains FlavorMind to give you better recipe suggestions that match your taste and cooking style
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleSubmit}
            loading={loading}
            disabled={rating === 0}
            style={styles.submitButton}
          >
            Submit Feedback
          </Button>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  pageIntro: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.sm),
  },
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
    marginBottom: moderateScale(2),
  },
  dishName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.xs),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  sectionDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.md),
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(SPACING.sm),
    marginVertical: moderateScale(SPACING.lg),
  },
  ratingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.main,
    textAlign: 'center',
    marginTop: moderateScale(SPACING.sm),
  },
  textArea: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.md),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    minHeight: moderateScale(100),
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...SHADOWS.small,
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
  infoIcon: {
    marginRight: moderateScale(SPACING.md),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  infoText: {
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
  submitButton: {
    marginBottom: moderateScale(SPACING.sm),
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: moderateScale(SPACING.sm),
  },
  skipButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default FeedbackScreen;
