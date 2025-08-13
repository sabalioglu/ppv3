// lib/meal-plan/utils.ts
// Enhanced utility functions with better fallback handling
import { Meal, PantryItem, MealPlan, Ingredient } from './types';
import { INGREDIENT_CATEGORIES, MEAL_DATABASE } from './constants';

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
      id: 'fallback_breakfast_' + Date.now(),
      name: "Simple Toast and Eggs",
      ingredients: [
        { name: "bread", amount: 2, unit: "slices", category: "Grains", fromPantry: false },
        { name: "eggs", amount: 2, unit: "pieces", category: "Protein", fromPantry: false },
        { name: "butter", amount: 1, unit: "tbsp", category: "Dairy", fromPantry: false }
      ],
      calories: 300,
      protein: 15,
      carbs: 25,
      fat: 12,
      fiber: 2,
      pantryMatch: 0,
      totalIngredients: 3,
      missingIngredients: ["bread", "eggs", "butter"],
      prepTime: 10,
      cookTime: 5,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍞",
      category: "breakfast",
      tags: ["simple", "quick"],
      matchPercentage: 0,
      source: 'database',
      created_at: new Date().toISOString()
    },
    lunch: {
      id: 'fallback_lunch_' + Date.now(),
      name: "Basic Salad",
      ingredients: [
        { name: "lettuce", amount: 2, unit: "cups", category: "Vegetables", fromPantry: false },
        { name: "tomatoes", amount: 1, unit: "medium", category: "Vegetables", fromPantry: false },
        { name: "cucumber", amount: 0.5, unit: "medium", category: "Vegetables", fromPantry: false },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments", fromPantry: false },
        { name: "salt", amount: 1, unit: "pinch", category: "Condiments", fromPantry: false }
      ],
      calories: 350,
      protein: 10,
      carbs: 20,
      fat: 25,
      fiber: 5,
      pantryMatch: 0,
      totalIngredients: 5,
      missingIngredients: ["lettuce", "tomatoes", "cucumber", "olive oil"],
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥗",
      category: "lunch",
      tags: ["healthy", "simple"],
      matchPercentage: 0,
      source: 'database',
      created_at: new Date().toISOString()
    },
    dinner: {
      id: 'fallback_dinner_' + Date.now(),
      name: "Simple Pasta",
      ingredients: [
        { name: "pasta", amount: 100, unit: "g", category: "Grains", fromPantry: false },
        { name: "tomato sauce", amount: 0.5, unit: "cup", category: "Condiments", fromPantry: false },
        { name: "cheese", amount: 30, unit: "g", category: "Dairy", fromPantry: false },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments", fromPantry: false }
      ],
      calories: 500,
      protein: 15,
      carbs: 70,
      fat: 15,
      fiber: 3,
      pantryMatch: 0,
      totalIngredients: 4,
      missingIngredients: ["pasta", "tomato sauce", "cheese"],
      prepTime: 20,
      cookTime: 15,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍝",
      category: "dinner",
      tags: ["comfort", "simple"],
      matchPercentage: 0,
      source: 'database',
      created_at: new Date().toISOString()
    },
    snack: {
      id: 'fallback_snack_' + Date.now(),
      name: "Fresh Fruit",
      ingredients: [
        { name: "apple", amount: 1, unit: "medium", category: "Fruits", fromPantry: false }
      ],
      calories: 80,
      protein: 1,
      carbs: 20,
      fat: 0,
      fiber: 3,
      pantryMatch: 0,
      totalIngredients: 1,
      missingIngredients: ["apple"],
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍎",
      category: "snack",
      tags: ["healthy", "quick"],
      matchPercentage: 0,
      source: 'database',
      created_at: new Date().toISOString()
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
      .filter(ingredient => !availableIngredients.some(avail => avail.name === ingredient.name))
      .map(ingredient => ingredient.name);
    
    // Update fromPantry flag
    fallbackMeal.ingredients.forEach(ingredient => {
      ingredient.fromPantry = availableIngredients.some(avail => avail.name === ingredient.name);
    });
    
    fallbackMeal.pantryMatch = availableIngredients.length;
    fallbackMeal.missingIngredients = missingIngredients;
    fallbackMeal.matchPercentage = fallbackMeal.totalIngredients > 0 
      ? Math.round((availableIngredients.length / fallbackMeal.totalIngredients) * 100)
      : 0;
  }
  
  return fallbackMeal;
};

