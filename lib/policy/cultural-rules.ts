// lib/policy/cultural-rules.ts
// Complete cultural intelligence system with 8-cuisine support

// ============================================
// TYPE DEFINITIONS
// ============================================

export type BreakfastSeafoodMode = 'allow' | 'avoid' | 'contextual';
export type CulturalCuisine = 'turkish' | 'japanese' | 'american' | 'mediterranean' | 'indian' | 'chinese' | 'middle_eastern' | 'european';

export type CulturalProfile = {
  primaryCuisine: CulturalCuisine;
  region: 'coastal' | 'inland' | 'mixed';
  religiousRestrictions: ReligiousRestriction[];
  culturalPreferences: CulturalPreference[];
};

export type ReligiousRestriction = {
  type: 'halal' | 'kosher' | 'hindu' | 'jain' | 'buddhist';
  strictness: 'strict' | 'moderate' | 'flexible';
  forbiddenIngredients: string[];
  requiredPreparation?: string[];
};

export type CulturalPreference = {
  type: 'flavor' | 'texture' | 'temperature' | 'presentation';
  preference: string;
  importance: 'high' | 'medium' | 'low';
};

// ============================================
// LEGACY SUPPORT (Keep existing functionality)
// ============================================

const BASE_ALLOW = new Set<string>([
  'japanese', 'korean', 'chinese', 'vietnamese', 'thai', 'russian'
]);

export function breakfastSeafoodAllowList(cuisines: string[]) {
  return (cuisines || []).filter(c => BASE_ALLOW.has(c));
}

export function breakfastSeafoodMode(
  cuisines: string[] = [],
  dietRules: string[] = [],
  envDefault = String(process.env.EXPO_PUBLIC_BREAKFAST_SEAFOOD_DEFAULT || 'contextual')
): BreakfastSeafoodMode {
  const env = envDefault.toLowerCase();
  if (dietRules?.some(r => r.toLowerCase() === 'vegan' || r.toLowerCase() === 'vegetarian')) return 'avoid';
  if (env === 'allow' || env === 'avoid') return env as BreakfastSeafoodMode;
  return breakfastSeafoodAllowList(cuisines).length ? 'contextual' : 'avoid';
}

export function breakfastSeafoodAllowedForCuisine(
  primaryCuisine: string,
  mode: BreakfastSeafoodMode,
  cuisines: string[] = [],
  dietRules: string[] = []
) {
  if (dietRules?.some(r => r.toLowerCase() === 'vegan' || r.toLowerCase() === 'vegetarian')) return false;
  if (mode === 'allow') return true;
  if (mode === 'avoid') return false;
  return breakfastSeafoodAllowList(cuisines).includes(primaryCuisine);
}

export function includesSeafood(ingredients: any[] = []) {
  const rx = /(salmon|tuna|fish|cod|anchovy|mackerel|sardine|trout|prawn|shrimp|crab|lobster|oyster|clam|mussel|scallop|squid|octopus|caviar|roe)/i;
  return ingredients.some((i: any) => rx.test(String(i?.name || '')));
}

// ============================================
// CULTURAL BREAKFAST PATTERNS
// ============================================

