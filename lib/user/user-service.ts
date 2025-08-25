import { supabase } from '../supabase';

export interface UserPreferences {
  dietary_restrictions: string[];
  cuisine_preferences: string[];
  cooking_time: 'quick' | 'medium' | 'long' | 'any';
  meal_complexity: 'simple' | 'moderate' | 'complex' | 'any';
  spice_level: 'mild' | 'medium' | 'hot' | 'any';
  allergies: string[];
  disliked_ingredients: string[];
  preferred_meal_types: string[];
  serving_size: number;
  budget_range: 'budget' | 'moderate' | 'premium' | 'any';
  cooking_equipment: string[];
  meal_prep_friendly: boolean;
  family_friendly: boolean;
}

export interface UserProfile extends UserPreferences {
  id: string;
  full_name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  health_goals: string[];
  daily_calories: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  created_at: string;
  updated_at: string;
}

export class UserService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async getUserPreferences(userId: string): Promise<Partial<UserPreferences> | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          dietary_restrictions,
          cuisine_preferences,
          cooking_time,
          meal_complexity,
          spice_level,
          allergies,
          disliked_ingredients,
          preferred_meal_types,
          serving_size,
          budget_range,
          cooking_equipment,
          meal_prep_friendly,
          family_friendly
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(preferences)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  static async getUserRestrictions(userId: string): Promise<{
    restrictions: string[];
    allergies: string[];
    disliked: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('dietary_restrictions, allergies, disliked_ingredients')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        restrictions: data?.dietary_restrictions || [],
        allergies: data?.allergies || [],
        disliked: data?.disliked_ingredients || []
      };
    } catch (error) {
      console.error('Error fetching user restrictions:', error);
      return {
        restrictions: [],
        allergies: [],
        disliked: []
      };
    }
  }

  static async getUserCookingPreferences(userId: string): Promise<{
    cookingTime: string;
    complexity: string;
    spiceLevel: string;
    equipment: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('cooking_time, meal_complexity, spice_level, cooking_equipment')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        cookingTime: data?.cooking_time || 'any',
        complexity: data?.meal_complexity || 'any',
        spiceLevel: data?.spice_level || 'any',
        equipment: data?.cooking_equipment || []
      };
    } catch (error) {
      console.error('Error fetching cooking preferences:', error);
      return {
        cookingTime: 'any',
        complexity: 'any',
        spiceLevel: 'any',
        equipment: []
      };
    }
  }

  static async getUserNutritionTargets(userId: string): Promise<{
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('daily_calories, protein_target, carbs_target, fat_target')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data ? {
        dailyCalories: data.daily_calories,
        protein: data.protein_target,
        carbs: data.carbs_target,
        fat: data.fat_target
      } : null;
    } catch (error) {
      console.error('Error fetching nutrition targets:', error);
      return null;
    }
  }

  static async getUserMealPreferences(userId: string): Promise<{
    cuisine: string[];
    mealTypes: string[];
    servingSize: number;
    familyFriendly: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('cuisine_preferences, preferred_meal_types, serving_size, family_friendly')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        cuisine: data?.cuisine_preferences || [],
        mealTypes: data?.preferred_meal_types || [],
        servingSize: data?.serving_size || 1,
        familyFriendly: data?.family_friendly || false
      };
    } catch (error) {
      console.error('Error fetching meal preferences:', error);
      return {
        cuisine: [],
        mealTypes: [],
        servingSize: 1,
        familyFriendly: false
      };
    }
  }

  static async getCompleteUserContext(userId: string): Promise<{
    profile: UserProfile | null;
    preferences: Partial<UserPreferences> | null;
    restrictions: {
      restrictions: string[];
      allergies: string[];
      disliked: string[];
    };
    cooking: {
      cookingTime: string;
      complexity: string;
      spiceLevel: string;
      equipment: string[];
    };
    nutrition: {
      dailyCalories: number;
      protein: number;
      carbs: number;
      fat: number;
    } | null;
    meal: {
      cuisine: string[];
      mealTypes: string[];
      servingSize: number;
      familyFriendly: boolean;
    };
  } | null> {
    try {
      const [profile, preferences, restrictions, cooking, nutrition, meal] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserPreferences(userId),
        this.getUserRestrictions(userId),
        this.getUserCookingPreferences(userId),
        this.getUserNutritionTargets(userId),
        this.getUserMealPreferences(userId)
      ]);

      return {
        profile,
        preferences,
        restrictions,
        cooking,
        nutrition,
        meal
      };
    } catch (error) {
      console.error('Error fetching complete user context:', error);
      return null;
    }
  }
}