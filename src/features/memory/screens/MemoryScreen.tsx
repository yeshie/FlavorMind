// src/features/memory/screens/MemoryScreen.tsx - Memory-Based Cooking Home
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';

interface MemoryScreenProps {
  navigation: any;
}

interface MemoryHistory {
  id: string;
  dishName: string;
  description: string;
  date: string;
  image?: string;
}

const MemoryScreen: React.FC<MemoryScreenProps> = ({ navigation }) => {
  const [memoryQuery, setMemoryQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Mock memory history
  const memoryHistory: MemoryHistory[] = [
    {
      id: '1',
      dishName: 'Grandmother\'s Spicy Coconut Fish Curry',
      description: 'Spicy fish curry with goraka and coconut milk',
      date: '2 days ago',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
    },
    {
      id: '2',
      dishName: 'Mom\'s Creamy Pumpkin Curry',
      description: 'Sweet and creamy pumpkin curry with spices',
      date: '5 days ago',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
    },
    {
      id: '3',
      dishName: 'Dad\'s Grilled Chicken',
      description: 'Herb-infused grilled chicken with local spices',
      date: '1 week ago',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
    },
  ];

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recognition activated');
  };

  const handleGenerateRecipe = () => {
    if (!memoryQuery.trim()) {
      Alert.alert('Memory Required', 'Please describe your food memory first');
      return;
    }

    // Navigate to Similar Dishes page
    navigation.navigate('SimilarDishesScreen', {
      memoryQuery: memoryQuery.trim(),
    });
  };

  const handleMemoryHistoryPress = (memory: MemoryHistory) => {
    // Navigate directly to recipe customization
    navigation.navigate('RecipeCustomization', {
      dishName: memory.dishName,
      memoryId: memory.id,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memory-Based Cooking</Text>
        <Text style={styles.headerSubtitle}>Recreate your favorite food memories</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Memory Input Card */}
        <View style={styles.memoryCardContainer}>
          <LinearGradient
            colors={['#E9A23B', '#F5B95F', '#FFC97A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.memoryCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Image
                  source={require('../../../assets/icons/memory.png')}
                  style={styles.brainIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardTitle}>Describe Your Food Memory</Text>
            </View>

            <Text style={styles.cardSubtitle}>
              Tell us about a taste, smell, or texture you remember
            </Text>

            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                placeholder="e.g., My grandmother's spicy coconut fish curry with goraka..."
                placeholderTextColor={COLORS.text.tertiary}
                value={memoryQuery}
                onChangeText={setMemoryQuery}
                multiline
                numberOfLines={4}
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

            <Button
              variant="primary"
              size="medium"
              fullWidth
              onPress={handleGenerateRecipe}
              disabled={!memoryQuery.trim()}
              icon={require('../../../assets/icons/sparkle.png')}
              style={styles.generateButton}
            >
              Generate Recipe
            </Button>
          </LinearGradient>
        </View>

        {/* Memory Cooking History */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historyTitle}>Recent Memory Cooking</Text>
            <Text style={styles.historySubtitle}>Your generated recipes</Text>
          </View>

          {memoryHistory.map((memory) => (
            <TouchableOpacity
              key={memory.id}
              style={styles.historyCard}
              onPress={() => handleMemoryHistoryPress(memory)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: memory.image }}
                style={styles.historyImage}
                resizeMode="cover"
              />
              
              <View style={styles.historyContent}>
                <Text style={styles.historyDishName} numberOfLines={2}>
                  {memory.dishName}
                </Text>
                <Text style={styles.historyDescription} numberOfLines={1}>
                  {memory.description}
                </Text>
                <Text style={styles.historyDate}>{memory.date}</Text>
              </View>

              <TouchableOpacity style={styles.historyButton}>
                <Text style={styles.historyButtonText}>Open</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingVertical: moderateScale(SPACING.lg),
    backgroundColor: COLORS.background.header,
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    ...SHADOWS.small,
  },
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
  memoryCardContainer: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.xl),
  },
  memoryCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    ...SHADOWS.large,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  brainIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    tintColor: COLORS.text.white,
  },
  cardTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    opacity: 0.9,
    marginBottom: moderateScale(SPACING.lg),
  },
  inputContainer: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.base),
    minHeight: moderateScale(100),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: COLORS.pastelOrange.dark,
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
  generateButton: {
    backgroundColor: COLORS.pastelOrange.dark,
  },
  historySection: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING['2xl']),
  },
  historySectionHeader: {
    marginBottom: moderateScale(SPACING.md),
  },
  historyTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  historySubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: moderateScale(SPACING.md),
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  historyImage: {
    width: moderateScale(100),
    height: moderateScale(100),
  },
  historyContent: {
    flex: 1,
    padding: moderateScale(SPACING.md),
    justifyContent: 'center',
  },
  historyDishName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  historyDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(4),
  },
  historyDate: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.tertiary,
  },
  historyButton: {
    justifyContent: 'center',
    paddingHorizontal: moderateScale(SPACING.lg),
  },
  historyButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.pastelOrange.main,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default MemoryScreen;