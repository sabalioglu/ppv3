import { HealthGoalsMacrosKeys } from '@/components/onboarding/OnboardingLists';
import { z } from 'zod';

export interface UserMetrics {
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
}

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

const multipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// Basal Metabolic Rate (BMR)
// Amount of calories your body burns at rest
// Uses Mifflin–St Jeor equation
export const calculateBMR = (metrics: UserMetrics): number => {
  const { age, gender, height_cm, weight_kg } = metrics;

  if (gender === 'male') {
    return 88.362 + 13.397 * weight_kg + 4.799 * height_cm - 5.677 * age;
  } else {
    return 447.593 + 9.247 * weight_kg + 3.098 * height_cm - 4.33 * age;
  }
};

// Daily calories needs including activity level
// Rounded version of TDEE
export const calculateDailyCalories = (
  bmr: number,
  activityLevel: ActivityLevel
): number => {
  return Math.round(bmr * (multipliers[activityLevel] ?? 1.55));
};

// Calculate Total Daily Energy Expenditure
export const calculateTDEE = (
  bmr: number,
  activityLevel: ActivityLevel
): number => {
  return bmr * multipliers[activityLevel];
};

export interface MacroTargets {
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Converts daily calorie target into gram-based macro needs (protein, carbs, fat)
 * using goal-specific macro ratios.
 *
 * Macro calorie values:
 * - Protein: 4 kcal/g
 * - Carbs:   4 kcal/g
 * - Fat:     9 kcal/g
 */

export const calculateMacroTargets = (
  totalCalories: number,
  goal: z.infer<typeof HealthGoalsMacrosKeys> | 'custom',
  customRatios?: { protein: number; carbs: number; fat: number }
) => {
  let proteinRatio = 0.25;
  let carbRatio = 0.45;
  let fatRatio = 0.3;

  switch (goal) {
    case 'weight_loss':
      proteinRatio = 0.3;
      carbRatio = 0.35;
      fatRatio = 0.35;
      break;
    case 'muscle_gain':
      proteinRatio = 0.3;
      carbRatio = 0.45;
      fatRatio = 0.25;
      break;
    case 'maintain_weight':
      proteinRatio = 0.25;
      carbRatio = 0.45;
      fatRatio = 0.3;
      break;
    case 'custom':
      if (customRatios) {
        proteinRatio = customRatios.protein / 100;
        carbRatio = customRatios.carbs / 100;
        fatRatio = customRatios.fat / 100;
      }
      break;
  }

  return {
    protein: Math.round((totalCalories * proteinRatio) / 4),
    carbs: Math.round((totalCalories * carbRatio) / 4),
    fat: Math.round((totalCalories * fatRatio) / 9),
  };
};
