// src/features/adaptation/screens/AddRecipeScreen.tsx
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface AddRecipeScreenProps {
  navigation: any;
}

const AddRecipeScreen: React.FC<AddRecipeScreenProps> = ({ navigation }) => {
  const [dishName, setDishName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [instructions, setInstructions] = useState('');

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

  const handleSave = () => {
    if (!dishName.trim()) {
      Alert.alert('Error', 'Please enter dish name');
      return;
    }
    Alert.alert('Success', 'Recipe saved to your library!');
    navigation.goBack();
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
            Alert.alert('Published!', 'Your recipe is now live in the community feed');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
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
                placeholder="e.g., 4 people"
                placeholderTextColor={COLORS.text.tertiary}
                value={servingSize}
                onChangeText={setServingSize}
              />
            </View>

            {/* Upload Image Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => Alert.alert('Upload Image', 'Feature coming soon')}
            >
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Upload Image (Optional)</Text>
            </TouchableOpacity>

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
            <Text style={styles.actionIcon}>🗑</Text>
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
          >
            <Text style={styles.actionIcon}>💾</Text>
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={handleSaveAndPublish}
          >
            <Text style={styles.actionIcon}>🌍</Text>
            <Text style={[styles.actionText, styles.publishText]}>Save & Publish</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: COLORS.background.header,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    ...SHADOWS.small,
  },
  backButton: {
    marginBottom: moderateScale(SPACING.sm),
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
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
    fontSize: scaleFontSize(24),
    marginRight: moderateScale(SPACING.sm),
  },
  uploadText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
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
    fontSize: scaleFontSize(20),
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
});

export default AddRecipeScreen;