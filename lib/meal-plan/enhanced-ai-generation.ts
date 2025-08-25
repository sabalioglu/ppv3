// lib/meal-plan/enhanced-ai-generation.ts
// Geliştirilmiş AI meal generation sistemi - Çeşitlilik ve kişiselleştirme ile

import { PantryItem, UserProfile, Meal } from './types';
import { PersonalizedMealGenerator } from './personalized-generation';
import { EnhancedDiversityManager } from './enhanced-diversity';
import { generateAIMealWithQualityControl } from './api-clients/ai-generation';

// Enhanced generation result
interface EnhancedGenerationResult {
  meal: Meal;
  diversityScore: number;
  personalizationScore: number;
  pantryUtilization: number;
  generationMethod: 'personalized' | 'cultural' | 'fallback';
  insights: {
    reasoning: string;
    adaptations: string[];
    diversityTips: string[];
    nextSuggestions: string[];
  };
}

// Generation options
interface EnhancedGenerationOptions {
  prioritizeDiversity: boolean;
  prioritizePersonalization: boolean;
  allowFallback: boolean;
  diversityThreshold: number;
  personalizationThreshold: number;
  maxAttempts: number;
}

// Enhanced meal generation service
export class EnhancedMealGenerator {
  private userId: string;
  private personalizedGenerator: PersonalizedMealGenerator;
  private diversityManager: EnhancedDiversityManager;

  constructor(userId: string) {
    this.userId = userId;
    this.personalizedGenerator = new PersonalizedMealGenerator(userId);
    this.diversityManager = new EnhancedDiversityManager(userId);
  }

  // ✅ Ana enhanced generation fonksiyonu
  async generateEnhancedMeal(
    mealType: string,
    pantryItems: PantryItem[],
    userProfile: UserProfile | null,
    previousMeals: Meal[] = [],
    options?: Partial<EnhancedGenerationOptions>
  ): Promise<EnhancedGenerationResult> {
    
    const opts: EnhancedGenerationOptions = {
      prioritizeDiversity: true,
      prioritizePersonalization: true,
      allowFallback: true,
      diversityThreshold: 70,
      personalizationThreshold: 60,
      maxAttempts: 3,
      ...options
    };

    console.log(`🚀 Starting enhanced meal generation for ${mealType}`);
    console.log(`📊 Options:`, opts);
    
    let attempts = 0;
    let bestResult: EnhancedGenerationResult | null = null;
    let bestScore = 0;

    while (attempts < opts.maxAttempts) {
      attempts++;
      console.log(`🎯 Enhanced generation attempt ${attempts}/${opts.maxAttempts}`);

      try {
        // 1. Try personalized generation first
        const personalizedResult = await this.tryPersonalizedGeneration(
          mealType, pantryItems, userProfile, previousMeals
        );

        if (personalizedResult) {
          const score = this.calculateOverallScore(personalizedResult, opts);
          
          if (score > bestScore) {
            bestResult = personalizedResult;
            bestScore = score;
          }

          // Check if meets thresholds
          if (
            personalizedResult.diversityScore >= opts.diversityThreshold &&
            personalizedResult.personalizationScore >= opts.personalizationThreshold
          ) {
            console.log(`✅ Enhanced personalized meal accepted with score ${score}`);
            return personalizedResult;
          }
        }

        // 2. Fallback to cultural generation
        const culturalResult = await this.tryCulturalGeneration(
          mealType, pantryItems, userProfile, previousMeals
        );

        if (culturalResult) {
          const score = this.calculateOverallScore(culturalResult, opts);
          
          if (score > bestScore) {
            bestResult = culturalResult;
            bestScore = score;
          }

          // Lower threshold for cultural generation
          if (culturalResult.diversityScore >= opts.diversityThreshold * 0.8) {
            console.log(`✅ Enhanced cultural meal accepted with score ${score}`);
            return culturalResult;
          }
        }

      } catch (error) {
        console.error(`⚠️ Enhanced generation attempt ${attempts} failed:`, error);
        if (attempts === opts.maxAttempts && !bestResult && opts.allowFallback) {
          // Last resort fallback
          return await this.generateFallbackMeal(mealType, pantryItems, userProfile);
        }
      }
    }

    if (bestResult) {
      console.log(`✅ Using best enhanced meal with score ${bestScore}`);
      return bestResult;
    }

    if (opts.allowFallback) {
      return await this.generateFallbackMeal(mealType, pantryItems, userProfile);
    }

    throw new Error('Failed to generate enhanced meal after all attempts');
  }

