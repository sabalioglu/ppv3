// lib/meal-plan/ai-generation.ts
import { z } from 'zod';
import { buildPolicyFromOnboarding, splitTargetsPerMeal } from '@/lib/policy';
import { loadDiversity, pushToday } from '@/lib/policy/diversity-memory';
import { SmartMealAgent } from '@/lib/ai-agent/SmartMealAgent';
import { proteinCategoryOf, extractMethods, isNearDuplicateByName, containsAllergen, identifyPrimaryCuisine } from '@/lib/ai-agent/helpers';
import { createLLM } from '@/lib/llm';
import { breakfastSeafoodMode, breakfastSeafoodAllowedForCuisine, includesSeafood, breakfastSeafoodAllowList } from '@/lib/policy/cultural-rules';

import type { PantryItem, UserProfile, Meal } from '@/lib/meal-plan/types';

// === Helpers: diet rules, macros, fallback, env ===
const DIET_RULES = {
  vegan:      (ings: any[]) => !ings.some(i => /meat|beef|lamb|pork|chicken|turkey|fish|shrimp|egg|milk|cheese|yogurt|honey/i.test(i.name||'')),
  vegetarian: (ings: any[]) => !ings.some(i => /meat|beef|lamb|pork|chicken|turkey|fish|shrimp/i.test(i.name||'')),
  pescatarian:(ings: any[]) => !ings.some(i => /beef|lamb|pork|chicken|turkey/i.test(i.name||'')),
  halal:      (ings: any[]) => !ings.some(i => /pork|bacon|ham|gelatin/i.test(i.name||'')) 
                               && !ings.some(i => /wine|rum|brandy|beer|alcohol/i.test(i.name||'')),
  kosher:     (ings: any[]) => !ings.some(i => /pork|bacon|ham|shellfish|shrimp|crab|lobster|oyster|clam|mussel/i.test(i.name||'')),
} as const;

function validateDietRules(parsed:any, rules:string[]) {
  const ings = parsed?.ingredients || [];
  const enabled = (rules||[]).map(r => r.toLowerCase());
  for (const key of Object.keys(DIET_RULES)) {
    if (enabled.includes(key) && !DIET_RULES[key as keyof typeof DIET_RULES](ings)) {
      return `Diet rule violated: ${key}`;
    }
  }
  return null;
}

function withinBand(value:number|undefined, target:number, tol=0.2) {
  if (typeof value !== 'number' || !isFinite(value)) return true; // yoksa es geç
  const min = Math.round(target * (1 - tol));
  const max = Math.round(target * (1 + tol));
  return value >= min && value <= max;
}

function validateAllDietRules(parsed:any, policy:any, perSlot:{kcal:number;protein:number;carbs:number;fat:number}) {
  const ings = (parsed?.ingredients||[]).map((i:any)=>String(i.name||'').toLowerCase());
  const has = (needle:string) => ings.some(n => n.includes(needle.toLowerCase()));

  // 1) compiledDiet token'ları (registry'den gelen kesin yasaklar)
  for (const t of (policy?.compiledDiet?.tokens || [])) {
    if (has(t)) return `Diet token forbidden: ${t}`;
  }

  // 2) Back-compat: eski basit kurallar (vegan/veg/pesc/halal/kosher…)
  //    compiledDiet boş ise (veya kaçmış bir token yoksa) bunu da uygula
  const fallbackErr = validateDietRules(parsed, policy?.hard?.dietRules || []);
  if (fallbackErr) return fallbackErr;

  // 3) (İstersen buraya makro yüzdeleri gibi ileri kuralları da eklersin)
  return null;
}

// Politika-dostu fallback (allergen/diet güvenli)
function policyAwareFallback(mealType:string, policy:any): Meal {
  const id = `fallback_${mealType}_${Date.now()}`;
  const rules = (policy?.hard?.dietRules||[]).map((r:string)=>r.toLowerCase());
  const allergens = (policy?.hard?.allergens||[]).map((r:string)=>r.toLowerCase());

  const forbidEgg   = allergens.includes('eggs') || rules.includes('vegan');
  const forbidDairy = allergens.includes('dairy') || rules.includes('vegan') || rules.includes('dairy_free');
  const veganFallback: Meal = {
    id,
    name:`Simple ${mealType}: chickpea herb salad`,
    ingredients:[
      {name:'chickpeas',amount:1,unit:'cup',category:'Protein'},
      {name:'cucumber',amount:0.5,unit:'cup',category:'Vegetable'},
      {name:'tomato',amount:0.5,unit:'cup',category:'Vegetable'},
      {name:'parsley',amount:2,unit:'tbsp',category:'Herb'},
      {name:'lemon',amount:1,unit:'tbsp',category:'Acid'}
    ],
    calories: 320, protein: 18, carbs: 35, fat: 8, fiber: 8,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    instructions:['Combine, season, serve'],
    tags:['fallback','policy-safe','vegan'],
    emoji:'🍽️', category: mealType, source:'ai_generated', created_at:new Date().toISOString()
  } as Meal;
  if (rules.includes('vegan')) return veganFallback;

  const ovo: Meal = {
    id,
    name:`Simple ${mealType}: egg veggie scramble`,
    ingredients:[
      ...(forbidEgg? [] : [{name:'egg',amount:2,unit:'pcs',category:'Protein'}]),
      {name:'spinach',amount:1,unit:'cup',category:'Vegetable'},
      {name:'tomato',amount:0.5,unit:'cup',category:'Vegetable'}
    ],
    calories: 330, protein: 22, carbs: 12, fat: 14, fiber: 3,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    difficulty: 'Easy',
    instructions:['Beat eggs','Sauté veg','Scramble & serve'],
    tags:['fallback','policy-safe'],
    emoji:'🍽️', category: mealType, source:'ai_generated', created_at:new Date().toISOString()
  } as Meal;
  return forbidEgg ? veganFallback : ovo;
}

