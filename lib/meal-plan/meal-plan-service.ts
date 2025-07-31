// lib/meal-plan/meal-plan-service.ts (KOMPLE YENİDEN YAZ)

import { AIRecipe, AIRecipeRequest } from './types/ai-recipe-types';
import { recipeOrchestrator, OrchestrationResult, OrchestrationOptions } from './recipe-orchestrator';
import { recipeValidator, ValidationResult } from './recipe-validator';

// Backward compatibility
export interface Recipe extends AIRecipe {}
export interface RecipeSearchParams {
  pantryItems: string[];
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  maxCookingTime?: number;
  servings?: number;
  dietaryRestrictions?: string[];
  allergies?: string[];
  cuisine?: string;
  userGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health';
}

export interface MealPlanRequest {
  meals: {
    breakfast?: RecipeSearchParams;
    lunch?: RecipeSearchParams;
    dinner?: RecipeSearchParams;
    snack?: RecipeSearchParams;
  };
  globalPreferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    userGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health';
    maxTotalCalories?: number;
    preferredCuisines?: string[];
  };
  options?: MealPlanOptions;
}

export interface MealPlanOptions {
  ensureVariety?: boolean;
  balanceNutrition?: boolean;
  optimizeForGoal?: boolean;
  maxRetries?: number;
  qualityThreshold?: number;
}

export interface MealPlan {
  id: string;
  createdAt: Date;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snack?: Recipe;
  };
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  varietyScore: number;
  qualityScore: number;
  pantryMatchScore: number;
  metadata: {
    generationTime: number;
    totalAttempts: number;
    userGoal?: string;
    dietaryRestrictions: string[];
    allergies: string[];
  };
}

export interface MealPlanResult {
  mealPlan: MealPlan | null;
  success: boolean;
  errors: string[];
  warnings: string[];
  orchestrationResults: {
    breakfast?: OrchestrationResult;
    lunch?: OrchestrationResult;
    dinner?: OrchestrationResult;
    snack?: OrchestrationResult;
  };
  validationResults: {
    breakfast?: ValidationResult;
    lunch?: ValidationResult;
    dinner?: ValidationResult;
    snack?: ValidationResult;
  };
}

export class MealPlanService {
  private orchestrationOptions: OrchestrationOptions;

  constructor(options: Partial<OrchestrationOptions> = {}) {
    this.orchestrationOptions = {
      maxRetries: options.maxRetries ?? 3,
      fallbackEnabled: options.fallbackEnabled ?? true,
      qualityThreshold: options.qualityThreshold ?? 75,
      timeoutMs: options.timeoutMs ?? 45000,
      enableVariation: options.enableVariation ?? true,
    };
  }

