import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CircleCheck as CheckCircle, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { t } from '@/lib/i18n';

const FEATURE_KEYS = [
  'subscription.featureUnlimitedScan',
  'subscription.featureMealPlanning',
  'subscription.featureSmartShopping',
  'subscription.featureNutritionTracking',
];

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.secondary + '1F' },
          ]}
        >
          <CheckCircle size={56} color={colors.secondary} />
        </View>

        <Eyebrow color={colors.secondary} style={styles.kicker}>
          {t('subscription.successKicker')}
        </Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('subscription.successTitle')}
        </Display>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('subscription.successSubtitle')}
        </Text>

        <View
          style={[
            styles.featuresContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {FEATURE_KEYS.map((featureKey) => (
            <View key={featureKey} style={styles.feature}>
              <CheckCircle size={18} color={colors.secondary} />
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                {t(featureKey)}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {t('subscription.startUsing')}
          </Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>

        <Text
          style={[styles.autoRedirectText, { color: colors.textSecondary }]}
        >
          {t('subscription.autoRedirect')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
    maxWidth: 420,
    width: '100%',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  kicker: {
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...{
      shadowColor: '#3C2814',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    height: 54,
    borderRadius: 18,
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
    ...{
      shadowColor: '#C8472B',
      shadowOpacity: 0.28,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
  },
  continueButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#fff',
  },
  autoRedirectText: {
    fontSize: 13,
    fontFamily: fonts.body,
  },
});
