// lib/meal-plan/clients/ai-recipe-client.ts (GEÇİCİ - BASİT VERSİYON)

import { AIRecipe, AIRecipeRequest, AIRecipeResponse } from '../types/ai-recipe-types';

export class AIRecipeClient {
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    // Geçici basit implementasyon
    console.log('🤖 Generating recipe for:', request.mealType);
    
    const recipe: AIRecipe = {
      id: `temp-${Date.now()}`,
      name: `AI ${request.mealType}`,
      ingredients: request.pantryItems.slice(0, 3).map((item, index) => ({
        name: item,
        amount: 1,
        unit: 'piece'
      })),
      instructions: ['Mix ingredients', 'Cook until done'],
      cookingTime: 15,
      servings: request.servings,
      calories: 300,
      mealType: request.mealType,
      pantryMatch: 80,
      missingIngredients: [],
      compatibilityScore: 85,
      source: 'ai-generated' as const,
      createdAt: new Date()
    };

    return {
      recipe,
      confidence: 85,
      reasoning: 'Generated with available ingredients'
    };
  }
}
