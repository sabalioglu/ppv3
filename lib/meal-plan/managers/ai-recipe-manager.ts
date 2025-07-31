// lib/meal-plan/managers/ai-recipe-manager.ts (YENİ DOSYA)
import { AIRecipeClient } from '../clients/ai-recipe-client';
import { AIRecipe, AIRecipeRequest, AIRecipeResponse } from '../types/ai-recipe-types';

export class AIRecipeManager {
  private aiClient: AIRecipeClient;
  private cache: Map<string, AIRecipeResponse> = new Map();

  constructor() {
    this.aiClient = new AIRecipeClient();
  }

  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    // Simple cache key
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached recipe');
      return this.cache.get(cacheKey)!;
    }

    // Generate new recipe
    const response = await this.aiClient.generateRecipe(request);
    
    // Cache the result
    this.cache.set(cacheKey, response);
    
    return response;
  }

  async generateMultipleRecipes(request: AIRecipeRequest, count: number = 3): Promise<AIRecipeResponse[]> {
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      // Slightly modify request for variety
      const modifiedRequest = {
        ...request,
        // Add some variation for different results
        preferredIngredients: request.preferredIngredients ? 
          [...request.preferredIngredients, `variation-${i}`] : [`variation-${i}`]
      };
      
      promises.push(this.generateRecipe(modifiedRequest));
    }

    return Promise.all(promises);
  }

  async regenerateRecipe(
    originalRequest: AIRecipeRequest, 
    previousRecipe: AIRecipe, 
    feedback?: string
  ): Promise<AIRecipeResponse> {
    // Add previous recipe ingredients to avoid list for variation
    const modifiedRequest: AIRecipeRequest = {
      ...originalRequest,
      avoidIngredients: [
        ...(originalRequest.avoidIngredients || []),
        ...previousRecipe.ingredients.map(ing => ing.name)
      ],
      // Add feedback context if provided
      ...(feedback && { feedback })
    };

    return this.generateRecipe(modifiedRequest);
  }

  private generateCacheKey(request: AIRecipeRequest): string {
    const keyData = {
      pantryItems: request.pantryItems.sort(),
      mealType: request.mealType,
      userGoal: request.userGoal,
      allergies: request.allergies?.sort(),
      cuisine: request.cuisine,
    };
    
    return btoa(JSON.stringify(keyData));
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const aiRecipeManager = new AIRecipeManager();
