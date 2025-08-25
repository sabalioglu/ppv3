// Gelişmiş AI Meal Plan Servisi - Pantry ve Kullanıcı Tercihlerine Göre

import { PantryAnalyzer, PantryItem, UserPreferences, MealPlanConstraints } from './pantry-analyzer';
import { supabase } from './supabase';

export interface MealPlan {
  id: string;
  user_id: string;
  date: string;
  meals: Meal[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time: number;
  cooking_time: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine_type: string;
  dietary_tags: string[];
  image_url?: string;
  pantry_match_score: number;
}

export class SmartMealPlanner {
  private userId: string;
  private userPreferences: UserPreferences | null = null;
  private pantryItems: PantryItem[] = [];
  private constraints: MealPlanConstraints | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Ana fonksiyon: Pantry ve tercihlere göre yemek planı oluştur
  async generateSmartMealPlan(date: string): Promise<{
    success: boolean;
    meal_plan?: MealPlan;
    message?: string;
    pantry_analysis?: any;
  }> {
    try {
      // 1. Kullanıcı verilerini yükle
      await this.loadUserData();
      
      // 2. Pantry ürünlerini yükle
      await this.loadPantryItems();
      
      // 3. Pantry analizi yap
      const pantryAnalysis = PantryAnalyzer.generateMealCombinations(
        this.pantryItems,
        this.userPreferences!,
        this.constraints!
      );

      // 4. Eğer pantry'de yeterli ürün yoksa, temel öneriler sun
      if (pantryAnalysis.total_combinations < 3) {
        const basicPlan = await this.generateBasicMealPlan(date);
        return {
          success: true,
          meal_plan: basicPlan,
          message: 'Basic meal plan created with pantry-friendly suggestions',
          pantry_analysis: pantryAnalysis
        };
      }

      // 5. Pantry bazlı akıllı plan oluştur
      const smartPlan = await this.createPantryBasedPlan(date, pantryAnalysis);

      return {
        success: true,
        meal_plan: smartPlan,
        message: 'Smart meal plan created based on your pantry and preferences',
        pantry_analysis: pantryAnalysis
      };

    } catch (error) {
      console.error('Error generating smart meal plan:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async loadUserData() {
    try {
      // Kullanıcı profilini yükle
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (profileError) throw profileError;

      this.userPreferences = {
        dietary_preferences: profile.dietary_preferences || [],
        allergies: profile.allergies || [],
        health_goals: profile.health_goals || [],
        cuisine_preferences: profile.cuisine_preferences || [],
        cooking_level: profile.cooking_level || 'medium',
        meal_complexity: profile.meal_complexity || 'medium'
      };

      // Hedefleri hesapla
      const bmr = this.calculateBMR(profile);
      const dailyCalories = this.calculateDailyCalories(bmr, profile.activity_level);
      const macros = this.calculateMacros(dailyCalories, profile.health_goals || []);

      this.constraints = {
        target_calories: dailyCalories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
        meals_per_day: 4
      };

    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  }

  private async loadPantryItems() {
    try {
      const { data: items, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', this.userId)
        .gt('quantity', 0);

      if (error) throw error;
      this.pantryItems = items || [];
    } catch (error) {
      console.error('Error loading pantry items:', error);
      throw error;
    }
  }

  private calculateBMR(profile: any): number {
    if (profile.gender === 'male') {
      return 88.362 + (13.397 * profile.weight_kg) + (4.799 * profile.height_cm) - (5.677 * profile.age);
    } else {
      return 447.593 + (9.247 * profile.weight_kg) + (3.098 * profile.height_cm) - (4.330 * profile.age);
    }
  }

  private calculateDailyCalories(bmr: number, activityLevel: string): number {
    const multipliers: { [key: string]: number } = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extra_active': 1.9
    };
    return Math.round(bmr * (multipliers[activityLevel] || 1.55));
  }

  private calculateMacros(calories: number, goals: string[]) {
    let proteinRatio = 0.25;
    let carbRatio = 0.45;
    let fatRatio = 0.30;

    if (goals.includes('muscle_gain')) {
      proteinRatio = 0.30;
      carbRatio = 0.40;
      fatRatio = 0.30;
    } else if (goals.includes('weight_loss')) {
      proteinRatio = 0.30;
      carbRatio = 0.35;
      fatRatio = 0.35;
    }

    return {
      protein: Math.round((calories * proteinRatio) / 4),
      carbs: Math.round((calories * carbRatio) / 4),
      fat: Math.round((calories * fatRatio) / 9)
    };
  }

  private async createPantryBasedPlan(date: string, pantryAnalysis: any): Promise<MealPlan> {
    const meals = this.generateMealsFromPantry(pantryAnalysis);
    
    const mealPlan: MealPlan = {
      id: `plan_${this.userId}_${date}`,
      user_id: this.userId,
      date: date,
      meals: meals,
      total_calories: meals.reduce((sum, meal) => sum + meal.calories, 0),
      total_protein: meals.reduce((sum, meal) => sum + meal.protein, 0),
      total_carbs: meals.reduce((sum, meal) => sum + meal.carbs, 0),
      total_fat: meals.reduce((sum, meal) => sum + meal.fat, 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Planı kaydet
    await this.saveMealPlan(mealPlan);

    return mealPlan;
  }

  private generateMealsFromPantry(pantryAnalysis: any): Meal[] {
    const meals: Meal[] = [];
    const { combinations, available_ingredients } = pantryAnalysis;

    // Breakfast
    if (combinations.breakfast.length > 0) {
      const breakfast = combinations.breakfast[0];
      meals.push({
        id: `breakfast_${Date.now()}`,
        meal_type: 'breakfast',
        name: breakfast.name,
        description: `A delicious breakfast using ${breakfast.ingredients.join(', ')} from your pantry`,
        ingredients: breakfast.ingredients,
        instructions: [
          'Prepare ingredients',
          'Combine and cook as needed',
          'Serve fresh'
        ],
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat,
        prep_time: 5,
        cooking_time: 10,
        difficulty: 'easy',
        cuisine_type: 'International',
        dietary_tags: this.getDietaryTags(breakfast.ingredients),
        pantry_match_score: 85
      });
    }

    // Lunch
    if (combinations.lunch.length > 0) {
      const lunch = combinations.lunch[0];
      meals.push({
        id: `lunch_${Date.now()}`,
        meal_type: 'lunch',
        name: lunch.name,
        description: `A satisfying lunch featuring ${lunch.ingredients.join(', ')}`,
        ingredients: lunch.ingredients,
        instructions: [
          'Prep ingredients',
          'Cook protein and vegetables',
          'Assemble and serve'
        ],
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat,
        prep_time: 10,
        cooking_time: 20,
        difficulty: 'medium',
        cuisine_type: 'International',
        dietary_tags: this.getDietaryTags(lunch.ingredients),
        pantry_match_score: 80
      });
    }

    // Dinner
    if (combinations.dinner.length > 0) {
      const dinner = combinations.dinner[0];
      meals.push({
        id: `dinner_${Date.now()}`,
        meal_type: 'dinner',
        name: dinner.name,
        description: `A balanced dinner using your available ingredients`,
        ingredients: dinner.ingredients,
        instructions: [
          'Prepare all ingredients',
          'Cook protein, grains, and vegetables',
          'Plate and enjoy'
        ],
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat,
        prep_time: 15,
        cooking_time: 25,
        difficulty: 'medium',
        cuisine_type: 'International',
        dietary_tags: this.getDietaryTags(dinner.ingredients),
        pantry_match_score: 75
      });
    }

    // Snack
    if (combinations.snacks.length > 0) {
      const snack = combinations.snacks[0];
      meals.push({
        id: `snack_${Date.now()}`,
        meal_type: 'snack',
        name: snack.name,
        description: 'A healthy snack option',
        ingredients: snack.ingredients,
        instructions: ['Prepare and enjoy'],
        calories: snack.calories,
        protein: snack.protein,
        carbs: snack.carbs,
        fat: snack.fat,
        prep_time: 2,
        cooking_time: 0,
        difficulty: 'easy',
        cuisine_type: 'International',
        dietary_tags: this.getDietaryTags(snack.ingredients),
        pantry_match_score: 90
      });
    }

    return meals;
  }

  private async generateBasicMealPlan(date: string): Promise<MealPlan> {
    // Temel plan: Pantry'de ürün olmasa bile öneri sun
    const basicMeals: Meal[] = [
      {
        id: `basic_breakfast_${Date.now()}`,
        meal_type: 'breakfast',
        name: 'Simple Oatmeal Bowl',
        description: 'A quick and nutritious breakfast option',
        ingredients: ['oats', 'milk', 'banana'],
        instructions: ['Cook oats with milk', 'Top with banana slices'],
        calories: 300,
        protein: 10,
        carbs: 45,
        fat: 8,
        prep_time: 5,
        cooking_time: 10,
        difficulty: 'easy',
        cuisine_type: 'International',
        dietary_tags: ['vegetarian'],
        pantry_match_score: 50
      },
      {
        id: `basic_lunch_${Date.now()}`,
        meal_type: 'lunch',
        name: 'Grilled Chicken Salad',
        description: 'A protein-rich lunch option',
        ingredients: ['chicken breast', 'mixed greens', 'olive oil'],
        instructions: ['Grill chicken', 'Toss with greens and dressing'],
        calories: 400,
        protein: 35,
        carbs: 15,
        fat: 20,
        prep_time: 10,
        cooking_time: 15,
        difficulty: 'medium',
        cuisine_type: 'International',
        dietary_tags: ['gluten-free'],
        pantry_match_score: 60
      }
    ];

    return {
      id: `basic_plan_${this.userId}_${date}`,
      user_id: this.userId,
      date: date,
      meals: basicMeals,
      total_calories: basicMeals.reduce((sum, meal) => sum + meal.calories, 0),
      total_protein: basicMeals.reduce((sum, meal) => sum + meal.protein, 0),
      total_carbs: basicMeals.reduce((sum, meal) => sum + meal.carbs, 0),
      total_fat: basicMeals.reduce((sum, meal) => sum + meal.fat, 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private getDietaryTags(ingredients: string[]): string[] {
    const tags = ['natural'];
    const ingredientStr = ingredients.join(' ').toLowerCase();

    if (!ingredientStr.includes('meat') && !ingredientStr.includes('chicken') && !ingredientStr.includes('fish')) {
      tags.push('vegetarian');
    }

    if (!ingredientStr.includes('dairy') && !ingredientStr.includes('milk') && !ingredientStr.includes('cheese')) {
      tags.push('dairy-free');
    }

    return tags;
  }

  private async saveMealPlan(mealPlan: MealPlan) {
    try {
      await supabase
        .from('meal_plans')
        .upsert(mealPlan, { onConflict: 'id' });
    } catch (error) {
      console.error('Error saving meal plan:', error);
    }
  }

  // Geçmiş planları yükle
  async getMealPlanHistory(days: number = 7) {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false })
        .limit(days);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading meal plan history:', error);
      return [];
    }
  }

  // Mevcut planı getir
  async getCurrentMealPlan(date: string) {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', this.userId)
        .eq('date', date)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading current meal plan:', error);
      return null;
    }
  }
}

// Export singleton and utility functions
export const createSmartMealPlanner = (userId: string) => new SmartMealPlanner(userId);