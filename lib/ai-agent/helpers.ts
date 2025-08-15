// lib/ai-agent/helpers.ts
// Enhanced cultural intelligence helpers with comprehensive 8-cuisine research data

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\p{Letter}\p{Number}\s]/gu,' ').replace(/\s+/g,' ').trim();

export const tokenSet = (s: string) => new Set(normalize(s).split(' ').filter(w => w.length > 2));

export const jaccard = (a: Set<string>, b: Set<string>) => {
  const i = [...a].filter(x => b.has(x)).length;
  const u = a.size + b.size - i;
  return u === 0 ? 0 : i / u;
};

export const isNearDuplicateByName = (name: string, prevNames: string[], threshold = 0.6) => {
  const A = tokenSet(name);
  return prevNames.some(p => jaccard(A, tokenSet(p)) >= threshold);
};

// Enhanced protein categorization with cultural context
const PROTEIN_MAP: Record<string, 'fish'|'poultry'|'red_meat'|'legume'|'egg'|'tofu'|'dairy'|'seafood_other'> = {
  salmon:'fish', tuna:'fish', trout:'fish', mackerel:'fish', sardine:'fish', cod:'fish', anchovy:'fish',
  sea_bass:'fish', sea_bream:'fish', hamsi:'fish', levrek:'fish', cipura:'fish',
  chicken:'poultry', turkey:'poultry', duck:'poultry',
  beef:'red_meat', lamb:'red_meat', pork:'red_meat', mutton:'red_meat',
  shrimp:'seafood_other', prawn:'seafood_other', crab:'seafood_other', lobster:'seafood_other',
  oyster:'seafood_other', scallop:'seafood_other', mussel:'seafood_other', clam:'seafood_other',
  bean:'legume', beans:'legume', chickpea:'legume', lentil:'legume', black_bean:'legume',
  kidney_bean:'legume', pinto_bean:'legume', navy_bean:'legume',
  egg:'egg', eggs:'egg', tofu:'tofu', tempeh:'tofu',
  paneer:'dairy', yogurt:'dairy', milk:'dairy', cheese:'dairy', feta:'dairy', mozzarella:'dairy'
};

export const proteinCategoryOf = (ings: {name:string}[]=[]) => {
  for (const i of ings) {
    const n = normalize(i.name);
    const hit = Object.keys(PROTEIN_MAP).find(k => n.includes(k));
    if (hit) return PROTEIN_MAP[hit];
  }
  return null;
};

// Enhanced cooking methods with cultural techniques
const COOKING_METHODS = [
  'grill','bake','roast','saute','stir fry','stir-fry','steam','poach','braise','fry','air fry','air-fry',
  'tandoor','dum','tempura','yakimono','izgarada','guveç','pilaki','zeytinyağlı','wok','dim sum'
];

export const extractMethods = (instr: string[] = []) =>
  [...new Set(instr.flatMap(s => COOKING_METHODS.filter(m => s.toLowerCase().includes(m))))];

