// lib/meal-plan/enhanced-diversity.ts
// Akıllı çeşitlilik ve pantry optimizasyon sistemi

import { PantryItem, Meal, UserProfile } from './types';
import { supabase } from '../supabase';

// Meal history interface
interface MealHistory {
  id: string;
  user_id: string;
  meal_name: string;
  ingredients: string[];
  meal_type: string;
  created_at: string;
  cuisine_type?: string;
  cooking_method?: string;
}

// Ingredient usage tracking
interface IngredientUsage {
  name: string;
  lastUsed: Date;
  usageCount: number;
  mealTypes: string[];
  cuisineTypes: string[];
}

// Diversity constraints
interface DiversityConstraints {
  maxSameIngredientDays: number;
  minIngredientVariety: number;
  cuisineRotationDays: number;
  cookingMethodVariety: boolean;
  proteinRotation: boolean;
  vegetableDiversity: boolean;
}

// Smart pantry combination
interface PantryCombo {
  ingredients: PantryItem[];
  score: number;
  cuisineMatch: string;
  cookingMethod: string;
  complexity: 'easy' | 'medium' | 'hard';
  nutritionBalance: number;
  noveltyScore: number;
}

export class EnhancedDiversityManager {
  private userId: string;
  private mealHistory: MealHistory[] = [];
  private ingredientUsage: Map<string, IngredientUsage> = new Map();
  private diversityConstraints: DiversityConstraints;

  constructor(userId: string, constraints?: Partial<DiversityConstraints>) {
    this.userId = userId;
    this.diversityConstraints = {
      maxSameIngredientDays: 2,
      minIngredientVariety: 3,
      cuisineRotationDays: 3,
      cookingMethodVariety: true,
      proteinRotation: true,
      vegetableDiversity: true,
      ...constraints
    };
  }

