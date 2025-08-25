// Pantry'deki ürünleri analiz eden utility fonksiyonları

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiration_date?: string;
  nutritional_info?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface UserPreferences {
  dietary_preferences: string[];
  allergies: string[];
  health_goals: string[];
  cuisine_preferences: string[];
  cooking_level: string;
  meal_complexity: string;
}

export interface MealPlanConstraints {
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  meals_per_day: number;
}

export class PantryAnalyzer {
  
  // Pantry'deki ürünleri kategorize et
  static categorizePantryItems(items: PantryItem[]) {
    const categories = {
      proteins: [] as PantryItem[],
      vegetables: [] as PantryItem[],
      fruits: [] as PantryItem[],
      grains: [] as PantryItem[],
      dairy: [] as PantryItem[],
      spices: [] as PantryItem[],
      oils: [] as PantryItem[],
      others: [] as PantryItem[]
    };

    items.forEach(item => {
      const category = this.getFoodCategory(item.name, item.category);
      categories[category].push(item);
    });

    return categories;
  }

  // Ürün adına göre kategori belirle
  private static getFoodCategory(name: string, category: string): keyof typeof categories {
    const nameLower = name.toLowerCase();
    
    // Protein tanıma
    if (nameLower.includes('chicken') || nameLower.includes('beef') || nameLower.includes('fish') || 
        nameLower.includes('tofu') || nameLower.includes('eggs') || nameLower.includes('turkey') ||
        nameLower.includes('salmon') || nameLower.includes('tuna') || nameLower.includes('lentils') ||
        nameLower.includes('beans') || nameLower.includes('quinoa')) {
      return 'proteins';
    }
    
    // Sebze tanıma
    if (nameLower.includes('broccoli') || nameLower.includes('spinach') || nameLower.includes('tomato') ||
        nameLower.includes('carrot') || nameLower.includes('pepper') || nameLower.includes('onion') ||
        nameLower.includes('lettuce') || nameLower.includes('cucumber') || nameLower.includes('potato') ||
        nameLower.includes('garlic') || nameLower.includes('ginger')) {
      return 'vegetables';
    }
    
    // Meyve tanıma
    if (nameLower.includes('apple') || nameLower.includes('banana') || nameLower.includes('orange') ||
        nameLower.includes('berry') || nameLower.includes('grape') || nameLower.includes('mango') ||
        nameLower.includes('avocado') || nameLower.includes('lemon') || nameLower.includes('lime')) {
      return 'fruits';
    }
    
    // Tahıl tanıma
    if (nameLower.includes('rice') || nameLower.includes('pasta') || nameLower.includes('bread') ||
        nameLower.includes('oats') || nameLower.includes('wheat') || nameLower.includes('quinoa') ||
        nameLower.includes('barley') || nameLower.includes('couscous')) {
      return 'grains';
    }
    
    // Süt ürünleri
    if (nameLower.includes('milk') || nameLower.includes('cheese') || nameLower.includes('yogurt') ||
        nameLower.includes('butter') || nameLower.includes('cream')) {
      return 'dairy';
    }
    
    // Baharatlar
    if (nameLower.includes('salt') || nameLower.includes('pepper') || nameLower.includes('spice') ||
        nameLower.includes('herb') || nameLower.includes('oregano') || nameLower.includes('basil')) {
      return 'spices';
    }
    
    // Yağlar
    if (nameLower.includes('oil') || nameLower.includes('olive') || nameLower.includes('coconut')) {
      return 'oils';
    }
    
    return category as keyof typeof categories || 'others';
  }

