//lib > meal-plan > utils.ts
// Utility functions will go here
import { Meal } from './types';
import { INGREDIENT_CATEGORIES } from './constants';

export const categorizeIngredient = (ingredient: string): string => {
  const ingredientLower = ingredient.toLowerCase();
  
  for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (keywords.some(keyword => 
      ingredientLower.includes(keyword) || 
      keyword.includes(ingredientLower)
    )) {
      return category;
    }
  }
  return 'Other';
};

export const generateFallbackMeal = (mealType: string): Meal => {
  const fallbacks: Record<string, Meal> = {
    breakfast: {
      id: 'fallback_breakfast',
      name: "Simple Toast and Eggs",
      ingredients: [],
      calories: 300,
      protein: 15,
      carbs: 25,
      fat: 12,
      fiber: 2,
      pantryMatch: 0,
      totalIngredients: 3,
      missingIngredients: ["bread", "eggs", "butter"],
      allergenSafe: true,
      prepTime: 10,
      cookTime: 5,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍞",
      category: "breakfast",
      tags: ["simple", "quick"],
      matchPercentage: 0
    },
    lunch: {
      id: 'fallback_lunch',
      name: "Basic Salad",
      ingredients: [],
      calories: 350,
      protein: 10,
      carbs: 20,
      fat: 25,
      fiber: 5,
      pantryMatch: 0,
      totalIngredients: 5,
      missingIngredients: ["lettuce", "tomatoes", "cucumber", "dressing"],
      allergenSafe: true,
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥗",
      category: "lunch",
      tags: ["healthy", "simple"],
      matchPercentage: 0
    },
    dinner: {
      id: 'fallback_dinner',
      name: "Simple Pasta",
      ingredients: [],
      calories: 500,
      protein: 15,
      carbs: 70,
      fat: 15,
      fiber: 3,
      pantryMatch: 0,
      totalIngredients: 4,
      missingIngredients: ["pasta", "tomato sauce", "cheese"],
      allergenSafe: true,
      prepTime: 20,
      cookTime: 15,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍝",
      category: "dinner",
      tags: ["comfort", "simple"],
      matchPercentage: 0
    }
  };
  
  return fallbacks[mealType] || fallbacks.lunch;
};

export const generateFallbackSnacks = (): Meal[] => {
  return [
    {
      id: 'fallback_snack_1',
      name: "Fresh Fruit",
      ingredients: [],
      calories: 80,
      protein: 1,
      carbs: 20,
      fat: 0,
      fiber: 3,
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍎",
      category: "snack",
      tags: ["healthy", "quick"]
    },
    {
      id: 'fallback_snack_2',
      name: "Nuts",
      ingredients: [],
      calories: 170,
      protein: 6,
      carbs: 6,
      fat: 15,
      fiber: 3,
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥜",
      category: "snack",
      tags: ["healthy", "protein"]
    }
  ];
};

export const generateFallbackPlan = () => {
  return {
    daily: {
      breakfast: generateFallbackMeal('breakfast'),
      lunch: generateFallbackMeal('lunch'),
      dinner: generateFallbackMeal('dinner'),
      snacks: generateFallbackSnacks(),
      totalCalories: 1400,
      totalProtein: 60,
      optimizationScore: 0
    }
  };
};
