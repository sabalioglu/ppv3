// lib/policy/cultural-rules.ts - COMPLETE FIXED VERSION WITH SAFETY CHECKS

// Safe import handling
let CULTURAL_KNOWLEDGE_BASE: any = null;
try {
  const db = require('../cultural-intelligence/cultural-database');
  CULTURAL_KNOWLEDGE_BASE = db.CULTURAL_KNOWLEDGE_BASE;
} catch (e) {
  console.warn('Cultural database not available, using fallback patterns');
}

// Type definitions
export type CulturalCuisine = 'turkish' | 'japanese' | 'american' | 'mediterranean' | 'indian' | 'chinese' | 'middle_eastern' | 'european';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CookingMethod = 'grilling' | 'steaming' | 'frying' | 'roasting' | 'boiling' | 'stewing' | 'raw' | 'baking' | 'sauteing';

export interface CulturalMealPattern {
  preferred: string[];
  forbidden: string[];
  timing: string;
  style: string;
  cookingMethods: string[];
  portionSize: 'small' | 'moderate' | 'large';
  temperature: 'hot' | 'warm' | 'cold' | 'mixed';
}

export interface CulturalProfile {
  cuisine: CulturalCuisine;
  region: 'coastal' | 'inland' | 'urban' | 'rural';
  religiousRestrictions?: string[];
  personalPreferences?: string[];
}

// 🛡️ SAFETY HELPER FUNCTIONS
const safeObjectAccess = (obj: any, key: any, fallback: any = null): any => {
  if (obj === null || obj === undefined) return fallback;
  if (key === null || key === undefined) return fallback;
  if (typeof key === 'string' && key === 'undefined') return fallback;
  return obj[key] ?? fallback;
};

const isValidCuisine = (cuisine: any): cuisine is CulturalCuisine => {
  const validCuisines: CulturalCuisine[] = ['turkish', 'japanese', 'american', 'mediterranean', 'indian', 'chinese', 'middle_eastern', 'european'];
  return validCuisines.includes(cuisine);
};

const isValidMealType = (mealType: any): mealType is MealType => {
  const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  return validMealTypes.includes(mealType);
};