// Comprehensive cultural cuisine markers based on research data
export const ENHANCED_CUISINE_MARKERS = {
  turkish: {
    ingredients: ['sumac', 'bulgur', 'yogurt', 'cumin', 'mint', 'pepper paste', 'tahini', 'beyaz peynir', 
                 'kasar', 'olives', 'pomegranate molasses', 'turkish tea', 'simit', 'pide'],
    dishes: ['menemen', 'börek', 'dolma', 'kebab', 'pilaki', 'cacık', 'meze', 'baklava', 'turkish delight'],
    methods: ['grilling (izgara)', 'stewing (güveç)', 'olive oil cooking (zeytinyağlı)', 'fermentation'],
    spices: ['sumac', 'red pepper flakes (pul biber)', 'cumin (kimyon)', 'allspice', 'cinnamon', 'mint'],
    flavors: ['tangy', 'herbal', 'moderate spice', 'fresh'],
    timing: { breakfast: 'early communal', lunch: 'moderate', dinner: 'late family style' },
    region: { coastal: 'high seafood', inland: 'meat and dairy focused' }
  },
  japanese: {
    ingredients: ['miso', 'soy sauce', 'mirin', 'dashi', 'nori', 'wasabi', 'ginger', 'rice', 'sake', 
                 'miso paste', 'katsuobushi', 'kombu', 'natto', 'pickled vegetables'],
    dishes: ['sushi', 'tempura', 'ramen', 'donburi', 'yakitori', 'udon', 'soba', 'onigiri', 'miso soup'],
    methods: ['steaming (mushimono)', 'grilling (yakimono)', 'raw preparation', 'light frying (tempura)', 
             'simmering (nimono)', 'fermentation'],
    spices: ['ginger', 'wasabi', 'shichimi', 'sesame'],
    flavors: ['umami', 'subtle', 'balanced', 'clean', 'delicate'],
    timing: { breakfast: 'early balanced', lunch: 'portable moderate', dinner: 'multi-dish early' },
    region: { coastal: 'very high seafood', inland: 'river fish and vegetables' }
  },
  american: {
    ingredients: ['bbq sauce', 'ranch', 'cheddar', 'bacon', 'cornbread', 'maple syrup', 'hot sauce', 
                 'peanut butter', 'corn', 'potatoes', 'beef', 'chicken'],
    dishes: ['burger', 'bbq ribs', 'mac and cheese', 'fried chicken', 'pancakes', 'apple pie', 
            'coleslaw', 'chili', 'sandwich'],
    methods: ['grilling', 'barbecuing', 'deep frying', 'roasting', 'baking', 'slow cooking'],
    spices: ['black pepper', 'garlic powder', 'paprika', 'cayenne', 'barbecue spice blends'],
    flavors: ['bold', 'sweet and savory', 'hearty', 'comfort food'],
    timing: { breakfast: 'hearty or quick', lunch: 'fast casual', dinner: 'main meal flexible' },
    region: { coastal: 'seafood regional', inland: 'meat and grain focused' }
  },
  mediterranean: {
    ingredients: ['olive oil', 'oregano', 'feta', 'lemon', 'tomatoes', 'basil', 'garlic', 'capers', 
                 'pine nuts', 'anchovies', 'olives', 'fresh herbs'],
    dishes: ['greek salad', 'paella', 'pasta', 'risotto', 'pizza', 'gazpacho', 'ratatouille', 'tapenade'],
    methods: ['grilling', 'roasting', 'sautéing with olive oil', 'steaming', 'light preparation'],
    spices: ['oregano', 'basil', 'thyme', 'rosemary', 'parsley', 'mint', 'black pepper'],
    flavors: ['fresh', 'herbal', 'citrusy', 'clean', 'light'],
    timing: { breakfast: 'light fresh', lunch: 'moderate social', dinner: 'late leisurely' },
    region: { coastal: 'seafood focused', inland: 'vegetables and grains' }
  },
  indian: {
    ingredients: ['turmeric', 'cumin', 'coriander', 'garam masala', 'curry leaves', 'coconut', 'rice', 
                 'lentils', 'chickpeas', 'yogurt', 'ghee', 'tamarind'],
    dishes: ['curry', 'biryani', 'dal', 'chapati', 'dosa', 'idli', 'samosa', 'tandoori', 'raita'],
    methods: ['tandoor cooking', 'dum (slow cooking)', 'tempering (tadka)', 'steaming', 'deep frying'],
    spices: ['turmeric', 'cumin', 'coriander', 'cardamom', 'cinnamon', 'cloves', 'mustard seeds', 
            'curry powder', 'chili powder', 'garam masala'],
    flavors: ['complex spiced', 'layered', 'aromatic', 'varied heat levels'],
    timing: { breakfast: 'regional varied', lunch: 'substantial spiced', dinner: 'elaborate family' },
    region: { coastal: 'seafood curries', inland: 'vegetarian and dairy focused' }
  },
  chinese: {
    ingredients: ['soy sauce', 'ginger', 'garlic', 'scallions', 'sesame oil', 'rice wine', 'star anise', 
                 'sichuan peppercorns', 'black bean sauce', 'oyster sauce'],
    dishes: ['stir fry', 'fried rice', 'dim sum', 'hot pot', 'peking duck', 'kung pao', 'sweet and sour', 
            'congee', 'dumplings'],
    methods: ['stir-frying (wok)', 'steaming', 'braising', 'deep frying', 'smoking', 'red cooking'],
    spices: ['ginger', 'star anise', 'sichuan peppercorns', 'five-spice powder', 'white pepper'],
    flavors: ['savory umami', 'sweet and sour', 'numbing spicy (mala)', 'balanced'],
    timing: { breakfast: 'congee or street food', lunch: 'quick stir fry', dinner: 'family banquet style' },
    region: { coastal: 'seafood and light', inland: 'spicy and hearty' }
  },
  middle_eastern: {
    ingredients: ['tahini', 'sumac', 'za\'atar', 'pomegranate molasses', 'bulgur', 'chickpeas', 
                 'lamb', 'dates', 'rose water', 'orange blossom water'],
    dishes: ['hummus', 'falafel', 'tabbouleh', 'kebab', 'shawarma', 'pilaf', 'baklava', 'fattoush'],
    methods: ['grilling (kebab)', 'stewing', 'slow roasting', 'frying', 'mezze preparation'],
    spices: ['cumin', 'sumac', 'baharat', 'cardamom', 'cinnamon', 'allspice', 'turmeric'],
    flavors: ['aromatic', 'sweet and savory', 'fragrant', 'moderate heat'],
    timing: { breakfast: 'mezze style', lunch: 'main meal', dinner: 'communal family' },
    region: { coastal: 'seafood additions', inland: 'meat and grain focused' }
  },
  european: {
    ingredients: ['butter', 'cream', 'wine', 'herbs', 'potatoes', 'bread', 'cheese varieties', 
                 'cold cuts', 'mushrooms', 'cabbage'],
    dishes: ['pasta', 'risotto', 'coq au vin', 'schnitzel', 'paella', 'fish and chips', 'stew', 'soup'],
    methods: ['sautéing', 'braising', 'roasting', 'baking', 'poaching', 'sauce making'],
    spices: ['herbs (thyme, rosemary)', 'black pepper', 'paprika', 'bay leaves', 'nutmeg'],
    flavors: ['rich', 'creamy', 'herbal', 'wine-enhanced', 'comfort'],
    timing: { breakfast: 'regional varied', lunch: 'moderate', dinner: 'main social meal' },
    region: { northern: 'hearty warming', southern: 'lighter mediterranean influence' }
  }
};

