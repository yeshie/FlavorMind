// src/features/home/components/FeatureGrid/FeatureGrid.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../../common/utils/responsive';
import { FeatureItem } from '../../types/home.types';

interface FeatureGridProps {
  features: FeatureItem[];
  onFeaturePress: (feature: FeatureItem) => void;
}

const FeatureGrid: React.FC<FeatureGridProps> = ({ features, onFeaturePress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Access</Text>
      
      <View style={styles.grid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.card}
            onPress={() => onFeaturePress(feature)}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={feature.icon}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.label}>{feature.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(SPACING.md),
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.lg),
    alignItems: 'center',
    ...SHADOWS.small,
  },
  iconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: COLORS.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  icon: {
    width: moderateScale(28),
    height: moderateScale(28),
    tintColor: COLORS.primary.main,
  },
  label: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
});

export default FeatureGrid;