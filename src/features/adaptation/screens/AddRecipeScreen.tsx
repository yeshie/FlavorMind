// src/features/adaptation/screens/AddRecipeScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Globe, Save, Trash2 } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import recipeService from '../../../services/api/recipe.service';

interface AddRecipeScreenProps {
  navigation: any;
}

const AddRecipeScreen: React.FC<AddRecipeScreenProps> = ({ navigation }) => {
  const [dishName, setDishName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickedImage, setPickedImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const parsedIngredients = useMemo(() => {
    return ingredients
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        quantity: '',
        unit: '',
      }));
  }, [ingredients]);

  const parsedInstructions = useMemo(() => {
    return instructions
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        step: index + 1,
        description: line.replace(/^\d+\.\s*/, ''),
      }));
  }, [instructions]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDishName('');
            setIngredients('');
            setAlternatives('');
            setServingSize('');
            setInstructions('');
            Alert.alert('Deleted', 'Recipe has been cleared');
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const name = asset.fileName || `recipe_${Date.now()}.jpg`;
    const type = asset.mimeType || 'image/jpeg';

    setPickedImage({
      uri: asset.uri,
      name,
      type,
    });
  };

  const handleSave = async (publish: boolean) => {
    if (!dishName.trim()) {
      Alert.alert('Error', 'Please enter dish name');
      return;
    }
    if (parsedIngredients.length === 0 || parsedInstructions.length === 0) {
      Alert.alert('Error', 'Please add ingredients and instructions');
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | undefined;
      let imageId: string | undefined;
      if (pickedImage) {
        const upload = await recipeService.uploadRecipeImage(pickedImage);
        imageUrl = upload.data?.imageUrl;
        imageId = upload.data?.imageId;
      }

      await recipeService.createRecipe({
        title: dishName.trim(),
        description: alternatives.trim() || 'User-submitted recipe',
        cuisine: 'Sri Lankan',
        category: 'dinner',
        difficulty: 'medium',
        prepTime: 0,
        cookTime: 0,
        servings: Number(servingSize) || 1,
        ingredients: parsedIngredients,
        instructions: parsedInstructions,
        isPublished: publish,
        imageUrl: imageUrl || null,
        imageId: imageId || null,
      });
      Alert.alert('Success', publish ? 'Recipe published!' : 'Recipe saved to your library!');
      navigation.goBack();
    } catch (error) {
      console.error('Save recipe error:', error);
      Alert.alert('Error', 'Could not save recipe right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPublish = () => {
    if (!dishName.trim()) {
      Alert.alert('Error', 'Please enter dish name');
      return;
    }
    Alert.alert(
      'Publish Recipe',
      'Your recipe will be shared with the FlavorMind community. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: () => {
            handleSave(true);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
          <Text style={styles.headerTitle}>Add Your Own Recipe</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Dish Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dish Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Coconut Fish Curry"
                placeholderTextColor={COLORS.text.tertiary}
                value={dishName}
                onChangeText={setDishName}
              />
            </View>

            {/* Ingredients */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ingredients *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="List all ingredients (one per line)"
                placeholderTextColor={COLORS.text.tertiary}
                value={ingredients}
                onChangeText={setIngredients}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Alternative Ingredients */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alternative Ingredients</Text>
              <Text style={styles.helperText}>
                Suggest local or seasonal alternatives
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Use fresh coconut milk instead of canned"
                placeholderTextColor={COLORS.text.tertiary}
                value={alternatives}
                onChangeText={setAlternatives}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Serving Size */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Serving Size (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 4"
                placeholderTextColor={COLORS.text.tertiary}
                value={servingSize}
                onChangeText={setServingSize}
                keyboardType="numeric"
              />
            </View>

            {/* Upload Image Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickImage}
            >
              <Camera size={scaleFontSize(20)} color={COLORS.text.secondary} strokeWidth={2} style={styles.uploadIcon} />
              <Text style={styles.uploadText}>
                {pickedImage ? 'Change Image' : 'Upload Image (Optional)'}
              </Text>
            </TouchableOpacity>
            {pickedImage && (
              <Image
                source={{ uri: pickedImage.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            {/* Instructions */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Step-by-Step Instructions *</Text>
              <TextInput
                style={[styles.input, styles.textArea, styles.instructionsArea]}
                placeholder="1. First, do this...&#10;2. Then, do that...&#10;3. Finally..."
                placeholderTextColor={COLORS.text.tertiary}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
          >
            <Trash2 size={scaleFontSize(18)} color={COLORS.status.error} strokeWidth={2} style={styles.actionIcon} />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSave(false)}
          >
            <Save size={scaleFontSize(18)} color={COLORS.text.primary} strokeWidth={2} style={styles.actionIcon} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={handleSaveAndPublish}
          >
            <Globe size={scaleFontSize(18)} color={COLORS.text.white} strokeWidth={2} style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.publishText]}>Save & Publish</Text>
          </TouchableOpacity>
        </View>

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
            <Text style={styles.savingText}>Saving recipe...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  keyboardView: {
    flex: 1,
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
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: moderateScale(SPACING.base),
  },
  inputGroup: {
    marginBottom: moderateScale(SPACING.lg),
  },
  label: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  helperText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.xs),
  },
  input: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.md),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  textArea: {
    minHeight: moderateScale(100),
  },
  instructionsArea: {
    minHeight: moderateScale(200),
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.lg),
    marginBottom: moderateScale(SPACING.lg),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border.main,
  },
  uploadIcon: {
    marginRight: moderateScale(SPACING.sm),
  },
  uploadText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
  },
  previewImage: {
    width: '100%',
    height: moderateScale(180),
    borderRadius: BORDER_RADIUS.md,
    marginTop: moderateScale(SPACING.md),
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.medium,
    gap: moderateScale(SPACING.sm),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: moderateScale(SPACING.md),
  },
  publishButton: {
    backgroundColor: COLORS.pastelGreen.main,
  },
  actionIcon: {
    marginRight: moderateScale(SPACING.xs),
  },
  actionText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  publishText: {
    color: COLORS.text.white,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    marginTop: moderateScale(SPACING.sm),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});

export default AddRecipeScreen;
