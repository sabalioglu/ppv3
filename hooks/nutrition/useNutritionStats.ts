import { useTheme } from '@/contexts/ThemeContext';
import {
  NutritionValues,
  MACRO_DEFINITIONS,
  MacroKey,
  rawPercentage,
  safePercentage,
} from '@/lib/nutrition/insights';

export type NutritionStat = {
  key: MacroKey;
  title: string;
  unit: string;
  low: number;
  color: string;
  current: number;
  target: number;
  rawPercent: number;
  safePercent: number;
  remaining: number;
};

export const useNutritionStats = (
  intake: NutritionValues,
  targets: NutritionValues
): Record<MacroKey, NutritionStat> => {
  const { colors } = useTheme();

  const colorMap: Record<MacroKey, string> = {
    calories: colors.primary,
    protein: colors.secondary,
    carbs: colors.accent,
    fat: colors.error,
    water: colors.info,
  };

  return (Object.keys(MACRO_DEFINITIONS) as MacroKey[]).reduce((acc, key) => {
    const current = intake[key] ?? 0;
    const target = targets[key] ?? 0;

    acc[key] = {
      key,
      ...MACRO_DEFINITIONS[key],
      color: colorMap[key],
      current,
      target,
      rawPercent: rawPercentage(current, target),
      safePercent: safePercentage(current, target),
      remaining: Math.max(target - current, 0),
    };

    return acc;
  }, {} as Record<MacroKey, NutritionStat>);
};
