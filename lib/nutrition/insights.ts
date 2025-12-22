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
};

export const getMacroNutritionInsights = (
  intake: NutritionValues,
  targets: NutritionValues
): NutritionInsight[] => {
  const insights: NutritionInsight[] = [];

  const caloriePercent = (intake.calories / targets.calories) * 100;
  const proteinPercent = (intake.protein / targets.protein) * 100;
  const carbPercent = (intake.carbs / targets.carbs) * 100;
  const fatPercent = (intake.fat / targets.fat) * 100;

  // Calorie Insights
  if (caloriePercent < 80) {
    insights.push({
      title: 'Calorie Intake Low',
      description: `You've consumed ${intake.calories} calories today`,
      type: 'warning',
      value: `${Math.round(targets.calories - intake.calories)} cal needed`,
    });
  } else if (caloriePercent > 110) {
    insights.push({
      title: 'Calorie Goal Exceeded',
      description: `You've consumed ${intake.calories} calories today`,
      type: 'warning',
      value: `${Math.round(caloriePercent)}% of target`,
    });
  } else {
    insights.push({
      title: 'Calorie Intake on Track',
      description: 'You are within your daily calorie target',
      type: 'success',
      value: `${Math.round(caloriePercent)}% of target`,
    });
  }
  // Protein Insights
  if (proteinPercent < 70) {
    insights.push({
      title: 'Protein Intake Low',
      description: 'Consider adding protein-rich foods',
      type: 'warning',
      value: `${Math.round(targets.protein - intake.protein)}g needed`,
    });
  }

  if (carbPercent < 60) {
    insights.push({
      title: 'Carbohydrate Intake Low',
      description: 'Include whole grains, fruits, or starchy vegetables',
      type: 'warning',
      value: `${Math.round(targets.carbs - intake.carbs)}g needed`,
    });
  }

  if (fatPercent < 50) {
    insights.push({
      title: 'Fat Intake Low',
      description: 'Add healthy fats like olive oil, nuts, or avocado',
      type: 'warning',
      value: `${Math.round(targets.fat - intake.fat)}g needed`,
    });
  }

  return insights;
};
