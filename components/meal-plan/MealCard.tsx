//components/meal-plan/MealCard.tsx
// Enhanced meal card with regeneration functionality
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Flame,
  TrendingUp,
  Clock,
  CircleAlert as AlertCircle,
  Plus,
  CircleCheck as CheckCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, shadows, type Colors } from '@/lib/theme/index';
import { colors as palette } from '@/lib/theme/index';
import { Meal } from '@/lib/meal-plan/types';
import { QualityIndicator } from './QualityIndicator';
import { getQualityMetrics } from '@/lib/meal-plan/ai-generation';

interface MealCardProps {
  meal: Meal;
  mealType: string;
  onPress: (meal: Meal) => void;
  onAddToShopping: (ingredients: string[]) => void;
  onRegenerate?: (mealType: string) => void; // ✅ NEW
  isRegenerating?: boolean; // ✅ NEW
  regenerationAttempts?: number; // ✅ NEW
}

export default function MealCard({
  meal,
  mealType,
  onPress,
  onAddToShopping,
  onRegenerate,
  isRegenerating = false,
  regenerationAttempts = 0,
}: MealCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleAddToShopping = (e: any) => {
    e.stopPropagation(); // Prevent card press
    if (meal.missingIngredients && meal.missingIngredients.length > 0) {
      onAddToShopping(meal.missingIngredients);
    }
  };

  const handleRegenerate = (e: any) => {
    e.stopPropagation(); // Prevent card press
    if (onRegenerate && !isRegenerating) {
      onRegenerate(mealType.toLowerCase());
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 50) return colors.warning;
    return colors.error;
  };

  const getMatchBadgeStyle = (percentage: number) => {
    if (percentage >= 80) return styles.perfectMatch;
    if (percentage >= 50) return styles.goodMatch;
    return styles.lowMatch;
  };

  const getMatchTextStyle = (percentage: number) => {
    if (percentage >= 80) return styles.perfectMatchText;
    if (percentage >= 50) return styles.goodMatchText;
    return styles.lowMatchText;
  };

  return (
    <TouchableOpacity
      style={[styles.mealCard, isRegenerating && styles.regeneratingCard]}
      onPress={() => onPress(meal)}
      activeOpacity={0.7}
      disabled={isRegenerating}
    >
      {/* Loading Overlay */}
      {isRegenerating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Generating new {mealType.toLowerCase()}...
          </Text>
        </View>
      )}

      <View style={styles.mealCardHeader}>
        <View style={styles.mealTimeContainer}>
          <Text style={styles.mealEmoji}>{meal.emoji}</Text>
          <View style={styles.mealInfo}>
            <View style={styles.mealTypeRow}>
              <Text style={styles.mealTime}>{mealType}</Text>
              {meal.source === 'ai_generated' && (
                <View style={styles.aiGeneratedBadge}>
                  <Sparkles size={12} color={palette.accent[600]} />
                  <Text style={styles.aiGeneratedText}>AI</Text>
                </View>
              )}
              {regenerationAttempts > 0 && (
                <View style={styles.regenerationBadge}>
                  <Text style={styles.regenerationText}>
                    v{regenerationAttempts + 1}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.mealName} numberOfLines={2}>
              {meal.name}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View
            style={[
              styles.mealMatchBadge,
              getMatchBadgeStyle(meal.matchPercentage || 0),
            ]}
          >
            {(meal.matchPercentage || 0) >= 80 && (
              <CheckCircle
                size={12}
                color={palette.success[600]}
                style={styles.matchIcon}
              />
            )}
            <Text
              style={[
                styles.mealMatchText,
                getMatchTextStyle(meal.matchPercentage || 0),
              ]}
            >
              {meal.pantryMatch}/{meal.totalIngredients}
            </Text>
          </View>

          {/* ✅ NEW: Regenerate Button */}
          {onRegenerate && (
            <TouchableOpacity
              style={[
                styles.regenerateButton,
                isRegenerating && styles.regenerateButtonDisabled,
              ]}
              onPress={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw
                size={16}
                color={
                  isRegenerating ? palette.neutral[400] : palette.primary[600]
                }
              />
            </TouchableOpacity>
          )}
          <QualityIndicator meal={meal} showDetails={true} />
        </View>
      </View>

      <View style={styles.mealStats}>
        <View style={styles.mealStatItem}>
          <Flame size={14} color={colors.warning} />
          <Text style={styles.mealStatText}>{meal.calories} cal</Text>
        </View>
        <View style={styles.mealStatItem}>
          <TrendingUp size={14} color={colors.success} />
          <Text style={styles.mealStatText}>{meal.protein}g protein</Text>
        </View>
        <View style={styles.mealStatItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.mealStatText}>{meal.prepTime} min</Text>
        </View>
      </View>

      {/* Match percentage bar */}
      <View style={styles.matchProgressContainer}>
        <View style={styles.matchProgressBackground}>
          <View
            style={[
              styles.matchProgressFill,
              {
                width: `${meal.matchPercentage || 0}%`,
                backgroundColor: getMatchColor(meal.matchPercentage || 0),
              },
            ]}
          />
        </View>
        <Text style={styles.matchPercentageText}>
          {Math.round(meal.matchPercentage || 0)}% match
        </Text>
      </View>

      {meal.missingIngredients && meal.missingIngredients.length > 0 && (
        <TouchableOpacity
          style={styles.missingAlert}
          onPress={handleAddToShopping}
          activeOpacity={0.7}
        >
          <AlertCircle size={16} color={palette.warning[600]} />
          <View style={styles.missingContent}>
            <Text style={styles.missingTitle}>Missing Ingredients:</Text>
            <Text style={styles.missingText} numberOfLines={2}>
              {meal.missingIngredients.slice(0, 3).join(', ')}
              {meal.missingIngredients.length > 3 &&
                ` +${meal.missingIngredients.length - 3} more`}
            </Text>
          </View>
          <Plus size={16} color={palette.warning[600]} />
        </TouchableOpacity>
      )}

      {/* Tags */}
      {meal.tags && meal.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {meal.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    mealCard: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    regeneratingCard: {
      opacity: 0.7,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius.lg,
      zIndex: 10,
    },
    loadingText: {
      fontSize: 14,
      color: palette.primary[600],
      marginTop: spacing.md,
      fontWeight: '500',
    },
    mealCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    mealTimeContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    mealEmoji: {
      fontSize: 32,
      marginRight: spacing.md,
    },
    mealInfo: {
      flex: 1,
    },
    mealTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    mealTime: {
      fontSize: 14,
      color: colors.textSecondary,
      textTransform: 'capitalize',
      marginRight: spacing.sm,
    },
    aiGeneratedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.accent[50],
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
      marginRight: spacing.sm,
    },
    aiGeneratedText: {
      fontSize: 12,
      color: palette.accent[700],
      fontWeight: '600',
      marginLeft: 2,
    },
    regenerationBadge: {
      backgroundColor: palette.primary[50],
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
    },
    regenerationText: {
      fontSize: 12,
      color: palette.primary[700],
      fontWeight: '600',
    },
    mealName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 18 * 1.2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    mealMatchBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.warning[50],
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 12,
      minWidth: 60,
    },
    perfectMatch: {
      backgroundColor: palette.success[50],
    },
    goodMatch: {
      backgroundColor: palette.warning[50],
    },
    lowMatch: {
      backgroundColor: palette.error[50],
    },
    matchIcon: {
      marginRight: spacing.xs,
    },
    mealMatchText: {
      fontSize: 14,
      color: palette.warning[700],
      fontWeight: '600',
    },
    perfectMatchText: {
      color: palette.success[700],
    },
    goodMatchText: {
      color: palette.warning[700],
    },
    lowMatchText: {
      color: palette.error[700],
    },
    regenerateButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: palette.primary[50],
      justifyContent: 'center',
      alignItems: 'center',
    },
    regenerateButtonDisabled: {
      backgroundColor: palette.neutral[100],
    },
    mealStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      marginBottom: spacing.md,
    },
    mealStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    mealStatText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    matchProgressContainer: {
      marginBottom: spacing.md,
    },
    matchProgressBackground: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: spacing.xs,
    },
    matchProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    matchPercentageText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    missingAlert: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: palette.warning[50],
      padding: spacing.md,
      borderRadius: 12,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    missingContent: {
      flex: 1,
    },
    missingTitle: {
      fontSize: 14,
      color: palette.warning[700],
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    missingText: {
      fontSize: 14,
      color: palette.warning[700],
      lineHeight: 14 * 1.3,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    tag: {
      backgroundColor: palette.primary[50],
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
    },
    tagText: {
      fontSize: 12,
      color: palette.primary[700],
      fontWeight: '500',
    },
  });