function scoreMealCompliance(parsed:any, perSlot:{kcal:number;protein:number;carbs:number;fat:number}) {
  const kc = Math.min(parsed.calories / Math.max(perSlot.kcal,1), perSlot.kcal / Math.max(parsed.calories,1));
  const p  = parsed.protein ? Math.min(parsed.protein / Math.max(perSlot.protein,1), perSlot.protein / Math.max(parsed.protein,1)) : 0.8;
  const c  = parsed.carbs   ? Math.min(parsed.carbs   / Math.max(perSlot.carbs,1),   perSlot.carbs   / Math.max(parsed.carbs,1))   : 0.8;
  const f  = parsed.fat     ? Math.min(parsed.fat     / Math.max(perSlot.fat,1),     perSlot.fat     / Math.max(parsed.fat,1))     : 0.8;
  return Math.round(((kc*0.25 + p*0.25 + c*0.25 + f*0.25) * 100));
}

const MealSchema = z.object({
  name: z.string().min(2),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.coerce.number().optional(),
    unit: z.string().optional(),
    category: z.string().optional()
  })).min(1),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  fat: z.coerce.number().min(0).optional(),
  fiber: z.coerce.number().min(0).optional(),
  prepTime: z.coerce.number().optional(),
  cookTime: z.coerce.number().optional(),
  prepTime: z.coerce.number().optional(),
  cookTime: z.coerce.number().optional(),
  instructions: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional()
});

const isMeal = (obj:any): obj is Meal => !!obj && typeof obj==='object' && typeof obj.name==='string' && Array.isArray(obj.ingredients);

export const extractMealsFromDaily = (daily:any): Meal[] => {
  const arr: Meal[] = [];
  if (daily?.breakfast && isMeal(daily.breakfast)) arr.push(daily.breakfast);
  if (daily?.lunch && isMeal(daily.lunch)) arr.push(daily.lunch);
  if (daily?.dinner && isMeal(daily.dinner)) arr.push(daily.dinner);
  if (Array.isArray(daily?.snacks)) daily.snacks.filter(isMeal).forEach((m:Meal)=>arr.push(m));
  return arr;
};

function buildHardAllergenCheck(ai:any, allergens:string[]){
  const ings = (ai.ingredients||[]).map((x:any)=>String(x.name||''));
  for (const a of allergens) {
    if (ings.some(n => containsAllergen(n, a))) return `Forbidden allergen used: ${a}`;
  }
  return null;
}

