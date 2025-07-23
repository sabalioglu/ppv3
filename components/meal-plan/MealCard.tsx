//components/meal-plan/MealCard.tsx
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Flame, TrendingUp, Clock, AlertCircle, Plus } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { Meal } from '@/lib/meal-plan/types';

interface MealCardProps {
  meal: Meal;
  mealType: string;
  onPress: (meal: Meal) => void;
  onAddToShopping: (ingredients: string[]) => void;
}

export default function MealCard({ meal, mealType, onPress, onAddToShopping }: MealCardProps) {
  return (
    <TouchableOpacity 
      style={styles.mealCard}
      onPress={() => onPress(meal)}
    >
      <View style={styles.mealCardHeader}>
        <View style={styles.mealTimeContainer}>
          <Text style={styles.mealEmoji}>{meal.emoji}</Text>
          <View>
            <Text style={styles.mealTime}>{mealType}</Text>
            <Text style={styles.mealName}>{meal.name}</Text>
          </View>
        </View>
        
        <View style={[
          styles.mealMatchBadge,
          meal.matchPercentage && meal.matchPercentage > 80 && styles.perfectMatch,
          meal.matchPercentage && meal.matchPercentage < 50 && styles.lowMatch
        ]}>
          <Text style={[
            styles.mealMatchText,
            meal.matchPercentage && meal.matchPercentage > 80 && styles.perfectMatchText
          ]}>
            {meal.pantryMatch}/{meal.totalIngredients}
          </Text>
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
      
      {meal.missingIngredients && meal.missingIngredients.length > 0 && (
        <TouchableOpacity 
          style={styles.missingAlert}
          onPress={() => onAddToShopping(meal.missingIngredients)}
        >
          <AlertCircle size={16} color={colors.warning[600]} />
          <Text style={styles.missingText}>
            Missing: {meal.missingIngredients.join(', ')}
          </Text>
          <Plus size={16} color={colors.warning[600]} />
        </TouchableOpacity>
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
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
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
  },
  mealMatchBadge: {
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  perfectMatch: {
    backgroundColor: colors.success[50],
  },
  lowMatch: {
    backgroundColor: colors.error[50],
  },
  mealMatchText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    fontWeight: '600',
  },
  perfectMatchText: {
    color: colors.success[700],
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
  missingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  missingText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    flex: 1,
  },
});
