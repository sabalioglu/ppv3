export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_memory: {
        Row: {
          created_at: string | null
          id: string
          memory_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          memory_data?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          memory_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_code: string
          error_details: string | null
          error_message: string
          id: string
          platform: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_code: string
          error_details?: string | null
          error_message: string
          id?: string
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_code?: string
          error_details?: string | null
          error_message?: string
          id?: string
          platform?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          failure_count: number | null
          id: string
          is_food: boolean | null
          language: string | null
          last_used: string | null
          pattern: string
          pattern_type: string | null
          region: string | null
          seasonal: boolean | null
          store_specific: string[] | null
          success_count: number | null
          usage_count: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          failure_count?: number | null
          id?: string
          is_food?: boolean | null
          language?: string | null
          last_used?: string | null
          pattern: string
          pattern_type?: string | null
          region?: string | null
          seasonal?: boolean | null
          store_specific?: string[] | null
          success_count?: number | null
          usage_count?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          failure_count?: number | null
          id?: string
          is_food?: boolean | null
          language?: string | null
          last_used?: string | null
          pattern?: string
          pattern_type?: string | null
          region?: string | null
          seasonal?: boolean | null
          store_specific?: string[] | null
          success_count?: number | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_patterns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_waste_logs: {
        Row: {
          created_at: string | null
          date_wasted: string | null
          environmental_impact: number | null
          estimated_cost: number | null
          id: string
          item_name: string
          notes: string | null
          pantry_item_id: string | null
          prevention_tip: string | null
          quantity_wasted: number | null
          reason: string | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_wasted?: string | null
          environmental_impact?: number | null
          estimated_cost?: number | null
          id?: string
          item_name: string
          notes?: string | null
          pantry_item_id?: string | null
          prevention_tip?: string | null
          quantity_wasted?: number | null
          reason?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_wasted?: string | null
          environmental_impact?: number | null
          estimated_cost?: number | null
          id?: string
          item_name?: string
          notes?: string | null
          pantry_item_id?: string | null
          prevention_tip?: string | null
          quantity_wasted?: number | null
          reason?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_waste_logs_pantry_item_id_fkey"
            columns: ["pantry_item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_waste_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_metrics: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          blood_sugar_mg_dl: number | null
          bmr: number | null
          body_fat_percentage: number | null
          bone_mass_kg: number | null
          created_at: string | null
          data_source: string | null
          date: string
          digestion_score: number | null
          energy_level: number | null
          exercise_intensity: string | null
          exercise_minutes: number | null
          exercise_type: string | null
          heart_rate_max: number | null
          heart_rate_resting: number | null
          id: string
          medications: string[] | null
          mental_clarity: number | null
          mood_score: number | null
          motivation_level: number | null
          muscle_mass_kg: number | null
          notes: string | null
          skin_condition: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          steps_count: number | null
          stress_level: number | null
          supplements: string[] | null
          symptoms: string[] | null
          tdee: number | null
          user_id: string | null
          water_intake_ml: number | null
          water_percentage: number | null
          weight_kg: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar_mg_dl?: number | null
          bmr?: number | null
          body_fat_percentage?: number | null
          bone_mass_kg?: number | null
          created_at?: string | null
          data_source?: string | null
          date: string
          digestion_score?: number | null
          energy_level?: number | null
          exercise_intensity?: string | null
          exercise_minutes?: number | null
          exercise_type?: string | null
          heart_rate_max?: number | null
          heart_rate_resting?: number | null
          id?: string
          medications?: string[] | null
          mental_clarity?: number | null
          mood_score?: number | null
          motivation_level?: number | null
          muscle_mass_kg?: number | null
          notes?: string | null
          skin_condition?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          steps_count?: number | null
          stress_level?: number | null
          supplements?: string[] | null
          symptoms?: string[] | null
          tdee?: number | null
          user_id?: string | null
          water_intake_ml?: number | null
          water_percentage?: number | null
          weight_kg?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar_mg_dl?: number | null
          bmr?: number | null
          body_fat_percentage?: number | null
          bone_mass_kg?: number | null
          created_at?: string | null
          data_source?: string | null
          date?: string
          digestion_score?: number | null
          energy_level?: number | null
          exercise_intensity?: string | null
          exercise_minutes?: number | null
          exercise_type?: string | null
          heart_rate_max?: number | null
          heart_rate_resting?: number | null
          id?: string
          medications?: string[] | null
          mental_clarity?: number | null
          mood_score?: number | null
          motivation_level?: number | null
          muscle_mass_kg?: number | null
          notes?: string | null
          skin_condition?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          steps_count?: number | null
          stress_level?: number | null
          supplements?: string[] | null
          symptoms?: string[] | null
          tdee?: number | null
          user_id?: string | null
          water_intake_ml?: number | null
          water_percentage?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          cuisine: string | null
          id: string
          meal_data: Json | null
          meal_name: string
          meal_type: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          cuisine?: string | null
          id?: string
          meal_data?: Json | null
          meal_name: string
          meal_type: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          cuisine?: string | null
          id?: string
          meal_data?: Json | null
          meal_name?: string
          meal_type?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_history: {
        Row: {
          cooking_method: string | null
          created_at: string | null
          cuisine_type: string | null
          id: string
          ingredients: string[]
          meal_name: string
          meal_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cooking_method?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          id?: string
          ingredients?: string[]
          meal_name: string
          meal_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cooking_method?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          id?: string
          ingredients?: string[]
          meal_name?: string
          meal_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          actual_servings: number | null
          batch_id: string | null
          calories_actual: number | null
          calories_planned: number | null
          carbs_actual: number | null
          carbs_planned: number | null
          cost_actual: number | null
          cost_planned: number | null
          created_at: string | null
          date: string
          difficulty_rating: number | null
          fat_actual: number | null
          fat_planned: number | null
          id: string
          image_url: string | null
          leftovers_actual: boolean | null
          leftovers_expected: boolean | null
          meal_prep_batch: boolean | null
          meal_type: string | null
          notes: string | null
          planned_servings: number | null
          prep_time_actual: number | null
          prep_time_planned: number | null
          protein_actual: number | null
          protein_planned: number | null
          recipe_id: string | null
          recipe_title: string | null
          satisfaction_rating: number | null
          updated_at: string | null
          user_id: string | null
          would_make_again: boolean | null
        }
        Insert: {
          actual_servings?: number | null
          batch_id?: string | null
          calories_actual?: number | null
          calories_planned?: number | null
          carbs_actual?: number | null
          carbs_planned?: number | null
          cost_actual?: number | null
          cost_planned?: number | null
          created_at?: string | null
          date: string
          difficulty_rating?: number | null
          fat_actual?: number | null
          fat_planned?: number | null
          id?: string
          image_url?: string | null
          leftovers_actual?: boolean | null
          leftovers_expected?: boolean | null
          meal_prep_batch?: boolean | null
          meal_type?: string | null
          notes?: string | null
          planned_servings?: number | null
          prep_time_actual?: number | null
          prep_time_planned?: number | null
          protein_actual?: number | null
          protein_planned?: number | null
          recipe_id?: string | null
          recipe_title?: string | null
          satisfaction_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          would_make_again?: boolean | null
        }
        Update: {
          actual_servings?: number | null
          batch_id?: string | null
          calories_actual?: number | null
          calories_planned?: number | null
          carbs_actual?: number | null
          carbs_planned?: number | null
          cost_actual?: number | null
          cost_planned?: number | null
          created_at?: string | null
          date?: string
          difficulty_rating?: number | null
          fat_actual?: number | null
          fat_planned?: number | null
          id?: string
          image_url?: string | null
          leftovers_actual?: boolean | null
          leftovers_expected?: boolean | null
          meal_prep_batch?: boolean | null
          meal_type?: string | null
          notes?: string | null
          planned_servings?: number | null
          prep_time_actual?: number | null
          prep_time_planned?: number | null
          protein_actual?: number | null
          protein_planned?: number | null
          recipe_id?: string | null
          recipe_title?: string | null
          satisfaction_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          would_make_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          calcium: number | null
          calories: number | null
          carbs: number | null
          cholesterol: number | null
          created_at: string | null
          date: string
          fat: number | null
          fiber: number | null
          food_name: string
          hunger_after: number | null
          hunger_before: number | null
          id: string
          image_url: string | null
          iron: number | null
          location: string | null
          meal_time: string | null
          meal_type: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          pantry_item_id: string | null
          protein: number | null
          quantity: number | null
          recipe_id: string | null
          satisfaction_level: number | null
          saturated_fat: number | null
          sodium: number | null
          sugar: number | null
          trans_fat: number | null
          unit: string
          user_id: string
          vitamin_a: number | null
          vitamin_c: number | null
        }
        Insert: {
          calcium?: number | null
          calories?: number | null
          carbs?: number | null
          cholesterol?: number | null
          created_at?: string | null
          date: string
          fat?: number | null
          fiber?: number | null
          food_name: string
          hunger_after?: number | null
          hunger_before?: number | null
          id?: string
          image_url?: string | null
          iron?: number | null
          location?: string | null
          meal_time?: string | null
          meal_type: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          pantry_item_id?: string | null
          protein?: number | null
          quantity?: number | null
          recipe_id?: string | null
          satisfaction_level?: number | null
          saturated_fat?: number | null
          sodium?: number | null
          sugar?: number | null
          trans_fat?: number | null
          unit?: string
          user_id: string
          vitamin_a?: number | null
          vitamin_c?: number | null
        }
        Update: {
          calcium?: number | null
          calories?: number | null
          carbs?: number | null
          cholesterol?: number | null
          created_at?: string | null
          date?: string
          fat?: number | null
          fiber?: number | null
          food_name?: string
          hunger_after?: number | null
          hunger_before?: number | null
          id?: string
          image_url?: string | null
          iron?: number | null
          location?: string | null
          meal_time?: string | null
          meal_type?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          pantry_item_id?: string | null
          protein?: number | null
          quantity?: number | null
          recipe_id?: string | null
          satisfaction_level?: number | null
          saturated_fat?: number | null
          sodium?: number | null
          sugar?: number | null
          trans_fat?: number | null
          unit?: string
          user_id?: string
          vitamin_a?: number | null
          vitamin_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_pantry_item_id_fkey"
            columns: ["pantry_item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          ai_confidence: number | null
          allergens: string[] | null
          barcode: string | null
          brand: string | null
          calcium_per_100g: number | null
          calories_per_100g: number | null
          carbs_per_100g: number | null
          category: string | null
          cholesterol_per_100g: number | null
          cost: number | null
          created_at: string | null
          expiry_date: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          image_url: string | null
          iron_per_100g: number | null
          is_favorite: boolean | null
          is_opened: boolean | null
          last_used_date: string | null
          location: string | null
          name: string
          notes: string | null
          nutrition_data: Json | null
          opened_date: string | null
          protein_per_100g: number | null
          purchase_date: string | null
          purchase_location: string | null
          quantity: number | null
          recognition_source: string | null
          saturated_fat_per_100g: number | null
          sodium_per_100g: number | null
          storage_instructions: string | null
          subcategory: string | null
          sugar_per_100g: number | null
          tags: string[] | null
          times_used: number | null
          trans_fat_per_100g: number | null
          typical_shelf_life_days: number | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
          vitamin_a_per_100g: number | null
          vitamin_c_per_100g: number | null
        }
        Insert: {
          ai_confidence?: number | null
          allergens?: string[] | null
          barcode?: string | null
          brand?: string | null
          calcium_per_100g?: number | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category?: string | null
          cholesterol_per_100g?: number | null
          cost?: number | null
          created_at?: string | null
          expiry_date?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          iron_per_100g?: number | null
          is_favorite?: boolean | null
          is_opened?: boolean | null
          last_used_date?: string | null
          location?: string | null
          name: string
          notes?: string | null
          nutrition_data?: Json | null
          opened_date?: string | null
          protein_per_100g?: number | null
          purchase_date?: string | null
          purchase_location?: string | null
          quantity?: number | null
          recognition_source?: string | null
          saturated_fat_per_100g?: number | null
          sodium_per_100g?: number | null
          storage_instructions?: string | null
          subcategory?: string | null
          sugar_per_100g?: number | null
          tags?: string[] | null
          times_used?: number | null
          trans_fat_per_100g?: number | null
          typical_shelf_life_days?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          vitamin_a_per_100g?: number | null
          vitamin_c_per_100g?: number | null
        }
        Update: {
          ai_confidence?: number | null
          allergens?: string[] | null
          barcode?: string | null
          brand?: string | null
          calcium_per_100g?: number | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category?: string | null
          cholesterol_per_100g?: number | null
          cost?: number | null
          created_at?: string | null
          expiry_date?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          iron_per_100g?: number | null
          is_favorite?: boolean | null
          is_opened?: boolean | null
          last_used_date?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          nutrition_data?: Json | null
          opened_date?: string | null
          protein_per_100g?: number | null
          purchase_date?: string | null
          purchase_location?: string | null
          quantity?: number | null
          recognition_source?: string | null
          saturated_fat_per_100g?: number | null
          sodium_per_100g?: number | null
          storage_instructions?: string | null
          subcategory?: string | null
          sugar_per_100g?: number | null
          tags?: string[] | null
          times_used?: number | null
          trans_fat_per_100g?: number | null
          typical_shelf_life_days?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          vitamin_a_per_100g?: number | null
          vitamin_c_per_100g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_performance: {
        Row: {
          created_at: string | null
          id: string
          last_performance_update: string | null
          pattern_id: string | null
          performance_trend: string | null
          recent_failures: number | null
          recent_successes: number | null
          store_format: string | null
          success_rate: number | null
          total_uses: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_performance_update?: string | null
          pattern_id?: string | null
          performance_trend?: string | null
          recent_failures?: number | null
          recent_successes?: number | null
          store_format?: string | null
          success_rate?: number | null
          total_uses?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_performance_update?: string | null
          pattern_id?: string | null
          performance_trend?: string | null
          recent_failures?: number | null
          recent_successes?: number | null
          store_format?: string | null
          success_rate?: number | null
          total_uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_performance_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "food_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_feedback_sessions: {
        Row: {
          completion_status: string | null
          created_at: string | null
          feedback_data: Json
          feedback_quality: string | null
          id: string
          items_confirmed: number | null
          items_edited: number | null
          items_rejected: number | null
          new_items_added: number | null
          receipt_learning_id: string | null
          session_duration: number | null
          user_id: string | null
          user_satisfaction: number | null
        }
        Insert: {
          completion_status?: string | null
          created_at?: string | null
          feedback_data: Json
          feedback_quality?: string | null
          id?: string
          items_confirmed?: number | null
          items_edited?: number | null
          items_rejected?: number | null
          new_items_added?: number | null
          receipt_learning_id?: string | null
          session_duration?: number | null
          user_id?: string | null
          user_satisfaction?: number | null
        }
        Update: {
          completion_status?: string | null
          created_at?: string | null
          feedback_data?: Json
          feedback_quality?: string | null
          id?: string
          items_confirmed?: number | null
          items_edited?: number | null
          items_rejected?: number | null
          new_items_added?: number | null
          receipt_learning_id?: string | null
          session_duration?: number | null
          user_id?: string | null
          user_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_feedback_sessions_receipt_learning_id_fkey"
            columns: ["receipt_learning_id"]
            isOneToOne: false
            referencedRelation: "receipt_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_feedback_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_learning: {
        Row: {
          accuracy_score: number | null
          confirmed_items: Json | null
          created_at: string | null
          id: string
          image_url: string | null
          items_count: number | null
          original_text: string
          parsed_items: Json | null
          parsing_method: string | null
          processing_time: number | null
          receipt_total: number | null
          rejected_items: Json | null
          store_format: string | null
          store_name: string | null
          updated_at: string | null
          user_feedback: Json | null
          user_id: string | null
        }
        Insert: {
          accuracy_score?: number | null
          confirmed_items?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          items_count?: number | null
          original_text: string
          parsed_items?: Json | null
          parsing_method?: string | null
          processing_time?: number | null
          receipt_total?: number | null
          rejected_items?: Json | null
          store_format?: string | null
          store_name?: string | null
          updated_at?: string | null
          user_feedback?: Json | null
          user_id?: string | null
        }
        Update: {
          accuracy_score?: number | null
          confirmed_items?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          items_count?: number | null
          original_text?: string
          parsed_items?: Json | null
          parsing_method?: string | null
          processing_time?: number | null
          receipt_total?: number | null
          rejected_items?: Json | null
          store_format?: string | null
          store_name?: string | null
          updated_at?: string | null
          user_feedback?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_learning_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          calories_contribution: number | null
          carbs_contribution: number | null
          fat_contribution: number | null
          id: string
          ingredient_name: string
          is_optional: boolean | null
          notes: string | null
          order_index: number | null
          pantry_item_id: string | null
          preparation_method: string | null
          protein_contribution: number | null
          quantity: number
          recipe_id: string | null
          substitutes: string[] | null
          unit: string | null
        }
        Insert: {
          calories_contribution?: number | null
          carbs_contribution?: number | null
          fat_contribution?: number | null
          id?: string
          ingredient_name: string
          is_optional?: boolean | null
          notes?: string | null
          order_index?: number | null
          pantry_item_id?: string | null
          preparation_method?: string | null
          protein_contribution?: number | null
          quantity: number
          recipe_id?: string | null
          substitutes?: string[] | null
          unit?: string | null
        }
        Update: {
          calories_contribution?: number | null
          carbs_contribution?: number | null
          fat_contribution?: number | null
          id?: string
          ingredient_name?: string
          is_optional?: boolean | null
          notes?: string | null
          order_index?: number | null
          pantry_item_id?: string | null
          preparation_method?: string | null
          protein_contribution?: number | null
          quantity?: number
          recipe_id?: string | null
          substitutes?: string[] | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_pantry_item_id_fkey"
            columns: ["pantry_item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_processing_jobs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          job_id: string
          message: string | null
          progress: number | null
          source_type: string | null
          source_url: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id: string
          message?: string | null
          progress?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id?: string
          message?: string | null
          progress?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          allergens: string[] | null
          average_rating: number | null
          calories_per_serving: number | null
          carbs_per_serving: number | null
          cook_time: number | null
          cost_per_serving: number | null
          created_at: string | null
          cuisine: string | null
          description: string | null
          diet_tags: string[] | null
          difficulty: string | null
          equipment: string[] | null
          fat_per_serving: number | null
          fiber_per_serving: number | null
          health_score: number | null
          id: string
          image_url: string | null
          instructions: Json | null
          is_favorite: boolean | null
          is_public: boolean | null
          meal_type: string[] | null
          nutrition_score: number | null
          prep_time: number | null
          protein_per_serving: number | null
          reheating_instructions: string | null
          season: string[] | null
          servings: number | null
          sodium_per_serving: number | null
          source: string | null
          source_url: string | null
          storage_instructions: string | null
          sugar_per_serving: number | null
          sustainability_score: number | null
          times_cooked: number | null
          tips: string[] | null
          title: string
          total_calories: number | null
          total_ratings: number | null
          total_time: number | null
          updated_at: string | null
          user_id: string | null
          variations: string[] | null
        }
        Insert: {
          allergens?: string[] | null
          average_rating?: number | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          equipment?: string[] | null
          fat_per_serving?: number | null
          fiber_per_serving?: number | null
          health_score?: number | null
          id?: string
          image_url?: string | null
          instructions?: Json | null
          is_favorite?: boolean | null
          is_public?: boolean | null
          meal_type?: string[] | null
          nutrition_score?: number | null
          prep_time?: number | null
          protein_per_serving?: number | null
          reheating_instructions?: string | null
          season?: string[] | null
          servings?: number | null
          sodium_per_serving?: number | null
          source?: string | null
          source_url?: string | null
          storage_instructions?: string | null
          sugar_per_serving?: number | null
          sustainability_score?: number | null
          times_cooked?: number | null
          tips?: string[] | null
          title: string
          total_calories?: number | null
          total_ratings?: number | null
          total_time?: number | null
          updated_at?: string | null
          user_id?: string | null
          variations?: string[] | null
        }
        Update: {
          allergens?: string[] | null
          average_rating?: number | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          equipment?: string[] | null
          fat_per_serving?: number | null
          fiber_per_serving?: number | null
          health_score?: number | null
          id?: string
          image_url?: string | null
          instructions?: Json | null
          is_favorite?: boolean | null
          is_public?: boolean | null
          meal_type?: string[] | null
          nutrition_score?: number | null
          prep_time?: number | null
          protein_per_serving?: number | null
          reheating_instructions?: string | null
          season?: string[] | null
          servings?: number | null
          sodium_per_serving?: number | null
          source?: string | null
          source_url?: string | null
          storage_instructions?: string | null
          sugar_per_serving?: number | null
          sustainability_score?: number | null
          times_cooked?: number | null
          tips?: string[] | null
          title?: string
          total_calories?: number | null
          total_ratings?: number | null
          total_time?: number | null
          updated_at?: string | null
          user_id?: string | null
          variations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          actual_cost: number | null
          alternatives: string[] | null
          brand: string | null
          category: string | null
          completed_at: string | null
          coupons_available: boolean | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          is_completed: boolean | null
          item_name: string
          notes: string | null
          nutrition_goal: string | null
          organic_preference: boolean | null
          pantry_item_id: string | null
          preferred_brand: string | null
          priority: string | null
          quantity: number | null
          seasonal_availability: boolean | null
          size_preference: string | null
          source: string | null
          source_id: string | null
          store_section: string | null
          subcategory: string | null
          sustainability_score: number | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          alternatives?: string[] | null
          brand?: string | null
          category?: string | null
          completed_at?: string | null
          coupons_available?: boolean | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          is_completed?: boolean | null
          item_name: string
          notes?: string | null
          nutrition_goal?: string | null
          organic_preference?: boolean | null
          pantry_item_id?: string | null
          preferred_brand?: string | null
          priority?: string | null
          quantity?: number | null
          seasonal_availability?: boolean | null
          size_preference?: string | null
          source?: string | null
          source_id?: string | null
          store_section?: string | null
          subcategory?: string | null
          sustainability_score?: number | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          alternatives?: string[] | null
          brand?: string | null
          category?: string | null
          completed_at?: string | null
          coupons_available?: boolean | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          is_completed?: boolean | null
          item_name?: string
          notes?: string | null
          nutrition_goal?: string | null
          organic_preference?: boolean | null
          pantry_item_id?: string | null
          preferred_brand?: string | null
          priority?: string | null
          quantity?: number | null
          seasonal_availability?: boolean | null
          size_preference?: string | null
          source?: string | null
          source_id?: string | null
          store_section?: string | null
          subcategory?: string | null
          sustainability_score?: number | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_pantry_item_id_fkey"
            columns: ["pantry_item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_formats: {
        Row: {
          accuracy_stats: Json | null
          avg_accuracy: number | null
          created_at: string | null
          footer_patterns: string[] | null
          header_patterns: string[] | null
          id: string
          is_active: boolean | null
          item_pattern: string | null
          last_accuracy: number | null
          line_pattern: string | null
          price_pattern: string | null
          sample_receipt_lines: string[] | null
          store_chain: string | null
          store_country: string | null
          store_name: string
          total_receipts: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy_stats?: Json | null
          avg_accuracy?: number | null
          created_at?: string | null
          footer_patterns?: string[] | null
          header_patterns?: string[] | null
          id?: string
          is_active?: boolean | null
          item_pattern?: string | null
          last_accuracy?: number | null
          line_pattern?: string | null
          price_pattern?: string | null
          sample_receipt_lines?: string[] | null
          store_chain?: string | null
          store_country?: string | null
          store_name: string
          total_receipts?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy_stats?: Json | null
          avg_accuracy?: number | null
          created_at?: string | null
          footer_patterns?: string[] | null
          header_patterns?: string[] | null
          id?: string
          is_active?: boolean | null
          item_pattern?: string | null
          last_accuracy?: number | null
          line_pattern?: string | null
          price_pattern?: string | null
          sample_receipt_lines?: string[] | null
          store_chain?: string | null
          store_country?: string | null
          store_name?: string
          total_receipts?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          deleted_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_orders: {
        Row: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          id: number
          payment_intent_id: string
          payment_status: string
          status: Database["public"]["Enums"]["stripe_order_status"]
          updated_at: string | null
        }
        Insert: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at?: string | null
          currency: string
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_intent_id: string
          payment_status: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Update: {
          amount_subtotal?: number
          amount_total?: number
          checkout_session_id?: string
          created_at?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_intent_id?: string
          payment_status?: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string
          deleted_at: string | null
          id: number
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status?: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          current_value: number | null
          description: string | null
          icon: string | null
          id: string
          points: number | null
          progress: number | null
          target_value: number | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          current_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          points?: number | null
          progress?: number | null
          target_value?: number | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          current_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          points?: number | null
          progress?: number | null
          target_value?: number | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_stats: {
        Row: {
          average_accuracy: number | null
          badges: string[] | null
          best_accuracy: number | null
          contribution_score: number | null
          created_at: string | null
          id: string
          learned_patterns_count: number | null
          level: number | null
          preferred_stores: string[] | null
          streak_days: number | null
          total_confirmations: number | null
          total_corrections: number | null
          total_feedback_provided: number | null
          total_receipts: number | null
          total_rejections: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_accuracy?: number | null
          badges?: string[] | null
          best_accuracy?: number | null
          contribution_score?: number | null
          created_at?: string | null
          id?: string
          learned_patterns_count?: number | null
          level?: number | null
          preferred_stores?: string[] | null
          streak_days?: number | null
          total_confirmations?: number | null
          total_corrections?: number | null
          total_feedback_provided?: number | null
          total_receipts?: number | null
          total_rejections?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_accuracy?: number | null
          badges?: string[] | null
          best_accuracy?: number | null
          contribution_score?: number | null
          created_at?: string | null
          id?: string
          learned_patterns_count?: number | null
          level?: number | null
          preferred_stores?: string[] | null
          streak_days?: number | null
          total_confirmations?: number | null
          total_corrections?: number | null
          total_feedback_provided?: number | null
          total_receipts?: number | null
          total_rejections?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          cooking_skill_level: string | null
          created_at: string | null
          cuisine_preferences: string[] | null
          daily_calorie_goal: number | null
          daily_carb_goal: number | null
          daily_fat_goal: number | null
          daily_fiber_goal: number | null
          daily_protein_goal: number | null
          daily_water_goal_ml: number | null
          dietary_preferences: string[] | null
          dietary_restrictions: string[] | null
          email: string | null
          full_name: string | null
          gender: string | null
          health_goals_macros: string[]
          health_goals_micros: string[] | null
          height_cm: number | null
          id: string
          notification_preferences: Json | null
          timezone: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          cooking_skill_level?: string | null
          created_at?: string | null
          cuisine_preferences?: string[] | null
          daily_calorie_goal?: number | null
          daily_carb_goal?: number | null
          daily_fat_goal?: number | null
          daily_fiber_goal?: number | null
          daily_protein_goal?: number | null
          daily_water_goal_ml?: number | null
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          health_goals_macros?: string[]
          health_goals_micros?: string[] | null
          height_cm?: number | null
          id: string
          notification_preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          cooking_skill_level?: string | null
          created_at?: string | null
          cuisine_preferences?: string[] | null
          daily_calorie_goal?: number | null
          daily_carb_goal?: number | null
          daily_fat_goal?: number | null
          daily_fiber_goal?: number | null
          daily_protein_goal?: number | null
          daily_water_goal_ml?: number | null
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          health_goals_macros?: string[]
          health_goals_micros?: string[] | null
          height_cm?: number | null
          id?: string
          notification_preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_recipes: {
        Row: {
          ai_confidence_score: number | null
          category: string | null
          cook_time: number | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          extraction_method: string | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: Json | null
          is_ai_generated: boolean | null
          is_favorite: boolean | null
          nutrition: Json | null
          prep_time: number | null
          servings: number | null
          source_platform: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          category?: string | null
          cook_time?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          extraction_method?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_ai_generated?: boolean | null
          is_favorite?: boolean | null
          nutrition?: Json | null
          prep_time?: number | null
          servings?: number | null
          source_platform?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          category?: string | null
          cook_time?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          extraction_method?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_ai_generated?: boolean | null
          is_favorite?: boolean | null
          nutrition?: Json | null
          prep_time?: number | null
          servings?: number | null
          source_platform?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      learning_analytics: {
        Row: {
          avg_accuracy: number | null
          avg_processing_time: number | null
          best_accuracy: number | null
          store_chain: string | null
          store_name: string | null
          total_receipts: number | null
          unique_users: number | null
          worst_accuracy: number | null
        }
        Relationships: []
      }
      stripe_user_orders: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          checkout_session_id: string | null
          currency: string | null
          customer_id: string | null
          order_date: string | null
          order_id: number | null
          order_status:
            | Database["public"]["Enums"]["stripe_order_status"]
            | null
          payment_intent_id: string | null
          payment_status: string | null
        }
        Relationships: []
      }
      stripe_user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["stripe_subscription_status"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_cuisine_variety_score:
        | {
            Args: { days_back?: number; user_clerk_id: string }
            Returns: number
          }
        | { Args: { days_back?: number; user_uuid: string }; Returns: number }
      get_recent_ingredients:
        | {
            Args: { days_back?: number; user_clerk_id: string }
            Returns: string[]
          }
        | { Args: { days_back?: number; user_uuid: string }; Returns: string[] }
      manage_cookbooks: {
        Args: { p_cookbook_ids: Json; p_operation: string; p_recipe_id: string }
        Returns: Json
      }
    }
    Enums: {
      stripe_order_status: "pending" | "completed" | "canceled"
      stripe_subscription_status:
        | "not_started"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      stripe_order_status: ["pending", "completed", "canceled"],
      stripe_subscription_status: [
        "not_started",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
