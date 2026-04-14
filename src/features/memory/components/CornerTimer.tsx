import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Clock3, Pause, Play, RotateCcw } from 'lucide-react-native';
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

interface CornerTimerProps {
  title: string;
  durationMinutes: number;
  accentColor?: string;
  onCompleteTitle?: string;
  onCompleteMessage?: string;
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

const getDurationSeconds = (durationMinutes: number) => {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return 60;
  }

  return Math.max(60, Math.round(durationMinutes * 60));
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const CornerTimer: React.FC<CornerTimerProps> = ({
  title,
  durationMinutes,
  accentColor = COLORS.pastelOrange.dark,
  onCompleteTitle = 'Timer complete',
  onCompleteMessage,
}) => {
  const initialSeconds = useMemo(
    () => getDurationSeconds(durationMinutes),
    [durationMinutes]
  );
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      setRemainingSeconds(initialSeconds);
    }
  }, [initialSeconds, status]);

  useEffect(() => {
    if (status !== 'running') {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (status !== 'running' || remainingSeconds !== 0) {
      return;
    }

    setStatus('completed');
    setExpanded(true);
    Alert.alert(
      onCompleteTitle,
      onCompleteMessage || `${title} has finished.`
    );
  }, [
    onCompleteMessage,
    onCompleteTitle,
    remainingSeconds,
    status,
    title,
  ]);

  const handleStart = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(initialSeconds);
    }

    setStatus('running');
    setExpanded(true);
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleResume = () => {
    setStatus('running');
  };

  const handleCancel = () => {
    setStatus('idle');
    setRemainingSeconds(initialSeconds);
    setExpanded(false);
  };

  const statusLabel =
    status === 'running'
      ? 'Running'
      : status === 'paused'
        ? 'Paused'
        : status === 'completed'
          ? 'Done'
          : 'Ready';

  const actionLabel =
    status === 'paused' ? 'Resume' : status === 'completed' ? 'Start Again' : 'Start';

  const actionIcon =
    status === 'paused' ? (
      <Play size={scaleFontSize(14)} color={COLORS.text.white} strokeWidth={2.2} />
    ) : status === 'completed' ? (
      <RotateCcw size={scaleFontSize(14)} color={COLORS.text.white} strokeWidth={2.2} />
    ) : (
      <Play size={scaleFontSize(14)} color={COLORS.text.white} strokeWidth={2.2} />
    );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setExpanded((current) => !current)}
        style={[styles.timerChip, { borderColor: accentColor }]}
      >
        <View style={[styles.iconBadge, { backgroundColor: accentColor }]}>
          <Clock3 size={scaleFontSize(14)} color={COLORS.text.white} strokeWidth={2.2} />
        </View>

        <View style={styles.timerChipContent}>
          <Text style={styles.timerChipTitle}>{title}</Text>
          <Text style={styles.timerChipValue}>{formatTime(remainingSeconds)}</Text>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{title}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${accentColor}22` }]}>
              <Text style={[styles.statusText, { color: accentColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={styles.panelTime}>{formatTime(remainingSeconds)}</Text>
          <Text style={styles.panelHint}>
            Recommended {Math.max(1, Math.round(initialSeconds / 60))} min
          </Text>

          <View style={styles.controlsRow}>
            {status === 'running' ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePause}
                style={[styles.actionButton, { backgroundColor: accentColor }]}
              >
                <Pause size={scaleFontSize(14)} color={COLORS.text.white} strokeWidth={2.2} />
                <Text style={styles.actionButtonText}>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={status === 'paused' ? handleResume : handleStart}
                style={[styles.actionButton, { backgroundColor: accentColor }]}
              >
                {actionIcon}
                <Text style={styles.actionButtonText}>{actionLabel}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'flex-end',
    maxWidth: moderateScale(220),
    zIndex: 40,
    elevation: 40,
  },
  timerChip: {
    minWidth: moderateScale(138),
    maxWidth: moderateScale(160),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    paddingVertical: moderateScale(SPACING.xs),
    paddingHorizontal: moderateScale(SPACING.sm),
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  iconBadge: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(SPACING.xs),
  },
  timerChipContent: {
    flex: 1,
  },
  timerChipTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  timerChipValue: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  panel: {
    position: 'absolute',
    top: moderateScale(46),
    right: 0,
    width: moderateScale(220),
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: moderateScale(SPACING.md),
    zIndex: 60,
    ...SHADOWS.medium,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(SPACING.xs),
  },
  panelTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statusPill: {
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(3),
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  panelTime: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(2),
  },
  panelHint: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    marginBottom: moderateScale(SPACING.md),
  },
  controlsRow: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.xs),
  },
  actionButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: moderateScale(SPACING.sm),
    paddingHorizontal: moderateScale(SPACING.sm),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  actionButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  cancelButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: moderateScale(SPACING.sm),
    paddingHorizontal: moderateScale(SPACING.sm),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.main,
    backgroundColor: COLORS.background.secondary,
  },
  cancelButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});

export default CornerTimer;
