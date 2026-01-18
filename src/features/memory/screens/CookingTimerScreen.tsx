// src/features/memory/screens/CookingTimerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface CookingTimerScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      totalCookTime: number;
      servingSize: number;
    };
  };
}

const CookingTimerScreen: React.FC<CookingTimerScreenProps> = ({ navigation, route }) => {
  const { dishName, totalCookTime, servingSize } = route.params;

  const [minutes, setMinutes] = useState(totalCookTime);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished
            setIsRunning(false);
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, minutes, seconds]);

  const handleTimerComplete = () => {
    Alert.alert(
      '🎉 Your Dish is Ready!',
      `${dishName} is now complete. Enjoy your meal!`,
      [
        {
          text: 'Done',
          onPress: () => navigation.navigate('Done', {
            dishName,
            servingSize,
          }),
        },
      ],
      { cancelable: false }
    );
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            setMinutes(totalCookTime);
            setSeconds(0);
          },
        },
      ]
    );
  };

  const adjustTime = (delta: number) => {
    if (!isRunning) {
      const newMinutes = Math.max(1, Math.min(180, minutes + delta));
      setMinutes(newMinutes);
    }
  };

  const formatTime = (mins: number, secs: number) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = 1 - ((minutes * 60 + seconds) / (totalCookTime * 60));

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#E9A23B', '#F5B95F', '#FFC97A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (isRunning) {
                Alert.alert(
                  'Timer Running',
                  'Are you sure you want to go back? The timer will stop.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Go Back',
                      style: 'destructive',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.dishInfo}>
            <Text style={styles.dishName}>{dishName}</Text>
            <Text style={styles.servingSize}>Serves {servingSize}</Text>
          </View>
        </View>

        {/* Timer Display */}
        <View style={styles.timerSection}>
          <View style={styles.timerCircle}>
            <View style={styles.timerInner}>
              <Text style={styles.timerText}>{formatTime(minutes, seconds)}</Text>
              <Text style={styles.timerLabel}>
                {isRunning ? (isPaused ? 'Paused' : 'Cooking...') : 'Ready to Start'}
              </Text>
            </View>
          </View>

          {/* Progress Ring */}
          <View style={styles.progressRing}>
            <View style={[styles.progressFill, { height: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Time Adjust Controls (Only when not running) */}
        {!isRunning && (
          <View style={styles.adjustControls}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => adjustTime(-5)}
            >
              <Text style={styles.adjustButtonText}>-5</Text>
            </TouchableOpacity>

            <Text style={styles.adjustLabel}>Adjust Minutes</Text>

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => adjustTime(5)}
            >
              <Text style={styles.adjustButtonText}>+5</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
            >
              <Text style={styles.startButtonText}>▶ Start Timer</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={isPaused ? handleResume : handlePause}
              >
                <Text style={styles.controlButtonText}>
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>↻ Reset</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Skip Timer Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('Done', {
            dishName,
            servingSize,
          })}
        >
          <Text style={styles.skipButtonText}>Skip Timer →</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: moderateScale(SPACING.xl),
  },
  header: {
    marginBottom: moderateScale(SPACING['3xl']),
  },
  backButton: {
    marginBottom: moderateScale(SPACING.lg),
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  dishInfo: {
    alignItems: 'center',
  },
  dishName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING.xs),
  },
  servingSize: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    opacity: 0.9,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: moderateScale(SPACING['3xl']),
    position: 'relative',
  },
  timerCircle: {
    width: moderateScale(280),
    height: moderateScale(280),
    borderRadius: moderateScale(140),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  timerInner: {
    width: moderateScale(240),
    height: moderateScale(240),
    borderRadius: moderateScale(120),
    backgroundColor: COLORS.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  timerText: {
    fontSize: scaleFontSize(64),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
    marginBottom: moderateScale(SPACING.xs),
  },
  timerLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  progressRing: {
    position: 'absolute',
    bottom: 0,
    width: moderateScale(280),
    height: moderateScale(280),
    borderRadius: moderateScale(140),
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(129, 199, 132, 0.3)',
    borderRadius: moderateScale(140),
  },
  adjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(SPACING.xl),
    gap: moderateScale(SPACING.lg),
  },
  adjustButton: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.text.white,
  },
  adjustButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  adjustLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  controls: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.xl),
  },
  startButton: {
    flex: 1,
    backgroundColor: COLORS.background.white,
    paddingVertical: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  startButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
  },
  controlButton: {
    flex: 1,
    backgroundColor: COLORS.background.white,
    paddingVertical: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  controlButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  resetButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.status.error,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: moderateScale(SPACING.md),
  },
  skipButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    opacity: 0.9,
  },
});

export default CookingTimerScreen;
