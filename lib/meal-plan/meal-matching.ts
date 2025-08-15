// lib/meal-plan/meal-matching.ts
// Enhanced meal matching algorithms with better ingredient recognition and cultural intelligence
import { Meal, PantryItem, Ingredient, MatchResult, UserProfile } from './types';
import { normalizeIngredientName, INGREDIENT_ALIASES } from './constants';

// Add new type definitions
interface CulturalProfile {
  primaryCuisine?: string;
  secondaryCuisines?: string[];
  religiousRestrictions?: string[];
  regionalPreferences?: string[];
  mealTimingPreferences?: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
  };
  avoidIngredients?: string[];
  preferredSpiceLevel?: 'mild' | 'medium' | 'hot' | 'very-hot';
}

interface ScoreBreakdown {
  cultural: number;
  pantry: number;
  nutrition: number;
  preference: number;
  details: {
    culturalReasons: string[];
    pantryUtilization: number;
    nutritionalValue?: number;
    preferenceMatch?: number;
  };
}

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

// Enhanced matching with cultural intelligence
export const calculateCulturalCompatibility = (
  meal: Meal,
  culturalProfile: CulturalProfile,
  mealType: string
): {
  culturalScore: number;
  compatibilityReasons: string[];
  violations: string[];
} => {
  let culturalScore = 100; // Start with perfect score
  const compatibilityReasons: string[] = [];
  const violations: string[] = [];

  // Cultural appropriateness scoring
  if (culturalProfile.primaryCuisine) {
    if (meal.tags?.includes(culturalProfile.primaryCuisine)) {
      culturalScore += 20;
      compatibilityReasons.push(`Matches primary cuisine preference: ${culturalProfile.primaryCuisine}`);
    }
  }

  if (culturalProfile.secondaryCuisines?.length) {
    const matchesSecondary = culturalProfile.secondaryCuisines.some(cuisine => 
      meal.tags?.includes(cuisine)
    );
    if (matchesSecondary) {
      culturalScore += 10;
      compatibilityReasons.push('Matches secondary cuisine preferences');
    }
  }

  // Religious compliance checking
  if (culturalProfile.religiousRestrictions?.length) {
    culturalProfile.religiousRestrictions.forEach(restriction => {
      const violatesRestriction = checkReligiousViolation(meal, restriction);
      if (violatesRestriction) {
        culturalScore -= 50;
        violations.push(`Violates religious restriction: ${restriction}`);
      }
    });
  }

  // Regional preference alignment
  if (culturalProfile.regionalPreferences?.length) {
    const matchesRegional = culturalProfile.regionalPreferences.some(region => 
      meal.tags?.includes(region)
    );
    if (matchesRegional) {
      culturalScore += 15;
      compatibilityReasons.push('Aligns with regional preferences');
    }
  }

  // Meal timing appropriateness
  if (culturalProfile.mealTimingPreferences?.[mealType as keyof typeof culturalProfile.mealTimingPreferences]) {
    const appropriateMeals = culturalProfile.mealTimingPreferences[mealType as keyof typeof culturalProfile.mealTimingPreferences] || [];
    const isAppropriate = appropriateMeals.some(mealCategory => 
      meal.tags?.includes(mealCategory) || meal.name.toLowerCase().includes(mealCategory.toLowerCase())
    );
    
    if (isAppropriate) {
      culturalScore += 10;
      compatibilityReasons.push(`Appropriate for ${mealType}`);
    } else if (appropriateMeals.length > 0) {
      culturalScore -= 10;
      violations.push(`Not typical for ${mealType} in this culture`);
    }
  }

  // Check avoided ingredients
  if (culturalProfile.avoidIngredients?.length) {
    const hasAvoidedIngredient = meal.ingredients.some(ing => 
      culturalProfile.avoidIngredients!.some(avoided => 
        ing.name.toLowerCase().includes(avoided.toLowerCase())
      )
    );
    if (hasAvoidedIngredient) {
      culturalScore -= 30;
      violations.push('Contains culturally avoided ingredients');
    }
  }

  // Normalize score to 0-100 range
  culturalScore = Math.max(0, Math.min(100, culturalScore));

  return {
    culturalScore,
    compatibilityReasons,
    violations
  };
};

// Helper function for religious restriction checking
const checkReligiousViolation = (meal: Meal, restriction: string): boolean => {
  const restrictionLower = restriction.toLowerCase();
  
  const restrictionMap: { [key: string]: string[] } = {
    'halal': ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer'],
    'kosher': ['pork', 'shellfish', 'shrimp', 'lobster', 'crab'],
    'hindu': ['beef', 'cow'],
    'jain': ['meat', 'chicken', 'fish', 'eggs', 'onion', 'garlic'],
    'buddhist': ['meat', 'chicken', 'fish'] // Some Buddhist traditions
  };

  const prohibitedIngredients = restrictionMap[restrictionLower] || [];
  
  return meal.ingredients.some(ing => 
    prohibitedIngredients.some(prohibited => 
      ing.name.toLowerCase().includes(prohibited)
    )
  );
};

// Build detailed score breakdown
const buildScoreBreakdown = (
  weights: { cultural: number; pantry: number; nutrition: number; preference: number },
  pantryMatch: MatchResult,
  culturalMatch: { culturalScore: number; compatibilityReasons: string[]; violations: string[] },
  nutritionScore: number = 70,
  preferenceScore: number = 70
): ScoreBreakdown => {
  return {
    cultural: culturalMatch.culturalScore * weights.cultural,
    pantry: pantryMatch.matchPercentage * weights.pantry,
    nutrition: nutritionScore * weights.nutrition,
    preference: preferenceScore * weights.preference,
    details: {
      culturalReasons: culturalMatch.compatibilityReasons,
      pantryUtilization: pantryMatch.matchPercentage,
      nutritionalValue: nutritionScore,
      preferenceMatch: preferenceScore
    }
  };
};

