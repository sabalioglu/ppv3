import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Droplets,
  Clock,
  Award,
  Camera,
  HelpCircle,
  LucideCamera,
  AlertCircle,
} from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '@/components/nutrition/ProgressBar';
import MacroCard from '@/components/nutrition/MacroCard';
import { useNutritionDate } from '@/hooks/nutrition/useNutritionDate';

import ThemedText from '@/components/UI/ThemedText';
import { Display, Eyebrow } from '@/components/UI/Display';
import { formatFullDate, formatRelativeDate } from '@/lib/nutrition/dates';

import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/hooks/dashboard/useUserProfile';
import { useDailyMacroIntake } from '@/hooks/nutrition/useDailyMacroIntake';
import { useMacroNutritionTargets } from '@/hooks/nutrition/useNutritionTargets';
import { useMacroNutritionInsights } from '@/hooks/nutrition/useNutritionInsights';
import { useNutritionStats } from '@/hooks/nutrition/useNutritionStats';
import { useWater } from '@/hooks/nutrition/useWater';
import { useWeeklyProgress } from '@/hooks/nutrition/useWeeklyProgress';
import { useDailyMeals } from '@/hooks/nutrition/useDailyMeals';
import { spacing, radius } from '@/lib/theme/index';

import LoadingCard from '@/components/UI/LoadingCard';
import WaterSection from '@/components/nutrition/WaterSection';
import EmptyState from '@/components/dashboard/EmptyState';
import MealCard, { Meal } from '@/components/nutrition/MealCard';
import TdeeInfoModal from '@/components/nutrition/TdeeInfoModal';
import WeeklyProgress from '@/components/nutrition/WeeklyProgress';
import InsightCard from '@/components/dashboard/InsightCard';
import DatePickerModal from '@/components/nutrition/DatePickerModal';
import ErrorCard from '@/components/UI/ErrorCard';
import { MacroKey } from '@/lib/nutrition/insights';
import { t } from '@/lib/i18n';

const macroKeys: MacroKey[] = ['protein', 'carbs', 'fat'];