export const CULTURAL_BREAKFAST_PATTERNS: Record<CulturalCuisine, {
  typical: string[];
  forbidden: string[];
  preferred: string[];
  timing: string;
  socialContext: 'communal' | 'individual' | 'flexible';
  heavyMealAcceptance: boolean;
  seafoodAcceptance: boolean;
}> = {
  turkish: {
    typical: ['cheese varieties', 'olives', 'eggs', 'tomatoes', 'cucumbers', 'honey', 'jam', 'simit', 'tea', 'börek', 'menemen'],
    forbidden: ['pork', 'alcohol', 'seafood at breakfast'],
    preferred: ['communal spreads', 'fresh ingredients', 'dairy products', 'vegetables'],
    timing: 'early (7-8 AM)',
    socialContext: 'communal',
    heavyMealAcceptance: false,
    seafoodAcceptance: false
  },
  japanese: {
    typical: ['steamed rice', 'miso soup', 'grilled fish', 'natto', 'pickled vegetables', 'nori', 'green tea', 'tamagoyaki'],
    forbidden: ['heavy fried foods', 'overly sweet items', 'excessive dairy'],
    preferred: ['light balanced meals', 'umami flavors', 'fermented foods', 'seasonal ingredients'],
    timing: 'early (6-7 AM)',
    socialContext: 'individual',
    heavyMealAcceptance: false,
    seafoodAcceptance: true
  },
  american: {
    typical: ['eggs', 'bacon', 'pancakes', 'cereal', 'toast', 'coffee', 'orange juice', 'hash browns', 'sausage'],
    forbidden: [],
    preferred: ['sweet and savory options', 'convenience foods', 'hearty portions'],
    timing: 'flexible (6-10 AM)',
    socialContext: 'flexible',
    heavyMealAcceptance: true,
    seafoodAcceptance: false
  },
  mediterranean: {
    typical: ['bread', 'olive oil', 'tomatoes', 'cheese', 'olives', 'honey', 'yogurt', 'coffee', 'fruit'],
    forbidden: ['heavy meats at breakfast'],
    preferred: ['fresh ingredients', 'light meals', 'olive oil based', 'seasonal produce'],
    timing: 'moderate (8-9 AM)',
    socialContext: 'flexible',
    heavyMealAcceptance: false,
    seafoodAcceptance: false
  },
  indian: {
    typical: ['idli', 'dosa', 'paratha', 'poha', 'upma', 'chai', 'lassi', 'chutney', 'sambar'],
    forbidden: ['beef (Hindu)', 'pork (Muslim)', 'meat (vegetarian regions)'],
    preferred: ['spiced dishes', 'fermented foods', 'vegetarian options', 'regional varieties'],
    timing: 'early (7-8 AM)',
    socialContext: 'communal',
    heavyMealAcceptance: true,
    seafoodAcceptance: false
  },
  chinese: {
    typical: ['congee', 'youtiao', 'baozi', 'soy milk', 'tea eggs', 'noodles', 'dumplings', 'tea'],
    forbidden: ['cold foods', 'raw vegetables at breakfast'],
    preferred: ['warm foods', 'savory items', 'variety of textures', 'dim sum style'],
    timing: 'early (6-7 AM)',
    socialContext: 'flexible',
    heavyMealAcceptance: true,
    seafoodAcceptance: true
  },
  middle_eastern: {
    typical: ['labneh', 'hummus', 'falafel', 'pita', 'olives', 'foul', 'halloumi', 'zaatar', 'tea'],
    forbidden: ['pork', 'alcohol'],
    preferred: ['mezze style', 'herbs and spices', 'legumes', 'flatbreads'],
    timing: 'moderate (8-9 AM)',
    socialContext: 'communal',
    heavyMealAcceptance: false,
    seafoodAcceptance: false
  },
  european: {
    typical: ['croissant', 'bread', 'butter', 'jam', 'cheese', 'cold cuts', 'coffee', 'yogurt', 'muesli'],
    forbidden: [],
    preferred: ['baked goods', 'dairy products', 'simple preparations', 'coffee-centric'],
    timing: 'moderate (7-9 AM)',
    socialContext: 'individual',
    heavyMealAcceptance: false,
    seafoodAcceptance: false
  }
};

// ============================================
// REGIONAL SEAFOOD PATTERNS
// ============================================

