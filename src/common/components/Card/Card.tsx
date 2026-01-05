// src/common/components/Card/Card.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale } from '../../utils/responsive';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'small' | 'medium' | 'large';

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: ViewStyle;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  onPress,
  ...props
}) => {
  const cardStyles: ViewStyle[] = [
    styles.card,
    styles[`card_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`padding_${padding}` as keyof typeof styles] as ViewStyle,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.white,
  },
  
  // Variants
  card_default: {
    ...SHADOWS.small,
  },
  card_elevated: {
    ...SHADOWS.medium,
  },
  card_outlined: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  card_filled: {
    backgroundColor: COLORS.background.secondary,
  },
  
  // Padding
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: moderateScale(SPACING.sm),
  },
  padding_medium: {
    padding: moderateScale(SPACING.base),
  },
  padding_large: {
    padding: moderateScale(SPACING.lg),
  },
});

export default Card;