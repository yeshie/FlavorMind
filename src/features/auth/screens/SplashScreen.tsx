// src/features/auth/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo placeholder - Add your actual logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/icons/memory.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>FlavorMind</Text>
        <Text style={styles.tagline}>
          AI-Powered Culinary Assistant
        </Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.xl),
  },
  logo: {
    width: moderateScale(60),
    height: moderateScale(60),
    tintColor: COLORS.text.white,
  },
  appName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    marginBottom: moderateScale(SPACING.xs),
  },
  tagline: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: moderateScale(SPACING['3xl']),
  },
  loadingContainer: {
    width: moderateScale(200),
    height: moderateScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  loadingBar: {
    width: '30%',
    height: '100%',
    backgroundColor: COLORS.text.white,
    borderRadius: moderateScale(2),
  },
});

export default SplashScreen;