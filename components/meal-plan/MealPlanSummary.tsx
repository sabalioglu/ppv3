//components/meal-plan/MealPlanSummary.tsx
// Enhanced meal plan summary with better calculations and UI
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, TrendingUp, ChefHat, Calendar } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, shadows, type Colors } from '@/lib/theme/index';
import { MealPlan } from '@/lib/meal-plan/types';

interface MealPlanSummaryProps {
  plan: MealPlan['daily'];
  onViewDetails?: () => void;
}

export default function MealPlanSummary({
  plan,
  onViewDetails,
}: MealPlanSummaryProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const getOptimizationColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getOptimizationText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const getCalorieStatus = (calories: number) => {
    if (calories < 1200) return { color: colors.error, text: 'Too Low' };
    if (calories > 2500) return { color: colors.warning, text: 'High' };
    return { color: colors.success, text: 'Good' };
  };

  const getProteinStatus = (protein: number) => {
    if (protein < 50) return { color: colors.error, text: 'Low' };
    if (protein > 150) return { color: colors.warning, text: 'High' };
    return { color: colors.success, text: 'Good' };
  };

  const calorieStatus = getCalorieStatus(plan.totalCalories);
  const proteinStatus = getProteinStatus(plan.totalProtein);

  return (
    <TouchableOpacity
      style={styles.summaryCard}
      onPress={onViewDetails}
      activeOpacity={onViewDetails ? 0.7 : 1}
    >
      <View style={styles.summaryHeader}>
        <View style={styles.titleContainer}>
          <Calendar size={24} color={colors.primary} />
          <Text style={styles.summaryTitle}>Today's Plan</Text>
        </View>
        <View
          style={[
            styles.summaryBadge,
            {
              backgroundColor:
                getOptimizationColor(plan.optimizationScore) + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.summaryBadgeText,
              { color: getOptimizationColor(plan.optimizationScore) },
            ]}
          >
            {getOptimizationText(plan.optimizationScore)}
          </Text>
        </View>
      </View>

      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: calorieStatus.color + '15' },
            ]}
          >
            <Target size={20} color={calorieStatus.color} />
          </View>
          <Text style={styles.statValue}>{plan.totalCalories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={[styles.statStatus, { color: calorieStatus.color }]}>
            {calorieStatus.text}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: proteinStatus.color + '15' },
            ]}
          >
            <TrendingUp size={20} color={proteinStatus.color} />
          </View>
          <Text style={styles.statValue}>{plan.totalProtein}g</Text>
          <Text style={styles.statLabel}>Protein</Text>
          <Text style={[styles.statStatus, { color: proteinStatus.color }]}>
            {proteinStatus.text}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              {
                backgroundColor:
                  getOptimizationColor(plan.optimizationScore) + '15',
              },
            ]}
          >
            <ChefHat
              size={20}
              color={getOptimizationColor(plan.optimizationScore)}
            />
          </View>
          <Text style={styles.statValue}>{plan.optimizationScore}%</Text>
          <Text style={styles.statLabel}>Match Score</Text>
          <Text
            style={[
              styles.statStatus,
              { color: getOptimizationColor(plan.optimizationScore) },
            ]}
          >
            Pantry Match
          </Text>
        </View>
      </View>

      {onViewDetails && (
        <View style={styles.viewDetailsHint}>
          <Text style={styles.viewDetailsText}>Tap to view details</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    summaryCard: {
      backgroundColor: colors.surface,
      padding: spacing.xl,
      marginTop: spacing.lg,
      borderRadius: 20,
      ...shadows.md,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    summaryTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    summaryBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 16,
    },
    summaryBadgeText: {
      fontSize: 14,
      fontWeight: '600',
    },
    summaryStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    statStatus: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    statDivider: {
      width: 1,
      height: 80,
      backgroundColor: colors.divider,
      marginHorizontal: spacing.lg,
    },
    mealBreakdown: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: spacing.lg,
    },
    breakdownTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    mealItems: {
      gap: spacing.sm,
    },
    mealItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: 12,
    },
    mealEmoji: {
      fontSize: 20,
      marginRight: spacing.md,
    },
    mealItemText: {
      fontSize: 16,
      color: colors.textSecondary,
      flex: 1,
    },
    mealCalories: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    viewDetailsHint: {
      marginTop: spacing.md,
      alignItems: 'center',
    },
    viewDetailsText: {
      fontSize: 14,
      color: colors.primary,
      fontStyle: 'italic',
    },
  });
