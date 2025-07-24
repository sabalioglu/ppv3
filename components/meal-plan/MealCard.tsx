//components/meal-plan/MealCard.tsx
// Enhanced meal card with regenerate functionality
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Flame, TrendingUp, Clock, AlertCircle, Plus, CheckCircle, RefreshCw } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { Meal } from '@/lib/meal-plan/types';

interface MealCardProps {
  meal: Meal;
  mealType: string;
  onPress: (meal: Meal) => void;
  onAddToShopping: (ingredients: string[]) => void;
  onRegenerate?: (mealType: string) => void; // ✅ NEW: Regenerate function
  isRegenerating?: boolean; // ✅ NEW: Loading state
}

export default function MealCard({ 
  meal, 
  mealType, 
  onPress, 
  onAddToShopping, 
  onRegenerate,
  isRegenerating = false 
}: MealCardProps) {
  const handleAddToShopping = (e: any) => {
    e.stopPropagation();
    if (meal.missingIngredients && meal.missingIngredients.length > 0) {
      onAddToShopping(meal.missingIngredients);
    }
  };

  const handleRegenerate = (e: any) => {
    e.stopPropagation();
    if (onRegenerate && !isRegenerating) {
      onRegenerate(mealType.toLowerCase());
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return colors.success[500];
    if (percentage >= 50) return colors.warning[500];
    return colors.error[500];
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
      style={[styles.mealCard, isRegenerating && styles.mealCardRegenerating]}
      onPress={() => onPress(meal)}
      activeOpacity={0.7}
      disabled={isRegenerating}
    >
      {/* ✅ NEW: Regenerating overlay */}
      {isRegenerating && (
        <View style={styles.regeneratingOverlay}>
          <RefreshCw size={20} color={colors.primary[500]} style={styles.spinningIcon} />
          <Text style={styles.regeneratingText}>Creating new recipe...</Text>
        </View>
      )}

      <View style={styles.mealCardHeader}>
        <View style={styles.mealTimeContainer}>
          <Text style={styles.mealEmoji}>{meal.emoji}</Text>
          <View style={styles.mealInfo}>
            <Text style={styles.mealTime}>{mealType}</Text>
            <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[
            styles.mealMatchBadge,
            getMatchBadgeStyle(meal.matchPercentage || 0)
          ]}>
            {(meal.matchPercentage || 0) >= 80 && (
              <CheckCircle size={12} color={colors.success[600]} style={styles.matchIcon} />
            )}
            <Text style={[
              styles.mealMatchText,
              getMatchTextStyle(meal.matchPercentage || 0)
            ]}>
              {meal.pantryMatch}/{meal.totalIngredients}
            </Text>
          </View>

          {/* ✅ NEW: Regenerate button */}
          {onRegenerate && (
            <TouchableOpacity
              style={[styles.regenerateButton, isRegenerating && styles.regenerateButtonDisabled]}
              onPress={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw 
                size={16} 
                color={isRegenerating ? colors.neutral[400] : colors.primary[600]} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.mealStats}>
        <View style={styles.mealStatItem}>
          <Flame size={14} color={colors.warning[500]} />
          <Text style={styles.mealStatText}>{meal.calories} cal</Text>
        </View>
        <View style={styles.mealStatItem}>
          <TrendingUp size={14} color={colors.success[500]} />
          <Text style={styles.mealStatText}>{meal.protein}g protein</Text>
        </View>
        <View style={styles.mealStatItem}>
          <Clock size={14} color={colors.neutral[500]} />
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
                backgroundColor: getMatchColor(meal.matchPercentage || 0)
              }
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
          <AlertCircle size={16} color={colors.warning[600]} />
          <View style={styles.missingContent}>
            <Text style={styles.missingTitle}>Missing Ingredients:</Text>
            <Text style={styles.missingText} numberOfLines={2}>
              {meal.missingIngredients.slice(0, 3).join(', ')}
              {meal.missingIngredients.length > 3 && ` +${meal.missingIngredients.length - 3} more`}
            </Text>
          </View>
          <Plus size={16} color={colors.warning[600]} />
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

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  mealCardRegenerating: {
    opacity: 0.7,
  },
  regeneratingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.neutral[0] + 'E6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  spinningIcon: {
    // Add rotation animation if needed
  },
  regeneratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
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
  mealTime: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  mealName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    lineHeight: typography.fontSize.lg * 1.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    minWidth: 60,
  },
  perfectMatch: {
    backgroundColor: colors.success[50],
  },
  goodMatch: {
    backgroundColor: colors.warning[50],
  },
  lowMatch: {
    backgroundColor: colors.error[50],
  },
  matchIcon: {
    marginRight: spacing.xs,
  },
  mealMatchText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    fontWeight: '600',
  },
  perfectMatchText: {
    color: colors.success[700],
  },
  goodMatchText: {
    color: colors.warning[700],
  },
  lowMatchText: {
    color: colors.error[700],
  },
  regenerateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  regenerateButtonDisabled: {
    backgroundColor: colors.neutral[100],
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
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  matchProgressContainer: {
    marginBottom: spacing.md,
  },
  matchProgressBackground: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  matchProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  matchPercentageText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'right',
  },
  missingAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  missingContent: {
    flex: 1,
  },
  missingTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[800],
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  missingText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    lineHeight: typography.fontSize.sm * 1.3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontWeight: '500',
  },
});