// COMPREHENSIVE MEAL PATTERNS FOR ALL CUISINES
export const CULTURAL_MEAL_PATTERNS: Record<CulturalCuisine, Record<MealType, CulturalMealPattern>> = {
  turkish: {
    breakfast: {
      preferred: ['white_cheese', 'olives', 'tomatoes', 'cucumbers', 'eggs', 'honey', 'jam', 'simit', 'tea', 'börek'],
      forbidden: ['heavy_meat', 'fish', 'sweet_desserts', 'alcohol'],
      timing: '7-9 AM',
      style: 'communal spread (kahvaltı)',
      cookingMethods: ['fresh', 'boiling', 'light_grilling'],
      portionSize: 'large',
      temperature: 'mixed'
    },
    lunch: {
      preferred: ['soups', 'home_cooked_meals', 'pilaf', 'vegetables', 'legumes', 'salads'],
      forbidden: ['alcohol_during_work', 'very_heavy_meals'],
      timing: '12-2 PM',
      style: 'moderate home-style',
      cookingMethods: ['stewing', 'sauteing', 'steaming'],
      portionSize: 'moderate',
      temperature: 'hot'
    },
    dinner: {
      preferred: ['meat_dishes', 'kebabs', 'mezze', 'family_meals', 'rakı_fish'],
      forbidden: [],
      timing: '7-9 PM',
      style: 'family gathering, main meal',
      cookingMethods: ['grilling', 'roasting', 'stewing', 'baking'],
      portionSize: 'large',
      temperature: 'hot'
    },
    snack: {
      preferred: ['fruits', 'nuts', 'tea', 'simit', 'small_pastries'],
      forbidden: ['heavy_meals'],
      timing: 'afternoon tea (5 PM)',
      style: 'light, social',
      cookingMethods: ['fresh', 'baking'],
      portionSize: 'small',
      temperature: 'mixed'
    }
  },
  
  japanese: {
    breakfast: {
      preferred: ['rice', 'miso_soup', 'grilled_fish', 'nori', 'pickles', 'natto', 'green_tea'],
      forbidden: ['heavy_western_breakfast', 'excessive_sweets'],
      timing: '6-8 AM',
      style: 'balanced traditional (ichijū-sansai)',
      cookingMethods: ['steaming', 'grilling', 'fermenting'],
      portionSize: 'moderate',
      temperature: 'hot'
    },
    lunch: {
      preferred: ['bento', 'ramen', 'udon', 'donburi', 'seasonal_ingredients'],
      forbidden: ['overly_greasy', 'excessive_portions'],
      timing: '12-1 PM',
      style: 'efficient, balanced',
      cookingMethods: ['steaming', 'simmering', 'grilling'],
      portionSize: 'moderate',
      temperature: 'hot'
    },
    dinner: {
      preferred: ['kaiseki_style', 'seasonal_focus', 'multiple_small_dishes', 'sake'],
      forbidden: ['waste', 'excessive_portions'],
      timing: '6-8 PM',
      style: 'mindful, seasonal',
      cookingMethods: ['simmering', 'grilling', 'steaming', 'raw'],
      portionSize: 'moderate',
      temperature: 'mixed'
    },
    snack: {
      preferred: ['wagashi', 'tea', 'rice_crackers', 'seasonal_fruits'],
      forbidden: ['heavy_western_snacks'],
      timing: 'afternoon tea (3 PM)',
      style: 'minimal, refined',
      cookingMethods: ['minimal_processing'],
      portionSize: 'small',
      temperature: 'mixed'
    }
  },

  indian: {
    breakfast: {
      preferred: ['dosa', 'idli', 'paratha', 'poha', 'chai', 'yogurt', 'chutney'],
      forbidden: ['beef', 'sometimes_meat'],
      timing: '8-10 AM',
      style: 'regional variations',
      cookingMethods: ['steaming', 'griddling', 'fermenting'],
      portionSize: 'moderate',
      temperature: 'hot'
    },
    lunch: {
      preferred: ['thali', 'dal', 'rice', 'roti', 'sabzi', 'yogurt'],
      forbidden: ['beef', 'often_meat'],
      timing: '1-2 PM',
      style: 'complete meal (thali)',
      cookingMethods: ['tempering', 'stewing', 'steaming'],
      portionSize: 'large',
      temperature: 'hot'
    },
    dinner: {
      preferred: ['lighter_than_lunch', 'dal', 'vegetables', 'chapati'],
      forbidden: ['beef', 'often_meat'],
      timing: '7-9 PM',
      style: 'lighter family meal',
      cookingMethods: ['sauteing', 'stewing', 'griddling'],
      portionSize: 'moderate',
      temperature: 'hot'
    },
    snack: {
      preferred: ['samosa', 'pakora', 'chai', 'namkeen', 'sweets'],
      forbidden: [],
      timing: 'evening (4-6 PM)',
      style: 'tea time snacks',
      cookingMethods: ['frying', 'roasting'],
      portionSize: 'small',
      temperature: 'hot'
    }
  },

  mediterranean: {
    breakfast: {
      preferred: ['yogurt', 'honey', 'fruits', 'nuts', 'whole_grain_bread', 'olive_oil'],
      forbidden: ['heavy_fried_foods'],
      timing: '7-9 AM',
      style: 'light, healthy',
      cookingMethods: ['fresh', 'baking'],
      portionSize: 'moderate',
      temperature: 'mixed'
    },
    lunch: {
      preferred: ['salads', 'grilled_fish', 'vegetables', 'legumes', 'olive_oil'],
      forbidden: [],
      timing: '1-3 PM',
      style: 'main meal, leisurely',
      cookingMethods: ['grilling', 'roasting', 'fresh'],
      portionSize: 'large',
      temperature: 'mixed'
    },
    dinner: {
      preferred: ['light_meals', 'soup', 'salad', 'cheese', 'wine'],
      forbidden: [],
      timing: '8-10 PM',
      style: 'light, social',
      cookingMethods: ['grilling', 'sauteing'],
      portionSize: 'moderate',
      temperature: 'warm'
    },
    snack: {
      preferred: ['fruits', 'nuts', 'cheese', 'olives'],
      forbidden: ['processed_snacks'],
      timing: 'afternoon',
      style: 'healthy, natural',
      cookingMethods: ['fresh'],
      portionSize: 'small',
      temperature: 'mixed'
    }
  },

  chinese: {
    breakfast: {
      preferred: ['congee', 'youtiao', 'soy_milk', 'dumplings', 'tea_eggs'],
      forbidden: ['cold_foods', 'raw_vegetables'],
      timing: '7-9 AM',
      style: 'warm, comforting',
      cookingMethods: ['steaming', 'boiling', 'frying'],
      portionSize: 'moderate',
      temperature: 'hot'
    },
    lunch: {
      preferred: ['rice', 'stir_fry', 'soup', 'vegetables', 'tofu'],
      forbidden: [],
      timing: '12-1 PM',
      style: 'balanced, varied',
      cookingMethods: ['stir_frying', 'steaming', 'braising'],
      portionSize: 'moderate',
      temperature: 'hot'
    },
    dinner: {
      preferred: ['family_style', 'multiple_dishes', 'soup', 'rice'],
      forbidden: [],
      timing: '6-8 PM',
      style: 'family gathering',
      cookingMethods: ['stir_frying', 'steaming', 'braising', 'roasting'],
      portionSize: 'large',
      temperature: 'hot'
    },
    snack: {
      preferred: ['dim_sum', 'fruits', 'tea', 'seeds', 'nuts'],
      forbidden: [],
      timing: 'afternoon tea',
      style: 'light, varied',
      cookingMethods: ['steaming', 'frying'],
      portionSize: 'small',
      temperature: 'hot'
    }
  },

  middle_eastern: {
    breakfast: {
      preferred: ['labneh', 'zaatar', 'olives', 'flatbread', 'foul', 'halloumi'],
      forbidden: ['pork', 'alcohol'],
      timing: '7-9 AM',
      style: 'mezze style spread',
      cookingMethods: ['fresh', 'grilling', 'baking'],
      portionSize: 'moderate',
      temperature: 'mixed'
    },
    lunch: {
      preferred: ['kebabs', 'rice', 'mezze', 'salads', 'hummus'],
      forbidden: ['pork', 'alcohol'],
      timing: '1-3 PM',
      style: 'substantial, shared',
      cookingMethods: ['grilling', 'roasting', 'stewing'],
      portionSize: 'large',
      temperature: 'hot'
    },
    dinner: {
      preferred: ['grilled_meats', 'rice', 'vegetables', 'yogurt'],
      forbidden: ['pork', 'alcohol'],
      timing: '7-9 PM',
      style: 'family meal',
      cookingMethods: ['grilling', 'stewing', 'baking'],
      portionSize: 'large',
      temperature: 'hot'
    },
    snack: {
      preferred: ['dates', 'nuts', 'coffee', 'baklava', 'fruits'],
      forbidden: ['pork_products'],
      timing: 'afternoon',
      style: 'hospitality focused',
      cookingMethods: ['fresh', 'baking'],
      portionSize: 'small',
      temperature: 'mixed'
    }
  },

  american: {
    breakfast: {
      preferred: ['eggs', 'bacon', 'pancakes', 'cereal', 'coffee', 'toast'],
      forbidden: [],
      timing: '6-9 AM',
      style: 'quick or hearty',
      cookingMethods: ['frying', 'griddling', 'toasting'],
      portionSize: 'large',
      temperature: 'hot'
    },
    lunch: {
      preferred: ['sandwiches', 'salads', 'burgers', 'soup'],
      forbidden: [],
      timing: '12-1 PM',
      style: 'quick, convenient',
      cookingMethods: ['grilling', 'fresh', 'frying'],
      portionSize: 'moderate',
      temperature: 'mixed'
    },
    dinner: {
      preferred: ['meat_protein', 'starch', 'vegetables', 'salad'],
      forbidden: [],
      timing: '6-7 PM',
      style: 'family meal',
      cookingMethods: ['grilling', 'roasting', 'baking'],
      portionSize: 'large',
      temperature: 'hot'
    },
    snack: {
      preferred: ['chips', 'cookies', 'fruits', 'nuts', 'popcorn'],
      forbidden: [],
      timing: 'anytime',
      style: 'convenient',
      cookingMethods: ['packaged', 'fresh'],
      portionSize: 'moderate',
      temperature: 'mixed'
    }
  },

  european: {
    breakfast: {
      preferred: ['bread', 'cheese', 'cold_cuts', 'jam', 'coffee', 'croissant'],
      forbidden: [],
      timing: '7-9 AM',
      style: 'continental',
      cookingMethods: ['baking', 'fresh'],
      portionSize: 'moderate',
      temperature: 'mixed'
    },
    lunch: {
      preferred: ['hot_meal', 'soup', 'meat', 'potatoes', 'vegetables'],
      forbidden: [],
      timing: '12-2 PM',
      style: 'main meal (varies by country)',
      cookingMethods: ['roasting', 'stewing', 'sauteing'],
      portionSize: 'large',
      temperature: 'hot'
    },
    dinner: {
      preferred: ['lighter_meal', 'soup', 'bread', 'cheese', 'wine'],
      forbidden: [],
      timing: '7-9 PM',
      style: 'varies by region',
      cookingMethods: ['simmering', 'baking', 'fresh'],
      portionSize: 'moderate',
      temperature: 'warm'
    },
    snack: {
      preferred: ['pastries', 'coffee', 'fruits', 'chocolate'],
      forbidden: [],
      timing: 'afternoon coffee',
      style: 'cafe culture',
      cookingMethods: ['baking', 'fresh'],
      portionSize: 'small',
      temperature: 'mixed'
    }
  }
};

