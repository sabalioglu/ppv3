// lib/meal-plan/types/ai-recipe-types.ts (YENİ DOSYA)
export interface AIRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: AIIngredient[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tags: string[];
  cuisine: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  pantryMatch: number; // 0-100
  missingIngredients: string[];
  compatibilityScore: number;
  source: 'ai-generated';
  createdAt: Date;
}

export interface AIIngredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
  isOptional?: boolean;
  substitutes?: string[];
}

export interface AIRecipeRequest {
  pantryItems: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  maxCookingTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  dietaryRestrictions: string[];
  allergies: string[];
  calorieTarget?: number;
  nutritionalGoals?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  avoidIngredients?: string[];
  preferredIngredients?: string[];
  userGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health';
}

export interface AIRecipeResponse {
  recipe: AIRecipe;
  confidence: number;
  reasoning: string;
  alternatives?: AIRecipe[];
}