  // Kullanıcının alerjilerine göre ürünleri filtrele
  static filterByAllergies(items: PantryItem[], allergies: string[]): PantryItem[] {
    const allergyKeywords = {
      'gluten': ['wheat', 'bread', 'pasta', 'barley', 'rye'],
      'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'nuts': ['peanut', 'almond', 'walnut', 'cashew', 'pecan'],
      'eggs': ['egg', 'omelet', 'quiche'],
      'soy': ['tofu', 'soy', 'edamame'],
      'fish': ['fish', 'salmon', 'tuna', 'seafood'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish']
    };

    return items.filter(item => {
      const nameLower = item.name.toLowerCase();
      
      for (const allergy of allergies) {
        const keywords = allergyKeywords[allergy.toLowerCase() as keyof typeof allergyKeywords];
        if (keywords && keywords.some(keyword => nameLower.includes(keyword))) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Diyet tercihlerine göre ürünleri filtrele
  static filterByDietaryPreferences(items: PantryItem[], preferences: string[]): PantryItem[] {
    const dietFilters = {
      'vegetarian': (item: PantryItem) => !this.isMeatProduct(item.name),
      'vegan': (item: PantryItem) => !this.isAnimalProduct(item.name),
      'keto': (item: PantryItem) => this.isKetoFriendly(item.name),
      'paleo': (item: PantryItem) => this.isPaleoFriendly(item.name),
      'low-carb': (item: PantryItem) => this.isLowCarb(item.name)
    };

    let filteredItems = [...items];

    for (const preference of preferences) {
      const filter = dietFilters[preference.toLowerCase() as keyof typeof dietFilters];
      if (filter) {
        filteredItems = filteredItems.filter(filter);
      }
    }

    return filteredItems;
  }

  private static isMeatProduct(name: string): boolean {
    const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'turkey', 'lamb', 'salmon', 'tuna'];
    return meatKeywords.some(keyword => name.toLowerCase().includes(keyword));
  }

  private static isAnimalProduct(name: string): boolean {
    const animalProducts = ['meat', 'chicken', 'beef', 'fish', 'milk', 'cheese', 'yogurt', 'eggs', 'butter'];
    return animalProducts.some(keyword => name.toLowerCase().includes(keyword));
  }

  private static isKetoFriendly(name: string): boolean {
    const highCarb = ['rice', 'bread', 'pasta', 'potato', 'sugar', 'banana', 'apple'];
    return !highCarb.some(carb => name.toLowerCase().includes(carb));
  }

  private static isPaleoFriendly(name: string): boolean {
    const nonPaleo = ['bread', 'pasta', 'rice', 'beans', 'lentils', 'dairy', 'cheese'];
    return !nonPaleo.some(item => name.toLowerCase().includes(item));
  }

  private static isLowCarb(name: string): boolean {
    const highCarb = ['rice', 'pasta', 'bread', 'potato', 'sugar', 'honey'];
    return !highCarb.some(carb => name.toLowerCase().includes(carb));
  }

  // Pantry'den yemek kombinasyonları oluştur
  static generateMealCombinations(
    pantryItems: PantryItem[],
    preferences: UserPreferences,
    constraints: MealPlanConstraints
  ) {
    const availableItems = this.filterByAllergies(
      this.filterByDietaryPreferences(pantryItems, preferences.dietary_preferences),
      preferences.allergies
    );

    const categories = this.categorizePantryItems(availableItems);

    // Temel yemek kombinasyonları
    const mealCombinations = {
      breakfast: this.generateBreakfastCombinations(categories, preferences),
      lunch: this.generateLunchCombinations(categories, preferences),
      dinner: this.generateDinnerCombinations(categories, preferences),
      snacks: this.generateSnackCombinations(categories, preferences)
    };

    return {
      combinations: mealCombinations,
      available_ingredients: categories,
      total_combinations: this.countTotalCombinations(mealCombinations)
    };
  }

  private static generateBreakfastCombinations(categories: any, preferences: UserPreferences) {
    const breakfasts = [];
    
    if (categories.dairy.length > 0 && categories.fruits.length > 0) {
      breakfasts.push({
        name: "Yogurt & Fruit Bowl",
        ingredients: [categories.dairy[0]?.name, categories.fruits[0]?.name],
        calories: 250,
        protein: 15,
        carbs: 30,
        fat: 8
      });
    }

    if (categories.grains.length > 0 && categories.fruits.length > 0) {
      breakfasts.push({
        name: "Oatmeal with Berries",
        ingredients: [categories.grains[0]?.name, categories.fruits[0]?.name],
        calories: 280,
        protein: 8,
        carbs: 45,
        fat: 6
      });
    }

    return breakfasts;
  }

  private static generateLunchCombinations(categories: any, preferences: UserPreferences) {
    const lunches = [];
    
    if (categories.proteins.length > 0 && categories.vegetables.length > 0) {
      lunches.push({
        name: "Grilled Protein with Vegetables",
        ingredients: [categories.proteins[0]?.name, categories.vegetables[0]?.name],
        calories: 400,
        protein: 35,
        carbs: 25,
        fat: 12
      });
    }

    return lunches;
  }

  private static generateDinnerCombinations(categories: any, preferences: UserPreferences) {
    const dinners = [];
    
    if (categories.proteins.length > 0 && categories.grains.length > 0 && categories.vegetables.length > 0) {
      dinners.push({
        name: "Balanced Protein Bowl",
        ingredients: [categories.proteins[0]?.name, categories.grains[0]?.name, categories.vegetables[0]?.name],
        calories: 450,
        protein: 30,
        carbs: 40,
        fat: 15
      });
    }

    return dinners;
  }

  private static generateSnackCombinations(categories: any, preferences: UserPreferences) {
    const snacks = [];
    
    if (categories.fruits.length > 0) {
      snacks.push({
        name: "Fresh Fruit",
        ingredients: [categories.fruits[0]?.name],
        calories: 80,
        protein: 1,
        carbs: 20,
        fat: 0
      });
    }

    return snacks;
  }

  private static countTotalCombinations(mealCombinations: any) {
    return Object.values(mealCombinations).reduce((total, meals: any) => total + meals.length, 0);
  }

  // Stok durumuna göre öneri yap
  static getStockBasedRecommendations(pantryItems: PantryItem[]) {
    const expiringSoon = pantryItems.filter(item => {
      if (!item.expiration_date) return false;
      const expiration = new Date(item.expiration_date);
      const today = new Date();
      const daysDiff = (expiration.getTime() - today.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 3;
    });

    const lowStock = pantryItems.filter(item => item.quantity <= 2);

    return {
      expiring_soon: expiringSoon,
      low_stock: lowStock,
      use_first: [...expiringSoon, ...lowStock]
    };
  }
}