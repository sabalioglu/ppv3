//lib/meal-plan/meal-matching.ts
import { Meal, PantryItem, Ingredient, MatchResult, UserProfile } from './types';
import { MEAL_DATABASE } from './constants';
import { getExpiringItems } from './pantry-analysis';

export const checkQuantitySufficiency = (requiredIngredient: Ingredient, pantryItem: any): boolean => {
  const required = requiredIngredient.amount || 1;
  const available = pantryItem.quantity || 0;
  return available >= required;
};

export const calculatePantryMatch = (mealIngredients: Ingredient[], pantryItems: PantryItem[]): MatchResult => {
  const pantryIngredientNames = pantryItems.map(item => ({
    name: item.name.toLowerCase().trim(),
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiry_date
  }));
  
  let matchCount = 0;
  const missingIngredients: any[] = [];
  const availableIngredients: any[] = [];
  const partialMatches: any[] = [];
  
  mealIngredients.forEach(ingredient => {
    const ingredientName = ingredient.name.toLowerCase().trim();
    
    // Exact match
    let found = pantryIngredientNames.find(pantryItem => 
      pantryItem.name === ingredientName ||
      pantryItem.name.includes(ingredientName) ||
      ingredientName.includes(pantryItem.name)
    );
    
    // Category-based fuzzy matching
    if (!found) {
      found = pantryIngredientNames.find(pantryItem => {
        // Same category matching
        if (pantryItem.category === ingredient.category) {
          return (
            // Protein variations
            (ingredient.category === 'Protein' && 
             ((pantryItem.name.includes('chicken') && ingredientName.includes('chicken')) ||
              (pantryItem.name.includes('beef') && ingredientName.includes('beef')) ||
              (pantryItem.name.includes('fish') && ingredientName.includes('fish')))) ||
            
            // Dairy variations
            (ingredient.category === 'Dairy' && 
             ((pantryItem.name.includes('milk') && ingredientName.includes('milk')) ||
              (pantryItem.name.includes('cheese') && ingredientName.includes('cheese')))) ||
            
            // Vegetable variations
            (ingredient.category === 'Vegetables' && 
             ((pantryItem.name.includes('tomato') && ingredientName.includes('tomato')) ||
              (pantryItem.name.includes('lettuce') && ingredientName.includes('lettuce'))))
          );
        }
        return false;
      });
    }
    
    if (found) {
      matchCount++;
      availableIngredients.push({
        ...ingredient,
        pantryItem: found,
        sufficient: checkQuantitySufficiency(ingredient, found)
      });
    } else {
      missingIngredients.push(ingredient);
    }
  });

  return {
    matchCount,
    totalIngredients: mealIngredients.length,
    matchPercentage: (matchCount / mealIngredients.length) * 100,
    missingIngredients: missingIngredients.map(ing => ing.name),
    availableIngredients: availableIngredients.map(ing => ing.name),
    detailedMatch: {
      available: availableIngredients,
      missing: missingIngredients,
      partial: partialMatches
    }
  };
};

export const findBestMealMatch = (
  mealType: string, 
  pantryItems: PantryItem[], 
  userProfile: UserProfile | null,
  pantryAnalysis?: any
): Meal | null => {
  const meals = MEAL_DATABASE[mealType] || [];
  let bestMeal: Meal | null = null;
  let bestMatchScore = -1;

  meals.forEach(meal => {
    // Check dietary restrictions
    if (userProfile?.dietary_restrictions?.length) {
      const hasRestriction = userProfile.dietary_restrictions.some((restriction: string) =>
        meal.ingredients.some((ingredient: Ingredient) => 
          ingredient.name.toLowerCase().includes(restriction.toLowerCase())
        )
      );
      if (hasRestriction) return;
    }

    const match = calculatePantryMatch(meal.ingredients, pantryItems);
    
    // Enhanced expiring items priority
    const expiringItems = getExpiringItems(pantryItems);
    let expiringBonus = 0;
    let urgencyMultiplier = 1;

    expiringItems.forEach(item => {
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Check if meal uses this expiring item
      const usesExpiringItem = meal.ingredients.some(ing => {
        const ingredientName = ing.name;
        return (
          item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
          ingredientName.toLowerCase().includes(item.name.toLowerCase()) ||
          (item.category === ing.category)
        );
      });
      
      if (usesExpiringItem) {
        // More urgent = higher bonus
        if (daysUntilExpiry <= 1) {
          expiringBonus += 50; // Expires today/tomorrow
          urgencyMultiplier = 2;
        } else if (daysUntilExpiry <= 2) {
          expiringBonus += 35; // Expires in 2 days
          urgencyMultiplier = 1.5;
        } else {
          expiringBonus += 20; // Expires in 3 days
          urgencyMultiplier = 1.2;
        }
      }
    });

    const totalScore = (match.matchPercentage * urgencyMultiplier) + expiringBonus;

    if (totalScore > bestMatchScore) {
      bestMatchScore = totalScore;
      bestMeal = {
        ...meal,
        pantryMatch: match.matchCount,
        totalIngredients: match.totalIngredients,
        missingIngredients: match.missingIngredients,
        matchPercentage: match.matchPercentage,
        allergenSafe: true
      };
    }
  });

  return bestMeal;
};

export const calculateOptimizationScore = (
  breakfast: Meal | null, 
  lunch: Meal | null, 
  dinner: Meal | null, 
  pantryItems: PantryItem[]
): number => {
  const meals = [breakfast, lunch, dinner].filter(Boolean) as Meal[];
  if (meals.length === 0) return 0;

  const avgMatchPercentage = meals.reduce((sum, meal) => 
    sum + (meal.matchPercentage || 0), 0
  ) / meals.length;

  const expiringItems = getExpiringItems(pantryItems);
  const expiringItemsUsed = expiringItems.filter(item =>
    meals.some(meal => 
      meal.ingredients.some((ing: Ingredient) =>
        item.name.toLowerCase().includes(ing.name.toLowerCase())
      )
    )
  ).length;

  const expiringUsageScore = expiringItems.length > 0 
    ? (expiringItemsUsed / expiringItems.length) * 100 
    : 100;

  return Math.round((avgMatchPercentage + expiringUsageScore) / 2);
};
