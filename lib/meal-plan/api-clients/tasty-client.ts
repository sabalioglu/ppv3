// lib/meal-plan/api-clients/tasty-client.ts
import { RecipeApiClient, Recipe, RecipeSearchParams, RecipeSearchResult } from './types';
import { withCache } from './cache-decorator';

export class TastyApiClient implements RecipeApiClient {
  private apiKey: string;
  private host: string;
  private baseUrl: string;
  
  // Host parametresi ekleyin
  constructor(apiKey: string, host?: string) {
    this.apiKey = apiKey;
    this.host = host || 'tasty.p.rapidapi.com';
    this.baseUrl = `https://${this.host}`;
  }

  async searchRecipes(params: RecipeSearchParams): Promise<RecipeSearchResult> {
    return this.searchRecipesWithCache(params);
  }

  private searchRecipesWithCache = withCache<RecipeSearchResult>(
    'tasty:searchRecipes',
    async (params: RecipeSearchParams): Promise<RecipeSearchResult> => {
      try {
        const queryParams = new URLSearchParams();
        
        if (params.query) queryParams.append('q', params.query);
        if (params.limit) queryParams.append('size', params.limit.toString());
        if (params.offset) queryParams.append('from', params.offset.toString());
        if (params.cuisine) queryParams.append('tags', params.cuisine);
        
        // RapidAPI başlıkları ekleyin
        const response = await fetch(`${this.baseUrl}/recipes/list?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          }
        });
        
        if (!response.ok) {
          throw new Error(`Tasty API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          results: data.results.map((recipe: any) => this.mapRecipe(recipe)),
          offset: params.offset || 0,
          number: data.count,
          totalResults: data.count
        };
      } catch (error) {
        console.error('Error fetching recipes from Tasty:', error);
        throw error;
      }
    },
    { ttl: 3600000 } // 1 saat önbellekleme
  );

  async getRecipeById(id: string): Promise<Recipe> {
    return this.getRecipeByIdWithCache(id);
  }
  
  private getRecipeByIdWithCache = withCache<Recipe>(
    'tasty:getRecipeById',
    async (id: string): Promise<Recipe> => {
      try {
        // Eğer id "tasty:" öneki içeriyorsa, onu kaldır
        const actualId = id.startsWith('tasty:') ? id.substring(6) : id;
        
        // RapidAPI başlıkları ekleyin
        const response = await fetch(`${this.baseUrl}/recipes/get-more-info?id=${actualId}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          }
        });
        
        if (!response.ok) {
          throw new Error(`Tasty API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return this.mapRecipe(data);
      } catch (error) {
        console.error(`Error fetching recipe ${id} from Tasty:`, error);
        throw error;
      }
    },
    { ttl: 86400000 } // 24 saat önbellekleme
  );
  
  async getRandomRecipes(params: { tags?: string; number?: number }): Promise<Recipe[]> {
    return this.getRandomRecipesWithCache(params);
  }
  
  private getRandomRecipesWithCache = withCache<Recipe[]>(
    'tasty:getRandomRecipes',
    async (params: { tags?: string; number?: number }): Promise<Recipe[]> => {
      try {
        // Tasty API'nin doğrudan rastgele tarif API'si yok
        // Bunun yerine, tüm tarifleri alıp rastgele seçim yapabiliriz
        const queryParams = new URLSearchParams();
        queryParams.append('from', '0');
        queryParams.append('size', '100'); // Daha büyük bir havuz için 100 tarif al
        
        if (params.tags) {
          queryParams.append('tags', params.tags);
        }
        
        // RapidAPI başlıkları ekleyin
        const response = await fetch(`${this.baseUrl}/recipes/list?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          }
        });
        
        if (!response.ok) {
          throw new Error(`Tasty API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        const recipes = data.results;
        
        // Tüm tarifleri karıştır ve istenen sayıda al
        const shuffled = [...recipes].sort(() => 0.5 - Math.random());
        const selectedRecipes = shuffled.slice(0, params.number || 1);
        
        // Seçilen tarifler için tam detayları al
        const detailedRecipes = await Promise.all(
          selectedRecipes.map(async (recipe: any) => {
            try {
              return await this.getRecipeById(recipe.id.toString());
            } catch (error) {
              console.error(`Error fetching detailed recipe ${recipe.id}:`, error);
              return this.mapRecipe(recipe); // Detay alınamazsa basit haritayı kullan
            }
          })
        );
        
        return detailedRecipes;
      } catch (error) {
        console.error('Error fetching random recipes from Tasty:', error);
        throw error;
      }
    },
    { ttl: 3600000 } // 1 saat önbellekleme
  );

  // mapRecipe metodunda değişiklik yok, olduğu gibi kalabilir
  private mapRecipe(recipeData: any): Recipe {
    // Mevcut mapRecipe implementasyonu
    // ...
    return {
      id: `tasty:${recipeData.id}`,
      title: recipeData.name,
      image: recipeData.thumbnail_url || '',
      imageType: 'jpg',
      // ... diğer tüm alanlar
      apiSource: 'tasty'
    };
  }
}
