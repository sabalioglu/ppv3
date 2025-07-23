//lib/meal-plan/types.ts
// All TypeScript interfaces will go here
export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

export interface Meal {
  id: string;
  name: string;
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  emoji: string;
  category: string;
  tags: string[];
  // Additional fields for matching
  pantryMatch?: number;
  totalIngredients?: number;
  missingIngredients?: string[];
  matchPercentage?: number;
  allergenSafe?: boolean;
  available?: boolean;
}

export interface PantryItem {
  id: string;              // UUID (string)
  user_id: string;
  name: string;
  brand?: string;          
  category?: string;
  subcategory?: string;    
  quantity: number;        // NUMERIC -> number
  unit?: string;
  barcode?: string;        
  expiry_date?: string;    // Changed from expiration_date
  purchase_date?: string;  
  location?: string;       
  cost?: number;           
  calories_per_100g?: number;  
  protein_per_100g?: number;   
  carbs_per_100g?: number;     
  fat_per_100g?: number;       
  fiber_per_100g?: number;     
  sugar_per_100g?: number;     
  sodium_per_100g?: number;    
  image_url?: string;          
  nutrition_data?: any;        // JSONB
  ai_confidence?: number;      
  is_opened?: boolean;         
  created_at: string;          
  updated_at: string;          
}

export interface PantryMetrics {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  categories: Record<string, number>;
}

export interface PantryComposition {
  categories: Record<string, number>;
  totalItems: number;
  expiringItems: PantryItem[];
  dominantCategories: string[];
  deficientCategories: string[];
  suggestions: string[];
}

export interface PantryInsight {
  type: 'warning' | 'error' | 'suggestion' | 'expiring' | 'expired' | 'low_stock';
  icon?: any;
  title: string;
  message: string;
  items?: string[];
  action?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  actionable?: boolean;
}

export interface MealPlan {
  daily: {
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
    snacks: Meal[];
    totalCalories: number;
    totalProtein: number;
    optimizationScore: number;
  };
}

export interface UserProfile {
  id: string;
  dietary_restrictions: string[];
  dietary_preferences: string[];
  allergies?: string[];
  calorie_target?: number;
  protein_target?: number;
}

export interface MatchResult {
  matchCount: number;
  totalIngredients: number;
  matchPercentage: number;
  missingIngredients: string[];
  availableIngredients: string[];
  detailedMatch: {
    available: any[];
    missing: any[];
    partial: any[];
  };
}