// src/features/memory/screens/SimilarDishesScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { ArrowLeft, ChefHat, ChevronRight, MapPin } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import memoryService from '../../../services/api/memory.service';

interface SimilarDishesScreenProps {
  navigation: any;
  route: {
    params: {
      memoryQuery?: string;
      memoryId?: string;
      similarDishes?: any[];
    };
  };
}

interface SimilarDish {
  id: string;
  name: string;
  description: string;
  region: string;
  style: string;
  image?: string;
  matchScore: number;
}

const SimilarDishesScreen: React.FC<SimilarDishesScreenProps> = ({ navigation, route }) => {
  const { memoryQuery, memoryId, similarDishes: initialSimilar } = route.params || {};
  const [isFetching, setIsFetching] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isWaitingForAi, setIsWaitingForAi] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizeSimilarDish = (item: any, index: number): SimilarDish => ({
    id: item?.id || `${index}`,
    name: item?.name || item?.title || item?.dish || 'Suggested Dish',
    description: item?.description || item?.summary || 'A delicious recipe tailored to your memory.',
    region: item?.region || item?.cuisine || 'Unknown region',
    style: item?.style || item?.category || 'Signature Recipe',
    image: item?.image || item?.imageUrl,
    matchScore: item?.matchScore ?? item?.match_score ?? item?.score ?? Math.max(70, 95 - index * 5),
  });

  const [similarDishes, setSimilarDishes] = useState<SimilarDish[]>(
    Array.isArray(initialSimilar) ? initialSimilar.map(normalizeSimilarDish) : []
  );

  const mapRecipeToSimilarDish = (recipe: Recipe, index: number): SimilarDish => ({
    id: recipe.id,
    name: recipe.title,
    description: recipe.description || 'A delicious recipe tailored to your memory.',
    region: recipe.region || recipe.cuisine || 'Unknown region',
    style: recipe.style || recipe.category || 'Signature Recipe',
    image: recipe.imageUrl || recipe.image,
    matchScore: recipe.matchScore ?? Math.max(70, 95 - index * 5),
  });

  const loadSimilarDishes = useCallback(async () => {
    if (similarDishes.length > 0) {
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setIsWaitingForAi(false);
    try {
      if (memoryId) {
        try {
          const memoryResponse = await memoryService.getMemory(memoryId);
          const memory = memoryResponse.data.memory as any;
          const memorySimilar = memory?.similarDishes || memory?.generatedRecipe?.similarDishes;
          if (Array.isArray(memorySimilar) && memorySimilar.length > 0) {
            setSimilarDishes(memorySimilar.map(normalizeSimilarDish));
            setIsFetching(false);
            return;
          }

          if (memory?.status === 'processing') {
            setIsFetching(false);
            setIsWaitingForAi(true);
            if (pollTimerRef.current) {
              clearTimeout(pollTimerRef.current);
            }
            pollTimerRef.current = setTimeout(() => {
              loadSimilarDishes();
            }, 2500);
            return;
          }

          setIsFetching(false);
          setIsWaitingForAi(false);
          return;
        } catch (error) {
          console.error('Load memory similar dishes error:', error);
          setIsFetching(false);
          setIsWaitingForAi(true);
          if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
          }
          pollTimerRef.current = setTimeout(() => {
            loadSimilarDishes();
          }, 3000);
          return;
        }
      }

      const response = await recipeService.getSimilarRecipes({
        q: memoryQuery,
        limit: 6,
      });
      const recipes = response.data.recipes || [];
      setSimilarDishes(recipes.map(mapRecipeToSimilarDish));
    } catch (error) {
      console.error('Similar dishes load error:', error);
      setSimilarDishes([]);
    } finally {
      if (!memoryId) {
        setIsFetching(false);
      }
    }
  }, [memoryId, memoryQuery, similarDishes.length]);

  const handleDishSelect = (dish: SimilarDish) => {
    setIsSelecting(true);
    setTimeout(() => {
      navigation.navigate('RecipeCustomization', {
        dishId: dish.id,
        dishName: dish.name,
        memoryQuery: memoryQuery,
      });
    }, 300);
  };

  useEffect(() => {
    loadSimilarDishes();
  }, [loadSimilarDishes]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

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
          {isFetching ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingInlineText}>Searching similar dishes...</Text>
            </View>
          ) : similarDishes.length > 0 ? (
            similarDishes.map((dish) => (
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
                  source={
                    dish.image
                      ? { uri: dish.image }
                      : require('../../../assets/icon.png')
                  }
                  style={styles.dishImage}
                  resizeMode="cover"
                />

                {/* Dish Info */}
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  
                  <View style={styles.metaTags}>
                    <View style={styles.metaTag}>
                      <MapPin size={scaleFontSize(14)} color={COLORS.text.secondary} strokeWidth={2} style={styles.metaIcon} />
                      <Text style={styles.metaText}>{dish.region}</Text>
                    </View>
                    <View style={styles.metaTag}>
                      <ChefHat size={scaleFontSize(14)} color={COLORS.text.secondary} strokeWidth={2} style={styles.metaIcon} />
                      <Text style={styles.metaText}>{dish.style}</Text>
                    </View>
                  </View>

                  <Text style={styles.dishDescription}>{dish.description}</Text>

                  <View style={styles.selectButton}>
                    <View style={styles.selectButtonContent}>
                      <Text style={styles.selectButtonText}>Select This Dish</Text>
                      <ChevronRight size={scaleFontSize(16)} color={COLORS.text.white} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.loadingInline}>
              <Text style={styles.loadingInlineText}>
                {isWaitingForAi ? 'Generating similar dishes...' : 'No similar dishes found yet.'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Loading Overlay */}
      {(isFetching || isSelecting) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>
              {isSelecting ? 'Preparing your recipe...' : 'Loading suggestions...'}
            </Text>
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
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
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
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(SPACING.sm),
  },
  loadingInlineText: {
    marginLeft: moderateScale(SPACING.sm),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SimilarDishesScreen;
