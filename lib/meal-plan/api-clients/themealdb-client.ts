// lib/meal-plan/api-clients/themealdb-client.ts

import { ApiProvider, ApiClientConfig, RecipeApiClient, RecipeSearchParams, ApiRecipe } from './types';

// Helper to transform TheMealDB API response to our standard ApiRecipe format
const transformTheMealDBRecipe = (meal: any): ApiRecipe => {
  const ingredients: { name: string; amount: number; unit: string; category: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim() !== '') {
      ingredients.push({
        name: ingredient,
        amount: parseFloat(measure) || 1,
        unit: measure.replace(/[0-9]/g, '').trim() || 'unit',
        category: meal.strCategory || 'Unknown',
      });
    }
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    ingredients,
    calories: 0, // TheMealDB does not provide nutrition info
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    prepTime: 20, // Default values
    cookTime: 30,
    servings: 1,
    difficulty: 'Medium',
    emoji: '🍽️',
    category: meal.strCategory || 'dinner',
    tags: meal.strTags?.split(',') || [],
    instructions: meal.strInstructions?.split('\r\n').filter(s => s.trim() !== '') || [],
    source: ApiProvider.THEMEALDB,
    sourceUrl: meal.strSource,
  };
};

export class TheMealDBApiClient extends RecipeApiClient {
  constructor(config: ApiClientConfig) {
    super({
      ...config,
      baseUrl: 'https://www.themealdb.com/api/json/v1/',
    });
  }

  private async request(endpoint: string): Promise<any> {
    const url = `${this.config.baseUrl}${this.config.apiKey}/${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TheMealDB API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.meals) {
      return []; // Return empty array if no meals are found
    }
    return data.meals;
  }

  async searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]> {
    let endpoint = 'search.php?s=';
    if (params.query) {
      endpoint = `search.php?s=${params.query}`;
    } else if (params.ingredients && params.ingredients.length > 0) {
      endpoint = `filter.php?i=${params.ingredients[0]}`; // TheMealDB only filters by one main ingredient
    }
    const data = await this.request(endpoint);
    return data.map(transformTheMealDBRecipe);
  }

  async getRecipeDetails(id: string | number): Promise<ApiRecipe | null> {
    try {
      const data = await this.request(`lookup.php?i=${id}`);
      if (data && data.length > 0) {
        return transformTheMealDBRecipe(data[0]);
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch recipe ${id} from TheMealDB:`, error);
      return null;
    }
  }

  async getTrendingRecipes(): Promise<ApiRecipe[]> {
    const data = await this.request('randomselection.php'); // Returns 10 random meals
    return data.map(transformTheMealDBRecipe);
  }
}
