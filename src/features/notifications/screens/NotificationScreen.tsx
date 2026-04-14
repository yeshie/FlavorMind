import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Check,
  Clock3,
  MessageSquare,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import notificationStore, {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  type NotificationType,
  type UserNotification,
} from '../../../services/firebase/notificationStore';
import userService from '../../../services/api/user.service';

interface FilterTab {
  id: string;
  label: string;
  type?: NotificationType;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'comment', label: 'Comments', type: 'comment' },
  { id: 'approval', label: 'Approved', type: 'approval' },
  { id: 'recipe', label: 'For You', type: 'recipe' },
];

const NotificationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let profile = null;
      try {
        const response = await userService.getProfile();
        profile = response.data?.user || null;
      } catch (error) {
        console.warn('Notification profile fetch failed, using stored signals only:', error);
      }

      const result = await notificationStore.syncNotificationsForCurrentUser(profile);
      setNotifications(result.notifications);
      setSettings(result.settings);
    } catch (error) {
      console.error('Load notifications error:', error);
      try {
        const [fallbackNotifications, fallbackSettings] = await Promise.all([
          notificationStore.getCurrentUserNotifications(),
          notificationStore.getCurrentUserNotificationSettings(),
        ]);
        setNotifications(fallbackNotifications);
        setSettings(fallbackSettings);
      } catch (fallbackError) {
        console.error('Fallback notification load error:', fallbackError);
        setNotifications([]);
        setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.status === 'unread').length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') {
      return notifications;
    }
    if (activeFilter === 'unread') {
      return notifications.filter((item) => item.status === 'unread');
    }
    return notifications.filter((item) => item.type === activeFilter);
  }, [activeFilter, notifications]);

  const getDisplayTitle = (item: UserNotification) => {
    if (item.type === 'comment' && !settings.privacy.showSenderName) {
      return item.recipeTitle
        ? `New comment on ${item.recipeTitle}`
        : 'New comment on your recipe';
    }
    return item.title;
  };

  const getDisplayMessage = (item: UserNotification) => {
    if (!settings.privacy.showPreview) {
      if (item.type === 'comment') {
        return 'Open this notification to view the new comment.';
      }
      if (item.type === 'approval') {
        return 'Your recipe status changed.';
      }
      if (item.type === 'recipe') {
        return 'A new recipe matched your tastes.';
      }
      return 'Open this notification to view details.';
    }

    if (item.type === 'comment' && !settings.privacy.showSenderName) {
      return item.recipeTitle
        ? `A user commented on ${item.recipeTitle}.`
        : 'A user commented on your recipe.';
    }

    return item.message;
  };

  const formatTimeAgo = (value?: unknown) => {
    let date: Date | null = null;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    } else if (typeof value === 'object' && value) {
      const anyValue = value as { toDate?: () => Date; toMillis?: () => number };
      if (typeof anyValue.toDate === 'function') {
        date = anyValue.toDate();
      } else if (typeof anyValue.toMillis === 'function') {
        date = new Date(anyValue.toMillis());
      }
    }

    if (!date) return 'just now';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'comment':
        return MessageSquare;
      case 'approval':
        return Check;
      case 'recipe':
        return Sparkles;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case 'comment':
        return COLORS.pastelOrange.main;
      case 'approval':
        return COLORS.secondary.main;
      case 'recipe':
        return COLORS.pastelGreen.main;
      default:
        return COLORS.text.secondary;
    }
  };

  const getActionLabel = (item: UserNotification) => {
    if (!item.recipeId && !item.recipe) {
      return null;
    }
    if (item.type === 'comment') {
      return 'Open Recipe';
    }
    if (item.type === 'approval') {
      return 'View Approved Recipe';
    }
    return 'View Recipe';
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, status: 'read' } : item
      )
    );

    try {
      await notificationStore.markCurrentUserNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Mark notification as read error:', error);
      loadNotifications(true);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, status: 'read' })));
    try {
      await notificationStore.markAllCurrentUserNotificationsAsRead();
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      loadNotifications(true);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
    try {
      await notificationStore.deleteCurrentUserNotification(notificationId);
    } catch (error) {
      console.error('Delete notification error:', error);
      loadNotifications(true);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete Notifications',
      'Delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setNotifications([]);
            try {
              await notificationStore.deleteAllCurrentUserNotifications();
            } catch (error) {
              console.error('Delete all notifications error:', error);
              loadNotifications(true);
            }
          },
        },
      ]
    );
  };

  const handleAction = async (item: UserNotification) => {
    if (item.status !== 'read') {
      await markAsRead(item.id);
    }

    if (item.recipeId || item.recipe) {
      navigation.navigate('RecipeDescription', {
        recipeId: item.recipeId,
        recipe: item.recipe || undefined,
      });
      return;
    }

    Alert.alert(item.title, item.message);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={scaleFontSize(20)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <Settings size={scaleFontSize(20)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                activeFilter === tab.id && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(tab.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.id && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {unreadCount > 0 && (
        <View style={styles.actionBar}>
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllAsRead}>
            <Check size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
            <Text style={styles.actionButtonText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={COLORS.pastelOrange.main} />
          <Text style={styles.stateText}>Loading notifications...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconWrap}>
            <Bell size={scaleFontSize(42)} color={COLORS.text.tertiary} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'unread'
              ? 'You have no unread notifications.'
              : 'Comment, approval, and recipe updates will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor={COLORS.pastelOrange.main}
            />
          }
          renderItem={({ item }) => {
            const Icon = getIcon(item.type);
            const iconColor = getIconColor(item.type);
            const actionLabel = getActionLabel(item);

            return (
              <View
                style={[
                  styles.card,
                  item.status === 'unread' && styles.cardUnread,
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${iconColor}22` }]}>
                  <Icon size={scaleFontSize(18)} color={iconColor} strokeWidth={2} />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{getDisplayTitle(item)}</Text>
                    {item.status === 'unread' ? <View style={styles.unreadDot} /> : null}
                  </View>

                  <Text style={styles.cardMessage}>{getDisplayMessage(item)}</Text>

                  <View style={styles.cardMeta}>
                    <View style={styles.timeWrap}>
                      <Clock3 size={scaleFontSize(12)} color={COLORS.text.tertiary} strokeWidth={2} />
                      <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
                    </View>

                    {settings.privacy.showSenderName && item.actorAvatar ? (
                      <Image
                        source={{ uri: item.actorAvatar }}
                        style={styles.avatar}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>

                  {actionLabel ? (
                    <TouchableOpacity
                      style={styles.cardAction}
                      onPress={() => handleAction(item)}
                    >
                      <Text style={styles.cardActionText}>{actionLabel}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                  <X size={scaleFontSize(18)} color={COLORS.text.tertiary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {notifications.length > 0 && !loading ? (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAll}>
            <Trash2 size={scaleFontSize(16)} color={COLORS.status.error} strokeWidth={2} />
            <Text style={styles.deleteAllText}>Delete All</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    backgroundColor: COLORS.background.white,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingBottom: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(SPACING.md),
  },
  headerButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
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
  filterScroll: {
    gap: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
  },
  filterTab: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
  },
  filterTabActive: {
    backgroundColor: COLORS.pastelOrange.main,
    borderColor: COLORS.pastelOrange.main,
  },
  filterTabText: {
    color: COLORS.text.secondary,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterTabTextActive: {
    color: COLORS.text.white,
  },
  actionBar: {
    marginHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.sm),
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.pastelOrange.light,
    borderWidth: 1,
    borderColor: COLORS.border.main,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: COLORS.pastelOrange.main,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    marginRight: moderateScale(SPACING.md),
  },
  unreadBadgeText: {
    color: COLORS.text.white,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
  },
  actionButtonText: {
    color: COLORS.pastelOrange.dark,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(SPACING.xl),
  },
  stateText: {
    marginTop: moderateScale(SPACING.md),
    color: COLORS.text.secondary,
  },
  emptyIconWrap: {
    width: moderateScale(82),
    height: moderateScale(82),
    borderRadius: moderateScale(41),
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(SPACING.lg),
  },
  emptyTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  listContent: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.sm),
    ...SHADOWS.small,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: COLORS.pastelOrange.light,
    backgroundColor: `${COLORS.pastelOrange.light}22`,
  },
  iconWrap: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(SPACING.md),
    marginTop: moderateScale(2),
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    marginBottom: moderateScale(SPACING.xs),
  },
  cardTitle: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.text.primary,
  },
  unreadDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.pastelOrange.main,
  },
  cardMessage: {
    color: COLORS.text.secondary,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
    marginBottom: moderateScale(SPACING.sm),
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(SPACING.sm),
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  timeText: {
    color: COLORS.text.tertiary,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
  },
  avatar: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    borderWidth: 2,
    borderColor: COLORS.pastelOrange.light,
  },
  cardAction: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.pastelOrange.light,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.xs),
  },
  cardActionText: {
    color: COLORS.pastelOrange.dark,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  deleteButton: {
    padding: moderateScale(SPACING.xs),
    marginLeft: moderateScale(SPACING.sm),
  },
  footer: {
    backgroundColor: COLORS.background.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingHorizontal: moderateScale(SPACING.base),
    paddingVertical: moderateScale(SPACING.md),
    ...SHADOWS.small,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(SPACING.xs),
  },
  deleteAllText: {
    color: COLORS.status.error,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});

export default NotificationScreen;
