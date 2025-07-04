// Supabase Database Types for Pantry Pal
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email?: string;
          full_name?: string;
          age?: number;
          gender?: 'male' | 'female' | 'other';
          height_cm?: number;
          weight_kg?: number;
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
          health_goals?: string[];
          dietary_restrictions?: string[];
          daily_calorie_goal?: number;
          daily_protein_goal?: number;
          daily_carb_goal?: number;
          daily_fat_goal?: number;
          daily_fiber_goal?: number;
          daily_water_goal_ml?: number;
          timezone?: string;
          notification_preferences?: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string;
          age?: number;
          gender?: 'male' | 'female' | 'other';
          height_cm?: number;
          weight_kg?: number;
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
          health_goals?: string[];
          dietary_restrictions?: string[];
          daily_calorie_goal?: number;
          daily_protein_goal?: number;
          daily_carb_goal?: number;
          daily_fat_goal?: number;
          daily_fiber_goal?: number;
          daily_water_goal_ml?: number;
          timezone?: string;
          notification_preferences?: any;
        };
        Update: {
          email?: string;
          full_name?: string;
          age?: number;
          gender?: 'male' | 'female' | 'other';
          height_cm?: number;
          weight_kg?: number;
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
          health_goals?: string[];
          dietary_restrictions?: string[];
          daily_calorie_goal?: number;
          daily_protein_goal?: number;
          daily_carb_goal?: number;
          daily_fat_goal?: number;
          daily_fiber_goal?: number;
          daily_water_goal_ml?: number;
          timezone?: string;
          notification_preferences?: any;
          updated_at?: string;
        };
      };
      pantry_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand?: string;
          category?: string;
          subcategory?: string;
          quantity: number;
          unit: string;
          barcode?: string;
          expiry_date?: string;
          purchase_date?: string;
          purchase_location?: string;
          location: string;
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
          ai_confidence: number;
          recognition_source?: string;
          is_opened: boolean;
          opened_date?: string;
          allergens?: string[];
          tags?: string[];
          notes?: string;
          is_favorite: boolean;
          times_used: number;
          last_used_date?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          brand?: string;
          category?: string;
          subcategory?: string;
          quantity?: number;
          unit?: string;
          barcode?: string;
          expiry_date?: string;
          purchase_date?: string;
          purchase_location?: string;
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
          recognition_source?: string;
          is_opened?: boolean;
          opened_date?: string;
          allergens?: string[];
          tags?: string[];
          notes?: string;
          is_favorite?: boolean;
          times_used?: number;
          last_used_date?: string;
        };
        Update: {
          name?: string;
          brand?: string;
          category?: string;
          subcategory?: string;
          quantity?: number;
          unit?: string;
          barcode?: string;
          expiry_date?: string;
          purchase_date?: string;
          purchase_location?: string;
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
          recognition_source?: string;
          is_opened?: boolean;
          opened_date?: string;
          allergens?: string[];
          tags?: string[];
          notes?: string;
          is_favorite?: boolean;
          times_used?: number;
          last_used_date?: string;
          updated_at?: string;
        };
      };
      nutrition_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
          food_name: string;
          quantity: number;
          unit: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
          pantry_item_id?: string;
          recipe_id?: string;
          meal_time?: string;
          location?: string;
          satisfaction_level?: number;
          notes?: string;
          image_url?: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          date: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
          food_name: string;
          quantity: number;
          unit?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
          pantry_item_id?: string;
          recipe_id?: string;
          meal_time?: string;
          location?: string;
          satisfaction_level?: number;
          notes?: string;
          image_url?: string;
        };
        Update: {
          date?: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
          food_name?: string;
          quantity?: number;
          unit?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
          pantry_item_id?: string;
          recipe_id?: string;
          meal_time?: string;
          location?: string;
          satisfaction_level?: number;
          notes?: string;
          image_url?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description?: string;
          difficulty?: 'Easy' | 'Medium' | 'Hard';
          prep_time?: number;
          cook_time?: number;
          total_time?: number;
          servings: number;
          cuisine?: string;
          diet_tags?: string[];
          meal_type?: string[];
          image_url?: string;
          instructions?: any;
          total_calories?: number;
          calories_per_serving?: number;
          protein_per_serving?: number;
          carbs_per_serving?: number;
          fat_per_serving?: number;
          fiber_per_serving?: number;
          nutrition_score?: number;
          health_score?: number;
          cost_per_serving?: number;
          is_favorite: boolean;
          is_public: boolean;
          times_cooked: number;
          average_rating: number;
          source?: string;
          allergens?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string;
          difficulty?: 'Easy' | 'Medium' | 'Hard';
          prep_time?: number;
          cook_time?: number;
          total_time?: number;
          servings?: number;
          cuisine?: string;
          diet_tags?: string[];
          meal_type?: string[];
          image_url?: string;
          instructions?: any;
          total_calories?: number;
          calories_per_serving?: number;
          protein_per_serving?: number;
          carbs_per_serving?: number;
          fat_per_serving?: number;
          fiber_per_serving?: number;
          nutrition_score?: number;
          health_score?: number;
          cost_per_serving?: number;
          is_favorite?: boolean;
          is_public?: boolean;
          times_cooked?: number;
          average_rating?: number;
          source?: string;
          allergens?: string[];
        };
        Update: {
          title?: string;
          description?: string;
          difficulty?: 'Easy' | 'Medium' | 'Hard';
          prep_time?: number;
          cook_time?: number;
          total_time?: number;
          servings?: number;
          cuisine?: string;
          diet_tags?: string[];
          meal_type?: string[];
          image_url?: string;
          instructions?: any;
          total_calories?: number;
          calories_per_serving?: number;
          protein_per_serving?: number;
          carbs_per_serving?: number;
          fat_per_serving?: number;
          fiber_per_serving?: number;
          nutrition_score?: number;
          health_score?: number;
          cost_per_serving?: number;
          is_favorite?: boolean;
          is_public?: boolean;
          times_cooked?: number;
          average_rating?: number;
          source?: string;
          allergens?: string[];
          updated_at?: string;
        };
      };
      shopping_list_items: {
        Row: {
          id: string;
          user_id: string;
          item_name: string;
          brand?: string;
          category?: string;
          quantity: number;
          unit: string;
          estimated_cost?: number;
          actual_cost?: number;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          source?: 'manual' | 'auto_pantry' | 'recipe' | 'meal_plan' | 'ai_suggestion';
          source_id?: string;
          is_completed: boolean;
          completed_at?: string;
          notes?: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          item_name: string;
          brand?: string;
          category?: string;
          quantity?: number;
          unit?: string;
          estimated_cost?: number;
          actual_cost?: number;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          source?: 'manual' | 'auto_pantry' | 'recipe' | 'meal_plan' | 'ai_suggestion';
          source_id?: string;
          is_completed?: boolean;
          completed_at?: string;
          notes?: string;
        };
        Update: {
          item_name?: string;
          brand?: string;
          category?: string;
          quantity?: number;
          unit?: string;
          estimated_cost?: number;
          actual_cost?: number;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          source?: 'manual' | 'auto_pantry' | 'recipe' | 'meal_plan' | 'ai_suggestion';
          source_id?: string;
          is_completed?: boolean;
          completed_at?: string;
          notes?: string;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          recipe_id?: string;
          recipe_title?: string;
          planned_servings: number;
          actual_servings?: number;
          calories_planned?: number;
          calories_actual?: number;
          protein_planned?: number;
          protein_actual?: number;
          carbs_planned?: number;
          carbs_actual?: number;
          fat_planned?: number;
          fat_actual?: number;
          satisfaction_rating?: number;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          recipe_id?: string;
          recipe_title?: string;
          planned_servings?: number;
          actual_servings?: number;
          calories_planned?: number;
          calories_actual?: number;
          protein_planned?: number;
          protein_actual?: number;
          carbs_planned?: number;
          carbs_actual?: number;
          fat_planned?: number;
          fat_actual?: number;
          satisfaction_rating?: number;
          notes?: string;
        };
        Update: {
          date?: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          recipe_id?: string;
          recipe_title?: string;
          planned_servings?: number;
          actual_servings?: number;
          calories_planned?: number;
          calories_actual?: number;
          protein_planned?: number;
          protein_actual?: number;
          carbs_planned?: number;
          carbs_actual?: number;
          fat_planned?: number;
          fat_actual?: number;
          satisfaction_rating?: number;
          notes?: string;
          updated_at?: string;
        };
      };
      health_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight_kg?: number;
          body_fat_percentage?: number;
          water_intake_ml: number;
          sleep_hours?: number;
          exercise_minutes: number;
          steps_count: number;
          mood_score?: number;
          energy_level?: number;
          stress_level?: number;
          notes?: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          date: string;
          weight_kg?: number;
          body_fat_percentage?: number;
          water_intake_ml?: number;
          sleep_hours?: number;
          exercise_minutes?: number;
          steps_count?: number;
          mood_score?: number;
          energy_level?: number;
          stress_level?: number;
          notes?: string;
        };
        Update: {
          date?: string;
          weight_kg?: number;
          body_fat_percentage?: number;
          water_intake_ml?: number;
          sleep_hours?: number;
          exercise_minutes?: number;
          steps_count?: number;
          mood_score?: number;
          energy_level?: number;
          stress_level?: number;
          notes?: string;
        };
      };
    };
  };
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type PantryItem = Database['public']['Tables']['pantry_items']['Row'];
export type NutritionLog = Database['public']['Tables']['nutrition_logs']['Row'];
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type ShoppingListItem = Database['public']['Tables']['shopping_list_items']['Row'];
export type MealPlan = Database['public']['Tables']['meal_plans']['Row'];
export type HealthMetric = Database['public']['Tables']['health_metrics']['Row'];