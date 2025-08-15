// lib/policy/index.ts
import { compileDietPolicy } from './diet-registry';

export type NutritionTarget = { kcal:number; protein:number; carbs:number; fat:number };

export type CuisinePolicy = {
  weights: Record<string, number>;
  exploreRate: number;
};

export type CulturalProfile = {
  primaryCuisine: string;
  region: 'coastal' | 'inland' | 'urban' | 'rural';
  religiousRestrictions: string[];
  culturalPreferences: string[];
};

export type HierarchicalConstraints = {
  level1_hard: string[];
  level2_cultural: string[];
  level3_regional: string[];
  level4_personal: string[];
};

export type MealPolicy = {
  hard: {
    allergens: string[];
    dietRules: string[];
    kcalBounds: { min:number; max:number };
  };
  soft: {
    cuisine: CuisinePolicy;
    methodsToVary: string[];
    pantryFirst: boolean;
  };
  user: {
    skill: 'beginner'|'intermediate'|'advanced'|'expert';
    timeConstraint: 'quick'|'moderate'|'none';
  };
  targets: NutritionTarget;
  compiledDiet?: {
    picked: string[];
    tokens: string[];
    restrictions: Record<string, string[]>;
  };
  culturalProfile?: CulturalProfile;
  hierarchicalConstraints?: HierarchicalConstraints;
  culturalIntelligence?: {
    primaryCuisine: string;
    regionalContext: 'coastal' | 'inland' | 'urban' | 'rural';
    religiousConstraints: string[];
    culturalScoring: boolean;
  };
};

// Cultural pattern definitions
const CULTURAL_BREAKFAST_PATTERNS: Record<string, string[]> = {
  turkish: ['cheese', 'olives', 'tomatoes', 'cucumber', 'eggs', 'bread'],
  japanese: ['rice', 'miso_soup', 'fish', 'nori', 'pickles'],
  indian: ['paratha', 'dosa', 'idli', 'chai', 'curry'],
  mediterranean: ['yogurt', 'honey', 'fruits', 'nuts', 'bread'],
  american: ['eggs', 'bacon', 'toast', 'pancakes', 'cereal'],
  chinese: ['congee', 'youtiao', 'soy_milk', 'dumplings'],
  mexican: ['tortillas', 'beans', 'eggs', 'salsa', 'avocado']
};

const REGIONAL_SEAFOOD_PATTERNS: Record<string, string[]> = {
  turkish_coastal: ['sea_bass', 'sea_bream', 'anchovies', 'mussels', 'calamari'],
  turkish_inland: ['trout', 'carp', 'limited_seafood'],
  japanese_coastal: ['tuna', 'salmon', 'mackerel', 'shellfish', 'seaweed'],
  mediterranean_coastal: ['octopus', 'sardines', 'shrimp', 'clams'],
  default: []
};

const clamp = (x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));
const round = (x:number,step=5)=>Math.round(x/step)*step;

function mifflinStJeor({gender, weight_kg, height_cm, age}:{gender:string,weight_kg:number,height_cm:number,age:number}) {
  const s = gender === 'female' ? -161 : 5;
  return 10*weight_kg + 6.25*height_cm - 5*age + s;
}

function activityFactor(level:string){
  return ({
    sedentary:1.2, lightly_active:1.375, moderately_active:1.55,
    very_active:1.725, extra_active:1.9
  } as any)[level] ?? 1.35;
}

function applyGoal(tdee:number, goals:string[]){
  const wantsLoss = goals?.includes('weight_loss');
  const wantsGain = goals?.includes('muscle_gain');
  if (wantsLoss && !wantsGain) return tdee*0.85;
  if (wantsGain && !wantsLoss) return tdee*1.10;
  return tdee;
}

function macroSplit(kcal:number, goals:string[]=[]): NutritionTarget {
  const pCals = goals.includes('weight_loss') ? 0.30 : goals.includes('muscle_gain') ? 0.25 : 0.22;
  const fCals = goals.includes('low_fat') ? 0.20 : 0.28;
  const cCals = 1 - (pCals + fCals);
  const protein = round((kcal*pCals)/4);
  const fat     = round((kcal*fCals)/9);
  const carbs   = round((kcal*cCals)/4);
  return { kcal: round(kcal,10), protein, carbs, fat };
}

// Helper functions for cultural profiling
const inferPrimaryCuisine = (user: any): string => {
  if (user.cultural_background) {
    return user.cultural_background.toLowerCase();
  }
  if (user.cuisine_preferences?.length > 0) {
    return user.cuisine_preferences[0].toLowerCase();
  }
  return 'mediterranean'; // default
};

const inferRegion = (location?: string): 'coastal' | 'inland' | 'urban' | 'rural' => {
  if (!location) return 'urban';
  
  const coastalKeywords = ['coast', 'beach', 'sea', 'ocean', 'port', 'bay'];
  const ruralKeywords = ['village', 'farm', 'countryside', 'rural'];
  const locationLower = location.toLowerCase();
  
  if (coastalKeywords.some(k => locationLower.includes(k))) return 'coastal';
  if (ruralKeywords.some(k => locationLower.includes(k))) return 'rural';
  
  // Could integrate with actual geographic data
  return 'urban';
};

