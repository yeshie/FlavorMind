import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../../constants/theme';
import {
  moderateScale,
  scaleFontSize,
} from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import Input from '../../../common/components/Input/Input';
import {
  getCurrentUser,
  updateCurrentUserProfile,
} from '../../../services/firebase/authService';

const userIcon = require('../../../assets/icons/user.png');

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const displayPhoto = useMemo(() => {
    if (removePhoto) {
      return null;
    }

    return selectedPhotoUri || originalPhotoUrl;
  }, [originalPhotoUrl, removePhoto, selectedPhotoUri]);

  const hasChanges = useMemo(() => {
    const trimmedName = displayName.trim();
    return (
      trimmedName !== originalDisplayName.trim()
      || Boolean(selectedPhotoUri)
      || (removePhoto && Boolean(originalPhotoUrl))
    );
  }, [displayName, originalDisplayName, originalPhotoUrl, removePhoto, selectedPhotoUri]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        setDisplayName(user?.displayName || '');
        setOriginalDisplayName(user?.displayName || '');
        setEmail(user?.email || '');
        setOriginalPhotoUrl(user?.photoURL || null);
      } catch (error) {
        console.error('Edit profile load error:', error);
        Alert.alert('Error', 'Could not load your profile right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const requestPhotoFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedPhotoUri(result.assets[0].uri);
      setRemovePhoto(false);
    }
  };

  const requestPhotoFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedPhotoUri(result.assets[0].uri);
      setRemovePhoto(false);
    }
  };

  const handlePhotoActions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose how you want to update your photo.',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            void requestPhotoFromCamera();
          },
        },
        {
          text: 'Choose From Gallery',
          onPress: () => {
            void requestPhotoFromLibrary();
          },
        },
        ...(displayPhoto
          ? [{
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: () => {
                setSelectedPhotoUri(null);
                setRemovePhoto(true);
              },
            }]
          : []),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleBack = () => {
    if (!hasChanges || saving) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Discard Changes?',
      'Your profile changes have not been saved yet.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      const response = await updateCurrentUserProfile({
        displayName: displayName.trim(),
        photoUri: selectedPhotoUri,
        removePhoto,
      });

      if (!response.success) {
        Alert.alert('Update Failed', response.message || 'Could not update your profile.');
        return;
      }

      setOriginalDisplayName(displayName.trim());
      setOriginalPhotoUrl(response.data?.user.photoURL || null);
      setSelectedPhotoUri(null);
      setRemovePhoto(false);

      Alert.alert('Profile Updated', 'Your name and profile picture have been saved.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Update Failed', 'Could not update your profile right now.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.pastelOrange.main} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.pageIntro}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.75}
          >
            <ArrowLeft size={scaleFontSize(18)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>
            Update the name and photo people see across FlavorMind.
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.avatarShell}>
              {displayPhoto ? (
                <Image
                  source={{ uri: displayPhoto }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserRound
                    size={scaleFontSize(46)}
                    color={COLORS.text.tertiary}
                    strokeWidth={1.8}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.avatarAction}
                onPress={handlePhotoActions}
                activeOpacity={0.8}
              >
                <Camera size={scaleFontSize(18)} color={COLORS.text.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName}>{displayName.trim() || 'Your Name'}</Text>
            <Text style={styles.heroEmail}>{email || 'No email available'}</Text>

            <View style={styles.avatarActionsRow}>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handlePhotoActions}
                activeOpacity={0.8}
              >
                <ImagePlus size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
                <Text style={styles.secondaryActionText}>Change Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryAction, !displayPhoto && styles.secondaryActionDisabled]}
                onPress={() => {
                  if (!displayPhoto) {
                    return;
                  }
                  setSelectedPhotoUri(null);
                  setRemovePhoto(true);
                }}
                activeOpacity={0.8}
                disabled={!displayPhoto}
              >
                <Trash2 size={scaleFontSize(16)} color={COLORS.status.error} strokeWidth={2} />
                <Text style={styles.removeActionText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formCard}>
            <Input
              label="Display Name"
              placeholder="Enter your name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              editable={!saving}
            />

            <Input
              label="Email"
              value={email}
              editable={false}
              containerStyle={styles.emailField}
            />

            <Text style={styles.helperText}>
              Your email is read-only here. Use Change Email in settings if you need to update it.
            </Text>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>What changes now</Text>
            <Text style={styles.noteText}>
              Your new name and profile picture will be used for your account and future activity in the app.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="outline"
            size="large"
            fullWidth
            onPress={handleBack}
            disabled={saving}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: moderateScale(SPACING.md),
    color: COLORS.text.secondary,
  },
  pageIntro: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING.sm),
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.md),
  },
  backButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  headerTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(SPACING.xs),
  },
  headerSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarShell: {
    position: 'relative',
    marginBottom: moderateScale(SPACING.lg),
  },
  avatarImage: {
    width: moderateScale(124),
    height: moderateScale(124),
    borderRadius: moderateScale(62),
    borderWidth: 4,
    borderColor: COLORS.pastelOrange.main,
  },
  avatarPlaceholder: {
    width: moderateScale(124),
    height: moderateScale(124),
    borderRadius: moderateScale(62),
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.border.light,
  },
  avatarAction: {
    position: 'absolute',
    right: moderateScale(4),
    bottom: moderateScale(4),
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: COLORS.pastelOrange.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background.white,
    ...SHADOWS.medium,
  },
  heroName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  heroEmail: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.lg),
  },
  avatarActionsRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  secondaryActionDisabled: {
    opacity: 0.45,
  },
  secondaryActionText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  removeActionText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.status.error,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  formCard: {
    backgroundColor: COLORS.background.white,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    ...SHADOWS.small,
  },
  emailField: {
    marginBottom: 0,
  },
  helperText: {
    marginTop: moderateScale(SPACING.sm),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.xs),
  },
  noteCard: {
    backgroundColor: COLORS.pastelYellow.light,
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.lg),
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.lg),
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
  },
  noteTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(SPACING.xs),
  },
  noteText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  footer: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: moderateScale(SPACING.sm),
    ...SHADOWS.medium,
  },
  cancelButton: {
    borderColor: COLORS.pastelOrange.main,
  },
  cancelButtonText: {
    color: COLORS.pastelOrange.dark,
  },
  bottomSpacer: {
    height: moderateScale(SPACING['4xl']),
  },
});

export default EditProfileScreen;
