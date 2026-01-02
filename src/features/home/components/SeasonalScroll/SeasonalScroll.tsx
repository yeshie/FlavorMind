// src/features/home/components/SeasonalScroll/SeasonalScroll.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../../common/utils/responsive';
import { SeasonalItem } from '../../types/home.types';

interface SeasonalScrollProps {
  items: SeasonalItem[];
  onItemPress: (item: SeasonalItem) => void;
}

const SeasonalScroll: React.FC<SeasonalScrollProps> = ({ items, onItemPress }) => {
  const getBadgeColor = (status: SeasonalItem['status']) => {
    switch (status) {
      case 'high-harvest':
        return COLORS.badge.highHarvest;
      case 'low-price':
        return COLORS.badge.lowPrice;
      case 'limited':
        return COLORS.status.warning;
      default:
        return COLORS.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image
            source={require('../../../../assets/icons/leaf.png')}
            style={styles.leafIcon}
            resizeMode="contain"
          />
          <Text style={styles.title}>Available This Season</Text>
        </View>
        <Text style={styles.subtitle}>Connected to DOA Sri Lanka</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.image }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={[styles.badge, { backgroundColor: getBadgeColor(item.status) }]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            </View>
            
            <Text style={styles.itemName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(SPACING.xl),
  },
  header: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.md),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  leafIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.primary.main,
    marginRight: moderateScale(SPACING.xs),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  scrollContent: {
    paddingLeft: moderateScale(SPACING.base),
    paddingRight: moderateScale(SPACING.base),
    gap: moderateScale(SPACING.md),
  },
  card: {
    width: moderateScale(130),
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: moderateScale(130),
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: moderateScale(SPACING.xs),
    right: moderateScale(SPACING.xs),
    paddingHorizontal: moderateScale(SPACING.xs),
    paddingVertical: moderateScale(4),
    borderRadius: BORDER_RADIUS.xs,
  },
  badgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.white,
  },
  itemName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    padding: moderateScale(SPACING.sm),
    textAlign: 'center',
  },
});

export default SeasonalScroll;