// COOKING METHOD PREFERENCES BY CULTURE
export const CULTURAL_COOKING_METHODS: Record<CulturalCuisine, {
  preferred: string[];
  avoided: string[];
  signature: string[];
}> = {
  turkish: {
    preferred: ['grilling', 'stewing', 'baking', 'sauteing_with_olive_oil'],
    avoided: ['deep_frying_everything', 'raw_meat'],
    signature: ['kebab_grilling', 'güveç_stewing', 'zeytinyağlı', 'tandır']
  },
  japanese: {
    preferred: ['steaming', 'grilling', 'simmering', 'raw_preparation'],
    avoided: ['heavy_frying', 'excessive_oil'],
    signature: ['tempura', 'teriyaki', 'sushi/sashimi', 'nimono']
  },
  indian: {
    preferred: ['tempering', 'stewing', 'griddling', 'tandoor'],
    avoided: ['raw_meat', 'minimal_spices'],
    signature: ['tadka', 'dum_cooking', 'tandoori', 'curry_base']
  },
  mediterranean: {
    preferred: ['grilling', 'roasting', 'fresh_preparation', 'olive_oil'],
    avoided: ['deep_frying', 'heavy_butter'],
    signature: ['wood_fire_grilling', 'slow_roasting', 'marinating']
  },
  chinese: {
    preferred: ['stir_frying', 'steaming', 'braising', 'deep_frying'],
    avoided: ['raw_vegetables', 'cold_foods'],
    signature: ['wok_hei', 'red_braising', 'dim_sum_steaming']
  },
  middle_eastern: {
    preferred: ['grilling', 'stewing', 'baking', 'roasting'],
    avoided: ['pork_preparation'],
    signature: ['shawarma', 'tagine', 'taboon_baking']
  },
  american: {
    preferred: ['grilling', 'frying', 'baking', 'roasting'],
    avoided: [],
    signature: ['bbq_smoking', 'deep_frying', 'cast_iron']
  },
  european: {
    preferred: ['roasting', 'baking', 'sauteing', 'braising'],
    avoided: [],
    signature: ['sous_vide', 'confit', 'flambé', 'en_papillote']
  }
};

