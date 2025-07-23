//components/meal-plan/MealPlanSummary.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target, TrendingUp, ChefHat } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { MealPlan } from '@/lib/meal-plan/types';

interface MealPlanSummaryProps {
  plan: MealPlan['daily'];
}

export default function MealPlanSummary({ plan }: MealPlanSummaryProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Today's Plan</Text>
        <View style={[
          styles.summaryBadge,
          plan.optimizationScore > 70 && styles.optimizedBadge,
          plan.optimizationScore < 40 && styles.lowMatchBadge
        ]}>
          <Text style={styles.summaryBadgeText}>
            {plan.optimizationScore > 70 ? 'Optimized' : 
             plan.optimizationScore > 40 ? 'Good Match' : 
             'Low Match'}
          </Text>
        </View>
      </View>
      
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Target size={20} color={colors.primary[500]} />
          </View>
          <Text style={styles.statValue}>{plan.totalCalories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <TrendingUp size={20} color={colors.success[500]} />
          </View>
          <Text style={styles.statValue}>{plan.totalProtein}g</Text>
          <Text style={styles.statLabel}>Protein</Text>
        </View>

        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <ChefHat size={20} color={colors.accent[500]} />
          </View>
          <Text style={styles.statValue}>{plan.optimizationScore}%</Text>
          <Text style={styles.statLabel}>Match Score</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.neutral[0],
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
  summaryTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral[800],
  },
  summaryBadge: {
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  optimizedBadge: {
    backgroundColor: colors.success[50],
  },
  lowMatchBadge: {
    backgroundColor: colors.error[50],
  },
  summaryBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.lg,
  },
});
