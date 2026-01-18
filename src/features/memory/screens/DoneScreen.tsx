// src/features/memory/screens/DoneScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface DoneScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      servingSize: number;
    };
  };
}

const DoneScreen: React.FC<DoneScreenProps> = ({ navigation, route }) => {
  const { dishName, servingSize } = route.params;

  const handleGoHome = () => {
    // Navigate to Home and reset the stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleGiveFeedback = () => {
    navigation.navigate('Feedback', {
      dishName,
      servingSize,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#81C784', '#A5D6A7', '#C8E6C9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✓</Text>
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>🎉 Cooking Complete!</Text>
          <Text style={styles.subtitle}>
            Your {dishName} is ready to be enjoyed
          </Text>
          <View style={styles.servingBadge}>
            <Text style={styles.servingText}>Served {servingSize} {servingSize === 1 ? 'person' : 'people'}</Text>
          </View>
        </View>

        {/* Celebration Image/Icon */}
        <View style={styles.celebrationContainer}>
          <Image
            source={require('../../../assets/icons/sparkle.png')}
            style={styles.sparkleIcon}
            resizeMode="contain"
          />
          <Text style={styles.celebrationText}>
            Great job! You've successfully recreated a food memory.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleGiveFeedback}
            style={styles.feedbackButton}
          >
            Give Feedback
          </Button>

          <Button
            variant="outline"
            size="large"
            fullWidth
            onPress={handleGoHome}
            style={styles.homeButton}
            textStyle={styles.homeButtonText}
          >
            Go Back to Home
          </Button>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Did you know?</Text>
          <Text style={styles.tipsText}>
            Your feedback helps FlavorMind learn your preferences and suggest even better recipes next time!
          </Text>
        </View>
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
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(SPACING['2xl']),
  },
  iconCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: COLORS.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconText: {
    fontSize: scaleFontSize(64),
    color: COLORS.pastelGreen.main,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(SPACING['3xl']),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  subtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.white,
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: moderateScale(SPACING.md),
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.lg),
  },
  servingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: moderateScale(SPACING.lg),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.text.white,
  },
  servingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(SPACING['3xl']),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.xl,
  },
  sparkleIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    tintColor: COLORS.text.white,
    marginBottom: moderateScale(SPACING.md),
  },
  celebrationText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.white,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
  },
  actionsContainer: {
    gap: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.xl),
  },
  feedbackButton: {
    backgroundColor: COLORS.pastelOrange.dark,
  },
  homeButton: {
    borderColor: COLORS.text.white,
    borderWidth: 2,
  },
  homeButtonText: {
    color: COLORS.text.white,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tipsTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    marginBottom: moderateScale(SPACING.xs),
  },
  tipsText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    opacity: 0.9,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
});

export default DoneScreen;
