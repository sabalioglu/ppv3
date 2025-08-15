// lib/policy/cultural-rules.ts - COMPLETE OPTIMIZED VERSION

// Safe import handling
let CULTURAL_KNOWLEDGE_BASE: any;
try {
  const db = require('../cultural-intelligence/cultural-database');
  CULTURAL_KNOWLEDGE_BASE = db.CULTURAL_KNOWLEDGE_BASE;
} catch (e) {
  console.warn('Cultural database not available, using fallback patterns');
  CULTURAL_KNOWLEDGE_BASE = null;
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

// ⚡ OPTIMIZED detectCulturalCuisine function
export const detectCulturalCuisine = (
  meal: any,
  userPreferences: string[] = []
): CulturalCuisine => {
  const ingredients = meal.ingredients || [];
  const cookingMethods = meal.cookingMethods || [];
  const spices = meal.spices || [];
  
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

  // Use CULTURAL_KNOWLEDGE_BASE if available
  if (CULTURAL_KNOWLEDGE_BASE && CULTURAL_KNOWLEDGE_BASE.spices) {
    Object.entries(CULTURAL_KNOWLEDGE_BASE.spices).forEach(([cuisine, pattern]: [string, any]) => {
      if (!(cuisine in scores)) return;
      
      if (pattern && pattern.essential) {
        const essentialMatches = pattern.essential.filter((spice: string) => 
          spices.some((s: string) => s?.toLowerCase().includes(spice.toLowerCase()))
        ).length;
        scores[cuisine as CulturalCuisine] += essentialMatches * 3;
      }
      
      if (pattern && pattern.common) {
        const commonMatches = pattern.common.filter((spice: string) => 
          spices.some((s: string) => s?.toLowerCase().includes(spice.toLowerCase()))
        ).length;
        scores[cuisine as CulturalCuisine] += commonMatches * 1;
      }
    });
  }

  if (CULTURAL_KNOWLEDGE_BASE && CULTURAL_KNOWLEDGE_BASE.cookingMethods) {
    Object.entries(CULTURAL_KNOWLEDGE_BASE.cookingMethods).forEach(([cuisine, methods]: [string, any]) => {
      if (!(cuisine in scores)) return;
      
      if (methods && methods.primary) {
        const primaryMatches = methods.primary.filter((method: string) => 
          cookingMethods.some((m: string) => m?.toLowerCase().includes(method.toLowerCase()))
        ).length;
        scores[cuisine as CulturalCuisine] += primaryMatches * 2;
      }
      
      if (methods && methods.signature) {
        const signatureMatches = methods.signature.filter((sig: string) => 
          cookingMethods.some((m: string) => m?.toLowerCase().includes(sig.toLowerCase()))
        ).length;
        scores[cuisine as CulturalCuisine] += signatureMatches * 3;
      }
    });
  }

  // Fallback to local patterns if database not available or no scores yet
  if (!CULTURAL_KNOWLEDGE_BASE || Object.values(scores).every(s => s === 0)) {
    Object.entries(CULTURAL_SPICE_PATTERNS).forEach(([cuisine, pattern]) => {
      if (!(cuisine in scores)) return;
      
      pattern.essential.forEach(spice => {
        if (spices.some((s: string) => s?.toLowerCase().includes(spice.toLowerCase()))) {
          scores[cuisine as CulturalCuisine] += 3;
        }
      });
      
      pattern.common.forEach(spice => {
        if (spices.some((s: string) => s?.toLowerCase().includes(spice.toLowerCase()))) {
          scores[cuisine as CulturalCuisine] += 1;
        }
      });
    });

    Object.entries(CULTURAL_COOKING_METHODS).forEach(([cuisine, methods]) => {
      if (!(cuisine in scores)) return;
      
      methods.preferred.forEach(method => {
        if (cookingMethods.some((m: string) => m?.toLowerCase().includes(method.toLowerCase()))) {
          scores[cuisine as CulturalCuisine] += 2;
        }
      });
      
      methods.signature.forEach(sig => {
        if (cookingMethods.some((m: string) => m?.toLowerCase().includes(sig.toLowerCase()))) {
          scores[cuisine as CulturalCuisine] += 3;
        }
      });
    });
  }

  // Score based on ingredient analysis
  if (ingredients.length > 0) {
    const cuisineIndicators = {
      turkish: ['beyaz peynir', 'sucuk', 'simit', 'börek', 'kebab', 'baklava', 'lahmacun'],
      japanese: ['miso', 'soy sauce', 'nori', 'sushi', 'tofu', 'ramen', 'tempura'],
      indian: ['curry', 'dal', 'chapati', 'naan', 'paneer', 'masala', 'tandoori'],
      mediterranean: ['feta', 'olive oil', 'hummus', 'pita', 'tzatziki', 'tahini'],
      chinese: ['bok choy', 'dim sum', 'wonton', 'hoisin', 'five spice', 'soy sauce'],
      middle_eastern: ['tahini', 'falafel', 'shawarma', 'labneh', 'zaatar', 'halloumi'],
      american: ['burger', 'hot dog', 'bbq', 'mac and cheese', 'buffalo', 'ranch'],
      european: ['baguette', 'croissant', 'pasta', 'risotto', 'schnitzel', 'paella']
    };

    Object.entries(cuisineIndicators).forEach(([cuisine, indicators]) => {
      if (ingredients.some((ing: string) => 
        indicators.some(indicator => ing?.toLowerCase().includes(indicator.toLowerCase()))
      )) {
        scores[cuisine as CulturalCuisine] += 5;
      }
    });
  }

  // User preference scoring
  userPreferences.forEach(pref => {
    if (!pref) return;
    const lowerPref = pref.toLowerCase();
    
    const preferenceMap: Record<string, CulturalCuisine[]> = {
      'turkish': ['turkish'],
      'türk': ['turkish'],
      'japanese': ['japanese'],
      'japan': ['japanese'],
      'indian': ['indian'],
      'curry': ['indian'],
      'mediterranean': ['mediterranean'],
      'greek': ['mediterranean'],
      'italian': ['mediterranean'],
      'chinese': ['chinese'],
      'asian': ['chinese', 'japanese'],
      'middle eastern': ['middle_eastern'],
      'arabic': ['middle_eastern'],
      'lebanese': ['middle_eastern'],
      'american': ['american'],
      'usa': ['american'],
      'european': ['european'],
      'french': ['european'],
      'german': ['european']
    };

    Object.entries(preferenceMap).forEach(([keyword, cuisines]) => {
      if (lowerPref.includes(keyword)) {
        cuisines.forEach(c => scores[c] += 10);
      }
    });
  });

  // Find highest scoring cuisine
  let maxScore = 0;
  let detectedCuisine: CulturalCuisine = 'american';
  
  Object.entries(scores).forEach(([cuisine, score]) => {
    if (score > maxScore) {
      maxScore = score;
      detectedCuisine = cuisine as CulturalCuisine;
    }
  });

  return detectedCuisine;
};

// Alternative name for backward compatibility
export const identifyPrimaryCuisine = detectCulturalCuisine;

// createCulturalProfile function
export const createCulturalProfile = (
  user: any,
  onboardingData?: any
): CulturalProfile => {
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
};

// Helper function: inferPrimaryCuisine
export const inferPrimaryCuisine = (
  user: any,
  onboardingData?: any
): CulturalCuisine => {
  const explicitCuisine = user?.culturalPreferences?.primaryCuisine || 
                         onboardingData?.cuisine ||
                         user?.cuisine;
  
  if (explicitCuisine && Object.keys(CULTURAL_MEAL_PATTERNS).includes(explicitCuisine)) {
    return explicitCuisine as CulturalCuisine;
  }

  const location = user?.location || user?.country || onboardingData?.location;
  if (location) {
    const locationLower = location.toLowerCase();
    
    const locationMap: Record<string, CulturalCuisine> = {
      'turkey': 'turkish',
      'türkiye': 'turkish',
      'japan': 'japanese',
      'india': 'indian',
      'china': 'chinese',
      'usa': 'american',
      'united states': 'american'
    };

    for (const [key, cuisine] of Object.entries(locationMap)) {
      if (locationLower.includes(key)) return cuisine;
    }

    if (['greece', 'italy', 'spain', 'portugal'].some(c => locationLower.includes(c))) {
      return 'mediterranean';
    }
    if (['egypt', 'lebanon', 'syria', 'jordan', 'saudi', 'uae'].some(c => locationLower.includes(c))) {
      return 'middle_eastern';
    }
    if (['germany', 'france', 'uk', 'england', 'netherlands', 'sweden'].some(c => locationLower.includes(c))) {
      return 'european';
    }
  }

  const dietaryPrefs = user?.dietaryPreferences || onboardingData?.dietary || [];
  if (Array.isArray(dietaryPrefs)) {
    if (dietaryPrefs.some(pref => pref.toLowerCase().includes('halal'))) {
      return 'middle_eastern';
    }
    if (dietaryPrefs.some(pref => pref.toLowerCase().includes('vegetarian'))) {
      return 'indian';
    }
  }

  return 'american';
};

// Helper function: inferRegion
export const inferRegion = (location?: string): 'coastal' | 'inland' | 'urban' | 'rural' => {
  if (!location) return 'urban';
  
  const locationLower = location.toLowerCase();
  
  const coastalKeywords = ['coast', 'beach', 'port', 'bay', 'ocean', 'sea', 'harbor', 'marina'];
  if (coastalKeywords.some(keyword => locationLower.includes(keyword))) {
    return 'coastal';
  }

  const coastalCities = ['istanbul', 'tokyo', 'new york', 'los angeles', 'miami', 'barcelona', 'nice', 'naples'];
  if (coastalCities.some(city => locationLower.includes(city))) {
    return 'coastal';
  }

  const urbanKeywords = ['city', 'metro', 'downtown', 'urban', 'center'];
  if (urbanKeywords.some(keyword => locationLower.includes(keyword))) {
    return 'urban';
  }

  const ruralKeywords = ['village', 'town', 'rural', 'farm', 'countryside'];
  if (ruralKeywords.some(keyword => locationLower.includes(keyword))) {
    return 'rural';
  }

  return 'inland';
};

// Helper function: parseReligiousRestrictions
export const parseReligiousRestrictions = (
  user: any,
  onboardingData?: any
): string[] => {
  const restrictions: string[] = [];
  
  const religiousInfo = user?.religion || 
                       user?.religiousPreferences || 
                       onboardingData?.religion ||
                       user?.dietaryRestrictions;

  if (!religiousInfo) return restrictions;

  const processRestriction = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('halal') || lower.includes('muslim') || lower.includes('islam')) {
      restrictions.push('halal');
    }
    if (lower.includes('kosher') || lower.includes('jewish') || lower.includes('judaism')) {
      restrictions.push('kosher');
    }
    if (lower.includes('hindu') || lower.includes('hinduism')) {
      restrictions.push('hindu_vegetarian');
    }
    if (lower.includes('jain') || lower.includes('jainism')) {
      restrictions.push('jain');
    }
    if (lower.includes('buddhist') || lower.includes('buddhism')) {
      restrictions.push('buddhist');
    }
  };

  if (Array.isArray(religiousInfo)) {
    religiousInfo.forEach(processRestriction);
  } else if (typeof religiousInfo === 'string') {
    processRestriction(religiousInfo);
  }

  return [...new Set(restrictions)];
};

