import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  Target,
  Award,
  Coffee,
  Plus,
  User,
} from 'lucide-react-native';
import { router } from 'expo-router';

import { spacing, shadows, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';

import { useUserProfile } from '@/hooks/dashboard/useUserProfile';
import { useMacroNutritionTargets } from '@/hooks/nutrition/useNutritionTargets';
import { useMacroNutritionInsights } from '@/hooks/nutrition/useNutritionInsights';
import { useDailyMacroIntake } from '@/hooks/nutrition/useDailyMacroIntake';
import { useNutritionStats } from '@/hooks/nutrition/useNutritionStats';
import { MacroKey } from '@/lib/nutrition/insights';

import LoadingCard from '@/components/UI/LoadingCard';
import ThemedText from '@/components/UI/ThemedText';
import InsightCard from '@/components/dashboard/InsightCard';
import StatCard from '@/components/dashboard/StatCard';
import EmptyState from '@/components/dashboard/EmptyState';
import ProfileSummaryCard from '@/components/dashboard/ProfileSummaryCard';

const QUICK_ACTIONS = [
  {
    key: 'log-food',
    label: 'Log Food',
    icon: Target,
    color: 'primary',
    route: '/nutrition',
  },
  {
    key: 'add-item',
    label: 'Add Item',
    icon: Plus,
    color: 'secondary',
    route: '/pantry',
  },
  {
    key: 'recipes',
    label: 'Recipes',
    icon: Award,
    color: 'info',
    route: '/recipes',
  },
] as const;

const DASHBOARD_MACROS: MacroKey[] = ['calories', 'protein', 'carbs', 'fat'];

export default function Dashboard() {
  const { colors } = useTheme();
  const [greeting, setGreeting] = useState('');
  const [today] = useState(() => new Date());

  const { userProfile, loading: profileLoading } = useUserProfile();

  const { intake, loading: intakeLoading } = useDailyMacroIntake(
    today,
    userProfile?.id
  );

  const macroNutritionTargets = useMacroNutritionTargets(userProfile);
  const nutritionStats = useNutritionStats(intake, macroNutritionTargets);
  const macroInsights = useMacroNutritionInsights(
    intake,
    macroNutritionTargets
  );

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  if (profileLoading || intakeLoading) {
    return <LoadingCard statusText="Loading your dashboard..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* -------------------------------- Header ------------------------------- */}
        <LinearGradient
          colors={[colors.primary, colors.buttonPrimary]}
          style={styles.header}
        >
          <ThemedText type="title" bold style={styles.greeting}>
            {greeting}, {userProfile?.full_name}!
          </ThemedText>

          {userProfile?.health_goals_macros && (
            <ThemedText type="label">
              Let's track your {userProfile?.health_goals_macros} goals
            </ThemedText>
          )}
        </LinearGradient>

        {/* -------------------- Profile Summary ---------------------------------- */}
        {userProfile && userProfile.age && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color={colors.primary} />
              <ThemedText type="subtitle" bold style={styles.sectionTitle}>
                Your Profile Summary
              </ThemedText>
            </View>
            <ProfileSummaryCard
              profile={userProfile}
              calories={macroNutritionTargets.calories}
              bmr={macroNutritionTargets.bmr}
            />
          </View>
        )}

        {/* --------------------------- Today's Progress --------------------------- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={colors.primary} />
            <ThemedText type="subtitle" bold style={styles.sectionTitle}>
              Today's Progress
            </ThemedText>
          </View>

          {intake?.calories > 0 ? (
            <View style={styles.statsGrid}>
              {DASHBOARD_MACROS.map((key) => {
                const stat = nutritionStats[key];
                return (
                  <StatCard
                    key={stat.key}
                    title={stat.title}
                    current={stat.current}
                    target={stat.target}
                    color={stat.color}
                    unit={stat.unit}
                    percentage={stat.safePercent}
                  />
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={Coffee}
              title="No nutrition data logged today"
              message="Start tracking your meals to see your progress here"
              actionText="Log your first meal"
              onAction={() => router.push('/nutrition')}
            />
          )}
        </View>

        {/* -------------------------------- Insights ------------------------------ */}
        {macroInsights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <ThemedText type="subtitle" bold style={styles.sectionTitle}>
                Your Insights
              </ThemedText>
            </View>

            <View style={styles.insightsList}>
              {macroInsights.map((insight, index) => (
                <InsightCard key={index} {...insight} />
              ))}
            </View>
          </View>
        )}

        {/* ------------------------------ Quick Actions --------------------------- */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <ThemedText
            type="subtitle"
            bold
            style={[styles.sectionTitle, styles.sectionHeader]}
          >
            Quick Actions
          </ThemedText>

          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map(({ key, label, icon: Icon, color, route }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.quickActionCard,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => router.push(route)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: `${colors[color]}20` },
                  ]}
                >
                  <Icon size={24} color={colors[color]} />
                </View>
                <ThemedText type="caption" bold>
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  greeting: {
    marginBottom: spacing.sm,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    alignSelf: 'center',
    marginLeft: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  insightsList: {
    gap: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
