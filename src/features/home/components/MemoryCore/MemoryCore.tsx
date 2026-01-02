// src/features/home/components/MemoryCore/MemoryCore.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../../common/utils/responsive';
import Button from '../../../../common/components/Button/Button';

interface MemoryCoreProps {
  onGenerate: (query: string) => void;
  onVoicePress: () => void;
}

const MemoryCore: React.FC<MemoryCoreProps> = ({ onGenerate, onVoicePress }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleGenerate = () => {
    if (query.trim()) {
      onGenerate(query);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.secondary.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          <Image
            source={require('../../../../assets/icons/memory.png')}
            style={styles.brainIcon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Recreate a Food Memory</Text>
        <Text style={styles.subtitle}>
          Describe a taste, smell, or texture you remember
        </Text>

        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
          <TextInput
            style={styles.input}
            placeholder="e.g., I remember a creamy, spicy pumpkin curry from my grandmother's kitchen..."
            placeholderTextColor={COLORS.text.tertiary}
            value={query}
            onChangeText={setQuery}
            multiline
            numberOfLines={3}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          
          <TouchableOpacity
            style={styles.micButton}
            onPress={onVoicePress}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../../assets/icons/microphone.png')}
              style={styles.micIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <Button
          variant="primary"
          size="medium"
          fullWidth
          onPress={handleGenerate}
          disabled={!query.trim()}
          icon={require('../../../../assets/icons/sparkle.png')}
          style={styles.generateButton}
        >
          Generate Recipe
        </Button>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(SPACING.base),
    marginTop: moderateScale(SPACING.base),
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    ...SHADOWS.large,
  },
  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  brainIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    tintColor: COLORS.text.white,
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    marginBottom: moderateScale(SPACING.xs),
  },
  subtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.white,
    opacity: 0.9,
    marginBottom: moderateScale(SPACING.lg),
  },
  inputContainer: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.md,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.base),
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: moderateScale(80),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: COLORS.primary.main,
  },
  input: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.primary,
    textAlignVertical: 'top',
  },
  micButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(SPACING.sm),
  },
  micIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: COLORS.text.white,
  },
  generateButton: {
    backgroundColor: COLORS.primary.main,
  },
});

export default MemoryCore;