// SPICE AND FLAVOR PROFILES
export const CULTURAL_SPICE_PATTERNS: Record<CulturalCuisine, {
  essential: string[];
  common: string[];
  avoided: string[];
  signature_combinations: string[];
}> = {
  turkish: {
    essential: ['cumin', 'sumac', 'red_pepper_flakes', 'mint', 'oregano'],
    common: ['black_pepper', 'allspice', 'cinnamon', 'parsley', 'dill'],
    avoided: ['extremely_hot_peppers', 'unfamiliar_asian_spices'],
    signature_combinations: ['mint_yogurt', 'sumac_onion', 'cumin_meat']
  },
  japanese: {
    essential: ['soy_sauce', 'mirin', 'sake', 'dashi', 'miso'],
    common: ['wasabi', 'ginger', 'sesame', 'shiso', 'yuzu'],
    avoided: ['heavy_spices', 'excessive_garlic'],
    signature_combinations: ['soy_mirin_sugar', 'dashi_miso', 'ginger_soy']
  },
  indian: {
    essential: ['turmeric', 'cumin', 'coriander', 'garam_masala', 'chili'],
    common: ['cardamom', 'cinnamon', 'cloves', 'mustard_seeds', 'curry_leaves'],
    avoided: [],
    signature_combinations: ['ginger_garlic', 'cumin_coriander', 'whole_garam_masala']
  },
  mediterranean: {
    essential: ['olive_oil', 'garlic', 'lemon', 'oregano', 'basil'],
    common: ['rosemary', 'thyme', 'parsley', 'bay_leaves'],
    avoided: ['heavy_cream_sauces', 'excessive_butter'],
    signature_combinations: ['lemon_olive_oil', 'garlic_herbs', 'tomato_basil']
  },
  chinese: {
    essential: ['soy_sauce', 'ginger', 'garlic', 'scallions', 'rice_wine'],
    common: ['star_anise', 'sichuan_pepper', 'five_spice', 'sesame_oil'],
    avoided: ['cheese', 'heavy_dairy'],
    signature_combinations: ['ginger_scallion', 'garlic_chili', 'five_spice_blend']
  },
  middle_eastern: {
    essential: ['cumin', 'coriander', 'sumac', 'zaatar', 'cardamom'],
    common: ['cinnamon', 'allspice', 'turmeric', 'saffron'],
    avoided: ['pork_products'],
    signature_combinations: ['zaatar_olive_oil', 'baharat_blend', 'ras_el_hanout']
  },
  american: {
    essential: ['salt', 'black_pepper', 'garlic_powder', 'paprika'],
    common: ['bbq_spices', 'ranch_seasoning', 'cajun_spices'],
    avoided: [],
    signature_combinations: ['bbq_rub', 'cajun_blend', 'everything_bagel']
  },
  european: {
    essential: ['salt', 'black_pepper', 'herbs_de_provence', 'bay_leaves'],
    common: ['thyme', 'rosemary', 'sage', 'tarragon'],
    avoided: [],
    signature_combinations: ['bouquet_garni', 'fines_herbes', 'quatre_épices']
  }
};

