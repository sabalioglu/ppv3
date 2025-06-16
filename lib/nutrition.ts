// Nutrition calculation utilities
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface UserMetrics {
  age: number;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}

// Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
export const calculateBMR = (metrics: UserMetrics): number => {
  const { age, gender, height_cm, weight_kg } = metrics;
  
  if (gender === 'male') {
    return 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age);
  }
};

// Calculate Total Daily Energy Expenditure
export const calculateTDEE = (bmr: number, activityLevel: UserMetrics['activity_level']): number => {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  
  return bmr * multipliers[activityLevel];
};

// Calculate macro distribution based on goals
export const calculateMacroTargets = (
  totalCalories: number,
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain' | 'custom',
  customRatios?: { protein: number; carbs: number; fat: number }
) => {
  let proteinRatio = 0.25;
  let carbRatio = 0.45;
  let fatRatio = 0.30;

  switch (goal) {
    case 'weight_loss':
      proteinRatio = 0.30;
      carbRatio = 0.35;
      fatRatio = 0.35;
      break;
    case 'muscle_gain':
      proteinRatio = 0.30;
      carbRatio = 0.45;
      fatRatio = 0.25;
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
    protein: Math.round((totalCalories * proteinRatio) / 4), // 4 calories per gram
    carbs: Math.round((totalCalories * carbRatio) / 4), // 4 calories per gram
    fat: Math.round((totalCalories * fatRatio) / 9), // 9 calories per gram
  };
};

// Calculate nutrition per 100g from food data
export const calculateNutritionPer100g = (
  nutrition: NutritionData,
  totalWeight: number
): NutritionData => {
  const factor = 100 / totalWeight;
  
  return {
    calories: Math.round(nutrition.calories * factor),
    protein: Math.round(nutrition.protein * factor * 10) / 10,
    carbs: Math.round(nutrition.carbs * factor * 10) / 10,
    fat: Math.round(nutrition.fat * factor * 10) / 10,
    fiber: Math.round(nutrition.fiber * factor * 10) / 10,
    sugar: Math.round(nutrition.sugar * factor * 10) / 10,
    sodium: Math.round(nutrition.sodium * factor * 10) / 10,
  };
};

// Calculate nutrition for specific portion
export const calculatePortionNutrition = (
  nutritionPer100g: NutritionData,
  portionWeight: number
): NutritionData => {
  const factor = portionWeight / 100;
  
  return {
    calories: Math.round(nutritionPer100g.calories * factor),
    protein: Math.round(nutritionPer100g.protein * factor * 10) / 10,
    carbs: Math.round(nutritionPer100g.carbs * factor * 10) / 10,
    fat: Math.round(nutritionPer100g.fat * factor * 10) / 10,
    fiber: Math.round(nutritionPer100g.fiber * factor * 10) / 10,
    sugar: Math.round(nutritionPer100g.sugar * factor * 10) / 10,
    sodium: Math.round(nutritionPer100g.sodium * factor * 10) / 10,
  };
};

// Calculate nutrition score (1-100) based on nutrient density
export const calculateNutritionScore = (nutrition: NutritionData): number => {
  // Higher score for more protein, fiber, lower sugar and sodium
  let score = 50; // Base score
  
  // Protein bonus (up to +20 points)
  score += Math.min(20, nutrition.protein * 2);
  
  // Fiber bonus (up to +15 points)  
  score += Math.min(15, nutrition.fiber * 3);
  
  // Sugar penalty (up to -15 points)
  score -= Math.min(15, nutrition.sugar * 0.5);
  
  // Sodium penalty (up to -20 points)
  score -= Math.min(20, nutrition.sodium * 0.01);
  
  // Ensure score is between 1-100
  return Math.max(1, Math.min(100, Math.round(score)));
};

// Get nutrition insights and recommendations
export const getNutritionInsights = (
  dailyNutrition: NutritionData,
  targets: { calories: number; protein: number; carbs: number; fat: number; fiber: number }
) => {
  const insights = [];
  
  const caloriePercent = (dailyNutrition.calories / targets.calories) * 100;
  const proteinPercent = (dailyNutrition.protein / targets.protein) * 100;
  const carbPercent = (dailyNutrition.carbs / targets.carbs) * 100;
  const fatPercent = (dailyNutrition.fat / targets.fat) * 100;
  const fiberPercent = (dailyNutrition.fiber / targets.fiber) * 100;
  
  if (caloriePercent < 80) {
    insights.push({
      type: 'warning',
      message: 'You may not be eating enough calories today',
      recommendation: 'Consider adding a healthy snack or larger portions'
    });
  } else if (caloriePercent > 110) {
    insights.push({
      type: 'caution',
      message: 'You\'re exceeding your calorie goal',
      recommendation: 'Focus on lower-calorie, nutrient-dense foods'
    });
  }
  
  if (proteinPercent < 70) {
    insights.push({
      type: 'info',
      message: 'Protein intake is below target',
      recommendation: 'Add lean meats, eggs, legumes, or protein powder'
    });
  }
  
  if (fiberPercent < 60) {
    insights.push({
      type: 'info',
      message: 'Fiber intake is low',
      recommendation: 'Include more vegetables, fruits, and whole grains'
    });
  }
  
  return insights;
};

// Food category mapping for AI recognition
export const FOOD_CATEGORIES = {
  'Fruits': ['apple', 'banana', 'orange', 'berries', 'grapes', 'melon'],
  'Vegetables': ['broccoli', 'spinach', 'carrots', 'tomatoes', 'peppers', 'onions'],
  'Proteins': ['chicken', 'beef', 'fish', 'eggs', 'tofu', 'beans'],
  'Grains': ['rice', 'bread', 'pasta', 'oats', 'quinoa', 'cereals'],
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
  'Nuts & Seeds': ['almonds', 'walnuts', 'peanuts', 'chia seeds', 'flax seeds'],
  'Oils & Fats': ['olive oil', 'coconut oil', 'avocado', 'nuts'],
  'Beverages': ['water', 'tea', 'coffee', 'juice', 'smoothies'],
  'Snacks': ['chips', 'crackers', 'cookies', 'candy', 'popcorn'],
  'Condiments': ['salt', 'pepper', 'herbs', 'spices', 'sauces']
};

// Get food category from name
export const getFoodCategory = (foodName: string): string => {
  const lowerName = foodName.toLowerCase();
  
  for (const [category, foods] of Object.entries(FOOD_CATEGORIES)) {
    if (foods.some(food => lowerName.includes(food))) {
      return category;
    }
  }
  
  return 'Other';
};

// Estimate expiry date based on food type
export const estimateExpiryDays = (category: string, location: string): number => {
  const expiryMap: Record<string, Record<string, number>> = {
    'Fruits': { pantry: 7, fridge: 14, freezer: 365 },
    'Vegetables': { pantry: 5, fridge: 14, freezer: 365 },
    'Proteins': { pantry: 1, fridge: 3, freezer: 90 },
    'Dairy': { pantry: 1, fridge: 7, freezer: 30 },
    'Grains': { pantry: 365, fridge: 365, freezer: 730 },
    'Nuts & Seeds': { pantry: 180, fridge: 365, freezer: 730 },
    'Beverages': { pantry: 365, fridge: 365, freezer: 365 },
  };
  
  return expiryMap[category]?.[location] || 30;
};