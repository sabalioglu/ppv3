//lib/meal-plan/meal-matching.ts
// Enhanced meal matching algorithms with better ingredient recognition
import { Meal, PantryItem, Ingredient, MatchResult, UserProfile } from './types';
import { MEAL_DATABASE, INGREDIENT_ALIASES } from './constants';
import { getExpiringItems } from './pantry-analysis';

export const normalizeIngredientName = (name: string): string => {
  return name.toLowerCase().trim().replace(/s$/, ''); // Remove plural 's'
};

export const findIngredientMatch = (requiredIngredient: string, pantryItems: PantryItem[]): PantryItem | null => {
  const normalizedRequired = normalizeIngredientName(requiredIngredient);
  
  // Direct match
  let match = pantryItems.find(item => 
    normalizeIngredientName(item.name) === normalizedRequired
  );
  
  if (match) return match;
  
  // Partial match
  match = pantryItems.find(item => {
    const normalizedPantry = normalizeIngredientName(item.name);
    return normalizedPantry.includes(normalizedRequired) || 
           normalizedRequired.includes(normalizedPantry);
  });
  
  if (match) return match;
  
  // Alias match
  const aliases = INGREDIENT_ALIASES[normalizedRequired] || [];
  match = pantryItems.find(item => {
    const normalizedPantry = normalizeIngredientName(item.name);
    return aliases.some(alias => 
      normalizeIngredientName(alias) === normalizedPantry ||
      normalizedPantry.includes(normalizeIngredientName(alias))
    );
  });
  
  return match || null;
};

export const checkQuantitySufficiency = (requiredIngredient: Ingredient, pantryItem: PantryItem): boolean => {
  const required = requiredIngredient.amount || 1;
  const available = pantryItem.quantity || 0;
  
  // Basic quantity check - can be enhanced with unit conversion
  return available >= required * 0.8; // Allow 20% tolerance
};

export const calculatePantryMatch = (mealIngredients: Ingredient[], pantryItems: PantryItem[]): MatchResult => {
  let matchCount = 0;
  const missingIngredients: string[] = [];
  const availableIngredients: string[] = [];
  const partialMatches: any[] = [];
  
  mealIngredients.forEach(ingredient => {
    const pantryMatch = findIngredientMatch(ingredient.name, pantryItems);
    
    if (pantryMatch) {
      const sufficient = checkQuantitySufficiency(ingredient, pantryMatch);
      
      if (sufficient) {
        matchCount++;
        availableIngredients.push(ingredient.name);
      } else {
        partialMatches.push({
          ingredient: ingredient.name,
          pantryItem: pantryMatch.name,
          reason: 'insufficient_quantity'
        });
        missingIngredients.push(ingredient.name);
      }
    } else {
      missingIngredients.push(ingredient.name);
    }
  });

  return {
    matchCount,
    totalIngredients: mealIngredients.length,
    matchPercentage: mealIngredients.length > 0 ? (matchCount / mealIngredients.length) * 100 : 0,
    missingIngredients,
    availableIngredients,
    detailedMatch: {
      available: availableIngredients.map(name => ({ name })),
      missing: missingIngredients.map(name => ({ name })),
      partial: partialMatches
    }
  };
};

export const calculateMealScore = (
  meal: Meal, 
  pantryItems: PantryItem[], 
  userProfile: UserProfile | null
): number => {
  const match = calculatePantryMatch(meal.ingredients, pantryItems);
  let score = match.matchPercentage;
  
  // Expiring ingredients bonus
  const expiringItems = getExpiringItems(pantryItems);
  expiringItems.forEach(item => {
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const usesExpiringItem = meal.ingredients.some(ing => 
      findIngredientMatch(ing.name, [item])
    );
    
    if (usesExpiringItem) {
      if (daysUntilExpiry <= 1) {
        score += 50; // Critical expiry
      } else if (daysUntilExpiry <= 2) {
        score += 30; // Soon expiring
      } else if (daysUntilExpiry <= 3) {
        score += 15; // Expiring soon
      }
    }
  });
  
  // User preference bonus
  if (userProfile?.preferences?.length) {
    const hasPreferredTag = meal.tags.some(tag => 
      userProfile.preferences.includes(tag)
    );
    if (hasPreferredTag) {
      score += 10;
    }
  }
  
  return Math.min(score, 150); // Cap at 150
};

export const findBestMealMatch = (
  mealType: string, 
  pantryItems: PantryItem[], 
  userProfile: UserProfile | null,
  pantryAnalysis?: any
): Meal | null => {
  const meals = MEAL_DATABASE[mealType] || [];
  
  if (meals.length === 0) return null;
  
  let bestMeal: Meal | null = null;
  let bestScore = -1;

  meals.forEach(meal => {
    // Check dietary restrictions
    if (userProfile?.dietary_restrictions?.length) {
      const hasRestriction = userProfile.dietary_restrictions.some((restriction: string) =>
        meal.ingredients.some((ingredient: Ingredient) => {
          const ingredientName = ingredient.name.toLowerCase();
          const restrictionName = restriction.toLowerCase();
          
          // Common dietary restrictions
          if (restrictionName.includes('vegetarian') && 
              ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna'].includes(ingredientName)) {
            return true;
          }
          if (restrictionName.includes('vegan') && 
              ['milk', 'cheese', 'yogurt', 'butter', 'eggs'].includes(ingredientName)) {
            return true;
          }
          if (restrictionName.includes('gluten') && 
              ['bread', 'pasta', 'flour'].includes(ingredientName)) {
            return true;
          }
          
          return ingredientName.includes(restrictionName);
        })
      );
      if (hasRestriction) return;
    }

    const score = calculateMealScore(meal, pantryItems, userProfile);
    
    if (score > bestScore) {
      bestScore = score;
      const match = calculatePantryMatch(meal.ingredients, pantryItems);
      
      bestMeal = {
        ...meal,
        pantryMatch: match.matchCount,
        totalIngredients: match.totalIngredients,
        missingIngredients: match.missingIngredients,
        matchPercentage: match.matchPercentage,
        allergenSafe: true,
        score
      };
    }
  });

  return bestMeal;
};

// This function is now deprecated in favor of calculateAverageMatchScore for clarity.
// export const calculateOptimizationScore = ( ... )

/**
 * Calculates the average pantry match score based on a list of meals.
 * This provides a clear and direct representation of how well the meal plan matches the user's pantry.
 * @param meals - An array of Meal objects.
 * @returns The average match percentage (0-100).
 */
export const calculateAverageMatchScore = (meals: (Meal | null)[]): number => {
  const validMeals = meals.filter(Boolean) as Meal[];
  if (validMeals.length === 0) return 0;

  const totalMatchPercentage = validMeals.reduce((sum, meal) =>
    sum + (meal.matchPercentage || 0), 0
  );

  return Math.round(totalMatchPercentage / validMeals.length);
};

export const getMealSuggestions = (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  limit: number = 3
): Meal[] => {
  const meals = MEAL_DATABASE[mealType] || [];
  
  const scoredMeals = meals
    .map(meal => {
      const score = calculateMealScore(meal, pantryItems, userProfile);
      const match = calculatePantryMatch(meal.ingredients, pantryItems);
      
      return {
        ...meal,
        pantryMatch: match.matchCount,
        totalIngredients: match.totalIngredients,
        missingIngredients: match.missingIngredients,
        matchPercentage: match.matchPercentage,
        score
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return scoredMeals;
};
