//components/meal-plan/PantryInsights.tsx
// Pantry insights section component will go here
// components/meal-plan/PantryInsights.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { PantryInsight } from '@/lib/meal-plan/types';

interface PantryInsightsProps {
  insights: PantryInsight[];
}

export default function PantryInsights({ insights }: PantryInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <View style={styles.insightsSection}>
      <Text style={styles.sectionTitle}>Pantry Insights</Text>
      {insights.map((insight, index) => (
        <View key={index} style={[
          styles.insightCard,
          insight.type === 'warning' && styles.warningCard,
          insight.type === 'error' && styles.errorCard
        ]}>
          <insight.icon size={20} color={
            insight.type === 'error' ? colors.error[600] :
            insight.type === 'warning' ? colors.warning[600] :
            colors.primary[500] // ✅ colors.info yerine colors.primary[500]
          } />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightMessage}>{insight.message}</Text>
            {insight.items && (
              <Text style={styles.insightItems}>
                {insight.items.join(', ')}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  insightsSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[0],
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  warningCard: {
    backgroundColor: colors.warning[50],
  },
  errorCard: {
    backgroundColor: colors.error[50],
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  insightMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  insightItems: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
