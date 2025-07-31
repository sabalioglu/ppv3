// lib/meal-plan/api-manager.ts (KOMPLE YENİDEN YAZ)

import { AIRecipe, AIRecipeRequest, AIRecipeResponse } from './types/ai-recipe-types';
import { aiRecipeManager } from './managers/ai-recipe-manager';

// Backward compatibility için eski interface'leri map et
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

export interface Recipe extends AIRecipe {} // Alias for backward compatibility

export type ApiSource = 'ai-generated'; // Only AI now

export class ApiManager {
  private aiManager = aiRecipeManager;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🤖 Initializing AI-only ApiManager...');
      
      // Validate API keys
      const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!openaiKey && !geminiKey) {
        throw new Error('No AI API keys found. Please set EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY');
      }
      
      this.isInitialized = true;
      console.log('✅ AI-only ApiManager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize ApiManager:', error);
      throw error;
    }
  }

  // Main search method - converts old params to new format
  async searchRecipes(
    params: RecipeSearchParams, 
    preferredSource?: ApiSource
  ): Promise<Recipe[]> {
    await this.initialize();

    try {
      const aiRequest = this.convertToAIRequest(params);
      const response = await this.aiManager.generateRecipe(aiRequest);
      
      return [response.recipe];
    } catch (error) {
      console.error('Failed to search recipes:', error);
      return [];
    }
  }

  // Get multiple recipe options
  async getMultipleRecipes(
    params: RecipeSearchParams, 
    count: number = 3
  ): Promise<Recipe[]> {
    await this.initialize();

    try {
      const aiRequest = this.convertToAIRequest(params);
      const responses = await this.aiManager.generateMultipleRecipes(aiRequest, count);
      
      return responses.map(r => r.recipe);
    } catch (error) {
      console.error('Failed to get multiple recipes:', error);
      return [];
    }
  }

  // Regenerate recipe with different approach
  async regenerateRecipe(
    params: RecipeSearchParams, 
    previousRecipe: Recipe, 
    feedback?: string
  ): Promise<Recipe | null> {
    await this.initialize();

    try {
      const aiRequest = this.convertToAIRequest(params);
      const response = await this.aiManager.regenerateRecipe(
        aiRequest, 
        previousRecipe, 
        feedback
      );
      
      return response.recipe;
    } catch (error) {
      console.error('Failed to regenerate recipe:', error);
      return null;
    }
  }

  // Legacy method - kept for backward compatibility
  async getRecipeById(id: string, source?: ApiSource): Promise<Recipe | null> {
    console.warn('⚠️ getRecipeById is not supported in AI-only mode. Recipes are generated dynamically.');
    return null;
  }

  // Legacy method - kept for backward compatibility  
  async getRandomRecipe(params?: Partial<RecipeSearchParams>): Promise<Recipe | null> {
    const searchParams: RecipeSearchParams = {
      pantryItems: params?.pantryItems || ['eggs', 'milk', 'flour'], // Default pantry
      mealType: params?.mealType || 'breakfast',
      servings: params?.servings || 2,
      ...params
    };

    const recipes = await this.searchRecipes(searchParams);
    return recipes.length > 0 ? recipes[0] : null;
  }

  // Convert legacy search params to AI request format
  private convertToAIRequest(params: RecipeSearchParams): AIRecipeRequest {
    return {
      pantryItems: params.pantryItems || [],
      mealType: params.mealType || 'breakfast',
      servings: params.servings || 2,
      maxCookingTime: params.maxCookingTime,
      difficulty: 'easy', // Default to easy
      cuisine: params.cuisine,
      dietaryRestrictions: params.dietaryRestrictions || [],
      allergies: params.allergies || [],
      calorieTarget: undefined, // Can be added later
      nutritionalGoals: undefined, // Can be added later
      avoidIngredients: [],
      preferredIngredients: [],
      userGoal: params.userGoal || 'general_health'
    };
  }

  // Utility methods
  async validateApiKeys(): Promise<{openai: boolean, gemini: boolean}> {
    return {
      openai: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      gemini: !!process.env.EXPO_PUBLIC_GEMINI_API_KEY
    };
  }

  clearCache(): void {
    this.aiManager.clearCache();
  }

  getCacheInfo(): {size: number} {
    return {
      size: this.aiManager.getCacheSize()
    };
  }

  // Legacy compatibility methods - all removed functionality
  registerApi(): void {
    console.warn('⚠️ registerApi is deprecated in AI-only mode');
  }

  unregisterApi(): void {
    console.warn('⚠️ unregisterApi is deprecated in AI-only mode');
  }

  getAvailableApis(): string[] {
    return ['ai-generated'];
  }

  isApiRegistered(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const apiManager = new ApiManager();