// Calculate weighted score
const calculateWeightedScore = (
  weights: { cultural: number; pantry: number; nutrition: number; preference: number },
  pantryMatch: MatchResult,
  culturalMatch: { culturalScore: number; compatibilityReasons: string[]; violations: string[] },
  nutritionScore: number = 70,
  preferenceScore: number = 70
): number => {
  return (
    (culturalMatch.culturalScore * weights.cultural) +
    (pantryMatch.matchPercentage * weights.pantry) +
    (nutritionScore * weights.nutrition) +
    (preferenceScore * weights.preference)
  );
};

export const calculateHybridScore = (
  meal: Meal,
  pantryItems: PantryItem[],
  culturalProfile: CulturalProfile,
  mealType: string,
  userProfile?: UserProfile | null
): {
  totalScore: number;
  pantryScore: number;
  culturalScore: number;
  breakdown: ScoreBreakdown;
} => {
  const pantryMatch = calculatePantryMatch(meal.ingredients, pantryItems);
  const culturalMatch = calculateCulturalCompatibility(meal, culturalProfile, mealType);
  
  // Calculate nutrition score (simplified - can be enhanced)
  const nutritionScore = calculateNutritionScore(meal);
  
  // Calculate preference score based on user profile
  const preferenceScore = calculatePreferenceScore(meal, userProfile);
  
  // Weighted hybrid scoring:
  // 40% cultural compatibility
  // 35% pantry utilization  
  // 15% nutritional fit
  // 10% user preferences
  
  const weights = {
    cultural: 0.40,
    pantry: 0.35,
    nutrition: 0.15,
    preference: 0.10
  };
  
  return {
    totalScore: calculateWeightedScore(weights, pantryMatch, culturalMatch, nutritionScore, preferenceScore),
    pantryScore: pantryMatch.matchPercentage,
    culturalScore: culturalMatch.culturalScore,
    breakdown: buildScoreBreakdown(weights, pantryMatch, culturalMatch, nutritionScore, preferenceScore)
  };
};

// Helper function to calculate nutrition score
const calculateNutritionScore = (meal: Meal): number => {
  let score = 70; // Base score
  
  // Boost for healthy tags
  const healthyTags = ['healthy', 'low-calorie', 'high-protein', 'vegetarian', 'vegan'];
  const hasHealthyTag = meal.tags?.some(tag => healthyTags.includes(tag.toLowerCase()));
  if (hasHealthyTag) score += 20;
  
  // Check for balanced ingredients (simplified)
  const hasProtein = meal.ingredients.some(ing => 
    ['chicken', 'beef', 'fish', 'tofu', 'beans', 'lentils', 'eggs'].some(protein => 
      ing.name.toLowerCase().includes(protein)
    )
  );
  const hasVegetables = meal.ingredients.some(ing => 
    ['vegetable', 'salad', 'tomato', 'carrot', 'spinach', 'broccoli'].some(veg => 
      ing.name.toLowerCase().includes(veg)
    )
  );
  
  if (hasProtein && hasVegetables) score += 10;
  
  return Math.min(100, score);
};

// Helper function to calculate preference score
const calculatePreferenceScore = (meal: Meal, userProfile: UserProfile | null): number => {
  if (!userProfile) return 70; // Default score
  
  let score = 70;
  
  // Check dietary preferences
  if (userProfile.dietary_preferences?.length) {
    const matchesPreference = meal.tags?.some(tag => 
      userProfile.dietary_preferences!.includes(tag)
    );
    if (matchesPreference) score += 30;
  }
  
  return Math.min(100, score);
};

// Updated main scoring function
export const calculateMealScore = (
  meal: Meal, 
  pantryItems: PantryItem[], 
  userProfile: UserProfile | null,
  culturalProfile?: CulturalProfile,
  mealType?: string
): number => {
  // If cultural profile is provided, use hybrid scoring
  if (culturalProfile && mealType) {
    const hybridResult = calculateHybridScore(meal, pantryItems, culturalProfile, mealType, userProfile);
    return hybridResult.totalScore;
  }
  
  // Otherwise, use original scoring logic
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
  if (userProfile?.dietary_preferences?.length) {
    const hasPreferredTag = meal.tags.some(tag => 
      userProfile.dietary_preferences!.includes(tag)
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
  pantryAnalysis?: any,
  culturalProfile?: CulturalProfile
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

    const score = calculateMealScore(meal, pantryItems, userProfile, culturalProfile, mealType);
    
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

export const getMealSuggestions = (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  limit: number = 3,
  culturalProfile?: CulturalProfile
): Meal[] => {
  const meals = MEAL_DATABASE[mealType] || [];
  
  const scoredMeals = meals
    .map(meal => {
      const score = calculateMealScore(meal, pantryItems, userProfile, culturalProfile, mealType);
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

// Helper function to get expiring items (imported from pantry-analysis)
const getExpiringItems = (items: PantryItem[], daysAhead: number = 3): PantryItem[] => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return items.filter(item => {
    if (!item.expiry_date) return false;
    const expiryDate = new Date(item.expiry_date);
    return expiryDate >= today && expiryDate <= futureDate;
  });
};

// Import MEAL_DATABASE from constants
import { MEAL_DATABASE } from './constants';