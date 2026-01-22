// src/features/memory/screens/SimilarDishesScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';

interface SimilarDishesScreenProps {
  navigation: any;
  route: {
    params: {
      memoryQuery: string;
    };
  };
}

interface SimilarDish {
  id: string;
  name: string;
  description: string;
  region: string;
  style: string;
  image: string;
  matchScore: number;
}

const SimilarDishesScreen: React.FC<SimilarDishesScreenProps> = ({ navigation, route }) => {
  const { memoryQuery } = route.params;
  const [loading, setLoading] = useState(false);

  // Mock similar dishes - In production, this comes from AI
  const similarDishes: SimilarDish[] = [
    {
      id: '1',
      name: 'Maldive Fish Curry (Mas Riha)',
      description: 'Traditional Sri Lankan fish curry with coconut milk, goraka (garcinia), and aromatic spices. Known for its sour and spicy flavor profile.',
      region: 'Southern Sri Lanka',
      style: 'Traditional Home Cooking',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      matchScore: 98,
    },
    {
      id: '2',
      name: 'Ambul Thiyal (Sour Fish Curry)',
      description: 'Dry fish curry with goraka, giving it a distinctive sour taste. A beloved traditional dish from coastal regions.',
      region: 'Coastal Sri Lanka',
      style: 'Heritage Recipe',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      matchScore: 95,
    },
    {
      id: '3',
      name: 'Fish Curry with Coconut Milk',
      description: 'Creamy coconut-based fish curry with turmeric, curry leaves, and pandan. A comfort food classic.',
      region: 'Western Sri Lanka',
      style: 'Home Style Cooking',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      matchScore: 92,
    },
    {
      id: '4',
      name: 'Spicy Tuna Curry',
      description: 'Bold and spicy tuna curry with red chili, black pepper, and fenugreek. Perfect with rice.',
      region: 'Northern Sri Lanka',
      style: 'Regional Specialty',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      matchScore: 88,
    },
  ];

  const handleDishSelect = (dish: SimilarDish) => {
    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('RecipeCustomization', {
        dishId: dish.id,
        dishName: dish.name,
        memoryQuery: memoryQuery,
      });
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.pageIntro}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Similar Dishes Found</Text>
      </View>

      {/* Memory Query Display */}
      <View style={styles.memoryDisplay}>
        <Text style={styles.memoryLabel}>Your Memory:</Text>
        <Text style={styles.memoryText}>{memoryQuery}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dishesContainer}>
          {similarDishes.map((dish) => (
            <TouchableOpacity
              key={dish.id}
              style={styles.dishCard}
              onPress={() => handleDishSelect(dish)}
              activeOpacity={0.9}
            >
              {/* Match Score Badge */}
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>{dish.matchScore}% Match</Text>
              </View>

              {/* Dish Image */}
              <Image
                source={{ uri: dish.image }}
                style={styles.dishImage}
                resizeMode="cover"
              />

              {/* Dish Info */}
              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{dish.name}</Text>
                
                <View style={styles.metaTags}>
                  <View style={styles.metaTag}>
                    <Text style={styles.metaIcon}>📍</Text>
                    <Text style={styles.metaText}>{dish.region}</Text>
                  </View>
                  <View style={styles.metaTag}>
                    <Text style={styles.metaIcon}>👨‍🍳</Text>
                    <Text style={styles.metaText}>{dish.style}</Text>
                  </View>
                </View>

                <Text style={styles.dishDescription}>{dish.description}</Text>

                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select This Dish →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>Preparing your recipe...</Text>
          </View>
        </View>
      )}
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
  headerSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  memoryDisplay: {
    backgroundColor: COLORS.pastelYellow.light,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.md),
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
  },
  memoryLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.secondary,
    marginBottom: moderateScale(4),
  },
  memoryText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  dishesContainer: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
  },
  dishCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: moderateScale(SPACING.lg),
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  matchBadge: {
    position: 'absolute',
    top: moderateScale(SPACING.md),
    right: moderateScale(SPACING.md),
    backgroundColor: COLORS.pastelGreen.main,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
    zIndex: 1,
    ...SHADOWS.small,
  },
  matchText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  dishImage: {
    width: '100%',
    height: moderateScale(200),
  },
  dishInfo: {
    padding: moderateScale(SPACING.lg),
  },
  dishName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
  },
  metaTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.md),
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
  },
  metaIcon: {
    fontSize: scaleFontSize(12),
    marginRight: moderateScale(4),
  },
  metaText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  dishDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
    marginBottom: moderateScale(SPACING.md),
  },
  selectButton: {
    backgroundColor: COLORS.pastelOrange.main,
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.white,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING['2xl']),
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  loadingText: {
    marginTop: moderateScale(SPACING.md),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SimilarDishesScreen;
