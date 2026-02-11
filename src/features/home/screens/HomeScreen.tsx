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
import seasonalService, { SeasonalFood } from '../../../services/api/seasonal.service';
import userService from '../../../services/api/user.service';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Guest');
  const [profileLocation, setProfileLocation] = useState<{ city?: string; country?: string } | undefined>(undefined);
  const [deviceLocation, setDeviceLocation] = useState<{ city?: string; country?: string } | undefined>(undefined);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [seasonalItems, setSeasonalItems] = useState<SeasonalItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const locationToShow = useMemo(
    () => profileLocation || deviceLocation,
    [profileLocation, deviceLocation]
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
      const seasonalParams = {
        limit: 10,
        ...(deviceCoords ? { lat: deviceCoords.lat, lng: deviceCoords.lng } : {}),
      };

      const [profileResult, seasonalResult, recipeResult] = await Promise.allSettled([
        userService.getProfile(),
        seasonalService.getSeasonalFoods(seasonalParams),
        recipeService.getRecipes({ limit: 5 }),
      ]);

      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value?.data?.user;
        if (profile) {
          const profileName =
            profile.displayName ||
            profile.name ||
            (profile.email ? profile.email.split('@')[0] : '') ||
            'Guest';
          setUserName(profileName);
          setProfileImageUrl(profile.photoUrl || profile.photoURL || null);
          if (profile.location) {
            setProfileLocation({
              city: profile.location.city,
              country: profile.location.country,
            });
          } else {
            setProfileLocation(undefined);
          }
        } else {
          setUserName('Guest');
          setProfileImageUrl(null);
          setProfileLocation(undefined);
        }
      } else {
        const localUser = await getCurrentUser();
        const localName =
          localUser?.displayName ||
          (localUser?.email ? localUser.email.split('@')[0] : '') ||
          'Guest';
        setUserName(localName);
        setProfileImageUrl(localUser?.photoURL || null);
        setProfileLocation(undefined);
      }

      if (seasonalResult.status === 'fulfilled') {
        const items = seasonalResult.value.data.items || [];
        setSeasonalItems(items.map(mapSeasonalItem));
      } else {
        setSeasonalItems([]);
      }

      if (recipeResult.status === 'fulfilled') {
        const recipes = recipeResult.value.data.recipes || [];
        setRecommendations(recipes.map(mapRecipeRecommendation));
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Home data load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCoords]);

  // Handlers
  const handleRefresh = async () => {
    await loadHomeData(true);
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'You have 3 new notifications');
  };

  const handleProfilePress = () => {
    // Navigate to Profile Settings
    navigation.navigate('ProfileSettings');
  };

  const handleMemoryGenerate = (query: string) => {
    Alert.alert('Generate Recipe', `Generating recipe for: ${query}`);
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
    Alert.alert(recipe.title, 'View recipe details');
  };

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

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
            setDeviceLocation({
              city: geo.city || geo.subregion || geo.region || undefined,
              country: geo.country || undefined,
            });
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
          onGenerate={handleMemoryGenerate}
          onVoicePress={handleVoicePress}
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
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Personalized recipe recommendations will appear here.
              </Text>
            </View>
          )
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
