// src/features/scaling/screens/SmartScalingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface SmartScalingScreenProps {
  navigation: any;
}

interface ScalingExample {
  id: string;
  text: string;
  ingredient: string;
  amount: string;
  unit: string;
}

const SmartScalingScreen: React.FC<SmartScalingScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scalingQuery, setScalingQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const scalingExamples: ScalingExample[] = [
    {
      id: '1',
      text: 'I have 2 cups of flour',
      ingredient: 'flour',
      amount: '2',
      unit: 'cups',
    },
    {
      id: '2',
      text: 'I have 500g chicken',
      ingredient: 'chicken',
      amount: '500',
      unit: 'g',
    },
    {
      id: '3',
      text: 'I have 1kg rice',
      ingredient: 'rice',
      amount: '1',
      unit: 'kg',
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleLibrary = () => {
    navigation.navigate('RecipeLibrary');
  };

  const handleExamplePress = (example: ScalingExample) => {
    setScalingQuery(example.text);
  };

  const handleGenerateRecipe = () => {
    if (!scalingQuery.trim()) {
      Alert.alert('Input Required', 'Please describe what ingredient amount you have');
      return;
    }

    // Navigate to scaled recipe results
    navigation.navigate('ScaledRecipeResults', {
      scalingQuery: scalingQuery.trim(),
    });
  };

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recognition activated');
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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Smart Scaling</Text>
            <Text style={styles.headerSubtitle}>
              Get recipes adjusted to your ingredient amounts
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Image
                source={require('../../../assets/icons/search.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a recipe (e.g., Chicken curry)"
                placeholderTextColor={COLORS.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddRecipe}
              activeOpacity={0.8}
            >
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>➕</Text>
              </View>
              <Text style={styles.actionButtonText}>Add Your Own Recipe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLibrary}
              activeOpacity={0.8}
            >
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>📚</Text>
              </View>
              <Text style={styles.actionButtonText}>Library</Text>
            </TouchableOpacity>
          </View>

          {/* Smart Scaling Card */}
          <View style={styles.scalingCard}>
            <View style={styles.scalingHeader}>
              <View style={styles.scalingIconContainer}>
                <Image
                  source={require('../../../assets/icons/ruler.png')}
                  style={styles.scalingIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.scalingHeaderText}>
                <Text style={styles.scalingTitle}>Scale by Ingredient</Text>
                <Text style={styles.scalingSubtitle}>
                  Tell us what you have, we'll adjust everything else
                </Text>
              </View>
            </View>

            {/* Input Field */}
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                placeholder="e.g., I have 2 cups of flour..."
                placeholderTextColor={COLORS.text.tertiary}
                value={scalingQuery}
                onChangeText={setScalingQuery}
                multiline
                numberOfLines={3}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />

              <TouchableOpacity
                style={styles.micButton}
                onPress={handleVoiceInput}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../../assets/icons/microphone.png')}
                  style={styles.micIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Quick Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Quick Examples:</Text>
              <View style={styles.examplesContainer}>
                {scalingExamples.map((example) => (
                  <TouchableOpacity
                    key={example.id}
                    style={styles.exampleChip}
                    onPress={() => handleExamplePress(example)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exampleText}>{example.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Generate Button */}
            <Button
              variant="primary"
              size="medium"
              fullWidth
              onPress={handleGenerateRecipe}
              disabled={!scalingQuery.trim()}
              icon={require('../../../assets/icons/sparkle.png')}
              style={styles.generateButton}
            >
              Find Scaled Recipes
            </Button>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                Just tell us the ingredient and amount you have. Our AI will find recipes and automatically scale all other ingredients to match perfectly!
              </Text>
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Pro Tips:</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>✓</Text>
              <Text style={styles.tipText}>
                Be specific with amounts: "2 cups flour" not just "flour"
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>✓</Text>
              <Text style={styles.tipText}>
                Include the unit: cups, grams, tablespoons, etc.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>✓</Text>
              <Text style={styles.tipText}>
                Works best with main ingredients like flour, rice, chicken, etc.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  headerContent: {},
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  headerSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  searchIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.text.secondary,
    marginRight: moderateScale(SPACING.sm),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    paddingVertical: moderateScale(SPACING.md),
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    gap: moderateScale(SPACING.md),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  actionButtonIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.pastelOrange.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.sm),
  },
  actionButtonIconText: {
    fontSize: scaleFontSize(20),
  },
  actionButtonText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  scalingCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    padding: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.pastelOrange.light,
    ...SHADOWS.medium,
  },
  scalingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.lg),
  },
  scalingIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: COLORS.pastelOrange.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  scalingIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    tintColor: COLORS.pastelOrange.dark,
  },
  scalingHeaderText: {
    flex: 1,
  },
  scalingTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  scalingSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  inputContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.lg),
    minHeight: moderateScale(100),
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  inputContainerFocused: {
    borderColor: COLORS.pastelOrange.main,
    backgroundColor: COLORS.background.white,
  },
  input: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    textAlignVertical: 'top',
    minHeight: moderateScale(60),
  },
  micButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.pastelOrange.main,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: moderateScale(SPACING.sm),
  },
  micIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.text.white,
  },
  examplesSection: {
    marginBottom: moderateScale(SPACING.lg),
  },
  examplesTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.sm),
  },
  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.sm),
  },
  exampleChip: {
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.main,
  },
  exampleText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  generateButton: {
    backgroundColor: COLORS.pastelOrange.main,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.pastelYellow.light,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
  },
  infoIcon: {
    fontSize: scaleFontSize(32),
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
  tipsSection: {
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    backgroundColor: COLORS.pastelGreen.light + '30',
    padding: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.pastelGreen.light,
  },
  tipsTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.sm),
  },
  tipBullet: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelGreen.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginRight: moderateScale(SPACING.sm),
    marginTop: moderateScale(2),
  },
  tipText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SmartScalingScreen;