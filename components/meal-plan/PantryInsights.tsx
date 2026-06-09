//components/meal-plan/PantryInsights.tsx
// Collapsible pantry insights with dropdown functionality
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  AlertCircle,
  Info,
  TrendingDown,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  spacing,
  shadows,
  colors as palette,
  type Colors,
} from '@/lib/theme/index';
import { PantryInsight } from '@/lib/meal-plan/types';

interface PantryInsightsProps {
  insights: PantryInsight[];
  onInsightAction?: (insight: PantryInsight) => void;
}

export default function PantryInsights({
  insights,
  onInsightAction,
}: PantryInsightsProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [isExpanded, setIsExpanded] = useState(false);

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
        <Text style={styles.emptyTitle}>Great Job!</Text>
        <Text style={styles.emptyMessage}>
          Your pantry is well-organized with no urgent issues.
        </Text>
      </View>
    );
  }

  // Get summary stats
  const urgentCount = insights.filter((i) => i.priority === 'urgent').length;
  const highCount = insights.filter((i) => i.priority === 'high').length;
  const totalCount = insights.length;

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
        return palette.error[600];
      case 'warning':
        return palette.warning[600];
      case 'expiring':
        return palette.warning[600];
      case 'low_stock':
        return palette.accent[600];
      default:
        return colors.primary;
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
      {/* Collapsible Header */}
      <TouchableOpacity
        style={styles.headerContainer}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.sectionTitle}>Pantry Insights</Text>
          <View style={styles.summaryContainer}>
            {urgentCount > 0 && (
              <View style={styles.urgentSummary}>
                <Text style={styles.urgentSummaryText}>
                  {urgentCount} urgent
                </Text>
              </View>
            )}
            {highCount > 0 && (
              <View style={styles.highSummary}>
                <Text style={styles.highSummaryText}>{highCount} high</Text>
              </View>
            )}
            <Text style={styles.totalSummary}>{totalCount} total</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {isExpanded ? (
            <ChevronUp size={24} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={24} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {insights.map((insight, index) => {
            const IconComponent = getIconComponent(insight.icon);
            const priorityBadge = getPriorityBadge(insight.priority || 'low');

            return (
              <View
                key={index}
                style={[styles.insightCard, getInsightStyle(insight.type)]}
              >
                <View style={styles.insightHeader}>
                  <View style={styles.insightTitleRow}>
                    {IconComponent && (
                      <IconComponent
                        size={20}
                        color={getIconColor(insight.type)}
                      />
                    )}
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    {priorityBadge && (
                      <View style={priorityBadge.style}>
                        <Text style={styles.priorityText}>
                          {priorityBadge.text}
                        </Text>
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
                      <Text style={styles.actionButtonText}>
                        {insight.action}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    insightsSection: {
      marginTop: spacing.lg,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    headerLeft: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    summaryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    urgentSummary: {
      backgroundColor: colors.error,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
    },
    urgentSummaryText: {
      fontSize: 12,
      color: colors.textOnPrimary,
      fontWeight: '600',
    },
    highSummary: {
      backgroundColor: colors.warning,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
    },
    highSummaryText: {
      fontSize: 12,
      color: colors.textOnPrimary,
      fontWeight: '600',
    },
    totalSummary: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    headerRight: {
      marginLeft: spacing.md,
    },
    expandedContent: {
      gap: spacing.md,
    },
    emptyState: {
      backgroundColor: palette.success[50],
      padding: spacing.xl,
      borderRadius: 16,
      alignItems: 'center',
      ...shadows.sm,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.success,
      marginBottom: spacing.sm,
    },
    emptyMessage: {
      fontSize: 16,
      color: palette.success[700],
      textAlign: 'center',
    },
    insightCard: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      ...shadows.sm,
    },
    errorCard: {
      backgroundColor: palette.error[50],
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    warningCard: {
      backgroundColor: palette.warning[50],
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    expiringCard: {
      backgroundColor: palette.warning[50],
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    lowStockCard: {
      backgroundColor: palette.accent[50],
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    suggestionCard: {
      backgroundColor: palette.primary[50],
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
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
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    urgentBadge: {
      backgroundColor: colors.error,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
    },
    highBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
    },
    mediumBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
    },
    priorityText: {
      fontSize: 12,
      color: colors.textOnPrimary,
      fontWeight: '700',
    },
    insightContent: {
      gap: spacing.sm,
    },
    insightMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 14 * 1.4,
    },
    itemsContainer: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: 8,
      marginTop: spacing.sm,
    },
    itemsLabel: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    insightItem: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      lineHeight: 14 * 1.3,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
    },
    actionButtonText: {
      fontSize: 14,
      color: colors.textOnPrimary,
      fontWeight: '600',
    },
  });
