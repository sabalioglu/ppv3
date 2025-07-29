// lib/meal-plan/meal-plan-service.ts
import { Recipe, RecipeSearchParams } from './api-clients/types';
import { RecipeOrchestrator, OrchestrationOptions } from './recipe-orchestrator';

// Örnek AI tarif üretici fonksiyonu - gerçek implementasyonu ile değiştirilmeli
async function aiRecipeGenerator(params: any): Promise<any> {
  // Burada mevcut AI tarif üretim sisteminizi çağırın
  // ...
  return {
    title: 'AI Generated Recipe',
    instructions: '...',
    extendedIngredients: []
  };
}

export class MealPlanService {
  private orchestrator: RecipeOrchestrator;
  
  constructor() {
    this.orchestrator = new RecipeOrchestrator(aiRecipeGenerator);
  }
  
  async searchRecipes(
    params: RecipeSearchParams,
    options?: OrchestrationOptions
  ): Promise<Recipe[]> {
    const result = await this.orchestrator.searchRecipes(params, options);
    return result.data;
  }
  
  async getRecipeById(
    id: string,
    options?: OrchestrationOptions
  ): Promise<Recipe> {
    const result = await this.orchestrator.getRecipeById(id, options);
    return result.data;
  }
  
  async getRandomRecipes(
    params: { tags?: string; number?: number },
    options?: OrchestrationOptions
  ): Promise<Recipe[]> {
    const result = await this.orchestrator.getRandomRecipes(params, options);
    return result.data;
  }
  
  // Diğer MealPlanService metodları...
}

// Create a singleton instance
export const mealPlanService = new MealPlanService();