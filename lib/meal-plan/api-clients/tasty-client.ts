// lib/meal-plan/api-clients/tasty-client.ts

import { ApiProvider, ApiClientConfig, RecipeApiClient, RecipeSearchParams, ApiRecipe } from './types';

// Helper to transform Tasty API response to our standard ApiRecipe format
const transformTastyRecipe = (tastyRecipe: any): ApiRecipe => {
  const nutrition = tastyRecipe.nutrition || {};
  return {
    id: tastyRecipe.id,
    name: tastyRecipe.name,
    ingredients: tastyRecipe.sections?.flatMap((s: any) => s.components.map((c: any) => ({
      name: c.ingredient.name,
      amount: c.measurements[0]?.quantity ? parseFloat(c.measurements[0].quantity) || 1 : 1,
      unit: c.measurements[0]?.unit.name || 'unit',
      category: c.ingredient.display_singular,
    }))) || [],
    calories: nutrition.calories || 0,
    protein: nutrition.protein || 0,
    carbs: nutrition.carbohydrates || 0,
    fat: nutrition.fat || 0,
    fiber: nutrition.fiber || 0,
    prepTime: tastyRecipe.prep_time_minutes || 15,
    cookTime: tastyRecipe.cook_time_minutes || 20,
    servings: tastyRecipe.num_servings || 1,
    difficulty: tastyRecipe.user_ratings?.score > 0.8 ? 'Easy' : 'Medium',
    emoji: '😋',
    category: tastyRecipe.topics?.[0]?.name || 'dinner',
    tags: tastyRecipe.tags?.map((t: any) => t.display_name) || [],
    instructions: tastyRecipe.instructions?.map((i: any) => i.display_text) || [],
    source: ApiProvider.TASTY,
    sourceUrl: tastyRecipe.original_video_url,
  };
};

export class TastyApiClient extends RecipeApiClient {
  constructor(config: ApiClientConfig) {
    super({
      ...config,
      baseUrl: 'https://tasty.p.rapidapi.com',
    });
  }

  private async request(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    for (const key in params) {
      url.searchParams.append(key, params[key]);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': this.config.apiKey || '',
        'X-RapidAPI-Host': 'tasty.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`Tasty API error: ${response.statusText}`);
    }
    return response.json();
  }

  async searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]> {
    const data = await this.request('/recipes/list', {
      from: (params.offset || 0).toString(),
      size: (params.number || 10).toString(),
      q: params.query || params.ingredients?.join(' ') || '',
    });
    return data.results.map(transformTastyRecipe);
  }

  async getRecipeDetails(id: string | number): Promise<ApiRecipe | null> {
    try {
      const data = await this.request('/recipes/get-more-info', { recipe_id: id.toString() });
      return transformTastyRecipe(data);
    } catch (error) {
      console.error(`Failed to fetch recipe ${id} from Tasty:`, error);
      return null;
    }
  }

  async getTrendingRecipes(): Promise<ApiRecipe[]> {
    // Tasty API's "list" endpoint often returns popular/recent recipes,
    // so we use it as a stand-in for trending.
    return this.searchRecipes({ number: 10 });
  }
}
