// lib/ai-agent/SmartMealAgent.ts
import { UserContextAnalyzer, UserContext } from './UserContextAnalyzer';
import { identifyPrimaryCuisine } from './helpers';
import type { UserProfile, PantryItem, Meal } from '@/lib/meal-plan/types';

export class SmartMealAgent {
  private userContext: UserContext;
  constructor(userProfile: UserProfile) {
    this.userContext = UserContextAnalyzer.analyzeUser(userProfile);
  }
    previousMeals: Meal[],
    opts?: { targetCuisine?: string; perSlot?: { kcal:number; protein:number; carbs:number; fat:number } }
  buildPrompt(mealType: string, pantry: PantryItem[], previousMeals: Meal[]) {
    const u = this.userContext;
    const per = opts?.perSlot;
    const goal = per?.kcal ?? u.nutritionalNeeds.mealDistribution[mealType as keyof typeof u.nutritionalNeeds.mealDistribution];

    const prevNames = previousMeals.map(m=>m.name).join(', ');
    const usedMain = previousMeals.flatMap(m => (m.ingredients||[]).slice(0,2).map(i=>i.name)).join(', ');

    const HARD = [
      `MEAL_KCAL_TARGET: ${goal}`,
      `MACROS_TARGET_PER_SLOT: ${per ? `${per.protein}P/${per.carbs}C/${per.fat}F` : 'derive from distribution'}`,
      `TARGET_CUISINE: ${opts?.targetCuisine || (u.culturalProfile.primaryCuisines[0] || 'modern')} (MUST MATCH)`,
      `DIET_RULES: ${u.restrictions.dietaryRestrictions.join(', ') || 'none'}`,
      `ALLERGENS_FORBIDDEN: ${u.restrictions.allergens.join(', ') || 'none'}`,
    ].join('\n');

    const STYLE = [
      `CUISINES_PREF: ${u.culturalProfile.primaryCuisines.join(', ') || 'open'}`,
      `SPICE: ${u.culturalProfile.spicePreferences}`,
      `AUTHENTICITY: ${u.culturalProfile.authenticityLevel}`,
      `SKILL: ${u.preferences.skillLevel} | TIME: ${u.preferences.timeConstraints}`,
    ].join('\n');

    const VARIETY = [
      `AVOID_NAMES: ${prevNames || 'none'}`,
      `AVOID_MAIN_INGREDIENTS: ${usedMain || 'none'}`,
      `VARY_COOK_METHODS: yes`,
    ].join('\n');

    const PANTRY = pantry.map(p => `${p.name} (${p.quantity} ${p.unit||''})`).join(', ');

    const SCHEMA = `Return ONLY JSON:
{
  "name": string,
  "ingredients": [{"name": string, "amount": number, "unit": string, "category": string}],
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "instructions": [string],
  "tags": [string]
}`;

    return [
      `MEAL_TYPE: ${mealType}`,
      'HARD_RULES:\n'+HARD,
      'STYLE:\n'+STYLE,
      'VARIETY:\n'+VARIETY,
      `PANTRY:\n${PANTRY || 'empty'}`,
      SCHEMA
    ].join('\n\n');
  }

  pickPrimaryCuisineFrom(meal:any) {
    return identifyPrimaryCuisine(meal, this.userContext.culturalProfile.primaryCuisines||[]);
  }

  getContext() { return this.userContext; }
}