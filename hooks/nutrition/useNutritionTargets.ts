import { useEffect, useState } from 'react';
import {
  calculateBMR,
  calculateDailyCalories,
  calculateMacroTargets,
} from '@/lib/nutrition/macros';
import { UserProfile } from '@/hooks/dashboard/useUserProfile';

export const useMacroNutritionTargets = (profile?: UserProfile | null) => {
  const [targets, setTargets] = useState({
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
    water: 3000,
    bmr: 1500,
  });

  useEffect(() => {
    if (!profile) return;

    const bmr = calculateBMR(profile);
    const calories = calculateDailyCalories(bmr, profile.activity_level);
    const macros = calculateMacroTargets(
      calories,
      profile.health_goals_macros?.[0]
    );
    const water = profile.weight_kg ? profile.weight_kg * 35 : 2000;

    setTargets({
      calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      water,
      bmr,
    });
  }, [profile]);

  return targets;
};
