// src/features/memory/screens/CookingStepsScreen.tsx
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import CornerTimer from '../components/CornerTimer';
import { calculateElapsedMinutes, createCookingHistoryId } from '../../../common/utils/cookingHistory';
import { getFirebaseUser } from '../../../services/firebase/authService';
import { hasFirebaseConfig } from '../../../services/firebase/firebase';
import cookingHistoryStore, { isPermissionDeniedError } from '../../../services/firebase/cookingHistoryStore';
import { recordRecipeActivity, saveCookingHistoryEntry } from '../../../services/storage/asyncStorage';

interface CookingStepsScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      dishImage?: string;
      servingSize: number;
      ingredients: any[];
      instructions?: string[];
      actualPrepTime?: number;
      prepTime?: number;
      cookTime?: number;
      totalCookTime?: number;
      recipeId?: string;
      feedbackRecipeId?: string;
      feedbackTarget?: 'recipes' | 'publicRecipes';
    };
  };
}

interface CookingStep {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number;
  completed: boolean;
}

const splitInstructionText = (value: string): string[] => {
  const normalized = value
    .replace(/\r/g, '\n')
    .replace(/^\s*(instructions?|method|steps)\s*:\s*/i, '')
    .trim();
  if (!normalized) return [];

  const numberedOrLines = normalized
    .split(/\n+|\s+(?=(?:step\s*)?\d+[\).\-\:]\s)/i)
    .map((item) => item.replace(/^\s*(step\s*)?\d+[\).\-\:]?\s*/i, '').trim())
    .filter(Boolean);

  if (numberedOrLines.length > 1) {
    return numberedOrLines;
  }

  return (normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeInstructionItems = (value: any = []): string[] => {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];

  return items
    .flatMap((item: any) => {
      if (typeof item === 'string') {
        return splitInstructionText(item);
      }

      const instructionText =
        item?.description ||
        item?.instruction ||
        item?.text ||
        item?.content ||
        (typeof item?.step === 'string' ? item.step : '');

      return splitInstructionText(instructionText);
    })
    .filter(Boolean);
};

