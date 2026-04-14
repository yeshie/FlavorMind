import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  BookOpen,
  ChefHat,
  Lightbulb,
  MapPin,
  Sparkles,
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

interface CreateScreenProps {
  navigation: any;
}

interface CreateAction {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tint: string;
  surface: string;
  eyebrow: string;
}

const actions: CreateAction[] = [
  {
    id: 'recipe',
    title: 'Add a Recipe',
    description: 'Write your own dish, save it as a draft, or submit it for review.',
    route: 'AddRecipe',
    icon: ChefHat,
    tint: COLORS.pastelOrange.dark,
    surface: COLORS.pastelOrange.light,
    eyebrow: 'Start here',
  },
  {
    id: 'cookbook',
    title: 'Build a Cookbook',
    description: 'Turn your saved recipes into a polished collection for the community.',
    route: 'SelectRecipesPage',
    icon: BookOpen,
    tint: COLORS.pastelGreen.dark,
    surface: COLORS.pastelGreen.light,
    eyebrow: 'Collection',
  },
  {
    id: 'memory',
    title: 'Recall From Memory',
    description: 'Describe a remembered dish and let FlavorMind help recreate it.',
    route: 'Memory',
    icon: Lightbulb,
    tint: '#B77900',
    surface: COLORS.pastelYellow.light,
    eyebrow: 'AI assist',
  },
  {
    id: 'adaptation',
    title: 'Suggest a Local Swap',
    description: 'Share ingredient substitutions that work better in your local area.',
    route: 'AddAdaptation',
    icon: MapPin,
    tint: COLORS.pastelGreen.dark,
    surface: '#E8F5E9',
    eyebrow: 'Community',
  },
];

const quickSteps = [
  'Choose the action that matches what you want to create.',
  'Fill in only the important details first.',
  'Save as draft if you want to finish later.',
];

const CreateScreen: React.FC<CreateScreenProps> = ({ navigation }) => {
  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#FFF1D9', '#FFE4B5', '#F9D79C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <Sparkles size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
            <Text style={styles.heroBadgeText}>Create Space</Text>
          </View>

          <Text style={styles.heroTitle}>Make something useful, not confusing.</Text>
          <Text style={styles.heroSubtitle}>
            Start with the clearest path below. Each option takes you directly to the right tool instead of making you guess.
          </Text>

          <View style={styles.heroActions}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={() => handleNavigate('AddRecipe')}
              style={styles.primaryHeroButton}
            >
              Create a Recipe
            </Button>

            <TouchableOpacity
              style={styles.secondaryHeroButton}
              onPress={() => handleNavigate('Memory')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryHeroText}>Use memory-based cooking</Text>
              <ArrowRight size={scaleFontSize(16)} color={COLORS.pastelOrange.dark} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose an action</Text>
          <Text style={styles.sectionSubtitle}>
            Every card opens a focused flow with less clutter.
          </Text>
        </View>

        <View style={styles.cardsColumn}>
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleNavigate(action.route)}
                activeOpacity={0.88}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: action.surface }]}>
                  <Icon
                    size={scaleFontSize(26)}
                    color={action.tint}
                    strokeWidth={2}
                  />
                </View>

                <View style={styles.actionContent}>
                  <Text style={[styles.actionEyebrow, { color: action.tint }]}>
                    {action.eyebrow}
                  </Text>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>

                <View style={styles.actionArrow}>
                  <ArrowRight
                    size={scaleFontSize(18)}
                    color={COLORS.text.secondary}
                    strokeWidth={2}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.guidanceCard}>
          <Text style={styles.guidanceTitle}>Best way to use this page</Text>
          {quickSteps.map((step, index) => (
            <View key={step} style={styles.guidanceRow}>
              <View style={styles.guidanceNumber}>
                <Text style={styles.guidanceNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.guidanceText}>{step}</Text>
            </View>
          ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(SPACING.base),
    paddingTop: moderateScale(SPACING.lg),
    paddingBottom: moderateScale(SPACING['4xl']),
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    ...SHADOWS.large,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(6),
    marginBottom: moderateScale(SPACING.lg),
  },
  heroBadgeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(SPACING.sm),
  },
  heroSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
  },
  heroActions: {
    marginTop: moderateScale(SPACING.xl),
    gap: moderateScale(SPACING.sm),
  },
  primaryHeroButton: {
    backgroundColor: COLORS.pastelOrange.dark,
  },
  secondaryHeroButton: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: moderateScale(SPACING.lg),
    paddingVertical: moderateScale(SPACING.md),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryHeroText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.pastelOrange.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  sectionHeader: {
    marginTop: moderateScale(SPACING['2xl']),
    marginBottom: moderateScale(SPACING.md),
  },
  sectionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(4),
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  cardsColumn: {
    gap: moderateScale(SPACING.md),
  },
  actionCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.lg),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...SHADOWS.small,
  },
  actionIconWrap: {
    width: moderateScale(58),
    height: moderateScale(58),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(SPACING.md),
  },
  actionContent: {
    flex: 1,
  },
  actionEyebrow: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: moderateScale(4),
  },
  actionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(4),
  },
  actionDescription: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  actionArrow: {
    marginLeft: moderateScale(SPACING.md),
  },
  guidanceCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: moderateScale(SPACING.xl),
    marginTop: moderateScale(SPACING['2xl']),
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...SHADOWS.small,
  },
  guidanceTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: moderateScale(SPACING.lg),
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(SPACING.md),
  },
  guidanceNumber: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: COLORS.pastelOrange.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(SPACING.sm),
  },
  guidanceNumberText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  guidanceText: {
    flex: 1,
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.sm),
  },
  bottomSpacer: {
    height: moderateScale(SPACING.xl),
  },
});

export default CreateScreen;
