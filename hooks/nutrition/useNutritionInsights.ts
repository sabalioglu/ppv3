import { useMemo } from 'react';
import {
  getMacroNutritionInsights,
  NutritionInsight,
  NutritionValues,
} from '@/lib/nutrition/insights';

export const useMacroNutritionInsights = (
  intake: NutritionValues,
  targets: NutritionValues
): NutritionInsight[] => {
  return useMemo(() => {
    if (!intake || !targets) return [];
    return getMacroNutritionInsights(intake, targets);
  }, [intake, targets]);
};
