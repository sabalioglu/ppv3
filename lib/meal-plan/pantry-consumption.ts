// lib/meal-plan/pantry-consumption.ts
// Automatic pantry consumption system for meal plan integration
import { supabase } from '../supabase';
import { PantryItem, Meal, Ingredient } from './types';

export interface ConsumptionRecord {
  pantryItemId: string;
  recipeId: string;
  consumedQuantity: number;
  consumedUnit: string;
  consumptionDate: Date;
  userId: string;
}

export interface PantryMatch {
  pantryItem: PantryItem;
  ingredient: Ingredient;
  matchConfidence: number;
  consumptionAmount: number;
}

// Find best pantry match for an ingredient
export const findBestPantryMatch = (
  ingredient: Ingredient, 
  pantryItems: PantryItem[]
): PantryItem | null => {
  const ingredientName = normalizeIngredientName(ingredient.name);
  
  // Direct name match
  let bestMatch = pantryItems.find(item => 
    normalizeIngredientName(item.name) === ingredientName
  );
  
  if (bestMatch) return bestMatch;
  
  // Partial name match
  bestMatch = pantryItems.find(item => {
    const itemName = normalizeIngredientName(item.name);
    return itemName.includes(ingredientName) || ingredientName.includes(itemName);
  });
  
  if (bestMatch) return bestMatch;
  
  // Category-based intelligent matching
  const aliases = INGREDIENT_ALIASES[ingredientName] || [];
  bestMatch = pantryItems.find(item => {
    const normalizedPantry = normalizeIngredientName(item.name);
    return aliases.some(alias => 
      normalizeIngredientName(alias) === normalizedPantry ||
      normalizedPantry.includes(normalizeIngredientName(alias))
    );
  });
  
  return bestMatch || null;
};

// Calculate consumption amount based on recipe requirement
export const calculateConsumption = (
  ingredient: Ingredient, 
  pantryItem: PantryItem
): number => {
  const requiredAmount = ingredient.amount || 1;
  const availableAmount = pantryItem.quantity || 0;
  
  // Unit conversion logic (basic)
  const unitConversions = {
    'cup': { 'ml': 240, 'l': 0.24 },
    'tbsp': { 'ml': 15 },
    'tsp': { 'ml': 5 },
    'piece': { 'pcs': 1, 'unit': 1 },
    'g': { 'kg': 0.001 },
    'kg': { 'g': 1000 }
  };
  
  // If units match, use direct amount
  if (ingredient.unit === pantryItem.unit) {
    return Math.min(requiredAmount, availableAmount);
  }
  
  // Try unit conversion
  const conversion = unitConversions[ingredient.unit as keyof typeof unitConversions];
  if (conversion && pantryItem.unit && conversion[pantryItem.unit as keyof typeof conversion]) {
    const convertedAmount = requiredAmount * conversion[pantryItem.unit as keyof typeof conversion];
    return Math.min(convertedAmount, availableAmount);
  }
  
  // Default: consume 1 unit if available
  return Math.min(1, availableAmount);
};

// Main function to consume pantry ingredients
export const consumePantryIngredients = async (
  meal: Meal,
  pantryItems: PantryItem[],
  userId: string
): Promise<ConsumptionRecord[]> => {
  const consumptionRecords: ConsumptionRecord[] = [];
  
  console.log('🥫 Starting pantry consumption for meal:', meal.name);
  
  try {
    for (const ingredient of meal.ingredients) {
      const matchingPantryItem = findBestPantryMatch(ingredient, pantryItems);
      
      if (matchingPantryItem) {
        const consumedAmount = calculateConsumption(ingredient, matchingPantryItem);
        
        if (consumedAmount > 0) {
          // Update pantry quantity
          const success = await updatePantryQuantity(matchingPantryItem.id, consumedAmount);
          
          if (success) {
            // Record consumption
            consumptionRecords.push({
              pantryItemId: matchingPantryItem.id,
              recipeId: meal.id,
              consumedQuantity: consumedAmount,
              consumedUnit: ingredient.unit,
              consumptionDate: new Date(),
              userId: userId
            });
            
            console.log(`✅ Consumed ${consumedAmount} ${ingredient.unit} of ${matchingPantryItem.name}`);
          }
        }
      } else {
        console.log(`⚠️ No pantry match found for ${ingredient.name}`);
      }
    }
    
    console.log(`🎉 Pantry consumption completed: ${consumptionRecords.length} items updated`);
    return consumptionRecords;
    
  } catch (error) {
    console.error('❌ Error during pantry consumption:', error);
    return consumptionRecords;
  }
};

