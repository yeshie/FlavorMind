import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../utils/responsive';

interface HeaderProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onNotificationPress,
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets();
  const handleNotificationPress = onNotificationPress || (() => {});
  const handleProfilePress = onProfilePress || (() => {});

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <View style={styles.brandSection}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={styles.appName}>FlavorMind</Text>
            <Text style={styles.tagline}>AI Culinary Assistant</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../assets/icons/bell.png')}
              style={styles.icon}
              resizeMode="contain"
            />
            <View style={styles.badge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../assets/icons/user.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.header, // Pastel Orange
    paddingBottom: moderateScale(SPACING.md),
    paddingHorizontal: moderateScale(SPACING.base),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    shadowColor: COLORS.pastelOrange.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: moderateScale(SPACING.xs),
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(SPACING.sm),
  },
  brandText: {
    flex: 1,
  },
  appName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.pastelOrange.dark,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginTop: moderateScale(2),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.sm),
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: COLORS.pastelOrange.dark,
  },
  badge: {
    position: 'absolute',
    top: moderateScale(6),
    right: moderateScale(6),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.status.error,
    borderWidth: 1.5,
    borderColor: COLORS.background.white,
  },
  profileButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: COLORS.pastelOrange.dark,
    backgroundColor: COLORS.background.white,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});

export default Header;