export function identifyCulturalMarkers(meal: any) {
  const names = (meal.ingredients || []).map((i: any) => String(i.name || '').toLowerCase()).join(' ');
  const tags = (meal.tags || []).map((t: string) => t.toLowerCase()).join(' ');
  const instructions = (meal.instructions || []).join(' ').toLowerCase();
  const mealName = String(meal.name || '').toLowerCase();
  const bag = `${names} ${tags} ${instructions} ${mealName}`;
  
  const hits: { cuisine: string; score: number; matches: string[] }[] = [];
  
  for (const cuisine in ENHANCED_CUISINE_MARKERS) {
    const markers = ENHANCED_CUISINE_MARKERS[cuisine as keyof typeof ENHANCED_CUISINE_MARKERS];
    const allMarkers = [
      ...markers.ingredients,
      ...markers.dishes,
      ...markers.methods,
      ...markers.spices
    ];
    
    const matches = allMarkers.filter(marker => bag.includes(marker.toLowerCase()));
    const score = matches.length;
    
    if (score > 0) {
      hits.push({ cuisine, score, matches });
    }
  }
  
  return hits.sort((a, b) => b.score - a.score);
}

export function identifyPrimaryCuisine(meal: any, prefs: string[] = []) {
  const culturalHits = identifyCulturalMarkers(meal);
  
  // Check if any detected cuisine matches user preferences
  const prefHit = culturalHits.find(hit => prefs.includes(hit.cuisine));
  if (prefHit) return prefHit.cuisine;
  
  // Return highest scoring cuisine or user's first preference or default
  return culturalHits[0]?.cuisine || prefs[0] || 'modern';
}

