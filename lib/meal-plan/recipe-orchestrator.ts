// lib/meal-plan/recipe-orchestrator.ts

import { ApiManager } from './api-manager';
import { generateAIMeal } from './ai-generation';
import { RecipeValidator } from './recipe-validator';
import { ApiRecipe, RecipeSearchParams } from './api-clients';
import { UserProfile, PantryItem, Meal } from './types';

/**
 * Orchestrates the process of fetching, generating, validating, and selecting recipes
 * from multiple sources (APIs and AI).
 */
export class RecipeOrchestrator {
  private apiManager: ApiManager;

  constructor(apiKeys: Record<string, string>) {
    this.apiManager = new ApiManager(apiKeys as any);
  }

  /**
   * Fetches recipes from all available API sources in parallel.
   * @param params - The search parameters for the recipes.
   * @returns A promise that resolves to an array of recipes from all APIs.
   */
  private async fetchFromApis(params: RecipeSearchParams): Promise<ApiRecipe[]> {
    console.log('Orchestrator: Fetching recipes from APIs...');
    // In a real scenario, we might query multiple APIs in parallel.
    // For this implementation, we rely on the ApiManager's fallback chain.
    const apiRecipes = await this.apiManager.searchRecipes(params);
    return apiRecipes;
  }

  /**
   * Generates a recipe using the AI model.
   * @param params - The search parameters, which guide the AI generation.
   * @param userProfile - The user's profile for personalization.
   * @param pantryItems - The user's pantry items.
   * @returns A promise that resolves to a single AI-generated recipe.
   */
  private async generateFromAi(
    params: RecipeSearchParams,
    userProfile: UserProfile | null,
    pantryItems: PantryItem[]
  ): Promise<ApiRecipe | null> {
    console.log('Orchestrator: Generating recipe from AI...');
    try {
      const request = {
        pantryItems,
        userProfile,
        mealType: 'dinner', // Default meal type, can be parameterized
        preferences: userProfile?.dietary_preferences || [],
        restrictions: userProfile?.dietary_restrictions || [],
      };
      // The AI generation function returns a Meal, we need to adapt it to ApiRecipe
      const aiMeal: Meal = await generateAIMeal(request);

      // Adapt Meal to ApiRecipe
      const apiAiRecipe: ApiRecipe = {
        ...aiMeal,
        source: 'AI_GENERATED' as any, // A bit of a hack, we might need a new enum value
      };
      return apiAiRecipe;

    } catch (error) {
      console.error('Orchestrator: AI generation failed.', error);
      return null;
    }
  }

  /**
   * The main method to get a list of high-quality, validated, and personalized recipes.
   * It fetches from APIs and generates from AI, then validates, filters, and ranks them.
   * @param params - The search parameters.
   * @param userProfile - The user's profile.
   * @param pantryItems - The user's pantry items.
   * @returns A sorted list of the best available recipes.
   */
  public async getRecipes(
    params: RecipeSearchParams,
    userProfile: UserProfile | null,
    pantryItems: PantryItem[]
  ): Promise<ApiRecipe[]> {
    // 1. Fetch from all sources in parallel
    const apiPromise = this.fetchFromApis(params);
    const aiPromise = this.generateFromAi(params, userProfile, pantryItems);

    const [apiResults, aiResult] = await Promise.all([apiPromise, aiPromise]);

    let allRecipes = [...apiResults];
    if (aiResult) {
      allRecipes.push(aiResult);
    }

    console.log(`Orchestrator: Fetched a total of ${allRecipes.length} recipes from all sources.`);

    // 2. Validate and standardize all recipes
    const validatedRecipes = allRecipes
      .map(recipe => RecipeValidator.standardize(recipe))
      .filter(recipe => RecipeValidator.isValid(recipe));

    console.log(`Orchestrator: ${validatedRecipes.length} recipes remaining after validation.`);

    // 3. Score and rank the recipes
    const scoredRecipes = validatedRecipes.map(recipe => {
      const qualityScore = RecipeValidator.getQualityScore(recipe);
      // We can add more scoring metrics here later (e.g., compatibility, user preference match)
      return { ...recipe, finalScore: qualityScore };
    });

    // Sort by the final score in descending order
    const sortedRecipes = scoredRecipes.sort((a, b) => b.finalScore - a.finalScore);

    console.log('Orchestrator: Recipes have been sorted by quality score.');

    return sortedRecipes;
  }
}
