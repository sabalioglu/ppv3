// lib/meal-plan/recipe-validator.ts

import { ApiRecipe } from './api-clients';
import { Meal } from './types';

/**
 * A utility class for validating and enhancing recipe data from various sources.
 */
export class RecipeValidator {

  /**
   * Performs a series of checks to determine if a recipe is valid and complete.
   * @param recipe - The recipe to validate.
   * @returns True if the recipe is valid, false otherwise.
   */
  static isValid(recipe: ApiRecipe | Meal): boolean {
    if (!recipe) return false;
    if (!recipe.name || recipe.name.trim() === '') return false;
    if (!recipe.ingredients || recipe.ingredients.length === 0) return false;
    if (!recipe.instructions || recipe.instructions.length === 0) return false;

    // Ensure all ingredients have a name
    if (recipe.ingredients.some(ing => !ing.name || ing.name.trim() === '')) {
      return false;
    }

    return true;
  }

  /**
   * Calculates a quality score for a recipe based on its completeness and detail.
   * @param recipe - The recipe to score.
   * @returns A quality score from 0 to 100.
   */
  static getQualityScore(recipe: ApiRecipe): number {
    let score = 0;

    if (recipe.name) score += 10;
    if (recipe.ingredients.length > 2) score += 20;
    if (recipe.instructions.length > 2) score += 20;
    if (recipe.sourceUrl) score += 10;
    if (recipe.calories > 50 && recipe.protein > 5) score += 20; // Has basic nutrition
    if (recipe.tags && recipe.tags.length > 0) score += 10;
    if (recipe.servings > 0) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Cleans and standardizes a recipe object.
   * This can be used to fill in missing fields or correct formatting.
   * @param recipe - The recipe to enhance.
   * @returns The enhanced recipe.
   */
  static standardize(recipe: ApiRecipe): ApiRecipe {
    const standardizedRecipe = { ...recipe };

    standardizedRecipe.name = (standardizedRecipe.name || 'Untitled Recipe').trim();

    standardizedRecipe.ingredients = (standardizedRecipe.ingredients || []).map(ing => ({
      ...ing,
      name: (ing.name || 'unknown ingredient').trim().toLowerCase(),
      unit: (ing.unit || 'unit').trim().toLowerCase(),
    }));

    standardizedRecipe.instructions = (standardizedRecipe.instructions || []).map(inst => inst.trim());

    // Ensure essential numeric fields are not negative
    standardizedRecipe.calories = Math.max(0, standardizedRecipe.calories || 0);
    standardizedRecipe.protein = Math.max(0, standardizedRecipe.protein || 0);
    standardizedRecipe.carbs = Math.max(0, standardizedRecipe.carbs || 0);
    standardizedRecipe.fat = Math.max(0, standardizedRecipe.fat || 0);
    standardizedRecipe.servings = Math.max(1, standardizedRecipe.servings || 1);

    return standardizedRecipe;
  }
}
