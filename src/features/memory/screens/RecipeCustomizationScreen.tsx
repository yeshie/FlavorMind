// src/features/memory/screens/RecipeCustomizationScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import { buildRemoteImageSource } from '../../../common/utils';
import Button from '../../../common/components/Button/button';
import CornerTimer from '../components/CornerTimer';
import { calculateElapsedMinutes } from '../../../common/utils/cookingHistory';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import publicRecipeStore, { getPublicRecipeKey } from '../../../services/firebase/publicRecipeStore';
import { getFirebaseUser, subscribeToFirebaseUser } from '../../../services/firebase/authService';
import { hasFirebaseConfig } from '../../../services/firebase/firebase';

interface RecipeCustomizationScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      dishId?: string;
      dishImage?: string;
      recipe?: Recipe;
      autoAdapt?: boolean;
      sourceIngredient?: string;
      feedbackRecipeId?: string;
      feedbackTarget?: 'recipes' | 'publicRecipes';
    };
  };
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number | string;
  unit: string;
  originalQuantity: number | string;
  selected: boolean;
  localAlternative?: {
    name: string;
    reason: string;
  };
}

const KNOWN_UNITS = new Set([
  'g', 'kg', 'mg', 'lb', 'lbs', 'oz', 'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp',
  'teaspoon', 'teaspoons', 'tablespoon', 'tablespoons', 'piece', 'pieces', 'clove',
  'cloves', 'slice', 'slices', 'sprig', 'sprigs', 'can', 'cans', 'pinch', 'dash',
  'packet', 'packets', 'medium', 'large', 'small',
]);

const MIN_COMPLETE_INGREDIENTS = 3;
const MIN_COMPLETE_INSTRUCTIONS = 2;

const PREP_NOTE_PATTERN = /^(finely\s+)?(chopped|sliced|diced|minced|crushed|grated|peeled|seeded|beaten|washed|drained|cooked|shredded|torn|ground|roasted|toasted)$/i;
const QUANTITY_START_PATTERN = /^(\d+(?:[./]\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

const shouldSkipIngredient = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return !normalized
    || normalized.startsWith('special equipment')
    || normalized.startsWith('equipment:')
    || normalized.startsWith('ingredients:')
    || normalized === 'ingredients'
    || normalized.startsWith('for serving:')
    || normalized === 'to serve';
};

const splitIntoSentences = (value: string): string[] =>
  (value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((item) => item.trim())
    .filter(Boolean);

const cleanIngredientText = (value: string) =>
  value
    .replace(/^\s*(ingredients?|ingredient list)\s*:\s*/i, '')
    .replace(/^\s*(?:[-*\u2022]|\d+[\).\-\:])\s*/, '')
    .trim();

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

const splitIngredientText = (value: string): string[] => {
  const normalized = value.replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  return normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/\s+(?=\d+[\).\-\:]\s)/))
    .flatMap((line) => line.split(/\s*[;|]\s*/))
    .flatMap(splitCommaSeparatedIngredients)
    .map(cleanIngredientText)
    .filter(Boolean)
    .filter((line) => !shouldSkipIngredient(line));
};

const splitInstructionText = (value: string): string[] => {
  const normalized = value
    .replace(/\r/g, '\n')
    .replace(/^\s*(instructions?|method|steps)\s*:\s*/i, '')
    .trim();
  if (!normalized) return [];

  const lineSplit = normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/\s+(?=(?:step\s*)?\d+[\).\-\:]\s)/i))
    .map((line) => line.replace(/^\s*(step\s*)?\d+[\).\-\:]?\s*/i, '').trim())
    .filter(Boolean);

  if (lineSplit.length > 1) {
    return lineSplit;
  }

  const numberedInline = normalized
    .split(/\s+(?=(?:step\s*)?\d+[\).\-\:]\s)/i)
    .map((line) => line.replace(/^\s*(step\s*)?\d+[\).\-\:]?\s*/i, '').trim())
    .filter(Boolean);

  if (numberedInline.length > 1) {
    return numberedInline;
  }

  const sentenceSplit = splitIntoSentences(normalized);

  if (sentenceSplit.length >= 3) {
    return sentenceSplit;
  }

  return [normalized];
};

const normalizeInstructionsFromApi = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((step: any) => {
        if (typeof step === 'string') {
          return splitInstructionText(step);
        }

        const stepText =
          step?.description ||
          step?.instruction ||
          step?.text ||
          step?.content ||
          (typeof step?.step === 'string' ? step.step : '');

        return splitInstructionText(stepText);
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return splitInstructionText(value);
  }

  return [];
};

const parseIngredientText = (value: string) => {
  const cleaned = value
    .replace(/^[\-\u2022*]\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+for serving$/i, '')
    .trim();

  const trailingMatch = cleaned.match(/^(.+?)\s*[-,:]\s*(\d+(?:[./]\d+)?)\s*([A-Za-z]+)?$/);
  if (trailingMatch) {
    return {
      name: trailingMatch[1].trim(),
      quantity: trailingMatch[2] || '',
      unit: trailingMatch[3] || '',
    };
  }

  const leadingMatch = cleaned.match(/^(\d+(?:[./]\d+)?)\s*([A-Za-z]+)?\s+(.+)$/);
  if (leadingMatch) {
    const parsedUnit = (leadingMatch[2] || '').toLowerCase();
    return {
      quantity: leadingMatch[1] || '',
      unit: parsedUnit && KNOWN_UNITS.has(parsedUnit) ? leadingMatch[2] || '' : '',
      name: parsedUnit && KNOWN_UNITS.has(parsedUnit)
        ? leadingMatch[3].trim()
        : `${leadingMatch[2] || ''} ${leadingMatch[3]}`.trim(),
    };
  }

  return {
    name: cleaned,
    quantity: '',
    unit: '',
  };
};