// RELIGIOUS AND DIETARY CONSTRAINTS
export const RELIGIOUS_DIETARY_CONSTRAINTS = {
  halal: {
    forbidden: ['pork', 'alcohol', 'blood', 'carnivorous_animals', 'non_halal_meat'],
    required: ['halal_certification', 'proper_slaughter', 'bismillah'],
    applies_to: ['turkish', 'middle_eastern', 'some_indian', 'some_asian'],
    meal_impacts: {
      breakfast: ['no_pork_products'],
      lunch: ['halal_meat_only'],
      dinner: ['no_alcohol_cooking'],
      snack: ['check_gelatin_source']
    }
  },
  kosher: {
    forbidden: ['pork', 'shellfish', 'mixing_meat_dairy', 'non_kosher_meat'],
    required: ['kosher_certification', 'separate_utensils', 'waiting_periods'],
    applies_to: ['some_american', 'some_european', 'israeli'],
    meal_impacts: {
      breakfast: ['separate_meat_dairy'],
      lunch: ['no_shellfish'],
      dinner: ['kosher_wine_only'],
      snack: ['certified_products']
    }
  },
  hindu_vegetarian: {
    forbidden: ['meat', 'eggs', 'sometimes_onion_garlic'],
    required: ['vegetarian_only', 'no_cross_contamination'],
    applies_to: ['indian', 'some_asian'],
    meal_impacts: {
      breakfast: ['no_eggs_sometimes'],
      lunch: ['pure_vegetarian'],
      dinner: ['no_meat_products'],
      snack: ['check_ingredients']
    }
  },
  buddhist: {
    forbidden: ['sometimes_meat', 'sometimes_onion_garlic_leeks'],
    required: ['compassionate_eating', 'mindful_preparation'],
    applies_to: ['some_asian', 'japanese', 'chinese'],
    meal_impacts: {
      breakfast: ['often_vegetarian'],
      lunch: ['mindful_portions'],
      dinner: ['no_killing_for_meal'],
      snack: ['simple_foods']
    }
  },
  jain: {
    forbidden: ['meat', 'eggs', 'root_vegetables', 'onion_garlic'],
    required: ['strict_vegetarian', 'no_root_vegetables'],
    applies_to: ['some_indian'],
    meal_impacts: {
      breakfast: ['no_root_vegetables'],
      lunch: ['strict_vegetarian'],
      dinner: ['before_sunset'],
      snack: ['limited_options']
    }
  }
};

// REGIONAL VARIATIONS
export const REGIONAL_FOOD_PREFERENCES = {
  coastal: {
    preferred: ['fresh_seafood', 'fish', 'shellfish', 'seaweed', 'coconut'],
    avoided: ['heavy_inland_meats'],
    signature: ['grilled_fish', 'seafood_stews', 'raw_preparations']
  },
  inland: {
    preferred: ['red_meat', 'poultry', 'dairy', 'grains', 'root_vegetables'],
    avoided: ['expensive_seafood'],
    signature: ['roasted_meats', 'stews', 'bread_based']
  },
  mountainous: {
    preferred: ['preserved_foods', 'dairy', 'hardy_vegetables', 'game_meat'],
    avoided: ['fresh_seafood'],
    signature: ['cheese_dishes', 'preserved_meats', 'hearty_stews']
  },
  tropical: {
    preferred: ['tropical_fruits', 'coconut', 'rice', 'spicy_foods'],
    avoided: ['heavy_cold_weather_foods'],
    signature: ['coconut_curries', 'tropical_salads', 'fruit_based']
  },
  desert: {
    preferred: ['dates', 'preserved_foods', 'flatbreads', 'lamb'],
    avoided: ['water_intensive_foods'],
    signature: ['tagines', 'preserved_lemons', 'dried_fruits']
  }
};

