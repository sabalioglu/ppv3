import { supabase } from '../supabase';
import { UserProfile } from '../types';

export interface PantryItem {
  id: string;
  user_id: string;
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
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface PantryAnalysis {
  totalItems: number;
  categories: { [key: string]: number };
  expiringSoon: PantryItem[];
  nutritionalSummary: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
  availableIngredients: string[];
  proteinSources: PantryItem[];
  carbSources: PantryItem[];
  vegetableOptions: PantryItem[];
  healthyFats: PantryItem[];
}

export class PantryService {
  static async getUserPantry(userId: string): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pantry:', error);
      return [];
    }
  }

  static async analyzePantry(userId: string): Promise<PantryAnalysis | null> {
    try {
      const pantryItems = await this.getUserPantry(userId);
      
      if (pantryItems.length === 0) return null;

      const analysis: PantryAnalysis = {
        totalItems: pantryItems.length,
        categories: {},
        expiringSoon: [],
        nutritionalSummary: { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
        availableIngredients: [],
        proteinSources: [],
        carbSources: [],
        vegetableOptions: [],
        healthyFats: []
      };

      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      pantryItems.forEach(item => {
        // Kategorilere göre analiz
        if (!analysis.categories[item.category]) {
          analysis.categories[item.category] = 0;
        }
        analysis.categories[item.category]++;

        // Son kullanma tarihi kontrolü
        if (item.expiration_date) {
          const expDate = new Date(item.expiration_date);
          if (expDate <= threeDaysLater) {
            analysis.expiringSoon.push(item);
          }
        }

        // Besin değerleri toplama
        if (item.nutritional_info) {
          analysis.nutritionalSummary.totalCalories += item.nutritional_info.calories || 0;
          analysis.nutritionalSummary.totalProtein += item.nutritional_info.protein || 0;
          analysis.nutritionalSummary.totalCarbs += item.nutritional_info.carbs || 0;
          analysis.nutritionalSummary.totalFat += item.nutritional_info.fat || 0;
        }

        // Kullanılabilir malzemeler
        analysis.availableIngredients.push(item.name.toLowerCase());

        // Kategoriye göre ayrıştırma
        const category = item.category.toLowerCase();
        const name = item.name.toLowerCase();

        if (category.includes('protein') || 
            name.includes('chicken') || name.includes('beef') || name.includes('fish') || 
            name.includes('egg') || name.includes('tofu') || name.includes('lentil') ||
            name.includes('beans') || name.includes('yogurt') || name.includes('cheese')) {
          analysis.proteinSources.push(item);
        }

        if (category.includes('grain') || category.includes('carb') ||
            name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
            name.includes('quinoa') || name.includes('oats') || name.includes('potato')) {
          analysis.carbSources.push(item);
        }

        if (category.includes('vegetable') || category.includes('produce') ||
            name.includes('spinach') || name.includes('tomato') || name.includes('broccoli') ||
            name.includes('carrot') || name.includes('lettuce') || name.includes('pepper')) {
          analysis.vegetableOptions.push(item);
        }

        if (category.includes('fat') || category.includes('oil') ||
            name.includes('avocado') || name.includes('olive') || name.includes('nuts') ||
            name.includes('seeds') || name.includes('butter')) {
          analysis.healthyFats.push(item);
        }
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing pantry:', error);
      return null;
    }
  }

  static async getPantryByCategory(userId: string, category: string): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pantry by category:', error);
      return [];
    }
  }

  static async getExpiringItems(userId: string, days: number = 3): Promise<PantryItem[]> {
    try {
      const today = new Date();
      const expiryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .lte('expiration_date', expiryDate.toISOString().split('T')[0])
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expiring items:', error);
      return [];
    }
  }

  static async getRandomPantryItems(userId: string, limit: number = 5): Promise<PantryItem[]> {
    try {
      const pantryItems = await this.getUserPantry(userId);
      
      // Shuffle array and take first 'limit' items
      const shuffled = [...pantryItems].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Error getting random pantry items:', error);
      return [];
    }
  }
}