const simplifyIngredientForAdaptation = (value: string) =>
  value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bsuch as\b.*$/i, ' ')
    .replace(/\bfor serving\b.*$/i, ' ')
    .replace(/\bcut into\b.*$/i, ' ')
    .replace(/\bfinely chopped\b.*$/i, ' ')
    .replace(/\bchopped\b.*$/i, ' ')
    .replace(/\bminced\b.*$/i, ' ')
    .replace(/\bcrushed\b.*$/i, ' ')
    .replace(/\bgrated\b.*$/i, ' ')
    .replace(/\bpeeled\b.*$/i, ' ')
    .replace(/\bseeded\b.*$/i, ' ')
    .replace(/\bskin removed\b.*$/i, ' ')
    .replace(/\bdivided\b.*$/i, ' ')
    .replace(/\bfreshly\b/g, ' ')
    .split(',')[0]
    .split(/\s+or\s+/)[0]
    .replace(/\s+/g, ' ')
    .trim();

const getAdaptationLookupName = (ingredient: Ingredient) => {
  const simplified = simplifyIngredientForAdaptation(ingredient.name);
  return simplified || ingredient.name.toLowerCase().trim();
};

const matchAdaptationToIngredient = (ingredient: Ingredient, adaptation: any) => {
  const lookupName = getAdaptationLookupName(ingredient);
  const original =
    adaptation.original ||
    adaptation.ingredient ||
    adaptation.from ||
    adaptation.name ||
    '';
  const originalLower = simplifyIngredientForAdaptation(String(original));
  if (!originalLower) return false;
  return lookupName.includes(originalLower) || originalLower.includes(lookupName);
};

const parseAdaptationsFromSubstitutionText = (value: string) => {
  const raw = String(value || '').trim();
  if (!raw) return [];

  const parts = raw
    .replace(/\r/g, '\n')
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((part) => {
    let original = '';
    let substitute = '';

    let match = part.match(/(.+?) works as (?:a |an )?replacement for (.+?)(?:[.!,]|$)/i);
    if (match) {
      substitute = match[1].trim();
      original = match[2].trim();
    } else {
      match = part.match(/(.+?) can be (?:used|substituted|replaced) (?:for|instead of) (.+?)(?:[.!,]|$)/i);
      if (match) {
        substitute = match[1].trim();
        original = match[2].trim();
      } else {
        match = part.match(/replace (.+?) with (.+?)(?:[.!,]|$)/i);
        if (match) {
          original = match[1].trim();
          substitute = match[2].trim();
        }
      }
    }

    return {
      original,
      substitute,
      reason: part,
    };
  }).filter((item) => item.original || item.substitute || item.reason);
};

const applyPrecomputedAdaptations = (items: Ingredient[], adaptations: any[] = []) =>
  items.map((ingredient) => {
    const match = adaptations.find((adaptation) => matchAdaptationToIngredient(ingredient, adaptation));
    if (!match) return ingredient;

    return {
      ...ingredient,
      localAlternative: {
        name:
          match.substitute ||
          match.replacement ||
          match.to ||
          match.local ||
          match.suggested ||
          'Local alternative',
        reason: match.reason || match.why || '',
      },
    };
  });

const calculateScaledCookTime = (
  baseMinutes: number,
  baseServings: number,
  nextServings: number
) => {
  if (!Number.isFinite(baseMinutes) || baseMinutes <= 0) return 0;
  if (!Number.isFinite(baseServings) || baseServings <= 0 || !Number.isFinite(nextServings)) {
    return Math.round(baseMinutes);
  }

  const scaleFactor = nextServings / baseServings;
  const timeFactor =
    scaleFactor <= 1
      ? Math.max(0.75, Math.sqrt(scaleFactor))
      : Math.min(2.5, 1 + (scaleFactor - 1) * 0.35);

  return Math.max(5, Math.round(baseMinutes * timeFactor));
};

const DEFAULT_PREP_TIME = 10;
const DEFAULT_COOK_TIME = 20;

const ingredientItem = (name: string, quantity = '', unit = '') => ({
  name,
  quantity,
  unit,
});

const instructionItem = (description: string, index: number) => ({
  step: index + 1,
  description,
});

