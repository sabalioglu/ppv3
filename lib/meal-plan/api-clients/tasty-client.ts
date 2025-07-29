// lib/meal-plan/api-clients/tasty-client.ts

import { ApiProvider, ApiClientConfig, RecipeApiClient, RecipeSearchParams, ApiRecipe } from './types';

/**
 * Tasty API yanıtından standart ApiRecipe formatına dönüştürme
 */
const transformTastyRecipe = (tastyRecipe: any): ApiRecipe => {
  // Malzemeleri standart formata dönüştür
  const ingredients = (tastyRecipe.sections || []).flatMap((section: any) => {
    return (section.components || []).map((component: any) => {
      // Miktar ve birim bilgilerini ayıkla
      const measurements = component.measurements?.[0] || {};
      return {
        name: component.ingredient?.name || component.raw_text || 'Unknown ingredient',
        amount: measurements.quantity || 1,
        unit: measurements.unit?.name || '',
        category: component.ingredient?.display_plural || 'Ingredients',
      };
    });
  });

  // Talimatları ayıkla
  const instructions = (tastyRecipe.instructions || []).map((instruction: any) => instruction.display_text);

  // Emoji seçimi
  let emoji = '🍽️';
  const recipeName = tastyRecipe.name?.toLowerCase() || '';
  if (recipeName.includes('chicken') || recipeName.includes('poultry')) emoji = '🍗';
  else if (recipeName.includes('soup')) emoji = '🍲';
  else if (recipeName.includes('salad')) emoji = '🥗';
  else if (recipeName.includes('pasta') || recipeName.includes('spaghetti')) emoji = '🍝';
  else if (recipeName.includes('cake') || recipeName.includes('dessert')) emoji = '🍰';
  else if (recipeName.includes('bread') || recipeName.includes('toast')) emoji = '🍞';
  else if (recipeName.includes('breakfast')) emoji = '🍳';

  // Kategoriyi belirle
  const tags = tastyRecipe.tags || [];
  let category = 'dinner'; // Varsayılan
  
  for (const tag of tags) {
    const mealType = tag.display_name?.toLowerCase();
    if (mealType?.includes('breakfast')) {
      category = 'breakfast';
      break;
    } else if (mealType?.includes('lunch')) {
      category = 'lunch';
      break;
    } else if (mealType?.includes('dinner')) {
      category = 'dinner';
      break;
    } else if (mealType?.includes('snack') || mealType?.includes('appetizer') || mealType?.includes('dessert')) {
      category = 'snack';
      break;
    }
  }

  // Zorluk seviyesini belirle
  let difficulty = 'Medium';
  if (tastyRecipe.total_time_minutes) {
    if (tastyRecipe.total_time_minutes <= 20) difficulty = 'Easy';
    else if (tastyRecipe.total_time_minutes > 60) difficulty = 'Hard';
  }

  return {
    id: `tasty_${tastyRecipe.id}`,
    name: tastyRecipe.name,
    ingredients,
    calories: tastyRecipe.nutrition?.calories || 0,
    protein: tastyRecipe.nutrition?.protein || 0,
    carbs: tastyRecipe.nutrition?.carbohydrates || 0,
    fat: tastyRecipe.nutrition?.fat || 0,
    fiber: tastyRecipe.nutrition?.fiber || 0,
    prepTime: tastyRecipe.prep_time_minutes || 15,
    cookTime: tastyRecipe.cook_time_minutes || 25,
    servings: tastyRecipe.num_servings || 4,
    difficulty,
    emoji,
    category,
    tags: tags.map((tag: any) => tag.display_name),
    instructions,
    source: ApiProvider.TASTY,
    sourceUrl: tastyRecipe.original_video_url || tastyRecipe.video_url || '',
    image: tastyRecipe.thumbnail_url,
    rating: tastyRecipe.user_ratings?.score,
    videoUrl: tastyRecipe.video_url,
  };
};

export class TastyApiClient extends RecipeApiClient {
  private lastRequestTime: number = 0;
  private requestInterval: number = 500; // Minimum time between requests in ms

