// src/features/home/components/Header/Header.tsx - PASTEL ORANGE
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../../common/utils/responsive';
import { UserLocation } from '../../types/home.types';

interface HeaderProps {
  userName?: string;
  location?: UserLocation;
  profileImageUrl?: string | null;
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  location,
  profileImageUrl,
  onNotificationPress,
  onProfilePress,
}) => {
  const safeUserName = userName && userName.trim().length > 0 ? userName : 'Guest';
  const locationText = [location?.city, location?.country].filter(Boolean).join(', ');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      {/* Logo and Branding Section */}
      <View style={styles.brandSection}>
        <Image
          source={require('../../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.brandText}>
          <Text style={styles.appName}>FlavorMind</Text>
          <Text style={styles.tagline}>AI Culinary Assistant</Text>
        </View>
      </View>

      {/* User Info and Actions */}
      <View style={styles.userSection}>
        <View style={styles.leftSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {safeUserName}
          </Text>
          <View style={styles.locationContainer}>
            <Image
              source={require('../../../../assets/icons/location.png')}
              style={styles.locationIcon}
              resizeMode="contain"
            />
            <Text style={styles.locationText}>
              {locationText || 'Location unavailable'}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../../assets/icons/bell.png')}
              style={styles.icon}
              resizeMode="contain"
            />
            <View style={styles.badge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Image
              source={
                profileImageUrl
                  ? { uri: profileImageUrl }
                  : require('../../../../assets/icons/user.png')
              }
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
    paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0) + moderateScale(8),
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
  
  // Logo Section
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
    paddingTop: moderateScale(SPACING.xs),
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
  
  // User Section
  userSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  greeting: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    tintColor: COLORS.pastelOrange.dark,
    marginRight: moderateScale(4),
  },
  locationText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  
  // Right Section (Actions)
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
