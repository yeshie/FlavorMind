// src/features/memory/screens/CookingStepsScreen.tsx
import React, { useState } from 'react';
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

interface CookingStepsScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      servingSize: number;
      ingredients: any[];
      instructions?: string[];
      totalCookTime?: number;
      recipeId?: string;
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

const CookingStepsScreen: React.FC<CookingStepsScreenProps> = ({ navigation, route }) => {
  const {
    dishName,
    servingSize,
    ingredients,
    instructions = [],
    totalCookTime,
    recipeId,
  } = route.params;

  const mockSteps: CookingStep[] = [
    {
      id: '1',
      stepNumber: 1,
      instruction: 'Clean and cut the fish into medium-sized pieces. Remove any bones carefully.',
      duration: 5,
      completed: false,
    },
    {
      id: '2',
      stepNumber: 2,
      instruction: 'Heat oil in a clay pot or deep pan. Add sliced onions and curry leaves. Saute until onions are golden brown.',
      duration: 8,
      completed: false,
    },
    {
      id: '3',
      stepNumber: 3,
      instruction: 'Add curry powder, turmeric, chili powder, and fenugreek. Mix well and cook for 2 minutes until fragrant.',
      duration: 3,
      completed: false,
    },
    {
      id: '4',
      stepNumber: 4,
      instruction: 'Add goraka pieces and green chilies. Pour in thin coconut milk and bring to a gentle boil.',
      duration: 5,
      completed: false,
    },
    {
      id: '5',
      stepNumber: 5,
      instruction: 'Carefully add the fish pieces. Cover and cook on medium heat without stirring too much.',
      duration: 10,
      completed: false,
    },
    {
      id: '6',
      stepNumber: 6,
      instruction: 'Add thick coconut milk and salt. Simmer gently until the curry thickens and fish is fully cooked.',
      duration: 15,
      completed: false,
    },
    {
      id: '7',
      stepNumber: 7,
      instruction: 'Turn off heat and let it rest for 5 minutes. Garnish with fresh curry leaves.',
      duration: 5,
      completed: false,
    },
  ];

  const initialSteps: CookingStep[] =
    instructions.length > 0
      ? instructions.map((instruction, index) => ({
          id: `${index}`,
          stepNumber: index + 1,
          instruction,
          completed: false,
        }))
      : mockSteps;

  const [steps, setSteps] = useState<CookingStep[]>(initialSteps);

  const fallbackTime = steps.reduce((acc, step) => acc + (step.duration || 0), 0) || 30;
  const totalTime = totalCookTime && totalCookTime > 0 ? totalCookTime : fallbackTime;
  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const toggleStepCompletion = (stepId: string) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
  };

  const handleStartTimer = () => {
    const allCompleted = steps.every(s => s.completed);
    
    if (!allCompleted) {
      Alert.alert(
        'Incomplete Steps',
        'Some steps are not marked as completed. Do you want to proceed to the timer anyway?',
        [
          { text: 'Go Back', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Done', {
              dishName,
              servingSize,
              totalCookTime: totalTime,
              recipeId,
            }),
          },
        ]
      );
    } else {
      navigation.navigate('Done', {
        dishName,
        servingSize,
        totalCookTime: totalTime,
        recipeId,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.pageIntro}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'<- Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cooking Steps</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {completedSteps} of {steps.length} steps completed
          </Text>
          <Text style={styles.timeText}>Time {totalTime} mins total</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
          onPress={handleStartTimer}
        >
          Finish Steps ->
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
  },
  backButton: {
    marginBottom: moderateScale(SPACING.md),
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
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.pastelGreen.main,
    borderRadius: BORDER_RADIUS.full,
  },
  scrollView: {
    flex: 1,
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
