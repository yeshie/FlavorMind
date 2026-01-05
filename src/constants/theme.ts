// src/constants/theme.ts - COMPLETE FIXED VERSION

export const COLORS = {
  primary: {
    main: '#FF6B6B',
    light: '#FF8E8E',
    dark: '#E55555',
  },
  secondary: {
    main: '#4ECDC4',
    light: '#7ED9D2',
    dark: '#3BA39C',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  // FIXED: Added missing pastelGreen
  pastelGreen: {
    main: '#81C784',
    light: '#A5D6A7',
    dark: '#66BB6A',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
    main: '#FFFFFF',
    card: '#FFFFFF',
    white: '#FFFFFF',
    // FIXED: Added missing header background
    header: '#E8F5E9', // Light green for header
  },
  text: {
    primary: '#212529',
    secondary: '#6C757D',
    tertiary: '#ADB5BD',
    white: '#FFFFFF',
    disabled: '#ADB5BD',
  },
  status: {
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
  },
  badge: {
    match: 'rgba(76, 175, 80, 0.9)',
    highHarvest: 'rgba(76, 175, 80, 0.9)',
    lowPrice: 'rgba(33, 150, 243, 0.9)',
  },
  border: {
    light: '#DEE2E6',
    main: '#CED4DA',
    dark: '#ADB5BD',
  },
};

export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const LAYOUT = {
  containerPadding: 16,
  bottomTabHeight: 60,
};