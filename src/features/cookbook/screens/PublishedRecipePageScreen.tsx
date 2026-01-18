// src/features/cookbook/screens/PublishedRecipePageScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';

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

  // Mock feedback data
  const feedbackList: Feedback[] = [
    {
      id: '1',
      userName: 'Amara Perera',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      rating: 5,
      comment: 'This is absolutely delicious! Made it for my family and everyone loved it. The instructions were clear and easy to follow.',
      createdAt: '2 days ago',
    },
    {
      id: '2',
      userName: 'Kasun Silva',
      userAvatar: 'https://i.pravatar.cc/150?img=2',
      rating: 4,
      comment: 'Great recipe! I added a bit more chili and it was perfect. Thanks for sharing!',
      createdAt: '5 days ago',
    },
    {
      id: '3',
      userName: 'Nisha Fernando',
      userAvatar: 'https://i.pravatar.cc/150?img=3',
      rating: 5,
      comment: 'Perfect! Exactly what I was looking for. The taste is authentic and reminds me of my grandmother\'s cooking.',
      createdAt: '1 week ago',
    },
    {
      id: '4',
      userName: 'Dilshan Raj',
      userAvatar: 'https://i.pravatar.cc/150?img=4',
      rating: 5,
      comment: 'Excellent recipe. Very well explained. Made it twice already!',
      createdAt: '2 weeks ago',
    },
  ];

  const averageRating = recipe.rating || 4.9;
  const totalFeedback = recipe.feedbackCount || feedbackList.length;

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={styles.star}>
        {index < rating ? '⭐' : '☆'}
      </Text>
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Published Recipe</Text>
        <View style={styles.placeholder} />
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
          source={{ uri: recipe.dishImage }}
          style={styles.recipeImage}
          resizeMode="cover"
        />

        {/* Recipe Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.dishTitle}>{recipe.dishName}</Text>
          
          <Text style={styles.description}>
            {recipe.description || 'A delicious traditional recipe that has been loved by many. Perfect for family gatherings and special occasions.'}
          </Text>

          {/* Rating Summary */}
          <View style={styles.ratingSummary}>
            <View style={styles.ratingLeft}>
              <View style={styles.starsRow}>
                {renderStars(Math.round(averageRating))}
              </View>
              <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
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

          {feedbackList.map((feedback) => (
            <View key={feedback.id} style={styles.feedbackCard}>
              <View style={styles.feedbackUserRow}>
                <Image
                  source={{ uri: feedback.userAvatar }}
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

          {feedbackList.length === 0 && (
            <View style={styles.noFeedbackCard}>
              <Text style={styles.noFeedbackIcon}>💬</Text>
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
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  placeholder: {
    width: moderateScale(40),
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
    fontSize: scaleFontSize(20),
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
    fontSize: scaleFontSize(64),
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
