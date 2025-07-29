// lib/meal-plan/recipe-validator.ts
import { Recipe } from './api-clients/types';
import { apiManager } from './api-manager';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  feedback: string[];
  enhancedRecipe?: Recipe;
}

export class RecipeValidator {
  // AI tarafından üretilen tarifi doğrula
  async validateAiRecipe(
    recipe: Partial<Recipe>,
    options?: {
      strictMode?: boolean;
      validateInstructions?: boolean;
      validateIngredients?: boolean;
      enhanceRecipe?: boolean;
    }
  ): Promise<ValidationResult> {
    const opt = {
      strictMode: false,
      validateInstructions: true,
      validateIngredients: true,
      enhanceRecipe: true,
      ...options
    };

    const feedback: string[] = [];
    let score = 100; // Başlangıç skoru
    let isValid = true;

    // Temel doğrulamalar
    if (!recipe.title) {
      feedback.push('Tarif başlığı eksik');
      score -= 20;
      isValid = false;
    }

    if (opt.validateInstructions && !recipe.instructions) {
      feedback.push('Tarif talimatları eksik');
      score -= 25;
      isValid = false;
    }

    if (opt.validateIngredients && (!recipe.extendedIngredients || recipe.extendedIngredients.length === 0)) {
      feedback.push('Tarif malzemeleri eksik');
      score -= 25;
      isValid = false;
    }

    // Tarif geliştirme
    let enhancedRecipe: Recipe | undefined;
    
    if (opt.enhanceRecipe && recipe.title) {
      try {
        // Benzer tarifleri arayarak geliştirme yapabiliriz
        const similarRecipes = await apiManager.searchRecipes({
          query: recipe.title,
          limit: 3
        });
        
        if (similarRecipes.results.length > 0) {
          // İlk benzer tarifi temel al
          const baseSimilarRecipe = similarRecipes.results[0];
          
          // AI tarifini API'den gelen bilgilerle zenginleştir
          enhancedRecipe = {
            ...baseSimilarRecipe,
            // AI'dan gelen bilgileri koru
            title: recipe.title || baseSimilarRecipe.title,
            instructions: recipe.instructions || baseSimilarRecipe.instructions,
            extendedIngredients: recipe.extendedIngredients || baseSimilarRecipe.extendedIngredients,
            // AI tarifi olduğunu belirt
            aiGenerated: true
          };
          
          feedback.push('Tarif benzer profesyonel tariflerle zenginleştirildi');
        }
      } catch (error) {
        console.error('Tarif geliştirme hatası:', error);
        feedback.push('Tarif geliştirme sırasında hata oluştu');
      }
    }

    return {
      isValid: opt.strictMode ? isValid : true, // Sıkı mod dışında her zaman geçerli kabul et
      score,
      feedback,
      enhancedRecipe
    };
  }

  // API'den gelen tarifi doğrula
  validateApiRecipe(recipe: Recipe): ValidationResult {
    const feedback: string[] = [];
    let score = 100;
    let isValid = true;

    if (!recipe.instructions || recipe.instructions.trim() === '') {
      feedback.push('API tarifinde talimatlar eksik veya yetersiz');
      score -= 25;
      isValid = false;
    }

    if (!recipe.extendedIngredients || recipe.extendedIngredients.length === 0) {
      feedback.push('API tarifinde malzemeler eksik');
      score -= 25;
      isValid = false;
    }

    return {
      isValid,
      score,
      feedback
    };
  }
}

// Create a singleton instance
export const recipeValidator = new RecipeValidator();