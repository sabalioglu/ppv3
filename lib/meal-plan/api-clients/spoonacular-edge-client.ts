import { supabase } from '../../supabase';
import type { Recipe, MealPlanOptions, RecipeSearchParams } from '../types';

// A class to interact with the Spoonacular proxy Edge Function
export class SpoonacularEdgeClient {
  private functionName = 'spoonacular-proxy';

  /**
   * Invokes a method on the Spoonacular Edge Function.
   * @param action - The action to perform.
   * @param data - The data to send with the action.
   * @returns The data from the function response.
   */
  private async invoke<T>(action: string, data: object): Promise<T> {
    const { data: responseData, error } = await supabase.functions.invoke(this.functionName, {
      body: { action, data },
    });

    if (error) {
      console.error(`Error invoking edge function for action '${action}':`, error);
      throw new Error(`Failed to execute ${action}: ${error.message}`);
    }

    // The edge function wraps the actual data in a 'data' property
    return responseData.data || [];
  }

  /**
   * Finds recipes based on pantry ingredients.
   * @param options - Options for the search.
   * @returns A promise that resolves to an array of recipes.
   */
  async findRecipesByPantry(options: {
    number?: number;
    ranking?: 1 | 2;
    ignorePantry?: boolean;
  } = {}): Promise<Recipe[]> {
    return this.invoke<Recipe[]>('findRecipesByPantry', options);
  }

  /**
   * Fetches the details for a specific recipe.
   * @param recipeId - The ID of the recipe to fetch.
   * @returns A promise that resolves to the recipe details.
   */
  async getRecipeDetails(recipeId: number): Promise<Recipe> {
    return this.invoke<Recipe>('getRecipeDetails', { recipeId });
  }

  /**
   * Generates a meal plan based on the provided options.
   * @param options - The options for the meal plan.
   * @returns A promise that resolves to the generated meal plan.
   */
  async generateMealPlan(options: MealPlanOptions): Promise<any> {
    return this.invoke<any>('generateMealPlan', options);
  }

  /**
   * Performs a complex search for recipes.
   * @param params - The search parameters.
   * @returns A promise that resolves to the search results.
   */
  async complexSearch(params: RecipeSearchParams): Promise<{ results: Recipe[] }> {
    return this.invoke<{ results: Recipe[] }>('complexSearch', params);
  }
}

export const spoonacularEdgeClient = new SpoonacularEdgeClient();
