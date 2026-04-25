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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Eye, MessageCircle, Star } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import { buildRemoteImageSource, normalizeDishName } from '../../../common/utils';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import memoryService from '../../../services/api/memory.service';
import { db, hasFirebaseConfig } from '../../../services/firebase/firebase';
import publicRecipeStore, {
  FirestorePublicRecipeFeedback,
  getPublicRecipeKey,
} from '../../../services/firebase/publicRecipeStore';
import { getFirebaseUser, subscribeToFirebaseUser } from '../../../services/firebase/authService';
import { saveRecallHistoryEntry } from '../../../services/storage/asyncStorage';

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
  image?: string;
  matchScore: number;
  rating?: number;
  comments?: number;
  views?: number;
  publicRecipeKey: string;
  source: 'ai' | 'app' | 'retrieved';
  recipe?: Partial<Recipe>;
}

interface PublicRecipeEngagement {
  rating: number;
  comments: number;
  views: number;
}

const PREP_NOTE_PATTERN = /^(finely\s+)?(chopped|sliced|diced|minced|crushed|grated|peeled|seeded|beaten|washed|drained|cooked|shredded|torn|ground|roasted|toasted)$/i;
const QUANTITY_START_PATTERN = /^(\d+(?:[./]\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

const cleanIngredientText = (value: string) =>
  value
    .replace(/^\s*(ingredients?|ingredient list)\s*:\s*/i, '')
    .replace(/^\s*(?:[-*\u2022]|\d+[\).\-\:])\s*/, '')
    .trim();

const shouldSkipIngredient = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return !normalized
    || normalized === 'ingredients'
    || normalized.startsWith('ingredients:')
    || normalized.startsWith('special equipment')
    || normalized.startsWith('equipment:')
    || normalized.startsWith('for serving:')
    || normalized === 'to serve';
};

const looksLikeStandaloneIngredient = (value: string) => {
  const cleaned = cleanIngredientText(value);
  if (!cleaned || /[.!?]/.test(cleaned)) return false;
  return cleaned.split(/\s+/).length <= 8;
};

const splitCommaSeparatedIngredients = (value: string): string[] => {
  const parts = value
    .split(/\s*,\s*/)
    .map(cleanIngredientText)
    .filter(Boolean);

  if (parts.length < 3) {
    return [value];
  }

  const hasQuantityAfterFirst = parts.slice(1).some((part) => QUANTITY_START_PATTERN.test(part));
  const firstHasQuantity = QUANTITY_START_PATTERN.test(parts[0]);
  const trailingPartsLookLikeIngredients = parts
    .slice(1)
    .every((part) => looksLikeStandaloneIngredient(part.replace(/^or\s+/i, '')));
  const looksLikeNameList = parts.every(
    (part) => looksLikeStandaloneIngredient(part) || PREP_NOTE_PATTERN.test(part)
  );

  if (!hasQuantityAfterFirst && !looksLikeNameList && !(firstHasQuantity && trailingPartsLookLikeIngredients)) {
    return [value];
  }

  return parts.reduce<string[]>((acc, part) => {
    const cleanedPart = part.replace(/^or\s+/i, '');
    if (PREP_NOTE_PATTERN.test(cleanedPart) && acc.length > 0) {
      acc[acc.length - 1] = `${acc[acc.length - 1]} ${cleanedPart}`;
      return acc;
    }

    acc.push(cleanedPart);
    return acc;
  }, []);
};

const splitIngredientText = (value: string): string[] =>
  value
    .replace(/\r/g, '\n')
    .trim()
    .split(/\n+/)
    .flatMap((line) => line.split(/\s+(?=\d+[\).\-\:]\s)/))
    .flatMap((line) => line.split(/\s*[;|]\s*/))
    .flatMap(splitCommaSeparatedIngredients)
    .map(cleanIngredientText)
    .filter(Boolean)
    .filter((line) => !shouldSkipIngredient(line));

const normalizeIngredientList = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return splitIngredientText(value);
  }
  return [];
};