  constructor(config: ApiClientConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://tasty-api1.p.rapidapi.com',
    });
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-RapidAPI-Key': this.config.apiKey,
      'X-RapidAPI-Host': 'tasty-api1.p.rapidapi.com'
    };
  }

  /**
   * Rate-limited API isteği yap
   */
  protected async request(endpoint: string, params: Record<string, string> = {}, options: RequestInit = {}): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.requestInterval - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    return super.request(endpoint, params, options);
  }

  async searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]> {
    try {
      const apiParams: Record<string, string> = {
        q: params.query || '',
        from: String(params.offset || 0),
        size: String(params.number || 10),
      };
      
      const data = await this.request('/recipe/search', apiParams);
      
      if (!data.data || !data.data.results) return [];
      
      return data.data.results.map(transformTastyRecipe);
    } catch (error) {
      console.error('Failed to search recipes on Tasty:', error);
      return [];
    }
  }

  async getRecipeDetails(id: string | number): Promise<ApiRecipe | null> {
    try {
      // Tasty API ID'leri "tasty_123" formatındadır
      let tastyId = String(id);
      if (tastyId.startsWith('tasty_')) {
        tastyId = tastyId.substring(6);
      }
      
      const data = await this.request(`/recipe/${tastyId}`);
      
      if (!data.data) return null;
      
      return transformTastyRecipe(data.data);
    } catch (error) {
      console.error(`Failed to fetch recipe ${id} from Tasty:`, error);
      return null;
    }
  }

  async getTrendingRecipes(limit: number = 10): Promise<ApiRecipe[]> {
    try {
      const data = await this.request('/trending-recipes', {
        size: String(limit),
      });
      
      if (!data.data || !data.data.results) return [];
      
      return data.data.results.map(transformTastyRecipe);
    } catch (error) {
      console.error('Failed to get trending recipes from Tasty:', error);
      return [];
    }
  }

  async getRecipesByMealType(mealType: string, limit: number = 10): Promise<ApiRecipe[]> {
    try {
      // Tasty API meal type'lara göre filtreleme için mealTag kullanır
      const mealTypeToTag: Record<string, string> = {
        'breakfast': 'breakfast',
        'lunch': 'lunch',
        'dinner': 'dinner',
        'snack': 'snacks'
      };
      
      const tag = mealTypeToTag[mealType.toLowerCase()] || mealType;
      
      const data = await this.request('/meals-by-tag', {
        mealTag: tag,
        size: String(limit),
      });
      
      if (!data.data || !data.data.results) return [];
      
      return data.data.results.map(transformTastyRecipe);
    } catch (error) {
      console.error(`Failed to get recipes by meal type ${mealType} from Tasty:`, error);
      return [];
    }
  }

  async findRecipesByIngredients(ingredients: string[], limit: number = 5): Promise<ApiRecipe[]> {
    try {
      // Tasty API'nin doğrudan malzemelere göre tarif bulma fonksiyonu yok
      // Bu nedenle normal arama kullanıp sonra filtreleme yapıyoruz
      if (ingredients.length === 0) return [];
      
      // İlk malzemeyi kullanarak arama yap (en önemli malzeme)
      const searchResults = await this.searchRecipes({
        query: ingredients[0],
        number: limit * 3, // Daha fazla sonuç al ki filtreledikten sonra yeterli tarif kalsın
      });
      
      // Sonuçları diğer malzemelere göre filtrele
      const ingredientsLower = ingredients.map(ing => ing.toLowerCase());
      
      const matchingRecipes = searchResults.filter(recipe => {
        const recipeIngredientsLower = recipe.ingredients.map(ing => ing.name.toLowerCase());
        
        // Tarif malzemelerinin en az birkaçının kullanıcının malzemeleriyle eşleşmesini kontrol et
        let matchCount = 0;
        for (const ing of ingredientsLower) {
          if (recipeIngredientsLower.some(recIng => recIng.includes(ing) || ing.includes(recIng))) {
            matchCount++;
          }
        }
        
        // En az %30 eşleşme oranı olmalı
        const matchPercentage = ingredients.length > 0 ? matchCount / ingredients.length : 0;
        recipe.matchScore = matchPercentage * 100;
        
        return matchPercentage >= 0.3;
      });
      
      // Eşleşme puanına göre sırala ve limiti uygula
      return matchingRecipes
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to find recipes by ingredients on Tasty:', error);
      return [];
    }
  }
}
