// app/(protected)/(tabs)/index.tsx — Stovd home: "Bugün ne pişiriyoruz?"
// Cook-from-pantry: pulls personalized recommendations from the recipe engine
// and presents them in the Warm Kitchen editorial language.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChefHat } from 'lucide-react-native';

import { spacing } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/hooks/dashboard/useUserProfile';
import {
  recommendRecipes,
  logRecipeFeedback,
  type RecommendedRecipe,
} from '@/lib/recipe-engine';

import { HomeSkeleton } from '@/components/UI/SkeletonCard';
import EmptyState from '@/components/dashboard/EmptyState';
import { Display, Eyebrow } from '@/components/UI/Display';
import { SectionHeader } from '@/components/UI/SectionHeader';
import { FeatureCard, RecipeListCard } from '@/components/UI/RecipeCard';
import { t, i18n } from '@/lib/i18n';
import { useTranslation } from '@/contexts/LocaleContext';

const SKILL_KEY: Record<string, string> = {
  beginner: 'home.skillBeginner',
  intermediate: 'home.skillIntermediate',
  advanced: 'home.skillAdvanced',
};

function partKey(d: Date) {
  const h = d.getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
function dayName(d: Date) {
  const days = i18n.t('home.days') as unknown as string[];
  return days?.[d.getDay()] ?? '';
}
function matchPct(r: RecommendedRecipe) {
  const used = r.uses_from_pantry?.length ?? 0;
  const total =
    r.ingredients?.length || used + (r.missing_ingredients?.length ?? 0);
  if (!total) return undefined;
  return Math.round((used / total) * 100);
}
function skillLabel(level: string) {
  return SKILL_KEY[level] ? t(SKILL_KEY[level]) : level;
}
function kickerFor(r: RecommendedRecipe) {
  return [r.cuisine, skillLabel(r.skill_level)].filter(Boolean).join(' · ');
}

export default function Home() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { userProfile } = useUserProfile();
  const [today] = useState(() => new Date());
  const [recs, setRecs] = useState<RecommendedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      // The recipe engine runs an LLM pass and can take ~40s cold. Cap the wait
      // generously so a real (slow) result still lands, but never hang forever.
      const res = await Promise.race([
        recommendRecipes({ count: 5 }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('recommendations timed out')),
            45000,
          ),
        ),
      ]);
      setRecs(res.recommendations ?? []);
      setLoadError(false);
    } catch {
      // A timeout/network failure is NOT an empty pantry — flag it so the UI
      // shows "couldn't load / retry" instead of the misleading "scan pantry".
      setRecs([]);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading) {
    return <HomeSkeleton />;
  }

  const [hero, ...rest] = recs;
  const initial = (userProfile?.full_name?.trim()?.[0] ?? 'S').toUpperCase();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* header */}
        <View style={styles.headerRow}>
          <Eyebrow>{`${dayName(today)} ${t(`home.${partKey(today)}`)}`}</Eyebrow>
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.settings')}
            hitSlop={8}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          >
            <Display size="sm" color="#fff" style={styles.avatarText}>
              {initial}
            </Display>
          </Pressable>
        </View>
        <Display size="xl" style={styles.title}>
          {today.getHours() < 17 ? t('home.titleDay') : t('home.titleEvening')}
        </Display>

        {hero ? (
          <FeatureCard
            title={hero.title}
            kicker={kickerFor(hero)}
            imageUrl={null}
            matchPct={matchPct(hero)}
            timeMin={hero.total_time_min || undefined}
            missingCount={hero.missing_ingredients?.length}
            onPress={() => router.push('/recipes')}
            onToggleSave={() =>
              logRecipeFeedback('saved', {
                title: hero.title,
                cuisine: hero.cuisine,
              })
            }
          />
        ) : loadError ? (
          <EmptyState
            icon={ChefHat}
            title={t('home.errorTitle')}
            message={t('home.errorMessage')}
            actionText={t('common.retry')}
            onAction={onRefresh}
          />
        ) : (
          <EmptyState
            icon={ChefHat}
            title={t('home.emptyTitle')}
            message={t('home.emptyMessage')}
            actionText={t('home.emptyAction')}
            onAction={() => router.push('/camera')}
          />
        )}

        {rest.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={t('home.readyToCook')}
              actionLabel={t('common.seeAll')}
              onAction={() => router.push('/recipes')}
            />
            {rest.map((r, i) => (
              <RecipeListCard
                key={`${r.title}-${i}`}
                title={r.title}
                kicker={kickerFor(r)}
                imageUrl={null}
                matchPct={matchPct(r)}
                timeMin={r.total_time_min || undefined}
                onPress={() => router.push('/recipes')}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 110 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: 11,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
  title: { marginBottom: 18 },
  section: { marginTop: 26 },
});
