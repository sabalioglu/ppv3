// lib/policy/index.ts
export type NutritionTarget = { kcal:number; protein:number; carbs:number; fat:number };

export type CuisinePolicy = {
  weights: Record<string, number>;
  exploreRate: number;
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

export function buildPolicyFromOnboarding(user:any): MealPolicy {
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
    targets: macroSplit(targetKcal, health_goals)
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