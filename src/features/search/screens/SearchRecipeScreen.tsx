import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';

interface SearchRecipeScreenProps {
  navigation: any;
}

const STORAGE_KEY = 'search_history';

const SearchRecipeScreen: React.FC<SearchRecipeScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load search history', error);
      }
    };

    loadHistory();
  }, []);

  const persistHistory = async (nextHistory: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
    } catch (error) {
      console.warn('Failed to save search history', error);
    }
  };

  const handleSubmit = async (term?: string) => {
    const finalTerm = (term ?? query).trim();
    if (!finalTerm) {
      return;
    }

    const updated = [
      finalTerm,
      ...history.filter(
        (item) => item.toLowerCase() !== finalTerm.toLowerCase()
      ),
    ];
    setHistory(updated);
    await persistHistory(updated);
    setQuery(finalTerm);
    Keyboard.dismiss();

    navigation.navigate('RecipeDescription', {
      recipe: {
        id: finalTerm.toLowerCase().replace(/\s+/g, '-'),
        title: finalTerm,
        creator: 'FlavorMind',
        creatorAvatar: 'https://i.pravatar.cc/150?img=12',
        image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
        description: `Search result inspired by "${finalTerm}".`,
        rating: 4.8,
        comments: 128,
        category: 'Search',
      },
    });
  };

  const handleRemoveHistory = async (term: string) => {
    const nextHistory = history.filter((item) => item !== term);
    setHistory(nextHistory);
    await persistHistory(nextHistory);
  };

  const handleClearAll = async () => {
    setHistory([]);
    await persistHistory([]);
  };

  const emptyState = useMemo(() => history.length === 0, [history.length]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TouchableOpacity onPress={() => handleSubmit()} activeOpacity={0.7}>
              <Image
                source={require('../../../assets/icons/search.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor={COLORS.text.tertiary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => handleSubmit()}
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setQuery('')}
                activeOpacity={0.7}
              >
                <Text style={styles.clearText}>x</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            {!emptyState && (
              <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {emptyState ? (
            <Text style={styles.emptyText}>No recent searches yet</Text>
          ) : (
            history.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.historyItem}
                onPress={() => handleSubmit(term)}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../../assets/icons/clock.png')}
                  style={styles.historyIcon}
                  resizeMode="contain"
                />
                <Text style={styles.historyText} numberOfLines={1}>
                  {term}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveHistory(term)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeText}>x</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
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
  clearButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  historySection: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  historyTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  clearAllText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  emptyText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: moderateScale(SPACING.sm),
    paddingHorizontal: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  historyIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: COLORS.text.secondary,
    marginRight: moderateScale(SPACING.sm),
  },
  historyText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
  },
  removeButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default SearchRecipeScreen;
