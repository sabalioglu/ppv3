// lib/meal-plan/api-clients/themealdb-client.ts

import { ApiProvider, ApiClientConfig, RecipeApiClient, RecipeSearchParams, ApiRecipe } from './types';

/**
 * TheMealDB API yanıtından standart ApiRecipe formatına dönüştürme
 */
const transformMealDbRecipe = (mealDbRecipe: any): ApiRecipe => {
  // TheMealDB'de malzemeler ve ölçüler ayrı alanlar olarak geliyor
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = mealDbRecipe[`strIngredient${i}`];
    const measure = mealDbRecipe[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim() !== '') {
      ingredients.push({
        name: ingredient,
        amount: 1, // TheMealDB kesin miktarları belirtmiyor, sadece metin olarak "1 cup" gibi yazıyor
        unit: measure || '',
        category: 'Unknown', // TheMealDB kategori bilgisi sağlamıyor
      });
    }
  }

  // Emoji seçimi
  const name = mealDbRecipe.strMeal.toLowerCase();
  let emoji = '🍽️';
  if (name.includes('chicken')) emoji = '🍗';
  else if (name.includes('soup')) emoji = '🍲';
  else if (name.includes('salad')) emoji = '🥗';
  else if (name.includes('pasta')) emoji = '🍝';
  else if (name.includes('cake')) emoji = '🍰';
  else if (name.includes('bread')) emoji = '🍞';
  
  // Yemek kategorisini belirle
  let category = 'dinner'; // Varsayılan
  const mealCategory = mealDbRecipe.strCategory?.toLowerCase() || '';
  if (mealCategory.includes('breakfast')) category = 'breakfast';
  else if (mealCategory.includes('dessert') || mealCategory.includes('sweet')) category = 'snack';
  else if (mealCategory.includes('starter') || mealCategory.includes('side') || mealCategory.includes('appetizer')) category = 'snack';
  
  // Talimatları satırlara ayır
  const instructions = mealDbRecipe.strInstructions
    ? mealDbRecipe.strInstructions.split(/\r?\n/).filter((line: string) => line.trim() !== '')
    : [];

  return {
    id: mealDbRecipe.idMeal,
    name: mealDbRecipe.strMeal,
    ingredients,
    calories: 0, // TheMealDB besin değeri bilgisi sağlamıyor
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    prepTime: 15, // TheMealDB hazırlama süresi sağlamıyor, varsayılan değerler kullanıyoruz
    cookTime: 25,
    servings: 4,
    difficulty: 'Medium',
    emoji,
    category,
    tags: [mealDbRecipe.strCategory, mealDbRecipe.strArea].filter(Boolean),
    instructions,
    source: ApiProvider.THEMEALDB,
    sourceUrl: mealDbRecipe.strSource || '',
    image: mealDbRecipe.strMealThumb,
  };
};