// Enhanced cultural authenticity detection
export const detectCulturalAuthenticity = (
  meal: any,
  targetCuisine: keyof typeof ENHANCED_CUISINE_MARKERS
): {
  authenticityScore: number;
  authenticElements: string[];
  missingElements: string[];
  suggestions: string[];
} => {
  const markers = ENHANCED_CUISINE_MARKERS[targetCuisine];
  if (!markers) {
    return {
      authenticityScore: 0,
      authenticElements: [],
      missingElements: [],
      suggestions: ['Unknown cuisine type']
    };
  }

  const mealContent = [
    ...(meal.ingredients || []).map((i: any) => i.name?.toLowerCase() || ''),
    ...(meal.tags || []).map((t: string) => t.toLowerCase()),
    meal.name?.toLowerCase() || '',
    ...(meal.instructions || []).join(' ').toLowerCase().split(' ')
  ].join(' ');

  const authenticElements: string[] = [];
  const missingElements: string[] = [];

  // Check ingredients
  markers.ingredients.forEach(ingredient => {
    if (mealContent.includes(ingredient.toLowerCase())) {
      authenticElements.push(`ingredient: ${ingredient}`);
    }
  });

  // Check cooking methods
  markers.methods.forEach(method => {
    if (mealContent.includes(method.toLowerCase().split(' ')[0])) {
      authenticElements.push(`method: ${method}`);
    }
  });

  // Check spices
  markers.spices.forEach(spice => {
    if (mealContent.includes(spice.toLowerCase())) {
      authenticElements.push(`spice: ${spice}`);
    }
  });

  // Identify missing key elements for suggestions
  if (authenticElements.filter(e => e.startsWith('spice:')).length === 0) {
    missingElements.push('characteristic spices');
  }
  if (authenticElements.filter(e => e.startsWith('method:')).length === 0) {
    missingElements.push('traditional cooking methods');
  }

  const authenticityScore = Math.min(
    100,
    (authenticElements.length / Math.max(markers.ingredients.length * 0.3, 3)) * 100
  );

  const suggestions: string[] = [];
  if (authenticityScore < 70) {
    suggestions.push(`Consider adding ${markers.spices.slice(0, 2).join(' and ')}`);
    suggestions.push(`Try using ${markers.methods[0]} cooking method`);
    if (markers.ingredients.length > 0) {
      suggestions.push(`Include ${markers.ingredients.slice(0, 2).join(' or ')} for authenticity`);
    }
  }

  return {
    authenticityScore: Math.round(authenticityScore),
    authenticElements,
    missingElements,
    suggestions
  };
};

// Smart fusion cuisine detection
export const detectFusionOpportunities = (
  meal: any,
  userCuisinePreferences: string[]
): {
  fusionScore: number;
  fusionElements: string[];
  recommendations: string[];
} => {
  const detectedCuisines = identifyCulturalMarkers(meal);
  const fusionElements: string[] = [];
  const recommendations: string[] = [];

  // Check if meal already shows fusion elements
  if (detectedCuisines.length > 1) {
    fusionElements.push(`Fusion detected: ${detectedCuisines.slice(0, 2).map(c => c.cuisine).join(' + ')}`);
  }

  // Calculate fusion potential
  const fusionScore = Math.min(100, detectedCuisines.length * 30);

  // Generate fusion recommendations based on user preferences
  userCuisinePreferences.forEach(prefCuisine => {
    if (prefCuisine in ENHANCED_CUISINE_MARKERS) {
      const prefMarkers = ENHANCED_CUISINE_MARKERS[prefCuisine as keyof typeof ENHANCED_CUISINE_MARKERS];
      
      if (!detectedCuisines.some(d => d.cuisine === prefCuisine)) {
        recommendations.push(
          `Add ${prefMarkers.spices[0]} to incorporate ${prefCuisine} flavors`
        );
        recommendations.push(
          `Try ${prefMarkers.methods[0]} technique for ${prefCuisine} fusion`
        );
      }
    }
  });

  return {
    fusionScore,
    fusionElements,
    recommendations: recommendations.slice(0, 3) // Limit to top 3 recommendations
  };
};