// ⚡ FIXED detectCulturalCuisine with safety checks
export const detectCulturalCuisine = (
  meal: any,
  userPreferences: any = []
): CulturalCuisine => {
  // 🛡️ Input validation
  if (!meal || typeof meal !== 'object') {
    console.warn('detectCulturalCuisine: Invalid meal object, using default');
    return 'american';
  }

  // Ensure userPreferences is an array
  const safePreferences = Array.isArray(userPreferences) ? userPreferences : [];
  
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const cookingMethods = Array.isArray(meal.cookingMethods) ? meal.cookingMethods : [];
  const spices = Array.isArray(meal.spices) ? meal.spices : [];
  
  let scores: Record<CulturalCuisine, number> = {
    turkish: 0,
    japanese: 0,
    american: 0,
    mediterranean: 0,
    indian: 0,
    chinese: 0,
    middle_eastern: 0,
    european: 0
  };

  // Score based on database if available
  if (CULTURAL_KNOWLEDGE_BASE?.spices) {
    try {
      Object.entries(CULTURAL_KNOWLEDGE_BASE.spices).forEach(([cuisine, pattern]: [string, any]) => {
        if (!isValidCuisine(cuisine)) return;
        
        if (pattern?.essential && Array.isArray(pattern.essential)) {
          const essentialMatches = pattern.essential.filter((spice: any) => 
            typeof spice === 'string' && spices.some((s: any) => 
              typeof s === 'string' && s.toLowerCase().includes(spice.toLowerCase())
            )
          ).length;
          scores[cuisine] += essentialMatches * 3;
        }
        
        if (pattern?.common && Array.isArray(pattern.common)) {
          const commonMatches = pattern.common.filter((spice: any) => 
            typeof spice === 'string' && spices.some((s: any) => 
              typeof s === 'string' && s.toLowerCase().includes(spice.toLowerCase())
            )
          ).length;
          scores[cuisine] += commonMatches * 1;
        }
      });
    } catch (e) {
      console.warn('Error processing spices from database:', e);
    }
  }

  // Fallback to local patterns
  if (Object.values(scores).every(s => s === 0)) {
    Object.entries(CULTURAL_SPICE_PATTERNS).forEach(([cuisine, pattern]) => {
      if (!isValidCuisine(cuisine)) return;
      
      pattern.essential.forEach(spice => {
        if (spices.some((s: any) => typeof s === 'string' && s.toLowerCase().includes(spice.toLowerCase()))) {
          scores[cuisine] += 3;
        }
      });
    });
  }

  // Score based on ingredients
  const cuisineIndicators: Record<CulturalCuisine, string[]> = {
    turkish: ['beyaz peynir', 'sucuk', 'simit', 'börek', 'kebab'],
    japanese: ['miso', 'soy sauce', 'nori', 'sushi', 'tofu'],
    indian: ['curry', 'dal', 'chapati', 'naan', 'paneer'],
    mediterranean: ['feta', 'olive oil', 'hummus', 'pita', 'tzatziki'],
    chinese: ['bok choy', 'dim sum', 'wonton', 'hoisin', 'five spice'],
    middle_eastern: ['tahini', 'falafel', 'shawarma', 'labneh', 'zaatar'],
    american: ['burger', 'hot dog', 'bbq', 'mac and cheese', 'buffalo'],
    european: ['baguette', 'croissant', 'pasta', 'risotto', 'schnitzel']
  };

  Object.entries(cuisineIndicators).forEach(([cuisine, indicators]) => {
    if (!isValidCuisine(cuisine)) return;
    
    if (ingredients.some((ing: any) => 
      typeof ing === 'string' && indicators.some(indicator => 
        ing.toLowerCase().includes(indicator.toLowerCase())
      )
    )) {
      scores[cuisine] += 5;
    }
  });

  // Score based on user preferences
  safePreferences.forEach((pref: any) => {
    if (typeof pref !== 'string') return;
    const lowerPref = pref.toLowerCase();
    
    if (lowerPref.includes('turkish') || lowerPref.includes('türk')) scores.turkish += 10;
    if (lowerPref.includes('japanese') || lowerPref.includes('japan')) scores.japanese += 10;
    if (lowerPref.includes('indian') || lowerPref.includes('curry')) scores.indian += 10;
    if (lowerPref.includes('mediterranean') || lowerPref.includes('greek')) scores.mediterranean += 10;
    if (lowerPref.includes('chinese') || lowerPref.includes('asian')) scores.chinese += 10;
    if (lowerPref.includes('middle eastern') || lowerPref.includes('arabic')) scores.middle_eastern += 10;
    if (lowerPref.includes('american') || lowerPref.includes('usa')) scores.american += 10;
    if (lowerPref.includes('european') || lowerPref.includes('french')) scores.european += 10;
  });

  // Find highest scoring cuisine
  let maxScore = 0;
  let detectedCuisine: CulturalCuisine = 'american';
  
  Object.entries(scores).forEach(([cuisine, score]) => {
    if (isValidCuisine(cuisine) && score > maxScore) {
      maxScore = score;
      detectedCuisine = cuisine;
    }
  });

  return detectedCuisine;
};

// 🛡️ SAFE WRAPPER FUNCTIONS
export const safeDetectCulturalCuisine = (meal: any, prefs: any = []): CulturalCuisine => {
  try {
    return detectCulturalCuisine(meal, prefs);
  } catch (error) {
    console.error('Cultural cuisine detection failed:', error);
    return 'american';
  }
};

export const getCulturalCuisine = (culturalProfile: any): CulturalCuisine => {
  if (!culturalProfile) return 'american';
  
  const cuisine = culturalProfile.cuisine || 
                 culturalProfile.primaryCuisine || 
                 culturalProfile.culturalCuisine;
  
  return isValidCuisine(cuisine) ? cuisine : 'american';
};

export const getMealPattern = (cuisine: any, mealType: any): CulturalMealPattern => {
  const defaultPattern: CulturalMealPattern = {
    preferred: [],
    forbidden: [],
    timing: '12:00',
    style: 'flexible',
    cookingMethods: ['any'],
    portionSize: 'moderate',
    temperature: 'mixed'
  };

  if (!isValidCuisine(cuisine) || !isValidMealType(mealType)) {
    return defaultPattern;
  }

  return safeObjectAccess(
    safeObjectAccess(CULTURAL_MEAL_PATTERNS, cuisine, {}),
    mealType,
    defaultPattern
  );
};

// Alternative name for backward compatibility
export const identifyPrimaryCuisine = safeDetectCulturalCuisine;

// createCulturalProfile function with safety
export const createCulturalProfile = (
  user: any,
  onboardingData?: any
): CulturalProfile => {
  try {
    const inferredCuisine = inferPrimaryCuisine(user, onboardingData);
    const inferredRegion = inferRegion(user?.location || onboardingData?.location);
    const religiousRestrictions = parseReligiousRestrictions(user, onboardingData);
    const personalPreferences = parsePersonalPreferences(user, onboardingData);

    return {
      cuisine: inferredCuisine,
      region: inferredRegion,
      religiousRestrictions,
      personalPreferences
    };
  } catch (error) {
    console.error('Error creating cultural profile:', error);
    return {
      cuisine: 'american',
      region: 'urban',
      religiousRestrictions: [],
      personalPreferences: []
    };
  }
};

