// src/constants/theme.ts - PASTEL ORANGE, GREEN & YELLOW THEME

export const COLORS = {
  primary: {
    main: '#FFB84D', // Pastel Orange
    light: '#FFCC80',
    dark: '#FFA726',
  },
  secondary: {
    main: '#81C784', // Pastel Green
    light: '#A5D6A7',
    dark: '#66BB6A',
    gradient: ['#81C784', '#66BB6A'],
  },
  accent: {
    main: '#FFF59D', // Pastel Yellow
    light: '#FFFDE7',
    dark: '#FFF176',
  },
  pastelGreen: {
    main: '#81C784',
    light: '#A5D6A7',
    dark: '#66BB6A',
  },
  pastelOrange: {
    main: '#FFB84D',
    light: '#FFCC80',
    dark: '#FFA726',
  },
  pastelYellow: {
    main: '#FFF59D',
    light: '#FFFDE7',
    dark: '#FFF176',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#FFF8F0', // Very light warm background
    tertiary: '#FFE0B2', // Light orange tint
    main: '#FFFFFF',
    card: '#FFFFFF',
    white: '#FFFFFF',
    header: '#FFE0B2', // Pastel Orange for header
    splash: '#FFB84D', // Pastel Orange for splash
  },
  text: {
    primary: '#4A4A4A',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    white: '#FFFFFF',
    disabled: '#BDBDBD',
    onOrange: '#FFFFFF',
  },
  status: {
    success: '#81C784', // Pastel Green
    warning: '#FFF59D', // Pastel Yellow
    error: '#EF9A9A', // Pastel Red
    info: '#90CAF9', // Pastel Blue
  },
  badge: {
    match: 'rgba(129, 199, 132, 0.9)', // Pastel Green
    highHarvest: 'rgba(129, 199, 132, 0.9)',
    lowPrice: 'rgba(144, 202, 249, 0.9)',
  },
  border: {
    light: '#FFE0B2',
    main: '#FFCC80',
    dark: '#FFB84D',
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
    shadowColor: '#FFB84D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#FFB84D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#FFB84D',
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