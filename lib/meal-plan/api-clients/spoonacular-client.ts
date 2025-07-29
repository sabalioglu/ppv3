// lib/meal-plan/api-clients/spoonacular-client.ts

import { ApiProvider, ApiClientConfig, RecipeApiClient, RecipeSearchParams, ApiRecipe } from './types';
import { Meal } from '@/lib/meal-plan/types';

/**
 * Maps Spoonacular's dish types to our meal categories
 */
const mapDishTypeToCategory = (dishTypes: string[] = []): string => {
  if (dishTypes.some(type => type.includes('breakfast') || type.includes('brunch') || type.includes('morning'))) {
    return 'breakfast';
  }
  if (dishTypes.some(type => type.includes('lunch') || type.includes('main course'))) {
    return 'lunch';
  }
  if (dishTypes.some(type => type.includes('dinner') || type.includes('main course') || type.includes('main dish'))) {
    return 'dinner';
  }
  if (dishTypes.some(type => type.includes('snack') || type.includes('appetizer') || type.includes('side dish'))) {
    return 'snack';
  }
  return 'dinner'; // Default category
};

/**
 * Choose an appropriate emoji based on recipe content
 */
const chooseRecipeEmoji = (recipe: any): string => {
  const title = (recipe.title || '').toLowerCase();
  const dishTypes = recipe.dishTypes || [];
  
  if (title.includes('pasta') || title.includes('spaghetti') || dishTypes.includes('pasta')) return '🍝';
  if (title.includes('soup') || dishTypes.includes('soup')) return '🍲';
  if (title.includes('salad') || dishTypes.includes('salad')) return '🥗';
  if (title.includes('chicken') || recipe.extendedIngredients?.some((i: any) => i.name.includes('chicken'))) return '🍗';
  if (title.includes('beef') || recipe.extendedIngredients?.some((i: any) => i.name.includes('beef'))) return '🥩';
  if (title.includes('fish') || title.includes('salmon') || recipe.extendedIngredients?.some((i: any) => i.name.includes('fish'))) return '🐟';
  if (title.includes('pizza') || dishTypes.includes('pizza')) return '🍕';
  if (title.includes('burger') || dishTypes.includes('burger')) return '🍔';
  if (title.includes('breakfast') || dishTypes.includes('breakfast')) return '🍳';
  
  // Default emojis by meal category
  const category = mapDishTypeToCategory(dishTypes);
  if (category === 'breakfast') return '🥞';
  if (category === 'lunch') return '🥪';
  if (category === 'dinner') return '🍽️';
  if (category === 'snack') return '🍎';
  
  return '🍲'; // Default emoji
};

/**
 * Helper function to transform Spoonacular's recipe format to our standard ApiRecipe format.
 */
const transformSpoonacularRecipe = (spoonacularRecipe: any): ApiRecipe => {
  // Extract ingredients with proper error handling
  const ingredients = spoonacularRecipe.extendedIngredients?.map((ing: any) => ({
    name: ing.nameClean || ing.name || 'Unknown ingredient',
    amount: ing.amount || 0,
    unit: ing.unit || '',
    category: ing.aisle || 'Unknown',
  })) || [];
  
  // Extract instructions safely
  const instructions = spoonacularRecipe.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || 
                      [spoonacularRecipe.instructions || 'No instructions available'];
  
  // Handle nutrition data safely
  const getNutrientAmount = (nutrientName: string) => {
    if (!spoonacularRecipe.nutrition || !spoonacularRecipe.nutrition.nutrients) return 0;
    const nutrient = spoonacularRecipe.nutrition.nutrients.find((n: any) => n.name === nutrientName);
    return nutrient ? nutrient.amount : 0;
  };
  
  // Determine category
  const category = mapDishTypeToCategory(spoonacularRecipe.dishTypes);
  
  // Choose appropriate emoji
  const emoji = chooseRecipeEmoji(spoonacularRecipe);
  
  return {
    id: String(spoonacularRecipe.id),
    name: spoonacularRecipe.title || 'Unknown Recipe',
    ingredients,
    calories: getNutrientAmount('Calories'),
    protein: getNutrientAmount('Protein'),
    carbs: getNutrientAmount('Carbohydrates'),
    fat: getNutrientAmount('Fat'),
    fiber: getNutrientAmount('Fiber'),
    prepTime: spoonacularRecipe.preparationMinutes || 
              spoonacularRecipe.readyInMinutes ? Math.floor(spoonacularRecipe.readyInMinutes / 3) : 10,
    cookTime: spoonacularRecipe.cookingMinutes || 
              spoonacularRecipe.readyInMinutes ? Math.floor(spoonacularRecipe.readyInMinutes * 2 / 3) : 20,
    servings: spoonacularRecipe.servings || 1,
    difficulty: spoonacularRecipe.healthScore > 70 ? 'Easy' : (spoonacularRecipe.healthScore > 40 ? 'Medium' : 'Hard'),
    emoji,
    category,
    tags: [
      ...(spoonacularRecipe.diets || []), 
      ...(spoonacularRecipe.dishTypes || []),
      ...(spoonacularRecipe.cuisines || [])
    ],
    instructions,
    source: ApiProvider.SPOONACULAR,
    sourceUrl: spoonacularRecipe.sourceUrl || '',
    healthScore: spoonacularRecipe.healthScore || 0,
    image: spoonacularRecipe.image || '',
  };
};

