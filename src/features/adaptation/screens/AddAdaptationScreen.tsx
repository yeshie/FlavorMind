// src/features/adaptation/screens/AddAdaptationScreen.tsx
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
import { ArrowLeft, Camera, Save } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import ingredientService from '../../../services/api/ingredient.service';
import recipeService from '../../../services/api/recipe.service';

interface AddAdaptationScreenProps {
  navigation: any;
}

interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

const AddAdaptationScreen: React.FC<AddAdaptationScreenProps> = ({ navigation }) => {
  const [original, setOriginal] = useState('');
  const [substitute, setSubstitute] = useState('');
  const [reason, setReason] = useState('');

  const [guideName, setGuideName] = useState('');
  const [guideDescription, setGuideDescription] = useState('');
  const [guideIngredients, setGuideIngredients] = useState('');
  const [guideSteps, setGuideSteps] = useState('');
  const [guideTips, setGuideTips] = useState('');

  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedGuideIngredients = useMemo(() => {
    return guideIngredients
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        qty: '',
        unit: '',
      }));
  }, [guideIngredients]);

  const parsedGuideSteps = useMemo(() => {
    return guideSteps
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^\d+\.\s*/, ''));
  }, [guideSteps]);

  const parsedGuideTips = useMemo(() => {
    return guideTips
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [guideTips]);

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
    const name = asset.fileName || `adaptation_${Date.now()}.jpg`;
    const type = asset.mimeType || 'image/jpeg';

    setPickedImage({
      uri: asset.uri,
      name,
      type,
    });
  };

  const handleSave = async () => {
    if (!original.trim() || !substitute.trim()) {
      Alert.alert('Error', 'Please enter the original and substitute ingredients.');
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | undefined;
      if (pickedImage) {
        const upload = await recipeService.uploadRecipeImage(pickedImage);
        imageUrl = upload.data?.imageUrl;
      }

      const hasGuideContent =
        guideName.trim() ||
        guideDescription.trim() ||
        parsedGuideIngredients.length ||
        parsedGuideSteps.length ||
        parsedGuideTips.length ||
        imageUrl;

      const payload: any = {
        original: original.trim(),
        substitute: substitute.trim(),
        reason: reason.trim(),
      };

      if (hasGuideContent) {
        payload.guide = {
          name: guideName.trim() || substitute.trim(),
          description: guideDescription.trim(),
          imageUrl,
          ingredients: parsedGuideIngredients,
          steps: parsedGuideSteps,
          tips: parsedGuideTips,
        };
      }

      await ingredientService.createAdaptation(payload);
      Alert.alert('Success', 'Local adaptation saved.');
      navigation.goBack();
    } catch (error) {
      console.error('Save adaptation error:', error);
      Alert.alert('Error', 'Could not save adaptation right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
          <Text style={styles.headerTitle}>Add Local Adaptation</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Original Ingredient *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Olives"
                placeholderTextColor={COLORS.text.tertiary}
                value={original}
                onChangeText={setOriginal}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Local Substitute *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Veralu Achcharu"
                placeholderTextColor={COLORS.text.tertiary}
                value={substitute}
                onChangeText={setSubstitute}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Why it works</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Short reason or description"
                placeholderTextColor={COLORS.text.tertiary}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>How to make (optional)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Guide Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Veralu Achcharu (Olive Pickle)"
                placeholderTextColor={COLORS.text.tertiary}
                value={guideName}
                onChangeText={setGuideName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Guide Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Short description"
                placeholderTextColor={COLORS.text.tertiary}
                value={guideDescription}
                onChangeText={setGuideDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ingredients (one per line)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., 500g veralu"
                placeholderTextColor={COLORS.text.tertiary}
                value={guideIngredients}
                onChangeText={setGuideIngredients}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Steps (one per line)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="1. Wash the veralu..."
                placeholderTextColor={COLORS.text.tertiary}
                value={guideSteps}
                onChangeText={setGuideSteps}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tips (one per line)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Rest overnight for best flavor"
                placeholderTextColor={COLORS.text.tertiary}
                value={guideTips}
                onChangeText={setGuideTips}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickImage}
            >
              <Camera size={scaleFontSize(20)} color={COLORS.text.secondary} strokeWidth={2} style={styles.uploadIcon} />
              <Text style={styles.uploadText}>
                {pickedImage ? 'Change Image' : 'Upload Image'}
              </Text>
            </TouchableOpacity>

            {pickedImage && (
              <Image source={{ uri: pickedImage.uri }} style={styles.previewImage} />
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <View style={styles.saveButtonContent}>
              <Save size={scaleFontSize(18)} color={COLORS.text.white} strokeWidth={2} style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Save Adaptation</Text>
            </View>
          </TouchableOpacity>
        </View>

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
            <Text style={styles.savingText}>Saving adaptation...</Text>
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
  input: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.md),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...SHADOWS.small,
  },
  textArea: {
    minHeight: moderateScale(100),
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: moderateScale(SPACING.md),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.md),
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  uploadIcon: {
    marginRight: moderateScale(SPACING.sm),
  },
  uploadText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
  },
  previewImage: {
    width: '100%',
    height: moderateScale(180),
    borderRadius: BORDER_RADIUS.md,
    marginTop: moderateScale(SPACING.md),
  },
  footer: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.medium,
  },
  saveButton: {
    backgroundColor: COLORS.pastelOrange.main,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: moderateScale(SPACING.md),
    alignItems: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
  },
  saveButtonIcon: {},
  saveButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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

export default AddAdaptationScreen;
