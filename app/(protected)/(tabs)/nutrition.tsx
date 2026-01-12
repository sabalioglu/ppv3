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
import { spacing, shadows, radius } from '@/lib/theme/index';

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
    macroNutritionTargets
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
    return <LoadingCard statusText="Loading your nutrition data..." />;
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
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <View>
            <ThemedText type="title" bold style={styles.headerTitle}>
              Nutrition Tracker
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.primary }}>
              {formatFullDate(selectedDate)}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[
              styles.calendarButton,
              { backgroundColor: `${colors.primary}20` },
            ]}
            onPress={() => setShowCalendar(true)}
          >
            <Calendar size={24} color={colors.primary} />
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
              <Target size={20} color={colors.primary} />
              <ThemedText type="subtitle" bold>
                {formatRelativeDate(selectedDate)}'s Progress
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => setShowTdeeTooltip(true)}>
              <HelpCircle size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View
            style={[styles.progressCard, { backgroundColor: colors.surface }]}
          >
            <ProgressBar
              percentage={nutritionStats.calories.safePercent}
              color={colors.primary}
              size="large"
            >
              <View style={styles.caloriesContent}>
                <ThemedText type="subtitle" bold>
                  {Math.round(intake.calories)}
                </ThemedText>
                <ThemedText type="muted">calories</ThemedText>
                <ThemedText type="caption" style={{ color: colors.primary }}>
                  {nutritionStats.calories.remaining} left
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
              <Droplets size={20} color={colors.accent} />
              <ThemedText type="subtitle" bold>
                Water Intake
              </ThemedText>
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
              <LucideCamera size={20} color={colors.primary} />
              <ThemedText type="subtitle" bold>
                Quick Add Food
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.quickAddContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.quickAddText}>
              <ThemedText type="body">Scan Food with AI Camera</ThemedText>
              <ThemedText type="muted">
                Take a photo to automatically detect food and calories
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[
                styles.quickAddButton,
                { backgroundColor: `${colors.primary}20` },
              ]}
              onPress={handleQuickAdd}
            >
              <Camera size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* **Today's Meals with Delete & AI Badge** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Clock size={20} color={colors.secondary} />
              <ThemedText type="subtitle" bold>
                {formatRelativeDate(selectedDate)}'s Meals
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[
                styles.sectionAction,
                { backgroundColor: `${colors.secondary}20` },
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
                title="No meals logged"
                message="Start tracking your nutrition!"
              />
            )}
          </View>
        </View>

        {/* **Weekly Progress** */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <TrendingUp size={20} color={colors.primary} />
              <ThemedText type="subtitle" bold>
                Weekly Progress
              </ThemedText>
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
              <Award size={20} color={colors.warning} />
              <ThemedText type="subtitle" bold>
                Insights & Tips
              </ThemedText>
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
                title="No insights available"
                message="Log some meals to get personalized tips!"
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
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
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
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
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
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  quickAddText: {
    gap: spacing.sm,
    marginLeft: spacing.md,
    flex: 1,
  },
  quickAddButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsContainer: {
    gap: spacing.md,
  },
});
