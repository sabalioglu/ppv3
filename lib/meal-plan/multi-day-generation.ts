// Multi-day meal planning (weekly + monthly) built directly on the meal-generate
// edge function, isolated from the per-meal enhanced pipeline.
//   - Weekly  = ONE LLM call → 7 days (each day breakfast/lunch/dinner).
//   - Monthly = ONE LLM call → 30-day skeleton (meal names + calories only); a
//     single day is expanded on demand via expandSkeletonDay (lazy).
// Each generation consumes one ai_meal_plan quota unit (free monthly limit +
// premium fair-use ceiling), surfaced as MealPlanQuotaError on 402.
import { supabase } from '@/lib/supabase';
import { MealPlanQuotaError } from './enhanced-ai-generation';

export interface MealLite {
  name: string;
  calories: number;
  protein?: number;
}

export interface DayPlanLite {
  label: string; // e.g. "Day 1" / weekday
  breakfast: MealLite | null;
  lunch: MealLite | null;
  dinner: MealLite | null;
  totalCalories: number;
}

export interface MultiDayPlan {
  days: DayPlanLite[];
  generatedAt: string;
}

async function consumeQuota(): Promise<void> {
  const { data: quota, error } = await supabase.functions.invoke(
    'meal-plan-quota',
    { body: { consume: true } },
  );
  if (error) {
    const status = (error as any)?.context?.status;
    if (status === 402) throw new MealPlanQuotaError(false, 0, 0);
    throw new Error(`meal-plan-quota failed: ${error.message}`);
  }
  if (quota && quota.allowed === false) {
    throw new MealPlanQuotaError(
      !!quota.fairUse,
      quota.limit ?? 0,
      quota.used ?? 0,
    );
  }
}

async function callMealGenerate(system: string, prompt: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke('meal-generate', {
    body: { system, prompt, temperature: 0.3 },
  });
  if (error) throw new Error(`meal-generate failed: ${error.message}`);
  const text: string | undefined = data?.content;
  if (!text) throw new Error('meal-generate returned no content');
  // Strip code fences if the model wrapped the JSON.
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON in response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function pantryLine(pantryItems: any[]): string {
  const names = (pantryItems || [])
    .map((i) => i?.name)
    .filter(Boolean)
    .slice(0, 40);
  return names.length ? names.join(', ') : 'a basic pantry';
}

function constraintLine(userProfile: any): string {
  const allergens =
    userProfile?.dietary_restrictions || userProfile?.allergens || [];
  const diet = userProfile?.dietary_preferences || [];
  const cuisines = userProfile?.cuisine_preferences || [];
  const parts: string[] = [];
  if (allergens.length)
    parts.push(
      `ALLERGENS (never include any of these, HARD CONSTRAINT): ${allergens.join(', ')}`,
    );
  if (diet.length) parts.push(`Dietary preferences: ${diet.join(', ')}`);
  if (cuisines.length) parts.push(`Preferred cuisines: ${cuisines.join(', ')}`);
  return parts.length ? parts.join('. ') : 'No specific dietary constraints.';
}

const SYSTEM =
  'You are a meal planning chef. Use mostly the available pantry items, respect all dietary constraints, and never include any listed allergen. Always respond with valid JSON only, no prose.';

function parseDays(json: any, expected: number): DayPlanLite[] {
  const rawDays: any[] = Array.isArray(json?.days) ? json.days : [];
  const toMeal = (m: any): MealLite | null =>
    m && m.name
      ? {
          name: String(m.name),
          calories: Number(m.calories) || 0,
          protein: m.protein != null ? Number(m.protein) : undefined,
        }
      : null;
  return rawDays.slice(0, expected).map((d, i) => {
    const breakfast = toMeal(d.breakfast);
    const lunch = toMeal(d.lunch);
    const dinner = toMeal(d.dinner);
    const totalCalories =
      (breakfast?.calories || 0) +
      (lunch?.calories || 0) +
      (dinner?.calories || 0);
    return {
      label: String(d.label || d.day || `Day ${i + 1}`),
      breakfast,
      lunch,
      dinner,
      totalCalories,
    };
  });
}

// Weekly: one call, 7 days of breakfast/lunch/dinner with names + calories.
export async function generateWeeklyPlan(
  pantryItems: any[],
  userProfile: any,
): Promise<MultiDayPlan> {
  await consumeQuota();
  const prompt = `Create a 7-day meal plan.
Pantry: ${pantryLine(pantryItems)}.
Constraints: ${constraintLine(userProfile)}
Vary the meals across the week (no repeats). Respond ONLY with JSON:
{"days":[{"label":"Day 1","breakfast":{"name":"...","calories":0,"protein":0},"lunch":{"name":"...","calories":0,"protein":0},"dinner":{"name":"...","calories":0,"protein":0}}]}
Exactly 7 day objects.`;
  const json = await callMealGenerate(SYSTEM, prompt);
  return { days: parseDays(json, 7), generatedAt: new Date().toISOString() };
}

// Monthly: one call, 30-day skeleton (names + calories only).
export async function generateMonthlySkeleton(
  pantryItems: any[],
  userProfile: any,
): Promise<MultiDayPlan> {
  await consumeQuota();
  const prompt = `Create a 30-day meal plan SKELETON. Each day has breakfast, lunch, dinner with ONLY a dish name and estimated calories (no ingredients, no steps).
Pantry to favor: ${pantryLine(pantryItems)}.
Constraints: ${constraintLine(userProfile)}
Vary dishes across the month; avoid repeating the same dish more than twice. Respond ONLY with JSON:
{"days":[{"label":"Day 1","breakfast":{"name":"...","calories":0},"lunch":{"name":"...","calories":0},"dinner":{"name":"...","calories":0}}]}
Exactly 30 day objects.`;
  const json = await callMealGenerate(SYSTEM, prompt);
  return { days: parseDays(json, 30), generatedAt: new Date().toISOString() };
}

// Lazy expand: full ingredients + steps for the meals of a single skeleton day.
export async function expandSkeletonDay(
  day: DayPlanLite,
  userProfile: any,
): Promise<{
  breakfast?: any;
  lunch?: any;
  dinner?: any;
}> {
  const names = [day.breakfast?.name, day.lunch?.name, day.dinner?.name].filter(
    Boolean,
  );
  const prompt = `Provide full recipes (ingredients + step-by-step instructions) for these dishes: ${names.join(
    '; ',
  )}.
Constraints: ${constraintLine(userProfile)}
Respond ONLY with JSON:
{"breakfast":{"name":"...","ingredients":[{"name":"...","amount":"..."}],"steps":["..."],"calories":0},"lunch":{...},"dinner":{...}}`;
  return callMealGenerate(SYSTEM, prompt);
}
