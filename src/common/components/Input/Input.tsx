// src/common/components/Input/Input.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../utils/responsive';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ImageSourcePropType;
  rightIcon?: ImageSourcePropType;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Image source={leftIcon} style={styles.leftIcon} resizeMode="contain" />
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon ? { marginLeft: moderateScale(SPACING.sm) } : undefined,
            style,
          ]}
          placeholderTextColor={COLORS.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
          >
            <Image source={rightIcon} style={styles.rightIcon} resizeMode="contain" />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(SPACING.base),
  },
  label: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    paddingHorizontal: moderateScale(SPACING.md),
  },
  inputContainerFocused: {
    borderColor: COLORS.primary.main,
    borderWidth: 1.5,
  },
  inputContainerError: {
    borderColor: COLORS.status.error,
  },
  input: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    paddingVertical: moderateScale(SPACING.md),
  },
  leftIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.text.secondary,
  },
  rightIconContainer: {
    padding: moderateScale(SPACING.xs),
  },
  rightIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.text.secondary,
  },
  errorText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.status.error,
    marginTop: moderateScale(SPACING.xs),
  },
});

export default Input;