export const generateFallbackSnacks = (pantryItems: PantryItem[] = []): Meal[] => {
  const baseSnacks: Meal[] = [
    {
      id: 'fallback_snack_1_' + Date.now(),
      name: "Fresh Fruit",
      ingredients: [
        { name: "apple", amount: 1, unit: "medium", category: "Fruits", fromPantry: false }
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
      tags: ["healthy", "quick"],
      source: 'database',
      created_at: new Date().toISOString(),
      pantryMatch: 0,
      totalIngredients: 1,
      missingIngredients: ["apple"],
      matchPercentage: 0
    },
    {
      id: 'fallback_snack_2_' + Date.now() + 1,
      name: "Mixed Nuts",
      ingredients: [
        { name: "almonds", amount: 10, unit: "pieces", category: "Protein", fromPantry: false },
        { name: "walnuts", amount: 5, unit: "pieces", category: "Protein", fromPantry: false }
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
      tags: ["healthy", "protein"],
      source: 'database',
      created_at: new Date().toISOString(),
      pantryMatch: 0,
      totalIngredients: 2,
      missingIngredients: ["almonds", "walnuts"],
      matchPercentage: 0
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
        .filter(ingredient => !availableIngredients.some(avail => avail.name === ingredient.name))
        .map(ingredient => ingredient.name);
      
      // Update fromPantry flag
      snack.ingredients.forEach(ingredient => {
        ingredient.fromPantry = availableIngredients.some(avail => avail.name === ingredient.name);
      });
      
      return {
        ...snack,
        pantryMatch: availableIngredients.length,
        totalIngredients: snack.ingredients.length,
        missingIngredients,
        matchPercentage: snack.ingredients.length > 0 
          ? Math.round((availableIngredients.length / snack.ingredients.length) * 100)
          : 0
      };
    }
    
    return snack;
  });
};

// ✅ Ingredient Diversity Manager to prevent repetition
export class IngredientDiversityManager {
  private usedIngredients: Map<string, number> = new Map();
  private primaryIngredients: Set<string> = new Set();

  // Track ingredients from a generated meal
  trackMeal(meal: Meal | null) {
    if (!meal) return;

    meal.ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      this.usedIngredients.set(name, (this.usedIngredients.get(name) || 0) + 1);

      // Assume primary ingredients are proteins or major vegetables
      if (ingredient.category === 'Protein' || ingredient.category === 'Vegetables') {
        this.primaryIngredients.add(name);
      }
    });
  }

  // Get a list of ingredients to avoid in the next generation
  getAvoidanceList(limit: number = 3): string[] {
    // Sort ingredients by usage count
    const sorted = Array.from(this.usedIngredients.entries())
      .filter(([name]) => this.primaryIngredients.has(name))
      .sort((a, b) => b[1] - a[1]);

    // Return the names of the most used ingredients
    return sorted.slice(0, limit).map(item => item[0]);
  }

  // Reset the manager for a new meal plan
  reset() {
    this.usedIngredients.clear();
    this.primaryIngredients.clear();
  }
}

