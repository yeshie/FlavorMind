// src/features/cookbook/screens/PublishedRecipePageScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Star } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import feedbackStore, { FirestoreFeedback } from '../../../services/firebase/feedbackStore';
import { hasFirebaseConfig } from '../../../services/firebase/firebase';

interface PublishedRecipePageScreenProps {
  navigation: any;
  route: {
    params: {
      recipe: any;
    };
  };
}

interface Feedback {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const PublishedRecipePageScreen: React.FC<PublishedRecipePageScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { recipe } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);

  const formatTimeAgo = (value?: unknown) => {
    if (!value) return 'Just now';
    let date: Date | null = null;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    } else if (typeof value === 'object' && value) {
      const anyValue = value as { toDate?: () => Date; toMillis?: () => number };
      if (typeof anyValue.toDate === 'function') {
        date = anyValue.toDate();
      } else if (typeof anyValue.toMillis === 'function') {
        date = new Date(anyValue.toMillis());
      }
    }

    if (!date) return 'Just now';
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const mapFeedback = (feedback: FirestoreFeedback): Feedback => ({
    id: feedback.id,
    userName: feedback.userName || 'Anonymous',
    userAvatar: feedback.userAvatar || '',
    rating: feedback.rating,
    comment: feedback.publicComment || feedback.comment || '',
    createdAt: formatTimeAgo(feedback.createdAt),
  });

  const loadFeedback = async (isRefresh = false) => {
    if (!hasFirebaseConfig || !recipe?.id) {
      setFeedbackList([]);
      setLoadingFeedback(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingFeedback(true);
    }

    try {
      const feedbackDocs = await feedbackStore.getRecipeFeedback(recipe.id);
      setFeedbackList(feedbackDocs.map(mapFeedback));
    } catch (error) {
      console.error('Feedback load error:', error);
      setFeedbackList([]);
    } finally {
      setLoadingFeedback(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [recipe?.id]);

  const averageRating = useMemo(() => {
    if (typeof recipe?.rating === 'number') return recipe.rating;
    if (feedbackList.length === 0) return 0;
    const total = feedbackList.reduce((sum, item) => sum + item.rating, 0);
    return total / feedbackList.length;
  }, [recipe?.rating, feedbackList]);

  const totalFeedback = recipe?.feedbackCount ?? feedbackList.length;
  const dishName = recipe?.dishName || recipe?.title || 'Recipe';
  const dishImage = recipe?.dishImage || recipe?.imageUrl || recipe?.image || '';

  const handleRefresh = async () => {
    await loadFeedback(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={scaleFontSize(18)}
        color={index < rating ? COLORS.pastelOrange.main : COLORS.border.light}
        fill={index < rating ? COLORS.pastelOrange.main : 'transparent'}
        strokeWidth={1.5}
        style={styles.star}
      />
    ));
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
        <Text style={styles.headerTitle}>Published Recipe</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Recipe Image */}
        <Image
          source={
            dishImage
              ? { uri: dishImage }
              : require('../../../assets/icons/book.png')
          }
          style={styles.recipeImage}
          resizeMode="cover"
        />

        {/* Recipe Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.dishTitle}>{dishName}</Text>
          
          <Text style={styles.description}>
            {recipe.description || 'A delicious traditional recipe that has been loved by many. Perfect for family gatherings and special occasions.'}
          </Text>

          {/* Rating Summary */}
          <View style={styles.ratingSummary}>
            <View style={styles.ratingLeft}>
              <View style={styles.starsRow}>
                {renderStars(Math.round(averageRating))}
              </View>
              <Text style={styles.ratingNumber}>
                {averageRating > 0 ? averageRating.toFixed(1) : '--'}
              </Text>
            </View>
            <View style={styles.ratingRight}>
              <Text style={styles.feedbackCount}>
                {totalFeedback} {totalFeedback === 1 ? 'Review' : 'Reviews'}
              </Text>
            </View>
          </View>
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackTitle}>User Feedback</Text>
            <Text style={styles.feedbackSubtitle}>What others are saying</Text>
          </View>

          {loadingFeedback && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingText}>Loading feedback...</Text>
            </View>
          )}

          {feedbackList.map((feedback) => (
            <View key={feedback.id} style={styles.feedbackCard}>
              <View style={styles.feedbackUserRow}>
                <Image
                  source={
                    feedback.userAvatar
                      ? { uri: feedback.userAvatar }
                      : require('../../../assets/icons/user.png')
                  }
                  style={styles.userAvatar}
                  resizeMode="cover"
                />
                <View style={styles.feedbackUserInfo}>
                  <Text style={styles.feedbackUserName}>{feedback.userName}</Text>
                  <View style={styles.feedbackMeta}>
                    <View style={styles.feedbackStars}>
                      {renderStars(feedback.rating)}
                    </View>
                    <Text style={styles.feedbackDate}>{feedback.createdAt}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.feedbackComment}>{feedback.comment}</Text>
            </View>
          ))}

          {!loadingFeedback && feedbackList.length === 0 && (
            <View style={styles.noFeedbackCard}>
              <MessageCircle
                size={scaleFontSize(36)}
                color={COLORS.text.secondary}
                strokeWidth={1.8}
                style={styles.noFeedbackIcon}
              />
              <Text style={styles.noFeedbackText}>No feedback yet</Text>
              <Text style={styles.noFeedbackSubtext}>
                Be the first to share your experience!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  recipeImage: {
    width: '100%',
    height: moderateScale(300),
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
  description: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    marginBottom: moderateScale(SPACING.lg),
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: moderateScale(SPACING.lg),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: moderateScale(SPACING.md),
  },
  star: {
    marginRight: moderateScale(2),
  },
  ratingNumber: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  ratingRight: {},
  feedbackCount: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  feedbackSection: {
    marginTop: moderateScale(SPACING.xl),
    paddingHorizontal: moderateScale(SPACING.base),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.md),
  },
  loadingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  feedbackHeader: {
    marginBottom: moderateScale(SPACING.lg),
  },
  feedbackTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  feedbackSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  feedbackCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.lg),
    marginBottom: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  feedbackUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  userAvatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    marginRight: moderateScale(SPACING.md),
    borderWidth: 2,
    borderColor: COLORS.pastelOrange.light,
  },
  feedbackUserInfo: {
    flex: 1,
  },
  feedbackUserName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  feedbackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackStars: {
    flexDirection: 'row',
    marginRight: moderateScale(SPACING.md),
  },
  feedbackDate: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  feedbackComment: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  noFeedbackCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING['3xl']),
    alignItems: 'center',
    ...SHADOWS.small,
  },
  noFeedbackIcon: {
    marginBottom: moderateScale(SPACING.md),
  },
  noFeedbackText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  noFeedbackSubtext: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default PublishedRecipePageScreen;
