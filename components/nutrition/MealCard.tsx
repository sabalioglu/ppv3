import React, { FC } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Trash2, Camera, Clock, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import CustomAlert from '@/components/UI/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { shadows, spacing, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '../UI/ThemedText';

export interface Meal {
  id: string;
  mealType: string;
  time: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: 'camera_ai' | 'manual';
}

interface MealCardProps {
  meal: Meal;
  onPress: () => void;
  onDelete: (id: string) => void;
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const round = (value: number) => Math.round(value);

const MacroItem: FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroValue, { backgroundColor: color }]}>
        <ThemedText type="label" bold>
          {round(value)}
        </ThemedText>
      </View>
      <ThemedText type="caption" bold>
        {label}
      </ThemedText>
    </View>
  );
};

// Enhanced meal type badge with colors
const getMealTypeColor = (mealType: string): string[] => {
  const type = mealType.toLowerCase();
  const { colors } = useTheme();
  switch (type) {
    case 'breakfast':
      return [colors.secondary, colors.surface];
    case 'lunch':
      return [colors.accent, colors.surface];
    case 'dinner':
      return [colors.primary, colors.surface];
    case 'snack':
      return [colors.expiryUrgent, colors.surface];
    default:
      return [colors.primary, colors.surface];
  }
};

const MealHeader: FC<{
  meal: Meal;
  onDelete: () => void;
}> = ({ meal, onDelete }) => {
  const { colors } = useTheme();
  const gradientColors = getMealTypeColor(meal.mealType);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1]]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
          style={styles.mealTypeBadge}
        >
          <ThemedText type="label" bold>
            {capitalize(meal.mealType)}
          </ThemedText>
        </LinearGradient>

        <View style={styles.timeContainer}>
          <Clock size={14} color={colors.textSecondary} />
          <ThemedText type="muted">{meal.time}</ThemedText>
        </View>
      </View>

      <View style={styles.headerRight}>
        {meal.source === 'camera_ai' && (
          <View
            style={[styles.aiTag, { backgroundColor: colors.primary + '15' }]}
          >
            <Camera size={14} color={colors.primary} />
            <ThemedText type="caption" style={{ color: colors.primary }}>
              AI Detected
            </ThemedText>
          </View>
        )}

        <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteButton}>
          <Trash2 size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
};

// Calorie display with flame icon
const CalorieDisplay: FC<{ calories: number }> = ({ calories }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.calorieCard, { backgroundColor: colors.primary + '10' }]}
    >
      <Flame size={24} color={colors.primary} fill={colors.primary} />
      <View style={styles.calorieTextContainer}>
        <ThemedText type="title" bold style={{ color: colors.primary }}>
          {round(calories)}
        </ThemedText>
        <ThemedText
          type="label"
          style={{ color: colors.primary, opacity: 0.8 }}
        >
          kcal
        </ThemedText>
      </View>
    </View>
  );
};

/* =====================
   Main Component
===================== */

const MealCard: FC<MealCardProps> = ({ meal, onPress, onDelete }) => {
  const { visible, title, message, buttons, showAlert, hideAlert } =
    useCustomAlert();
  const { colors } = useTheme();

  const handleDelete = () => {
    showAlert(
      'Delete Meal',
      `Are you sure you want to delete ${meal.foodName}?`,
      [
        { text: 'Cancel', onPress: hideAlert },
        {
          text: 'Delete',
          onPress: () => {
            onDelete(meal.id);
            hideAlert();
          },
        },
      ]
    );
  };

  return (
    <>
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={onPress}
        android_ripple={{ color: colors.primary + '20' }}
      >
        <MealHeader meal={meal} onDelete={handleDelete} />

        <View style={styles.contentSection}>
          <View style={styles.foodNameSection}>
            <ThemedText type="subtitle" bold>
              {meal.foodName}
            </ThemedText>
          </View>

          <CalorieDisplay calories={meal.calories} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.macros}>
          <MacroItem
            label="Protein"
            value={meal.protein}
            color={colors.secondary}
          />
          <MacroItem label="Carbs" value={meal.carbs} color={colors.accent} />
          <MacroItem label="Fat" value={meal.fat} color={colors.expiryUrgent} />
        </View>
      </Pressable>

      <CustomAlert
        visible={visible}
        title={title}
        message={message}
        buttons={buttons}
        onClose={hideAlert}
      />
    </>
  );
};

export default MealCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg * 1.5,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealTypeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full ?? radius.lg,
    alignSelf: 'flex-start',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full ?? radius.md,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  contentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  foodNameSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  calorieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  calorieTextContainer: {
    alignItems: 'flex-start',
  },
  divider: {
    height: 2,
    marginBottom: spacing.lg,
    opacity: 0.3,
  },
  macros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  macro: {
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  macroValue: {
    width: 40,
    height: 40,
    padding: spacing.xs,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
