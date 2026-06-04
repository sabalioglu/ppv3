import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Display, Eyebrow } from '@/components/UI/Display';
import PrimaryButton from '@/components/auth/PrimaryButton';
import { spacing } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

export default function EmailConfirmedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    // Redirect to login in 5 seconds
    const timer = setTimeout(() => {
      router.replace(isWeb ? '/' : '/login');
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.secondary,
            },
          ]}
        >
          <CircleCheck size={64} color={colors.secondary} strokeWidth={2.2} />
        </View>

        <Eyebrow color={colors.secondary} style={styles.eyebrow}>
          {t('auth.confirmedEyebrow')}
        </Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('auth.confirmedTitle')}
        </Display>
        <Display
          size="sm"
          weight="displayMedium"
          color={colors.textSecondary}
          style={styles.subtitle}
        >
          {t('auth.confirmedSubtitle')}
        </Display>

        <View style={styles.cta}>
          <PrimaryButton
            onPress={() => router.replace(isWeb ? '/' : '/login')}
            text={isWeb ? t('auth.goToApp') : t('auth.goToLogin')}
          />
        </View>

        <Display
          size="sm"
          weight="displayMedium"
          color={colors.textSecondary}
          style={styles.redirectText}
        >
          {t('auth.redirecting')}
        </Display>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#3C2814',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  eyebrow: { marginBottom: spacing.sm, textAlign: 'center' },
  title: { marginBottom: spacing.md, textAlign: 'center' },
  subtitle: { marginBottom: spacing.xl, textAlign: 'center' },
  cta: { width: '100%' },
  redirectText: { marginTop: spacing.lg, textAlign: 'center' },
});
