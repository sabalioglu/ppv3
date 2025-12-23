import { useEffect, useState } from 'react';
import {
  calculateBMR,
  calculateDailyCalories,
  calculateMacroTargets,
} from '@/lib/nutrition/macros';

export const useMacroNutritionTargets = (profile?: any) => {
  const [targets, setTargets] = useState({
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
    bmr: 1500,
  });

  useEffect(() => {
    if (!profile) return;

    const bmr = calculateBMR(profile);
    const calories = calculateDailyCalories(bmr, profile.activity_level);
    const macros = calculateMacroTargets(calories, profile.health_goals?.[0]);

    setTargets({
      calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      bmr,
    });
  }, [profile]);

  return targets;
};
