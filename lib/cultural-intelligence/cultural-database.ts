// lib/cultural-intelligence/cultural-database.ts
// Complete cultural knowledge database based on 8-region global food culture research

export type CulturalCuisine = 'turkish' | 'japanese' | 'american' | 'mediterranean' | 'indian' | 'chinese' | 'middle_eastern' | 'european';
export type RegionType = 'coastal' | 'inland' | 'mixed';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CookingMethod = 'grilling' | 'steaming' | 'frying' | 'roasting' | 'stewing' | 'fermentation' | 'raw' | 'boiling';

export interface CulturalMealPattern {
  typical: string[];
  forbidden: string[];
  preferred: string[];
  timing: string;
  socialContext: 'communal' | 'individual' | 'flexible';
  portionStyle: 'small' | 'moderate' | 'large' | 'varied';
  characteristics: string[];
}

export interface CookingMethodProfile {
  primary: CookingMethod[];
  secondary: CookingMethod[];
  avoided: CookingMethod[];
  signature: string[];
  healthContext: string;
}

export interface SpiceProfile {
  essential: string[];
  common: string[];
  regional: string[];
  avoided: string[];
  signature: string[];
  intensity: 'mild' | 'moderate' | 'intense' | 'variable';
}

export interface SeafoodConsumption {
  level: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  preferredTypes: string[];
  cookingMethods: string[];
  frequency: string;
  culturalContext: string;
}

export interface ReligiousConstraint {
  type: 'halal' | 'kosher' | 'hindu' | 'jain' | 'buddhist';
  forbidden: string[];
  required?: string[];
  strictness: 'absolute' | 'strict' | 'moderate' | 'flexible';
  crossContamination: boolean;
}