export class TheMealDbApiClient extends RecipeApiClient {
  constructor(config: ApiClientConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://www.themealdb.com/api/json/v1/1',
    });
  }

  protected getAuthHeaders(): Record<string, string> {
    // TheMealDB API key'i URL'de kullanılır, başlıklarda değil
    return {};
  }

  async searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]> {
    try {
      // TheMealDB arama için bir endpoint sağlar
      let endpoint = '/search.php';
      let apiParams: Record<string, string> = {};
      
      if (params.query) {
        apiParams.s = params.query; // TheMealDB isim araması
      }
      
      const data = await this.request(endpoint, apiParams);
      if (!data.meals) return [];
      
      return data.meals.map(transformMealDbRecipe);
    } catch (error) {
      console.error('Failed to search recipes on TheMealDB:', error);
      return [];
    }
  }

  async getRecipeDetails(id: string | number): Promise<ApiRecipe | null> {
    try {
      const data = await this.request('/lookup.php', { i: String(id) });
      if (!data.meals || data.meals.length === 0) return null;
      
      return transformMealDbRecipe(data.meals[0]);
    } catch (error) {
      console.error(`Failed to fetch recipe ${id} from TheMealDB:`, error);
      return null;
    }
  }

  async getTrendingRecipes(limit: number = 10): Promise<ApiRecipe[]> {
    try {
      // TheMealDB rastgele tarifleri getirmek için endpoint sağlar
      const data = await this.request('/random.php');
      if (!data.meals || data.meals.length === 0) return [];
      
      // Sadece bir rastgele tarif dönüyor, o yüzden birden çok istek yapmamız gerek
      const recipes: ApiRecipe[] = [];
      recipes.push(transformMealDbRecipe(data.meals[0]));
      
      // İhtiyaç duyulan limit kadar ek tarif getir
      if (limit > 1) {
        // TheMealDB'nin rastgele API'si her seferinde sadece bir tarif döndürür
        // Bu nedenle kategoriye göre tarifler alıp rastgele karıştıracağız
        const categories = ['Seafood', 'Chicken', 'Dessert', 'Pasta', 'Vegetarian'];
        for (const category of categories) {
          if (recipes.length >= limit) break;
          
          const categoryData = await this.request('/filter.php', { c: category });
          if (categoryData.meals) {
            // Tarifleri karıştır ve limit kadar al
            const shuffled = categoryData.meals.sort(() => 0.5 - Math.random());
            const needed = Math.min(shuffled.length, limit - recipes.length);
            
            for (let i = 0; i < needed; i++) {
              const recipeDetails = await this.getRecipeDetails(shuffled[i].idMeal);
              if (recipeDetails) {
                recipes.push(recipeDetails);
              }
            }
          }
        }
      }
      
      return recipes.slice(0, limit);
    } catch (error) {
      console.error('Failed to get trending recipes from TheMealDB:', error);
      return [];
    }
  }

  async getRecipesByMealType(mealType: string, limit: number = 10): Promise<ApiRecipe[]> {
    try {
      // TheMealDB'de meal type doğrudan yok, ama kategoriler var
      // Bizim meal type'ları TheMealDB kategorilerine eşleştiriyoruz
      const mealTypeToCategory: Record<string, string> = {
        'breakfast': 'Breakfast',
        'lunch': 'Miscellaneous', // Tam karşılığı yok
        'dinner': 'Beef', // Tam karşılığı yok, ana yemek kategorilerinden birini seçiyoruz
        'snack': 'Dessert', // Tam karşılığı yok, en yakın kategori
      };
      
      const category = mealTypeToCategory[mealType.toLowerCase()] || mealType;
      const data = await this.request('/filter.php', { c: category });
      
      if (!data.meals) return [];
      
      // Her bir tarifin tam detaylarını almamız gerekiyor
      const recipes: ApiRecipe[] = [];
      const max = Math.min(limit, data.meals.length);
      
      for (let i = 0; i < max; i++) {
        const recipeDetails = await this.getRecipeDetails(data.meals[i].idMeal);
        if (recipeDetails) {
          recipes.push(recipeDetails);
        }
      }
      
      return recipes;
    } catch (error) {
      console.error(`Failed to get recipes by meal type ${mealType} from TheMealDB:`, error);
      return [];
    }
  }

  async findRecipesByIngredients(ingredients: string[], limit: number = 5): Promise<ApiRecipe[]> {
    try {
      // TheMealDB sadece tek bir malzemeye göre filtreleme yapabilir
      // Bu nedenle, her malzeme için ayrı arama yapıp sonuçları birleştiriyoruz
      let allRecipes: ApiRecipe[] = [];
      
      // İlk malzeme için arama yap (en önemli malzeme)
      if (ingredients.length > 0) {
        const data = await this.request('/filter.php', { i: ingredients[0] });
        
        if (data.meals) {
          // Her bir tarifin tam detaylarını almamız gerekiyor
          for (let i = 0; i < Math.min(data.meals.length, limit * 2); i++) {
            const recipeDetails = await this.getRecipeDetails(data.meals[i].idMeal);
            if (recipeDetails) {
              // Bu tarifin diğer malzemelerimizle de eşleşip eşleşmediğini kontrol et
              const ingredientsLower = ingredients.map(ing => ing.toLowerCase());
              const recipeIngredientsLower = recipeDetails.ingredients.map(ing => ing.name.toLowerCase());
              
              // Malzemelerin en az %50'sini içeren tarifleri seç
              let matchCount = 0;
              for (const ing of ingredientsLower) {
                if (recipeIngredientsLower.some(recIng => recIng.includes(ing) || ing.includes(recIng))) {
                  matchCount++;
                }
              }
              
              const matchPercentage = ingredients.length > 0 ? matchCount / ingredients.length : 0;
              
              if (matchPercentage >= 0.5) {
                // Tariflere bir eşleşme puanı ekle
                allRecipes.push({
                  ...recipeDetails,
                  matchScore: matchPercentage * 100
                });
              }
            }
          }
        }
      }
      
      // Eşleşme puanına göre sırala ve limiti uygula
      return allRecipes
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to find recipes by ingredients on TheMealDB:', error);
      return [];
    }
  }
}
