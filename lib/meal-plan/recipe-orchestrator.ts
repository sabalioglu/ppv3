// lib/meal-plan/recipe-orchestrator.ts (KOMPLE YENİDEN YAZ)

import { AIRecipe, AIRecipeRequest } from './types/ai-recipe-types';
import { apiManager, RecipeSearchParams } from './api-manager';

// Legacy imports için backward compatibility
export interface Recipe extends AIRecipe {}

export interface OrchestrationOptions {
  maxRetries?: number;
  fallbackEnabled?: boolean;
  qualityThreshold?: number;
  timeoutMs?: number;
  enableVariation?: boolean;
}

export interface OrchestrationResult {
  recipe: Recipe | null;
  success: boolean;
  attempts: number;
  errors: string[];
  totalTime: number;
  qualityScore?: number;
}

export class RecipeOrchestrator {
  private options: Required<OrchestrationOptions>;

  constructor(options: OrchestrationOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      fallbackEnabled: options.fallbackEnabled ?? true,
      qualityThreshold: options.qualityThreshold ?? 70,
      timeoutMs: options.timeoutMs ?? 30000,
      enableVariation: options.enableVariation ?? true,
    };
  }

  // Main orchestration method
  async orchestrate(request: AIRecipeRequest | RecipeSearchParams): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recipe: Recipe | null = null;
    let attempts = 0;
    let qualityScore = 0;

    // Convert legacy params if needed
    const aiRequest = this.normalizeRequest(request);

    console.log('🍽️ Starting recipe orchestration...', {
      mealType: aiRequest.mealType,
      pantryItems: aiRequest.pantryItems.length,
      maxRetries: this.options.maxRetries
    });

    for (attempts = 1; attempts <= this.options.maxRetries; attempts++) {
      try {
        console.log(`🔄 Orchestration attempt ${attempts}/${this.options.maxRetries}`);

        // Add timeout protection
        const recipePromise = this.generateWithTimeout(aiRequest);
        const recipes = await recipePromise;

        if (recipes.length === 0) {
          throw new Error('No recipes generated');
        }

        recipe = recipes[0];
        qualityScore = recipe.compatibilityScore || 0;

        console.log(`📊 Recipe quality score: ${qualityScore}`);

        // Quality validation
        const validationResult = await this.validateRecipeQuality(recipe, aiRequest);
        
        if (validationResult.isValid && qualityScore >= this.options.qualityThreshold) {
          console.log(`✅ High quality recipe accepted (score: ${qualityScore})`);
          break;
        }

        // If it's the last attempt, use what we have
        if (attempts === this.options.maxRetries) {
          if (recipe && qualityScore >= 50) { // Lower threshold for last attempt
            console.log(`⚠️ Using acceptable quality recipe on final attempt (score: ${qualityScore})`);
            break;
          } else {
            throw new Error(`Recipe quality too low: ${qualityScore}`);
          }
        }

        // Prepare for retry with variation
        errors.push(`Attempt ${attempts}: Low quality (${qualityScore})`);
        console.log(`🔄 Retrying with variation... (score: ${qualityScore})`);
        
        if (this.options.enableVariation) {
          aiRequest = this.addVariationToRequest(aiRequest, recipe);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Attempt ${attempts}: ${errorMsg}`);
        console.error(`❌ Orchestration attempt ${attempts} failed:`, errorMsg);

        if (attempts === this.options.maxRetries) {
          console.error('❌ All orchestration attempts failed');
          recipe = null;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const success = recipe !== null;

    const result: OrchestrationResult = {
      recipe,
      success,
      attempts,
      errors,
      totalTime,
      qualityScore: recipe?.compatibilityScore
    };

    console.log('🏁 Orchestration completed:', {
      success,
      attempts,
      totalTime: `${totalTime}ms`,
      qualityScore
    });

    return result;
  }

  // Generate meal plan with orchestration
  async orchestrateMealPlan(requests: (AIRecipeRequest | RecipeSearchParams)[]): Promise<OrchestrationResult[]> {
    console.log(`🍽️ Orchestrating meal plan with ${requests.length} meals...`);

    const startTime = Date.now();
    
    // Process meals in parallel for better performance
    const orchestrationPromises = requests.map((request, index) => 
      this.orchestrate(request).then(result => ({
        ...result,
        mealIndex: index
      }))
    );

    const results = await Promise.all(orchestrationPromises);
    const totalTime = Date.now() - startTime;

    const successCount = results.filter(r => r.success).length;
    
    console.log(`🏁 Meal plan orchestration completed:`, {
      totalMeals: requests.length,
      successful: successCount,
      failed: requests.length - successCount,
      totalTime: `${totalTime}ms`
    });

    return results;
  }

  // Legacy method for backward compatibility
  async orchestrateRecipe(params: RecipeSearchParams): Promise<Recipe | null> {
    const result = await this.orchestrate(params);
    return result.recipe;
  }

  // Private helper methods
  private normalizeRequest(request: AIRecipeRequest | RecipeSearchParams): AIRecipeRequest {
    if ('pantryItems' in request && 'mealType' in request && 'servings' in request) {
      // Already AIRecipeRequest
      return request as AIRecipeRequest;
    }

    // Convert RecipeSearchParams to AIRecipeRequest
    const params = request as RecipeSearchParams;
    return {
      pantryItems: params.pantryItems || [],
      mealType: params.mealType || 'breakfast',
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

  private async generateWithTimeout(request: AIRecipeRequest): Promise<Recipe[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Recipe generation timeout after ${this.options.timeoutMs}ms`));
      }, this.options.timeoutMs);

      apiManager.searchRecipes(request)
        .then(recipes => {
          clearTimeout(timeout);
          resolve(recipes);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async validateRecipeQuality(recipe: Recipe, request: AIRecipeRequest): Promise<{isValid: boolean, issues: string[]}> {
    const issues: string[] = [];

    // Basic validation
    if (!recipe.name || recipe.name.trim().length === 0) {
      issues.push('Recipe name is empty');
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      issues.push('Recipe has no ingredients');
    }

    if (!recipe.instructions || recipe.instructions.length === 0) {
      issues.push('Recipe has no instructions');
    }

    // Pantry match validation
    if (recipe.pantryMatch < 50) {
      issues.push(`Low pantry match: ${recipe.pantryMatch}%`);
    }

    // Ingredient availability check
    const availableIngredients = recipe.ingredients.filter(ing =>
      request.pantryItems.some(pantryItem =>
        pantryItem.toLowerCase().includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(pantryItem.toLowerCase())
      )
    );

    if (availableIngredients.length < recipe.ingredients.length * 0.7) {
      issues.push('Too many missing ingredients');
    }

    // Cooking time validation
    if (request.maxCookingTime && recipe.cookingTime > request.maxCookingTime) {
      issues.push(`Cooking time too long: ${recipe.cookingTime}min > ${request.maxCookingTime}min`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private addVariationToRequest(request: AIRecipeRequest, previousRecipe: Recipe): AIRecipeRequest {
    // Add previous ingredients to avoid list for variation
    const avoidIngredients = [
      ...request.avoidIngredients,
      ...previousRecipe.ingredients.slice(0, 3).map(ing => ing.name) // Avoid first 3 ingredients
    ];

    // Vary other parameters slightly
    const variations = ['traditional', 'modern', 'simple', 'gourmet'];
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];

    return {
      ...request,
      avoidIngredients,
      preferredIngredients: request.preferredIngredients.includes(randomVariation) 
        ? request.preferredIngredients 
        : [...request.preferredIngredients, randomVariation]
    };
  }

  // Configuration methods
  updateOptions(newOptions: Partial<OrchestrationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  getOptions(): OrchestrationOptions {
    return { ...this.options };
  }
}

// Export singleton instance
export const recipeOrchestrator = new RecipeOrchestrator();

// Legacy export for backward compatibility
export default RecipeOrchestrator;