// COMPLETE CULTURAL KNOWLEDGE BASE - Aligned with Research Data
export const CULTURAL_KNOWLEDGE_BASE = {
  // BREAKFAST PATTERNS - Based on research findings
  breakfast: {
    turkish: {
      typical: ['assorted cheeses', 'beyaz peynir', 'kasar', 'olives', 'eggs', 'sucuk', 'pastirma', 'honey', 'jams', 'fresh vegetables', 'simit', 'pide', 'turkish tea'],
      forbidden: ['pork', 'alcohol'],
      preferred: ['communal spreads', 'dairy products', 'fresh bread'],
      timing: 'early (7-8 AM)',
      socialContext: 'communal',
      portionStyle: 'varied',
      characteristics: ['feast-like', 'hearty', 'colorful spread', 'social bonding', 'hospitality', 'nutritionally balanced']
    } as CulturalMealPattern,

    japanese: {
      typical: ['steamed rice', 'miso soup', 'grilled fish', 'natto', 'pickled vegetables', 'seaweed', 'green tea'],
      forbidden: ['heavy fried foods', 'overly sweet items'],
      preferred: ['balanced meals', 'fermented foods', 'subtle flavors'],
      timing: 'early (6-7 AM)',
      socialContext: 'individual',
      portionStyle: 'small',
      characteristics: ['balanced', 'light', 'nutrient-dense', 'high fiber', 'subtle flavors', 'tradition and health']
    } as CulturalMealPattern,

    american: {
      typical: ['eggs', 'cheese', 'bacon', 'toast', 'pancakes with syrup', 'waffles', 'avocado toast', 'bagels', 'coffee', 'orange juice'],
      forbidden: [],
      preferred: ['convenience foods', 'protein-heavy', 'sweet options'],
      timing: 'varied (6-10 AM)',
      socialContext: 'flexible',
      portionStyle: 'large',
      characteristics: ['diverse', 'indulgent', 'convenient', 'high processed foods', 'sugar heavy', 'regional variations']
    } as CulturalMealPattern,

    mediterranean: {
      typical: ['yogurt with honey', 'fresh fruit', 'bread', 'pastries', 'olive oil', 'tomatoes', 'cheese', 'coffee'],
      forbidden: [],
      preferred: ['light fresh foods', 'olive oil based', 'seasonal ingredients'],
      timing: 'moderate (7-9 AM)',
      socialContext: 'flexible',
      portionStyle: 'small',
      characteristics: ['light', 'fresh', 'nutritious', 'seasonal', 'olive oil prominence']
    } as CulturalMealPattern,

    indian: {
      typical: ['aloo paratha', 'chole', 'idli', 'dosa', 'pongal', 'chutneys', 'tea'],
      forbidden: ['beef (regional)', 'pork (some regions)'],
      preferred: ['spiced foods', 'fermented items', 'regional specialties'],
      timing: 'early to moderate (6-9 AM)',
      socialContext: 'communal',
      portionStyle: 'moderate',
      characteristics: ['regional diversity', 'spice-heavy', 'fermented foods', 'vegetarian options abundant']
    } as CulturalMealPattern,

    chinese: {
      typical: ['soybean milk', 'youtiao', 'congee', 'baozi', 'jian bing', 'rice noodles'],
      forbidden: [],
      preferred: ['warm foods', 'savory options', 'street food style'],
      timing: 'early (6-8 AM)',
      socialContext: 'individual',
      portionStyle: 'moderate',
      characteristics: ['diverse', 'comforting', 'street food culture', 'regional variations']
    } as CulturalMealPattern,

    middle_eastern: {
      typical: ['ful medames', 'shakshuka', 'labneh', 'hummus', 'zataar bread', 'fatayer', 'cheese', 'olives'],
      forbidden: ['pork', 'alcohol'],
      preferred: ['mezze-style', 'dairy products', 'bread-based'],
      timing: 'early (7-8 AM)',
      socialContext: 'communal',
      portionStyle: 'moderate',
      characteristics: ['hearty', 'mezze-style', 'communal eating']
    } as CulturalMealPattern,

    european: {
      typical: ['varies by region', 'eggs', 'sausages', 'bread', 'pastries', 'cold cuts', 'cheese'],
      forbidden: [],
      preferred: ['regional specialties', 'bread-based', 'dairy'],
      timing: 'varies by region (6-9 AM)',
      socialContext: 'flexible',
      portionStyle: 'varied',
      characteristics: ['wide regional variety', 'bread prominence', 'dairy products', 'cold preparations common']
    } as CulturalMealPattern
  },

  // SEAFOOD CONSUMPTION PATTERNS - Based on research data
  seafood: {
    regional: {
      'japanese_coastal': {
        level: 'very_high',
        preferredTypes: ['salmon', 'tuna', 'mackerel', 'sea bream', 'eel'],
        cookingMethods: ['raw', 'grilled', 'steamed', 'fermented'],
        frequency: 'daily consumption (46.65kg per year)',
        culturalContext: 'cornerstone of cuisine, freshness emphasis, raw consumption'
      } as SeafoodConsumption,

      'mediterranean_coastal': {
        level: 'high',
        preferredTypes: ['sardines', 'sea bass', 'anchovies', 'shellfish'],
        cookingMethods: ['grilled', 'roasted', 'olive oil preparation'],
        frequency: 'regular (Greece: 21.54kg per year)',
        culturalContext: 'integral to Mediterranean diet, healthy preparation methods'
      } as SeafoodConsumption,

      'turkish_coastal': {
        level: 'moderate',
        preferredTypes: ['anchovy', 'sardine', 'mackerel', 'sea bream', 'sea bass'],
        cookingMethods: ['grilled', 'fried', 'steamed'],
        frequency: 'seasonal, higher in coastal regions',
        culturalContext: 'regional preference, Aegean and Mediterranean coasts higher consumption'
      } as SeafoodConsumption,

      'american_general': {
        level: 'moderate',
        preferredTypes: ['shrimp', 'salmon', 'tuna'],
        cookingMethods: ['baking', 'broiling', 'grilling', 'frying'],
        frequency: 'below recommended levels',
        culturalContext: 'less than recommended consumption, regional coastal variations'
      } as SeafoodConsumption,

      'chinese_coastal': {
        level: 'high',
        preferredTypes: ['freshwater fish', 'shellfish', 'diverse marine species'],
        cookingMethods: ['steaming', 'stir-frying', 'braising'],
        frequency: 'daily in coastal regions',
        culturalContext: 'significant regional variations, Southern China more reliant'
      } as SeafoodConsumption,

      'indian_coastal': {
        level: 'high',
        preferredTypes: ['local coastal varieties', 'freshwater fish'],
        cookingMethods: ['curry preparation', 'fried', 'steamed'],
        frequency: 'integral in coastal Southern India',
        culturalContext: 'prominent in coastal regions, integral at all meals'
      } as SeafoodConsumption
    },

    inland: {
      'turkish_inland': {
        level: 'low',
        preferredTypes: ['preserved fish', 'freshwater fish'],
        cookingMethods: ['grilled', 'fried'],
        frequency: 'occasional',
        culturalContext: 'lower consumption, preference for terrestrial protein'
      } as SeafoodConsumption,

      'american_inland': {
        level: 'low',
        preferredTypes: ['canned fish', 'frozen varieties'],
        cookingMethods: ['baking', 'frying'],
        frequency: 'below recommendations',
        culturalContext: 'cost and accessibility barriers'
      } as SeafoodConsumption
    }
  },

  // SPICE PROFILES - Based on research findings
  spices: {
    turkish: {
      essential: ['sumac', 'cumin', 'red pepper flakes', 'mint', 'oregano'],
      common: ['black pepper', 'allspice', 'parsley', 'dill'],
      regional: ['Aegean: thyme, bay leaf', 'Southeast: hot peppers'],
      avoided: ['extremely hot spices'],
      signature: ['sumac in salads', 'cumin in meat dishes', 'mint with yogurt'],
      intensity: 'moderate'
    } as SpiceProfile,

    japanese: {
      essential: ['soy sauce', 'miso', 'dashi', 'mirin'],
      common: ['ginger', 'wasabi', 'shichimi', 'sesame'],
      regional: ['regional miso varieties'],
      avoided: ['overly spicy', 'heavy spices'],
      signature: ['umami emphasis', 'natural flavors', 'subtle combinations'],
      intensity: 'mild'
    } as SpiceProfile,

    indian: {
      essential: ['turmeric', 'cumin', 'coriander', 'garam masala', 'chili'],
      common: ['ginger', 'garlic', 'cardamom', 'cinnamon', 'cloves'],
      regional: ['North: garam masala heavy', 'South: curry leaves, coconut'],
      avoided: [],
      signature: ['complex masala blends', 'tempering (tadka)', 'regional variations'],
      intensity: 'intense'
    } as SpiceProfile,

    chinese: {
      essential: ['ginger', 'garlic', 'soy sauce', 'five-spice'],
      common: ['star anise', 'cinnamon', 'sichuan peppercorns'],
      regional: ['Sichuan: mala (numbing spicy)', 'Cantonese: subtle flavors'],
      avoided: [],
      signature: ['regional balance', 'umami and sweet-sour', 'wok hei'],
      intensity: 'variable'
    } as SpiceProfile,

    middle_eastern: {
      essential: ['cumin', 'coriander', 'cinnamon', 'cardamom', 'sumac'],
      common: ['allspice', 'cloves', 'nutmeg', 'saffron'],
      regional: ['Levant: zataar', 'Gulf: baharat blends'],
      avoided: [],
      signature: ['fragrant blends', 'sweet and spicy combinations', 'zataar mix'],
      intensity: 'moderate'
    } as SpiceProfile,

    mediterranean: {
      essential: ['oregano', 'basil', 'thyme', 'rosemary'],
      common: ['garlic', 'black pepper', 'bay leaves'],
      regional: ['Italian: basil focus', 'Greek: oregano heavy'],
      avoided: ['overly hot spices'],
      signature: ['fresh herbs', 'olive oil combinations', 'simple preparations'],
      intensity: 'mild'
    } as SpiceProfile
  },

  // COOKING METHODS - Based on research data
  cookingMethods: {
    turkish: {
      primary: ['grilling', 'stewing', 'roasting'],
      secondary: ['fermentation', 'frying'],
      avoided: [],
      signature: ['kebab grilling', 'zeytinyagli (olive oil) cooking', 'guveç (casserole)'],
      healthContext: 'emphasis on grilling and olive oil, moderate frying'
    } as CookingMethodProfile,

    japanese: {
      primary: ['grilling', 'steaming', 'raw'],
      secondary: ['frying', 'simmering'],
      avoided: ['heavy frying'],
      signature: ['yakimono (grilling)', 'tempura (light frying)', 'sushi/sashimi preparation'],
      healthContext: 'precise techniques, health-conscious, minimal oil'
    } as CookingMethodProfile,

    chinese: {
      primary: ['stewing', 'steaming', 'frying'],
      secondary: ['braising', 'roasting'],
      avoided: [],
      signature: ['wok stir-frying', 'dim sum steaming', 'braising techniques'],
      healthContext: 'high heat quick cooking, wok hei (breath of wok)'
    } as CookingMethodProfile,

    indian: {
      primary: ['stewing', 'frying', 'steaming'],
      secondary: ['roasting', 'fermentation'],
      avoided: [],
      signature: ['tandoor cooking', 'dum (slow cooking)', 'tempering (tadka)'],
      healthContext: 'layered cooking methods, spice-oil integration'
    } as CookingMethodProfile,

    mediterranean: {
      primary: ['grilling', 'roasting', 'stewing'],
      secondary: ['steaming', 'frying'],
      avoided: ['heavy frying'],
      signature: ['olive oil grilling', 'herb roasting', 'slow stewing'],
      healthContext: 'olive oil emphasis, healthy preparation methods'
    } as CookingMethodProfile,

    american: {
      primary: ['grilling', 'roasting', 'frying'],
      secondary: ['baking', 'steaming'],
      avoided: [],
      signature: ['barbecue grilling', 'oven roasting', 'deep frying'],
      healthContext: 'diverse methods, convenience focus, portion size emphasis'
    } as CookingMethodProfile,

    middle_eastern: {
      primary: ['grilling', 'stewing', 'roasting'],
      secondary: ['frying', 'fermentation'],
      avoided: [],
      signature: ['kebab grilling', 'slow stewing', 'pilaf cooking'],
      healthContext: 'long slow cooking, meat-centric preparations'
    } as CookingMethodProfile
  },

  // RELIGIOUS CONSTRAINTS - Based on research findings
  religiousConstraints: {
    halal: {
      type: 'halal',
      forbidden: ['pork', 'alcohol', 'non-halal meat', 'blood products'],
      required: ['halal certification', 'proper slaughter methods'],
      strictness: 'absolute',
      crossContamination: true
    } as ReligiousConstraint,

    kosher: {
      type: 'kosher',
      forbidden: ['pork', 'shellfish', 'meat-dairy combinations', 'blood products'],
      required: ['kosher supervision', 'separate meat-dairy preparation'],
      strictness: 'absolute',
      crossContamination: true
    } as ReligiousConstraint,

    hindu: {
      type: 'hindu',
      forbidden: ['beef', 'sometimes all meat'],
      required: ['vegetarian options preferred'],
      strictness: 'strict',
      crossContamination: false
    } as ReligiousConstraint,

    jain: {
      type: 'jain',
      forbidden: ['all meat', 'root vegetables', 'honey'],
      required: ['strict vegetarian', 'no underground vegetables'],
      strictness: 'absolute',
      crossContamination: true
    } as ReligiousConstraint,

    buddhist: {
      type: 'buddhist',
      forbidden: ['meat (often)', 'alcohol'],
      required: ['mindful eating', 'plant-based preferred'],
      strictness: 'moderate',
      crossContamination: false
    } as ReligiousConstraint
  },

  // MEAL TIMING PATTERNS - Based on research
  mealTiming: {
    turkish: {
      breakfast: '7-8 AM',
      lunch: '12-2 PM (lighter)',
      dinner: '7-9 PM (main meal)',
      socialContext: 'family-centered dinners, communal eating'
    },
    japanese: {
      breakfast: '6-7 AM',
      lunch: '12-1 PM',
      dinner: '6-8 PM',
      socialContext: 'structured timing, family meals important'
    },
    american: {
      breakfast: '6-10 AM (varies)',
      lunch: '12-2 PM (quick)',
      dinner: '5-8 PM',
      socialContext: 'flexible timing, individual preferences'
    },
    mediterranean: {
      breakfast: '7-9 AM (light)',
      lunch: '1-3 PM (main meal in some regions)',
      dinner: '8-10 PM (late)',
      socialContext: 'late dinners, social eating, long meals'
    }
  },

  // AI MEAL PLANNING INSIGHTS - Research-based recommendations
  aiInsights: {
    turkish: {
      breakfast: 'Prioritize dairy, fresh produce, and grain-based dishes',
      general: 'Offer halal-certified proteins, avoid pork/alcohol, suggest late dinners, include mezze-style small plates',
      pantryOptimization: 'Use olive oil, fresh herbs, grains prominently'
    },
    japanese: {
      breakfast: 'Emphasize umami-rich ingredients and fermented foods',
      general: 'Avoid overly spicy or heavy dishes, prioritize seafood and vegetables, small portions',
      pantryOptimization: 'Focus on rice, miso, seasonal vegetables'
    },
    american: {
      breakfast: 'Offer customizable, modular meals with convenience options',
      general: 'Include protein-focused dishes, flag allergens, provide vegetarian/vegan swaps, large portions acceptable',
      pantryOptimization: 'Flexibility key, accommodate diverse preferences'
    },
    mediterranean: {
      breakfast: 'Highlight olive oil, legumes, vegetables, and whole grains',
      general: 'Promote seafood and plant-based fats, allow late dinners and light breakfasts',
      pantryOptimization: 'Olive oil base, seasonal vegetables, legumes'
    },
    indian: {
      breakfast: 'Segment by region and religion, offer vegetarian defaults',
      general: 'Clear labeling for beef/pork, spice level customization, fermented foods inclusion',
      pantryOptimization: 'Spice variety essential, legumes and grains prominent'
    },
    chinese: {
      breakfast: 'Regional segmentation critical, offer steamed and stir-fried options',
      general: 'Avoid pork/beef for halal/vegetarian users, label fermented ingredients',
      pantryOptimization: 'Rice base, quick cooking methods, fresh ingredients'
    }
  }
};

// CULTURAL APPROPRIATENESS SCORING FUNCTIONS
export const calculateCulturalAppropriatenessScore = (
  meal: any,
  cuisine: CulturalCuisine,
  mealType: MealType,
  region?: RegionType
): {
  score: number;
  breakdown: {
    ingredients: number;
    cookingMethods: number;
    spices: number;
    mealPattern: number;
    timing: number;
  };
  violations: string[];
  suggestions: string[];
} => {
  // Implementation based on research data
  const patterns = CULTURAL_KNOWLEDGE_BASE.breakfast[cuisine];
  const spiceProfile = CULTURAL_KNOWLEDGE_BASE.spices[cuisine];
  const cookingProfile = CULTURAL_KNOWLEDGE_BASE.cookingMethods[cuisine];
  
  // Calculate detailed scoring based on cultural alignment
  return {
    score: 0, // Implementation needed
    breakdown: {
      ingredients: 0,
      cookingMethods: 0,
      spices: 0,
      mealPattern: 0,
      timing: 0
    },
    violations: [],
    suggestions: []
  };
};

export default CULTURAL_KNOWLEDGE_BASE;
