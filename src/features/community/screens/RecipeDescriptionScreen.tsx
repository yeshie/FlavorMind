// src/features/community/screens/RecipeDescriptionScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  Eye,
  Flame,
  Lightbulb,
  MapPin,
  MessageCircle,
  Sprout,
  Star,
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import { buildRemoteImageSource } from '../../../common/utils';
import Button from '../../../common/components/Button/button';
import { getFirebaseUser, subscribeToFirebaseUser } from '../../../services/firebase/authService';
import recipeService from '../../../services/api/recipe.service';
import feedbackService, { Feedback as ApiFeedback } from '../../../services/api/feedback.service';
import recipeStore, { FirestoreRecipe } from '../../../services/firebase/recipeStore';
import publicRecipeStore, { getPublicRecipeKey } from '../../../services/firebase/publicRecipeStore';
import { db, hasFirebaseConfig } from '../../../services/firebase/firebase';
import feedbackStore, { FirestoreFeedback } from '../../../services/firebase/feedbackStore';
import { recordRecipeActivity } from '../../../services/storage/asyncStorage';

interface RecipeDescriptionScreenProps {
  navigation: any;
  route: {
    params: {
      recipeId?: string;
      recipe?: any;
      openComments?: boolean;
    };
  };
}

const MIN_DETAIL_INGREDIENTS = 3;
const MIN_DETAIL_INSTRUCTIONS = 2;

