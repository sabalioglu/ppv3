// components/onboarding/WelcomeScreen.tsx — Stovd onboarding welcome hook.
// Full-bleed hero food photo (top ~54%) fading into cream, a brand mark, a serif
// Display headline ("have." in terracotta), subtitle, terracotta CTA + sign-in link.
// Visual restyle of the approved mockup (screen A). Logic: onStart → form phase.
import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat } from 'lucide-react-native';

import { Display } from '@/components/UI/Display';
import ThemedText from '@/components/UI/ThemedText';
import PrimaryButton from '@/components/auth/PrimaryButton';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

const HERO_URI =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=82';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const heroHeight = Math.round(height * 0.54);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Hero */}
      <View style={[styles.hero, { height: heroHeight }]}>
        <Image
          source={{ uri: HERO_URI }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            'rgba(20,12,8,0.34)',
            'rgba(20,12,8,0)',
            'rgba(20,12,8,0)',
            colors.background,
          ]}
          locations={[0, 0.38, 0.78, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Body */}
      <SafeAreaView style={styles.bodyWrap} edges={['bottom']}>
        <View style={styles.body}>
          <View style={styles.brandmark}>
            <View
              style={[styles.brandTile, { backgroundColor: colors.primary }]}
            >
              <ChefHat size={15} color="#fff" />
            </View>
            <ThemedText
              style={[styles.brandText, { color: colors.textPrimary }]}
            >
              {t('auth.onboarding.welcome.brand')}
            </ThemedText>
          </View>

          <Display size="xl" weight="display" style={styles.headline}>
            {t('auth.onboarding.welcome.titleLead')}
            <Display size="xl" weight="display" color={colors.primary}>
              {t('auth.onboarding.welcome.titleAccent')}
            </Display>
          </Display>

          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            {t('auth.onboarding.welcome.subtitle')}
          </ThemedText>

          <PrimaryButton
            text={t('auth.onboarding.welcome.getStarted')}
            onPress={onStart}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { width: '100%' },
  heroImage: { width: '100%', height: '100%' },
  bodyWrap: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'flex-end',
  },
  brandmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  brandTile: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  headline: {
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: spacing.lg,
    maxWidth: '90%',
  },
});