export const REGIONAL_SEAFOOD_PATTERNS: Record<string, {
  consumption: 'high' | 'moderate' | 'low';
  preferredTypes: string[];
  cookingMethods: string[];
  culturalContext: string;
}> = {
  'japanese_coastal': {
    consumption: 'high',
    preferredTypes: ['salmon', 'tuna', 'mackerel', 'sea bream', 'yellowtail'],
    cookingMethods: ['raw', 'grilled', 'steamed', 'simmered'],
    culturalContext: 'daily consumption, freshness priority'
  },
  'japanese_inland': {
    consumption: 'moderate',
    preferredTypes: ['river fish', 'preserved fish', 'dried fish'],
    cookingMethods: ['grilled', 'preserved', 'dried'],
    culturalContext: 'preserved forms common'
  },
  'turkish_coastal': {
    consumption: 'moderate',
    preferredTypes: ['anchovy', 'sardine', 'sea bass', 'mackerel', 'bonito'],
    cookingMethods: ['grilled', 'fried', 'stewed', 'baked'],
    culturalContext: 'seasonal consumption, social dining'
  },
  'turkish_inland': {
    consumption: 'low',
    preferredTypes: ['trout', 'carp'],
    cookingMethods: ['grilled', 'fried'],
    culturalContext: 'occasional consumption'
  },
  'mediterranean_coastal': {
    consumption: 'high',
    preferredTypes: ['sea bass', 'sea bream', 'octopus', 'squid', 'sardines'],
    cookingMethods: ['grilled', 'baked', 'stewed'],
    culturalContext: 'diet staple, healthy focus'
  },
  'american_coastal': {
    consumption: 'moderate',
    preferredTypes: ['salmon', 'tuna', 'shrimp', 'crab', 'lobster'],
    cookingMethods: ['grilled', 'fried', 'steamed', 'raw (sushi)'],
    culturalContext: 'restaurant dining, special occasions'
  },
  'chinese_coastal': {
    consumption: 'high',
    preferredTypes: ['various fish', 'shrimp', 'crab', 'shellfish'],
    cookingMethods: ['steamed', 'stir-fried', 'braised', 'soup'],
    culturalContext: 'daily consumption, variety important'
  },
  'indian_coastal': {
    consumption: 'high',
    preferredTypes: ['pomfret', 'kingfish', 'prawns', 'crab', 'sardines'],
    cookingMethods: ['curry', 'fried', 'grilled', 'steamed'],
    culturalContext: 'regional variations, spice-heavy'
  }
};

// ============================================
// RELIGIOUS RESTRICTIONS DATABASE
// ============================================

export const RELIGIOUS_RESTRICTIONS: Record<string, ReligiousRestriction> = {
  halal: {
    type: 'halal',
    strictness: 'strict',
    forbiddenIngredients: ['pork', 'alcohol', 'blood', 'carnivorous animals', 'non-halal meat'],
    requiredPreparation: ['halal slaughter', 'no cross-contamination']
  },
  kosher: {
    type: 'kosher',
    strictness: 'strict',
    forbiddenIngredients: ['pork', 'shellfish', 'mixing meat and dairy'],
    requiredPreparation: ['kosher certification', 'separate utensils']
  },
  hindu: {
    type: 'hindu',
    strictness: 'moderate',
    forbiddenIngredients: ['beef', 'sometimes eggs', 'sometimes onion/garlic'],
    requiredPreparation: ['vegetarian preference', 'purity considerations']
  },
  jain: {
    type: 'jain',
    strictness: 'strict',
    forbiddenIngredients: ['meat', 'eggs', 'root vegetables', 'onion', 'garlic'],
    requiredPreparation: ['strict vegetarian', 'no harm principle']
  },
  buddhist: {
    type: 'buddhist',
    strictness: 'flexible',
    forbiddenIngredients: ['sometimes meat', 'sometimes alcohol'],
    requiredPreparation: ['mindful eating', 'compassion principle']
  }
};

// ============================================
// HIERARCHICAL CONSTRAINT ENFORCEMENT
// ============================================

