// lib/meal-plan/api-clients/index.ts (KOMPLE YENİDEN YAZ)

// ❌ ESKİ 3. PARTİ API EXPORT'LARI - SİLİNDİ
// export { SpoonacularClient } from './spoonacular-client';
// export { TastyClient } from './tasty-client';
// export { TheMealDBClient } from './themealdb-client';
// export { initializeRecipeApi } from './initialize';
// export { cacheManager } from './cache-manager';
// export { cacheDecorator } from './cache-decorator';

// ✅ YENİ AI-ONLY EXPORT'LAR
export { AIRecipeClient } from '../clients/ai-recipe-client';
export { aiRecipeManager, AIRecipeManager } from '../managers/ai-recipe-manager';

// Types
export type {
  AIRecipe,
  AIIngredient,
  AIRecipeRequest,
  AIRecipeResponse,
} from '../types/ai-recipe-types';

// Orchestration
export { 
  recipeOrchestrator, 
  RecipeOrchestrator,
  type OrchestrationOptions,
  type OrchestrationResult 
} from '../recipe-orchestrator';

// Validation
export { 
  recipeValidator, 
  RecipeValidator,
  type ValidationResult,
  type ValidationIssue,
  type ValidationOptions 
} from '../recipe-validator';

// Services
export { 
  mealPlanService, 
  MealPlanService,
  type MealPlanRequest,
  type MealPlan,
  type MealPlanResult 
} from '../meal-plan-service';

// Setup and Configuration
export { 
  apiSetup, 
  APISetup,
  type AISetupConfig,
  type SetupResult 
} from '../api-setup';

// Initialization
export { 
  mealPlanInitializer,
  MealPlanInitializer,
  initializeMealPlan,
  type InitializationOptions,
  type InitializationResult 
} from '../initialize';

// Legacy compatibility exports
export { apiManager, type RecipeSearchParams } from '../api-manager';

// Backward compatibility types
export interface Recipe extends AIRecipe {}
export interface RecipeApiClient {
  // Legacy interface - not implemented in AI-only system
  searchRecipes: (params: any) => Promise<Recipe[]>;
  getRecipeById: (id: string) => Promise<Recipe | null>;
  getRandomRecipe: () => Promise<Recipe | null>;
}

// Legacy API source type
export type ApiSource = 'ai-generated';

// Legacy create client function - now returns AI client
export function createApiClient(source: ApiSource, apiKey?: string, host?: string): RecipeApiClient {
  console.warn('⚠️ createApiClient is deprecated. Use AIRecipeClient directly.');
  
  return {
    searchRecipes: async (params: any): Promise<Recipe[]> => {
      const aiRequest = convertLegacyParams(params);
      const response = await aiRecipeManager.generateRecipe(aiRequest);
      return [response.recipe];
    },
    
    getRecipeById: async (id: string): Promise<Recipe | null> => {
      console.warn('⚠️ getRecipeById not supported in AI-only mode');
      return null;
    },
    
    getRandomRecipe: async (): Promise<Recipe | null> => {
      const response = await aiRecipeManager.generateRecipe({
        pantryItems: ['eggs', 'milk', 'flour'], // Default pantry
        mealType: 'breakfast',
        servings: 2,
        dietaryRestrictions: [],
        allergies: [],
        avoidIngredients: [],
        preferredIngredients: [],
        userGoal: 'general_health',
      });
      return response.recipe;
    }
  };
}

// Helper function to convert legacy parameters
function convertLegacyParams(params: any): AIRecipeRequest {
  return {
    pantryItems: params.pantryItems || params.ingredients || [],
    mealType: params.mealType || params.type || 'breakfast',
    servings: params.servings || 2,
    maxCookingTime: params.maxCookingTime || params.readyInMinutes,
    difficulty: params.difficulty || 'easy',
    cuisine: params.cuisine,
    dietaryRestrictions: params.diet || params.dietaryRestrictions || [],
    allergies: params.intolerances || params.allergies || [],
    calorieTarget: params.calories || params.maxCalories,
    avoidIngredients: params.excludeIngredients || [],
    preferredIngredients: params.includeIngredients || [],
    userGoal: params.goal || 'general_health',
  };
}

// System utilities
export const AI_RECIPE_SYSTEM = {
  // Quick access to main services
  manager: aiRecipeManager,
  orchestrator: recipeOrchestrator,
  validator: recipeValidator,
  service: mealPlanService,
  setup: apiSetup,
  initializer: mealPlanInitializer,

  // Utility functions
  async quickGenerate(pantryItems: string[], mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast'): Promise<AIRecipe | null> {
    try {
      const response = await aiRecipeManager.generateRecipe({
        pantryItems,
        mealType,
        servings: 2,
        dietaryRestrictions: [],
        allergies: [],
        avoidIngredients: [],
        preferredIngredients: [],
        userGoal: 'general_health',
      });
      return response.recipe;
    } catch (error) {
      console.error('Quick generate failed:', error);
      return null;
    }
  },

  async isSystemReady(): Promise<boolean> {
    return mealPlanInitializer.isSystemReady();
  },

  async getSystemHealth() {
    return mealPlanInitializer.getSystemHealth();
  },

  async reinitialize(options?: InitializationOptions) {
    return mealPlanInitializer.reinitialize(options);
  },

  // Cache management
  clearAllCaches(): void {
    aiRecipeManager.clearCache();
    console.log('🧹 All AI recipe caches cleared');
  },

  // Get system info
  getSystemInfo(): {
    version: string;
    mode: 'ai-only';
    providers: string[];
    cacheSize: number;
    isReady: boolean;
  } {
    return {
      version: '2.0.0-ai-only',
      mode: 'ai-only',
      providers: apiSetup.getAvailableProviders(),
      cacheSize: aiRecipeManager.getCacheSize(),
      isReady: mealPlanInitializer.isSystemReady(),
    };
  }
};

// Default export for convenience
export default AI_RECIPE_SYSTEM;

// Console greeting (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🤖 AI Recipe System v2.0 - 3rd Party API Free!');
  console.log('📚 Available services:', Object.keys(AI_RECIPE_SYSTEM).filter(key => typeof AI_RECIPE_SYSTEM[key as keyof typeof AI_RECIPE_SYSTEM] === 'object'));
  console.log('🚀 Use AI_RECIPE_SYSTEM.quickGenerate(["eggs", "milk"], "breakfast") for quick testing');
}
