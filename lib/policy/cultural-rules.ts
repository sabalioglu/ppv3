// ✅ FULL IMPLEMENTATION: Cultural rules for AI meal planning
// Enhanced cultural intelligence for personalized meal recommendations

import { PantryItem, UserProfile } from '../meal-plan/types';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CulturalCuisine = 'turkish' | 'japanese' | 'american' | 'mediterranean' | 'indian' | 'chinese' | 'middle_eastern' | 'european' | 'mexican' | 'italian';

export interface CulturalProfile {
  primaryCuisine: CulturalCuisine;
  region: string;
  religiousRestrictions: any[];
  personalPreferences: string[];
  culturalConstraints?: string[];
}

export interface CulturalValidation {
  isAppropriate: boolean;
  violations: string[];
  score: number;
  suggestions: string[];
  warnings: string[];
}

// ✅ Cultural breakfast patterns by cuisine
export const CULTURAL_BREAKFAST_PATTERNS = {
  turkish: {
    typical: ['Turkish tea', 'white cheese', 'olives', 'bread', 'tomatoes', 'cucumbers', 'honey', 'jam'],
    forbidden: ['bacon', 'sausage', 'ham'],
    preferred: ['fresh bread', 'cheese varieties', 'olive oil', 'herbs', 'yogurt'],
    heavyMealAcceptance: false,
    seafoodAcceptance: false,
    socialContext: 'Turkish breakfast culture'
  },
  japanese: {
    typical: ['rice', 'miso soup', 'grilled fish', 'pickled vegetables', 'natto', 'tamagoyaki'],
    forbidden: ['dairy products', 'heavy meats'],
    preferred: ['rice', 'seaweed', 'fish', 'soy sauce', 'green tea'],
    heavyMealAcceptance: false,
    seafoodAcceptance: true,
    socialContext: 'Traditional Japanese breakfast'
  },
  american: {
    typical: ['eggs', 'bacon', 'toast', 'coffee', 'cereal', 'pancakes', 'oatmeal'],
    forbidden: [],
    preferred: ['eggs', 'bread', 'butter', 'coffee', 'fruit'],
    heavyMealAcceptance: true,
    seafoodAcceptance: false,
    socialContext: 'American breakfast culture'
  },
  mediterranean: {
    typical: ['olive oil', 'tomatoes', 'feta cheese', 'olives', 'bread', 'yogurt', 'honey'],
    forbidden: ['pork products'],
    preferred: ['olive oil', 'fresh vegetables', 'cheese', 'herbs'],
    heavyMealAcceptance: false,
    seafoodAcceptance: false,
    socialContext: 'Mediterranean diet principles'
  },
  indian: {
    typical: ['paratha', 'yogurt', 'chai', 'eggs', 'vegetables', 'lentils'],
    forbidden: ['beef', 'pork'],
    preferred: ['whole wheat', 'spices', 'yogurt', 'vegetables'],
    heavyMealAcceptance: true,
    seafoodAcceptance: false,
    socialContext: 'North Indian breakfast traditions'
  }
};

// ✅ Religious dietary restrictions
export const RELIGIOUS_RESTRICTIONS = {
  halal: {
    forbiddenIngredients: ['pork', 'lard', 'gelatin', 'alcohol', 'non-halal meat'],
    requiredPreparation: ['halal certified', 'proper slaughter method']
  },
  kosher: {
    forbiddenIngredients: ['pork', 'shellfish', 'mixing meat and dairy', 'non-kosher meat'],
    requiredPreparation: ['kosher certified', 'proper slaughter method']
  },
  vegetarian: {
    forbiddenIngredients: ['meat', 'poultry', 'fish', 'gelatin', 'animal rennet'],
    requiredPreparation: ['plant-based only']
  },
  vegan: {
    forbiddenIngredients: ['meat', 'poultry', 'fish', 'dairy', 'eggs', 'honey', 'gelatin'],
    requiredPreparation: ['plant-based only']
  }
};

// ✅ Regional seafood patterns
export const REGIONAL_SEAFOOD_PATTERNS = {
  turkish_coastal: {
    consumption: 'high',
    preferredTypes: ['sea bass', 'anchovies', 'mackerel', 'calamari'],
    cookingMethods: ['grilled', 'stewed', 'fried'],
    culturalContext: 'Turkish Aegean and Mediterranean coasts'
  },
  japanese_coastal: {
    consumption: 'high',
    preferredTypes: ['salmon', 'tuna', 'mackerel', 'sardines'],
    cookingMethods: ['raw', 'grilled', 'steamed'],
    culturalContext: 'Japanese coastal regions'
  }
};

