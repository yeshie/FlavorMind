import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import * as Location from 'expo-location';

// Components
import Header from '../components/Header/Header';
import MemoryCore from '../components/MemoryCore/MemoryCore';
import SeasonalScroll from '../components/SeasonalScroll/SeasonalScroll';
import FeatureGrid from '../components/FeatureGrid/FeatureGrid';
import RecommendationFeed from '../components/RecommendationFeed/RecommendationFeed';

// Types
import { SeasonalItem, FeatureItem, RecipeRecommendation } from '../types/home.types';
import { getCurrentUser } from '../../../services/firebase/authService';
import recipeService, { Recipe } from '../../../services/api/recipe.service';
import memoryService from '../../../services/api/memory.service';
import seasonalService, { SeasonalFood } from '../../../services/api/seasonal.service';
import userService, { UserProfile } from '../../../services/api/user.service';
import useRecommendations from '../hooks/useRecommendations';

interface HomeScreenProps {
  navigation: any;
}

type HomeLocation = {
  city?: string;
  country?: string;
};

const LAST_KNOWN_LOCATION_KEY = 'home_last_known_location';

const toNonEmptyString = (value?: string | null) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const resolveUserName = (user?: Partial<UserProfile> | null) => {
  const displayName = toNonEmptyString(user?.displayName);
  if (displayName) {
    return displayName;
  }

  const name = toNonEmptyString(user?.name);
  if (name) {
    return name;
  }

  const email = toNonEmptyString(user?.email);
  if (email) {
    return email.split('@')[0] || undefined;
  }

  return undefined;
};

const resolveProfileImage = (
  user?: Pick<UserProfile, 'photoUrl' | 'photoURL'> | null
) => toNonEmptyString(user?.photoUrl || user?.photoURL || undefined);

const normalizeLocation = (location?: HomeLocation | null) => {
  const city = toNonEmptyString(location?.city);
  const country = toNonEmptyString(location?.country);

  if (!city && !country) {
    return undefined;
  }

  return { city, country };
};

const readCachedLocation = async (): Promise<HomeLocation | undefined> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_KNOWN_LOCATION_KEY);
    if (!raw) {
      return undefined;
    }

    return normalizeLocation(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to read cached home location:', error);
    return undefined;
  }
};

