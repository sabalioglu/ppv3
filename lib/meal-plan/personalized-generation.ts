// lib/meal-plan/personalized-generation.ts
// Onboarding tercihlerine göre kişiselleştirilmiş meal plan üretimi

import { UserProfile, PantryItem, Meal } from './types';
import { supabase } from '../supabase';
import { EnhancedDiversityManager } from './enhanced-diversity';

// Detaylı kullanıcı profil analizi
interface DetailedUserProfile extends UserProfile {
  // Onboarding'den gelen ek bilgiler
  activity_level?: string;
  health_goals?: string[];
  cooking_skill_level?: string;
  time_constraints?: string;
  family_size?: number;
  budget_range?: string;
  cuisine_preferences?: string[];
  meal_frequency?: string;
  special_occasions?: string[];
  
  // Hesaplanmış değerler
  daily_calorie_target?: number;
  macro_targets?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  
  // Kişilik profili
  adventurous_score?: number; // 1-10, ne kadar yeni şeyler denemek istiyor
  convenience_preference?: number; // 1-10, ne kadar hızlı/kolay meal istiyor  
  health_consciousness?: number; // 1-10, sağlık bilinci
  social_eating?: boolean; // Ailece yemek mi yoksa tek kişilik mi
}

// Meal önerisi context'i
interface MealGenerationContext {
  userProfile: DetailedUserProfile;
  pantryItems: PantryItem[];
  mealType: string;
  previousMeals: Meal[];
  timeOfDay: Date;
  dayOfWeek: string;
  season: string;
  diversityManager: EnhancedDiversityManager;
}

// Akıllı öneri engine'i
export class PersonalizedMealGenerator {
  private userId: string;
  private userProfile: DetailedUserProfile | null = null;
  private diversityManager: EnhancedDiversityManager;

  constructor(userId: string) {
    this.userId = userId;
    this.diversityManager = new EnhancedDiversityManager(userId);
  }

