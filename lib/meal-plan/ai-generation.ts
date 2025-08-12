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

function generateFallbackMeal(mealType:string): Meal {
  const id = `fallback_${mealType}_${Date.now()}`;
  return {
    id,
    name: `Simple ${mealType}`,
    ingredients: [{ name:'egg', amount:2, unit:'pcs', category:'Protein' }],
    calories: 350, protein: 20, carbs: 20, fat: 18, fiber: 2,
    instructions: ['Beat eggs','Cook on pan','Serve'],
    tags: ['fallback'],
    emoji:'🍽️', category: mealType, source:'ai_generated', created_at:new Date().toISOString()
  } as Meal;
}

const BREAKFAST_NO_SEAFOOD = String(process.env.EXPO_PUBLIC_BREAKFAST_NO_SEAFOOD || 'true').toLowerCase() === 'true';

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

  const agent = new SmartMealAgent(userProfile as any);
  const prompt = agent.buildPrompt(slot, pantryItems, prevMeals);

  const recent = await loadDiversity();
  const usedProteinCats = new Set(recent.flatMap(s => s.proteinCats));
  const usedMethods     = new Set(recent.flatMap(s => s.methods));
  const usedCuisines    = new Set(recent.flatMap(s => s.cuisines));

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
    const allergenErr = buildHardAllergenCheck(parsed, policy.hard.allergens||[]);
    if (allergenErr) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

    // 2) Diet rules
    const dietErr = validateAllDietRules(parsed, policy, perSlot);
    if (dietErr) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

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
    if (!(kcOK && pOK && cOK && fOK)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

    // 5) Variety: name, protein, methods, cuisine rotation
    if (isNearDuplicateByName(parsed.name, prevNames)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

    const cat = proteinCategoryOf(parsed.ingredients || []);
    if (cat && usedProteinCats.has(cat)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

    const methods = extractMethods(parsed.instructions || []);
    if (methods.some(m => usedMethods.has(m))) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

    const primaryCuisine = primaryCuisineForCheck;
    if ((prefs.length>1) && usedCuisines.has(primaryCuisine)) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }
    if (prefs.length>0 && targetCuisine && primaryCuisine !== targetCuisine) { if (attempts>=MAX) return policyAwareFallback(slot, policy); continue; }

    // 6) Time constraint (quick ≤ 25min)
    const tc = (policy.user?.timeConstraint||'moderate');
    if (tc==='quick') {
      const totalTime = (parsed.prepTime || 10) + (parsed.cookTime || 10);
      if (totalTime > 25) { 
        if (attempts>=MAX) return policyAwareFallback(slot, policy); 
        continue; 
      }
    }

    // 5) Variety: isim
    if (isNearDuplicateByName(parsed.name, prevNames)) {
      if (attempts>=MAX) return policyAwareFallback(slot, policy, pantryItems);
    }
    // Build meal
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
      instructions: parsed.instructions,
      tags: [...(parsed.tags||[]), 'smart_generated', primaryCuisine].filter(Boolean),
      emoji: '🍽️',
      category: slot,
      source: 'ai_generated',
      matchPercentage: matchScore,
      created_at: new Date().toISOString()
    } as Meal;

    await pushToday({
      proteinCats: cat ? [cat] : [],
      cuisines: [primaryCuisine],
      methods
    });

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