// Helper function: parsePersonalPreferences
export const parsePersonalPreferences = (
  user: any,
  onboardingData?: any
): string[] => {
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
      preferences.push(...source);
    } else if (typeof source === 'string') {
      preferences.push(source);
    }
  });

  return preferences.filter(pref => pref && typeof pref === 'string');
};

// Additional helper function
export const detectPrimaryCuisine = (
  meal: any,
  culturalProfile?: CulturalProfile
): CulturalCuisine => {
  if (culturalProfile?.cuisine) {
    return culturalProfile.cuisine;
  }
  return detectCulturalCuisine(meal, culturalProfile?.personalPreferences || []);
};

// evaluateCulturalAppropriateness function
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
  const violations: string[] = [];
  const suggestions: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const cuisine = culturalProfile.cuisine;
  const mealPattern = CULTURAL_MEAL_PATTERNS[cuisine]?.[mealType];
  
  if (!mealPattern) {
    return {
      isAppropriate: true,
      violations: [],
      score: 50,
      suggestions: ['No specific cultural patterns found'],
      warnings: []
    };
  }

  // Check forbidden items
  mealPattern.forbidden.forEach(forbidden => {
    if (meal.ingredients?.some((ing: string) => ing?.includes(forbidden))) {
      violations.push(`Contains forbidden item: ${forbidden}`);
      score -= 25;
    }
  });

  // Check religious constraints
  if (culturalProfile.religiousRestrictions) {
    culturalProfile.religiousRestrictions.forEach(restriction => {
      const religious = RELIGIOUS_DIETARY_CONSTRAINTS[restriction as keyof typeof RELIGIOUS_DIETARY_CONSTRAINTS];
      if (religious) {
        religious.forbidden.forEach(item => {
          if (meal.ingredients?.some((ing: string) => ing?.toLowerCase().includes(item))) {
            violations.push(`Religious violation: contains ${item}`);
            score -= 50;
          }
        });
      }
    });
  }

  // Check cooking methods
  const cookingMethod = CULTURAL_COOKING_METHODS[cuisine];
  if (cookingMethod && meal.cookingMethod) {
    if (cookingMethod.avoided.includes(meal.cookingMethod)) {
      warnings.push(`Cooking method ${meal.cookingMethod} is typically avoided`);
      score -= 10;
    }
    if (!cookingMethod.preferred.includes(meal.cookingMethod)) {
      suggestions.push(`Consider using preferred methods: ${cookingMethod.preferred.join(', ')}`);
      score -= 5;
    }
  }

  // Check regional preferences
  const regional = REGIONAL_FOOD_PREFERENCES[culturalProfile.region];
  if (regional) {
    const hasPreferred = meal.ingredients?.some((ing: string) => 
      regional.preferred.some(pref => ing?.includes(pref))
    );
    if (!hasPreferred) {
      suggestions.push(`Consider adding regional preferences: ${regional.preferred.slice(0, 3).join(', ')}`);
    }
  }

  // Check spice profile
  const spicePattern = CULTURAL_SPICE_PATTERNS[cuisine];
  if (spicePattern && meal.spices) {
    const hasEssential = spicePattern.essential.some(spice => 
      meal.spices?.includes(spice)
    );
    if (!hasEssential) {
      suggestions.push(`Missing essential spices: ${spicePattern.essential.slice(0, 3).join(', ')}`);
      score -= 10;
    }
  }

  return {
    isAppropriate: violations.length === 0 && score >= 50,
    violations,
    score: Math.max(0, score),
    suggestions,
    warnings
  };
};