  // ✅ Personalized generation denemesi
  private async tryPersonalizedGeneration(
    mealType: string,
    pantryItems: PantryItem[],
    userProfile: UserProfile | null,
    previousMeals: Meal[]
  ): Promise<EnhancedGenerationResult | null> {
    try {
      console.log('🎨 Trying personalized generation...');
      
      const result = await this.personalizedGenerator.generatePersonalizedMeal(
        mealType, pantryItems, previousMeals
      );

      if (!result.meal) {
        return null;
      }

      // Diversity check
      const diversityCheck = await this.diversityManager.loadMealHistory();
      const diversityRecommendations = this.diversityManager.getDiversityRecommendations();
      
      // Calculate scores
      const diversityScore = this.calculateDiversityScore(result.meal, diversityRecommendations);
      const personalizationScore = result.personalizationInsights.confidenceScore;
      const pantryUtilization = result.meal.pantryUsagePercentage || 0;

      return {
        meal: result.meal,
        diversityScore,
        personalizationScore,
        pantryUtilization,
        generationMethod: 'personalized',
        insights: {
          reasoning: result.personalizationInsights.reasoning,
          adaptations: result.personalizationInsights.adaptations,
          diversityTips: this.generateDiversityTips(diversityRecommendations),
          nextSuggestions: this.generateNextSuggestions(result.meal, userProfile)
        }
      };

    } catch (error) {
      console.error('❌ Personalized generation failed:', error);
      return null;
    }
  }

  // ✅ Cultural generation denemesi
  private async tryCulturalGeneration(
    mealType: string,
    pantryItems: PantryItem[],
    userProfile: UserProfile | null,
    previousMeals: Meal[]
  ): Promise<EnhancedGenerationResult | null> {
    try {
      console.log('🌍 Trying cultural generation...');
      
      const meal = await generateAIMealWithQualityControl(
        mealType, pantryItems, userProfile, previousMeals
      );

      // Diversity check
      await this.diversityManager.loadMealHistory();
      const diversityRecommendations = this.diversityManager.getDiversityRecommendations();
      
      // Calculate scores
      const diversityScore = this.calculateDiversityScore(meal, diversityRecommendations);
      const personalizationScore = this.estimatePersonalizationScore(meal, userProfile);
      const pantryUtilization = meal.pantryUsagePercentage || 0;

      return {
        meal,
        diversityScore,
        personalizationScore,
        pantryUtilization,
        generationMethod: 'cultural',
        insights: {
          reasoning: `Cultural AI generation based on cuisine preferences and pantry optimization`,
          adaptations: ['Applied cultural cooking patterns', 'Optimized for pantry ingredients'],
          diversityTips: this.generateDiversityTips(diversityRecommendations),
          nextSuggestions: this.generateNextSuggestions(meal, userProfile)
        }
      };

    } catch (error) {
      console.error('❌ Cultural generation failed:', error);
      return null;
    }
  }

