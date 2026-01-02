// src/features/home/components/Header/Header.tsx
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
import { COLORS, TYPOGRAPHY, SPACING, LAYOUT } from '../../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../../common/utils/responsive';
import { UserLocation } from '../../types/home.types';

interface HeaderProps {
  userName: string;
  location: UserLocation;
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  location,
  onNotificationPress,
  onProfilePress,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.greeting}>
          {getGreeting()}, {userName}
        </Text>
        <View style={styles.locationContainer}>
          <Image
            source={require('../../../../assets/icons/location.png')}
            style={styles.locationIcon}
            resizeMode="contain"
          />
          <Text style={styles.locationText}>
            {location.city}, {location.country}
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
            source={require('../../../../assets/icons/user.png')}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? moderateScale(50) : StatusBar.currentHeight || moderateScale(30),
    paddingBottom: moderateScale(SPACING.base),
    paddingHorizontal: moderateScale(LAYOUT.containerPadding),
    backgroundColor: COLORS.background.main,
  },
  leftSection: {
    flex: 1,
  },
  greeting: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
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
    tintColor: COLORS.text.secondary,
    marginRight: moderateScale(4),
  },
  locationText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.md),
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: COLORS.text.primary,
  },
  badge: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.status.error,
  },
  profileButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary.main,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});

export default Header;