// src/common/components/Button/button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../utils/responsive';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends TouchableOpacityProps {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: ImageSourcePropType;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onPress,
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles: (ViewStyle | undefined)[] = [
    styles.button,
    styles[`button_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`button_${size}` as keyof typeof styles] as ViewStyle,
    fullWidth ? styles.fullWidth : undefined,
    isDisabled ? styles.disabled : undefined,
    style,
  ];

  const textStyles: (TextStyle | false | undefined)[] = [
    styles.text,
    styles[`text_${variant}` as keyof typeof styles] as TextStyle,
    styles[`text_${size}` as keyof typeof styles] as TextStyle,
    isDisabled ? styles.textDisabled : false,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.text.white : COLORS.primary.main}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Image
              source={icon}
              style={[styles.icon, { width: iconSize, height: iconSize, marginRight: SPACING.xs }]}
              resizeMode="contain"
            />
          )}
          <Text style={textStyles}>{children}</Text>
          {icon && iconPosition === 'right' && (
            <Image
              source={icon}
              style={[styles.icon, { width: iconSize, height: iconSize, marginLeft: SPACING.xs }]}
              resizeMode="contain"
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  
  // Variants
  button_primary: {
    backgroundColor: COLORS.primary.main,
  },
  button_secondary: {
    backgroundColor: COLORS.secondary.main,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary.main,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_text: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Sizes
  button_small: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },
  button_medium: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
  },
  button_large: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(32),
  },
  
  fullWidth: {
    width: '100%',
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  // Text
  text: {
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  text_primary: {
    color: COLORS.text.white,
  },
  text_secondary: {
    color: COLORS.text.white,
  },
  text_outline: {
    color: COLORS.primary.main,
  },
  text_ghost: {
    color: COLORS.primary.main,
  },
  text_text: {
    color: COLORS.primary.main,
  },
  
  text_small: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  text_medium: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
  },
  text_large: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
  },
  
  textDisabled: {
    opacity: 1,
  },
  
  icon: {
    tintColor: COLORS.text.white,
  },
});

export default Button;