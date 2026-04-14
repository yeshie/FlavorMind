import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Clock3, MessageSquareText, Sparkles } from 'lucide-react-native';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import { buildRemoteImageSource } from '../../../common/utils';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface DoneScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      dishImage?: string;
      servingSize: number;
      prepTime?: number;
      cookTime?: number;
      totalCookTime?: number;
      recipeId?: string;
      feedbackRecipeId?: string;
      feedbackTarget?: 'recipes' | 'publicRecipes';
      historyId?: string;
    };
  };
}

const DoneScreen: React.FC<DoneScreenProps> = ({ navigation, route }) => {
  const {
    dishName,
    dishImage,
    servingSize,
    prepTime,
    cookTime,
    totalCookTime,
    recipeId,
    feedbackRecipeId,
    feedbackTarget,
    historyId,
  } = route.params;

  const badgeScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(badgeScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 55,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [badgeScale, contentOpacity, contentTranslate]);

  const totalTimeLabel =
    totalCookTime && totalCookTime > 0 ? `${totalCookTime} min` : 'Recorded';

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleGiveFeedback = () => {
    navigation.navigate('Feedback', {
      dishName,
      dishImage,
      servingSize,
      prepTime,
      cookTime,
      totalCookTime,
      recipeId,
      feedbackRecipeId,
      feedbackTarget,
      historyId,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#8ED2A0', '#BDE8B6', '#F1F7D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />

        <View style={styles.screenContent}>
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.heroSection,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.successBadge,
                  {
                    transform: [{ scale: badgeScale }],
                  },
                ]}
              >
                <CheckCircle2
                  size={scaleFontSize(54)}
                  color={COLORS.pastelGreen.main}
                  strokeWidth={1.8}
                />
              </Animated.View>

              <Text style={styles.eyebrow}>Cooking Complete</Text>
              <Text style={styles.title}>Ready to Serve</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {dishName}
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.summaryCard,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <View style={styles.summaryTopRow}>
                <Image
                  source={
                    buildRemoteImageSource(dishImage)
                    || require('../../../assets/icons/book.png')
                  }
                  style={styles.recipeThumb}
                  resizeMode="cover"
                />

                <View style={styles.summaryTextWrap}>
                  <View style={styles.historyPill}>
                    <Clock3
                      size={scaleFontSize(12)}
                      color={COLORS.pastelGreen.dark}
                      strokeWidth={2}
                    />
                    <Text style={styles.historyPillText}>Saved to history</Text>
                  </View>
                  <Text style={styles.summaryRecipeName} numberOfLines={2}>
                    {dishName}
                  </Text>
                  <Text style={styles.summaryMetaText}>
                    Serves {servingSize} {servingSize === 1 ? 'person' : 'people'}
                  </Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Prep</Text>
                  <Text style={styles.statValue}>{prepTime ? `${prepTime} min` : '--'}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Cook</Text>
                  <Text style={styles.statValue}>{cookTime ? `${cookTime} min` : '--'}</Text>
                </View>
                <View style={[styles.statCard, styles.statCardAccent]}>
                  <Text style={styles.statLabelAccent}>Total</Text>
                  <Text style={styles.statValueAccent}>{totalTimeLabel}</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.feedbackCard,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <View style={styles.feedbackIconWrap}>
                <Sparkles
                  size={scaleFontSize(22)}
                  color={COLORS.pastelOrange.dark}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.feedbackTextWrap}>
                <Text style={styles.feedbackTitle}>Tell FlavorMind how it went</Text>
                <Text style={styles.feedbackDescription}>
                  Add your rating and notes so this dish is stored properly in your cooking history.
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.tipCard,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <MessageSquareText
                size={scaleFontSize(18)}
                color={COLORS.pastelOrange.dark}
                strokeWidth={2}
              />
              <Text style={styles.tipText}>
                Your feedback improves future recipe suggestions and keeps this cooking session complete in history.
              </Text>
            </Animated.View>
          </ScrollView>

          <View style={styles.bottomSection}>
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
              Back To Home
            </Button>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  gradient: {
    flex: 1,
  },
  orbLarge: {
    position: 'absolute',
    top: moderateScale(28),
    right: moderateScale(-36),
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(90),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  orbSmall: {
    position: 'absolute',
    bottom: moderateScale(150),
    left: moderateScale(-26),
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.sm),
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingBottom: moderateScale(SPACING.md),
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
  },
  successBadge: {
    width: moderateScale(92),
    height: moderateScale(92),
    borderRadius: moderateScale(46),
    backgroundColor: COLORS.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
    ...SHADOWS.large,
  },
  eyebrow: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.95,
    marginBottom: moderateScale(4),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING.xs),
  },
  subtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    paddingHorizontal: moderateScale(SPACING.base),
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: BORDER_RADIUS['2xl'],
    padding: moderateScale(SPACING.md),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...SHADOWS.medium,
    marginBottom: moderateScale(SPACING.md),
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  recipeThumb: {
    width: moderateScale(74),
    height: moderateScale(74),
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.tertiary,
    marginRight: moderateScale(SPACING.md),
  },
  summaryTextWrap: {
    flex: 1,
  },
  historyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: COLORS.pastelGreen.light + '55',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(5),
    marginBottom: moderateScale(SPACING.xs),
  },
  historyPillText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.pastelGreen.dark,
  },
  summaryRecipeName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  summaryMetaText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  statRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: moderateScale(SPACING.sm),
    paddingHorizontal: moderateScale(SPACING.sm),
    alignItems: 'center',
  },
  statCardAccent: {
    backgroundColor: COLORS.pastelOrange.light,
  },
  statLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    marginBottom: moderateScale(4),
  },
  statLabelAccent: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.pastelOrange.dark,
    textTransform: 'uppercase',
    marginBottom: moderateScale(4),
  },
  statValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  statValueAccent: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.md),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    marginBottom: moderateScale(SPACING.md),
  },
  feedbackIconWrap: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: COLORS.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.sm),
  },
  feedbackTextWrap: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  feedbackDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  bottomSection: {
    gap: moderateScale(SPACING.sm),
    paddingTop: moderateScale(SPACING.xs),
    paddingBottom: moderateScale(SPACING.xs),
  },
  feedbackButton: {
    backgroundColor: COLORS.pastelOrange.dark,
    borderRadius: BORDER_RADIUS.lg,
  },
  homeButton: {
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  homeButtonText: {
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: moderateScale(SPACING.sm),
    paddingHorizontal: moderateScale(SPACING.md),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    marginBottom: moderateScale(SPACING.sm),
  },
  tipText: {
    flex: 1,
    marginLeft: moderateScale(SPACING.sm),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.white,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.xs),
  },
});

export default DoneScreen;
