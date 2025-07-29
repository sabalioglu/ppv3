// lib/meal-plan/api-clients/themealdb-client.ts
import { RecipeApiClient, Recipe, RecipeSearchParams, RecipeSearchResult } from './types';
import { withCache } from './cache-decorator';

export class TheMealDbApiClient implements RecipeApiClient {
  private apiKey: string;
  private host: string;
  private baseUrl: string;
  private useRapidApi: boolean;
  
  // Host parametresi ekleyin
  constructor(apiKey: string = '', host?: string) {
    this.apiKey = apiKey;
    this.host = host || 'themealdb.p.rapidapi.com';
    this.useRapidApi = !!host; // Host varsa RapidAPI kullanıyoruz demektir
    this.baseUrl = `https://${this.host}`;
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

  // mapRecipe ve mapSimpleMeal metodlarında değişiklik yok
  private mapRecipe(mealData: any): Recipe {
    // Mevcut mapRecipe implementasyonu
    return {
      // ... mevcut implementasyon
      apiSource: 'themealdb'
    };
  }
  
  private mapSimpleMeal(mealData: any): Recipe {
    // Mevcut mapSimpleMeal implementasyonu
    return {
      // ... mevcut implementasyon
      apiSource: 'themealdb'
    };
  }
}