const RecipeDescriptionScreen: React.FC<RecipeDescriptionScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const {
    recipe: recipeParam,
    recipeId: recipeIdParam,
    openComments: openCommentsParam,
  } = route.params;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FirestoreFeedback[]>([]);
  const [apiFeedbackList, setApiFeedbackList] = useState<FirestoreFeedback[]>([]);
  const [apiFeedbackSummary, setApiFeedbackSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [showComments, setShowComments] = useState(Boolean(openCommentsParam));
  const [replyDraft, setReplyDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<FirestoreRecipe | null>(
    recipeParam || null
  );
  const trackedViewKeyRef = useRef<string | null>(null);
  const ensuredPublicRecipeKeyRef = useRef<string | null>(null);
  const [interactionRecipeId, setInteractionRecipeId] = useState<string | undefined>(undefined);
  const [interactionTarget, setInteractionTarget] =
    useState<'recipes' | 'publicRecipes' | undefined>(undefined);
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(
    getFirebaseUser()?.uid || null
  );

  const recipeId = recipeIdParam || recipe?.id || recipeParam?.id;

  useEffect(() => subscribeToFirebaseUser((user) => {
    setFirebaseUserId(user?.uid || null);
  }), []);

  useEffect(() => {
    if (openCommentsParam) {
      setShowComments(true);
    }
  }, [openCommentsParam]);

  const isGeneratedRecipeId = (value?: string | null) => {
    if (!value) return false;
    return value.startsWith('ai:') || value.includes('%20') || value.includes(' ');
  };

  const isPermissionDeniedError = (error: unknown) => {
    const code = (error as { code?: string } | null)?.code || '';
    const message =
      (error as { message?: string } | null)?.message?.toLowerCase() || '';
    return code.includes('permission-denied') || message.includes('insufficient permissions');
  };

  const getMeaningfulCreator = (value?: string | null) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.toLowerCase() === 'flavormind') return undefined;
    return trimmed;
  };

  const normalizeSourceLabel = (value?: string | null) => {
    if (!value) return undefined;
    return value === 'Retrieved Recipe' ? 'App Recipe' : value;
  };

  const isUserCreatedRecipe = (value?: Record<string, any> | null) =>
    Boolean(
      value
      && (
        value.ownerId
        || value.isFirebaseRecipe
        || value.source === 'user'
        || value.sourceType === 'firebase-user'
        || value.sourceType === 'firebase-approved'
      )
    );

  const countRecipeItems = (value: unknown) => {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') {
      return value
        .replace(/\r/g, '\n')
        .split(/\n+|[;|]/)
        .map((item) => item.trim())
        .filter(Boolean).length;
    }
    return 0;
  };

  const hasDetailedRecipePayload = (value?: Record<string, any> | null) =>
    Boolean(
      value
      && (
        isUserCreatedRecipe(value)
        || (
          countRecipeItems(value.ingredients) >= MIN_DETAIL_INGREDIENTS
          && countRecipeItems(value.instructions || value.steps) >= MIN_DETAIL_INSTRUCTIONS
        )
      )
    );

  const prefersPublicRecipeStore = () =>
    !isUserCreatedRecipe((recipe || recipeParam) as Record<string, any> | null);

  const getGeneratedDishName = () => {
    const titleFromParam =
      recipeParam?.title ||
      recipeParam?.name ||
      recipeParam?.dish;
    if (titleFromParam) {
      return titleFromParam;
    }

    if (!recipeId) {
      return '';
    }

    const raw = recipeId.startsWith('ai:') ? recipeId.slice(3) : recipeId;
    try {
      return decodeURIComponent(raw).replace(/\+/g, ' ').trim();
    } catch {
      return raw.replace(/\+/g, ' ').trim();
    }
  };

  useEffect(() => {
    if (!recipeId) return;
    const shouldBypassFirestore = isGeneratedRecipeId(recipeId);
    const shouldUseUserRecipeFirestore = isUserCreatedRecipe(recipeParam);
    const shouldLoadFromApi = !recipeParam || !hasDetailedRecipePayload(recipeParam);
    let didFallback = false;

    const loadFromApi = async () => {
      try {
        let data: any = null;

        if (shouldBypassFirestore) {
          const dish = getGeneratedDishName();
          if (!dish) {
            return;
          }

          const response = await recipeService.generateRecipeByDish({
            dish,
            servings: recipeParam?.servings || 4,
          });
          data = response.data?.recipe;
        } else {
          const response = await recipeService.getRecipe(recipeId);
          data = response.data?.recipe;
        }

        if (data) {
          setRecipe((current) => ({
            id: data.id || recipeId,
            title: data.title || current?.title,
            description: data.description || current?.description,
            cuisine: data.cuisine || current?.cuisine,
            category: data.category || current?.category,
            difficulty: data.difficulty || current?.difficulty,
            prepTime: data.prepTime ?? current?.prepTime,
            cookTime: data.cookTime ?? current?.cookTime,
            servings: data.servings ?? current?.servings,
            ingredients: data.ingredients || current?.ingredients,
            instructions: data.instructions || current?.instructions,
            imageUrl:
              data.imageUrl
              || data.image
              || data.image_name
              || data.imageName
              || current?.imageUrl,
            rating: data.rating ?? current?.rating,
            feedbackCount: (data as any)?.feedbackCount ?? current?.feedbackCount,
            views: (data as any)?.views ?? current?.views,
            ownerId: (data as any)?.ownerId ?? current?.ownerId,
            ownerName: (data as any)?.ownerName ?? current?.ownerName,
            ownerPhotoUrl: (data as any)?.ownerPhotoUrl ?? current?.ownerPhotoUrl,
            publishStatus: (data as any)?.publishStatus ?? current?.publishStatus,
            source: (data as any)?.source ?? current?.source,
            externalId: (data as any)?.externalId ?? current?.externalId,
          } as FirestoreRecipe));
        }
      } catch (error) {
        console.error('API recipe load error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!hasFirebaseConfig || !db || shouldBypassFirestore || !shouldUseUserRecipeFirestore) {
      if (shouldLoadFromApi) {
        setLoading(true);
        loadFromApi();
      } else {
        setLoading(false);
      }
      return;
    }

    if (!recipeParam) {
      setLoading(true);
    }

    const recipeRef = doc(db, 'recipes', recipeId);
    const unsubscribe = onSnapshot(
      recipeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setInteractionTarget('recipes');
          setInteractionRecipeId(snapshot.id);
          setRecipe({
            id: snapshot.id,
            ...(snapshot.data() as Omit<FirestoreRecipe, 'id'>),
          });
        } else if (!didFallback && shouldLoadFromApi) {
          didFallback = true;
          loadFromApi();
          return;
        }
        setLoading(false);
      },
      (error) => {
        if (isPermissionDeniedError(error)) {
          console.warn('Realtime recipe unavailable, using API fallback.');
        } else {
          console.error('Load recipe error:', error);
        }
        if (!didFallback) {
          didFallback = true;
          loadFromApi();
        }
      }
    );

    return () => unsubscribe();
  }, [recipeId, recipeParam]);

  useEffect(() => {
    if (!hasFirebaseConfig || !interactionRecipeId || !interactionTarget) return;
    if (interactionTarget === 'publicRecipes' && !firebaseUserId) return;
    let isMounted = true;
    const incrementPromise =
      interactionTarget === 'publicRecipes'
        ? publicRecipeStore.incrementRecipeViews(interactionRecipeId)
        : recipeStore.incrementRecipeViews(interactionRecipeId);
    incrementPromise
      .then(() => {
        if (!isMounted) return;
        setRecipe((current) =>
          current ? { ...current, views: (current.views ?? 0) + 1 } : current
        );
      })
      .catch((error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn('View increment error:', error);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [interactionRecipeId, interactionTarget, firebaseUserId]);

  const displayRecipe = useMemo(() => {
    if (!recipe) return null;
    const anyRecipe = recipe as any;
    const currentUser = getFirebaseUser();
    const creator = getMeaningfulCreator(
      recipe.ownerName || anyRecipe.ownerName || anyRecipe.creator
    );
    const isOwnedRecipe = isUserCreatedRecipe(anyRecipe);
    const sourceLabel = isOwnedRecipe
      ? undefined
      : normalizeSourceLabel(anyRecipe.sourceLabel) || 'App Recipe';
    const creatorAvatar =
      recipe.ownerPhotoUrl
      || anyRecipe.ownerPhotoUrl
      || anyRecipe.creatorAvatar
      || (currentUser && currentUser.uid === (recipe.ownerId || anyRecipe.ownerId)
        ? currentUser.photoURL
        : null);

    return {
      id: recipe.id || anyRecipe.id,
      title: recipe.title || anyRecipe.title || 'Community Recipe',
      image: recipe.imageUrl || recipe.image || anyRecipe.image || '',
      creator,
      description:
        recipe.description || anyRecipe.description || 'A community recipe shared with FlavorMind.',
      rating: typeof recipe.rating === 'number' ? recipe.rating : anyRecipe.rating ?? 0,
      comments:
        recipe.feedbackCount ??
        anyRecipe.feedbackCount ??
        anyRecipe.comments ??
        0,
      views: recipe.views ?? anyRecipe.views ?? anyRecipe.viewCount ?? 0,
      category: recipe.category || anyRecipe.category || '',
      ingredients: recipe.ingredients || anyRecipe.ingredients || [],
      instructions: recipe.instructions || anyRecipe.instructions || [],
      cuisine: recipe.cuisine || anyRecipe.cuisine || '',
      difficulty: recipe.difficulty || anyRecipe.difficulty || 'medium',
      prepTime: recipe.prepTime || anyRecipe.prepTime || 0,
      cookTime: recipe.cookTime || anyRecipe.cookTime || 0,
      servings: recipe.servings || anyRecipe.servings || 1,
      ownerId: recipe.ownerId || anyRecipe.ownerId,
      creatorAvatar,
      sourceLabel,
      isFirebaseRecipe: Boolean(anyRecipe.isFirebaseRecipe || recipe.ownerId),
      isCurrentUserRecipe: Boolean(anyRecipe.isCurrentUserRecipe),
      isUserCreated: isOwnedRecipe,
    };
  }, [recipe]);

  const isOwner = useMemo(() => {
    const user = getFirebaseUser();
    return Boolean(user && displayRecipe?.ownerId && user.uid === displayRecipe.ownerId);
  }, [displayRecipe?.ownerId]);

  useEffect(() => {
    const currentRecipe = (recipe || recipeParam) as Record<string, any> | null;
    const ensuredTitle = currentRecipe?.title || getGeneratedDishName();
    if (!ensuredTitle && !recipeId) return;
    if (recipe === recipeParam && !hasDetailedRecipePayload(recipeParam)) return;

    if (isUserCreatedRecipe(currentRecipe)) {
      setInteractionTarget('recipes');
      setInteractionRecipeId(currentRecipe?.id || recipeId || undefined);
      return;
    }

    if (!hasFirebaseConfig || !db) {
      setInteractionRecipeId(undefined);
      setInteractionTarget(undefined);
      return;
    }

    const publicRecipeInput = {
      id: recipeId || currentRecipe?.id,
      externalId: recipeId || currentRecipe?.externalId || currentRecipe?.id,
      title: ensuredTitle,
      description: currentRecipe?.description,
      imageUrl: currentRecipe?.imageUrl || currentRecipe?.image || null,
      image: currentRecipe?.image || currentRecipe?.imageUrl || null,
      source: isGeneratedRecipeId(recipeId || currentRecipe?.id) ? 'ai' : 'app',
    };
    const publicRecipeKey = getPublicRecipeKey(publicRecipeInput);

    if (interactionTarget === 'recipes') {
      return;
    }

    if (!firebaseUserId) {
      setInteractionTarget('publicRecipes');
      setInteractionRecipeId(publicRecipeKey);
      ensuredPublicRecipeKeyRef.current = null;
      return;
    }

    if (ensuredPublicRecipeKeyRef.current === publicRecipeKey) {
      setInteractionTarget('publicRecipes');
      setInteractionRecipeId(publicRecipeKey);
      return;
    }

    let isMounted = true;
    publicRecipeStore.ensurePublicRecipeDocument(publicRecipeInput).then((storedRecipe) => {
      if (!isMounted) return;
      ensuredPublicRecipeKeyRef.current = storedRecipe.id;
      setInteractionTarget('publicRecipes');
      setInteractionRecipeId(storedRecipe.id);
    }).catch((error) => {
      console.warn('Public recipe interaction sync failed:', error);
    });

    return () => {
      isMounted = false;
    };
  }, [interactionRecipeId, recipe, recipeId, recipeParam, firebaseUserId]);

  useEffect(() => {
    if (!hasFirebaseConfig || !db || !interactionRecipeId || !interactionTarget) return;

    const interactionRef = doc(db, interactionTarget, interactionRecipeId);
    const unsubscribe = onSnapshot(
      interactionRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as Record<string, any>;
        setRecipe((current) => ({
          id: current?.id || recipeId || interactionRecipeId,
          title: current?.title || data.title || 'Recipe',
          description: current?.description || data.description || '',
          imageUrl: current?.imageUrl || current?.image || data.imageUrl || data.image || '',
          image: current?.image || current?.imageUrl || data.image || data.imageUrl || '',
          ownerId: current?.ownerId || data.ownerId || '',
          ownerName: current?.ownerName || data.ownerName,
          ownerPhotoUrl: current?.ownerPhotoUrl || data.ownerPhotoUrl || null,
          publishStatus: current?.publishStatus || data.publishStatus,
          source: current?.source || data.source,
          externalId: current?.externalId || data.externalId,
          cuisine: current?.cuisine || data.cuisine || '',
          category: current?.category || data.category || '',
          difficulty: current?.difficulty || data.difficulty || 'medium',
          prepTime: current?.prepTime ?? data.prepTime ?? 0,
          cookTime: current?.cookTime ?? data.cookTime ?? 0,
          servings: current?.servings ?? data.servings ?? 1,
          ingredients: current?.ingredients?.length ? current.ingredients : (data.ingredients || []),
          instructions: current?.instructions?.length ? current.instructions : (data.instructions || []),
          rating: typeof data.rating === 'number' ? data.rating : current?.rating,
          feedbackCount: typeof data.feedbackCount === 'number' ? data.feedbackCount : current?.feedbackCount,
          views: typeof data.views === 'number' ? data.views : current?.views,
        }));
      },
      (error) => {
        console.warn('Recipe interaction snapshot failed:', error);
      }
    );

    return () => unsubscribe();
  }, [interactionRecipeId, interactionTarget, recipeId]);

  useEffect(() => {
    if (!displayRecipe?.title) return;
    if (hasFirebaseConfig && !interactionRecipeId && !displayRecipe.isUserCreated) return;

    const trackingKey = interactionRecipeId || displayRecipe.id || displayRecipe.title;
    if (trackedViewKeyRef.current === trackingKey) {
      return;
    }

    trackedViewKeyRef.current = trackingKey;
    recordRecipeActivity({
      actionType: 'view',
      recipeId: displayRecipe.id,
      recipeTitle: displayRecipe.title,
      cuisine: displayRecipe.cuisine,
      ingredients: Array.isArray(displayRecipe.ingredients)
        ? displayRecipe.ingredients.map((item: any) => item?.name).filter(Boolean)
        : [],
    }).catch((error) => {
      console.warn('View activity tracking failed:', error);
    });
  }, [displayRecipe, interactionRecipeId]);

  const usesApiFeedbackFallback = interactionTarget !== 'publicRecipes' && !prefersPublicRecipeStore();
  const commentCount = usesApiFeedbackFallback
    ? Math.max(
        displayRecipe?.comments ?? 0,
        apiFeedbackSummary.totalReviews,
        feedbackList.length,
        apiFeedbackList.length
      )
    : Math.max(displayRecipe?.comments ?? 0, feedbackList.length);

  const ratingFromFirestore =
    typeof displayRecipe?.rating === 'number' ? displayRecipe.rating : 0;
  const ratingValue = usesApiFeedbackFallback
    && apiFeedbackSummary.totalReviews > (displayRecipe?.comments ?? 0)
      ? apiFeedbackSummary.averageRating
      : ratingFromFirestore;

  const effectiveFeedbackList = feedbackList.length > 0
    ? feedbackList
    : (usesApiFeedbackFallback ? apiFeedbackList : []);
  const effectiveFeedbackSource =
    feedbackList.length > 0 || !usesApiFeedbackFallback ? 'firestore' : 'api';

  const formatCompactNumber = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    if (value < 1000) return `${value}`;
    const formatted = (value / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
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

  const mapApiFeedback = (item: ApiFeedback): FirestoreFeedback => ({
    id: item.id,
    recipeId: item.recipeId,
    userId: item.userId,
    userName: item.userId ? `User ${item.userId.slice(-4)}` : 'User',
    userAvatar: null,
    rating: item.rating,
    publicComment: item.comment || null,
    comment: item.comment || null,
    createdAt: item.createdAt,
  });

  const loadFeedbackFromApi = async (targetId?: string) => {
    const id = targetId || displayRecipe?.id;
    if (!id) return;
    setLoadingFeedback(true);
    try {
      const response = await feedbackService.getRecipeFeedback(id, 1, 50);
      const feedbackDocs = response.data?.feedback || [];
      setApiFeedbackList(feedbackDocs.map(mapApiFeedback));
      setApiFeedbackSummary({
        averageRating: response.data?.averageRating ?? 0,
        totalReviews: response.data?.totalReviews ?? feedbackDocs.length,
      });
    } catch (error) {
      console.error('API feedback load error:', error);
      setApiFeedbackList([]);
      setApiFeedbackSummary({ averageRating: 0, totalReviews: 0 });
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    if (!recipeId || (hasFirebaseConfig && interactionRecipeId) || !usesApiFeedbackFallback) return;
    loadFeedbackFromApi(recipeId);
  }, [interactionRecipeId, recipeId, usesApiFeedbackFallback]);

  useEffect(() => {
    if (
      !showComments
      || !hasFirebaseConfig
      || !db
      || !interactionRecipeId
      || !interactionTarget
    ) {
      return;
    }
    setLoadingFeedback(true);
    const feedbackRef = collection(db, interactionTarget, interactionRecipeId, 'feedback');
    const feedbackQuery = query(feedbackRef, orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FirestoreFeedback, 'id'>),
        }));
        setFeedbackList(items);
        setLoadingFeedback(false);
      },
      (error) => {
        if (isPermissionDeniedError(error) && usesApiFeedbackFallback) {
          console.warn('Realtime feedback unavailable, using API comments.');
        } else {
          console.error('Feedback load error:', error);
        }
        setLoadingFeedback(false);
        if (usesApiFeedbackFallback) {
          loadFeedbackFromApi();
        }
      }
    );
    return () => unsubscribe();
  }, [interactionRecipeId, interactionTarget, showComments, usesApiFeedbackFallback]);

  const handleOpenComments = () => {
    setShowComments(true);
    if (!hasFirebaseConfig || !db || !interactionRecipeId) {
      if (usesApiFeedbackFallback) {
        loadFeedbackFromApi();
      }
    }
  };

  const handleDeleteComment = async (feedbackId: string) => {
    if (!interactionRecipeId) return;
    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (interactionTarget === 'publicRecipes') {
              await publicRecipeStore.deleteFeedback(interactionRecipeId, feedbackId);
            } else {
              await feedbackStore.deleteFeedback(interactionRecipeId, feedbackId);
            }
          } catch (error) {
            console.error('Delete feedback error:', error);
          }
        },
      },
    ]);
  };

  const handleReply = async (feedbackId: string) => {
    if (!interactionRecipeId || interactionTarget !== 'recipes') return;
    const reply = replyDraft.trim();
    if (!reply) return;
    try {
      await feedbackStore.replyToFeedback(interactionRecipeId, feedbackId, reply);
      setReplyDraft('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Reply feedback error:', error);
    }
  };

  const handleSaveRecipe = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const user = getFirebaseUser();
      if (!user) {
        Alert.alert('Login Required', 'Please sign in to save recipes.');
        return;
      }

      if (!displayRecipe) {
        Alert.alert('Error', 'Recipe not available right now.');
        return;
      }

      await recipeStore.saveRecipeToLibrary(user.uid, {
        recipeId: interactionRecipeId || (displayRecipe.isFirebaseRecipe ? displayRecipe.id : undefined),
        externalId: interactionRecipeId ? undefined : (displayRecipe.isFirebaseRecipe ? undefined : displayRecipe.id),
        source: displayRecipe.isUserCreated ? 'user' : 'api',
        sourceLabel: displayRecipe.isUserCreated ? undefined : (displayRecipe.sourceLabel || 'App Recipe'),
        title: displayRecipe.title,
        imageUrl: displayRecipe.image,
        creator: displayRecipe.creator,
        rating: ratingValue > 0 ? ratingValue : undefined,
        feedbackCount: commentCount,
      });

      await recordRecipeActivity({
        actionType: 'save',
        recipeId: displayRecipe.id,
        recipeTitle: displayRecipe.title,
        cuisine: displayRecipe.cuisine,
        ingredients: Array.isArray(displayRecipe.ingredients)
          ? displayRecipe.ingredients.map((item: any) => item?.name).filter(Boolean)
          : [],
      });

      Alert.alert('Saved!', 'Recipe added to your library.');
    } catch (error) {
      console.error('Save recipe error:', error);
      Alert.alert('Error', 'Could not save this recipe right now.');
    } finally {
      setSaving(false);
    }
  };

  const highlights = [
    { icon: Flame, color: COLORS.pastelOrange.main, text: 'Built from the retrieved recipe record' },
    { icon: Sprout, color: COLORS.pastelGreen.main, text: 'Ingredients can be adapted before cooking' },
    { icon: Clock, color: COLORS.text.secondary, text: 'Prep and cook times update with scaling' },
    { icon: MapPin, color: COLORS.pastelYellow.main, text: 'Community feedback stays attached to this recipe' },
  ];

  const tips = [
    'Check the ingredients list before starting so quantities match your serving size.',
    'Use the comment section to see how other people adjusted the recipe.',
    'If the image is missing, the recipe can still be recreated from the stored steps.',
    'Submit feedback after cooking so the rating and comments stay up to date.',
  ];

  const handleRecreateRecipe = () => {
    if (!displayRecipe) return;
    // Navigate to Recipe Customization (existing cooking flow)
    navigation.navigate('RecipeCustomization', {
      dishId: displayRecipe.id,
      dishName: displayRecipe.title,
      feedbackRecipeId: interactionRecipeId,
      feedbackTarget: interactionTarget || (displayRecipe.isUserCreated ? 'recipes' : 'publicRecipes'),
      recipe: {
        id: displayRecipe.id,
        title: displayRecipe.title,
        description: displayRecipe.description,
        cuisine: displayRecipe.cuisine,
        category: displayRecipe.category as any,
        difficulty: displayRecipe.difficulty as any,
        prepTime: displayRecipe.prepTime,
        cookTime: displayRecipe.cookTime,
        servings: displayRecipe.servings,
        ingredients: displayRecipe.ingredients,
        instructions: displayRecipe.instructions,
        imageUrl: displayRecipe.image,
        source: displayRecipe.isUserCreated ? 'user' : 'app',
      },
      fromCommunity: true,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonContent}>
            <ArrowLeft size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSaveRecipe}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Bookmark size={scaleFontSize(18)} color={COLORS.text.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Image
          source={
            buildRemoteImageSource(displayRecipe?.image) || require('../../../assets/icons/book.png')
          }
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Creator */}
          <View style={styles.titleSection}>
            <Text style={styles.dishTitle}>{displayRecipe?.title || 'Recipe'}</Text>

            <View style={styles.metaHeaderRow}>
              {displayRecipe?.sourceLabel ? (
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceBadgeText}>{displayRecipe.sourceLabel}</Text>
                </View>
              ) : null}
              {displayRecipe?.creator ? (
                <View style={styles.creatorRow}>
                    <Image
                      source={
                        buildRemoteImageSource(displayRecipe.creatorAvatar)
                        || require('../../../assets/icons/user.png')
                      }
                      style={styles.creatorAvatar}
                      resizeMode="cover"
                  />
                  <View style={styles.creatorPill}>
                    <Text style={styles.creatorLabel}>Created by</Text>
                    <Text style={styles.creatorName}>{displayRecipe.creator}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Star size={scaleFontSize(20)} color={COLORS.pastelOrange.main} strokeWidth={2} style={styles.statIcon} />
              <Text style={styles.statValue}>
                {ratingValue > 0 ? ratingValue.toFixed(1) : '--'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <TouchableOpacity
              style={styles.statBox}
              onPress={handleOpenComments}
              activeOpacity={0.8}
            >
              <MessageCircle size={scaleFontSize(20)} color={COLORS.text.secondary} strokeWidth={2} style={styles.statIcon} />
              <Text style={styles.statValue}>
                {commentCount}
              </Text>
              <Text style={styles.statLabel}>Comments</Text>
            </TouchableOpacity>
            <View style={styles.statBox}>
              <Eye size={scaleFontSize(20)} color={COLORS.text.secondary} strokeWidth={2} style={styles.statIcon} />
              <Text style={styles.statValue}>
                {formatCompactNumber(displayRecipe?.views ?? 0)}
              </Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Dish</Text>
            <Text style={styles.descriptionText}>
              {displayRecipe?.description || 'A community recipe shared with FlavorMind.'}
            </Text>
            <Text style={styles.descriptionText}>
              Recipe details come from the retrieved or saved record, while ratings, comments,
              and activity are tracked separately as people use the dish.
            </Text>
          </View>

          {/* What Makes It Special */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Makes It Special</Text>
            <View style={styles.highlightsList}>
              {highlights.map(({ icon: Icon, color, text }, index) => (
                <View key={index} style={styles.highlightItem}>
                  <Icon
                    size={scaleFontSize(18)}
                    color={color}
                    strokeWidth={2}
                    style={styles.highlightIcon}
                  />
                  <Text style={styles.highlightText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Lightbulb size={scaleFontSize(18)} color={COLORS.pastelYellow.main} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Tips for Perfect Results</Text>
            </View>
            <View style={styles.tipsList}>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={handleRecreateRecipe}
          icon={require('../../../assets/icons/sparkle.png')}
          disabled={!displayRecipe}
        >
          Recreate This Recipe
        </Button>
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
        </View>
      )}

      <Modal
        visible={showComments}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowComments(false);
          setReplyingTo(null);
          setReplyDraft('');
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowComments(false);
                  setReplyingTo(null);
                  setReplyDraft('');
                }}
              >
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>

            {loadingFeedback ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
                <Text style={styles.modalLoadingText}>Loading comments...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {effectiveFeedbackList.length === 0 ? (
                  <Text style={styles.emptyCommentsText}>No comments yet.</Text>
                ) : (
                  effectiveFeedbackList.map((feedback) => (
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

                      {feedback.ownerReply ? (
                        <View style={styles.replyCard}>
                          <Text style={styles.replyTitle}>Owner reply</Text>
                          <Text style={styles.replyText}>{feedback.ownerReply}</Text>
                        </View>
                      ) : null}

                      {effectiveFeedbackSource === 'firestore'
                        && (isOwner || feedback.userId === getFirebaseUser()?.uid) && (
                        <View style={styles.commentActions}>
                          {isOwner && (
                            <TouchableOpacity
                              style={styles.replyButton}
                              onPress={() => {
                                setReplyingTo(feedback.id);
                                setReplyDraft('');
                              }}
                            >
                              <Text style={styles.replyButtonText}>Reply</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteComment(feedback.id)}
                          >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {effectiveFeedbackSource === 'firestore' && isOwner && replyingTo === feedback.id && (
                        <View style={styles.replyComposer}>
                          <TextInput
                            style={styles.replyInput}
                            placeholder="Write a reply..."
                            placeholderTextColor={COLORS.text.tertiary}
                            value={replyDraft}
                            onChangeText={setReplyDraft}
                            multiline
                          />
                          <TouchableOpacity
                            style={styles.replySubmit}
                            onPress={() => handleReply(feedback.id)}
                          >
                            <Text style={styles.replySubmitText}>Send</Text>
                          </TouchableOpacity>
                        </View>
                      )}
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
  headerActions: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.background.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: moderateScale(300),
  },
  content: {
    padding: moderateScale(SPACING.base),
  },
  titleSection: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.lg),
    marginBottom: moderateScale(SPACING.lg),
    ...SHADOWS.medium,
  },
  dishTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  metaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.sm),
    marginBottom: moderateScale(SPACING.lg),
  },
  sourceBadge: {
    backgroundColor: COLORS.pastelGreen.light,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.pastelGreen.main + '55',
  },
  sourceBadgeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.pastelGreen.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.sm),
  },
  creatorAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.background.white,
  },
  creatorPill: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.full,
  },
  creatorLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(2),
  },
  creatorName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
    paddingTop: moderateScale(SPACING.lg),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: moderateScale(SPACING.xs),
  },
  statValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  statLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: moderateScale(SPACING.xl),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.md),
  },
  descriptionText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
    marginBottom: moderateScale(SPACING.md),
  },
  highlightsList: {
    gap: moderateScale(SPACING.md),
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pastelYellow.light,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pastelYellow.main,
  },
  highlightIcon: {
    marginRight: moderateScale(SPACING.md),
  },
  highlightText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  tipsList: {
    gap: moderateScale(SPACING.sm),
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  tipNumber: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.pastelGreen.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  tipNumberText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  tipText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(SPACING.md),
  },
  modalTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  modalClose: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
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
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    textAlign: 'center',
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
  commentActions: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
    marginTop: moderateScale(SPACING.sm),
  },
  replyButton: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.pastelYellow.light,
  },
  replyButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  deleteButton: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.status.error + '22',
  },
  deleteButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.status.error,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  replyCard: {
    marginTop: moderateScale(SPACING.sm),
    padding: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.white,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  replyTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.secondary,
    marginBottom: moderateScale(4),
  },
  replyText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
  },
  replyComposer: {
    marginTop: moderateScale(SPACING.sm),
  },
  replyInput: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.sm),
    borderWidth: 1,
    borderColor: COLORS.border.light,
    minHeight: moderateScale(60),
    textAlignVertical: 'top',
    color: COLORS.text.primary,
  },
  replySubmit: {
    alignSelf: 'flex-end',
    marginTop: moderateScale(SPACING.sm),
    backgroundColor: COLORS.pastelOrange.main,
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.md,
  },
  replySubmitText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});

export default RecipeDescriptionScreen;
