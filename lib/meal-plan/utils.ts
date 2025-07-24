//lib/meal-plan/utils.ts
// Enhanced utility functions with better fallback handling
import { Meal, PantryItem } from './types';
import { INGREDIENT_CATEGORIES } from './constants';

export const categorizeIngredient = (ingredient: string): string => {
  const ingredientLower = ingredient.toLowerCase().trim();
  
  for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (keywords.some(keyword => 
      ingredientLower.includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(ingredientLower)
    )) {
      return category;
    }
  }
  return 'Other';
};

export const generateFallbackMeal = (mealType: string, pantryItems: PantryItem[] = []): Meal => {
  const fallbacks: Record<string, Meal> = {
    breakfast: {
      id: 'fallback_breakfast',
      name: "Simple Toast and Eggs",
      ingredients: [
        { name: "bread", amount: 2, unit: "slices", category: "Grains" },
        { name: "eggs", amount: 2, unit: "pieces", category: "Protein" },
        { name: "butter", amount: 1, unit: "tbsp", category: "Dairy" }
      ],
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
      ingredients: [
        { name: "lettuce", amount: 2, unit: "cups", category: "Vegetables" },
        { name: "tomatoes", amount: 1, unit: "medium", category: "Vegetables" },
        { name: "cucumber", amount: 0.5, unit: "medium", category: "Vegetables" },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments" },
        { name: "salt", amount: 1, unit: "pinch", category: "Condiments" }
      ],
      calories: 350,
      protein: 10,
      carbs: 20,
      fat: 25,
      fiber: 5,
      pantryMatch: 0,
      totalIngredients: 5,
      missingIngredients: ["lettuce", "tomatoes", "cucumber", "olive oil"],
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
      ingredients: [
        { name: "pasta", amount: 100, unit: "g", category: "Grains" },
        { name: "tomato sauce", amount: 0.5, unit: "cup", category: "Condiments" },
        { name: "cheese", amount: 30, unit: "g", category: "Dairy" },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
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
    },
    snack: {
      id: 'fallback_snack',
      name: "Fresh Fruit",
      ingredients: [
        { name: "apple", amount: 1, unit: "medium", category: "Fruits" }
      ],
      calories: 80,
      protein: 1,
      carbs: 20,
      fat: 0,
      fiber: 3,
      pantryMatch: 0,
      totalIngredients: 1,
      missingIngredients: ["apple"],
      allergenSafe: true,
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍎",
      category: "snack",
      tags: ["healthy", "quick"],
      matchPercentage: 0
    }
  };
  
  const fallbackMeal = fallbacks[mealType] || fallbacks.lunch;
  
  // Check pantry match for fallback meal if pantry items provided
  if (pantryItems.length > 0) {
    const availableIngredients = fallbackMeal.ingredients.filter(ingredient =>
      pantryItems.some(item => 
        item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(item.name.toLowerCase())
      )
    );
    
    const missingIngredients = fallbackMeal.ingredients
      .filter(ingredient => !availableIngredients.includes(ingredient))
      .map(ingredient => ingredient.name);
    
    fallbackMeal.pantryMatch = availableIngredients.length;
    fallbackMeal.missingIngredients = missingIngredients;
    fallbackMeal.matchPercentage = fallbackMeal.totalIngredients > 0 
      ? (availableIngredients.length / fallbackMeal.totalIngredients) * 100 
      : 0;
  }
  
  return fallbackMeal;
};

export const generateFallbackSnacks = (pantryItems: PantryItem[] = []): Meal[] => {
  const baseSnacks = [
    {
      id: 'fallback_snack_1',
      name: "Fresh Fruit",
      ingredients: [
        { name: "apple", amount: 1, unit: "medium", category: "Fruits" }
      ],
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
      name: "Mixed Nuts",
      ingredients: [
        { name: "almonds", amount: 10, unit: "pieces", category: "Protein" },
        { name: "walnuts", amount: 5, unit: "pieces", category: "Protein" }
      ],
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

  // Add pantry matching to snacks
  return baseSnacks.map(snack => {
    if (pantryItems.length > 0) {
      const availableIngredients = snack.ingredients.filter(ingredient =>
        pantryItems.some(item => 
          item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
          ingredient.name.toLowerCase().includes(item.name.toLowerCase())
        )
      );
      
      const missingIngredients = snack.ingredients
        .filter(ingredient => !availableIngredients.includes(ingredient))
        .map(ingredient => ingredient.name);
      
      return {
        ...snack,
        pantryMatch: availableIngredients.length,
        totalIngredients: snack.ingredients.length,
        missingIngredients,
        matchPercentage: snack.ingredients.length > 0 
          ? (availableIngredients.length / snack.ingredients.length) * 100 
          : 0,
        allergenSafe: true
      };
    }
    
    return {
      ...snack,
      pantryMatch: 0,
      totalIngredients: snack.ingredients.length,
      missingIngredients: snack.ingredients.map(ing => ing.name),
      matchPercentage: 0,
      allergenSafe: true
    };
  });
};

export const generateFallbackPlan = (pantryItems: PantryItem[] = []) => {
  const breakfast = generateFallbackMeal('breakfast', pantryItems);
  const lunch = generateFallbackMeal('lunch', pantryItems);
  const dinner = generateFallbackMeal('dinner', pantryItems);
  const snacks = generateFallbackSnacks(pantryItems);

  const totalCalories = breakfast.calories + lunch.calories + dinner.calories + 
                       snacks.reduce((sum, snack) => sum + snack.calories, 0);
  
  const totalProtein = breakfast.protein + lunch.protein + dinner.protein + 
                      snacks.reduce((sum, snack) => sum + snack.protein, 0);

  const avgMatchPercentage = [breakfast, lunch, dinner, ...snacks]
    .reduce((sum, meal) => sum + (meal.matchPercentage || 0), 0) / 
    (3 + snacks.length);

  return {
    daily: {
      breakfast,
      lunch,
      dinner,
      snacks,
      totalCalories,
      totalProtein,
      optimizationScore: Math.round(avgMatchPercentage)
    }
  };
};

export const formatNutritionValue = (value: number, unit: string = ''): string => {
  if (value < 1) {
    return `${(value * 1000).toFixed(0)}m${unit}`;
  }
  return `${value.toFixed(1)}${unit}`;
};

export const calculateMealTotalTime = (prepTime: number, cookTime: number): number => {
  return prepTime + cookTime;
};

export const getMealDifficultyColor = (difficulty: string): string => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return '#10B981'; // green
    case 'medium':
      return '#F59E0B'; // yellow
    case 'hard':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};

export const filterMealsByDietary = (meals: Meal[], restrictions: string[]): Meal[] => {
  if (!restrictions.length) return meals;
  
  return meals.filter(meal => {
    return !restrictions.some(restriction => {
      const restrictionLower = restriction.toLowerCase();
      
      return meal.ingredients.some(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        
        // Vegetarian restrictions
        if (restrictionLower.includes('vegetarian')) {
          return ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna'].includes(ingredientName);
        }
        
        // Vegan restrictions
        if (restrictionLower.includes('vegan')) {
          return ['milk', 'cheese', 'yogurt', 'butter', 'eggs', 'chicken', 'beef'].includes(ingredientName);
        }
        
        // Gluten-free restrictions
        if (restrictionLower.includes('gluten')) {
          return ['bread', 'pasta', 'flour', 'wheat'].includes(ingredientName);
        }
        
        return ingredientName.includes(restrictionLower);
      });
    });
  });
};
