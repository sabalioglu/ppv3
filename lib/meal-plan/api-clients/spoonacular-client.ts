// lib/meal-plan/api-clients/spoonacular-client.ts
import { RecipeApiClient, Recipe, RecipeSearchParams, RecipeSearchResult } from './types';
import { withCache } from './cache-decorator';

export class SpoonacularApiClient implements RecipeApiClient {
  private apiKey: string;
  private host: string;
  private baseUrl: string;

  constructor(apiKey: string, host?: string) {
    this.apiKey = apiKey;
    this.host = host || 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com';
    this.baseUrl = `https://${this.host}`;
  }

  private async makeRequest(endpoint: string, params?: URLSearchParams): Promise<any> {
    const url = params ? `${this.baseUrl}${endpoint}?${params.toString()}` : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.host,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    
    return await response.json();
  }

  // 1. Kompleks Arama (Ana Endpoint) - RapidAPI için güncellendi
  async searchRecipes(params: RecipeSearchParams): Promise<RecipeSearchResult> {
      return this.searchRecipesWithCache(params);
  }
  
  private searchRecipesWithCache = withCache<RecipeSearchResult>(
    'spoonacular:searchRecipes',
    async (params: RecipeSearchParams): Promise<RecipeSearchResult> => {
      try {
        const queryParams = new URLSearchParams();
        
        if (params.query) queryParams.append('query', params.query);
        if (params.cuisine) queryParams.append('cuisine', params.cuisine);
        if (params.diet) queryParams.append('diet', params.diet);
        if (params.intolerances) queryParams.append('intolerances', params.intolerances);
        if (params.type) queryParams.append('type', params.type);
        if (params.maxReadyTime) queryParams.append('maxReadyTime', params.maxReadyTime.toString());
        
        queryParams.append('number', (params.limit || 10).toString());
        queryParams.append('offset', (params.offset || 0).toString());
        queryParams.append('instructionsRequired', 'true');
        queryParams.append('addRecipeInformation', 'true');
        queryParams.append('fillIngredients', 'true');
        
        const data = await this.makeRequest('/recipes/complexSearch', queryParams);
        
        return {
          results: data.results.map((recipe: any) => this.mapRecipe(recipe)),
          offset: data.offset,
          number: data.number,
          totalResults: data.totalResults
        };
      } catch (error) {
        console.error('Error fetching recipes from Spoonacular (RapidAPI):', error);
        throw error;
      }
    },
    { ttl: 3600000 }
  );

  // 2. Malzeme Bazlı Arama - RapidAPI için güncellendi
  async findByIngredients(ingredients: string, number: number = 10): Promise<Recipe[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('ingredients', ingredients);
    queryParams.append('number', number.toString());
    queryParams.append('ranking', '1');
    queryParams.append('ignorePantry', 'true');

    const data = await this.makeRequest('/recipes/findByIngredients', queryParams);
    
    const detailedRecipes = await Promise.all(
      data.map((recipe: any) => this.getRecipeById(recipe.id.toString()))
    );
    return detailedRecipes;
  }

  // Besin Değeri Bazlı Arama
  async findByNutrients(params: Record<string, string | number>, number: number = 10): Promise<Recipe[]> {
      const queryParams = new URLSearchParams();
      for (const key in params) {
          queryParams.append(key, String(params[key]));
      }
      queryParams.append('number', String(number));
      const data = await this.makeRequest('/recipes/findByNutrients', queryParams);
      const detailedRecipes = await Promise.all(
        data.map((recipe: any) => this.getRecipeById(recipe.id.toString()))
      );
      return detailedRecipes;
  }

  // 3. Recipe By ID - RapidAPI için güncellendi
  async getRecipeById(id: string): Promise<Recipe> {
    return this.getRecipeByIdWithCache(id);
  }

  private getRecipeByIdWithCache = withCache<Recipe>(
    'spoonacular:getRecipeById',
    async (id: string): Promise<Recipe> => {
      try {
        const actualId = id.replace('spoonacular:', '');
        const queryParams = new URLSearchParams();
        queryParams.append('includeNutrition', 'true');
        
        const data = await this.makeRequest(`/recipes/${actualId}/information`, queryParams);
        return this.mapRecipe(data);
      } catch (error) {
        console.error(`Error fetching recipe ${id} from Spoonacular (RapidAPI):`, error);
        throw error;
      }
    },
    { ttl: 86400000 }
  );

  // 4. Random Recipes - RapidAPI için güncellendi
  async getRandomRecipes(params: { tags?: string; number?: number }): Promise<Recipe[]> {
    return this.getRandomRecipesWithCache(params);
  }
  
  private getRandomRecipesWithCache = withCache<Recipe[]>(
    'spoonacular:getRandomRecipes',
    async (params: { tags?: string; number?: number }): Promise<Recipe[]> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('number', (params.number || 1).toString());
        
        if (params.tags) {
          queryParams.append('tags', params.tags);
        }
        
        const data = await this.makeRequest('/recipes/random', queryParams);
        return data.recipes.map((recipe: any) => this.mapRecipe(recipe));
      } catch (error) {
        console.error('Error fetching random recipes from Spoonacular (RapidAPI):', error);
        throw error;
      }
    },
    { ttl: 3600000 }
  );

  private mapRecipe(recipeData: any): Recipe {
    return {
      id: `spoonacular:${recipeData.id.toString()}`,
      title: recipeData.title,
      image: recipeData.image || '',
      imageType: recipeData.imageType || '',
      servings: recipeData.servings || 0,
      readyInMinutes: recipeData.readyInMinutes || 0,
      license: recipeData.license || '',
      sourceName: recipeData.sourceName || 'Spoonacular',
      sourceUrl: recipeData.sourceUrl || '',
      spoonacularScore: recipeData.spoonacularScore || 0,
      healthScore: recipeData.healthScore || 0,
      pricePerServing: recipeData.pricePerServing || 0,
      analyzedInstructions: recipeData.analyzedInstructions || [],
      cheap: recipeData.cheap || false,
      creditsText: recipeData.creditsText || '',
      cuisines: recipeData.cuisines || [],
      dairyFree: recipeData.dairyFree || false,
      diets: recipeData.diets || [],
      gaps: recipeData.gaps || '',
      glutenFree: recipeData.glutenFree || false,
      instructions: recipeData.instructions || '',
      ketogenic: recipeData.ketogenic || false,
      lowFodmap: recipeData.lowFodmap || false,
      occasions: recipeData.occasions || [],
      sustainable: recipeData.sustainable || false,
      vegan: recipeData.vegan || false,
      vegetarian: recipeData.vegetarian || false,
      veryHealthy: recipeData.veryHealthy || false,
      veryPopular: recipeData.veryPopular || false,
      whole30: recipeData.whole30 || false,
      weightWatcherSmartPoints: recipeData.weightWatcherSmartPoints || 0,
      dishTypes: recipeData.dishTypes || [],
      extendedIngredients: recipeData.extendedIngredients || [],
      summary: recipeData.summary || '',
      winePairing: recipeData.winePairing || {},
      originalId: recipeData.id.toString(),
      apiSource: 'spoonacular'
    };
  }
}