  // ✅ Detaylı kullanıcı profili yükle ve analiz et
  async loadAndAnalyzeUserProfile(): Promise<DetailedUserProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!profile) {
        console.log('🔍 No user profile found, using defaults');
        return this.createDefaultProfile();
      }

      // Onboarding verilerini analiz et ve profili genişlet
      const analyzedProfile = this.analyzeOnboardingData(profile);
      this.userProfile = analyzedProfile;
      
      console.log('✅ User profile loaded and analyzed:', {
        healthGoals: analyzedProfile.health_goals,
        cuisinePrefs: analyzedProfile.cuisine_preferences,
        skillLevel: analyzedProfile.cooking_skill_level,
        adventurousScore: analyzedProfile.adventurous_score
      });
      
      return analyzedProfile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return this.createDefaultProfile();
    }
  }

  // ✅ Onboarding verilerini analiz et ve kişilik profili çıkar
  private analyzeOnboardingData(profile: any): DetailedUserProfile {
    // Temel BMR ve calorie hesaplama
    const dailyCalorieTarget = this.calculateDailyCalorieTarget(profile);
    const macroTargets = this.calculateMacroTargets(dailyCalorieTarget, profile.health_goals || []);
    
    // Kişilik skorları hesapla
    const adventurousScore = this.calculateAdventurousScore(profile);
    const conveniencePreference = this.calculateConveniencePreference(profile);
    const healthConsciousness = this.calculateHealthConsciousness(profile);
    
    return {
      ...profile,
      daily_calorie_target: dailyCalorieTarget,
      macro_targets: macroTargets,
      adventurous_score: adventurousScore,
      convenience_preference: conveniencePreference,
      health_consciousness: healthConsciousness,
      social_eating: (profile.family_size || 1) > 1
    };
  }

  // ✅ Default profil oluştur
  private createDefaultProfile(): DetailedUserProfile {
    const dailyCalorieTarget = 2000; // Default
    return {
      id: this.userId,
      daily_calorie_target: dailyCalorieTarget,
      macro_targets: {
        protein: Math.round(dailyCalorieTarget * 0.25 / 4),
        carbs: Math.round(dailyCalorieTarget * 0.45 / 4),
        fat: Math.round(dailyCalorieTarget * 0.30 / 9),
        fiber: 25
      },
      activity_level: 'moderately_active',
      health_goals: ['balanced_nutrition'],
      cooking_skill_level: 'beginner',
      cuisine_preferences: ['international'],
      dietary_preferences: ['balanced'],
      dietary_restrictions: [],
      allergens: [],
      adventurous_score: 5,
      convenience_preference: 5,
      health_consciousness: 5,
      social_eating: false
    };
  }

  // ✅ Günlük kalori hedefi hesapla
  private calculateDailyCalorieTarget(profile: any): number {
    if (!profile.age || !profile.height_cm || !profile.weight_kg || !profile.gender) {
      return 2000; // Default
    }

    // Mifflin-St Jeor Formula
    let bmr = 0;
    if (profile.gender === 'male') {
      bmr = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5;
    } else {
      bmr = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) - 161;
    }

    // Activity factor
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extra_active': 1.9
    };

    const multiplier = activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] || 1.55;
    let totalCalories = bmr * multiplier;

    // Health goals adjustment
    if (profile.health_goals?.includes('weight_loss')) {
      totalCalories *= 0.85; // 15% deficit
    } else if (profile.health_goals?.includes('muscle_gain')) {
      totalCalories *= 1.15; // 15% surplus
    }

    return Math.round(totalCalories);
  }

  // ✅ Makro hedefleri hesapla
  private calculateMacroTargets(calories: number, healthGoals: string[]) {
    let proteinRatio = 0.25;
    let carbRatio = 0.45;
    let fatRatio = 0.30;

    if (healthGoals.includes('muscle_gain')) {
      proteinRatio = 0.30;
      carbRatio = 0.40;
      fatRatio = 0.30;
    } else if (healthGoals.includes('weight_loss')) {
      proteinRatio = 0.30;
      carbRatio = 0.35;
      fatRatio = 0.35;
    } else if (healthGoals.includes('heart_health')) {
      proteinRatio = 0.20;
      carbRatio = 0.50;
      fatRatio = 0.30;
    }

    return {
      protein: Math.round((calories * proteinRatio) / 4), // grams
      carbs: Math.round((calories * carbRatio) / 4), // grams
      fat: Math.round((calories * fatRatio) / 9), // grams
      fiber: healthGoals.includes('digestive_health') ? 35 : 25 // grams
    };
  }

  // ✅ Macera skorunu hesapla
  private calculateAdventurousScore(profile: any): number {
    let score = 5; // Default middle
    
    // Cuisine preferences çeşitliliği
    const cuisineCount = profile.cuisine_preferences?.length || 0;
    if (cuisineCount > 5) score += 2;
    else if (cuisineCount > 3) score += 1;
    else if (cuisineCount < 2) score -= 1;

    // Cooking skill level
    if (profile.cooking_skill_level === 'expert') score += 2;
    else if (profile.cooking_skill_level === 'intermediate') score += 1;
    else if (profile.cooking_skill_level === 'beginner') score -= 1;

    // Special dietary preferences (vegan, keto, etc. shows willingness to try different things)
    if (profile.dietary_preferences?.some((pref: string) => 
      ['vegan', 'vegetarian', 'keto', 'paleo', 'mediterranean'].includes(pref)
    )) {
      score += 1;
    }

    return Math.max(1, Math.min(10, score));
  }

  // ✅ Kolaylık tercihi skorunu hesapla
  private calculateConveniencePreference(profile: any): number {
    let score = 5; // Default middle
    
    // Activity level - çok aktif kişiler hızlı meal ister
    if (profile.activity_level === 'extra_active' || profile.activity_level === 'very_active') {
      score += 2;
    }

    // Family size - büyük aile hızlı meal ister
    if (profile.family_size > 3) score += 1;
    else if (profile.family_size === 1) score -= 1;

    // Cooking skill - acemi olanlar kolay meal ister
    if (profile.cooking_skill_level === 'beginner') score += 2;
    else if (profile.cooking_skill_level === 'expert') score -= 1;

    return Math.max(1, Math.min(10, score));
  }

  // ✅ Sağlık bilinci skorunu hesapla
  private calculateHealthConsciousness(profile: any): number {
    let score = 5; // Default middle
    
    // Health goals varlığı
    const healthGoalsCount = profile.health_goals?.length || 0;
    if (healthGoalsCount > 3) score += 2;
    else if (healthGoalsCount > 1) score += 1;
    else if (healthGoalsCount === 0) score -= 1;

    // Dietary restrictions/preferences
    if (profile.dietary_restrictions?.length > 0) score += 1;
    if (profile.allergens?.length > 0) score += 1;

    // Specific health-conscious choices
    if (profile.health_goals?.some((goal: string) => 
      ['heart_health', 'blood_sugar_control', 'digestive_health'].includes(goal)
    )) {
      score += 2;
    }

    return Math.max(1, Math.min(10, score));
  }

  // ✅ Kişiselleştirilmiş meal generation
  async generatePersonalizedMeal(
    mealType: string,
    pantryItems: PantryItem[],
    previousMeals: Meal[] = []
  ): Promise<{
    meal: Meal | null;
    personalizationInsights: {
      reasoning: string;
      adaptations: string[];
      confidenceScore: number;
    };
  }> {
    // Profili yükle
    if (!this.userProfile) {
      this.userProfile = await this.loadAndAnalyzeUserProfile();
    }

    if (!this.userProfile) {
      throw new Error('Could not load user profile');
    }

    // Context oluştur
    const now = new Date();
    const context: MealGenerationContext = {
      userProfile: this.userProfile,
      pantryItems,
      mealType,
      previousMeals,
      timeOfDay: now,
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      season: this.getCurrentSeason(),
      diversityManager: this.diversityManager
    };

    // Kişiselleştirilmiş filtreler uygula
    const smartCombinations = await this.diversityManager.generateSmartCombinations(
      pantryItems,
      mealType,
      this.userProfile,
      5
    );

    if (smartCombinations.length === 0) {
      return {
        meal: null,
        personalizationInsights: {
          reasoning: 'Insufficient pantry items for personalized meal generation',
          adaptations: ['Add more ingredients to your pantry', 'Try shopping for recommended items'],
          confidenceScore: 0
        }
      };
    }

    // En iyi kombinasyonu seç ve meal'e dönüştür
    const bestCombo = this.selectBestComboForUser(smartCombinations, context);
    const meal = await this.convertComboToMeal(bestCombo, context);

    // Personalization insights
    const insights = this.generatePersonalizationInsights(bestCombo, context);

    // Meal'i history'ye kaydet
    if (meal) {
      await this.diversityManager.saveMealToHistory(meal);
    }

    return {
      meal,
      personalizationInsights: insights
    };
  }

  // ✅ Kullanıcıya en uygun combo seç
  private selectBestComboForUser(combinations: any[], context: MealGenerationContext): any {
    return combinations
      .map(combo => ({
        ...combo,
        personalizedScore: this.calculatePersonalizationScore(combo, context)
      }))
      .sort((a, b) => b.personalizedScore - a.personalizedScore)[0];
  }

  // ✅ Kişiselleştirme skorunu hesapla
  private calculatePersonalizationScore(combo: any, context: MealGenerationContext): number {
    let score = combo.score; // Base score
    const profile = context.userProfile;

    // Complexity preference (convenience vs adventurous)
    if (combo.complexity === 'easy' && profile.convenience_preference! > 7) {
      score += 20;
    } else if (combo.complexity === 'hard' && profile.adventurous_score! > 7) {
      score += 15;
    } else if (combo.complexity === 'medium') {
      score += 10; // Medium is generally good
    }

    // Cuisine preference match
    if (profile.cuisine_preferences?.includes(combo.cuisineMatch)) {
      score += 25;
    }

    // Health consciousness
    if (profile.health_consciousness! > 7 && combo.nutritionBalance > 80) {
      score += 20;
    }

    // Time-based adjustments
    const hour = context.timeOfDay.getHours();
    if (context.mealType === 'breakfast' && hour > 9 && profile.convenience_preference! > 6) {
      // Late breakfast, prefer quick options
      if (combo.complexity === 'easy') score += 15;
    }

    // Weekend vs weekday
    const isWeekend = ['Saturday', 'Sunday'].includes(context.dayOfWeek);
    if (isWeekend && profile.adventurous_score! > 6 && combo.complexity !== 'easy') {
      score += 10; // More time for complex meals on weekends
    }

    return score;
  }

  // ✅ Combo'yu meal'e dönüştür
  private async convertComboToMeal(combo: any, context: MealGenerationContext): Promise<Meal> {
    const caloriesPerMeal = this.getMealCalorieTarget(context.mealType, context.userProfile);
    
    return {
      id: `personalized_${context.mealType}_${Date.now()}`,
      name: this.generatePersonalizedMealName(combo, context),
      ingredients: combo.ingredients,
      calories: caloriesPerMeal,
      protein: Math.round(caloriesPerMeal * 0.25 / 4),
      carbs: Math.round(caloriesPerMeal * 0.45 / 4),
      fat: Math.round(caloriesPerMeal * 0.30 / 9),
      fiber: Math.round(caloriesPerMeal * 0.05),
      prepTime: combo.complexity === 'easy' ? 10 : combo.complexity === 'medium' ? 20 : 30,
      cookTime: combo.complexity === 'easy' ? 10 : combo.complexity === 'medium' ? 20 : 35,
      servings: context.userProfile.social_eating ? 2 : 1,
      difficulty: combo.complexity,
      emoji: this.getPersonalizedEmoji(combo, context),
      category: context.mealType,
      tags: [combo.cuisineMatch, context.mealType, combo.complexity, 'personalized'],
      instructions: this.generatePersonalizedInstructions(combo, context),
      source: 'ai_personalized',
      created_at: new Date().toISOString(),
      pantryUsagePercentage: Math.round((combo.ingredients.length / context.pantryItems.length) * 100),
      shoppingListItems: [],
      matchPercentage: combo.noveltyScore,
      pantryMatch: combo.ingredients.length,
      totalIngredients: combo.ingredients.length,
      missingIngredients: []
    };
  }

  // ✅ Kişiselleştirilmiş meal ismi oluştur
  private generatePersonalizedMealName(combo: any, context: MealGenerationContext): string {
    const profile = context.userProfile;
    const mainIngredient = combo.ingredients[0]?.name || 'Mixed';
    const cuisine = combo.cuisineMatch;
    const method = combo.cookingMethod;
    
    // Skill level'e göre isim karmaşıklığı
    if (profile.cooking_skill_level === 'beginner') {
      return `Simple ${mainIngredient} ${context.mealType}`;
    } else if (profile.adventurous_score! > 7) {
      return `${cuisine} ${method} ${mainIngredient} Fusion`;
    } else {
      return `${method} ${mainIngredient} ${cuisine} Style`;
    }
  }

  // ✅ Kişiselleştirilmiş emoji seç
  private getPersonalizedEmoji(combo: any, context: MealGenerationContext): string {
    const cuisine = combo.cuisineMatch.toLowerCase();
    const cuisineEmojis: { [key: string]: string } = {
      'asian': '🥢',
      'italian': '🍝',
      'mexican': '🌮',
      'indian': '🍛',
      'mediterranean': '🫒',
      'american': '🍔',
      'international': '🍽️'
    };

    return cuisineEmojis[cuisine] || '🍽️';
  }

  // ✅ Kişiselleştirilmiş talimatlar oluştur
  private generatePersonalizedInstructions(combo: any, context: MealGenerationContext): string[] {
    const profile = context.userProfile;
    const skillLevel = profile.cooking_skill_level;
    
    if (skillLevel === 'beginner') {
      return [
        `Prepare ${combo.ingredients.map((i: any) => i.name).join(', ')}`,
        `${combo.cookingMethod} the ingredients according to package directions`,
        'Season to taste and serve hot'
      ];
    } else if (skillLevel === 'expert') {
      return [
        `Mise en place: prep ${combo.ingredients.map((i: any) => i.name).join(', ')}`,
        `Use ${combo.cookingMethod} technique for optimal flavor development`,
        'Adjust seasoning and plating for restaurant-quality presentation'
      ];
    } else {
      return [
        `Gather and prep ${combo.ingredients.map((i: any) => i.name).join(', ')}`,
        `${combo.cookingMethod} ingredients until properly cooked`,
        'Season well and serve immediately'
      ];
    }
  }

  // ✅ Meal için kalori hedefi
  private getMealCalorieTarget(mealType: string, profile: DetailedUserProfile): number {
    const totalCalories = profile.daily_calorie_target || 2000;
    
    const distribution = {
      'breakfast': 0.25,
      'lunch': 0.35,
      'dinner': 0.35,
      'snack': 0.05
    };
    
    return Math.round(totalCalories * (distribution[mealType as keyof typeof distribution] || 0.25));
  }

  // ✅ Mevcut sezonu tespit et
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // ✅ Kişiselleştirme insights oluştur
  private generatePersonalizationInsights(combo: any, context: MealGenerationContext): {
    reasoning: string;
    adaptations: string[];
    confidenceScore: number;
  } {
    const profile = context.userProfile;
    const adaptations: string[] = [];
    
    // Skill level adaptations
    if (profile.cooking_skill_level === 'beginner') {
      adaptations.push('Simplified cooking method for easy preparation');
    } else if (profile.adventurous_score! > 7) {
      adaptations.push('Added fusion elements to challenge your culinary skills');
    }

    // Health goal adaptations
    if (profile.health_goals?.includes('weight_loss')) {
      adaptations.push('Reduced calorie density while maintaining protein');
    }
    if (profile.health_goals?.includes('muscle_gain')) {
      adaptations.push('Increased protein content for muscle building');
    }

    // Convenience adaptations
    if (profile.convenience_preference! > 7) {
      adaptations.push('Optimized for quick preparation and minimal cleanup');
    }

    const reasoning = `Selected based on your ${profile.cooking_skill_level} skill level, ${profile.adventurous_score}/10 adventurousness, and preference for ${combo.cuisineMatch} cuisine.`;
    
    const confidenceScore = Math.min(95, 60 + (combo.personalizedScore / 10));

    return {
      reasoning,
      adaptations,
      confidenceScore
    };
  }
}

// ✅ Utility function to create personalized generator
export const createPersonalizedGenerator = (userId: string) => 
  new PersonalizedMealGenerator(userId);

// ✅ Quick personalized meal generation
export const generateQuickPersonalizedMeal = async (
  userId: string,
  mealType: string,
  pantryItems: PantryItem[],
  previousMeals: Meal[] = []
) => {
  const generator = new PersonalizedMealGenerator(userId);
  return await generator.generatePersonalizedMeal(mealType, pantryItems, previousMeals);
};