const formatIngredientLine = (item: any) => {
  if (typeof item === 'string') return item.trim();

  const quantity = item?.quantity ?? item?.qty ?? item?.amount ?? '';
  const unit = item?.unit || '';
  const name = item?.name || item?.ingredient || item?.title || '';

  return [quantity, unit, name]
    .filter((part) => `${part}`.trim().length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildFallbackSteps = (dishName: string, ingredientNames: string[]): CookingStep[] => {
  const ingredientText = ingredientNames.slice(0, 5).join(', ');
  const steps = [
    `Prepare ${ingredientText || 'the ingredients'} for ${dishName}.`,
    `Cook ${dishName} over steady heat, adding the prepared ingredients in the recipe order.`,
    'Taste, adjust seasoning, and serve when the dish is cooked through.',
  ];

  return steps.map((instruction, index) => ({
    id: `fallback-${index}`,
    stepNumber: index + 1,
    instruction,
    completed: false,
  }));
};

const CookingStepsScreen: React.FC<CookingStepsScreenProps> = ({ navigation, route }) => {
  const {
    dishName,
    dishImage,
    servingSize,
    ingredients,
    instructions = [],
    actualPrepTime,
    prepTime,
    cookTime,
    totalCookTime,
    recipeId,
    feedbackRecipeId,
    feedbackTarget,
  } = route.params;

  const cookingIngredients = useMemo(
    () => (Array.isArray(ingredients) ? ingredients : []),
    [ingredients]
  );
  const ingredientLines = useMemo(
    () => cookingIngredients.map(formatIngredientLine).filter(Boolean),
    [cookingIngredients]
  );
  const normalizedInstructions = useMemo(
    () => normalizeInstructionItems(instructions),
    [instructions]
  );

  const initialSteps: CookingStep[] =
    normalizedInstructions.length > 0
      ? normalizedInstructions.map((instruction, index) => ({
          id: `${index}`,
          stepNumber: index + 1,
          instruction,
          completed: false,
        }))
      : buildFallbackSteps(dishName, ingredientLines);

  const [steps, setSteps] = useState<CookingStep[]>(initialSteps);
  const [finishing, setFinishing] = useState(false);
  const cookStartedAtRef = useRef<number>(Date.now());

  const fallbackTime = steps.reduce((acc, step) => acc + (step.duration || 0), 0) || 30;
  const suggestedTotalTime = totalCookTime && totalCookTime > 0 ? totalCookTime : fallbackTime;
  const suggestedPrepStageMinutes =
    typeof prepTime === 'number' && Number.isFinite(prepTime) && prepTime > 0
      ? Math.round(prepTime)
      : Math.max(
          0,
          suggestedTotalTime - (Number(cookTime) > 0 ? Math.round(Number(cookTime)) : suggestedTotalTime)
        );
  const suggestedCookingTimerMinutes =
    typeof cookTime === 'number' && Number.isFinite(cookTime) && cookTime > 0
      ? Math.round(cookTime)
      : suggestedTotalTime;
  const actualPrepStageMinutes =
    typeof actualPrepTime === 'number' && Number.isFinite(actualPrepTime) && actualPrepTime > 0
      ? Math.round(actualPrepTime)
      : suggestedPrepStageMinutes;
  const completedSteps = steps.filter(s => s.completed).length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const toggleStepCompletion = (stepId: string) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
  };

  const navigateToDone = (actualCookTime: number, actualTotalTime: number, historyId?: string) => {
    navigation.navigate('Done', {
      dishName,
      dishImage,
      servingSize,
      prepTime: actualPrepStageMinutes,
      cookTime: actualCookTime,
      totalCookTime: actualTotalTime,
      recipeId,
      feedbackRecipeId,
      feedbackTarget,
      historyId,
    });
  };

  const persistCookingCompletion = async () => {
    const historyId = createCookingHistoryId(dishName);
    const actualCookTime = calculateElapsedMinutes(cookStartedAtRef.current);
    const actualTotalTime = actualPrepStageMinutes + actualCookTime;
    const historyPayload = {
      id: historyId,
      dishName,
      dishImage,
      recipeId,
      feedbackRecipeId,
      feedbackTarget,
      servingSize,
      prepTime: actualPrepStageMinutes,
      cookTime: actualCookTime,
      totalCookTime: actualTotalTime,
    };

    const tasks: Promise<unknown>[] = [
      saveCookingHistoryEntry(historyPayload),
      recordRecipeActivity({
        actionType: 'cook',
        recipeId: feedbackRecipeId || recipeId,
        recipeTitle: dishName,
        ingredients: ingredientLines,
      }),
    ];

    const firebaseUser = getFirebaseUser();
    if (firebaseUser && hasFirebaseConfig) {
      tasks.push(cookingHistoryStore.saveHistory(firebaseUser.uid, historyPayload));
    }

    const results = await Promise.allSettled(tasks);
    results.forEach((result) => {
      if (result.status === 'rejected') {
        if (isPermissionDeniedError(result.reason)) {
          return;
        }
        console.warn('Cooking completion persistence failed:', result.reason);
      }
    });

    return {
      historyId,
      actualCookTime,
      actualTotalTime,
    };
  };

  const completeCooking = async () => {
    if (finishing) return;

    setFinishing(true);
    try {
      const { historyId, actualCookTime, actualTotalTime } = await persistCookingCompletion();
      navigateToDone(actualCookTime, actualTotalTime, historyId);
    } catch (error) {
      console.warn('Cooking history save failed:', error);
      const actualCookTime = calculateElapsedMinutes(cookStartedAtRef.current);
      navigateToDone(actualCookTime, actualPrepStageMinutes + actualCookTime);
    } finally {
      setFinishing(false);
    }
  };

  const handleFinishCooking = () => {
    const allCompleted = steps.every(s => s.completed);
    
    if (!allCompleted) {
      Alert.alert(
        'Incomplete Steps',
        'Some steps are not marked as completed. Do you want to finish cooking anyway?',
        [
          { text: 'Go Back', style: 'cancel' },
          {
            text: 'Finish',
            onPress: () => {
              void completeCooking();
            },
          },
        ]
      );
    } else {
      void completeCooking();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.pageIntro}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'<- Back'}</Text>
          </TouchableOpacity>

          <CornerTimer
            title="Cook Timer"
            durationMinutes={suggestedCookingTimerMinutes}
            accentColor={COLORS.pastelGreen.dark}
            onCompleteTitle="Cooking time finished"
            onCompleteMessage={`${dishName} has reached the suggested cooking time. Complete the remaining steps when you are ready.`}
          />
        </View>
        <Text style={styles.headerTitle}>Cooking Steps</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {completedSteps} of {steps.length} steps completed
          </Text>
          <Text style={styles.timeText}>Suggested cook timer {suggestedCookingTimerMinutes} min</Text>
        </View>
        <View style={styles.timeSummaryRow}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>Suggested Prep {suggestedPrepStageMinutes} min</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>Suggested Cook {suggestedCookingTimerMinutes} min</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>Suggested Total {suggestedTotalTime} min</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {ingredientLines.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredientLines.map((line, index) => (
              <View key={`${line}-${index}`} style={styles.ingredientRow}>
                <View style={styles.ingredientBullet}>
                  <Text style={styles.ingredientBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.ingredientText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cooking Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepCard,
                step.completed && styles.stepCardCompleted,
              ]}
              onPress={() => toggleStepCompletion(step.id)}
              activeOpacity={0.7}
            >
              <View style={styles.stepHeader}>
                <View style={[
                  styles.stepNumber,
                  step.completed && styles.stepNumberCompleted,
                ]}>
                  {step.completed ? (
                    <Text style={styles.checkmark}>X</Text>
                  ) : (
                    <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                  )}
                </View>
                
                {step.duration && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>Time {step.duration} min</Text>
                  </View>
                )}
              </View>

              <Text style={[
                styles.instruction,
                step.completed && styles.instructionCompleted,
              ]}>
                {step.instruction}
              </Text>

              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  step.completed && styles.checkboxChecked,
                ]}>
                  {step.completed && (
                    <Text style={styles.checkboxCheck}>X</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  {step.completed ? 'Completed' : 'Mark as complete'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={handleFinishCooking}
          loading={finishing}
          disabled={finishing}
        >
          Complete Cooking
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
  pageIntro: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.sm),
    zIndex: 20,
    overflow: 'visible',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.sm),
    gap: moderateScale(SPACING.sm),
    zIndex: 20,
  },
  backButton: {
    paddingTop: moderateScale(SPACING.xs),
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
    marginBottom: moderateScale(2),
  },
  dishName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  progressSection: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.sm),
  },
  progressText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  timeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  progressBarContainer: {
    height: moderateScale(8),
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  timeSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.sm),
  },
  timeBadge: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
  },
  timeBadgeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.pastelGreen.main,
    borderRadius: BORDER_RADIUS.full,
  },
  scrollView: {
    flex: 1,
  },
  ingredientsContainer: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.sm),
  },
  ingredientBullet: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.pastelOrange.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.sm),
  },
  ingredientBulletText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
  },
  ingredientText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  stepsContainer: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
  },
  stepCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.lg),
    marginBottom: moderateScale(SPACING.md),
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  stepCardCompleted: {
    backgroundColor: COLORS.pastelGreen.light + '20',
    borderColor: COLORS.pastelGreen.main,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  stepNumber: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.pastelOrange.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberCompleted: {
    backgroundColor: COLORS.pastelGreen.main,
  },
  stepNumberText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  checkmark: {
    fontSize: scaleFontSize(20),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  durationBadge: {
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
  },
  durationText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  instruction: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    marginBottom: moderateScale(SPACING.md),
  },
  instructionCompleted: {
    opacity: 0.7,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(6),
    borderWidth: 2,
    borderColor: COLORS.border.main,
    marginRight: moderateScale(SPACING.sm),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.pastelGreen.main,
    borderColor: COLORS.pastelGreen.main,
  },
  checkboxCheck: {
    color: COLORS.text.white,
    fontSize: scaleFontSize(14),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  checkboxLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
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

export default CookingStepsScreen;
