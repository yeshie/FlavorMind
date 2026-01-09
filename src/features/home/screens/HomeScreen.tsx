import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';

// Components
import Header from '../components/Header/Header';
import MemoryCore from '../components/MemoryCore/MemoryCore';
import SeasonalScroll from '../components/SeasonalScroll/SeasonalScroll';
import FeatureGrid from '../components/FeatureGrid/FeatureGrid';
import RecommendationFeed from '../components/RecommendationFeed/RecommendationFeed';

// Types
import { SeasonalItem, FeatureItem, RecipeRecommendation } from '../types/home.types';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Mock Data - Replace with API calls
  const userData = {
    name: 'Sachini',
    location: {
      city: 'Colombo',
      country: 'Sri Lanka',
    },
  };

  const seasonalItems: SeasonalItem[] = [
    {
      id: '1',
      name: 'Rambutan',
      image: 'https://images.unsplash.com/photo-1580990758000-33f5b22e5da6?w=400',
      status: 'high-harvest',
      badge: 'High Harvest',
    },
    {
      id: '2',
      name: 'Mango',
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
      status: 'low-price',
      badge: 'Low Price',
    },
    {
      id: '3',
      name: 'Pumpkin',
      image: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400',
      status: 'high-harvest',
      badge: 'High Harvest',
    },
    {
      id: '4',
      name: 'Tomato',
      image: 'https://images.unsplash.com/photo-1546470427-227a1e3b0080?w=400',
      status: 'limited',
      badge: 'Limited',
    },
  ];

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

  const recommendations: RecipeRecommendation[] = [
    {
      id: '1',
      title: 'Local Herb Infused Grilled Chicken',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800',
      matchScore: 98,
      prepTime: 25,
      difficulty: 'easy',
      isLocalIngredients: true,
      tags: ['chicken', 'grilled', 'herbs'],
    },
    {
      id: '2',
      title: 'Creamy Pumpkin Curry with Coconut',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
      matchScore: 95,
      prepTime: 35,
      difficulty: 'medium',
      isLocalIngredients: true,
      tags: ['curry', 'pumpkin', 'coconut'],
    },
    {
      id: '3',
      title: 'Sri Lankan Style Fish Ambul Thiyal',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      matchScore: 92,
      prepTime: 45,
      difficulty: 'medium',
      isLocalIngredients: true,
      tags: ['fish', 'sour', 'traditional'],
    },
  ];

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header
        userName={userData.name}
        location={userData.location}
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
        <MemoryCore
          onGenerate={handleMemoryGenerate}
          onVoicePress={handleVoicePress}
        />

        <SeasonalScroll
          items={seasonalItems}
          onItemPress={handleSeasonalItemPress}
        />

        <FeatureGrid
          features={features}
          onFeaturePress={handleFeaturePress}
        />

        <RecommendationFeed
          recommendations={recommendations}
          onRecipePress={handleRecipePress}
        />
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
});

export default HomeScreen;