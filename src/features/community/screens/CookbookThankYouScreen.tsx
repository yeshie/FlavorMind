// src/features/community/screens/CookbookThankYouScreen.tsx
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

interface CookbookThankYouScreenProps {
  navigation: any;
  route: {
    params: {
      cookbook: any;
    };
  };
}

const CookbookThankYouScreen: React.FC<CookbookThankYouScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { cookbook } = route.params;
  const [rating, setRating] = useState(0);

  const handleRate = (stars: number) => {
    setRating(stars);
  };

  const handleGiveFeedback = () => {
    if (rating === 0) {
      Alert.alert(
        'Rating Required',
        'Please rate the cookbook before giving feedback',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to detailed feedback page or show success
    Alert.alert(
      'Thank You!',
      'Your rating has been submitted. We appreciate your feedback!',
      [
        {
          text: 'OK',
          onPress: () => handleGoHome(),
        },
      ]
    );
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleShare = () => {
    Alert.alert('Share Cookbook', 'Sharing functionality coming soon!');
  };

  const handleSave = () => {
    Alert.alert('Saved!', 'Cookbook added to your library');
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 5: return 'Excellent! 🌟';
      case 4: return 'Great! 👍';
      case 3: return 'Good! 👌';
      case 2: return 'Fair 😐';
      case 1: return 'Needs Improvement 🤔';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.successIcon}>🎉</Text>
          </View>

          {/* Thank You Message */}
          <Text style={styles.title}>Thank You for Reading!</Text>
          <Text style={styles.subtitle}>
            We hope you enjoyed{'\n'}"{cookbook.title}"
          </Text>

          {/* Stats Summary */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{cookbook.recipesCount}</Text>
              <Text style={styles.statLabel}>Recipes Explored</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100+</Text>
              <Text style={styles.statLabel}>Tips Learned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>∞</Text>
              <Text style={styles.statLabel}>Possibilities</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>How would you rate this cookbook?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRate(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Text style={styles.ratingStar}>
                    {star <= rating ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {rating > 0 && (
              <View style={styles.ratingFeedback}>
                <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
              </View>
            )}
          </View>

          {/* Author Thank You Card */}
          <View style={styles.authorCard}>
            <View style={styles.authorHeader}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?img=10' }}
                style={styles.authorAvatar}
                resizeMode="cover"
              />
              <View style={styles.authorBadge}>
                <Text style={styles.authorBadgeText}>Author</Text>
              </View>
            </View>

            <Text style={styles.authorMessage}>
              "Thank you for joining me on this culinary journey. I hope these recipes 
              bring joy to your kitchen and smiles to your table! Remember, cooking is 
              not just about following recipes—it's about creating memories."
            </Text>

            <View style={styles.authorSignature}>
              <Text style={styles.authorName}>— {cookbook.author}</Text>
              <Text style={styles.authorTitle}>Recipe Creator & Food Enthusiast</Text>
            </View>
          </View>

          {/* Achievement Badge */}
          <View style={styles.achievementCard}>
            <Text style={styles.achievementIcon}>🏆</Text>
            <Text style={styles.achievementTitle}>Cookbook Complete!</Text>
            <Text style={styles.achievementText}>
              You've finished reading all {cookbook.recipesCount} recipes. 
              Ready to start cooking?
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleGiveFeedback}
              style={styles.feedbackButton}
            >
              📝 Give Feedback
            </Button>

            <Button
              variant="outline"
              size="large"
              fullWidth
              onPress={handleGoHome}
              style={styles.homeButton}
              textStyle={styles.homeButtonText}
            >
              🏠 Go to Home
            </Button>
          </View>

          {/* Share Section */}
          <View style={styles.shareSection}>
            <Text style={styles.shareTitle}>Share the Love</Text>
            <Text style={styles.shareSubtitle}>
              Help others discover this amazing cookbook
            </Text>
            
            <View style={styles.shareButtons}>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Text style={styles.shareButtonIcon}>📱</Text>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.shareButtonIcon}>🔖</Text>
                <Text style={styles.shareButtonText}>Save to Library</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Explore More */}
          <View style={styles.exploreCard}>
            <Text style={styles.exploreTitle}>Want to Explore More?</Text>
            <Text style={styles.exploreText}>
              Check out other cookbooks from {cookbook.author} and the FlavorMind community
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('DigitalCommittee')}
            >
              <Text style={styles.exploreButtonText}>Browse More Cookbooks →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: moderateScale(SPACING.xl),
  },
  content: {
    paddingHorizontal: moderateScale(SPACING.base),
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: moderateScale(SPACING.xl),
  },
  successIcon: {
    fontSize: scaleFontSize(100),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['4xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  subtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING['2xl']),
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.lg),
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    marginBottom: moderateScale(SPACING.xl),
    ...SHADOWS.medium,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.main,
    marginBottom: moderateScale(SPACING.xs),
  },
  statLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.light,
    marginHorizontal: moderateScale(SPACING.md),
  },
  ratingSection: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.xl),
    ...SHADOWS.medium,
  },
  ratingLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.lg),
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
  },
  starButton: {
    padding: moderateScale(SPACING.xs),
  },
  ratingStar: {
    fontSize: scaleFontSize(52),
  },
  ratingFeedback: {
    marginTop: moderateScale(SPACING.lg),
    backgroundColor: COLORS.pastelGreen.light + '30',
    paddingHorizontal: moderateScale(SPACING.xl),
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.pastelGreen.light,
  },
  ratingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelGreen.dark,
  },
  authorCard: {
    backgroundColor: COLORS.pastelYellow.light,
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    marginBottom: moderateScale(SPACING.xl),
    borderWidth: 2,
    borderColor: COLORS.pastelYellow.main,
    ...SHADOWS.small,
  },
  authorHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
    position: 'relative',
  },
  authorAvatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 4,
    borderColor: COLORS.pastelYellow.main,
    marginBottom: moderateScale(SPACING.md),
  },
  authorBadge: {
    backgroundColor: COLORS.pastelOrange.main,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
  },
  authorBadgeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authorMessage: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    marginBottom: moderateScale(SPACING.lg),
    fontStyle: 'italic',
  },
  authorSignature: {
    alignItems: 'center',
    paddingTop: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.pastelYellow.main,
  },
  authorName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  authorTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  achievementCard: {
    backgroundColor: COLORS.pastelGreen.light + '30',
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.xl),
    borderWidth: 2,
    borderColor: COLORS.pastelGreen.light,
  },
  achievementIcon: {
    fontSize: scaleFontSize(60),
    marginBottom: moderateScale(SPACING.md),
  },
  achievementTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
  },
  achievementText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  actionButtons: {
    width: '100%',
    gap: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.xl),
  },
  feedbackButton: {
    backgroundColor: COLORS.pastelOrange.main,
  },
  homeButton: {
    borderColor: COLORS.pastelOrange.main,
    borderWidth: 2,
  },
  homeButtonText: {
    color: COLORS.pastelOrange.dark,
  },
  shareSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.xl),
  },
  shareTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  shareSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.lg),
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.white,
    borderWidth: 2,
    borderColor: COLORS.border.main,
    ...SHADOWS.small,
  },
  shareButtonIcon: {
    fontSize: scaleFontSize(24),
    marginRight: moderateScale(SPACING.xs),
  },
  shareButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  exploreCard: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  exploreTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
  },
  exploreText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING.lg),
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  exploreButton: {
    backgroundColor: COLORS.pastelGreen.main,
    paddingHorizontal: moderateScale(SPACING.xl),
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.full,
  },
  exploreButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.white,
  },
});

export default CookbookThankYouScreen;