// Update pantry quantity with safety checks
const updatePantryQuantity = async (itemId: string, consumedAmount: number): Promise<boolean> => {
  try {
    // First check current quantity
    const { data: currentItem, error: fetchError } = await supabase
      .from('pantry_items')
      .select('quantity, name')
      .eq('id', itemId)
      .single();
    
    if (fetchError || !currentItem) {
      console.error('Failed to fetch current pantry item:', fetchError);
      return false;
    }
    
    const newQuantity = Math.max(0, currentItem.quantity - consumedAmount);
    
    // Update with new quantity
    const { error: updateError } = await supabase
      .from('pantry_items')
      .update({ 
        quantity: newQuantity,
        last_used_date: new Date().toISOString(),
        times_used: supabase.sql`times_used + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);
    
    if (updateError) {
      console.error('Failed to update pantry quantity:', updateError);
      return false;
    }
    
    console.log(`📦 Updated ${currentItem.name}: ${currentItem.quantity} → ${newQuantity}`);
    return true;
    
  } catch (error) {
    console.error('Error in updatePantryQuantity:', error);
    return false;
  }
};

// Get consumption history for analytics
export const getConsumptionHistory = async (
  userId: string, 
  days: number = 30
): Promise<ConsumptionRecord[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // This would require a consumption_records table in the future
    // For now, we can track through pantry item usage
    const { data: recentUsage, error } = await supabase
      .from('pantry_items')
      .select('id, name, last_used_date, times_used')
      .eq('user_id', userId)
      .gte('last_used_date', startDate.toISOString())
      .order('last_used_date', { ascending: false });
    
    if (error) throw error;
    
    // Convert to consumption records format
    return (recentUsage || []).map(item => ({
      pantryItemId: item.id,
      recipeId: 'unknown', // Would need proper tracking table
      consumedQuantity: 1, // Estimated
      consumedUnit: 'serving',
      consumptionDate: new Date(item.last_used_date || new Date()),
      userId: userId
    }));
    
  } catch (error) {
    console.error('Error fetching consumption history:', error);
    return [];
  }
};

// Predict pantry depletion
export const predictPantryDepletion = (
  pantryItems: PantryItem[],
  consumptionHistory: ConsumptionRecord[]
): Array<{
  item: PantryItem;
  estimatedDaysLeft: number;
  recommendedAction: string;
}> => {
  return pantryItems.map(item => {
    const recentConsumption = consumptionHistory.filter(
      record => record.pantryItemId === item.id
    );
    
    if (recentConsumption.length === 0) {
      return {
        item,
        estimatedDaysLeft: 999, // No consumption pattern
        recommendedAction: 'Monitor usage'
      };
    }
    
    // Calculate average daily consumption
    const totalConsumed = recentConsumption.reduce(
      (sum, record) => sum + record.consumedQuantity, 0
    );
    const daysTracked = Math.max(1, recentConsumption.length);
    const dailyConsumption = totalConsumed / daysTracked;
    
    const estimatedDaysLeft = dailyConsumption > 0 
      ? Math.floor(item.quantity / dailyConsumption)
      : 999;
    
    let recommendedAction = 'Continue monitoring';
    if (estimatedDaysLeft <= 3) {
      recommendedAction = 'Add to shopping list urgently';
    } else if (estimatedDaysLeft <= 7) {
      recommendedAction = 'Add to shopping list soon';
    }
    
    return {
      item,
      estimatedDaysLeft,
      recommendedAction
    };
  }).sort((a, b) => a.estimatedDaysLeft - b.estimatedDaysLeft);
};