export const evaluateCulturalConstraints = (
  meal: any,
  culturalProfile: CulturalProfile,
  mealType: string
): {
  violations: string[];
  score: number;
  suggestions: string[];
} => {
  const violations: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Level 1: Religious/Hard constraints (never violate) - Weight: 40%
  culturalProfile.religiousRestrictions.forEach(restriction => {
    const forbidden = RELIGIOUS_RESTRICTIONS[restriction.type]?.forbiddenIngredients || [];
    meal.ingredients?.forEach((ingredient: any) => {
      const ingredientName = ingredient.name?.toLowerCase() || '';
      forbidden.forEach(forbiddenItem => {
        if (ingredientName.includes(forbiddenItem.toLowerCase())) {
          violations.push(`Religious violation: Contains ${forbiddenItem} (${restriction.type})`);
          score -= 40;
        }
      });
    });
  });

  // Level 2: Cultural appropriateness (strong preference) - Weight: 30%
  const pattern = CULTURAL_BREAKFAST_PATTERNS[culturalProfile.primaryCuisine];
  if (pattern && mealType === 'breakfast') {
    // Check forbidden items
    pattern.forbidden.forEach(forbidden => {
      if (meal.ingredients?.some((i: any) => i.name?.toLowerCase().includes(forbidden.toLowerCase()))) {
        violations.push(`Cultural violation: ${forbidden} not appropriate for ${culturalProfile.primaryCuisine} breakfast`);
        score -= 15;
      }
    });

    // Check seafood acceptance
    if (!pattern.seafoodAcceptance && includesSeafood(meal.ingredients)) {
      violations.push(`Cultural violation: Seafood not typical in ${culturalProfile.primaryCuisine} breakfast`);
      score -= 15;
    }

    // Check heavy meal acceptance
    if (!pattern.heavyMealAcceptance && meal.calories > 600) {
      suggestions.push(`Consider lighter option for ${culturalProfile.primaryCuisine} breakfast`);
      score -= 10;
    }
  }

  // Level 3: Regional preferences (moderate influence) - Weight: 20%
  const regionalKey = `${culturalProfile.primaryCuisine}_${culturalProfile.region}`;
  const regionalPattern = REGIONAL_SEAFOOD_PATTERNS[regionalKey];
  
  if (regionalPattern && includesSeafood(meal.ingredients)) {
    const hasPreferredSeafood = meal.ingredients?.some((i: any) => 
      regionalPattern.preferredTypes.some(type => 
        i.name?.toLowerCase().includes(type.toLowerCase())
      )
    );
    
    if (!hasPreferredSeafood) {
      suggestions.push(`Consider using regional seafood: ${regionalPattern.preferredTypes.join(', ')}`);
      score -= 10;
    }
  }

  // Level 4: Personal taste (weak influence) - Weight: 10%
  culturalProfile.culturalPreferences.forEach(pref => {
    if (pref.importance === 'high' && pref.type === 'flavor') {
      suggestions.push(`Enhance ${pref.preference} flavors for better cultural alignment`);
      score -= 5;
    }
  });

  return {
    violations,
    score: Math.max(0, score),
    suggestions
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function detectCulturalCuisine(ingredients: any[], cuisinePreferences: string[]): CulturalCuisine {
  // Map user preferences to our 8 cultural cuisines
  const cuisineMap: Record<string, CulturalCuisine> = {
    'turkish': 'turkish',
    'japanese': 'japanese',
    'american': 'american',
    'italian': 'mediterranean',
    'greek': 'mediterranean',
    'spanish': 'mediterranean',
    'indian': 'indian',
    'chinese': 'chinese',
    'arabic': 'middle_eastern',
    'lebanese': 'middle_eastern',
    'french': 'european',
    'german': 'european',
    'british': 'european'
  };

  for (const pref of cuisinePreferences) {
    const mapped = cuisineMap[pref.toLowerCase()];
    if (mapped) return mapped;
  }

  // Default based on ingredients
  if (ingredients.some(i => i.name?.includes('soy') || i.name?.includes('miso'))) return 'japanese';
  if (ingredients.some(i => i.name?.includes('olive') || i.name?.includes('feta'))) return 'mediterranean';
  if (ingredients.some(i => i.name?.includes('curry') || i.name?.includes('turmeric'))) return 'indian';
  
  return 'american'; // Default
}

export function createCulturalProfile(
  userPreferences: any,
  detectedCuisine?: CulturalCuisine
): CulturalProfile {
  return {
    primaryCuisine: detectedCuisine || 'american',
    region: userPreferences.coastal ? 'coastal' : 'inland',
    religiousRestrictions: userPreferences.religiousRestrictions || [],
    culturalPreferences: userPreferences.culturalPreferences || []
  };
}