// Regional preference detection
export const detectRegionalPreferences = (
  meal: any,
  userRegion: 'coastal' | 'inland' | 'mixed',
  primaryCuisine: keyof typeof ENHANCED_CUISINE_MARKERS
): {
  regionScore: number;
  appropriateness: 'high' | 'medium' | 'low';
  regionalElements: string[];
  suggestions: string[];
} => {
  const markers = ENHANCED_CUISINE_MARKERS[primaryCuisine];
  if (!markers?.region) {
    return {
      regionScore: 50,
      appropriateness: 'medium',
      regionalElements: [],
      suggestions: []
    };
  }

  const mealContent = [
    ...(meal.ingredients || []).map((i: any) => i.name?.toLowerCase() || ''),
    meal.name?.toLowerCase() || ''
  ].join(' ');

  const regionalElements: string[] = [];
  const suggestions: string[] = [];

  // Check seafood presence for coastal regions
  const hasSeafood = PROTEIN_MAP && Object.keys(PROTEIN_MAP).some(protein => 
    (PROTEIN_MAP[protein] === 'fish' || PROTEIN_MAP[protein] === 'seafood_other') && 
    mealContent.includes(protein)
  );

  let regionScore = 50; // Base score
  let appropriateness: 'high' | 'medium' | 'low' = 'medium';

  if (userRegion === 'coastal') {
    if (hasSeafood) {
      regionScore += 30;
      regionalElements.push('coastal seafood preference matched');
    } else {
      suggestions.push('Consider adding local seafood varieties');
    }
  } else if (userRegion === 'inland') {
    if (!hasSeafood) {
      regionScore += 20;
      regionalElements.push('inland protein preference matched');
    } else {
      regionScore -= 10;
      suggestions.push('Consider land-based proteins for inland preferences');
    }
  }

  // Determine appropriateness level
  if (regionScore >= 70) appropriateness = 'high';
  else if (regionScore < 40) appropriateness = 'low';

  return {
    regionScore: Math.max(0, Math.min(100, regionScore)),
    appropriateness,
    regionalElements,
    suggestions
  };
};

// Enhanced allergen detection with cultural context
export const ALLERGEN_MAP: Record<string, string[]> = {
  nuts: ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio', 'macadamia', 'brazil nut', 'pine nut'],
  peanuts: ['peanut', 'peanut butter', 'peanut oil', 'groundnut'],
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'ghee', 'lactose', 'dairy powder', 'paneer', 'feta'],
  eggs: ['egg', 'albumen', 'mayonnaise', 'aioli', 'lecithin', 'egg white', 'egg yolk'],
  soy: ['soy', 'tofu', 'tempeh', 'miso', 'edamame', 'soy sauce', 'soy lecithin', 'soy protein', 'tamari'],
  wheat: ['wheat', 'flour', 'breadcrumbs', 'semolina', 'farina', 'wheat starch', 'durum'],
  gluten: ['wheat', 'barley', 'rye', 'malt', 'spelt', 'semolina', 'malt vinegar', 'soy sauce', 'wheat starch'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'mackerel', 'anchovy', 'fish sauce', 'anchovy paste', 'worcestershire sauce'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'scallop', 'clam', 'mussel', 'krill', 'crayfish'],
  sesame: ['sesame', 'tahini', 'sesame oil', 'gomashio', 'sesame seed'],
  sulfites: ['sulfite', 'sulphite', 'wine', 'treated dried fruit', 'vinegar', 'dried vegetables']
};

export const containsAllergen = (ingredientName: string, allergen: