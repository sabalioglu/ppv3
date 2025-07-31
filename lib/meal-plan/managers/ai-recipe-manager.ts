// lib/meal-plan/managers/ai-recipe-manager.ts (GEÇİCİ - BASİT VERSİYON)

import { AIRecipeClient } from '../clients/ai-recipe-client';
import { AIRecipeRequest, AIRecipeResponse } from '../types/ai-recipe-types';

export class AIRecipeManager {
  private aiClient = new AIRecipeClient();
  private cache = new Map();

  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    return this.aiClient.generateRecipe(request);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const aiRecipeManager = new AIRecipeManager();
