export type NutritionInsight = {
  type: 'warning' | 'success' | 'info';
  title: string;
  description?: string;
  value?: string | number;
};

export type NutritionValues = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
};

export type MacroKey = keyof NutritionValues;

export type MacroDefinitionProps = {
  title: string;
  unit: string;
  low: number;
};

export const MACRO_DEFINITIONS = {
  calories: {
    title: 'Calories',
    unit: 'kcal',
    low: 80,
  },
  protein: {
    title: 'Protein',
    unit: 'g',
    low: 70,
  },
  carbs: {
    title: 'Carbohydrates',
    unit: 'g',
    low: 60,
  },
  fat: {
    title: 'Fat',
    unit: 'g',
    low: 50,
  },
  water: {
    title: 'Water',
    unit: 'ml',
    low: 70,
  },
} satisfies Record<MacroKey, MacroDefinitionProps>;

export const getMacroNutritionInsights = (
  intake: NutritionValues,
  targets: NutritionValues
): NutritionInsight[] => {
  const insights: NutritionInsight[] = [];

  (Object.keys(MACRO_DEFINITIONS) as MacroKey[]).forEach((key) => {
    const config = MACRO_DEFINITIONS[key];
    const value = intake[key];
    const target = targets[key];

    if (!target) return;

    const p = rawPercentage(value, target);

    // --- CALORIES (SPECIAL CASE) ---
    if (key === 'calories') {
      if (p < config.low) {
        insights.push({
          type: 'warning',
          title: 'Calorie Intake Low',
          description: `You've consumed ${value} calories `,
          value: `${Math.round(target - value)} cal needed`,
        });
      } else if (p > 110) {
        insights.push({
          type: 'warning',
          title: 'Calorie Goal Exceeded',
          description: `You've consumed ${value} calories `,
          value: `${Math.round(p)}% of target`,
        });
      } else if (p >= 90 && p <= 110) {
        insights.push({
          type: 'success',
          title: 'Calorie Intake On Track 🎯',
          description: 'You are within your daily calorie target',
          value: `${Math.round(p)}% of target`,
        });
      }
      return;
    }

    // --- OTHER MACROS (LOW ONLY) ---
    if (p < config.low) {
      insights.push({
        type: key === 'water' ? 'info' : 'warning',
        title: `${capitalize(key)} Intake Low`,
        description:
          key === 'water'
            ? 'Drink more water to stay hydrated'
            : `Consider adding more ${key}`,
        value: `${Math.round(target - value)}${config.unit} needed`,
      });
    }
  });
  return insights;
};

export const rawPercentage = (value: number, target: number) =>
  target > 0 ? (value / target) * 100 : 0;

export const safePercentage = (value: number, target: number) =>
  target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
