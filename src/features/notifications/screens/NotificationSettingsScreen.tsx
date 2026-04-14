import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Check,
  MessageSquare,
  Sparkles,
  Volume2,
} from 'lucide-react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Button from '../../../common/components/Button/button';
import notificationStore, {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationFrequency,
  type NotificationSettings,
} from '../../../services/firebase/notificationStore';

const FREQUENCY_OPTIONS: NotificationFrequency[] = ['instant', 'daily', 'weekly'];

const NotificationSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const nextSettings = await notificationStore.getCurrentUserNotificationSettings();
        if (isMounted) {
          setSettings(nextSettings);
        }
      } catch (error) {
        console.error('Notification settings load error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const preferenceItems = useMemo(
    () => [
      {
        id: 'push',
        label: 'Push Notifications',
        description: 'Reserve space for device push support.',
        enabled: settings.types.push,
        icon: Bell,
        onToggle: (value: boolean) =>
          setSettings((current) => ({
            ...current,
            types: { ...current.types, push: value },
          })),
      },
      {
        id: 'comments',
        label: 'Comments',
        description: 'Notify when another user comments on your recipe.',
        enabled: settings.types.comments,
        icon: MessageSquare,
        onToggle: (value: boolean) =>
          setSettings((current) => ({
            ...current,
            types: { ...current.types, comments: value },
          })),
      },
      {
        id: 'approvals',
        label: 'Recipe Approval',
        description: 'Notify when your pending recipe gets approved.',
        enabled: settings.types.approvals,
        icon: Check,
        onToggle: (value: boolean) =>
          setSettings((current) => ({
            ...current,
            types: { ...current.types, approvals: value },
          })),
      },
      {
        id: 'recommendations',
        label: 'New Recipes for You',
        description: 'Notify about newly approved recipes that match your preferences.',
        enabled: settings.types.recommendations,
        icon: Sparkles,
        onToggle: (value: boolean) =>
          setSettings((current) => ({
            ...current,
            types: { ...current.types, recommendations: value },
          })),
      },
      {
        id: 'sound',
        label: 'Notification Sound',
        description: 'Play a sound when a new notification arrives.',
        enabled: settings.types.sound,
        icon: Volume2,
        onToggle: (value: boolean) =>
          setSettings((current) => ({
            ...current,
            types: { ...current.types, sound: value },
          })),
      },
    ],
    [settings]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationStore.saveCurrentUserNotificationSettings(settings);
      Alert.alert('Saved', 'Your notification preferences have been updated.');
      navigation.goBack();
    } catch (error) {
      console.error('Notification settings save error:', error);
      Alert.alert('Error', 'Could not save notification settings right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={scaleFontSize(20)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
          <Text style={styles.loadingText}>Loading your settings...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Frequency</Text>
            <Text style={styles.sectionDescription}>
              Control how often recipe recommendation notifications are refreshed.
            </Text>

            <View style={styles.frequencyRow}>
              {FREQUENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.frequencyCard,
                    settings.frequency === option && styles.frequencyCardActive,
                  ]}
                  onPress={() =>
                    setSettings((current) => ({
                      ...current,
                      frequency: option,
                    }))
                  }
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.frequencyRadio,
                      settings.frequency === option && styles.frequencyRadioActive,
                    ]}
                  >
                    {settings.frequency === option ? <View style={styles.frequencyRadioDot} /> : null}
                  </View>
                  <Text
                    style={[
                      styles.frequencyText,
                      settings.frequency === option && styles.frequencyTextActive,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            <Text style={styles.sectionDescription}>
              Enable only the updates you want to see in your inbox.
            </Text>

            {preferenceItems.map((item) => {
              const Icon = item.icon;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.preferenceCard,
                    !item.enabled && styles.preferenceCardMuted,
                  ]}
                >
                  <View style={styles.preferenceContent}>
                    <View
                      style={[
                        styles.preferenceIconWrap,
                        item.enabled && styles.preferenceIconWrapActive,
                      ]}
                    >
                      <Icon
                        size={scaleFontSize(18)}
                        color={item.enabled ? COLORS.pastelOrange.dark : COLORS.text.tertiary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.preferenceTextWrap}>
                      <Text
                        style={[
                          styles.preferenceTitle,
                          !item.enabled && styles.preferenceTitleMuted,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.preferenceDescription}>{item.description}</Text>
                    </View>
                  </View>

                  <Switch
                    value={item.enabled}
                    onValueChange={item.onToggle}
                    trackColor={{
                      false: COLORS.border.light,
                      true: COLORS.pastelOrange.light,
                    }}
                    thumbColor={item.enabled ? COLORS.pastelOrange.main : COLORS.background.white}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do Not Disturb</Text>
            <Text style={styles.sectionDescription}>
              Keep your quiet hours saved with the notification profile.
            </Text>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceTextWrap}>
                <Text style={styles.preferenceTitle}>Enable Do Not Disturb</Text>
                <Text style={styles.preferenceDescription}>
                  Quiet hours are saved from {settings.doNotDisturbStart} to {settings.doNotDisturbEnd}.
                </Text>
              </View>
              <Switch
                value={settings.doNotDisturbEnabled}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    doNotDisturbEnabled: value,
                  }))
                }
                trackColor={{
                  false: COLORS.border.light,
                  true: COLORS.pastelGreen.light,
                }}
                thumbColor={
                  settings.doNotDisturbEnabled ? COLORS.pastelGreen.main : COLORS.background.white
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceTextWrap}>
                <Text style={styles.preferenceTitle}>Show Preview</Text>
                <Text style={styles.preferenceDescription}>
                  Display the message body inside the notification list.
                </Text>
              </View>
              <Switch
                value={settings.privacy.showPreview}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    privacy: {
                      ...current.privacy,
                      showPreview: value,
                    },
                  }))
                }
                trackColor={{
                  false: COLORS.border.light,
                  true: `${COLORS.status.info}66`,
                }}
                thumbColor={
                  settings.privacy.showPreview ? COLORS.status.info : COLORS.background.white
                }
              />
            </View>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceTextWrap}>
                <Text style={styles.preferenceTitle}>Show Sender Name</Text>
                <Text style={styles.preferenceDescription}>
                  Display who sent the comment notification when available.
                </Text>
              </View>
              <Switch
                value={settings.privacy.showSenderName}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    privacy: {
                      ...current.privacy,
                      showSenderName: value,
                    },
                  }))
                }
                trackColor={{
                  false: COLORS.border.light,
                  true: `${COLORS.status.info}66`,
                }}
                thumbColor={
                  settings.privacy.showSenderName ? COLORS.status.info : COLORS.background.white
                }
              />
            </View>
          </View>

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>How this works</Text>
            <Text style={styles.helpText}>
              Comments, recipe approvals, and matched new recipe alerts are generated per user from
              actual app activity and your saved preferences.
            </Text>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Button
          variant="outline"
          size="medium"
          fullWidth
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          fullWidth
          onPress={handleSave}
          loading={saving}
        >
          Save Changes
        </Button>
      </View>
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
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  sectionDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.md),
  },
  frequencyRow: {
    gap: moderateScale(SPACING.sm),
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  frequencyCardActive: {
    backgroundColor: COLORS.pastelOrange.light,
    borderColor: COLORS.pastelOrange.main,
  },
  frequencyRadio: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: COLORS.border.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.sm),
  },
  frequencyRadioActive: {
    borderColor: COLORS.pastelOrange.main,
  },
  frequencyRadioDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.pastelOrange.main,
  },
  frequencyText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.secondary,
  },
  frequencyTextActive: {
    color: COLORS.pastelOrange.dark,
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  preferenceCardMuted: {
    opacity: 0.65,
  },
  preferenceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  preferenceIconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  preferenceIconWrapActive: {
    backgroundColor: COLORS.pastelOrange.light,
  },
  preferenceTextWrap: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(4),
  },
  preferenceTitleMuted: {
    color: COLORS.text.secondary,
  },
  preferenceDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.xs),
  },
  helpCard: {
    margin: moderateScale(SPACING.base),
    backgroundColor: COLORS.pastelYellow.light,
    borderWidth: 1,
    borderColor: COLORS.pastelYellow.main,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
  },
  helpTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  helpText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  footer: {
    backgroundColor: COLORS.background.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    gap: moderateScale(SPACING.sm),
    ...SHADOWS.medium,
  },
  cancelButton: {
    borderColor: COLORS.pastelOrange.main,
  },
  cancelButtonText: {
    color: COLORS.pastelOrange.dark,
  },
});

export default NotificationSettingsScreen;
