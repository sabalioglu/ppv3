//lib/meal-plan/types.ts
// Enhanced TypeScript interfaces with better database compatibility
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
  instructions?: string[];
  // Additional fields for matching
  pantryMatch?: number;
  totalIngredients?: number;
  missingIngredients?: string[];
  matchPercentage?: number;
  allergenSafe?: boolean;
  available?: boolean;
  score?: number;
  // Recipe source info
  source?: 'database' | 'ai_generated' | 'user_created';
  sourceId?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PantryItem {
  id: string;              
  user_id: string;
  name: string;
  brand?: string;          
  category?: string;
  subcategory?: string;    
  quantity: number;        
  unit?: string;
  barcode?: string;        
  expiry_date?: string;    
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
  nutrition_data?: any;        
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
  totalValue?: number;
  healthScore?: number;
}

export interface PantryComposition {
  categories: Record<string, number>;
  totalItems: number;
  expiringItems: PantryItem[];
  dominantCategories: string[];
  deficientCategories: string[];
  suggestions: string[];
  healthScore?: number;
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
  timestamp?: string;
}

export interface MealPlan {
  daily: {
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
    snacks: Meal[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs?: number;
    totalFat?: number;
    totalFiber?: number;
    optimizationScore: number;
    generatedAt?: string;
    pantryMatchScore?: number;
  };
  weekly?: {
    [key: string]: MealPlan['daily'];
  };
}

export interface UserProfile {
  id: string;
  dietary_restrictions?: string[];
  dietary_preferences?: string[];
  preferences?: string[];
  allergies?: string[];
  calorie_target?: number;
  protein_target?: number;
  carb_target?: number;
  fat_target?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weight_goal?: 'lose' | 'maintain' | 'gain';
  created_at?: string;
  updated_at?: string;
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
  confidence?: number;
}

export interface ShoppingListItem {
  id?: string;
  user_id?: string;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  priority?: 'low' | 'medium' | 'high';
  is_purchased?: boolean;
  added_from?: 'meal_plan' | 'manual' | 'pantry_insight';
  source_meal_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionEntry {
  id?: string;
  user_id?: string;
  meal_id?: string;
  meal_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface AIGenerationRequest {
  pantryItems: PantryItem[];
  userProfile?: UserProfile;
  mealType: string;
  preferences?: string[];
  restrictions?: string[];
  targetCalories?: number;
  targetProtein?: number;
}

export interface AIGenerationResponse {
  meal: Meal;
  confidence: number;
  reasoning: string;
  alternatives?: Meal[];
}