const parseReligiousRestrictions = (user: any): string[] => {
  const restrictions: string[] = [];
  
  if (user.religious_dietary) {
    const religion = user.religious_dietary.toLowerCase();
    if (religion === 'halal' || religion === 'muslim') {
      restrictions.push('no_pork', 'halal_meat_only', 'no_alcohol');
    } else if (religion === 'kosher' || religion === 'jewish') {
      restrictions.push('no_pork', 'no_shellfish', 'kosher_certified');
    } else if (religion === 'hindu') {
      restrictions.push('no_beef', 'vegetarian_preferred');
    }
  }
  
  return restrictions;
};

const parseCulturalPreferences = (user: any): string[] => {
  const preferences: string[] = [];
  
  if (user.cultural_preferences) {
    preferences.push(...user.cultural_preferences);
  }
  
  // Add meal timing preferences based on culture
  if (user.cultural_background) {
    const culture = user.cultural_background.toLowerCase();
    if (['spanish', 'italian', 'greek'].includes(culture)) {
      preferences.push('late_dinner', 'light_breakfast');
    } else if (['turkish', 'middle_eastern'].includes(culture)) {
      preferences.push('substantial_breakfast', 'tea_culture');
    }
  }
  
  return preferences;
};

const buildCulturalProfile = (user: any): CulturalProfile => {
  return {
    primaryCuisine: inferPrimaryCuisine(user),
    region: inferRegion(user.location),
    religiousRestrictions: parseReligiousRestrictions(user),
    culturalPreferences: parseCulturalPreferences(user)
  };
};

const buildHierarchicalConstraints = (profile: CulturalProfile, user: any): HierarchicalConstraints => {
  const culturalBreakfast = CULTURAL_BREAKFAST_PATTERNS[profile.primaryCuisine] || [];
  const regionalSeafood = REGIONAL_SEAFOOD_PATTERNS[`${profile.primaryCuisine}_${profile.region}`] || 
                         REGIONAL_SEAFOOD_PATTERNS.default;
  
  return {
    level1_hard: profile.religiousRestrictions,
    level2_cultural: culturalBreakfast,
    level3_regional: regionalSeafood,
    level4_personal: user.personal_preferences || []
  };
};

const buildBasicPolicy = (user: any): MealPolicy => {
  const {
    gender='male', weight_kg=75, height_cm=175, age=30,
    activity_level='lightly_active',
    health_goals=[], dietary_restrictions=[], dietary_preferences=[],
    cuisine_preferences=[], cooking_skill_level='beginner'
  } = user || {};

  const bmr  = mifflinStJeor({gender,weight_kg,height_cm,age});
  const tdee = bmr * activityFactor(activity_level);
  const targetKcal = clamp(applyGoal(tdee, health_goals), 1200, 4000);

  const selected = (cuisine_preferences ?? []) as string[];
  const base = selected.length ? 0.8/selected.length : 0;
  const weights: Record<string,number> = {};
  selected.forEach(k => { weights[k] = base; });
  const cuisine: CuisinePolicy = { weights, exploreRate: 0.2 };

  const dietRules = (dietary_preferences ?? []) as string[];
  const compiled = compileDietPolicy(dietRules);

  return {
    hard: {
      allergens: dietary_restrictions ?? [],
      dietRules,
      kcalBounds: { min: Math.round(targetKcal*0.9), max: Math.round(targetKcal*1.1) }
    },
    soft: {
      cuisine,
      methodsToVary: ['grill','bake','saute','steam','stir-fry','roast'],
      pantryFirst: true
    },
    user: {
      skill: (cooking_skill_level || 'beginner'),
      timeConstraint: 'moderate'
    },
    targets: macroSplit(targetKcal, health_goals),
    compiledDiet: compiled
  };
};

// Enhanced version with cultural profiling
export function buildPolicyFromOnboarding(user: any): MealPolicy {
  const basePolicy = buildBasicPolicy(user);
  
  // NEW: Cultural intelligence layer
  const culturalProfile = buildCulturalProfile(user);
  const hierarchicalConstraints = buildHierarchicalConstraints(culturalProfile, user);
  
  return {
    ...basePolicy,
    culturalProfile,
    hierarchicalConstraints,
    culturalIntelligence: {
      primaryCuisine: culturalProfile.primaryCuisine,
      regionalContext: culturalProfile.region,
      religiousConstraints: culturalProfile.religiousRestrictions,
      culturalScoring: true
    }
  };
}

export function splitTargetsPerMeal(targets: NutritionTarget, includeSnack=true){
  const slots = includeSnack ? ['breakfast','lunch','dinner','snack'] : ['breakfast','lunch','dinner'];
  const weights = includeSnack ? [0.25,0.35,0.35,0.05] : [0.3,0.35,0.35];
  return (slot:string) => {
    const i = slots.indexOf(slot);
    const w = weights[i] ?? 0.25;
    return {
      kcal: Math.round(targets.kcal*w),
      protein: Math.round(targets.protein*w),
      carbs: Math.round(targets.carbs*w),
      fat: Math.round(targets.fat*w),
    };
  };
}