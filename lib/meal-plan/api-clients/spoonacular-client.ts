// lib/meal-plan/api-clients/spoonacular-client.ts
import { RecipeApiClient, Recipe, RecipeSearchParams, RecipeSearchResult } from './types';
import { withCache } from './cache-decorator';

export class SpoonacularApiClient implements RecipeApiClient {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.spoonacular.com';
  }

  async searchRecipes(params: RecipeSearchParams): Promise<RecipeSearchResult> {
    return this.searchRecipesWithCache(params);
  }

  private searchRecipesWithCache = withCache<RecipeSearchResult>(
    'spoonacular:searchRecipes',
    async (params: RecipeSearchParams): Promise<RecipeSearchResult> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        
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
        
        const response = await fetch(`${this.baseUrl}/recipes/complexSearch?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          results: data.results.map((recipe: any) => this.mapRecipe(recipe)),
          offset: params.offset || 0,
          number: data.number,
          totalResults: data.totalResults
        };
      } catch (error) {
        console.error('Error fetching recipes from Spoonacular:', error);
        throw error;
      }
    },
    { ttl: 3600000 } // 1 saat önbellekleme
  );

  async getRecipeById(id: string): Promise<Recipe> {
    return this.getRecipeByIdWithCache(id);
  }
  
  private getRecipeByIdWithCache = withCache<Recipe>(
    'spoonacular:getRecipeById',
    async (id: string): Promise<Recipe> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        queryParams.append('includeNutrition', 'true');
        
        const response = await fetch(`${this.baseUrl}/recipes/${id}/information?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return this.mapRecipe(data);
      } catch (error) {
        console.error(`Error fetching recipe ${id} from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getRandomRecipes(params: { tags?: string; number?: number }): Promise<Recipe[]> {
    return this.getRandomRecipesWithCache(params);
  }
  
  private getRandomRecipesWithCache = withCache<Recipe[]>(
    'spoonacular:getRandomRecipes',
    async (params: { tags?: string; number?: number }): Promise<Recipe[]> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        queryParams.append('number', (params.number || 1).toString());
        
        if (params.tags) {
          queryParams.append('tags', params.tags);
        }
        
        const response = await fetch(`${this.baseUrl}/recipes/random?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.recipes.map((recipe: any) => this.mapRecipe(recipe));
      } catch (error) {
        console.error('Error fetching random recipes from Spoonacular:', error);
        throw error;
      }
    },
    { ttl: 3600000 } // 1 saat önbellekleme
  );

  private mapRecipe(recipeData: any): Recipe {
    return {
      id: recipeData.id.toString(),
      title: recipeData.title,
      image: recipeData.image || '',
      imageType: recipeData.imageType || '',
      servings: recipeData.servings || 0,
      readyInMinutes: recipeData.readyInMinutes || 0,
      license: recipeData.license || '',
      sourceName: recipeData.sourceName || '',
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
      originalId: recipeData.originalId || null,
      apiSource: 'spoonacular'
    };
  }
  
  async getSimilarRecipes(id: string, number: number = 5): Promise<Recipe[]> {
    return this.getSimilarRecipesWithCache(id, number);
  }
  
  private getSimilarRecipesWithCache = withCache<Recipe[]>(
    'spoonacular:getSimilarRecipes',
    async (id: string, number: number = 5): Promise<Recipe[]> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        queryParams.append('number', number.toString());
        
        const response = await fetch(`${this.baseUrl}/recipes/${id}/similar?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        const similarRecipes = await response.json();
        
        // Similar recipes endpoint returns limited information, so we need to fetch full recipe details
        const recipePromises = similarRecipes.map((recipe: any) => 
          this.getRecipeById(recipe.id.toString())
        );
        
        return Promise.all(recipePromises);
      } catch (error) {
        console.error(`Error fetching similar recipes for ${id} from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getRecipeNutrition(id: string): Promise<any> {
    return this.getRecipeNutritionWithCache(id);
  }
  
  private getRecipeNutritionWithCache = withCache<any>(
    'spoonacular:getRecipeNutrition',
    async (id: string): Promise<any> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        
        const response = await fetch(`${this.baseUrl}/recipes/${id}/nutritionWidget.json?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error fetching nutrition for recipe ${id} from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getRecipeEquipment(id: string): Promise<any> {
    return this.getRecipeEquipmentWithCache(id);
  }
  
  private getRecipeEquipmentWithCache = withCache<any>(
    'spoonacular:getRecipeEquipment',
    async (id: string): Promise<any> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        
        const response = await fetch(`${this.baseUrl}/recipes/${id}/equipmentWidget.json?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error fetching equipment for recipe ${id} from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async autocompleteRecipeSearch(query: string, number: number = 10): Promise<any[]> {
    return this.autocompleteRecipeSearchWithCache(query, number);
  }
  
  private autocompleteRecipeSearchWithCache = withCache<any[]>(
    'spoonacular:autocompleteRecipeSearch',
    async (query: string, number: number = 10): Promise<any[]> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        queryParams.append('query', query);
        queryParams.append('number', number.toString());
        
        const response = await fetch(`${this.baseUrl}/recipes/autocomplete?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error fetching autocomplete for query "${query}" from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 3600000 } // 1 saat önbellekleme
  );
  
  async getRecipeInformation(id: string): Promise<any> {
    return this.getRecipeInformationWithCache(id);
  }
  
  private getRecipeInformationWithCache = withCache<any>(
    'spoonacular:getRecipeInformation',
    async (id: string): Promise<any> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        queryParams.append('includeNutrition', 'false');
        
        const response = await fetch(`${this.baseUrl}/recipes/${id}/information?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error fetching information for recipe ${id} from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getRecipeIngredientsById(id: string): Promise<any> {
    return this.getRecipeIngredientsByIdWithCache(id);
  }
  
  private getRecipeIngredientsByIdWithCache = withCache<any>(
    'spoonacular:getRecipeIngredientsById',
    async (id: string): Promise<any> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        
        const response = await fetch(`${this.baseUrl}/recipes/${id}/ingredientWidget.json?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error fetching ingredients for recipe ${id} from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async searchIngredients(query: string, number: number = 10): Promise<any> {
    return this.searchIngredientsWithCache(query, number);
  }
  
  private searchIngredientsWithCache = withCache<any>(
    'spoonacular:searchIngredients',
    async (query: string, number: number = 10): Promise<any> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        queryParams.append('query', query);
        queryParams.append('number', number.toString());
        queryParams.append('metaInformation', 'true');
        
        const response = await fetch(`${this.baseUrl}/food/ingredients/search?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error searching ingredients with query "${query}" from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getMealPlanWeek(targetCalories: number, diet?: string): Promise<any> {
    return this.getMealPlanWeekWithCache(targetCalories, diet);
  }
  
  private getMealPlanWeekWithCache = withCache<any>(
    'spoonacular:getMealPlanWeek',
    async (targetCalories: number, diet?: string): Promise<any> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.apiKey);
        queryParams.append('targetCalories', targetCalories.toString());
        queryParams.append('timeFrame', 'week');
        
        if (diet) {
          queryParams.append('diet', diet);
        }
        
        const response = await fetch(`${this.baseUrl}/mealplanner/generate?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Spoonacular API error: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error generating meal plan from Spoonacular:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
}
