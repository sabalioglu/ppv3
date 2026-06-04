import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Circle as XCircle, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { t } from '@/lib/i18n';

export default function SubscriptionCancel() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleGoBack = () => {
    router.back();
  };

  const handleTryAgain = () => {
    router.replace('/subscription');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.textSecondary + '1A' },
          ]}
        >
          <XCircle size={56} color={colors.textSecondary} />
        </View>

        <Eyebrow color={colors.textSecondary} style={styles.kicker}>
          {t('subscription.cancelKicker')}
        </Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('subscription.cancelTitle')}
        </Display>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('subscription.cancelSubtitle')}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.tryAgainButton, { backgroundColor: colors.primary }]}
            onPress={handleTryAgain}
            activeOpacity={0.85}
          >
            <Text style={styles.tryAgainButtonText}>
              {t('subscription.tryAgain')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }]}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={colors.textSecondary} />
            <Text
              style={[styles.backButtonText, { color: colors.textSecondary }]}
            >
              {t('subscription.goBack')}
            </Text>
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  tryAgainButton: {
    paddingHorizontal: spacing.xl,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...{
      shadowColor: '#C8472B',
      shadowOpacity: 0.28,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
  },
  tryAgainButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
});
