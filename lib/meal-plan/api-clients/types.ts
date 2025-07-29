// lib/meal-plan/api-clients/types.ts

/**
 * Desteklenen API sağlayıcıları
 */
export enum ApiProvider {
  SPOONACULAR = 'spoonacular',
  TASTY = 'tasty',
  THEMEALDB = 'themealdb'
}

/**
 * API istemcisi yapılandırması
 */
export interface ApiClientConfig {
  provider: ApiProvider;
  apiKey: string;
  baseUrl?: string;
}

/**
 * Tarif arama parametreleri
 */
export interface RecipeSearchParams {
  query?: string;
  ingredients?: string[];
  cuisine?: string;
  diet?: string;
  mealType?: string;
  number?: number;
  offset?: number;
  tags?: string[];
}

/**
 * API'den döndürülen bir tarif için standart format
 */
export interface ApiRecipe {
  id: string;
  name: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    category: string;
  }[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  emoji: string;
  category: string;
  tags: string[];
  instructions: string[];
  source: ApiProvider;
  sourceUrl: string;
  image?: string;
  [key: string]: any; // API'ye özgü ek alanlar için
}

/**
 * Temel API istemci sınıfı
 */
export abstract class RecipeApiClient {
  protected config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * API'den veri istemek için temel metot
   */
  protected async request(endpoint: string, params: Record<string, string> = {}, options: RequestInit = {}): Promise<any> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    
    // URL parametrelerini ekle
    for (const key in params) {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    }

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url.toString()}`, error);
      throw error;
    }
  }

  /**
   * API'ye özgü doğrulama başlıklarını döndürür
   */
  protected getAuthHeaders(): Record<string, string> {
    return {}; // Alt sınıflar tarafından geçersiz kılınacak
  }

  /**
   * Anahtar kelime veya diğer parametrelere göre tarif arama
   */
  abstract searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]>;

  /**
   * Belirli bir tarifi ID'ye göre getir
   */
  abstract getRecipeDetails(id: string | number): Promise<ApiRecipe | null>;

  /**
   * Trend veya popüler tarifleri getir
   */
  abstract getTrendingRecipes(limit?: number): Promise<ApiRecipe[]>;

  /**
   * Belirli bir öğün türüne göre tarifler getir
   */
  abstract getRecipesByMealType(mealType: string, limit?: number): Promise<ApiRecipe[]>;

  /**
   * Malzemelere göre tarif bul
   */
  abstract findRecipesByIngredients(ingredients: string[], limit?: number): Promise<ApiRecipe[]>;
}
