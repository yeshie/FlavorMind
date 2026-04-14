// src/features/cookbook/screens/CookbookCoverSetupScreen.tsx
import React, { useState } from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Lightbulb } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import recipeService from '../../../services/api/recipe.service';
import { buildRemoteImageSource } from '../../../common/utils';

interface CookbookCoverSetupScreenProps {
  navigation: any;
  route: {
    params: {
      selectedRecipes: any[];
    };
  };
}

const CookbookCoverSetupScreen: React.FC<CookbookCoverSetupScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { selectedRecipes } = route.params;

  const [cookbookTitle, setCookbookTitle] = useState('');
  const [shortIntroduction, setShortIntroduction] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [aboutAuthor, setAboutAuthor] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [introImageUrl, setIntroImageUrl] = useState<string | null>(null);
  const [thankYouImageUrl, setThankYouImageUrl] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<'cover' | 'intro' | 'thankyou' | null>(null);

  const uploadSelectedImage = async (
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    field: 'cover' | 'intro' | 'thankyou'
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setUploadingField(field);
    try {
      const fileType = asset.mimeType || 'image/jpeg';
      const extension = fileType.split('/')[1] || 'jpg';
      const upload = await recipeService.uploadRecipeImage({
        uri: asset.uri,
        name: asset.fileName || `${field}-${Date.now()}.${extension}`,
        type: fileType,
      });
      setter(upload.data?.imageUrl || null);
    } catch (error) {
      console.error(`${field} image upload failed:`, error);
      Alert.alert('Upload Failed', 'Could not upload the selected image right now.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleNext = () => {
    // Validation
    if (!cookbookTitle.trim()) {
      Alert.alert('Required', 'Please enter a cookbook title');
      return;
    }
    if (!shortIntroduction.trim()) {
      Alert.alert('Required', 'Please enter a short introduction');
      return;
    }
    if (!authorName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    // Navigate to summary page
    navigation.navigate('CookbookCreationSummary', {
      selectedRecipes,
      coverData: {
        title: cookbookTitle,
        introduction: shortIntroduction,
        authorName,
        occupation,
        aboutAuthor,
        thankYouMessage,
        coverImageUrl,
        introImageUrl,
        thankYouImageUrl,
        categories: categoriesInput
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      },
    });
  };

  const handleUploadCoverImage = () => {
    uploadSelectedImage(setCoverImageUrl, 'cover');
  };

  const handleUploadIntroImage = () => {
    uploadSelectedImage(setIntroImageUrl, 'intro');
  };

  const handleUploadThankYouImage = () => {
    uploadSelectedImage(setThankYouImageUrl, 'thankyou');
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
          <Text style={styles.headerTitle}>Cookbook Cover Setup</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Cookbook Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cookbook Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., My Sri Lankan Kitchen"
                placeholderTextColor={COLORS.text.tertiary}
                value={cookbookTitle}
                onChangeText={setCookbookTitle}
              />
            </View>

            {/* Short Introduction */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Introduction *</Text>
              <Text style={styles.helperText}>
                A brief description of your cookbook (1-2 sentences)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., A collection of authentic Sri Lankan recipes passed down through my family..."
                placeholderTextColor={COLORS.text.tertiary}
                value={shortIntroduction}
                onChangeText={setShortIntroduction}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Cover Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cover Image</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadCoverImage}
                disabled={uploadingField === 'cover'}
              >
                {uploadingField === 'cover' ? (
                  <ActivityIndicator size="small" color={COLORS.text.secondary} />
                ) : coverImageUrl ? (
                  <Image
                    source={buildRemoteImageSource(coverImageUrl)}
                    style={styles.uploadPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <Camera
                    size={scaleFontSize(20)}
                    color={COLORS.text.secondary}
                    strokeWidth={2}
                    style={styles.uploadIcon}
                  />
                )}
                <Text style={styles.uploadText}>
                  {coverImageUrl ? 'Change Cover Image' : 'Upload Cover Image'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categories</Text>
              <Text style={styles.helperText}>
                Add comma-separated tags like Curry, Family, Vegetarian
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Curry, Traditional, Family"
                placeholderTextColor={COLORS.text.tertiary}
                value={categoriesInput}
                onChangeText={setCategoriesInput}
              />
            </View>

            {/* Author Information Section */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Author Information</Text>
            </View>

            {/* Author Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name as it will appear"
                placeholderTextColor={COLORS.text.tertiary}
                value={authorName}
                onChangeText={setAuthorName}
              />
            </View>

            {/* Occupation */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Home Chef, Food Enthusiast"
                placeholderTextColor={COLORS.text.tertiary}
                value={occupation}
                onChangeText={setOccupation}
              />
            </View>

            {/* About the Author */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>About the Author</Text>
              <Text style={styles.helperText}>
                Tell readers about yourself and your cooking journey
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share your story, cooking experience, and what inspired this cookbook..."
                placeholderTextColor={COLORS.text.tertiary}
                value={aboutAuthor}
                onChangeText={setAboutAuthor}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Introduction Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Introduction Image (Optional)</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadIntroImage}
                disabled={uploadingField === 'intro'}
              >
                {uploadingField === 'intro' ? (
                  <ActivityIndicator size="small" color={COLORS.text.secondary} />
                ) : introImageUrl ? (
                  <Image
                    source={buildRemoteImageSource(introImageUrl)}
                    style={styles.uploadPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <Camera
                    size={scaleFontSize(20)}
                    color={COLORS.text.secondary}
                    strokeWidth={2}
                    style={styles.uploadIcon}
                  />
                )}
                <Text style={styles.uploadText}>
                  {introImageUrl ? 'Change Introduction Image' : 'Upload Introduction Image'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Thank You Section */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Thank You Message</Text>
            </View>

            {/* Thank You Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thank You Message</Text>
              <Text style={styles.helperText}>
                A message to thank readers at the end of your cookbook
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Thank you for trying these recipes. I hope they bring joy to your kitchen..."
                placeholderTextColor={COLORS.text.tertiary}
                value={thankYouMessage}
                onChangeText={setThankYouMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Thank You Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thank You Image (Optional)</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadThankYouImage}
                disabled={uploadingField === 'thankyou'}
              >
                {uploadingField === 'thankyou' ? (
                  <ActivityIndicator size="small" color={COLORS.text.secondary} />
                ) : thankYouImageUrl ? (
                  <Image
                    source={buildRemoteImageSource(thankYouImageUrl)}
                    style={styles.uploadPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <Camera
                    size={scaleFontSize(20)}
                    color={COLORS.text.secondary}
                    strokeWidth={2}
                    style={styles.uploadIcon}
                  />
                )}
                <Text style={styles.uploadText}>
                  {thankYouImageUrl ? 'Change Thank You Image' : 'Upload Thank You Image'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Lightbulb size={scaleFontSize(22)} color={COLORS.pastelYellow.main} strokeWidth={2} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Pro Tip</Text>
                <Text style={styles.infoText}>
                  Take your time with your introduction and about section. These help readers connect with your cookbook and understand your cooking style!
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleNext}
          >
            Next: Preview & Publish
          </Button>
        </View>
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
    marginBottom: moderateScale(2),
  },
  headerSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.lg),
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
  uploadPreview: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: BORDER_RADIUS.md,
    marginRight: moderateScale(SPACING.sm),
  },
  sectionDivider: {
    marginVertical: moderateScale(SPACING.xl),
    paddingBottom: moderateScale(SPACING.md),
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border.main,
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelYellow.light,
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
    marginTop: moderateScale(SPACING.lg),
  },
  infoIcon: {
    marginRight: moderateScale(SPACING.md),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  infoText: {
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
});

export default CookbookCoverSetupScreen;