  // ✅ Load user's meal history for diversity analysis
  async loadMealHistory(days: number = 7): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('meal_history')
        .select('*')
        .eq('user_id', this.userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.mealHistory = data || [];
      this.analyzeIngredientUsage();
    } catch (error) {
      console.error('Error loading meal history:', error);
      // Continue without history - will generate more diverse meals by default
    }
  }

  // ✅ Analyze ingredient usage patterns
  private analyzeIngredientUsage(): void {
    this.ingredientUsage.clear();

    this.mealHistory.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const key = ingredient.toLowerCase();
        const existing = this.ingredientUsage.get(key);
        
        if (existing) {
          existing.usageCount++;
          existing.lastUsed = new Date(meal.created_at);
          if (!existing.mealTypes.includes(meal.meal_type)) {
            existing.mealTypes.push(meal.meal_type);
          }
          if (meal.cuisine_type && !existing.cuisineTypes.includes(meal.cuisine_type)) {
            existing.cuisineTypes.push(meal.cuisine_type);
          }
        } else {
          this.ingredientUsage.set(key, {
            name: ingredient,
            lastUsed: new Date(meal.created_at),
            usageCount: 1,
            mealTypes: [meal.meal_type],
            cuisineTypes: meal.cuisine_type ? [meal.cuisine_type] : []
          });
        }
      });
    });
  }

  // ✅ Get diversity-filtered pantry items
  getFilteredPantryItems(
    pantryItems: PantryItem[], 
    mealType: string,
    targetCuisine?: string
  ): PantryItem[] {
    const now = new Date();
    const maxDaysAgo = this.diversityConstraints.maxSameIngredientDays * 24 * 60 * 60 * 1000;

    return pantryItems.filter(item => {
      const usage = this.ingredientUsage.get(item.name.toLowerCase());
      
      if (!usage) return true; // Never used, always include
      
      // Check if used too recently
      const daysSinceLastUse = (now.getTime() - usage.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceLastUse < this.diversityConstraints.maxSameIngredientDays) {
        // Only exclude if used frequently in same meal type
        if (usage.mealTypes.includes(mealType) && usage.usageCount > 2) {
          return false;
        }
      }
      
      return true;
    });
  }

  // ✅ Generate smart pantry combinations
  async generateSmartCombinations(
    pantryItems: PantryItem[],
    mealType: string,
    userProfile?: UserProfile | null,
    targetCount: number = 5
  ): Promise<PantryCombo[]> {
    await this.loadMealHistory();
    
    const filteredItems = this.getFilteredPantryItems(pantryItems, mealType);
    const combinations: PantryCombo[] = [];
    
    // Categorize ingredients
    const proteins = this.categorizeIngredients(filteredItems, 'protein');
    const vegetables = this.categorizeIngredients(filteredItems, 'vegetable');
    const grains = this.categorizeIngredients(filteredItems, 'grain');
    const spices = this.categorizeIngredients(filteredItems, 'spice');
    const dairy = this.categorizeIngredients(filteredItems, 'dairy');
    
    // Generate diverse combinations
    for (let i = 0; i < targetCount * 2; i++) {
      const combo = this.createBalancedCombo(
        proteins, vegetables, grains, spices, dairy, mealType, userProfile
      );
      
      if (combo && combo.ingredients.length >= this.diversityConstraints.minIngredientVariety) {
        combinations.push(combo);
      }
    }
    
    // Sort by combined score (diversity + nutrition + novelty)
    return combinations
      .sort((a, b) => this.calculateComboScore(b) - this.calculateComboScore(a))
      .slice(0, targetCount);
  }

  // ✅ Categorize ingredients by type
  private categorizeIngredients(items: PantryItem[], category: string): PantryItem[] {
    const categories = {
      protein: ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs', 'tofu', 'beans', 'lentils', 'turkey', 'pork', 'lamb', 'cheese'],
      vegetable: ['tomato', 'onion', 'pepper', 'broccoli', 'spinach', 'carrot', 'potato', 'zucchini', 'mushroom', 'lettuce', 'cucumber', 'corn'],
      grain: ['rice', 'pasta', 'bread', 'quinoa', 'oats', 'barley', 'flour', 'noodles'],
      spice: ['salt', 'pepper', 'garlic', 'ginger', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'rosemary'],
      dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt'],
      fruit: ['apple', 'banana', 'orange', 'berry', 'lemon', 'lime', 'avocado'],
      oil: ['olive oil', 'vegetable oil', 'coconut oil', 'sesame oil']
    };

    const keywords = categories[category as keyof typeof categories] || [];
    
    return items.filter(item => 
      keywords.some(keyword => 
        item.name.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword)
      )
    );
  }

  // ✅ Create balanced ingredient combination
  private createBalancedCombo(
    proteins: PantryItem[],
    vegetables: PantryItem[],
    grains: PantryItem[],
    spices: PantryItem[],
    dairy: PantryItem[],
    mealType: string,
    userProfile?: UserProfile | null
  ): PantryCombo | null {
    const combo: PantryItem[] = [];
    
    // Select protein (favor rotation)
    if (proteins.length > 0) {
      const protein = this.selectWithRotation(proteins, 'protein');
      if (protein) combo.push(protein);
    }
    
    // Select vegetables (ensure variety)
    const selectedVegetables = this.selectMultipleWithVariety(vegetables, 2);
    combo.push(...selectedVegetables);
    
    // Select grain/carb
    if (grains.length > 0) {
      const grain = this.selectWithRotation(grains, 'grain');
      if (grain) combo.push(grain);
    }
    
    // Add dairy if appropriate
    if (dairy.length > 0 && Math.random() > 0.5) {
      const dairyItem = this.selectWithRotation(dairy, 'dairy');
      if (dairyItem) combo.push(dairyItem);
    }
    
    // Add spices for flavor
    const selectedSpices = this.selectMultipleWithVariety(spices, 2);
    combo.push(...selectedSpices);
    
    if (combo.length < 3) return null;
    
    return {
      ingredients: combo,
      score: 0, // Will be calculated
      cuisineMatch: this.detectCuisineFromIngredients(combo),
      cookingMethod: this.suggestCookingMethod(combo, mealType),
      complexity: this.determineComplexity(combo),
      nutritionBalance: this.calculateNutritionBalance(combo),
      noveltyScore: this.calculateNoveltyScore(combo)
    };
  }

  // ✅ Select ingredient with rotation preference
  private selectWithRotation<T extends PantryItem>(items: T[], category: string): T | null {
    if (items.length === 0) return null;
    
    // Sort by usage frequency and recency (prefer less used, older usage)
    const sortedItems = items.sort((a, b) => {
      const usageA = this.ingredientUsage.get(a.name.toLowerCase());
      const usageB = this.ingredientUsage.get(b.name.toLowerCase());
      
      if (!usageA && !usageB) return Math.random() - 0.5; // Random for unused items
      if (!usageA) return -1; // Prefer unused
      if (!usageB) return 1;
      
      // Prefer less used and older usage
      const scoreA = usageA.usageCount + (Date.now() - usageA.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
      const scoreB = usageB.usageCount + (Date.now() - usageB.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
      
      return scoreA - scoreB;
    });
    
    return sortedItems[0];
  }

  // ✅ Select multiple items with variety
  private selectMultipleWithVariety<T extends PantryItem>(items: T[], count: number): T[] {
    const selected: T[] = [];
    const available = [...items];
    
    for (let i = 0; i < count && available.length > 0; i++) {
      const item = this.selectWithRotation(available, 'variety');
      if (item) {
        selected.push(item);
        // Remove similar items to ensure variety
        const itemName = item.name.toLowerCase();
        available.splice(available.findIndex(a => a.name.toLowerCase() === itemName), 1);
      }
    }
    
    return selected;
  }

  // ✅ Detect cuisine from ingredients
  private detectCuisineFromIngredients(ingredients: PantryItem[]): string {
    const ingredientNames = ingredients.map(i => i.name.toLowerCase()).join(' ');
    
    if (ingredientNames.includes('soy sauce') || ingredientNames.includes('ginger') || ingredientNames.includes('sesame')) {
      return 'Asian';
    }
    if (ingredientNames.includes('tomato') && ingredientNames.includes('basil') || ingredientNames.includes('pasta')) {
      return 'Italian';
    }
    if (ingredientNames.includes('cumin') || ingredientNames.includes('paprika') || ingredientNames.includes('chili')) {
      return 'Mexican';
    }
    if (ingredientNames.includes('curry') || ingredientNames.includes('turmeric') || ingredientNames.includes('cardamom')) {
      return 'Indian';
    }
    if (ingredientNames.includes('olive') || ingredientNames.includes('feta') || ingredientNames.includes('oregano')) {
      return 'Mediterranean';
    }
    
    return 'International';
  }

  // ✅ Suggest cooking method
  private suggestCookingMethod(ingredients: PantryItem[], mealType: string): string {
    const hasProtein = ingredients.some(i => this.categorizeIngredients([i], 'protein').length > 0);
    const hasVegetables = ingredients.some(i => this.categorizeIngredients([i], 'vegetable').length > 0);
    
    if (mealType === 'breakfast') {
      return hasProtein ? 'pan-fried' : 'mixed';
    }
    
    const methods = ['stir-fry', 'roasted', 'grilled', 'sautéed', 'braised'];
    
    // Select method based on ingredients and avoid recent methods
    const recentMethods = this.mealHistory
      .slice(0, 3)
      .map(m => m.cooking_method)
      .filter(Boolean);
    
    const availableMethods = methods.filter(m => !recentMethods.includes(m));
    
    return availableMethods.length > 0 
      ? availableMethods[Math.floor(Math.random() * availableMethods.length)]
      : methods[Math.floor(Math.random() * methods.length)];
  }

  // ✅ Determine recipe complexity
  private determineComplexity(ingredients: PantryItem[]): 'easy' | 'medium' | 'hard' {
    if (ingredients.length <= 4) return 'easy';
    if (ingredients.length <= 7) return 'medium';
    return 'hard';
  }

  // ✅ Calculate nutrition balance score
  private calculateNutritionBalance(ingredients: PantryItem[]): number {
    const hasProtein = ingredients.some(i => this.categorizeIngredients([i], 'protein').length > 0);
    const hasVegetables = ingredients.some(i => this.categorizeIngredients([i], 'vegetable').length > 0);
    const hasGrains = ingredients.some(i => this.categorizeIngredients([i], 'grain').length > 0);
    
    let score = 0;
    if (hasProtein) score += 40;
    if (hasVegetables) score += 35;
    if (hasGrains) score += 25;
    
    return score;
  }

  // ✅ Calculate novelty score (how different from recent meals)
  private calculateNoveltyScore(ingredients: PantryItem[]): number {
    const ingredientNames = ingredients.map(i => i.name.toLowerCase());
    const recentIngredients = this.mealHistory
      .slice(0, 5)
      .flatMap(m => m.ingredients.map(i => i.toLowerCase()));
    
    const uniqueCount = ingredientNames.filter(name => !recentIngredients.includes(name)).length;
    
    return Math.round((uniqueCount / ingredientNames.length) * 100);
  }

  // ✅ Calculate overall combo score
  private calculateComboScore(combo: PantryCombo): number {
    return (
      combo.nutritionBalance * 0.4 +
      combo.noveltyScore * 0.3 +
      combo.ingredients.length * 5 * 0.2 +
      (combo.complexity === 'medium' ? 20 : combo.complexity === 'easy' ? 15 : 10) * 0.1
    );
  }

  // ✅ Save meal to history
  async saveMealToHistory(meal: Meal): Promise<void> {
    try {
      const historyEntry: Omit<MealHistory, 'id'> = {
        user_id: this.userId,
        meal_name: meal.name,
        ingredients: meal.ingredients.map(i => i.name),
        meal_type: meal.category || 'unknown',
        created_at: new Date().toISOString(),
        cuisine_type: meal.tags?.find(tag => 
          ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean'].includes(tag)
        ),
        cooking_method: this.extractCookingMethod(meal.instructions)
      };

      const { error } = await supabase
        .from('meal_history')
        .insert([historyEntry]);

      if (error) throw error;
      
      console.log('✅ Meal saved to history for diversity tracking');
    } catch (error) {
      console.error('Error saving meal to history:', error);
      // Non-critical error, continue
    }
  }

  // ✅ Extract cooking method from instructions
  private extractCookingMethod(instructions: string[]): string {
    const text = instructions.join(' ').toLowerCase();
    
    if (text.includes('stir fry') || text.includes('stir-fry')) return 'stir-fry';
    if (text.includes('roast') || text.includes('bake')) return 'roasted';
    if (text.includes('grill')) return 'grilled';
    if (text.includes('sauté') || text.includes('pan fry')) return 'sautéed';
    if (text.includes('braise') || text.includes('simmer')) return 'braised';
    if (text.includes('steam')) return 'steamed';
    
    return 'mixed';
  }

  // ✅ Get diversity recommendations
  getDiversityRecommendations(): {
    avoidIngredients: string[];
    suggestCuisines: string[];
    suggestCookingMethods: string[];
    varietyTips: string[];
  } {
    const recentIngredients = Array.from(this.ingredientUsage.entries())
      .filter(([_, usage]) => usage.usageCount > 2)
      .map(([name, _]) => name);

    const recentCuisines = this.mealHistory
      .slice(0, 5)
      .map(m => m.cuisine_type)
      .filter(Boolean) as string[];

    const recentMethods = this.mealHistory
      .slice(0, 5)
      .map(m => m.cooking_method)
      .filter(Boolean) as string[];

    const allCuisines = ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'American'];
    const allMethods = ['stir-fry', 'roasted', 'grilled', 'sautéed', 'braised', 'steamed'];

    return {
      avoidIngredients: recentIngredients,
      suggestCuisines: allCuisines.filter(c => !recentCuisines.includes(c)),
      suggestCookingMethods: allMethods.filter(m => !recentMethods.includes(m)),
      varietyTips: [
        'Try a new protein source this week',
        'Experiment with a different cooking method',
        'Add colorful vegetables for nutrition variety',
        'Use herbs and spices from different cuisines'
      ]
    };
  }
}