// Helper functions with safety
export const inferPrimaryCuisine = (
  user: any,
  onboardingData?: any
): CulturalCuisine => {
  try {
    const explicitCuisine = user?.culturalPreferences?.primaryCuisine || 
                           onboardingData?.cuisine ||
                           user?.cuisine;
    
    if (isValidCuisine(explicitCuisine)) {
      return explicitCuisine;
    }

    const location = (user?.location || user?.country || onboardingData?.location || '').toString();
    if (location) {
      const locationLower = location.toLowerCase();
      
      if (locationLower.includes('turkey') || locationLower.includes('türkiye')) return 'turkish';
      if (locationLower.includes('japan')) return 'japanese';
      if (locationLower.includes('india')) return 'indian';
      if (locationLower.includes('china')) return 'chinese';
      if (['greece', 'italy', 'spain', 'portugal'].some(c => locationLower.includes(c))) return 'mediterranean';
      if (['egypt', 'lebanon', 'syria', 'jordan', 'saudi', 'uae'].some(c => locationLower.includes(c))) return 'middle_eastern';
      if (['usa', 'united states', 'america', 'canada'].some(c => locationLower.includes(c))) return 'american';
      if (['germany', 'france', 'uk', 'england', 'netherlands', 'sweden'].some(c => locationLower.includes(c))) return 'european';
    }

    return 'american';
  } catch (error) {
    console.error('Error inferring primary cuisine:', error);
    return 'american';
  }
};

export const inferRegion = (location?: any): 'coastal' | 'inland' | 'urban' | 'rural' => {
  try {
    if (!location || typeof location !== 'string') return 'urban';
    
    const locationLower = location.toLowerCase();
    
    const coastalKeywords = ['coast', 'beach', 'port', 'bay', 'ocean', 'sea', 'harbor', 'marina'];
    if (coastalKeywords.some(keyword => locationLower.includes(keyword))) return 'coastal';

    const coastalCities = ['istanbul', 'tokyo', 'new york', 'los angeles', 'miami', 'barcelona'];
    if (coastalCities.some(city => locationLower.includes(city))) return 'coastal';

    const urbanKeywords = ['city', 'metro', 'downtown', 'urban', 'center'];
    if (urbanKeywords.some(keyword => locationLower.includes(keyword))) return 'urban';

    const ruralKeywords = ['village', 'town', 'rural', 'farm', 'countryside'];
    if (ruralKeywords.some(keyword => locationLower.includes(keyword))) return 'rural';

    return 'inland';
  } catch (error) {
    console.error('Error inferring region:', error);
    return 'urban';
  }
};

export const parseReligiousRestrictions = (
  user: any,
  onboardingData?: any
): string[] => {
  try {
    const restrictions: string[] = [];
    
    const sources = [
      user?.religion,
      user?.religiousPreferences,
      onboardingData?.religion,
      user?.dietaryRestrictions
    ];

    const processText = (text: any) => {
      if (typeof text !== 'string') return;
      const lower = text.toLowerCase();
      
      if (lower.includes('halal') || lower.includes('muslim')) restrictions.push('halal');
      if (lower.includes('kosher') || lower.includes('jewish')) restrictions.push('kosher');
      if (lower.includes('hindu')) restrictions.push('hindu_vegetarian');
      if (lower.includes('jain')) restrictions.push('jain');
      if (lower.includes('buddhist')) restrictions.push('buddhist');
    };

    sources.forEach(source => {
      if (Array.isArray(source)) {
        source.forEach(processText);
      } else {
        processText(source);
      }
    });

    return [...new Set(restrictions)];
  } catch (error) {
    console.error('Error parsing religious restrictions:', error);
    return [];
  }
};

export const parsePersonalPreferences = (
  user: any,
  onboardingData?: any
): string[] => {
  try {
    const preferences: string[] = [];
    
    const sources = [
      user?.personalPreferences,
      user?.foodPreferences,
      onboardingData?.preferences,
      user?.cuisinePreferences,
      user?.dietaryPreferences,
      onboardingData?.dietary
    ];

    sources.forEach(source => {
      if (Array.isArray(source)) {
        preferences.push(...source.filter((p: any) => typeof p === 'string'));
      } else if (typeof source === 'string') {
        preferences.push(source);
      }
    });

    return preferences;
  } catch (error) {
    console.error('Error parsing personal preferences:', error);
    return [];
  }
};