  // ✅ Fallback meal generation
  private async generateFallbackMeal(
    mealType: string,
    pantryItems: PantryItem[],
    userProfile: UserProfile | null
  ): Promise<EnhancedGenerationResult> {
    console.log('🔄 Generating enhanced fallback meal...');

    const fallbackMeals = {
      breakfast: {
        name: 'Quick Pantry Breakfast',
        ingredients: this.selectAvailableIngredients(pantryItems, ['eggs', 'bread', 'milk', 'banana'], 3),
        calories: 320,
        protein: 15,
        carbs: 35,
        fat: 12
      },
      lunch: {
        name: 'Simple Pantry Lunch',
        ingredients: this.selectAvailableIngredients(pantryItems, ['rice', 'chicken', 'vegetables', 'oil'], 3),
        calories: 450,
        protein: 25,
        carbs: 50,
        fat: 15
      },
      dinner: {
        name: 'Easy Pantry Dinner',
        ingredients: this.selectAvailableIngredients(pantryItems, ['pasta', 'tomato', 'cheese', 'herbs'], 4),
        calories: 550,
        protein: 20,
        carbs: 65,
        fat: 18
      },
      snack: {
        name: 'Healthy Pantry Snack',
        ingredients: this.selectAvailableIngredients(pantryItems, ['apple', 'nuts', 'yogurt'], 2),
        calories: 180,
        protein: 8,
        carbs: 20,
        fat: 8
      }
    };

    const template = fallbackMeals[mealType as keyof typeof fallbackMeals] || fallbackMeals.lunch;
    
    const meal: Meal = {
      id: `enhanced_fallback_${mealType}_${Date.now()}`,
      name: template.name,
      ingredients: template.ingredients.map(item => ({
        name: item.name,
        amount: 1,
        unit: 'portion',
        category: item.category || 'General',
        fromPantry: true
      })),
      calories: template.calories,
      protein: template.protein,
      carbs: template.carbs,
      fat: template.fat,
      fiber: 5,
      prepTime: 10,
      cookTime: 15,
      servings: 1,
      difficulty: 'Easy' as const,
      emoji: this.getFallbackEmoji(mealType),
      category: mealType,
      tags: ['fallback', 'simple', 'pantry-based'],
      instructions: [
        'Gather available ingredients from your pantry',
        'Combine ingredients using basic cooking methods',
        'Season to taste and serve'
      ],
      source: 'enhanced_fallback',
      created_at: new Date().toISOString(),
      pantryUsagePercentage: Math.round((template.ingredients.length / Math.max(pantryItems.length, 1)) * 100),
      shoppingListItems: [],
      matchPercentage: 60,
      pantryMatch: template.ingredients.length,
      totalIngredients: template.ingredients.length,
      missingIngredients: []
    };

    return {
      meal,
      diversityScore: 50, // Moderate score for fallback
      personalizationScore: 40, // Lower for fallback
      pantryUtilization: meal.pantryUsagePercentage,
      generationMethod: 'fallback',
      insights: {
        reasoning: 'Generated fallback meal due to insufficient pantry variety or generation issues',
        adaptations: ['Used available pantry ingredients', 'Kept complexity simple'],
        diversityTips: [
          'Add more variety to your pantry',
          'Try shopping for ingredients from different cuisines',
          'Stock up on versatile ingredients like herbs and spices'
        ],
        nextSuggestions: [
          'Consider adding more proteins to your pantry',
          'Stock fresh vegetables for better meal variety',
          'Try exploring new cuisines this week'
        ]
      }
    };
  }