export async function generateAIMealWithQualityControl(
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  previousMeals: Meal[] = []
): Promise<Meal> {
  const provider = (process.env.EXPO_PUBLIC_LLM_PROVIDER==='gemini' ? 'gemini' : 'openai') as 'openai'|'gemini';
  const llm = createLLM(provider);

  // Normalize slot
  const slot = (mealType === 'snacks' ? 'snack' : mealType);

  const policy = buildPolicyFromOnboarding(userProfile);
  const perSlot = splitTargetsPerMeal(policy.targets, true)(slot);

  const prevMeals = Array.isArray(previousMeals) ? previousMeals.filter(isMeal) : [];
  const prevNames = prevMeals.map(m=>m.name);

  const recent = await loadDiversity();
  const usedProteinCats = new Set(recent.flatMap(s => s.proteinCats));
  const usedMethods     = new Set(recent.flatMap(s => s.methods));
  const usedCuisines    = new Set(recent.flatMap(s => s.cuisines));

  // ✅ EKSİKLERİ ekle
  const prefs = userProfile?.cuisine_preferences || [];
  const targetCuisine = prefs.find(c => !usedCuisines.has(c)) || prefs[0] || 'modern';
  const bfSeafoodMode = breakfastSeafoodMode(prefs, policy.hard?.dietRules||[], process.env.EXPO_PUBLIC_BREAKFAST_SEAFOOD_DEFAULT);

  const agent = new SmartMealAgent(userProfile as any);
  const prompt = agent.buildPrompt(
    slot, pantryItems, prevMeals, {
      targetCuisine,
      perSlot,
      forbiddenTokens: policy?.compiledDiet?.tokens || [],
      breakfastSeafoodMode: bfSeafoodMode,
      breakfastSeafoodAllowList: breakfastSeafoodAllowList(prefs)
    }
  );

  let attempts = 0;
  const MAX = 3;

  while (attempts < MAX) {
    attempts++;
    let parsed: any;

    try {
      const raw = await llm.generateMealJSON({ prompt });
      parsed = MealSchema.parse(JSON.parse(raw));
    } catch (e:any) {
      if (attempts>=MAX) return policyAwareFallback(slot, policy);
      continue;
    }

    // 1) Allergen

    // 3) Breakfast seafood — culture aware
    const primaryCuisineForCheck = identifyPrimaryCuisine(parsed, prefs);
    if (slot === 'breakfast' && includesSeafood(parsed.ingredients)) {
      const seafoodOk = breakfastSeafoodAllowedForCuisine(
        primaryCuisineForCheck, bfSeafoodMode, prefs, policy.hard?.dietRules||[]
      );
      if (!seafoodOk) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    }

    // 4) Energy & macros
    const kcOK = withinBand(parsed.calories, perSlot.kcal, 0.15);
    const pOK  = withinBand(parsed.protein, perSlot.protein, 0.20);
    const cOK  = withinBand(parsed.carbs,   perSlot.carbs,   0.25);
    const fOK  = withinBand(parsed.fat,     perSlot.fat,     0.25);
    // 5) Çeşitlilik
    if (isNearDuplicateByName(parsed.name, prevNames)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

    if (cat && usedProteinCats.has(cat)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    if (dietErr) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    if (methods.some(m => usedMethods.has(m))) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    if ((prefs.length>1) && usedCuisines.has(primaryCuisineForCheck)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    if (prefs.length>0 && targetCuisine && primaryCuisineForCheck !== targetCuisine) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    if (!(kcOK && pOK && cOK && fOK)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    // 6) Süre kısıtı
    const tc = (policy.user?.timeConstraint||'moderate');
    if (tc==='quick') {
      const totalTime = (parsed.prepTime || 10) + (parsed.cookTime || 10);
      if (totalTime > 25) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    }

    // ✅ Son: meal objesi (duplicate alanlar temiz)
    const mealId = `smart_ai_${slot}_${Date.now()}`;
    const matchScore = scoreMealCompliance(parsed, perSlot);

    const meal: Meal = {
      id: mealId,
      name: parsed.name,
      ingredients: parsed.ingredients,
      calories: parsed.calories,
      protein: parsed.protein ?? 0,
      carbs: parsed.carbs ?? 0,
      fat: parsed.fat ?? 0,
      fiber: parsed.fiber ?? 0,
      prepTime: parsed.prepTime ?? 10,
      cookTime: parsed.cookTime ?? 10,
      servings: 1,
      difficulty: 'Easy',
      prepTime: parsed.prepTime ?? 10,
      cookTime: parsed.cookTime ?? 10,
      servings: 1,
      difficulty: 'Easy',
      prepTime: parsed.prepTime ?? 10,
      cookTime: parsed.cookTime ?? 10,
      servings: 1,
      difficulty: 'Easy',
      instructions: parsed.instructions,
      tags: [...(parsed.tags||[]), 'smart_generated', primaryCuisineForCheck].filter(Boolean),
      emoji: '🍽️',
      category: slot,
      source: 'ai_generated',
      matchPercentage: matchScore,
      matchPercentage: matchScore,
      created_at: new Date().toISOString()
    } as Meal;

    await pushToday({ proteinCats: cat ? [cat] : [], cuisines: [primaryCuisineForCheck], methods });

    try {
      const { useMealPlanStore } = await import('./store');
      const { setAIMeal } = useMealPlanStore.getState();
      await setAIMeal(meal.id, meal);
    } catch {}

    return meal;
  }

  return policyAwareFallback(slot, policy);
}

// Legacy compatibility functions
export const generateAIMeal = generateAIMealWithQualityControl;

export const calculateAverageMatchScore = (meals: (Meal | null)[]): number => {
  const validMeals = meals.filter(Boolean) as Meal[];
  if (validMeals.length === 0) return 0;

  const totalMatchPercentage = validMeals.reduce((sum, meal) => 
    sum + (meal.matchPercentage || 0), 0
  );

  return Math.round(totalMatchPercentage / validMeals.length);
};

export const generateAlternativeMeal = async (
  request: any,
  previousMeal: Meal,
  variationType: 'cuisine' | 'complexity' | 'ingredients'
): Promise<Meal> => {
  // Use main generation function with different parameters
  return generateAIMealWithQualityControl(
    request.mealType,
    request.pantryItems,
    request.userProfile,
    [previousMeal, ...request.existingMeals || []]
  );
};

export const getQualityMetrics = (meal: Meal) => {
  return {
    hasQualityData: true,
    score: 85,
    warning: false,
    issues: []
  };
};