export class SpoonacularApiClient extends RecipeApiClient {
  private lastRequestTime: number = 0;
  private requestInterval: number = 500; // Minimum time between requests in ms

  constructor(config: ApiClientConfig) {
    super({
      ...config,
      baseUrl: 'https://api.spoonacular.com',
    });
  }

  /**
   * Makes a rate-limited request to the Spoonacular API
   */
  private async request(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    // Basic rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.requestInterval - timeSinceLastRequest));
    }
    
    try {
      const url = new URL(`${this.config.baseUrl}${endpoint}`);
      url.searchParams.append('apiKey', this.config.apiKey || '');
      
      for (const key in params) {
        if (params[key]) {
          url.searchParams.append(key, params[key]);
        }
      }

      this.lastRequestTime = Date.now();
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Spoonacular API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Search recipes by query or other parameters
   */
  async searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]> {
    try {
      const apiParams: Record<string, string> = {
        query: params.query || '',
        cuisine: params.cuisine || '',
        diet: params.diet || '',
        number: String(params.number || 10),
        offset: String(params.offset || 0),
        addRecipeInformation: 'true',
        addRecipeNutrition: 'true',
        fillIngredients: 'true',
      };

      if (params.ingredients && params.ingredients.length > 0) {
        apiParams.includeIngredients = params.ingredients.join(',');
      }
      
      const data = await this.request('/recipes/complexSearch', apiParams);
      return data.results.map(transformSpoonacularRecipe);
    } catch (error) {
      console.error('Failed to search recipes on Spoonacular:', error);
      return [];
    }
  }

  /**
   * Find recipes by ingredients (pantry-based search)
   * This is a specialized endpoint for finding recipes by available ingredients
   */
  async findRecipesByIngredients(ingredients: string[], limit: number = 5): Promise<ApiRecipe[]> {
    try {
      const data = await this.request('/recipes/findByIngredients', {
        ingredients: ingredients.join(','),
        number: String(limit),
        ranking: '2', // 1=maximize used ingredients, 2=minimize missing ingredients
        ignorePantry: 'false',
      });
      
      // Get detailed info for each recipe to have complete data
      const detailedRecipes = await Promise.all(
        data.map(async (basicRecipe: any) => {
          try {
            return await this.getRecipeDetails(basicRecipe.id);
          } catch (error) {
            console.error(`Failed to get details for recipe ${basicRecipe.id}:`, error);
            return null;
          }
        })
      );
      
      return detailedRecipes.filter((recipe): recipe is ApiRecipe => recipe !== null);
    } catch (error) {
      console.error('Failed to find recipes by ingredients on Spoonacular:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific recipe by ID
   */
  async getRecipeDetails(id: string | number): Promise<ApiRecipe | null> {
    try {
      const data = await this.request(`/recipes/${id}/information`, {
        includeNutrition: 'true',
      });
      return transformSpoonacularRecipe(data);
    } catch (error) {
      console.error(`Failed to fetch recipe ${id} from Spoonacular:`, error);
      return null;
    }
  }

  /**
   * Get popular or trending recipes
   */
  async getTrendingRecipes(limit: number = 10): Promise<ApiRecipe[]> {
    try {
      const data = await this.request('/recipes/random', {
        number: String(limit),
        limitLicense: 'true',
      });
      return data.recipes.map(transformSpoonacularRecipe);
    } catch (error) {
      console.error('Failed to get trending recipes from Spoonacular:', error);
      return [];
    }
  }
  
  /**
   * Get recipes by meal type (breakfast, lunch, dinner, etc.)
   */
  async getRecipesByMealType(mealType: string, limit: number = 10): Promise<ApiRecipe[]> {
    try {
      // Map our meal types to Spoonacular's expected format
      const mealTypeMapping: {[key: string]: string} = {
        'breakfast': 'breakfast',
        'lunch': 'lunch',
        'dinner': 'dinner',
        'snack': 'snack',
      };
      
      const type = mealTypeMapping[mealType.toLowerCase()] || mealType;
      
      const data = await this.request('/recipes/complexSearch', {
        type,
        number: String(limit),
        addRecipeInformation: 'true',
        addRecipeNutrition: 'true',
        fillIngredients: 'true',
      });
      
      return data.results.map(transformSpoonacularRecipe);
    } catch (error) {
      console.error(`Failed to get recipes by meal type ${mealType} from Spoonacular:`, error);
      return [];
    }
  }
  
  /**
   * Get nutrition information for a list of ingredients
   */
  async analyzeIngredients(ingredients: string[]): Promise<any> {
    try {
      const result = await this.request('/recipes/parseIngredients', {}, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ingredientList: ingredients.join('\n'),
          servings: '1',
          includeNutrition: 'true',
          apiKey: this.config.apiKey || '',
        }),
      });
      return result;
    } catch (error) {
      console.error('Failed to analyze ingredients on Spoonacular:', error);
      return [];
    }
  }
}