// evaluateCulturalAppropriateness with safety
export const evaluateCulturalAppropriateness = (
  meal: any,
  mealType: MealType,
  culturalProfile: CulturalProfile
): {
  isAppropriate: boolean;
  violations: string[];
  score: number;
  suggestions: string[];
  warnings: string[];
} => {
  try {
    const violations: string[] = [];
    const suggestions: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    if (!isValidCuisine(culturalProfile?.cuisine) || !isValidMealType(mealType)) {
      return {
        isAppropriate: true,
        violations: [],
        score: 50,
        suggestions: ['Invalid cuisine or meal type'],
        warnings: []
      };
    }

    const cuisine = culturalProfile.cuisine;
    const mealPattern = getMealPattern(cuisine, mealType);

    // Check forbidden items
    if (Array.isArray(meal?.ingredients) && Array.isArray(mealPattern?.forbidden)) {
      mealPattern.forbidden.forEach(forbidden => {
        if (meal.ingredients.some((ing: any) => 
          typeof ing === 'string' && ing.toLowerCase().includes(forbidden.toLowerCase())
        )) {
          violations.push(`Contains forbidden item: ${forbidden}`);
          score -= 25;
        }
      });
    }

    // Check religious constraints
    if (Array.isArray(culturalProfile?.religiousRestrictions)) {
      culturalProfile.religiousRestrictions.forEach(restriction => {
        const religious = safeObjectAccess(RELIGIOUS_DIETARY_CONSTRAINTS, restriction);
        if (religious?.forbidden && Array.isArray(religious.forbidden)) {
          religious.forbidden.forEach((item: string) => {
            if (meal?.ingredients?.some((ing: any) => 
              typeof ing === 'string' && ing.toLowerCase().includes(item.toLowerCase())
            )) {
              violations.push(`Religious violation: contains ${item}`);
              score -= 50;
            }
          });
        }
      });
    }

    return {
      isAppropriate: violations.length === 0 && score >= 50,
      violations,
      score: Math.max(0, score),
      suggestions,
      warnings
    };
  } catch (error) {
    console.error('Error evaluating cultural appropriateness:', error);
    return {
      isAppropriate: true,
      violations: [],
      score: 50,
      suggestions: [],
      warnings: ['Evaluation error occurred']
    };
  }
};

// Additional helper functions
export const getMealTypeRecommendations = (
  mealType: any,
  cuisine: any
): string[] => {
  if (!isValidMealType(mealType) || !isValidCuisine(cuisine)) return [];
  const pattern = getMealPattern(cuisine, mealType);
  return pattern?.preferred || [];
};

export const getCookingMethodsForCuisine = (
  cuisine: any
): string[] => {
  if (!isValidCuisine(cuisine)) return [];
  return safeObjectAccess(CULTURAL_COOKING_METHODS, cuisine, {})?.preferred || [];
};

export const getSpicesForCuisine = (
  cuisine: any
): string[] => {
  if (!isValidCuisine(cuisine)) return [];
  return safeObjectAccess(CULTURAL_SPICE_PATTERNS, cuisine, {})?.essential || [];
};

export const checkReligiousCompliance = (
  ingredients: any,
  religiousRestrictions: any
): boolean => {
  try {
    if (!Array.isArray(ingredients) || !Array.isArray(religiousRestrictions)) return true;
    
    for (const restriction of religiousRestrictions) {
      const rules = safeObjectAccess(RELIGIOUS_DIETARY_CONSTRAINTS, restriction);
      if (rules?.forbidden && Array.isArray(rules.forbidden)) {
        for (const forbidden of rules.forbidden) {
          if (ingredients.some((ing: any) => 
            typeof ing === 'string' && ing.toLowerCase().includes(forbidden.toLowerCase())
          )) {
            return false;
          }
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking religious compliance:', error);
    return true;
  }
};

// Legacy functions
export const includesSeafood = (ingredients: any): boolean => {
  if (!Array.isArray(ingredients)) return false;
  const seafoodKeywords = ['fish', 'salmon', 'tuna', 'shrimp', 'seafood', 'anchovy', 'mackerel'];
  return ingredients.some((ing: any) => 
    typeof ing === 'string' && seafoodKeywords.some(keyword => 
      ing.toLowerCase().includes(keyword)
    )
  );
};

export const breakfastSeafoodMode = (
  hasFish: boolean,
  cuisine?: any,
  region?: any
): 'avoid' | 'sometimes' | 'preferred' => {
  if (!hasFish) return 'avoid';
  
  const cuisineStr = typeof cuisine === 'string' ? cuisine.toLowerCase() : '';
  const regionStr = typeof region === 'string' ? region.toLowerCase() : '';
  
  if (cuisineStr === 'japanese') return 'preferred';
  if (cuisineStr === 'nordic') return 'sometimes';
  if (regionStr === 'coastal' && cuisineStr === 'mediterranean') return 'sometimes';
  
  return 'avoid';
};

// Export additional helper
export const detectPrimaryCuisine = safeDetectCulturalCuisine;

// Timing recommendation
export const getMealTimingRecommendation = (
  mealType: any,
  cuisine: any
): {
  idealTime: string;
  acceptable: string;
  cultural_note: string;
} => {
  const defaultTiming = {
    idealTime: '12:00',
    acceptable: '11:00-14:00',
    cultural_note: 'Standard timing'
  };

  if (!isValidMealType(mealType) || !isValidCuisine(cuisine)) {
    return defaultTiming;
  }

  const pattern = getMealPattern(cuisine, mealType);
  return {
    idealTime: pattern?.timing || defaultTiming.idealTime,
    acceptable: pattern?.timing || defaultTiming.acceptable,
    cultural_note: pattern?.style || defaultTiming.cultural_note
  };
};
