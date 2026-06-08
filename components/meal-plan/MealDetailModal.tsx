//components/meal-plan/MealDetailModal.tsx
// Modal component will go here
import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, type Colors } from '@/lib/theme/index';
import { colors as palette } from '@/lib/theme/index';
import { Meal } from '@/lib/meal-plan/types';

interface MealDetailModalProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
  onViewRecipe: (meal: Meal) => void;
  onAddToNutrition: (meal: Meal) => void;
  onAddToShopping: (ingredients: string[]) => void;
}

export default function MealDetailModal({
  visible,
  meal,
  onClose,
  onViewRecipe,
  onAddToNutrition,
  onAddToShopping,
}: MealDetailModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!meal) return null;

  const handleAddToNutrition = () => {
    onAddToNutrition(meal);
  };

  const handleViewRecipe = () => {
    onViewRecipe(meal);
  };

  const handleAddToShopping = () => {
    if (meal.missingIngredients && meal.missingIngredients.length > 0) {
      onAddToShopping(meal.missingIngredients);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalEmoji}>{meal.emoji}</Text>
              <View>
                <Text style={styles.modalMealType}>{meal.category}</Text>
                <Text style={styles.modalTitle}>{meal.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Nutrition Summary */}
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.prepTime} min</Text>
                <Text style={styles.nutritionLabel}>Prep Time</Text>
              </View>
            </View>
          </View>

          {/* Pantry Match Section */}
          <View style={styles.pantryMatchSection}>
            <View style={styles.pantryMatchHeader}>
              <Text style={styles.sectionTitle}>Pantry Analysis</Text>
              <View style={styles.matchPercentageContainer}>
                <Text style={styles.matchPercentage}>
                  {Math.round(meal.matchPercentage || 0)}%
                </Text>
                <Text style={styles.matchLabel}>Match</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${meal.matchPercentage || 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {meal.pantryMatch || 0} of {meal.totalIngredients || 0}{' '}
                ingredients
              </Text>
            </View>

            {/* Available Ingredients */}
            {meal.ingredients && (
              <View style={styles.ingredientSection}>
                <Text style={styles.ingredientSectionTitle}>
                  📦 All Ingredients:
                </Text>
                <View style={styles.ingredientsList}>
                  {meal.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <View
                        style={[
                          styles.ingredientDot,
                          !meal.missingIngredients?.includes(ingredient.name) &&
                            styles.availableDot,
                        ]}
                      />
                      <Text
                        style={[
                          styles.ingredientText,
                          !meal.missingIngredients?.includes(ingredient.name) &&
                            styles.availableText,
                        ]}
                      >
                        {ingredient.name} ({ingredient.amount} {ingredient.unit}
                        )
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Missing Ingredients */}
            {meal.missingIngredients && meal.missingIngredients.length > 0 && (
              <View style={styles.missingSection}>
                <Text style={styles.missingSectionTitle}>🛒 Need to Buy:</Text>
                <View style={styles.missingList}>
                  {meal.missingIngredients.map((ingredient, index) => (
                    <View key={index} style={styles.missingItem}>
                      <Text style={styles.missingItemText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewRecipe}
            >
              <Text style={styles.primaryButtonText}>View Full Recipe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleAddToNutrition}
            >
              <Text style={styles.secondaryButtonText}>
                Add to Today's Nutrition
              </Text>
            </TouchableOpacity>

            {meal.missingIngredients && meal.missingIngredients.length > 0 && (
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={handleAddToShopping}
              >
                <Text style={styles.outlineButtonText}>
                  Add Missing to Shopping
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: spacing.lg,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    modalEmoji: {
      fontSize: 32,
      marginRight: spacing.md,
    },
    modalMealType: {
      fontSize: 14,
      color: colors.textSecondary,
      textTransform: 'capitalize',
      marginBottom: spacing.xs,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nutritionCard: {
      backgroundColor: colors.background,
      margin: spacing.lg,
      padding: spacing.lg,
      borderRadius: 16,
    },
    nutritionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    nutritionItem: {
      alignItems: 'center',
    },
    nutritionValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    nutritionLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    pantryMatchSection: {
      margin: spacing.lg,
      marginTop: 0,
    },
    pantryMatchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    matchPercentageContainer: {
      alignItems: 'center',
    },
    matchPercentage: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.primary[600],
    },
    matchLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    progressBarContainer: {
      marginBottom: spacing.xl,
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    ingredientSection: {
      marginBottom: spacing.xl,
    },
    ingredientSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    ingredientsList: {
      gap: spacing.sm,
    },
    ingredientItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    ingredientDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: palette.error[500],
      marginRight: spacing.md,
    },
    availableDot: {
      backgroundColor: colors.success,
    },
    ingredientText: {
      fontSize: 16,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    availableText: {
      color: colors.textPrimary,
      textDecorationLine: 'none',
    },
    missingSection: {
      backgroundColor: palette.warning[50],
      padding: spacing.lg,
      borderRadius: 12,
      marginTop: spacing.lg,
    },
    missingSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.warning[700],
      marginBottom: spacing.md,
    },
    missingList: {
      gap: spacing.sm,
    },
    missingItem: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: 8,
    },
    missingItemText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    modalActions: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textOnPrimary,
    },
    secondaryButton: {
      backgroundColor: colors.success,
      padding: spacing.lg,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textOnPrimary,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
      padding: spacing.lg,
      borderRadius: 12,
      alignItems: 'center',
    },
    outlineButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.primary[600],
    },
  });