// ✅ Enhanced cultural cuisine detection
export const detectCulturalCuisine = (
  pantryItems: PantryItem[],
  userPreferences: string[] = []
): CulturalCuisine => {
  // First, check user preferences
  if (userPreferences && userPreferences.length > 0) {
    const preferenceMap: Record<string, CulturalCuisine> = {
      'turkish': 'turkish',
      'japanese': 'japanese',
      'american': 'american',
      'mediterranean': 'mediterranean',
      'indian': 'indian',
      'chinese': 'chinese',
      'italian': 'italian',
      'mexican': 'mexican'
    };
    
    for (const pref of userPreferences) {
      const lowerPref = pref.toLowerCase();
      if (preferenceMap[lowerPref]) {
        return preferenceMap[lowerPref];
      }
    }
  }

  // Analyze pantry items for cultural indicators
  const itemNames = pantryItems.map(item => item.name.toLowerCase());
  const culturalIndicators: Record<string, CulturalCuisine> = {
    'turkish': ['yogurt', 'feta', 'olive oil', 'turkish tea', 'sumac', 'mint', 'parsley'],
    'japanese': ['miso', 'tofu', 'seaweed', 'soy sauce', 'rice', 'wasabi'],
    'mediterranean': ['olive oil', 'feta', 'olives', 'oregano', 'basil', 'tomatoes'],
    'indian': ['curry', 'masala', 'garam', 'turmeric', 'basmati', 'naan'],
    'italian': ['pasta', 'tomato', 'basil', 'parmesan', 'olive oil', 'oregano'],
    'mexican': ['tortilla', 'salsa', 'beans', 'avocado', 'lime', 'cilantro']
  };

  for (const [cuisine, indicators] of Object.entries(culturalIndicators)) {
    const matches = indicators.filter(indicator => 
      itemNames.some(name => name.includes(indicator))
    );
    if (matches.length >= 2) {
      return cuisine as CulturalCuisine;
    }
  }

  return 'american'; // Default fallback
};

// ✅ Create cultural profile from user data
export const createCulturalProfile = (
  userProfile: UserProfile | null,
  detectedCuisine: CulturalCuisine = 'american'
): CulturalProfile => {
  return {
    primaryCuisine: detectedCuisine,
    region: userProfile?.region || 'urban',
    religiousRestrictions: userProfile?.dietary_restrictions || [],
    personalPreferences: userProfile?.dietary_preferences || [],
    culturalConstraints: []
  };
};

// ✅ Evaluate cultural constraints
export const evaluateCulturalConstraints = (
  meal: any,
  culturalProfile: CulturalProfile,
  mealType: MealType
): {
  violations: string[];
  score: number;
  suggestions: string[];
} => {
  const violations: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check religious restrictions
  const restrictions = culturalProfile.religiousRestrictions || [];
  for (const restriction of restrictions) {
    const rules = RELIGIOUS_RESTRICTIONS[restriction as keyof typeof RELIGIOUS_RESTRICTIONS];
    if (rules) {
      const ingredients = meal.ingredients?.map((i: any) => i.name?.toLowerCase() || '') || [];
      const forbiddenFound = ingredients.filter((ing: string) => 
        rules.forbiddenIngredients.some(forbidden => ing.includes(forbidden.toLowerCase()))
      );
      
      if (forbiddenFound.length > 0) {
        violations.push(`Violates ${restriction}: ${forbiddenFound.join(', ')}`);
        score -= 30;
      }
    }
  }

  // Check cultural breakfast patterns
  const pattern = CULTURAL_BREAKFAST_PATTERNS[culturalProfile.primaryCuisine as keyof typeof CULTURAL_BREAKFAST_PATTERNS];
  if (pattern && mealType === 'breakfast') {
    const ingredients = meal.ingredients?.map((i: any) => i.name?.toLowerCase() || '') || [];
    const forbiddenIngredients = ingredients.filter((ing: string) =>
      pattern.forbidden.some(forbidden => ing.includes(forbidden.toLowerCase()))
    );
    
    if (forbiddenIngredients.length > 0) {
      violations.push(`Inappropriate for ${culturalProfile.primaryCuisine} breakfast: ${forbiddenIngredients.join(', ')}`);
      score -= 20;
    }

    if (!pattern.seafoodAcceptance && ingredients.some((ing: string) => 
      ing.includes('fish') || ing.includes('salmon') || ing.includes('tuna') || ing.includes('seafood')
    )) {
      violations.push('Seafood not appropriate for this cultural breakfast');
      score -= 15;
    }
  }

  // Generate suggestions for improvement
  if (violations.length > 0) {
    suggestions.push(`Consider ${culturalProfile.primaryCuisine} alternatives`);
    suggestions.push('Review cultural dietary restrictions');
  }

  return {
    violations,
    score: Math.max(0, score),
    suggestions
  };
};

// ✅ Check if ingredients include seafood
export const includesSeafood = (ingredients: {name: string}[]): boolean => {
  const seafoodKeywords = ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'crab', 'lobster', 'seafood', 'mackerel', 'sardines'];
  return ingredients.some(ingredient => 
    seafoodKeywords.some(seafood => ingredient.name.toLowerCase().includes(seafood))
  );
};

// ✅ Legacy compatibility exports
export const identifyPrimaryCuisine = detectCulturalCuisine;
export const breakfastSeafoodMode = () => 'avoid' as const;

// ✅ Enhanced cultural validation
export const evaluateCulturalAppropriateness = (
  meal: any,
  mealType: MealType,
  profile: CulturalProfile
): CulturalValidation => {
  const evaluation = evaluateCulturalConstraints(meal, profile, mealType);
  
  return {
    isAppropriate: evaluation.violations.length === 0,
    violations: evaluation.violations,
    score: evaluation.score,
    suggestions: evaluation.suggestions,
    warnings: evaluation.violations.length > 0 ? ['Cultural constraints detected'] : []
  };
};
