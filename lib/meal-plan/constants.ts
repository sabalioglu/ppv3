//lib/meal-plan/constants.ts
// MEAL_DATABASE will go here
import { Meal } from './types';

export const MEAL_DATABASE: Record<string, Meal[]> = {
  breakfast: [
    {
      id: 'breakfast_1',
      name: "Scrambled Eggs with Toast",
      ingredients: [
        { name: "eggs", amount: 2, unit: "pieces", category: "Protein" },
        { name: "butter", amount: 1, unit: "tbsp", category: "Dairy" },
        { name: "bread", amount: 2, unit: "slices", category: "Grains" },
        { name: "salt", amount: 1, unit: "pinch", category: "Condiments" },
        { name: "pepper", amount: 1, unit: "pinch", category: "Condiments" }
      ],
      calories: 350,
      protein: 20,
      carbs: 28,
      fat: 18,
      fiber: 2,
      prepTime: 10,
      cookTime: 5,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍳",
      category: "breakfast",
      tags: ["quick", "protein-rich", "comfort-food"]
    },
    {
      id: 'breakfast_2',
      name: "Oatmeal with Berries",
      ingredients: [
        { name: "oats", amount: 0.5, unit: "cup", category: "Grains" },
        { name: "milk", amount: 1, unit: "cup", category: "Dairy" },
        { name: "berries", amount: 0.5, unit: "cup", category: "Fruits" },
        { name: "honey", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 280,
      protein: 8,
      carbs: 52,
      fat: 4,
      fiber: 8,
      prepTime: 5,
      cookTime: 3,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥣",
      category: "breakfast",
      tags: ["healthy", "fiber-rich", "quick"]
    },
    {
      id: 'breakfast_3',
      name: "Yogurt Parfait",
      ingredients: [
        { name: "yogurt", amount: 1, unit: "cup", category: "Dairy" },
        { name: "granola", amount: 0.25, unit: "cup", category: "Grains" },
        { name: "honey", amount: 1, unit: "tbsp", category: "Condiments" },
        { name: "berries", amount: 0.5, unit: "cup", category: "Fruits" }
      ],
      calories: 320,
      protein: 15,
      carbs: 45,
      fat: 8,
      fiber: 5,
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥛",
      category: "breakfast",
      tags: ["healthy", "no-cook", "protein-rich"]
    }
  ],
  lunch: [
    {
      id: 'lunch_1',
      name: "Chicken Salad",
      ingredients: [
        { name: "chicken", amount: 150, unit: "g", category: "Protein" },
        { name: "lettuce", amount: 2, unit: "cups", category: "Vegetables" },
        { name: "tomatoes", amount: 1, unit: "medium", category: "Vegetables" },
        { name: "cucumber", amount: 0.5, unit: "medium", category: "Vegetables" },
        { name: "olive oil", amount: 2, unit: "tbsp", category: "Condiments" },
        { name: "lemon", amount: 0.5, unit: "piece", category: "Fruits" }
      ],
      calories: 450,
      protein: 35,
      carbs: 12,
      fat: 28,
      fiber: 4,
      prepTime: 15,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥗",
      category: "lunch",
      tags: ["healthy", "low-carb", "fresh"]
    },
    {
      id: 'lunch_2',
      name: "Tuna Sandwich",
      ingredients: [
        { name: "tuna", amount: 1, unit: "can", category: "Protein" },
        { name: "bread", amount: 2, unit: "slices", category: "Grains" },
        { name: "mayonnaise", amount: 2, unit: "tbsp", category: "Condiments" },
        { name: "lettuce", amount: 2, unit: "leaves", category: "Vegetables" },
        { name: "tomatoes", amount: 2, unit: "slices", category: "Vegetables" }
      ],
      calories: 420,
      protein: 30,
      carbs: 32,
      fat: 18,
      fiber: 3,
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥪",
      category: "lunch",
      tags: ["quick", "protein-rich", "portable"]
    },
    {
      id: 'lunch_3',
      name: "Vegetable Stir Fry",
      ingredients: [
        { name: "rice", amount: 1, unit: "cup", category: "Grains" },
        { name: "mixed vegetables", amount: 2, unit: "cups", category: "Vegetables" },
        { name: "soy sauce", amount: 2, unit: "tbsp", category: "Condiments" },
        { name: "garlic", amount: 2, unit: "cloves", category: "Vegetables" },
        { name: "ginger", amount: 1, unit: "tsp", category: "Condiments" },
        { name: "oil", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 380,
      protein: 12,
      carbs: 68,
      fat: 8,
      fiber: 6,
      prepTime: 20,
      cookTime: 15,
      servings: 1,
      difficulty: "Medium",
      emoji: "🍜",
      category: "lunch",
      tags: ["vegetarian", "healthy", "filling"]
    }
  ],
  dinner: [
    {
      id: 'dinner_1',
      name: "Grilled Chicken with Vegetables",
      ingredients: [
        { name: "chicken", amount: 200, unit: "g", category: "Protein" },
        { name: "broccoli", amount: 1, unit: "cup", category: "Vegetables" },
        { name: "carrots", amount: 1, unit: "medium", category: "Vegetables" },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments" },
        { name: "garlic", amount: 2, unit: "cloves", category: "Vegetables" },
        { name: "herbs", amount: 1, unit: "tsp", category: "Condiments" }
      ],
      calories: 550,
      protein: 45,
      carbs: 15,
      fat: 32,
      fiber: 6,
      prepTime: 15,
      cookTime: 25,
      servings: 1,
      difficulty: "Medium",
      emoji: "🍗",
      category: "dinner",
      tags: ["healthy", "high-protein", "low-carb"]
    },
    {
      id: 'dinner_2',
      name: "Pasta Bolognese",
      ingredients: [
        { name: "pasta", amount: 100, unit: "g", category: "Grains" },
        { name: "ground beef", amount: 150, unit: "g", category: "Protein" },
        { name: "tomato sauce", amount: 1, unit: "cup", category: "Condiments" },
        { name: "onion", amount: 0.5, unit: "medium", category: "Vegetables" },
        { name: "garlic", amount: 2, unit: "cloves", category: "Vegetables" },
        { name: "cheese", amount: 30, unit: "g", category: "Dairy" }
      ],
      calories: 650,
      protein: 35,
      carbs: 72,
      fat: 22,
      fiber: 4,
      prepTime: 10,
      cookTime: 25,
      servings: 1,
      difficulty: "Medium",
      emoji: "🍝",
      category: "dinner",
      tags: ["comfort-food", "filling", "family-favorite"]
    },
    {
      id: 'dinner_3',
      name: "Salmon with Quinoa",
      ingredients: [
        { name: "salmon", amount: 180, unit: "g", category: "Protein" },
        { name: "quinoa", amount: 0.5, unit: "cup", category: "Grains" },
        { name: "asparagus", amount: 1, unit: "cup", category: "Vegetables" },
        { name: "lemon", amount: 0.5, unit: "piece", category: "Fruits" },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 520,
      protein: 40,
      carbs: 42,
      fat: 18,
      fiber: 8,
      prepTime: 10,
      cookTime: 25,
      servings: 1,
      difficulty: "Medium",
      emoji: "🐟",
      category: "dinner",
      tags: ["healthy", "omega-3", "balanced"]
    }
  ],
  snacks: [
    {
      id: 'snack_1',
      name: "Apple with Peanut Butter",
      ingredients: [
        { name: "apple", amount: 1, unit: "medium", category: "Fruits" },
        { name: "peanut butter", amount: 2, unit: "tbsp", category: "Protein" }
      ],
      calories: 200,
      protein: 6,
      carbs: 28,
      fat: 8,
      fiber: 5,
      prepTime: 2,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍎",
      category: "snack",
      tags: ["healthy", "quick", "fiber-rich"]
    },
    {
      id: 'snack_2',
      name: "Greek Yogurt",
      ingredients: [
        { name: "greek yogurt", amount: 1, unit: "cup", category: "Dairy" },
        { name: "honey", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 150,
      protein: 15,
      carbs: 20,
      fat: 2,
      fiber: 0,
      prepTime: 1,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥛",
      category: "snack",
      tags: ["protein-rich", "quick", "healthy"]
    },
    {
      id: 'snack_3',
      name: "Mixed Nuts",
      ingredients: [
        { name: "almonds", amount: 10, unit: "pieces", category: "Protein" },
        { name: "walnuts", amount: 5, unit: "pieces", category: "Protein" },
        { name: "cashews", amount: 8, unit: "pieces", category: "Protein" }
      ],
      calories: 180,
      protein: 5,
      carbs: 8,
      fat: 16,
      fiber: 3,
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥜",
      category: "snack",
      tags: ["healthy-fats", "portable", "energy-boost"]
    }
  ]
};

export const INGREDIENT_CATEGORIES = {
  'Protein': ['chicken', 'beef', 'fish', 'eggs', 'tofu', 'beans', 'tuna', 'salmon', 'pork', 'turkey'],
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'mozzarella', 'cheddar', 'parmesan'],
  'Grains': ['rice', 'pasta', 'bread', 'oats', 'quinoa', 'flour', 'cereal', 'noodles'],
  'Vegetables': ['lettuce', 'tomato', 'cucumber', 'carrot', 'broccoli', 'onion', 'garlic', 'pepper', 'spinach'],
  'Fruits': ['apple', 'banana', 'berries', 'orange', 'grapes', 'lemon', 'lime', 'strawberry'],
  'Condiments': ['oil', 'sauce', 'dressing', 'spices', 'herbs', 'salt', 'pepper', 'vinegar', 'honey'],
  'Pantry Staples': ['sugar', 'flour', 'baking powder', 'vanilla', 'stock', 'broth']
};