const cacheLocation = async (location?: HomeLocation) => {
  const normalized = normalizeLocation(location);
  if (!normalized) {
    return;
  }

  try {
    await AsyncStorage.setItem(
      LAST_KNOWN_LOCATION_KEY,
      JSON.stringify(normalized)
    );
  } catch (error) {
    console.warn('Failed to cache home location:', error);
  }
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Guest');
  const [profileLocation, setProfileLocation] = useState<HomeLocation | undefined>(undefined);
  const [deviceLocation, setDeviceLocation] = useState<HomeLocation | undefined>(undefined);
  const [cachedLocation, setCachedLocation] = useState<HomeLocation | undefined>(undefined);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [seasonalItems, setSeasonalItems] = useState<SeasonalItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [hasRecommendationSignals, setHasRecommendationSignals] = useState(false);
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [memoryQuery, setMemoryQuery] = useState('');
  const [creatingMemory, setCreatingMemory] = useState(false);
  const { loadRecommendations } = useRecommendations();
  const locationToShow = useMemo(
    () => profileLocation || deviceLocation || cachedLocation,
    [profileLocation, deviceLocation, cachedLocation]
  );

  const features: FeatureItem[] = [
    {
      id: '1',
      title: 'Local Adaptation',
      icon: require('../../../assets/icons/swap.png'),
      route: 'LocalAdaptation',
    },
    {
      id: '2',
      title: 'Smart Scaling',
      icon: require('../../../assets/icons/ruler.png'),
      route: 'SmartScaling',
    },
    {
      id: '3',
      title: 'Digital Cookbook',
      icon: require('../../../assets/icons/book.png'),
      route: 'Cookbook',
    },
    {
      id: '4',
      title: 'Digital Committee',
      subtitle: 'Community recipes & curated cookbooks',
      icon: require('../../../assets/icons/community.png'),
      route: 'DigitalCommittee',
    },
  ];

  const mapSeasonalItem = (item: SeasonalFood): SeasonalItem => {
    const status = (item.status || 'high-harvest') as SeasonalItem['status'];
    const badge = item.badge
      || (status === 'high-harvest' ? 'High Harvest' : status === 'low-price' ? 'Low Price' : 'Limited');

    return {
      id: item.id,
      name: item.name,
      image: item.imageUrl || item.image,
      status,
      badge,
    };
  };

  const mapRecipeRecommendation = (recipe: Recipe, index: number): RecipeRecommendation => {
    const matchScore = recipe.matchScore ?? Math.max(75, 95 - index * 5);
    const prepTime = recipe.prepTime || recipe.cookTime || 0;
    const difficulty = recipe.difficulty || 'medium';
    const isLocal = recipe.isLocalIngredients ?? recipe.isLocal ?? false;
    const tags = recipe.ingredients
      ? recipe.ingredients.map((ingredient) => ingredient.name).slice(0, 3)
      : [];

    return {
      id: recipe.id,
      title: recipe.title,
      image: recipe.imageUrl || recipe.image,
      matchScore,
      prepTime,
      difficulty,
      isLocalIngredients: isLocal,
      tags,
    };
  };

  const loadHomeData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const localUser = await getCurrentUser();
      const localName = resolveUserName(localUser);
      const localPhoto = resolveProfileImage(localUser);

      if (localName) {
        setUserName(localName);
      }
      if (localPhoto) {
        setProfileImageUrl(localPhoto);
      }

      const seasonalParams = {
        limit: 10,
        ...(deviceCoords ? { lat: deviceCoords.lat, lng: deviceCoords.lng } : {}),
      };

      const [profileResult, seasonalResult] = await Promise.allSettled([
        userService.getProfile(),
        seasonalService.getSeasonalFoods(seasonalParams),
      ]);

      const profile =
        profileResult.status === 'fulfilled'
          ? profileResult.value?.data?.user
          : null;

      if (profileResult.status === 'fulfilled') {
        if (profile) {
          const profileName = resolveUserName(profile);
          setUserName(profileName || localName || 'Guest');
          setProfileImageUrl(resolveProfileImage(profile) || localPhoto || null);

          const nextProfileLocation = normalizeLocation(profile.location);
          setProfileLocation(nextProfileLocation);
          if (nextProfileLocation) {
            setCachedLocation(nextProfileLocation);
            void cacheLocation(nextProfileLocation);
          }
        } else {
          setUserName(localName || 'Guest');
          setProfileImageUrl(localPhoto || null);
        }
      } else {
        setUserName(localName || 'Guest');
        setProfileImageUrl(localPhoto || null);
      }

      if (seasonalResult.status === 'fulfilled') {
        const items = seasonalResult.value.data.items || [];
        setSeasonalItems(items.map(mapSeasonalItem));
      } else {
        setSeasonalItems([]);
      }

      const recommendationResult = await loadRecommendations(profile);
      setHasRecommendationSignals(recommendationResult.hasSignals);
      setRecommendations(recommendationResult.recipes.map(mapRecipeRecommendation));
    } catch (error) {
      console.error('Home data load error:', error);
      setRecommendations([]);
      setHasRecommendationSignals(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCoords, loadRecommendations]);

  // Handlers
  const handleRefresh = async () => {
    await loadHomeData(true);
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  const handleProfilePress = () => {
    // Navigate to Profile Settings
    navigation.navigate('ProfileSettings');
  };

  const handleMemoryGenerate = async (query: string) => {
    if (!query.trim()) {
      Alert.alert('Memory Required', 'Please describe your food memory first');
      return;
    }

    setCreatingMemory(true);
    try {
      const prompt = query.trim();
      const memoryResponse = await memoryService.createMemory({
        description: prompt,
        isVoiceInput: false,
      });
      navigation.navigate('SimilarDishesScreen', {
        memoryQuery: prompt,
        memoryId: memoryResponse.data.memory?.id,
      });
      setMemoryQuery('');
    } catch (error) {
      console.error('Create memory error:', error);
      try {
        const prompt = query.trim();
        const similarResponse = await recipeService.getSimilarRecipes({
          q: prompt,
          limit: 6,
        });
        const recipes = similarResponse.data.recipes || [];
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

  const handleVoicePress = () => {
    Alert.alert('Voice Input', 'Voice recognition activated');
  };

  const handleSeasonalItemPress = (item: SeasonalItem) => {
    navigation.navigate('SeasonalFood', { food: item });
  };

  const handleFeaturePress = (feature: FeatureItem) => {
    if (feature.route === 'LocalAdaptation') {
      navigation.navigate('LocalAdaptation');
    } else if (feature.route === 'SmartScaling') {
      navigation.navigate('SmartScaling');
    } else if (feature.route === 'Cookbook') {
      navigation.navigate('DigitalCookbook');
    } else if (feature.route === 'DigitalCommittee') {
      navigation.navigate('DigitalCommittee');
    } else {
      Alert.alert(feature.title, `Navigate to ${feature.route}`);
    }
  };

  const handleRecipePress = (recipe: RecipeRecommendation) => {
    navigation.navigate('RecipeDescription', {
      recipeId: recipe.id,
      recipe,
    });
  };

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData])
  );

  useEffect(() => {
    let isMounted = true;

    const seedCachedHeaderState = async () => {
      try {
        const [localUser, storedLocation] = await Promise.all([
          getCurrentUser(),
          readCachedLocation(),
        ]);

        if (!isMounted) {
          return;
        }

        const localName = resolveUserName(localUser);
        const localPhoto = resolveProfileImage(localUser);

        if (localName) {
          setUserName(localName);
        }
        if (localPhoto) {
          setProfileImageUrl(localPhoto);
        }
        if (storedLocation) {
          setCachedLocation(storedLocation);
        }
      } catch (error) {
        console.warn('Failed to seed home header state:', error);
      }
    };

    void seedCachedHeaderState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDeviceLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted && position?.coords) {
          setDeviceCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          if (geo) {
            const nextDeviceLocation = normalizeLocation({
              city: geo.city || geo.subregion || geo.region || undefined,
              country: geo.country || undefined,
            });
            if (nextDeviceLocation) {
              setDeviceLocation(nextDeviceLocation);
              setCachedLocation(nextDeviceLocation);
              void cacheLocation(nextDeviceLocation);
            }
          }
        }
      } catch (error) {
        console.warn('Location fetch failed:', error);
      }
    };

    loadDeviceLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header
        userName={userName}
        location={locationToShow}
        profileImageUrl={profileImageUrl}
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.pastelOrange.main}
          />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
            <Text style={styles.loadingText}>Loading your feed...</Text>
          </View>
        )}
        <MemoryCore
          value={memoryQuery}
          onChangeText={setMemoryQuery}
          onGenerate={handleMemoryGenerate}
          onVoicePress={handleVoicePress}
          loading={creatingMemory}
        />

        {seasonalItems.length > 0 ? (
          <SeasonalScroll
            items={seasonalItems}
            onItemPress={handleSeasonalItemPress}
          />
        ) : (
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Seasonal ingredients will appear here once available.
              </Text>
            </View>
          )
        )}

        <FeatureGrid
          features={features}
          onFeaturePress={handleFeaturePress}
        />

        {recommendations.length > 0 ? (
          <RecommendationFeed
            recommendations={recommendations}
            onRecipePress={handleRecipePress}
          />
        ) : (
          !loading && hasRecommendationSignals && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                We could not find strong matches yet. Keep searching, saving, or cooking to sharpen your suggestions.
              </Text>
            </View>
          )
        )}

        {!loading && !hasRecommendationSignals && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Personalized recipes will appear after you search, save, or cook a few dishes.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.header,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background.main,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 10,
    color: COLORS.text.secondary,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyStateText: {
    color: COLORS.text.secondary,
  },
});

export default HomeScreen;