export default function Nutrition() {
  const [showTdeeTooltip, setShowTdeeTooltip] = useState(false);
  const { colors } = useTheme();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const {
    selectedDate,
    showCalendar,
    setShowCalendar,
    selectDate,
    selectToday,
    selectYesterday,
    selectWeekAgo,
  } = useNutritionDate();

  const {
    intake,
    setIntake,
    loading: intakeLoading,
    error: intakeError,
  } = useDailyMacroIntake(selectedDate, userProfile?.id);

  const {
    meals,
    deleteMeal,
    loading: mealLoading,
    error: mealError,
  } = useDailyMeals(selectedDate, userProfile?.id);

  const handleWaterAdded = (amount: number) => {
    setIntake((prev) => ({
      ...prev,
      water: prev.water + amount,
    }));
  };

  const macroNutritionTargets = useMacroNutritionTargets(userProfile);

  const macroNutritionInsights = useMacroNutritionInsights(
    intake,
    macroNutritionTargets,
  );

  const nutritionStats = useNutritionStats(intake, macroNutritionTargets);

  const {
    loadingWater,
    errorWater,
    addWater,
    fadeAnim,
    scaleAnim,
    showCelebration,
  } = useWater({
    userId: userProfile?.id,
    percentage: nutritionStats.water.rawPercent,
    selectedDate,
    onWaterAdded: handleWaterAdded,
  });

  const {
    weeklyProgress,
    loading: weeklyLoading,
    error: weeklyError,
  } = useWeeklyProgress(selectedDate, userProfile?.id);

  const isLoading =
    profileLoading || mealLoading || intakeLoading || weeklyLoading;

  const error = mealError || intakeError || weeklyError;

  // **Camera Integration**
  const handleQuickAdd = () => {
    router.push({
      pathname: '/camera',
      params: {
        mode: 'calorie-counter',
        returnTo: 'nutrition',
        timestamp: Date.now().toString(),
      },
    });
  };

  if (isLoading) {
    return <LoadingCard statusText={t('nutrition.loading')} />;
  }

  if (error) {
    return <ErrorCard message={error} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* **Header with Functional Calendar** */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Eyebrow>{t('nutrition.eyebrow')}</Eyebrow>
            <Display size="xl" style={styles.headerTitle}>
              {t('nutrition.title')}
            </Display>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {formatFullDate(selectedDate)}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[
              styles.calendarButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={() => setShowCalendar(true)}
          >
            <Calendar size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* **NEW: Full Calendar Modal** */}
        <DatePickerModal
          visible={showCalendar}
          selectedDate={selectedDate}
          onClose={() => setShowCalendar(false)}
          onSelectDate={selectDate}
          onSelectToday={selectToday}
          onSelectYesterday={selectYesterday}
          onSelectWeekAgo={selectWeekAgo}
        />

        {/* **Mobile-Optimized Daily Overview** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Target size={18} color={colors.primary} />
              <Display size="md" color={colors.textPrimary}>
                {t('nutrition.summary', {
                  label: formatRelativeDate(selectedDate),
                })}
              </Display>
            </View>
            <TouchableOpacity onPress={() => setShowTdeeTooltip(true)}>
              <HelpCircle size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <ProgressBar
              percentage={nutritionStats.calories.safePercent}
              color={colors.primary}
              size="large"
            >
              <View style={styles.caloriesContent}>
                <Display size="lg" color={colors.textPrimary}>
                  {Math.round(intake.calories)}
                </Display>
                <ThemedText type="muted">{t('nutrition.kcal')}</ThemedText>
                <ThemedText type="caption" style={{ color: colors.primary }}>
                  {t('nutrition.remaining', {
                    count: nutritionStats.calories.remaining,
                  })}
                </ThemedText>
              </View>
            </ProgressBar>

            {/* **Mobile-Optimized Macros Grid** */}
            <View style={styles.macrosGrid}>
              {macroKeys.map((key) => {
                const stat = nutritionStats[key];
                return (
                  <MacroCard
                    key={stat.key}
                    title={stat.title}
                    current={stat.current}
                    target={stat.target}
                    unit={stat.unit}
                    percentage={stat.safePercent}
                    color={stat.color}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* **Water Intake with 4 Options** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Droplets size={18} color={colors.accent} />
              <Display size="md" color={colors.textPrimary}>
                {t('nutrition.waterTitle')}
              </Display>
            </View>
          </View>

          <WaterSection
            current={nutritionStats.water.current}
            target={nutritionStats.water.target}
            percentage={nutritionStats.water.safePercent}
            loading={loadingWater}
            error={errorWater}
            onAdd={addWater}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
            showCelebration={showCelebration}
          />
        </View>

        {/* **Camera-Only Quick Add** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <LucideCamera size={18} color={colors.primary} />
              <Display size="md" color={colors.textPrimary}>
                {t('nutrition.quickAddTitle')}
              </Display>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleQuickAdd}
            style={[
              styles.quickAddContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View
              style={[styles.quickAddIcon, { backgroundColor: colors.primary }]}
            >
              <Camera size={20} color="#fff" />
            </View>
            <View style={styles.quickAddText}>
              <ThemedText type="body" bold>
                {t('nutrition.quickAddHeading')}
              </ThemedText>
              <ThemedText type="muted">
                {t('nutrition.quickAddSubtitle')}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* **Today's Meals with Delete & AI Badge** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Clock size={18} color={colors.secondary} />
              <Display size="md" color={colors.textPrimary}>
                {t('nutrition.mealsTitle', {
                  label: formatRelativeDate(selectedDate),
                })}
              </Display>
            </View>
            <TouchableOpacity
              style={[
                styles.sectionAction,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
              onPress={handleQuickAdd}
            >
              <Plus size={16} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          <View>
            {meals.length > 0 ? (
              meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onPress={() => console.log('Meal pressed:', meal.foodName)}
                  onDelete={deleteMeal}
                />
              ))
            ) : (
              <EmptyState
                icon={AlertCircle}
                color={colors.secondary}
                title={t('nutrition.mealsEmptyTitle')}
                message={t('nutrition.mealsEmptyMessage')}
              />
            )}
          </View>
        </View>

        {/* **Weekly Progress** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <TrendingUp size={18} color={colors.primary} />
              <Display size="md" color={colors.textPrimary}>
                {t('nutrition.weeklyTitle')}
              </Display>
            </View>
          </View>
          <WeeklyProgress
            data={weeklyProgress}
            target={nutritionStats.calories.target}
          />
        </View>

        {/* **Insights** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Award size={18} color={colors.accent} />
              <Display size="md" color={colors.textPrimary}>
                {t('nutrition.insightsTitle')}
              </Display>
            </View>
          </View>

          <View style={styles.insightsContainer}>
            {macroNutritionInsights.length > 0 ? (
              macroNutritionInsights.map((insight, index) => (
                <InsightCard key={index} {...insight} />
              ))
            ) : (
              <EmptyState
                icon={AlertCircle}
                title={t('nutrition.insightsEmptyTitle')}
                message={t('nutrition.insightsEmptyMessage')}
              />
            )}
          </View>
        </View>

        {/* **TDEE Tooltip Modal** */}
        <TdeeInfoModal
          visible={showTdeeTooltip}
          onClose={() => setShowTdeeTooltip(false)}
          profile={userProfile}
          tdee={macroNutritionTargets.calories}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    marginBottom: 2,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionAction: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#3C2814',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  caloriesContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  macrosGrid: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  // **Camera-Only Quick Add**
  quickAddContainer: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#3C2814',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  quickAddIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddText: {
    gap: spacing.xs,
    flex: 1,
  },
  insightsContainer: {
    gap: spacing.md,
  },
});