// Helper functions
export const getMealTypeRecommendations = (
  mealType: MealType,
  cuisine: CulturalCuisine
): string[] => {
  return CULTURAL_MEAL_PATTERNS[cuisine]?.[mealType]?.preferred || [];
};

export const getCookingMethodsForCuisine = (
  cuisine: CulturalCuisine
): string[] => {
  return CULTURAL_COOKING_METHODS[cuisine]?.preferred || [];
};

export const getSpicesForCuisine = (
  cuisine: CulturalCuisine
): string[] => {
  return CULTURAL_SPICE_PATTERNS[cuisine]?.essential || [];
};

export const checkReligiousCompliance = (
  ingredients: string[],
  religiousRestrictions: string[]
): boolean => {
  for (const restriction of religiousRestrictions) {
    const rules = RELIGIOUS_DIETARY_CONSTRAINTS[restriction as keyof typeof RELIGIOUS_DIETARY_CONSTRAINTS];
    if (rules) {
      for (const forbidden of rules.forbidden) {
        if (ingredients.some(ing => ing?.toLowerCase().includes(forbidden))) {
          return false;
        }
      }
    }
  }
  return true;
};

// Meal timing function
export const getMealTimingRecommendation = (
  mealType: MealType,
  cuisine: CulturalCuisine
): {
  idealTime: string;
  acceptable: string;
  cultural_note: string;
} => {
  const pattern = CULTURAL_MEAL_PATTERNS[cuisine]?.[mealType];
  if (!pattern) {
    return {
      idealTime: '12:00',
      acceptable: '11:00-14:00',
      cultural_note: 'Standard timing'
    };
  }

  const timingMap: any = {
    turkish: {
      breakfast: { ideal: '08:00', range: '07:00-10:00', note: 'Weekend kahvaltı can extend to noon' },
      lunch: { ideal: '13:00', range: '12:00-14:00', note: 'Main hot meal of the day' },
      dinner: { ideal: '20:00', range: '19:00-21:00', note: 'Family gathering time' },
      snack: { ideal: '17:00', range: '16:00-18:00', note: 'Tea time tradition' }
    },
    japanese: {
      breakfast: { ideal: '07:00', range: '06:00-08:00', note: 'Early, nutritious start' },
      lunch: { ideal: '12:00', range: '12:00-13:00', note: 'Efficient lunch break' },
      dinner: { ideal: '19:00', range: '18:00-20:00', note: 'Family dinner time' },
      snack: { ideal: '15:00', range: '14:00-16:00', note: 'Afternoon tea and wagashi' }
    }
  };

  const timing = timingMap[cuisine]?.[mealType];
  return {
    idealTime: timing?.ideal || pattern.timing,
    acceptable: timing?.range || pattern.timing,
    cultural_note: timing?.note || pattern.style
  };
};

// Legacy functions for backward compatibility
export const includesSeafood = (ingredients: string[]): boolean => {
  const seafoodKeywords = ['fish', 'salmon', 'tuna', 'shrimp', 'seafood', 'anchovy', 'mackerel'];
  return ingredients.some(ing => 
    seafoodKeywords.some(keyword => ing?.toLowerCase().includes(keyword))
  );
};

export const breakfastSeafoodMode = (
  hasFish: boolean,
  cuisine?: string,
  region?: string
): 'avoid' | 'sometimes' | 'preferred' => {
  if (!hasFish) return 'avoid';
  
  if (cuisine === 'japanese') return 'preferred';
  if (cuisine === 'nordic') return 'sometimes';
  if (region === 'coastal' && cuisine === 'mediterranean') return 'sometimes';
  
  return 'avoid';
};
