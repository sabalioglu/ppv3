// lib/meal-plan/ai-generation.ts
import { z } from 'zod';
import { buildPolicyFromOnboarding, splitTargetsPerMeal } from '@/lib/policy';
import { loadDiversity, pushToday } from '@/lib/policy/diversity-memory';
import { SmartMealAgent } from '@/lib/ai-agent/SmartMealAgent';
import { proteinCategoryOf, extractMethods, isNearDuplicateByName, containsAllergen, identifyPrimaryCuisine } from '@/lib/ai-agent/helpers';
import { createLLM } from '@/lib/llm';

import type { PantryItem, UserProfile, Meal } from '@/lib/meal-plan/types';

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

  const policy = buildPolicyFromOnboarding(userProfile);
  const perSlot = splitTargetsPerMeal(policy.targets, true)(mealType === 'snacks' ? 'snack' : mealType);

  const prevMeals = Array.isArray(previousMeals) ? previousMeals.filter(isMeal) : [];
  const prevNames = prevMeals.map(m=>m.name);

  const agent = new SmartMealAgent(userProfile as any);
  const prompt = agent.buildPrompt(mealType, pantryItems, prevMeals);

  const recent = await loadDiversity();
  const usedProteinCats = new Set(recent.flatMap(s => s.proteinCats));
  const usedMethods     = new Set(recent.flatMap(s => s.methods));

  let attempts = 0;
  const MAX = 3;

  while (attempts < MAX) {
    attempts++;
    const raw = await llm.generateMealJSON({ prompt });

    // Zod parse + fixups
    let parsed: any;
    try {
      parsed = MealSchema.parse(JSON.parse(raw));
    } catch (e:any) {
      if (attempts>=MAX) throw new Error('JSON_PARSE_FAILED: ' + e?.message);
      continue;
    }

    // Hard allergen / kcal bounds
    const allergenErr = buildHardAllergenCheck(parsed, policy.hard.allergens||[]);
    if (allergenErr) { if (attempts>=MAX) throw new Error('ALLERGEN: '+allergenErr); continue; }

    if (typeof parsed.calories === 'number') {
      const tgt = perSlot.kcal;
      const band = { min: Math.max(policy.hard.kcalBounds.min*0.2, tgt*0.7), max: Math.min(policy.hard.kcalBounds.max, tgt*1.3) };
      if (parsed.calories < band.min || parsed.calories > band.max) { if (attempts>=MAX) throw new Error('KCAL_OUT_OF_RANGE'); continue; }
    }

    // Variety checks
    if (isNearDuplicateByName(parsed.name, prevNames)) { if (attempts>=MAX) throw new Error('NAME_DUPLICATE'); continue; }

    const cat = proteinCategoryOf(parsed.ingredients || []);
    if (cat && usedProteinCats.has(cat)) { if (attempts>=MAX) throw new Error('PROTEIN_REPEAT'); continue; }

    const methods = extractMethods(parsed.instructions || []);
    if (methods.some(m => usedMethods.has(m))) { if (attempts>=MAX) throw new Error('METHOD_REPEAT'); continue; }

    // Passed all checks → build final Meal
    const mealId = `smart_ai_${mealType}_${Date.now()}`;
    const primaryCuisine = identifyPrimaryCuisine(parsed, userProfile?.cuisine_preferences || []);
    const meal: Meal = {
      id: mealId,
      name: parsed.name,
      ingredients: parsed.ingredients,
      calories: parsed.calories,
      protein: parsed.protein ?? 0,
      carbs: parsed.carbs ?? 0,
      fat: parsed.fat ?? 0,
      fiber: parsed.fiber ?? 0,
      instructions: parsed.instructions,
      tags: [...(parsed.tags||[]), 'smart_generated', primaryCuisine].filter(Boolean),
      emoji: '🍽️',
      category: mealType,
      source: 'ai_generated',
      created_at: new Date().toISOString()
    } as Meal;

    // Update diversity memory
    await pushToday({
      proteinCats: cat ? [cat] : [],
      cuisines: [primaryCuisine],
      methods
    });

    // Cache in store (best-effort)
    try {
      const { useMealPlanStore } = await import('./store');
      const { setAIMeal } = useMealPlanStore.getState();
      await setAIMeal(meal.id, meal);
    } catch {}

    return meal;
  }

  throw new Error('Failed to generate after retries');
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