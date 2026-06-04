// components/onboarding/PayoffScreen.tsx — Stovd onboarding payoff / "aha" reveal.
// Shown AFTER the profile upsert succeeds. Restyle of the approved mockup (screen D).
//
// HONESTY: a brand-new user has an empty pantry, so we do NOT claim "X dishes you can
// cook tonight". The big number is an HONEST count of recipes in recipe_corpus that
// match the cuisines the user just picked (falling back to the full corpus count when
// none were chosen). The label says these recipes are "tuned to your taste" — a real,
// queryable number, not a fabricated cook-tonight count.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Display, Eyebrow } from '@/components/UI/Display';
import ThemedText from '@/components/UI/ThemedText';
import PrimaryButton from '@/components/auth/PrimaryButton';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

const CARD_URI =
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=82';

const SKILL_LABEL: Record<string, string> = {
  beginner: 'auth.onboarding.payoff.skillBeginner',
  intermediate: 'auth.onboarding.payoff.skillIntermediate',
  advanced: 'auth.onboarding.payoff.skillAdvanced',
  expert: 'auth.onboarding.payoff.skillExpert',
};

export interface PayoffSummary {
  /** Selected cuisine keys (lowercase, e.g. 'italian'). */
  cuisines: string[];
  /** Cooking skill key (e.g. 'beginner'). */
  skill: string;
  /** Number of allergens the user flagged for us to keep off the plate. */
  allergens: number;
}

interface PayoffScreenProps {
  summary: PayoffSummary;
  onFinish: () => void;
}

/** Honest count: recipes in recipe_corpus matching the chosen cuisines (case-insensitive),
 *  or the whole corpus when no cuisine was selected. Never a "cook tonight" number. */
async function fetchTunedRecipeCount(cuisines: string[]): Promise<number> {
  let query = supabase
    .from('recipe_corpus')
    .select('id', { count: 'exact', head: true });

  if (cuisines.length > 0) {
    const ors = cuisines.map((c) => `cuisine.ilike.${c}`).join(',');
    query = query.or(ors);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export default function PayoffScreen({ summary, onFinish }: PayoffScreenProps) {
  const { colors } = useTheme();
  const [count, setCount] = useState<number | null>(null);

  const tailoredToFlavors = summary.cuisines.length > 0;

  useEffect(() => {
    let active = true;
    fetchTunedRecipeCount(summary.cuisines)
      .then((c) => active && setCount(c))
      .catch(() => active && setCount(0));
    return () => {
      active = false;
    };
  }, [summary.cuisines]);

  const skillText = useMemo(() => {
    const key = SKILL_LABEL[summary.skill];
    return key ? t(key) : t('auth.onboarding.payoff.skillNotSet');
  }, [summary.skill]);

  const bigNumber = count === null ? '—' : String(count);
  const cardLabel = tailoredToFlavors
    ? t('auth.onboarding.payoff.cardLabelFlavors')
    : t('auth.onboarding.payoff.cardLabel');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <Eyebrow style={styles.eyebrow}>
          {t('auth.onboarding.payoff.eyebrow')}
        </Eyebrow>
        <Display size="xl" weight="display" style={styles.title}>
          {t('auth.onboarding.payoff.title')}
        </Display>
      </View>

      {/* Hero reveal card */}
      <View style={styles.card}>
        <Image
          source={{ uri: CARD_URI }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(18,11,7,0.88)', 'rgba(18,11,7,0.05)']}
          locations={[0, 0.6]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardOverlay}>
          <ThemedText style={styles.big}>{bigNumber}</ThemedText>
          <ThemedText style={styles.cardLabel}>{cardLabel}</ThemedText>
        </View>
      </View>

      {/* Real stat chips */}
      <View style={styles.stats}>
        <Stat
          value={String(summary.cuisines.length)}
          label={t('auth.onboarding.payoff.statCuisines')}
        />
        <Stat value={skillText} label={t('auth.onboarding.payoff.statSkill')} />
        <Stat
          value={String(summary.allergens)}
          label={t('auth.onboarding.payoff.statAllergens')}
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          text={t('auth.onboarding.payoff.startCooking')}
          onPress={onFinish}
        />
      </View>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <ThemedText
        style={[styles.statValue, { color: colors.primary }]}
        numberOfLines={1}
      >
        {value}
      </ThemedText>
      <ThemedText
        style={[styles.statKey, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  eyebrow: { marginBottom: spacing.sm, textAlign: 'center' },
  title: { textAlign: 'center' },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#3C2814',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  cardImage: { width: '100%', height: 300 },
  cardOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 48,
    color: '#fff',
  },
  cardLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#EFE3DA',
    marginTop: 6,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 19,
  },
  statKey: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
