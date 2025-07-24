//lib/meal-plan/types.ts - %100 Schema Compatible
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
  // Pantry matching fields
  pantryMatch?: number;
  totalIngredients?: number;
  missingIngredients?: string[];
  matchPercentage?: number;
  allergenSafe?: boolean;
  available?: boolean;
  score?: number;
  // Source tracking
  source?: 'database' | 'ai_generated' | 'user_created';
  sourceId?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ %100 Schema-compliant (pantry_items table)
export interface PantryItem {
  id: string;
  user_id: string;
  name: string;                    // ✅ Schema: name
  brand?: string;
  category?: string;
  subcategory?: string;
  quantity: number;                // ✅ Schema: numeric
  unit?: string;
  barcode?: string;
  expiry_date?: string;            // ✅ Schema: date
  purchase_date?: string;          // ✅ Schema: date
  location?: string;
  cost?: number;                   // ✅ Schema: numeric
  calories_per_100g?: number;      // ✅ Schema: integer
  protein_per_100g?: number;       // ✅ Schema: numeric
  carbs_per_100g?: number;         // ✅ Schema: numeric
  fat_per_100g?: number;           // ✅ Schema: numeric
  fiber_per_100g?: number;         // ✅ Schema: numeric
  sugar_per_100g?: number;         // ✅ Schema: numeric
  sodium_per_100g?: number;        // ✅ Schema: numeric
  image_url?: string;              // ✅ Schema: text
  nutrition_data?: any;            // ✅ Schema: jsonb
  ai_confidence?: number;          // ✅ Schema: numeric
  is_opened?: boolean;             // ✅ Schema: boolean
  created_at: string;              // ✅ Schema: timestamp
  updated_at: string;              // ✅ Schema: timestamp
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
  icon?: string; // ✅ Icon name as string instead of component
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

// ✅ %100 Schema-compliant (user_profiles table)
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  health_goals?: string[];
  dietary_restrictions?: string[];
  daily_calorie_goal?: number;
  daily_protein_goal?: number;
  daily_carb_goal?: number;
  daily_fat_goal?: number;
  created_at?: string;
  updated_at?: string;
  dietary_preferences?: string[];
  notification_settings?: any;
  streak_days?: number;
  cuisine_preferences?: string[];
  cooking_skill_level?: string;
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

// ✅ %100 Schema-compliant (shopping_list_items table)
export interface ShoppingListItem {
  id?: string;
  user_id?: string;
  item_name: string;              // ✅ Schema: item_name
  category?: string;
  quantity?: number;              // ✅ Schema: numeric
  unit?: string;
  estimated_cost?: number;        // ✅ Schema: numeric
  priority?: string;              // ✅ Schema: text
  source?: string;
  nutrition_goal?: string;
  is_completed?: boolean;         // ✅ Schema: is_completed
  completed_at?: string;          // ✅ Schema: timestamp
  created_at?: string;
  recipe_id?: string;             // ✅ Schema: uuid
  ingredient_name?: string;       // ✅ Schema: text
  notes?: string;                 // ✅ Schema: text
  purchased_at?: string;          // ✅ Schema: timestamp
}

// ✅ %100 Schema-compliant (nutrition_logs table)
export interface NutritionEntry {
  id?: string;
  user_id?: string;
  date: string;                   // ✅ Schema: date
  meal_type?: string;             // ✅ Schema: text
  food_name: string;              // ✅ Schema: text
  quantity?: number;              // ✅ Schema: numeric
  unit?: string;                  // ✅ Schema: text
  calories?: number;              // ✅ Schema: integer
  protein?: number;               // ✅ Schema: numeric
  carbs?: number;                 // ✅ Schema: numeric
  fat?: number;                   // ✅ Schema: numeric
  fiber?: number;                 // ✅ Schema: numeric
  sugar?: number;                 // ✅ Schema: numeric
  sodium?: number;                // ✅ Schema: numeric
  pantry_item_id?: string;        // ✅ Schema: uuid
  created_at?: string;            // ✅ Schema: timestamp
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
