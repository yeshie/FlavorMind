// src/features/memory/screens/RecipeCustomizationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface RecipeCustomizationScreenProps {
  navigation: any;
  route: {
    params: {
      dishName: string;
      dishId?: string;
    };
  };
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  originalQuantity: number;
  selected: boolean;
  localAlternative?: {
    name: string;
    reason: string;
  };
}

const RecipeCustomizationScreen: React.FC<RecipeCustomizationScreenProps> = ({ navigation, route }) => {
  const { dishName } = route.params;
  
  const [servingSize, setServingSize] = useState(1);
  const [localAdaptationEnabled, setLocalAdaptationEnabled] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {
      id: '1',
      name: 'Fish (Tuna or Mackerel)',
      quantity: 500,
      unit: 'g',
      originalQuantity: 500,
      selected: true,
      localAlternative: {
        name: 'Fresh Kelawalla (Mackerel)',
        reason: 'Currently in season and available at local markets',
      },
    },
    {
      id: '2',
      name: 'Coconut Milk',
      quantity: 400,
      unit: 'ml',
      originalQuantity: 400,
      selected: true,
      localAlternative: {
        name: 'Fresh Grated Coconut Milk',
        reason: 'Better flavor and locally abundant',
      },
    },
    {
      id: '3',
      name: 'Goraka (Garcinia)',
      quantity: 2,
      unit: 'pieces',
      originalQuantity: 2,
      selected: true,
    },
    {
      id: '4',
      name: 'Curry Powder',
      quantity: 2,
      unit: 'tbsp',
      originalQuantity: 2,
      selected: true,
    },
    {
      id: '5',
      name: 'Onions',
      quantity: 2,
      unit: 'medium',
      originalQuantity: 2,
      selected: true,
    },
    {
      id: '6',
      name: 'Curry Leaves',
      quantity: 1,
      unit: 'sprig',
      originalQuantity: 1,
      selected: true,
    },
    {
      id: '7',
      name: 'Green Chilies',
      quantity: 3,
      unit: 'pieces',
      originalQuantity: 3,
      selected: true,
    },
    {
      id: '8',
      name: 'Salt',
      quantity: 1,
      unit: 'tsp',
      originalQuantity: 1,
      selected: true,
    },
  ]);

  const handleServingSizeChange = (delta: number) => {
    const newSize = Math.max(1, Math.min(10, servingSize + delta));
    setServingSize(newSize);
    
    // Scale all ingredients
    setIngredients(ingredients.map(ing => ({
      ...ing,
      quantity: (ing.originalQuantity * newSize),
    })));
  };

  const toggleIngredient = (id: string) => {
    setIngredients(ingredients.map(ing =>
      ing.id === id ? { ...ing, selected: !ing.selected } : ing
    ));
  };

  const showLocalAlternative = (ingredient: Ingredient) => {
    if (ingredient.localAlternative) {
      setSelectedIngredient(ingredient);
      setShowLocalModal(true);
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
    navigation.navigate('CookingSteps', {
      dishName,
      servingSize,
      ingredients: selectedIngredients,
    });
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
        <Text style={styles.headerTitle}>Customize Recipe</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Serving Size Control */}
        <View style={styles.servingSection}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          <View style={styles.servingControl}>
            <TouchableOpacity
              style={[styles.servingButton, servingSize === 1 && styles.servingButtonDisabled]}
              onPress={() => handleServingSizeChange(-1)}
              disabled={servingSize === 1}
            >
              <Text style={styles.servingButtonText}>−</Text>
            </TouchableOpacity>
            
            <View style={styles.servingDisplay}>
              <Text style={styles.servingNumber}>{servingSize}</Text>
              <Text style={styles.servingLabel}>
                {servingSize === 1 ? 'Person' : 'People'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.servingButton, servingSize === 10 && styles.servingButtonDisabled]}
              onPress={() => handleServingSizeChange(1)}
              disabled={servingSize === 10}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ingredient Control Panel */}
        <View style={styles.ingredientSection}>
          <View style={styles.ingredientHeader}>
            <View>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.sectionSubtitle}>
                Select what you want to include
              </Text>
            </View>
            
            <View style={styles.localAdaptationToggle}>
              <Text style={styles.toggleLabel}>Local Adaptation</Text>
              <Switch
                value={localAdaptationEnabled}
                onValueChange={setLocalAdaptationEnabled}
                trackColor={{ false: COLORS.border.light, true: COLORS.pastelGreen.light }}
                thumbColor={localAdaptationEnabled ? COLORS.pastelGreen.main : COLORS.background.white}
              />
            </View>
          </View>

          {ingredients.map((ingredient) => (
            <View key={ingredient.id} style={styles.ingredientRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => toggleIngredient(ingredient.id)}
              >
                {ingredient.selected && (
                  <View style={styles.checkboxChecked}>
                    <Text style={styles.checkmark}>✓</Text>
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
              </View>

              {localAdaptationEnabled && ingredient.localAlternative && (
                <TouchableOpacity
                  style={styles.localButton}
                  onPress={() => showLocalAlternative(ingredient)}
                >
                  <Text style={styles.localButtonText}>🌿 Local</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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
                  
                  <Text style={styles.arrowText}>↓</Text>
                  
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
  dishName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
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
  arrowText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    textAlign: 'center',
    color: COLORS.pastelGreen.main,
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