// ✅ FIXED: Proper return type for generateFallbackPlan
export const generateFallbackPlan = (pantryItems: PantryItem[] = []): MealPlan => {
  console.log('🔄 Generating fallback meal plan...');
  
  const breakfast = generateFallbackMeal('breakfast', pantryItems);
  const lunch = generateFallbackMeal('lunch', pantryItems);
  const dinner = generateFallbackMeal('dinner', pantryItems);
  const snacks = generateFallbackSnacks(pantryItems);

  // Ensure snacks is always an array
  const safeSnacks = Array.isArray(snacks) ? snacks : [];

  const totalCalories = breakfast.calories + lunch.calories + dinner.calories + 
                       safeSnacks.reduce((sum, snack) => sum + snack.calories, 0);
  
  const totalProtein = breakfast.protein + lunch.protein + dinner.protein + 
                      safeSnacks.reduce((sum, snack) => sum + snack.protein, 0);

  const avgMatchPercentage = [breakfast, lunch, dinner, ...safeSnacks]
    .reduce((sum, meal) => sum + (meal.matchPercentage || 0), 0) / 
    (3 + safeSnacks.length);

  return {
    daily: {
      breakfast,
      lunch,
      dinner,
      snacks: safeSnacks,
      totalCalories,
      totalProtein,
      optimizationScore: Math.round(avgMatchPercentage),
      generatedAt: new Date().toISOString(),
      regenerationHistory: {}
    }
  };
};

export const formatNutritionValue = (value: number, unit: string = ''): string => {
  if (value < 1) {
    return `${(value * 1000).toFixed(0)}m${unit}`;
  }
  return `${value.toFixed(1)}${unit}`;
};

export const calculateMealTotalTime = (prepTime: number = 0, cookTime: number = 0): number => {
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
  if (!restrictions || !restrictions.length) return meals;
  
  return meals.filter(meal => {
    return !restrictions.some(restriction => {
      const restrictionLower = restriction.toLowerCase();
      
      return meal.ingredients.some(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        
        // Vegetarian restrictions
        if (restrictionLower.includes('vegetarian')) {
          return ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'lamb', 'turkey'].some(meat => 
            ingredientName.includes(meat)
          );
        }
        
        // Vegan restrictions
        if (restrictionLower.includes('vegan')) {
          return ['milk', 'cheese', 'yogurt', 'butter', 'eggs', 'chicken', 'beef', 'honey', 'cream'].some(animal => 
            ingredientName.includes(animal)
          );
        }
        
        // Gluten-free restrictions
        if (restrictionLower.includes('gluten')) {
          return ['bread', 'pasta', 'flour', 'wheat', 'barley', 'rye'].some(gluten => 
            ingredientName.includes(gluten)
          );
        }
        
        // Dairy-free restrictions
        if (restrictionLower.includes('dairy')) {
          return ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey'].some(dairy => 
            ingredientName.includes(dairy)
          );
        }
        
        // Nut allergies
        if (restrictionLower.includes('nut')) {
          return ['almond', 'walnut', 'cashew', 'peanut', 'pecan', 'hazelnut'].some(nut => 
            ingredientName.includes(nut)
          );
        }
        
        return ingredientName.includes(restrictionLower);
      });
    });
  });
};

// ✅ ADDED: Helper function to validate meal structure
export const validateMealStructure = (meal: any): meal is Meal => {
  return (
    meal &&
    typeof meal === 'object' &&
    typeof meal.id === 'string' &&
    typeof meal.name === 'string' &&
    Array.isArray(meal.ingredients) &&
    typeof meal.calories === 'number'
  );
};

// ✅ ADDED: Calculate meal nutrition totals
export const calculateMealNutritionTotals = (meals: Meal[]): {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
} => {
  return meals.reduce((totals, meal) => ({
    totalCalories: totals.totalCalories + (meal.calories || 0),
    totalProtein: totals.totalProtein + (meal.protein || 0),
    totalCarbs: totals.totalCarbs + (meal.carbs || 0),
    totalFat: totals.totalFat + (meal.fat || 0),
    totalFiber: totals.totalFiber + (meal.fiber || 0)
  }), {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0
  });
};
