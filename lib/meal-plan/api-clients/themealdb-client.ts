// lib/meal-plan/api-clients/themealdb-client.ts
import { RecipeApiClient, Recipe, RecipeSearchParams, RecipeSearchResult } from './types';
import { withCache } from './cache-decorator';

export class TheMealDbApiClient implements RecipeApiClient {
  private apiKey: string;
  private host: string;
  private baseUrl: string;
  private useRapidApi: boolean;
  
  constructor(apiKey: string = '1', host?: string) {
    this.apiKey = apiKey;
    this.host = host || 'www.themealdb.com';
    this.useRapidApi = !!host;

    if (this.useRapidApi) {
      this.baseUrl = `https://${this.host}`;
    } else {
      // Ücretsiz genel API için anahtar URL yolunun bir parçasıdır
      this.baseUrl = `https://www.themealdb.com/api/json/v1/${this.apiKey}`;
    }
  }

  async searchRecipes(params: RecipeSearchParams): Promise<RecipeSearchResult> {
    return this.searchRecipesWithCache(params);
  }

  private searchRecipesWithCache = withCache<RecipeSearchResult>(
    'themealdb:searchRecipes',
    async (params: RecipeSearchParams): Promise<RecipeSearchResult> => {
      try {
        let url = `${this.baseUrl}/search.php?`;
        let queryAdded = false;
        
        if (params.query) {
          url += `s=${encodeURIComponent(params.query)}`;
          queryAdded = true;
        } else if (params.cuisine) {
          url = `${this.baseUrl}/filter.php?a=${encodeURIComponent(params.cuisine)}`;
          queryAdded = true;
        } else if (params.type) {
          url = `${this.baseUrl}/filter.php?c=${encodeURIComponent(params.type)}`;
          queryAdded = true;
        }
        
        if (!queryAdded) {
          // Varsayılan olarak alfabetik arama yap
          url += 's=';
        }
        
        // RapidAPI başlıkları ekleyin
        const options: RequestInit = {
          method: 'GET'
        };
        
        if (this.useRapidApi) {
          options.headers = {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          };
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`TheMealDB API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        const meals = data.meals || [];
        
        // Basit sayfalama mantığı uygula (API gerçek sayfalama desteklemiyor)
        const offset = params.offset || 0;
        const limit = params.limit || 10;
        const paginatedMeals = meals.slice(offset, offset + limit);
        
        // Her bir yemek için detaylı bilgi al
        const detailedMeals = await Promise.all(
          paginatedMeals.map(async (meal: any) => {
            try {
              return await this.getRecipeById(meal.idMeal);
            } catch (error) {
              console.error(`Error fetching detailed recipe ${meal.idMeal}:`, error);
              // Detay alınamazsa, basit veriyi dönüştür
              return this.mapSimpleMeal(meal);
            }
          })
        );
        
        return {
          results: detailedMeals,
          offset: offset,
          number: detailedMeals.length,
          totalResults: meals.length
        };
      } catch (error) {
        console.error('Error fetching recipes from TheMealDB:', error);
        throw error;
      }
    },
    { ttl: 3600000 } // 1 saat önbellekleme
  );

  async getRecipeById(id: string): Promise<Recipe> {
    return this.getRecipeByIdWithCache(id);
  }
  
  private getRecipeByIdWithCache = withCache<Recipe>(
    'themealdb:getRecipeById',
    async (id: string): Promise<Recipe> => {
      try {
        // Eğer id "themealdb:" öneki içeriyorsa, onu kaldır
        const actualId = id.startsWith('themealdb:') ? id.substring(10) : id;
        
        // RapidAPI başlıkları ekleyin
        const options: RequestInit = {
          method: 'GET'
        };
        
        if (this.useRapidApi) {
          options.headers = {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          };
        }
        
        const response = await fetch(`${this.baseUrl}/lookup.php?i=${actualId}`, options);
        
        if (!response.ok) {
          throw new Error(`TheMealDB API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.meals || data.meals.length === 0) {
          throw new Error(`Recipe with ID ${id} not found`);
        }
        
        return this.mapRecipe(data.meals[0]);
      } catch (error) {
        console.error(`Error fetching recipe ${id} from TheMealDB:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getRandomRecipes(params: { tags?: string; number?: number }): Promise<Recipe[]> {
    return this.getRandomRecipesWithCache(params);
  }
  
  private getRandomRecipesWithCache = withCache<Recipe[]>(
    'themealdb:getRandomRecipes',
    async (params: { tags?: string; number?: number }): Promise<Recipe[]> => {
      try {
        const number = params.number || 1;
        const recipes: Recipe[] = [];
        
        // RapidAPI başlıkları ekleyin
        const options: RequestInit = {
          method: 'GET'
        };
        
        if (this.useRapidApi) {
          options.headers = {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          };
        }
        
        // TheMealDB API'si aynı anda birden fazla rastgele tarif döndüremiyor
        // Bu nedenle istenen sayıda rastgele tarif almak için döngü kullanıyoruz
        for (let i = 0; i < number; i++) {
          const response = await fetch(`${this.baseUrl}/random.php`, options);
          
          if (!response.ok) {
            throw new Error(`TheMealDB API error: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.meals && data.meals.length > 0) {
            recipes.push(this.mapRecipe(data.meals[0]));
          }
        }
        
        return recipes;
      } catch (error) {
        console.error('Error fetching random recipes from TheMealDB:', error);
        throw error;
      }
    },
    { ttl: 3600000 } // 1 saat önbellekleme
  );

  private mapRecipe(mealData: any): Recipe {
    // TheMealDB API'den gelen ingredientleri dizi olarak oluştur
    const ingredients: any[] = [];
    
    for (let i = 1; i <= 20; i++) {
      const ingredient = mealData[`strIngredient${i}`];
      const measure = mealData[`strMeasure${i}`];
      
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push({
          name: ingredient,
          amount: measure || '',
          original: `${measure || ''} ${ingredient}`.trim()
        });
      }
    }
    
    // Analiz edilmiş talimatları oluştur
    const analyzedInstructions = [];
    if (mealData.strInstructions) {
      const steps = mealData.strInstructions
        .split(/\r\n|\r|\n/)
        .filter((step: string) => step.trim() !== '')
        .map((step: string, index: number) => ({
          number: index + 1,
          step: step.trim()
        }));
        
      if (steps.length > 0) {
        analyzedInstructions.push({
          name: '',
          steps
        });
      }
    }
    
    return {
      id: `themealdb:${mealData.idMeal}`,
      title: mealData.strMeal,
      image: mealData.strMealThumb || '',
      imageType: 'jpg',
      servings: 4, // TheMealDB API'si porsiyon bilgisi sağlamıyor, varsayılan değer
      readyInMinutes: 30, // TheMealDB API'si hazırlama süresi sağlamıyor, varsayılan değer
      license: '',
      sourceName: mealData.strSource ? new URL(mealData.strSource).hostname : 'TheMealDB',
      sourceUrl: mealData.strSource || '',
      spoonacularScore: 0,
      healthScore: 0,
      pricePerServing: 0,
      analyzedInstructions: analyzedInstructions,
      cheap: false,
      creditsText: 'TheMealDB',
      cuisines: mealData.strArea ? [mealData.strArea] : [],
      dairyFree: false,
      diets: [], // TheMealDB diyet bilgisi sağlamıyor
      gaps: '',
      glutenFree: false,
      instructions: mealData.strInstructions || '',
      ketogenic: false,
      lowFodmap: false,
      occasions: [],
      sustainable: false,
      vegan: false,
      vegetarian: mealData.strCategory === 'Vegetarian',
      veryHealthy: false,
      veryPopular: false,
      whole30: false,
      weightWatcherSmartPoints: 0,
      dishTypes: mealData.strCategory ? [mealData.strCategory] : [],
      extendedIngredients: ingredients,
      summary: `${mealData.strMeal} is a ${mealData.strCategory} dish from ${mealData.strArea} cuisine.`,
      winePairing: {},
      originalId: mealData.idMeal,
      apiSource: 'themealdb'
    };
  }
  
  private mapSimpleMeal(mealData: any): Recipe {
    return {
      id: `themealdb:${mealData.idMeal}`,
      title: mealData.strMeal,
      image: mealData.strMealThumb || '',
      imageType: 'jpg',
      servings: 4,
      readyInMinutes: 30,
      license: '',
      sourceName: 'TheMealDB',
      sourceUrl: '',
      spoonacularScore: 0,
      healthScore: 0,
      pricePerServing: 0,
      analyzedInstructions: [],
      cheap: false,
      creditsText: 'TheMealDB',
      cuisines: [],
      dairyFree: false,
      diets: [],
      gaps: '',
      glutenFree: false,
      instructions: '',
      ketogenic: false,
      lowFodmap: false,
      occasions: [],
      sustainable: false,
      vegan: false,
      vegetarian: false,
      veryHealthy: false,
      veryPopular: false,
      whole30: false,
      weightWatcherSmartPoints: 0,
      dishTypes: [],
      extendedIngredients: [],
      summary: '',
      winePairing: {},
      originalId: mealData.idMeal,
      apiSource: 'themealdb'
    };
  }
  
  // TheMealDB'ye özgü ekstra metodlar
  async getCategories(): Promise<any[]> {
    return this.getCategoriesWithCache();
  }
  
  private getCategoriesWithCache = withCache<any[]>(
    'themealdb:getCategories',
    async (): Promise<any[]> => {
      try {
        const options: RequestInit = {
          method: 'GET'
        };
        
        if (this.useRapidApi) {
          options.headers = {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          };
        }
        
        const response = await fetch(`${this.baseUrl}/categories.php`, options);
        
        if (!response.ok) {
          throw new Error(`TheMealDB API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.categories || [];
      } catch (error) {
        console.error('Error fetching categories from TheMealDB:', error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getAreas(): Promise<string[]> {
    return this.getAreasWithCache();
  }
  
  private getAreasWithCache = withCache<string[]>(
    'themealdb:getAreas',
    async (): Promise<string[]> => {
      try {
        const options: RequestInit = {
          method: 'GET'
        };
        
        if (this.useRapidApi) {
          options.headers = {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          };
        }
        
        const response = await fetch(`${this.baseUrl}/list.php?a=list`, options);
        
        if (!response.ok) {
          throw new Error(`TheMealDB API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.meals ? data.meals.map((area: any) => area.strArea) : [];
      } catch (error) {
        console.error('Error fetching areas from TheMealDB:', error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
}
