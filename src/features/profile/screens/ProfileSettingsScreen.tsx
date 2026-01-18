// src/features/profile/screens/ProfileSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Input from '../../../common/components/Input/Input';
import Button from '../../../common/components/Button/button';
import { getCurrentUser, logout } from '../../../services/firebase/authService';

interface ProfileSettingsScreenProps {
  navigation: any;
}

const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = await getCurrentUser();
    setUser(userData);
  };

  const handleChangeEmail = () => {
    navigation.navigate('ChangeEmail');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await logout();
            setLoading(false);
            // Navigation will be handled by RootNavigator
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete Account', 'Feature coming soon');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../../assets/icons/user.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Text style={styles.editAvatarText}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user?.displayName || user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          
          <Button
            variant="outline"
            size="small"
            onPress={handleEditProfile}
            style={styles.editProfileButton}
          >
            Edit Profile
          </Button>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleChangeEmail}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>📧</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Email</Text>
              <Text style={styles.settingDescription}>Update your email address</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🔒</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your password</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleForgotPassword}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🔑</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Forgot Password</Text>
              <Text style={styles.settingDescription}>Reset your password via email</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Notifications', 'Feature coming soon')}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🔔</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Manage notification settings</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Language', 'Feature coming soon')}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🌐</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDescription}>English</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Help & Support', 'Feature coming soon')}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>❓</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingDescription}>Get help and contact us</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Terms & Privacy', 'Feature coming soon')}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>📄</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Terms & Privacy</Text>
              <Text style={styles.settingDescription}>Read our terms and privacy policy</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('FlavorMind', 'Version 1.0.0\n\nAI-Powered Culinary Assistant')}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>ℹ️</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>

          <Button
            variant="outline"
            size="medium"
            fullWidth
            onPress={handleLogout}
            loading={loading}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          >
            Logout
          </Button>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    backgroundColor: COLORS.background.header,
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    ...SHADOWS.small,
  },
  backButton: {
    padding: moderateScale(SPACING.xs),
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  placeholder: {
    width: moderateScale(40),
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.xl),
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: moderateScale(SPACING.md),
  },
  avatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 3,
    borderColor: COLORS.pastelOrange.main,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.pastelOrange.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.white,
  },
  editAvatarText: {
    fontSize: scaleFontSize(14),
  },
  userName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  userEmail: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.lg),
  },
  editProfileButton: {
    borderColor: COLORS.pastelOrange.main,
  },
  section: {
    marginTop: moderateScale(SPACING.xl),
    paddingHorizontal: moderateScale(SPACING.base),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.md),
  },
  dangerTitle: {
    color: COLORS.status.error,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.base),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  settingIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  settingIcon: {
    fontSize: scaleFontSize(20),
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(2),
  },
  settingDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
  },
  settingArrow: {
    fontSize: scaleFontSize(24),
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  logoutButton: {
    borderColor: COLORS.pastelOrange.main,
    marginBottom: moderateScale(SPACING.md),
  },
  logoutButtonText: {
    color: COLORS.pastelOrange.dark,
  },
  deleteButton: {
    padding: moderateScale(SPACING.md),
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.status.error,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default ProfileSettingsScreen;
