// src/features/adaptation/screens/IngredientGuideScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import ingredientService from '../../../services/api/ingredient.service';
import Button from '../../../common/components/Button/button';
import { Recipe } from '../../../services/api/recipe.service';

interface IngredientGuideScreenProps {
  navigation: any;
  route: {
    params: {
      name?: string;
      slug?: string;
    };
  };
}

const IngredientGuideScreen: React.FC<IngredientGuideScreenProps> = ({ navigation, route }) => {
  const { name, slug } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<any>(null);
  const [errorText, setErrorText] = useState('');

  const guideRecipe = useMemo<Recipe | null>(() => {
    if (!guide) return null;

    const ingredients = Array.isArray(guide.ingredients)
      ? guide.ingredients.map((item: any) => ({
          name: item?.name || 'Ingredient',
          quantity: item?.qty ? String(item.qty) : '',
          unit: item?.unit || '',
        }))
      : [];

    const instructions = Array.isArray(guide.steps)
      ? guide.steps.map((step: string, index: number) => ({
          step: index + 1,
          description: step,
        }))
      : [];

    return {
      id: guide.id || guide.slug || guide.name || 'guide-recipe',
      title: guide.name || name || 'Recipe',
      description: guide.description || '',
      cuisine: 'Sri Lankan',
      category: 'dinner',
      difficulty: 'easy',
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      ingredients,
      instructions,
      imageUrl: guide.imageUrl || undefined,
    };
  }, [guide, name]);

  const handleStartCooking = () => {
    if (!guideRecipe) return;
    navigation.navigate('RecipeCustomization', {
      dishName: guideRecipe.title,
      recipe: guideRecipe,
    });
  };

  useEffect(() => {
    const loadGuide = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const response = await ingredientService.getGuide({
          name,
          slug,
          q: name,
        });
        setGuide(response.data?.guide || null);
      } catch (error) {
        console.error('Ingredient guide load error:', error);
        setErrorText('Could not load this guide.');
      } finally {
        setLoading(false);
      }
    };

    loadGuide();
  }, [name, slug]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'<- Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingredient Guide</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>Loading guide...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{errorText}</Text>
          </View>
        ) : guide ? (
          <>
            <Image
              source={
                guide.imageUrl
                  ? { uri: guide.imageUrl }
                  : require('../../../assets/icon.png')
              }
              style={styles.heroImage}
              resizeMode="cover"
            />

            <View style={styles.content}>
              <Text style={styles.title}>{guide.name}</Text>
              {guide.description ? (
                <Text style={styles.description}>{guide.description}</Text>
              ) : null}

              {guide.yield ? (
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Yield</Text>
                  <Text style={styles.infoValue}>{guide.yield}</Text>
                </View>
              ) : null}

              {Array.isArray(guide.ingredients) && guide.ingredients.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  {guide.ingredients.map((item: any, index: number) => (
                    <View key={`${item.name}-${index}`} style={styles.listItem}>
                      <Text style={styles.listBullet}>-</Text>
                      <Text style={styles.listText}>
                        {item.qty ? `${item.qty} ` : ''}
                        {item.unit ? `${item.unit} ` : ''}
                        {item.name}
                        {item.note ? ` (${item.note})` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {Array.isArray(guide.equipment) && guide.equipment.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Equipment</Text>
                  {guide.equipment.map((item: string, index: number) => (
                    <View key={`${item}-${index}`} style={styles.listItem}>
                      <Text style={styles.listBullet}>-</Text>
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {Array.isArray(guide.steps) && guide.steps.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Step-by-Step</Text>
                  {guide.steps.map((step: string, index: number) => (
                    <View key={`${index}`} style={styles.listItem}>
                      <Text style={styles.listBullet}>{index + 1}.</Text>
                      <Text style={styles.listText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}

              {Array.isArray(guide.tips) && guide.tips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pro Tips</Text>
                  {guide.tips.map((tip: string, index: number) => (
                    <View key={`${tip}-${index}`} style={styles.listItem}>
                      <Text style={styles.listBullet}>-</Text>
                      <Text style={styles.listText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No guide found.</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {guideRecipe ? (
        <View style={styles.footer}>
          <Button variant="primary" size="large" fullWidth onPress={handleStartCooking}>
            Start Cooking
          </Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
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
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: moderateScale(240),
  },
  content: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
  },
  description: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
    marginBottom: moderateScale(SPACING.lg),
  },
  infoCard: {
    backgroundColor: COLORS.background.white,
    padding: moderateScale(SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
    marginBottom: moderateScale(SPACING.lg),
  },
  infoLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(2),
  },
  infoValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  section: {
    marginBottom: moderateScale(SPACING.lg),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.sm),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(6),
  },
  listBullet: {
    width: moderateScale(20),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  listText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(SPACING.base),
  },
  loadingText: {
    marginLeft: moderateScale(SPACING.sm),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
  footer: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.medium,
  },
});

export default IngredientGuideScreen;