// ✅ Utility function to create diversity manager
export const createDiversityManager = (
  userId: string, 
  constraints?: Partial<DiversityConstraints>
) => new EnhancedDiversityManager(userId, constraints);

// ✅ Quick diversity check for existing meal
export const checkMealDiversity = async (
  meal: Meal,
  userId: string,
  historyDays: number = 7
): Promise<{
  diversityScore: number;
  issues: string[];
  suggestions: string[];
}> => {
  const manager = new EnhancedDiversityManager(userId);
  await manager.loadMealHistory(historyDays);
  
  const recommendations = manager.getDiversityRecommendations();
  
  const mealIngredients = meal.ingredients.map(i => i.name.toLowerCase());
  const overusedIngredients = mealIngredients.filter(ingredient => 
    recommendations.avoidIngredients.includes(ingredient)
  );
  
  const diversityScore = Math.max(0, 100 - (overusedIngredients.length * 25));
  
  return {
    diversityScore,
    issues: overusedIngredients.length > 0 
      ? [`Recently overused ingredients: ${overusedIngredients.join(', ')}`]
      : [],
    suggestions: overusedIngredients.length > 0 
      ? ['Try different protein sources', 'Explore new vegetables', 'Change cooking method']
      : ['Great variety! Keep exploring new combinations']
  };
};