  // Main meal plan generation method
  async generateMealPlan(request: MealPlanRequest): Promise<MealPlanResult> {
    const startTime = Date.now();
    console.log('🍽️ Starting meal plan generation...', {
      meals: Object.keys(request.meals),
      globalPreferences: request.globalPreferences
    });

    const errors: string[] = [];
    const warnings: string[] = [];
    const orchestrationResults: MealPlanResult['orchestrationResults'] = {};
    const validationResults: MealPlanResult['validationResults'] = {};
    const meals: MealPlan['meals'] = {};

    // Apply global preferences to each meal
    const enrichedRequests = this.applyGlobalPreferences(request);

    // Generate each meal
    for (const [mealType, mealRequest] of Object.entries(enrichedRequests.meals)) {
      if (!mealRequest) continue;

      try {
        console.log(`🍳 Generating ${mealType}...`);

        // Convert to AI request format
        const aiRequest = this.convertToAIRequest(mealRequest, mealType as any);

        // Orchestrate recipe generation
        const orchestrationResult = await recipeOrchestrator.orchestrate(aiRequest);
        orchestrationResults[mealType as keyof typeof orchestrationResults] = orchestrationResult;

        if (orchestrationResult.success && orchestrationResult.recipe) {
          // Validate the recipe
          const validationResult = await recipeValidator.validateRecipe(
            orchestrationResult.recipe, 
            aiRequest
          );
          validationResults[mealType as keyof typeof validationResults] = validationResult;

          // Check if validation passed
          if (validationResult.isValid || validationResult.score >= 60) {
            meals[mealType as keyof typeof meals] = orchestrationResult.recipe;
            console.log(`✅ ${mealType} generated successfully (score: ${validationResult.score})`);
          } else {
            warnings.push(`${mealType}: Low quality recipe (score: ${validationResult.score})`);
            // Still include it but with warning
            meals[mealType as keyof typeof meals] = orchestrationResult.recipe;
          }
        } else {
          errors.push(`${mealType}: ${orchestrationResult.errors.join(', ')}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${mealType}: ${errorMsg}`);
        console.error(`❌ Failed to generate ${mealType}:`, error);
      }
    }

    const generationTime = Date.now() - startTime;

    // Calculate total nutrition and scores
    const totalNutrition = this.calculateTotalNutrition(meals);
    const varietyScore = this.calculateVarietyScore(meals);
    const qualityScore = this.calculateQualityScore(validationResults);
    const pantryMatchScore = this.calculatePantryMatchScore(meals);

    // Create meal plan
    const mealPlan: MealPlan | null = Object.keys(meals).length > 0 ? {
      id: this.generateMealPlanId(),
      createdAt: new Date(),
      meals,
      totalNutrition,
      varietyScore,
      qualityScore,
      pantryMatchScore,
      metadata: {
        generationTime,
        totalAttempts: Object.values(orchestrationResults).reduce((sum, result) => sum + (result?.attempts || 0), 0),
        userGoal: request.globalPreferences?.userGoal,
        dietaryRestrictions: request.globalPreferences?.dietaryRestrictions || [],
        allergies: request.globalPreferences?.allergies || [],
      }
    } : null;

    const result: MealPlanResult = {
      mealPlan,
      success: mealPlan !== null && errors.length === 0,
      errors,
      warnings,
      orchestrationResults,
      validationResults
    };

    console.log('🏁 Meal plan generation completed:', {
      success: result.success,
      mealsGenerated: Object.keys(meals).length,
      errors: errors.length,
      warnings: warnings.length,
      totalTime: `${generationTime}ms`
    });

    return result;
  }

  // Generate single recipe (legacy compatibility)
  async generateRecipe(params: RecipeSearchParams): Promise<Recipe | null> {
    try {
      const aiRequest = this.convertToAIRequest(params, params.mealType || 'breakfast');
      const result = await recipeOrchestrator.orchestrate(aiRequest);
      return result.recipe;
    } catch (error) {
      console.error('Failed to generate single recipe:', error);
      return null;
    }
  }

  // Regenerate specific meal in plan
  async regenerateMeal(
    originalPlan: MealPlan,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    feedback?: string
  ): Promise<Recipe | null> {
    try {
      console.log(`🔄 Regenerating ${mealType}...`);

      // Create request based on original plan metadata
      const request: AIRecipeRequest = {
        pantryItems: [], // This should come from user context
        mealType,
        servings: 2,
        dietaryRestrictions: originalPlan.metadata.dietaryRestrictions,
        allergies: originalPlan.metadata.allergies,
        userGoal: (originalPlan.metadata.userGoal as any) || 'general_health',
        avoidIngredients: [],
        preferredIngredients: []
      };

      // If there was a previous meal, add its ingredients to avoid list
      const previousMeal = originalPlan.meals[mealType];
      if (previousMeal) {
        request.avoidIngredients = previousMeal.ingredients.slice(0, 3).map(ing => ing.name);
      }

      const result = await recipeOrchestrator.orchestrate(request);
      return result.recipe;

    } catch (error) {
      console.error(`Failed to regenerate ${mealType}:`, error);
      return null;
    }
  }

  // Optimize existing meal plan
  async optimizeMealPlan(mealPlan: MealPlan, optimizationGoals: string[] = []): Promise<MealPlan> {
    console.log('⚡ Optimizing meal plan...', optimizationGoals);

    // Create optimized version
    const optimizedMeals = { ...mealPlan.meals };

    // Apply optimizations based on goals
    if (optimizationGoals.includes('balance_nutrition')) {
      // Analyze current nutrition balance and suggest improvements
      const currentNutrition = mealPlan.totalNutrition;
      console.log('📊 Current nutrition:', currentNutrition);
      
      // Logic to rebalance meals could go here
    }

    if (optimizationGoals.includes('increase_variety')) {
      // Ensure variety across meals
      console.log('🌈 Increasing meal variety...');
    }

    if (optimizationGoals.includes('improve_pantry_match')) {
      // Optimize for better pantry utilization
      console.log('📦 Improving pantry match...');
    }

    // Recalculate scores
    const newTotalNutrition = this.calculateTotalNutrition(optimizedMeals);
    const newVarietyScore = this.calculateVarietyScore(optimizedMeals);
    const newQualityScore = mealPlan.qualityScore; // Keep original for now
    const newPantryMatchScore = this.calculatePantryMatchScore(optimizedMeals);

    return {
      ...mealPlan,
      meals: optimizedMeals,
      totalNutrition: newTotalNutrition,
      varietyScore: newVarietyScore,
      qualityScore: newQualityScore,
      pantryMatchScore: newPantryMatchScore,
      id: this.generateMealPlanId(), // New ID for optimized version
      createdAt: new Date(),
    };
  }

  // Get meal plan suggestions
  async getMealPlanSuggestions(userPreferences: {
    goal?: string;
    restrictions?: string[];
    allergies?: string[];
    preferredMeals?: string[];
  }): Promise<string[]> {
    const suggestions: string[] = [];

    // Goal-based suggestions
    if (userPreferences.goal === 'weight_loss') {
      suggestions.push('Focus on high-protein, low-carb meals');
      suggestions.push('Include more vegetables and lean proteins');
      suggestions.push('Consider smaller portion sizes');
    } else if (userPreferences.goal === 'muscle_gain') {
      suggestions.push('Increase protein intake across all meals');
      suggestions.push('Include complex carbohydrates for energy');
      suggestions.push('Add post-workout snacks');
    }

    // Restriction-based suggestions
    if (userPreferences.restrictions?.includes('vegetarian')) {
      suggestions.push('Explore plant-based protein sources');
      suggestions.push('Include variety of legumes and nuts');
    }

    return suggestions;
  }

  // Private helper methods
  private applyGlobalPreferences(request: MealPlanRequest): MealPlanRequest {
    const global = request.globalPreferences;
    if (!global) return request;

    const enrichedMeals: typeof request.meals = {};

    for (const [mealType, mealRequest] of Object.entries(request.meals)) {
      if (!mealRequest) continue;

      enrichedMeals[mealType as keyof typeof enrichedMeals] = {
        ...mealRequest,
        dietaryRestrictions: [
          ...(mealRequest.dietaryRestrictions || []),
          ...(global.dietaryRestrictions || [])
        ],
        allergies: [
          ...(mealRequest.allergies || []),
          ...(global.allergies || [])
        ],
        userGoal: mealRequest.userGoal || global.userGoal,
      };
    }

    return {
      ...request,
      meals: enrichedMeals
    };
  }

  private convertToAIRequest(params: RecipeSearchParams, mealType: string): AIRecipeRequest {
    return {
      pantryItems: params.pantryItems || [],
      mealType: mealType as any,
      servings: params.servings || 2,
      maxCookingTime: params.maxCookingTime,
      difficulty: 'easy',
      cuisine: params.cuisine,
      dietaryRestrictions: params.dietaryRestrictions || [],
      allergies: params.allergies || [],
      avoidIngredients: [],
      preferredIngredients: [],
      userGoal: params.userGoal || 'general_health'
    };
  }

  private calculateTotalNutrition(meals: MealPlan['meals']): MealPlan['totalNutrition'] {
    const total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    Object.values(meals).forEach(meal => {
      if (meal) {
        total.calories += meal.calories || 0;
        total.protein += meal.macros?.protein || 0;
        total.carbs += meal.macros?.carbs || 0;
        total.fat += meal.macros?.fat || 0;
        total.fiber += meal.macros?.fiber || 0;
      }
    });

    return total;
  }

  private calculateVarietyScore(meals: MealPlan['meals']): number {
    const mealArray = Object.values(meals).filter(Boolean);
    if (mealArray.length === 0) return 0;

    // Check cuisine variety
    const cuisines = new Set(mealArray.map(meal => meal.cuisine));
    const cuisineVariety = cuisines.size / mealArray.length;

    // Check ingredient variety
    const allIngredients = mealArray.flatMap(meal => meal.ingredients.map(ing => ing.name.toLowerCase()));
    const uniqueIngredients = new Set(allIngredients);
    const ingredientVariety = uniqueIngredients.size / allIngredients.length;

    // Check cooking method variety
    const cookingMethods = mealArray.map(meal => 
      meal.instructions.join(' ').toLowerCase().includes('bake') ? 'bake' :
      meal.instructions.join(' ').toLowerCase().includes('fry') ? 'fry' :
      meal.instructions.join(' ').toLowerCase().includes('boil') ? 'boil' : 'other'
    );
    const methodVariety = new Set(cookingMethods).size / cookingMethods.length;

    return Math.round((cuisineVariety + ingredientVariety + methodVariety) / 3 * 100);
  }

  private calculateQualityScore(validationResults: MealPlanResult['validationResults']): number {
    const results = Object.values(validationResults).filter(Boolean);
    if (results.length === 0) return 0;

    const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    return Math.round(avgScore);
  }

  private calculatePantryMatchScore(meals: MealPlan['meals']): number {
    const mealArray = Object.values(meals).filter(Boolean);
    if (mealArray.length === 0) return 0;

    const avgMatch = mealArray.reduce((sum, meal) => sum + (meal.pantryMatch || 0), 0) / mealArray.length;
    return Math.round(avgMatch);
  }

  private generateMealPlanId(): string {
    return `meal-plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Configuration methods
  updateOrchestrationOptions(options: Partial<OrchestrationOptions>): void {
    this.orchestrationOptions = { ...this.orchestrationOptions, ...options };
  }

  getOrchestrationOptions(): OrchestrationOptions {
    return { ...this.orchestrationOptions };
  }
}

// Export singleton instance
export const mealPlanService = new MealPlanService();

// Legacy exports
export default MealPlanService;
