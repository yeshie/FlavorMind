import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Scales size based on screen width
 */
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Scales size based on screen height
 */
export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Moderate scale - balances between width and height scaling
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scaleWidth(size) - size) * factor;
};

/**
 * Scale font size based on screen dimensions
 */
export const scaleFontSize = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Get responsive dimension
 */
export const responsive = {
  width: (percentage: number): number => {
    return (SCREEN_WIDTH * percentage) / 100;
  },
  height: (percentage: number): number => {
    return (SCREEN_HEIGHT * percentage) / 100;
  },
};

/**
 * Check if device is small (width < 375)
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

/**
 * Get device breakpoint
 */
export const getBreakpoint = (): 'small' | 'medium' | 'large' | 'xlarge' => {
  if (SCREEN_WIDTH < 375) return 'small';
  if (SCREEN_WIDTH < 768) return 'medium';
  if (SCREEN_WIDTH < 1024) return 'large';
  return 'xlarge';
};

/**
 * Responsive grid columns
 */
export const getGridColumns = (): number => {
  if (SCREEN_WIDTH < 375) return 1;
  if (SCREEN_WIDTH < 768) return 2;
  if (SCREEN_WIDTH < 1024) return 3;
  return 4;
};

export const DIMENSIONS = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isSmall: isSmallDevice(),
  isTablet: isTablet(),
  breakpoint: getBreakpoint(),
};

export default {
  scaleWidth,
  scaleHeight,
  moderateScale,
  scaleFontSize,
  responsive,
  isSmallDevice,
  isTablet,
  getBreakpoint,
  getGridColumns,
  DIMENSIONS,
};