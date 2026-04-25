// src/features/memory/screens/MemoryScreen.tsx - Memory-Based Cooking Home
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import { buildRemoteImageSource } from '../../../common/utils';
import Button from '../../../common/components/Button/button';
import recipeService from '../../../services/api/recipe.service';
import memoryService from '../../../services/api/memory.service';
import { getRecallHistory, RecallHistoryEntry } from '../../../services/storage/asyncStorage';

interface MemoryScreenProps {
  navigation: any;
}

interface MemoryHistory {
  id: string;
  dishName: string;
  description: string;
  timestamp: string;
  date: string;
  image?: string;
  recipeId?: string;
}

const MemoryScreen: React.FC<MemoryScreenProps> = ({ navigation }) => {
  const [memoryQuery, setMemoryQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [memoryHistory, setMemoryHistory] = useState<MemoryHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [creatingMemory, setCreatingMemory] = useState(false);

  const formatRelativeDate = (dateValue?: string) => {
    if (!dateValue) return 'Recently';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'Recently';
    return formatDistanceToNow(parsed, { addSuffix: true });
  };

  const mapRecallHistory = (memory: RecallHistoryEntry): MemoryHistory => ({
    id: memory.id,
    dishName: memory.dishName,
    description: memory.prompt,
    timestamp: memory.updatedAt,
    date: formatRelativeDate(memory.updatedAt),
    image: memory.image,
    recipeId: memory.recipeId,
  });

  const sortAndDeduplicateHistory = (
    items: MemoryHistory[]
  ): MemoryHistory[] => {
    const merged = [...items].sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    );

    const deduped = new Map<string, MemoryHistory>();
    merged.forEach((item) => {
      const recipeKey = `${item.recipeId || item.dishName}`.toLowerCase();
      const promptKey = item.description.toLowerCase();
      const key = `${recipeKey}::${promptKey}`;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    });

    return [...deduped.values()].slice(0, 10);
  };

  const loadMemoryHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const localHistory = await getRecallHistory();
      setMemoryHistory(sortAndDeduplicateHistory(localHistory.map(mapRecallHistory)));
    } catch (error) {
      console.error('Recall history load error:', error);
      setMemoryHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recognition activated');
  };

  const handleGenerateRecipe = async () => {
    if (!memoryQuery.trim()) {
      Alert.alert('Memory Required', 'Please describe your food memory first');
      return;
    }

    const prompt = memoryQuery.trim();
    setCreatingMemory(true);
    try {
      const response = await memoryService.createMemory({
        description: prompt,
        isVoiceInput: false,
      });
      navigation.navigate('SimilarDishesScreen', {
        memoryQuery: prompt,
        memoryId: response.data.memory?.id,
      });
      setMemoryQuery('');
    } catch (error) {
      console.error('Memory creation error:', error);
      try {
        const response = await recipeService.getSimilarRecipes({ q: prompt, limit: 6 });
        const recipes = response.data.recipes || [];
        navigation.navigate('SimilarDishesScreen', {
          memoryQuery: prompt,
          similarDishes: recipes,
        });
        setMemoryQuery('');
      } catch (searchError) {
        console.error('Memory search error:', searchError);
        Alert.alert('Error', 'Could not generate recipes right now.');
      }
    } finally {
      setCreatingMemory(false);
    }
  };

  const handleMemoryHistoryPress = (memory: MemoryHistory) => {
    // Navigate directly to recipe customization
    navigation.navigate('RecipeCustomization', {
      dishName: memory.dishName,
      dishId: memory.recipeId || memory.id,
      dishImage: memory.image,
    });
  };

  useFocusEffect(
    useCallback(() => {
      void loadMemoryHistory();
    }, [loadMemoryHistory])
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.pageIntro}>
        <Text style={styles.headerTitle}>Memory-Based Cooking</Text>
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
                // cspell:disable-next-line
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
              loading={creatingMemory}
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
            <Text style={styles.historySubtitle}>Your prompts and selected recipes</Text>
          </View>

          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
              <Text style={styles.loadingText}>Loading memories...</Text>
            </View>
          ) : memoryHistory.length > 0 ? (
            memoryHistory.map((memory) => (
              <TouchableOpacity
                key={memory.id}
                style={styles.historyCard}
                onPress={() => handleMemoryHistoryPress(memory)}
                activeOpacity={0.8}
              >
                <Image
                  source={buildRemoteImageSource(memory.image) || require('../../../assets/icon.png')}
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

                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => handleMemoryHistoryPress(memory)}
                >
                  <Text style={styles.historyButtonText}>Open</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No memories yet.</Text>
            </View>
          )}
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
  pageIntro: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.sm),
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(SPACING.sm),
  },
  loadingText: {
    marginLeft: moderateScale(SPACING.sm),
    color: COLORS.text.secondary,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default MemoryScreen;
