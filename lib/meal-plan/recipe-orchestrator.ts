// lib/meal-plan/recipe-orchestrator.ts
import { Recipe, RecipeSearchParams, PantryItem } from './api-clients/types';
import { apiManager } from './api-manager';
import { recipeValidator, ValidationResult } from './recipe-validator';
import { spoonacularEdgeClient } from './api-clients/spoonacular-edge-client';

export interface OrchestrationOptions {
  preferApi?: boolean; // API'yi mi yoksa AI'yı mı tercih edelim
  validateResults?: boolean; // Sonuçları doğrulayalım mı
  enhanceAiRecipes?: boolean; // AI tariflerini geliştirelim mi
  fallbackToAi?: boolean; // API başarısız olursa AI'ya geri dönelim mi
  preferredApiSource?: 'spoonacular' | 'tasty' | 'themealdb'; // Tercih edilen API kaynağı
}

export interface OrchestrationResult<T> {
  source: 'api' | 'ai' | 'hybrid';
  data: T;
  validationResult?: ValidationResult;
}

export class RecipeOrchestrator {
  private aiRecipeGenerator: (params: any) => Promise<any>;
  
  constructor(aiRecipeGenerator: (params: any) => Promise<any>) {
    this.aiRecipeGenerator = aiRecipeGenerator;
  }

  async findRecipesByPantry(
    pantryItems: PantryItem[],
    options: OrchestrationOptions = {}
  ): Promise<OrchestrationResult<Recipe[]>> {
    const { preferApi = true, fallbackToAi = true } = options;

    if (preferApi) {
      try {
        const apiResult = await spoonacularEdgeClient.findRecipesByPantry({ number: 10, ranking: 1 });
        if (apiResult && apiResult.length > 0) {
          return { source: 'api', data: apiResult };
        }
      } catch (error) {
        console.error('API pantry search failed:', error);
      }
    }

    if (fallbackToAi) {
      return this.generateRecipesWithAi({ pantryItems }, options);
    }

    return { source: 'api', data: [] }; // Changed to api and empty data
  }

  async searchRecipes(
    params: RecipeSearchParams,
    options: OrchestrationOptions = {}
  ): Promise<OrchestrationResult<Recipe[]>> {
    const {
      preferApi = true,
      validateResults = true,
      enhanceAiRecipes = true,
      fallbackToAi = true,
      preferredApiSource
    } = options;

    // Önce API'den arama yapmayı dene
    if (preferApi) {
      try {
        const apiResult = await apiManager.searchRecipes(params, preferredApiSource);
        
        if (apiResult.results.length > 0) {
          let validationResult: ValidationResult | undefined;
          
          // İstenirse API sonuçlarını doğrula
          if (validateResults) {
            validationResult = recipeValidator.validateApiRecipe(apiResult.results[0]);
            
            // Eğer doğrulama başarısız olursa ve AI'ya geri dönüş etkinse
            if (!validationResult.isValid && fallbackToAi) {
              return this.generateRecipesWithAi(params, { enhanceAiRecipes });
            }
          }
          
          return {
            source: 'api',
            data: apiResult.results,
            validationResult
          };
        }
        
        // API sonuçları boşsa ve AI'ya geri dönüş etkinse
        if (fallbackToAi) {
          return this.generateRecipesWithAi(params, { enhanceAiRecipes });
        }
        
        return { source: 'api', data: [] };
      } catch (error) {
        console.error('API search failed:', error);
        
        // API hatası olursa ve AI'ya geri dönüş etkinse
        if (fallbackToAi) {
          return this.generateRecipesWithAi(params, { enhanceAiRecipes });
        }
        
        throw error;
      }
    } else {
      // Direkt olarak AI ile tarif üret
      return this.generateRecipesWithAi(params, { enhanceAiRecipes });
    }
  }

  async getRecipeById(
    id: string,
    options: OrchestrationOptions = {}
  ): Promise<OrchestrationResult<Recipe>> {
    const { preferredApiSource } = options;
    
    try {
      const recipe = await apiManager.getRecipeById(id, preferredApiSource);
      return {
        source: 'api',
        data: recipe
      };
    } catch (error) {
      console.error(`Failed to get recipe with ID ${id}:`, error);
      throw error;
    }
  }

  async getRandomRecipes(
    params: { tags?: string; number?: number },
    options: OrchestrationOptions = {}
  ): Promise<OrchestrationResult<Recipe[]>> {
    const { preferredApiSource } = options;
    
    try {
      const recipes = await apiManager.getRandomRecipes(params, preferredApiSource);
      return {
        source: 'api',
        data: recipes
      };
    } catch (error) {
      console.error('Failed to get random recipes:', error);
      throw error;
    }
  }

  private async generateRecipesWithAi(
    params: RecipeSearchParams | { pantryItems: PantryItem[] },
    options: { enhanceAiRecipes?: boolean } = {}
  ): Promise<OrchestrationResult<Recipe[]>> {
    try {
      const aiRecipeRequest = {
        pantryItems: 'pantryItems' in params ? params.pantryItems : [],
        userPreferences: 'userPreferences' in params ? params.userPreferences : undefined,
        avoidList: 'avoidList' in params ? params.avoidList : undefined,
      };
      // AI ile tarif üret
      const aiRecipe = await this.aiRecipeGenerator(aiRecipeRequest);
      
      // AI tarifini doğrula ve geliştir
      const validationResult = await recipeValidator.validateAiRecipe(
        aiRecipe, 
        { enhanceRecipe: options.enhanceAiRecipes }
      );
      
      const resultRecipe = validationResult.enhancedRecipe || aiRecipe;
      const source = validationResult.enhancedRecipe ? 'hybrid' : 'ai';
      
      return {
        source,
        data: [resultRecipe],
        validationResult
      };
    } catch (error) {
      console.error('AI recipe generation failed:', error);
      throw error;
    }
  }
}