const splitIntoSentences = (value: string): string[] =>
  (value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeInstructionList = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const numberedOrLines = value
      .replace(/\r/g, '\n')
      .replace(/^\s*(instructions?|method|steps)\s*:\s*/i, '')
      .split(/\n+|\s+(?=(?:step\s*)?\d+[\).\-\:]\s)/i)
      .map((item) => item.replace(/^\s*(step\s*)?\d+[\).\-\:]?\s*/i, '').trim())
      .filter(Boolean);
    const steps = numberedOrLines.length > 1
      ? numberedOrLines
      : splitIntoSentences(value);
    return steps.map((description, index) => ({ step: index + 1, description }));
  }
  return [];
};

const SimilarDishesScreen: React.FC<SimilarDishesScreenProps> = ({ navigation, route }) => {
  const { memoryQuery, memoryId, similarDishes: initialSimilar } = route.params || {};
  const [isFetching, setIsFetching] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isWaitingForAi, setIsWaitingForAi] = useState(false);
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(
    getFirebaseUser()?.uid || null
  );
  const [engagementByKey, setEngagementByKey] = useState<Record<string, PublicRecipeEngagement>>({});
  const [commentSheetDish, setCommentSheetDish] = useState<SimilarDish | null>(null);
  const [commentSheetVisible, setCommentSheetVisible] = useState(false);
  const [commentSheetLoading, setCommentSheetLoading] = useState(false);
  const [commentSheetFeedback, setCommentSheetFeedback] = useState<FirestorePublicRecipeFeedback[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getRecipeSource = (item: any, fallbackId?: string): 'ai' | 'app' | 'retrieved' => {
    const source = String(item?.source || item?.sourceType || '').toLowerCase();
    const resolvedId = String(item?.id || fallbackId || '');
    if (source === 'ai' || resolvedId.startsWith('ai:')) return 'ai';
    if (source === 'retrieved') return 'retrieved';
    return 'app';
  };

  const buildDishPublicRecipeKey = (item: any, title: string, fallbackId?: string) =>
    getPublicRecipeKey({
      id: item?.id || fallbackId,
      externalId: item?.externalId || item?.id || fallbackId,
      title,
      source: getRecipeSource(item, fallbackId),
    });
  const mapRecipePayload = (item: any, fallbackTitle?: string): Partial<Recipe> => ({
    id: item?.id,
    title: normalizeDishName(item?.title || item?.name || item?.dish, fallbackTitle || memoryQuery),
    description: item?.description || item?.summary || '',
    cuisine: item?.cuisine || item?.region || '',
    category: item?.category || item?.style || undefined,
    difficulty: item?.difficulty || 'medium',
    prepTime: item?.prepTime ?? item?.prep_time ?? 0,
    cookTime: item?.cookTime ?? item?.cook_time ?? 0,
    servings: item?.servings ?? 1,
    ingredients: normalizeIngredientList(item?.ingredients),
    instructions: Array.isArray(item?.instructions)
      ? item.instructions
      : Array.isArray(item?.steps)
        ? item.steps.map((step: any, index: number) =>
            typeof step === 'string'
              ? { step: index + 1, description: step }
              : {
                  step: step?.step ?? index + 1,
                  description: step?.description || `${step}`,
                }
          )
        : normalizeInstructionList(item?.instructions || item?.steps),
    image: item?.image,
    imageUrl: item?.imageUrl || item?.image,
    rating: typeof item?.rating === 'number' ? item.rating : Number(item?.ratingAverage ?? 0),
    feedbackCount: typeof item?.feedbackCount === 'number'
      ? item.feedbackCount
      : Number(item?.ratingCount ?? item?.comments ?? 0),
    matchScore: item?.matchScore ?? item?.match_score ?? item?.score,
    localSubstitutions: Array.isArray(item?.localSubstitutions)
      ? item.localSubstitutions
      : Array.isArray(item?.local_substitutions)
        ? item.local_substitutions
        : [],
  });

const normalizeSimilarDish = (item: any, index: number): SimilarDish => {
  const name = normalizeDishName(item?.name || item?.title || item?.dish, memoryQuery);
  const source = getRecipeSource(item, item?.id || `${index}`);
  return {
    id: item?.id || `${index}`,
    name,
    description: item?.description || item?.summary || 'A delicious recipe tailored to your memory.',
    image: item?.image || item?.imageUrl,
    matchScore: item?.matchScore ?? item?.match_score ?? item?.score ?? Math.max(70, 95 - index * 5),
    rating: typeof item?.rating === 'number' ? item.rating : Number(item?.ratingAverage ?? 0),
    comments: typeof item?.feedbackCount === 'number'
      ? item.feedbackCount
      : Number(item?.ratingCount ?? item?.comments ?? 0),
    views: typeof item?.views === 'number'
      ? item.views
      : Number(item?.viewCount ?? item?.view_count ?? 0),
    publicRecipeKey: buildDishPublicRecipeKey(item, name, item?.id || `${index}`),
    source,
    recipe: mapRecipePayload(item),
  };
};

  const [similarDishes, setSimilarDishes] = useState<SimilarDish[]>(
    Array.isArray(initialSimilar) ? initialSimilar.map(normalizeSimilarDish) : []
  );

  const mapRecipeToSimilarDish = (recipe: Recipe, index: number): SimilarDish => {
    const name = normalizeDishName(recipe.title, memoryQuery);
    const source = getRecipeSource(recipe, recipe.id);
    return {
      id: recipe.id,
      name,
      description: recipe.description || 'A delicious recipe tailored to your memory.',
      image: recipe.imageUrl || recipe.image,
      matchScore: recipe.matchScore ?? Math.max(70, 95 - index * 5),
      rating: recipe.rating ?? 0,
      comments: recipe.feedbackCount ?? 0,
      views: recipe.views ?? 0,
      publicRecipeKey: buildDishPublicRecipeKey(recipe, name, recipe.id),
      source,
      recipe: mapRecipePayload(recipe, recipe.title),
    };
  };

  const closeCommentSheet = () => {
    setCommentSheetVisible(false);
    setCommentSheetDish(null);
    setCommentSheetFeedback([]);
  };

  const incrementDishViews = async (dish: SimilarDish) => {
    if (!firebaseUserId || !hasFirebaseConfig) return;
    try {
      await publicRecipeStore.incrementRecipeViews(dish.publicRecipeKey);
      setEngagementByKey((current) => ({
        ...current,
        [dish.publicRecipeKey]: {
          rating: current[dish.publicRecipeKey]?.rating ?? dish.rating ?? 0,
          comments: current[dish.publicRecipeKey]?.comments ?? dish.comments ?? 0,
          views: (current[dish.publicRecipeKey]?.views ?? dish.views ?? 0) + 1,
        },
      }));
    } catch {
      // Ignore view tracking failures on the card list.
    }
  };

  const handleOpenRecipeComments = (dish: SimilarDish) => {
    void incrementDishViews(dish);
    setCommentSheetDish(dish);
    setCommentSheetVisible(true);
  };

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

  const formatCount = (value?: number) => {
    const safeValue = Number.isFinite(value) ? Number(value) : 0;
    if (safeValue < 1000) return `${safeValue}`;
    const compact = (safeValue / 1000).toFixed(1).replace(/\.0$/, '');
    return `${compact}k`;
  };

  const getDishEngagement = (dish: SimilarDish): PublicRecipeEngagement =>
    engagementByKey[dish.publicRecipeKey] || {
      rating: dish.rating ?? 0,
      comments: dish.comments ?? 0,
      views: dish.views ?? 0,
    };

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

  const handleDishSelect = async (dish: SimilarDish) => {
    setIsSelecting(true);
    void incrementDishViews(dish);

    try {
      if (memoryQuery?.trim()) {
        await saveRecallHistoryEntry({
          prompt: memoryQuery,
          dishName: dish.name,
          recipeId: dish.recipe?.id || dish.id,
          image: dish.image,
        });
      }
    } catch (error) {
      console.warn('Recall history save error:', error);
    }

    setTimeout(() => {
      navigation.navigate('RecipeCustomization', {
        dishId: dish.id,
        dishName: dish.name,
        dishImage: dish.image,
        recipe: dish.recipe,
        memoryQuery: memoryQuery,
      });
    }, 300);
  };

  useEffect(() => {
    loadSimilarDishes();
  }, [loadSimilarDishes]);

  useEffect(() => subscribeToFirebaseUser((user) => {
    setFirebaseUserId(user?.uid || null);
  }), []);

  useEffect(() => {
    if (!similarDishes.length) {
      setEngagementByKey({});
      return;
    }

    setEngagementByKey((current) => {
      const next = { ...current };
      similarDishes.forEach((dish) => {
        if (!next[dish.publicRecipeKey]) {
          next[dish.publicRecipeKey] = {
            rating: dish.rating ?? 0,
            comments: dish.comments ?? 0,
            views: dish.views ?? 0,
          };
        }
      });
      return next;
    });

    if (!hasFirebaseConfig || !db) {
      return;
    }
    const firestore = db;

    let isMounted = true;
    if (firebaseUserId) {
      Promise.all(
        similarDishes.map((dish) =>
          publicRecipeStore.ensurePublicRecipeDocument({
            id: dish.recipe?.id || dish.id,
            externalId: dish.recipe?.id || dish.id,
            title: dish.name,
            description: dish.description,
            imageUrl: dish.image || null,
            image: dish.image || null,
            source: dish.source,
          }).catch(() => null)
        )
      ).catch(() => undefined);
    }

    const unsubscribes = similarDishes.map((dish) =>
      onSnapshot(
        doc(firestore, 'publicRecipes', dish.publicRecipeKey),
        (snapshot) => {
          if (!isMounted) return;
          const data = snapshot.data() as Record<string, any> | undefined;
          setEngagementByKey((current) => ({
            ...current,
            [dish.publicRecipeKey]: {
              rating: Number(data?.rating ?? dish.rating ?? 0),
              comments: Number(data?.feedbackCount ?? dish.comments ?? 0),
              views: Number(data?.views ?? dish.views ?? 0),
            },
          }));
        }
      )
    );

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [similarDishes, firebaseUserId]);

  useEffect(() => {
    if (!commentSheetVisible || !commentSheetDish || !hasFirebaseConfig || !db) {
      return;
    }
    const firestore = db;

    setCommentSheetLoading(true);
    const feedbackQuery = query(
      collection(firestore, 'publicRecipes', commentSheetDish.publicRecipeKey, 'feedback'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<FirestorePublicRecipeFeedback, 'id'>),
        }));
        setCommentSheetFeedback(items);
        setCommentSheetLoading(false);
      },
      () => {
        setCommentSheetFeedback([]);
        setCommentSheetLoading(false);
      }
    );

    return () => unsubscribe();
  }, [commentSheetVisible, commentSheetDish]);

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
            similarDishes.map((dish) => {
              const engagement = getDishEngagement(dish);
              return (
              <View
                key={dish.id}
                style={styles.dishCard}
              >
                {/* Match Score Badge */}
                <View style={styles.matchBadge}>
                  <Text style={styles.matchText}>{dish.matchScore}% Match</Text>
                </View>

                {/* Dish Image */}
                <Image
                  source={buildRemoteImageSource(dish.image) || require('../../../assets/icons/book.png')}
                  style={styles.dishImage}
                  resizeMode="cover"
                />

                {/* Dish Info */}
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{dish.name}</Text>

                  <View style={styles.engagementRow}>
                    <View style={styles.engagementPill}>
                      <Star
                        size={scaleFontSize(14)}
                        color={COLORS.pastelOrange.main}
                        fill={COLORS.pastelOrange.main}
                        strokeWidth={1.5}
                        style={styles.engagementIcon}
                      />
                      <Text style={styles.engagementText}>
                        {engagement.rating > 0 ? engagement.rating.toFixed(1) : '0.0'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.engagementPill}
                      onPress={() => handleOpenRecipeComments(dish)}
                      activeOpacity={0.8}
                    >
                      <MessageCircle
                        size={scaleFontSize(14)}
                        color={COLORS.text.secondary}
                        strokeWidth={1.8}
                        style={styles.engagementIcon}
                      />
                      <Text style={styles.engagementText}>
                        {formatCount(engagement.comments)}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.engagementPill}>
                      <Eye
                        size={scaleFontSize(14)}
                        color={COLORS.text.secondary}
                        strokeWidth={1.8}
                        style={styles.engagementIcon}
                      />
                      <Text style={styles.engagementText}>
                        {formatCount(engagement.views)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.dishDescription}>{dish.description}</Text>

                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => void handleDishSelect(dish)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.selectButtonContent}>
                      <Text style={styles.selectButtonText}>Select This Dish</Text>
                      <ChevronRight size={scaleFontSize(16)} color={COLORS.text.white} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )})
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

      <Modal
        visible={commentSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={closeCommentSheet}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Comments</Text>
                {commentSheetDish ? (
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {commentSheetDish.name}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={closeCommentSheet} activeOpacity={0.8}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>

            {commentSheetDish ? (
              <View style={styles.modalStatsRow}>
                <View style={styles.modalStatPill}>
                  <Star
                    size={scaleFontSize(14)}
                    color={COLORS.pastelOrange.main}
                    fill={COLORS.pastelOrange.main}
                    strokeWidth={1.5}
                    style={styles.engagementIcon}
                  />
                  <Text style={styles.modalStatText}>
                    {getDishEngagement(commentSheetDish).rating > 0
                      ? getDishEngagement(commentSheetDish).rating.toFixed(1)
                      : '0.0'}
                  </Text>
                </View>
                <View style={styles.modalStatPill}>
                  <MessageCircle
                    size={scaleFontSize(14)}
                    color={COLORS.text.secondary}
                    strokeWidth={1.8}
                    style={styles.engagementIcon}
                  />
                  <Text style={styles.modalStatText}>
                    {formatCount(getDishEngagement(commentSheetDish).comments)}
                  </Text>
                </View>
                <View style={styles.modalStatPill}>
                  <Eye
                    size={scaleFontSize(14)}
                    color={COLORS.text.secondary}
                    strokeWidth={1.8}
                    style={styles.engagementIcon}
                  />
                  <Text style={styles.modalStatText}>
                    {formatCount(getDishEngagement(commentSheetDish).views)}
                  </Text>
                </View>
              </View>
            ) : null}

            {commentSheetLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
                <Text style={styles.modalLoadingText}>Loading comments...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {commentSheetFeedback.length === 0 ? (
                  <Text style={styles.emptyCommentsText}>No comments yet.</Text>
                ) : (
                  commentSheetFeedback.map((feedback) => (
                    <View key={feedback.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <Image
                          source={
                            buildRemoteImageSource(feedback.userAvatar)
                            || require('../../../assets/icons/user.png')
                          }
                          style={styles.commentAvatar}
                          resizeMode="cover"
                        />
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentName}>
                            {feedback.userName || 'Anonymous'}
                          </Text>
                          <Text style={styles.commentDate}>
                            {formatTimeAgo(feedback.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.commentText}>
                        {feedback.publicComment || feedback.comment || ''}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  engagementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.md),
  },
  engagementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
  },
  engagementIcon: {
    marginRight: moderateScale(4),
  },
  engagementText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.background.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.lg),
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.md),
  },
  modalTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  modalSubtitle: {
    marginTop: moderateScale(4),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  modalClose: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  modalStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.md),
  },
  modalStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
  },
  modalStatText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    paddingVertical: moderateScale(SPACING.md),
  },
  modalLoadingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  modalScroll: {
    flexGrow: 0,
  },
  emptyCommentsText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    paddingVertical: moderateScale(SPACING.lg),
  },
  commentCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.md),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.sm),
  },
  commentAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    marginRight: moderateScale(SPACING.sm),
  },
  commentMeta: {
    flex: 1,
  },
  commentName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  commentDate: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  commentText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
});

export default SimilarDishesScreen;