const dedupeRecipeIngredients = (items: ReturnType<typeof ingredientItem>[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getDishPrimaryIngredient = (dishTitle: string, sourceIngredient?: string) => {
  const normalizedSource = sourceIngredient?.trim();
  if (normalizedSource) return normalizedSource;

  const lower = dishTitle.toLowerCase();
  if (lower.includes('chicken')) return 'chicken';
  if (lower.includes('fish')) return 'fish';
  if (lower.includes('beef')) return 'beef';
  if (lower.includes('pork')) return 'pork';
  if (lower.includes('egg')) return 'eggs';
  if (lower.includes('prawn') || lower.includes('shrimp')) return 'prawns';
  if (lower.includes('rice')) return 'rice';
  if (lower.includes('bean')) return 'beans';
  if (lower.includes('potato')) return 'potatoes';

  return 'main ingredient';
};

const createRecipeFallback = (
  dishTitle: string,
  sourceIngredient?: string,
  candidate?: Recipe | Record<string, any> | null
): Recipe => {
  const title = dishTitle.trim() || candidate?.title || 'Recipe';
  const lower = title.toLowerCase();
  const primary = getDishPrimaryIngredient(title, sourceIngredient);
  let ingredients: ReturnType<typeof ingredientItem>[] = [];
  let steps: string[] = [];
  let prepTime = 15;
  let cookTime = 30;

  if (/kottu|kothu/.test(lower)) {
    ingredients = [
      ingredientItem('godamba roti', '4', 'pieces'),
      ingredientItem('boneless chicken', '500', 'g'),
      ingredientItem('eggs', '2', ''),
      ingredientItem('carrot', '1', 'medium'),
      ingredientItem('cabbage or leeks', '1', 'cup'),
      ingredientItem('onion', '1', 'medium'),
      ingredientItem('garlic cloves', '3', ''),
      ingredientItem('green chili', '2', ''),
      ingredientItem('curry leaves', '1', 'sprig'),
      ingredientItem('curry powder', '1', 'tbsp'),
      ingredientItem('soy sauce', '1', 'tbsp'),
      ingredientItem('chili flakes', '1', 'tsp'),
      ingredientItem('oil', '2', 'tbsp'),
      ingredientItem('salt', '1', 'tsp'),
    ];
    steps = [
      'Cut the godamba roti into small strips and keep it ready.',
      'Season the chicken with salt, curry powder, and chili flakes.',
      'Heat oil in a large pan and cook onion, garlic, green chili, and curry leaves until fragrant.',
      'Add the chicken and cook until it is browned and cooked through.',
      'Push the chicken aside, scramble the eggs, then add carrot and cabbage or leeks.',
      'Add the roti strips and soy sauce, then chop and toss everything together until hot.',
    ];
    prepTime = 20;
    cookTime = 25;
  } else if (/tostada/.test(lower)) {
    ingredients = [
      ingredientItem('cooked shredded chicken', '2', 'cups'),
      ingredientItem('tostada shells', '8', ''),
      ingredientItem('refried beans', '1', 'cup'),
      ingredientItem('lettuce', '2', 'cups'),
      ingredientItem('tomato', '2', 'medium'),
      ingredientItem('red onion', '1/2', 'cup'),
      ingredientItem('shredded cheese', '1', 'cup'),
      ingredientItem('avocado', '1', ''),
      ingredientItem('lime', '1', ''),
      ingredientItem('salsa', '1/2', 'cup'),
      ingredientItem('oil', '1', 'tbsp'),
      ingredientItem('salt', '1/2', 'tsp'),
    ];
    steps = [
      'Warm the shredded chicken with oil, salt, and a spoon of salsa.',
      'Heat the tostada shells until crisp.',
      'Warm the refried beans until spreadable.',
      'Spread beans on each tostada shell and add chicken.',
      'Top with lettuce, tomato, onion, cheese, avocado, salsa, and lime juice.',
    ];
    prepTime = 15;
    cookTime = 15;
  } else if (/pelau|pelau|pilau|pulao|pulao/.test(lower)) {
    ingredients = [
      ingredientItem('chicken pieces', '500', 'g'),
      ingredientItem('rice', '2', 'cups'),
      ingredientItem('pigeon peas or beans', '1', 'cup'),
      ingredientItem('coconut milk or chicken stock', '2', 'cups'),
      ingredientItem('onion', '1', 'medium'),
      ingredientItem('garlic cloves', '3', ''),
      ingredientItem('ginger', '1', 'tbsp'),
      ingredientItem('carrot', '1', 'medium'),
      ingredientItem('thyme or curry leaves', '1', 'sprig'),
      ingredientItem('curry powder', '1', 'tbsp'),
      ingredientItem('green chili', '1', ''),
      ingredientItem('oil', '2', 'tbsp'),
      ingredientItem('salt', '1', 'tsp'),
    ];
    steps = [
      'Season the chicken with salt and curry powder.',
      'Heat oil in a heavy pot and brown the chicken on all sides.',
      'Add onion, garlic, ginger, chili, and thyme or curry leaves and cook until fragrant.',
      'Stir in rice, pigeon peas or beans, carrot, and coconut milk or stock.',
      'Cover and simmer on low heat until the rice is tender and the chicken is cooked through.',
      'Rest for a few minutes, fluff the rice, and serve hot.',
    ];
    prepTime = 30;
    cookTime = 60;
  } else if (/curry/.test(lower)) {
    ingredients = [
      ingredientItem(primary, '500', 'g'),
      ingredientItem('onion', '1', 'medium'),
      ingredientItem('garlic cloves', '3', ''),
      ingredientItem('ginger', '1', 'tbsp'),
      ingredientItem('curry leaves', '1', 'sprig'),
      ingredientItem('curry powder', '1', 'tbsp'),
      ingredientItem('turmeric', '1/2', 'tsp'),
      ingredientItem('chili powder', '1', 'tsp'),
      ingredientItem('coconut milk', '1', 'cup'),
      ingredientItem('oil', '2', 'tbsp'),
      ingredientItem('salt', '1', 'tsp'),
    ];
    steps = [
      'Prepare and season the main ingredient with salt, turmeric, chili powder, and curry powder.',
      'Heat oil and cook onion, garlic, ginger, and curry leaves until fragrant.',
      'Add the main ingredient and cook until lightly browned.',
      'Pour in coconut milk and simmer until fully cooked.',
      'Taste, adjust salt, and serve hot.',
    ];
  } else {
    ingredients = [
      ingredientItem(primary, primary === 'main ingredient' ? '' : '500', primary === 'main ingredient' ? '' : 'g'),
      ingredientItem('onion', '1', 'medium'),
      ingredientItem('garlic cloves', '3', ''),
      ingredientItem('ginger', '1', 'tbsp'),
      ingredientItem('green chili', '1', ''),
      ingredientItem('mixed vegetables', '1', 'cup'),
      ingredientItem('cooking oil', '2', 'tbsp'),
      ingredientItem('seasoning spice', '1', 'tbsp'),
      ingredientItem('salt', '1', 'tsp'),
      ingredientItem('water or stock', '1', 'cup'),
    ];
    steps = [
      `Prepare all ingredients for ${title}.`,
      'Heat oil in a pan or pot and cook onion, garlic, ginger, and chili until fragrant.',
      'Add the main ingredient and cook until it starts to brown.',
      'Add vegetables, seasoning, salt, and water or stock.',
      'Cook until everything is tender and the sauce or mixture is balanced.',
      'Taste, adjust seasoning, and serve hot.',
    ];
  }

  return {
    id: candidate?.id || `generated:${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    description: candidate?.description || `A complete cooking recipe for ${title}.`,
    cuisine: candidate?.cuisine || '',
    category: 'dinner',
    difficulty: 'medium',
    prepTime,
    cookTime,
    servings: Number(candidate?.servings || 4),
    ingredients: dedupeRecipeIngredients(ingredients),
    instructions: steps.map(instructionItem),
    image: candidate?.image || candidate?.imageUrl,
    imageUrl: candidate?.imageUrl || candidate?.image,
    source: candidate?.source || 'generated-fallback',
  };
};

const resolveStageTimes = (
  prepCandidate: number,
  cookCandidate: number,
  totalCandidate: number
) => {
  const prepTime = Number.isFinite(prepCandidate) && prepCandidate > 0
    ? Math.round(prepCandidate)
    : 0;
  const cookTime = Number.isFinite(cookCandidate) && cookCandidate > 0
    ? Math.round(cookCandidate)
    : 0;
  const totalCookTime = Number.isFinite(totalCandidate) && totalCandidate > 0
    ? Math.round(totalCandidate)
    : 0;

  if (prepTime > 0 && cookTime > 0) {
    return {
      prepTime,
      cookTime,
      totalCookTime: totalCookTime || prepTime + cookTime,
    };
  }

  if (totalCookTime > 0) {
    const derivedPrepTime = prepTime || Math.max(1, Math.round(totalCookTime * 0.35));
    const derivedCookTime = cookTime || Math.max(1, totalCookTime - derivedPrepTime);

    return {
      prepTime: derivedPrepTime,
      cookTime: derivedCookTime,
      totalCookTime,
    };
  }

  const fallbackPrepTime = prepTime || DEFAULT_PREP_TIME;
  const fallbackCookTime = cookTime || DEFAULT_COOK_TIME;

  return {
    prepTime: fallbackPrepTime,
    cookTime: fallbackCookTime,
    totalCookTime: fallbackPrepTime + fallbackCookTime,
  };
};

const RecipeCustomizationScreen: React.FC<RecipeCustomizationScreenProps> = ({ navigation, route }) => {
  const {
    dishName,
    dishId,
    dishImage,
    recipe: recipeParam,
    autoAdapt,
    sourceIngredient,
    feedbackRecipeId: feedbackRecipeIdParam,
    feedbackTarget: feedbackTargetParam,
  } = route.params;
  
  const [servingSize, setServingSize] = useState(1);
  const [localAdaptationEnabled, setLocalAdaptationEnabled] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [loadingAdaptations, setLoadingAdaptations] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState<number>(0);
  const [cookTime, setCookTime] = useState<number>(0);
  const [recipeId, setRecipeId] = useState<string | undefined>(dishId || recipeParam?.id);
  const [feedbackRecipeId, setFeedbackRecipeId] = useState<string | undefined>(feedbackRecipeIdParam);
  const [feedbackTarget, setFeedbackTarget] =
    useState<'recipes' | 'publicRecipes' | undefined>(feedbackTargetParam);
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(
    getFirebaseUser()?.uid || null
  );
  const [totalCookTime, setTotalCookTime] = useState<number>(0);
  const [hasLoadedRecipe, setHasLoadedRecipe] = useState(false);
  const [autoAdaptApplied, setAutoAdaptApplied] = useState(false);
  const [recipeSubstitutionOptions, setRecipeSubstitutionOptions] = useState<string>(
    recipeParam?.substitutionOptions || ''
  );
  const [recipeImage, setRecipeImage] = useState<string | undefined>(
    recipeParam?.imageUrl || recipeParam?.image || dishImage
  );

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const prepStartedAtRef = useRef<number>(Date.now());
  const baseServingsRef = useRef<number>(1);
  const basePrepTimeRef = useRef<number>(DEFAULT_PREP_TIME);
  const baseCookTimeRef = useRef<number>(DEFAULT_PREP_TIME + DEFAULT_COOK_TIME);
  const baseCookingStageTimeRef = useRef<number>(DEFAULT_COOK_TIME);

  const isUserCreatedRecipe = (recipeData?: Recipe | Record<string, any>) =>
    Boolean(
      recipeData
      && (
        (recipeData as any).ownerId
        || (recipeData as any).isFirebaseRecipe
        || (recipeData as any).source === 'user'
        || (recipeData as any).sourceType === 'firebase-user'
        || (recipeData as any).sourceType === 'firebase-approved'
      )
    );

  useEffect(() => {
    if (feedbackTarget) return;
    setFeedbackTarget(isUserCreatedRecipe(recipeParam) ? 'recipes' : 'publicRecipes');
  }, [feedbackTarget, recipeParam]);

  useEffect(() => subscribeToFirebaseUser((user) => {
    setFirebaseUserId(user?.uid || null);
  }), []);

  const mapIngredientsFromApi = (items: any[] = []): Ingredient[] =>
    items
      .flatMap((item) => {
        if (typeof item === 'string') {
          return splitIngredientText(item).map((entry) => ({ raw: entry }));
        }

        const fallbackText =
          item?.text ||
          item?.raw ||
          item?.label ||
          item?.ingredient ||
          item?.name ||
          '';

        if (
          typeof fallbackText === 'string'
          && (!item?.quantity && !item?.qty && !item?.amount && splitIngredientText(fallbackText).length > 1)
        ) {
          return splitIngredientText(fallbackText).map((entry) => ({ raw: entry }));
        }

        return [item];
      })
      .map((item, index) => {
        if (typeof item === 'string' || item?.raw) {
          const rawText = typeof item === 'string' ? item : item.raw;
          const parsed = parseIngredientText(rawText);
          return {
            id: `${index}`,
            name: parsed.name || rawText,
            quantity: parsed.quantity,
            unit: parsed.unit,
            originalQuantity: parsed.quantity,
            selected: false,
          };
        }

        const fallbackText =
          item?.text ||
          item?.raw ||
          item?.label ||
          item?.ingredient ||
          item?.name ||
          '';
        const parsed = typeof fallbackText === 'string' ? parseIngredientText(fallbackText) : null;
        const quantity = item.quantity ?? item.qty ?? item.amount ?? parsed?.quantity ?? '';
        const unit = item.unit ?? parsed?.unit ?? '';
        const name =
          item.name ||
          item.title ||
          item.ingredientName ||
          parsed?.name ||
          item.ingredient ||
          `Ingredient ${index + 1}`;

        return {
          id: item.id || `${index}`,
          name,
          quantity,
          unit,
          originalQuantity: quantity,
          selected: false,
        };
      })
      .filter((item) => item.name && !shouldSkipIngredient(item.name));

  const getRecipeIngredientCount = (recipeData?: Recipe | Record<string, any>) => {
    const rawIngredients = Array.isArray(recipeData?.ingredients)
      ? recipeData?.ingredients
      : typeof recipeData?.ingredients === 'string'
        ? splitIngredientText(recipeData.ingredients)
        : [];

    return mapIngredientsFromApi(rawIngredients).length;
  };

  const getRecipeInstructionCount = (recipeData?: Recipe | Record<string, any>) =>
    normalizeInstructionsFromApi(
      (recipeData as any)?.instructions || (recipeData as any)?.steps
    ).length;

  const hasCompleteRecipePayload = (recipeData?: Recipe | Record<string, any>) =>
    Boolean(
      recipeData
      && getRecipeIngredientCount(recipeData) >= MIN_COMPLETE_INGREDIENTS
      && getRecipeInstructionCount(recipeData) >= MIN_COMPLETE_INSTRUCTIONS
    );

  const applyRecipeData = (recipeData?: Recipe, markLoaded = true) => {
    if (!recipeData) return;
    if (recipeData.imageUrl || recipeData.image) {
      setRecipeImage(recipeData.imageUrl || recipeData.image);
    }
    const normalizedIngredients = Array.isArray(recipeData.ingredients)
      ? recipeData.ingredients
      : typeof (recipeData as any).ingredients === 'string'
        ? splitIngredientText((recipeData as any).ingredients)
        : [];
    let loadedContent = false;
    if (normalizedIngredients.length > 0) {
      const mappedIngredients = mapIngredientsFromApi(normalizedIngredients);
      const hydratedIngredients = Array.isArray((recipeData as any).localSubstitutions)
        ? applyPrecomputedAdaptations(mappedIngredients, (recipeData as any).localSubstitutions)
        : mappedIngredients;
      setIngredients(hydratedIngredients);
      loadedContent = true;
    }
    if (recipeData.servings) {
      setServingSize(recipeData.servings);
      baseServingsRef.current = recipeData.servings;
    }
    if (recipeData.id) {
      setRecipeId(recipeData.id);
    }
    if ((recipeData as any).substitutionOptions) {
      setRecipeSubstitutionOptions((recipeData as any).substitutionOptions);
    }

    const recipeSteps = normalizeInstructionsFromApi(
      recipeData.instructions || (recipeData as any).steps
    );
    setInstructions(recipeSteps.filter(Boolean));
    if (recipeSteps.length > 0) {
      loadedContent = true;
    }

    if (loadedContent && markLoaded) {
      setHasLoadedRecipe(true);
    }

    const prep = Number.isFinite(recipeData.prepTime) ? recipeData.prepTime : 0;
    const cook = Number.isFinite(recipeData.cookTime) ? recipeData.cookTime : 0;
    const timerTotal =
      (recipeData as any)?.timerRecommendation?.total_min ||
      (recipeData as any)?.timer_recommendation?.total_min ||
      0;
    const stageTimes = resolveStageTimes(prep, cook, timerTotal);
    basePrepTimeRef.current = stageTimes.prepTime;
    baseCookingStageTimeRef.current = stageTimes.cookTime;
    baseCookTimeRef.current = stageTimes.totalCookTime;
    setPrepTime(stageTimes.prepTime);
    setCookTime(stageTimes.cookTime);
    setTotalCookTime(stageTimes.totalCookTime);
  };

  const loadLocalAdaptationsForIngredients = async (items: Ingredient[]) => {
    if (!items.length) return false;
    try {
      const candidateItems = items.filter((item) => item.selected);
      const sourceItems = candidateItems.length > 0 ? candidateItems : items;
      const ingredientNames = sourceItems
        .map((item) => getAdaptationLookupName(item))
        .filter(Boolean);
      if (!ingredientNames.length) return false;
      const uniqueIngredientNames = [...new Set(ingredientNames)];

      setLoadingAdaptations(true);
      const response = await recipeService.getLocalAdaptations({
        dishName,
        ingredients: uniqueIngredientNames,
        limit: uniqueIngredientNames.length,
      });
      const adaptations = response.data?.adaptations || [];

      if (!adaptations.length) {
        const message = response.message || '';
        if (message.toLowerCase().includes('already uses mostly locally available ingredients')) {
          Alert.alert('Already Local', 'This recipe already uses mostly locally available ingredients.');
        }
        return false;
      }

      const updated = items.map((ingredient) => {
        const match = adaptations.find((adaptation: any) =>
          matchAdaptationToIngredient(ingredient, adaptation)
        );

        if (!match) return ingredient;

        return {
          ...ingredient,
          localAlternative: {
            name:
              match.substitute ||
              match.replacement ||
              match.to ||
              match.local ||
              match.suggested ||
              'Local alternative',
            reason: match.reason || match.why || '',
          },
        };
      });

      setIngredients(updated);
      return updated.some((ingredient) => Boolean(ingredient.localAlternative));
    } catch (error) {
      console.error('Auto local adaptation error:', error);
      return false;
    } finally {
      setLoadingAdaptations(false);
    }
  };

  const applyAutoLocalAdaptations = async (items: Ingredient[]) => {
    if (!autoAdapt || autoAdaptApplied || !items.length) return;
    const hasSuggestions = await loadLocalAdaptationsForIngredients(items);
    if (hasSuggestions) {
      setLocalAdaptationEnabled(true);
    }
    setAutoAdaptApplied(true);
  };

  // Helper to check if ID is AI-generated
  const isAiGeneratedId = (id: string | undefined): boolean => {
    if (!id) return false;
    return id.startsWith('ai:') || id.includes(' ') || id.includes('%20');
  };

  const getDishNameForGeneration = () => {
    const recipeTitle =
      recipeParam?.title ||
      (recipeParam as any)?.name ||
      (recipeParam as any)?.dish;
    if (recipeTitle) {
      return String(recipeTitle);
    }

    if (dishName) {
      return dishName;
    }

    if (!dishId) {
      return '';
    }

    const raw = dishId.startsWith('ai:') ? dishId.slice(3) : dishId;
    try {
      return decodeURIComponent(raw).replace(/\+/g, ' ').trim();
    } catch {
      return raw.replace(/\+/g, ' ').trim();
    }
  };

  useEffect(() => {
    const shouldTrustPassedRecipe =
      recipeParam && hasCompleteRecipePayload(recipeParam);

    if (recipeParam && shouldTrustPassedRecipe) {
      applyRecipeData(recipeParam);
    }

    const loadRecipe = async () => {
      if (shouldTrustPassedRecipe) {
        return;
      }

      const dishNameToGenerate = getDishNameForGeneration();
      if (!dishId && !dishNameToGenerate) {
        return;
      }
      
      setLoadingRecipe(true);
      try {
        let loadedRecipe: Recipe | null = null;

        if (dishId && !isAiGeneratedId(dishId)) {
          // For real database IDs, fetch the full stored recipe.
          try {
            const response = await recipeService.getRecipe(dishId);
            const fetchedRecipe = response.data?.recipe || null;
            loadedRecipe = fetchedRecipe && (
              isUserCreatedRecipe(fetchedRecipe) || hasCompleteRecipePayload(fetchedRecipe)
            )
              ? fetchedRecipe
              : null;
          } catch (fetchError) {
            console.error('Load recipe by id error:', fetchError);
          }
        }

        if (!loadedRecipe && dishNameToGenerate) {
          try {
            const response = await recipeService.generateRecipeByDish({
              dish: dishNameToGenerate || dishName,
              servings: 4,
            });
            
            const generatedRecipe =
              (response as any)?.data?.recipe || 
              (response as any)?.recipe ||
              (response as any) ||
              null;
            loadedRecipe = generatedRecipe && hasCompleteRecipePayload(generatedRecipe)
              ? generatedRecipe
              : null;
          } catch (genError) {
            console.error('Generate recipe error:', genError);
          }
        }

        applyRecipeData(
          loadedRecipe || createRecipeFallback(
            dishNameToGenerate || dishName,
            sourceIngredient,
            loadedRecipe || recipeParam
          )
        );
      } catch (error) {
        console.error('Load recipe error:', error);
      } finally {
        setLoadingRecipe(false);
      }
    };

    loadRecipe();
  }, [dishId, recipeParam, sourceIngredient]);

  useEffect(() => {
    if (!hasLoadedRecipe) return;
    if (!autoAdapt || autoAdaptApplied) return;
    applyAutoLocalAdaptations(ingredients);
  }, [autoAdapt, autoAdaptApplied, hasLoadedRecipe, ingredients]);

  useEffect(() => {
    if (!hasLoadedRecipe) return;
    if (feedbackRecipeId && feedbackTarget) return;

    if (isUserCreatedRecipe(recipeParam)) {
      setFeedbackRecipeId(recipeId || dishId);
      setFeedbackTarget('recipes');
      return;
    }

    if (!hasFirebaseConfig || !dishName.trim()) return;

    const publicRecipeInput = {
      id: recipeId || dishId,
      externalId: recipeId || dishId,
      title: dishName.trim(),
      description: recipeParam?.description,
      imageUrl: recipeImage || recipeParam?.imageUrl || recipeParam?.image || null,
      image: recipeImage || recipeParam?.image || recipeParam?.imageUrl || null,
      source: isAiGeneratedId(recipeId || dishId) ? 'ai' : 'app' as const,
    };

    if (!firebaseUserId) {
      setFeedbackRecipeId(getPublicRecipeKey(publicRecipeInput));
      setFeedbackTarget('publicRecipes');
      return;
    }

    let isMounted = true;
    publicRecipeStore.ensurePublicRecipeDocument(publicRecipeInput).then((storedRecipe) => {
      if (!isMounted) return;
      setFeedbackRecipeId(storedRecipe.id);
      setFeedbackTarget('publicRecipes');
    }).catch((error) => {
      console.warn('Public recipe sync failed:', error);
    });

    return () => {
      isMounted = false;
    };
  }, [
    dishId,
    dishName,
    feedbackRecipeId,
    hasLoadedRecipe,
    ingredients,
    instructions,
    recipeId,
    recipeImage,
    recipeParam,
    servingSize,
    feedbackTarget,
    firebaseUserId,
  ]);

  const handleServingSizeChange = async (delta: number) => {
    const newSize = Math.max(1, Math.min(20, servingSize + delta));
    const baseServings = baseServingsRef.current || servingSize || 1;
    const scaleFactor = newSize / baseServings;
    const scaledPrepTime = calculateScaledCookTime(basePrepTimeRef.current, baseServings, newSize);
    const scaledCookTime = calculateScaledCookTime(
      baseCookingStageTimeRef.current,
      baseServings,
      newSize
    );
    setServingSize(newSize);
    setPrepTime(scaledPrepTime);
    setCookTime(scaledCookTime);
    setTotalCookTime(calculateScaledCookTime(baseCookTimeRef.current, baseServings, newSize));

    if (!dishId) {
      // Fallback: local scaling when there is no persisted recipe id
      setIngredients((current) =>
        current.map((ing) => {
          const numeric = typeof ing.originalQuantity === 'number'
            ? ing.originalQuantity
            : Number.parseFloat(`${ing.originalQuantity}`);
          if (!Number.isFinite(numeric)) {
            return ing;
          }
          return { ...ing, quantity: Number((numeric * scaleFactor).toFixed(2)) };
        })
      );
      return;
    }

    setScaling(true);
    try {
      const response = await recipeService.scaleRecipe(dishId, newSize);
      const scaled = response.data || {};
      const scaledIngredients =
        scaled.ingredients ||
        scaled.scaledIngredients ||
        scaled.scaled_ingredients ||
        [];
      if (Array.isArray(scaledIngredients) && scaledIngredients.length > 0) {
        setIngredients(mapIngredientsFromApi(scaledIngredients));
      }
      const apiPrepTime = Number(scaled.prepTime ?? scaled.prep_time ?? 0);
      const apiCookTime = Number(scaled.cookTime ?? scaled.cook_time ?? 0);
      const apiTotalCookTime = Number(scaled.totalCookTime ?? scaled.total_cook_time ?? 0);
      if (apiPrepTime > 0 || apiCookTime > 0 || apiTotalCookTime > 0) {
        const stageTimes = resolveStageTimes(apiPrepTime, apiCookTime, apiTotalCookTime);
        setPrepTime(stageTimes.prepTime);
        setCookTime(stageTimes.cookTime);
        setTotalCookTime(stageTimes.totalCookTime);
      }
    } catch (error) {
      console.error('Scale recipe error:', error);
    } finally {
      setScaling(false);
    }
  };

  const toggleIngredient = (id: string) => {
    setIngredients(ingredients.map(ing =>
      ing.id === id ? { ...ing, selected: !ing.selected } : ing
    ));
  };

  const showLocalAlternative = async (ingredient: Ingredient) => {
    if (ingredient.localAlternative) {
      setSelectedIngredient(ingredient);
      setShowLocalModal(true);
      return;
    }

    if (!localAdaptationEnabled) {
      return;
    }

    try {
      const response = await recipeService.getLocalAdaptations({
        dishName: dishName,
        ingredients: getAdaptationLookupName(ingredient),
        limit: 1,
      });
      const adaptations = response.data?.adaptations || [];
      const match = adaptations.find((item: any) => matchAdaptationToIngredient(ingredient, item)) || adaptations[0];
      if (match) {
        const updated = {
          ...ingredient,
          localAlternative: {
            name:
              match.substitute ||
              match.local ||
              match.suggested ||
              'Local alternative',
            reason: match.reason || match.why || '',
          },
        };
        setIngredients((current) =>
          current.map((ing) => (ing.id === ingredient.id ? updated : ing))
        );
        setSelectedIngredient(updated);
        setShowLocalModal(true);
      } else {
        Alert.alert('No alternative found', 'Try another ingredient.');
      }
    } catch (error) {
      console.error('Local adaptation error:', error);
      Alert.alert('Error', 'Could not load local alternatives.');
    }
  };

  const handleLocalAdaptationToggle = async (enabled: boolean) => {
    setLocalAdaptationEnabled(enabled);

    if (!enabled) {
      setSelectedIngredient(null);
      setShowLocalModal(false);
      return;
    }

    const hasExistingSuggestions = ingredients.some((ingredient) => ingredient.localAlternative);
    if (hasExistingSuggestions || loadingAdaptations) {
      return;
    }

    const parsedTextAdaptations = parseAdaptationsFromSubstitutionText(recipeSubstitutionOptions);
    if (parsedTextAdaptations.length > 0) {
      const updated = applyPrecomputedAdaptations(ingredients, parsedTextAdaptations);
      const hasParsedSuggestions = updated.some((ingredient) => ingredient.localAlternative);
      if (hasParsedSuggestions) {
        setIngredients(updated);
        return;
      }
    }

    const hasSuggestions = await loadLocalAdaptationsForIngredients(ingredients);
    if (!hasSuggestions) {
      Alert.alert('No local substitutions found', 'No ingredient substitutions are available for this recipe right now.');
    }
  };

  const applyLocalAlternative = () => {
    if (selectedIngredient) {
      setIngredients(ingredients.map(ing =>
        ing.id === selectedIngredient.id
          ? { ...ing, name: ing.localAlternative!.name }
          : ing
      ));
      setShowLocalModal(false);
    }
  };

  const handleDone = () => {
    const selectedIngredients = ingredients.filter(ing => ing.selected);
    if (ingredients.length > 0 && selectedIngredients.length === 0) {
      Alert.alert('Select ingredients', 'Please select the ingredients you want to include before cooking.');
      return;
    }

    const actualPrepTime = calculateElapsedMinutes(prepStartedAtRef.current);
    navigation.navigate('CookingSteps', {
      dishName,
      dishImage: recipeImage,
      servingSize,
      ingredients: selectedIngredients,
      instructions,
      actualPrepTime,
      prepTime,
      cookTime,
      totalCookTime,
      recipeId,
      feedbackRecipeId,
      feedbackTarget,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.pageIntro}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'<- Back'}</Text>
          </TouchableOpacity>

          <CornerTimer
            title="Prep Timer"
            durationMinutes={prepTime || DEFAULT_PREP_TIME}
            accentColor={COLORS.pastelOrange.dark}
            onCompleteTitle="Prep time finished"
            onCompleteMessage={`Your ingredients for ${dishName} should be ready. Start cooking when you are ready.`}
          />
        </View>
        <Text style={styles.headerTitle}>Customize Recipe</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recipeHero}>
          <Image
            source={buildRemoteImageSource(recipeImage) || require('../../../assets/icons/book.png')}
            style={styles.recipeHeroImage}
            resizeMode="cover"
          />
          <Text style={styles.dishName}>{dishName}</Text>
        </View>

        {/* Serving Size Control */}
        <View style={styles.servingSection}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          <View style={styles.servingControl}>
            <TouchableOpacity
              style={[styles.servingButton, servingSize === 1 && styles.servingButtonDisabled]}
              onPress={() => handleServingSizeChange(-1)}
              disabled={servingSize === 1}
            >
              <Text style={styles.servingButtonText}>-</Text>
            </TouchableOpacity>
            
            <View style={styles.servingDisplay}>
              <Text style={styles.servingNumber}>{servingSize}</Text>
              <Text style={styles.servingLabel}>
                {servingSize === 1 ? 'Person' : 'People'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.servingButton, servingSize === 20 && styles.servingButtonDisabled]}
              onPress={() => handleServingSizeChange(1)}
              disabled={servingSize === 20}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timeSummaryRow}>
            <View style={styles.timeSummaryChip}>
              <Text style={styles.timeSummaryChipText}>
                Suggested Prep {prepTime || DEFAULT_PREP_TIME} min
              </Text>
            </View>
            <View style={styles.timeSummaryChip}>
              <Text style={styles.timeSummaryChipText}>
                Suggested Cook {cookTime || DEFAULT_COOK_TIME} min
              </Text>
            </View>
            <View style={styles.timeSummaryChip}>
              <Text style={styles.timeSummaryChipText}>
                Suggested Total {totalCookTime || (prepTime || DEFAULT_PREP_TIME) + (cookTime || DEFAULT_COOK_TIME)} min
              </Text>
            </View>
          </View>
          {(loadingRecipe || scaling) && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingText}>
                {loadingRecipe ? 'Loading recipe...' : 'Scaling ingredients...'}
              </Text>
            </View>
          )}
        </View>

        {/* Ingredient Control Panel */}
        <View style={styles.ingredientSection}>
          <View style={styles.ingredientHeader}>
            <View>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.sectionSubtitle}>
                {localAdaptationEnabled
                  ? 'Select ingredients and review suggested local swaps'
                  : 'Select what you want to include'}
              </Text>
            </View>
            
            <View style={styles.localAdaptationToggle}>
              <Text style={styles.toggleLabel}>Local Adaptation</Text>
              <Switch
                value={localAdaptationEnabled}
                onValueChange={handleLocalAdaptationToggle}
                trackColor={{ false: COLORS.border.light, true: COLORS.pastelGreen.light }}
                thumbColor={localAdaptationEnabled ? COLORS.pastelGreen.main : COLORS.background.white}
              />
            </View>
          </View>

          {loadingAdaptations && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingText}>Finding local substitutions...</Text>
            </View>
          )}

          {ingredients.length === 0 ? (
            <Text style={styles.emptyIngredientsText}>
              {loadingRecipe ? 'Loading ingredients...' : 'No ingredients available for this recipe yet.'}
            </Text>
          ) : (
            ingredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleIngredient(ingredient.id)}
                >
                  {ingredient.selected && (
                    <View style={styles.checkboxChecked}>
                      <Text style={styles.checkmark}>X</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.ingredientInfo}>
                  <Text style={[
                    styles.ingredientName,
                    !ingredient.selected && styles.ingredientNameDisabled,
                  ]}>
                    {ingredient.name}
                  </Text>
                  <Text style={styles.ingredientQuantity}>
                    {ingredient.quantity} {ingredient.unit}
                  </Text>

                  {localAdaptationEnabled && ingredient.localAlternative && (
                    <TouchableOpacity
                      style={styles.localSuggestionCard}
                      onPress={() => showLocalAlternative(ingredient)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.localSuggestionLabel}>Suggested Local Substitute</Text>
                      <Text style={styles.localSuggestionName}>
                        {ingredient.localAlternative.name}
                      </Text>
                      {ingredient.localAlternative.reason ? (
                        <Text style={styles.localSuggestionReason} numberOfLines={2}>
                          {ingredient.localAlternative.reason}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  )}
                </View>

                {localAdaptationEnabled && ingredient.localAlternative ? (
                  <TouchableOpacity
                    style={styles.localButton}
                    onPress={() => showLocalAlternative(ingredient)}
                  >
                    <Text style={styles.localButtonText}>View</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Done Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={handleDone}
        >
          Done - Start Cooking
        </Button>
      </View>

      {/* Local Alternative Modal */}
      <Modal
        visible={showLocalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Local Alternative Available</Text>
            
            {selectedIngredient && (
              <>
                <View style={styles.alternativeCard}>
                  <Text style={styles.originalText}>Original:</Text>
                  <Text style={styles.originalName}>{selectedIngredient.name}</Text>

                  <Text style={styles.localText}>Local Alternative:</Text>
                  <Text style={styles.localName}>
                    {selectedIngredient.localAlternative?.name}
                  </Text>
                  
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Why this is better:</Text>
                    <Text style={styles.reasonText}>
                      {selectedIngredient.localAlternative?.reason}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonSecondary}
                    onPress={() => setShowLocalModal(false)}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Keep Original</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={applyLocalAlternative}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Use Local</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
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
    zIndex: 20,
    overflow: 'visible',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.sm),
    gap: moderateScale(SPACING.sm),
    zIndex: 20,
  },
  backButton: {
    paddingTop: moderateScale(SPACING.xs),
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
  dishName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  recipeHero: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.base),
    padding: moderateScale(SPACING.base),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  recipeHeroImage: {
    width: '100%',
    height: moderateScale(180),
    borderRadius: BORDER_RADIUS.md,
    marginBottom: moderateScale(SPACING.md),
    backgroundColor: COLORS.background.tertiary,
  },
  servingSection: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginTop: moderateScale(4),
  },
  servingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: moderateScale(SPACING.xs),
    marginTop: moderateScale(SPACING.md),
  },
  timeSummaryChip: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
  },
  timeSummaryChipText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  servingButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: COLORS.pastelOrange.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  servingButtonDisabled: {
    backgroundColor: COLORS.border.light,
    opacity: 0.5,
  },
  servingButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  servingDisplay: {
    alignItems: 'center',
    marginHorizontal: moderateScale(SPACING['2xl']),
  },
  loadingRow: {
    marginTop: moderateScale(SPACING.sm),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
  },
  loadingText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  servingNumber: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['4xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
  },
  servingLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginTop: moderateScale(4),
  },
  ingredientSection: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.md),
  },
  emptyIngredientsText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    paddingVertical: moderateScale(SPACING.sm),
  },
  localAdaptationToggle: {
    alignItems: 'flex-end',
  },
  toggleLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(4),
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(SPACING.sm),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  checkbox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(6),
    borderWidth: 2,
    borderColor: COLORS.border.main,
    marginRight: moderateScale(SPACING.md),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.pastelOrange.main,
    borderRadius: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: COLORS.text.white,
    fontSize: scaleFontSize(14),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  ingredientNameDisabled: {
    opacity: 0.4,
  },
  ingredientQuantity: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  localSuggestionCard: {
    marginTop: moderateScale(SPACING.sm),
    backgroundColor: COLORS.pastelGreen.light,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.sm),
    borderWidth: 1,
    borderColor: COLORS.pastelGreen.main + '55',
  },
  localSuggestionLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.pastelGreen.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: moderateScale(2),
  },
  localSuggestionName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelGreen.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(2),
  },
  localSuggestionReason: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.xs),
  },
  localButton: {
    backgroundColor: COLORS.pastelGreen.light,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    borderRadius: BORDER_RADIUS.sm,
  },
  localButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.pastelGreen.dark,
  },
  footer: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(SPACING.xl),
  },
  modalContent: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    width: '100%',
    maxWidth: moderateScale(400),
  },
  modalTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.lg),
    textAlign: 'center',
  },
  alternativeCard: {
    backgroundColor: COLORS.background.secondary,
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: moderateScale(SPACING.lg),
  },
  originalText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(4),
  },
  originalName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  localText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.pastelGreen.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: moderateScale(4),
  },
  localName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelGreen.dark,
    marginBottom: moderateScale(SPACING.md),
  },
  reasonBox: {
    backgroundColor: COLORS.pastelGreen.light,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
  },
  reasonLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.pastelGreen.dark,
    marginBottom: moderateScale(4),
  },
  reasonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.main,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.secondary,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.pastelGreen.main,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.white,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default RecipeCustomizationScreen;
