//components/meal-plan/PantryInsights.tsx
// Enhanced pantry insights with better UI and interactions
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, Info, TrendingDown, Package } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { PantryInsight } from '@/lib/meal-plan/types';

interface PantryInsightsProps {
  insights: PantryInsight[];
  onInsightAction?: (insight: PantryInsight) => void;
}

export default function PantryInsights({ insights, onInsightAction }: PantryInsightsProps) {
  // ✅ Icon resolver function
  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'AlertCircle':
        return AlertCircle;
      case 'Info':
        return Info;
      case 'TrendingDown':
        return TrendingDown;
      case 'Package':
        return Package;
      default:
        return Info;
    }
  };

  if (insights.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>🎉 Great Job!</Text>
        <Text style={styles.emptyMessage}>Your pantry is well-organized with no urgent issues.</Text>
      </View>
    );
  }

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'error':
        return styles.errorCard;
      case 'warning':
        return styles.warningCard;
      case 'expiring':
        return styles.expiringCard;
      case 'low_stock':
        return styles.lowStockCard;
      default:
        return styles.suggestionCard;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'error':
        return colors.error[600];
      case 'warning':
        return colors.warning[600];
      case 'expiring':
        return colors.warning[600];
      case 'low_stock':
        return colors.accent[600];
      default:
        return colors.primary[500];
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { style: styles.urgentBadge, text: 'URGENT' };
      case 'high':
        return { style: styles.highBadge, text: 'HIGH' };
      case 'medium':
        return { style: styles.mediumBadge, text: 'MEDIUM' };
      default:
        return null;
    }
  };

  return (
    <View style={styles.insightsSection}>
      <Text style={styles.sectionTitle}>Pantry Insights</Text>
      
      {insights.map((insight, index) => {
        const IconComponent = getIconComponent(insight.icon); // ✅ String'den component'e çevir
        const priorityBadge = getPriorityBadge(insight.priority || 'low');
        
        return (
          <View key={index} style={[styles.insightCard, getInsightStyle(insight.type)]}>
            <View style={styles.insightHeader}>
              <View style={styles.insightTitleRow}>
                {IconComponent && (
                  <IconComponent size={20} color={getIconColor(insight.type)} />
                )}
                <Text style={styles.insightTitle}>{insight.title}</Text>
                {priorityBadge && (
                  <View style={priorityBadge.style}>
                    <Text style={styles.priorityText}>{priorityBadge.text}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.insightContent}>
              <Text style={styles.insightMessage}>{insight.message}</Text>
              
              {insight.items && insight.items.length > 0 && (
                <View style={styles.itemsContainer}>
                  <Text style={styles.itemsLabel}>Items:</Text>
                  {insight.items.map((item, itemIndex) => (
                    <Text key={itemIndex} style={styles.insightItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
              
              {insight.action && insight.actionable && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onInsightAction?.(insight)}
                >
                  <Text style={styles.actionButtonText}>{insight.action}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
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
  emptyState: {
    backgroundColor: colors.success[50],
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.success[800],
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.fontSize.base,
    color: colors.success[700],
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  errorCard: {
    backgroundColor: colors.error[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
  },
  warningCard: {
    backgroundColor: colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  expiringCard: {
    backgroundColor: colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  lowStockCard: {
    backgroundColor: colors.accent[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.accent[500],
  },
  suggestionCard: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  insightHeader: {
    marginBottom: spacing.md,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: colors.error[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  highBadge: {
    backgroundColor: colors.warning[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mediumBadge: {
    backgroundColor: colors.accent[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  insightContent: {
    gap: spacing.sm,
  },
  insightMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    lineHeight: typography.fontSize.sm * 1.4,
  },
  itemsContainer: {
    backgroundColor: colors.neutral[0],
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  itemsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  insightItem: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginLeft: spacing.sm,
    lineHeight: typography.fontSize.sm * 1.3,
  },
  actionButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[0],
    fontWeight: '600',
  },
});