  // ✅ Diversity score hesaplama
  private calculateDiversityScore(
    meal: Meal,
    diversityRecommendations: any
  ): number {
    const mealIngredients = meal.ingredients.map(i => i.name.toLowerCase());
    const overusedIngredients = mealIngredients.filter(ingredient => 
      diversityRecommendations.avoidIngredients.includes(ingredient)
    );

    let score = 100 - (overusedIngredients.length * 20); // Penalty for overused ingredients

    // Bonus for cuisine variety
    if (meal.tags?.some(tag => diversityRecommendations.suggestCuisines.includes(tag))) {
      score += 10;
    }

    // Bonus for ingredient variety
    if (meal.ingredients.length >= 4) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ✅ Personalization score tahmini
  private estimatePersonalizationScore(meal: Meal, userProfile: UserProfile | null): number {
    if (!userProfile) return 50; // Default score

    let score = 60; // Base score

    // Cuisine preference match
    if (userProfile.cuisine_preferences?.some(pref => 
      meal.tags?.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
    )) {
      score += 15;
    }

    // Dietary restrictions compliance
    if (userProfile.dietary_restrictions && userProfile.dietary_restrictions.length > 0) {
      // Check if meal violates any restrictions
      const ingredientNames = meal.ingredients.map(i => i.name.toLowerCase()).join(' ');
      const hasViolation = userProfile.dietary_restrictions.some(restriction => {
        if (restriction === 'vegetarian' && /chicken|beef|pork|fish|meat/.test(ingredientNames)) {
          return true;
        }
        if (restriction === 'vegan' && /chicken|beef|pork|fish|meat|dairy|milk|cheese|egg/.test(ingredientNames)) {
          return true;
        }
        return false;
      });
      
      if (!hasViolation) {
        score += 10;
      } else {
        score -= 20;
      }
    }

    // Health goals alignment
    if (userProfile.health_goals?.includes('weight_loss') && meal.calories < 400) {
      score += 10;
    }
    if (userProfile.health_goals?.includes('muscle_gain') && meal.protein >= 20) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ✅ Overall score hesaplama
  private calculateOverallScore(
    result: EnhancedGenerationResult,
    options: EnhancedGenerationOptions
  ): number {
    const diversityWeight = options.prioritizeDiversity ? 0.4 : 0.2;
    const personalizationWeight = options.prioritizePersonalization ? 0.4 : 0.2;
    const pantryWeight = 0.2;
    const methodBonus = result.generationMethod === 'personalized' ? 0.2 : 0.1;

    return (
      result.diversityScore * diversityWeight +
      result.personalizationScore * personalizationWeight +
      result.pantryUtilization * pantryWeight +
      methodBonus * 100
    );
  }

  // ✅ Mevcut pantry'den ingredient seçimi
  private selectAvailableIngredients(
    pantryItems: PantryItem[],
    preferred: string[],
    maxCount: number
  ): PantryItem[] {
    const selected: PantryItem[] = [];
    
    // First, try to find preferred ingredients
    for (const pref of preferred) {
      const found = pantryItems.find(item => 
        item.name.toLowerCase().includes(pref.toLowerCase())
      );
      if (found && selected.length < maxCount) {
        selected.push(found);
      }
    }
    
    // Fill remaining spots with any available ingredients
    for (const item of pantryItems) {
      if (selected.length >= maxCount) break;
      if (!selected.find(s => s.id === item.id)) {
        selected.push(item);
      }
    }
    
    return selected.slice(0, maxCount);
  }

  // ✅ Diversity tips üretimi
  private generateDiversityTips(diversityRecommendations: any): string[] {
    const tips: string[] = [];
    
    if (diversityRecommendations.suggestCuisines.length > 0) {
      tips.push(`Try ${diversityRecommendations.suggestCuisines[0]} cuisine next`);
    }
    
    if (diversityRecommendations.suggestCookingMethods.length > 0) {
      tips.push(`Experiment with ${diversityRecommendations.suggestCookingMethods[0]} cooking`);
    }
    
    if (diversityRecommendations.avoidIngredients.length > 3) {
      tips.push('Consider taking a break from frequently used ingredients');
    }
    
    return tips.length > 0 ? tips : ['Keep experimenting with new ingredient combinations!'];
  }

  // ✅ Next suggestions üretimi  
  private generateNextSuggestions(meal: Meal, userProfile: UserProfile | null): string[] {
    const suggestions: string[] = [];
    
    // Cuisine-based suggestions
    const cuisine = meal.tags?.find(tag => 
      ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean'].includes(tag)
    );
    
    if (cuisine) {
      suggestions.push(`Explore more ${cuisine} recipes this week`);
    }
    
    // Ingredient-based suggestions
    if (meal.ingredients.length < 4) {
      suggestions.push('Try adding more vegetables for nutrition variety');
    }
    
    // Health goal suggestions
    if (userProfile?.health_goals?.includes('weight_loss')) {
      suggestions.push('Consider lighter meals for the rest of the day');
    }
    
    return suggestions.length > 0 ? suggestions : ['Keep up the great meal planning!'];
  }

  // ✅ Fallback emoji seçimi
  private getFallbackEmoji(mealType: string): string {
    const emojis = {
      breakfast: '🥣',
      lunch: '🍽️',
      dinner: '🍲',
      snack: '🍎'
    };
    return emojis[mealType as keyof typeof emojis] || '🍽️';
  }
}

// ✅ Utility functions for easy usage
export const createEnhancedGenerator = (userId: string) => new EnhancedMealGenerator(userId);

export const generateEnhancedMealPlan = async (
  userId: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null
): Promise<{
  breakfast: EnhancedGenerationResult | null;
  lunch: EnhancedGenerationResult | null;
  dinner: EnhancedGenerationResult | null;
  snacks: EnhancedGenerationResult[];
  summary: {
    totalDiversityScore: number;
    totalPersonalizationScore: number;
    pantryUtilization: number;
    generationMethods: string[];
  };
}> => {
  console.log('🌟 Generating enhanced meal plan...');
  
  const generator = new EnhancedMealGenerator(userId);
  
  const breakfast = await generator.generateEnhancedMeal('breakfast', pantryItems, userProfile, []);
  const lunch = await generator.generateEnhancedMeal('lunch', pantryItems, userProfile, [breakfast.meal]);
  const dinner = await generator.generateEnhancedMeal('dinner', pantryItems, userProfile, [breakfast.meal, lunch.meal]);
  const snack = await generator.generateEnhancedMeal('snack', pantryItems, userProfile, [breakfast.meal, lunch.meal, dinner.meal]);
  
  const results = [breakfast, lunch, dinner, snack];
  
  return {
    breakfast,
    lunch,
    dinner,
    snacks: [snack],
    summary: {
      totalDiversityScore: Math.round(results.reduce((sum, r) => sum + r.diversityScore, 0) / results.length),
      totalPersonalizationScore: Math.round(results.reduce((sum, r) => sum + r.personalizationScore, 0) / results.length),
      pantryUtilization: Math.round(results.reduce((sum, r) => sum + r.pantryUtilization, 0) / results.length),
      generationMethods: results.map(r => r.generationMethod)
    }
  };
};