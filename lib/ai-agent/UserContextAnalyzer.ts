// lib/ai-agent/UserContextAnalyzer.ts
import { UserProfile } from '@/lib/meal-plan/types';

export interface UserContext {
  healthProfile: HealthProfile;
  culturalProfile: CulturalProfile;
  nutritionalNeeds: NutritionalProfile;
  restrictions: RestrictionProfile;
  preferences: PreferenceProfile;
}

interface HealthProfile {
  calorieRange: { min: number; max: number };
  macroTargets: { protein: number; carbs: number; fat: number };
  healthPriorities: string[];
  riskFactors: string[];
}
interface CulturalProfile {
  primaryCuisines: string[];
  culturalRestrictions: string[];
  spicePreferences: 'mild' | 'medium' | 'spicy';
  authenticityLevel: 'fusion' | 'traditional' | 'modern';
}
interface NutritionalProfile {
  dailyCalories: number;
  mealDistribution: { breakfast: number; lunch: number; dinner: number; snack: number };
  nutrientFocus: string[];
  avoidanceList: string[];
}
interface RestrictionProfile {
  allergens: string[];
  dietaryRestrictions: string[];
}
interface PreferenceProfile {
  skillLevel: string;
  timeConstraints: string;
  adventurousness: 'conservative' | 'moderate' | 'adventurous';
}

export class UserContextAnalyzer {
  static analyzeUser(userProfile: UserProfile): UserContext {
    const health = this.analyzeHealthProfile(userProfile);
    return {
      healthProfile: health,
      culturalProfile: this.analyzeCulturalProfile(userProfile),
      nutritionalNeeds: this.analyzeNutritionalNeeds(userProfile, health),
      restrictions: this.analyzeRestrictions(userProfile),
      preferences: this.analyzePreferences(userProfile)
    };
  }

  private static analyzeHealthProfile(p: UserProfile): HealthProfile {
    const bmr = this.bmr(p);
    const total = bmr * this.act(p.activity_level);
    let adj = 1.0;
    const pri: string[] = []; const risks: string[] = [];

    if (p.health_goals?.includes('weight_loss')) { adj = 0.85; pri.push('calorie_deficit','high_protein'); }
    if (p.health_goals?.includes('muscle_gain')) { adj = 1.10; pri.push('high_protein'); }
    if (p.health_goals?.includes('heart_health')) { pri.push('omega3','low_sodium','fiber_rich'); }
    if (p.health_goals?.includes('blood_sugar_control')) { pri.push('low_glycemic','fiber_rich'); risks.push('high_sugar','refined_carbs'); }

    const kcal = total * adj;
    return {
      calorieRange: { min: Math.round(kcal*0.9), max: Math.round(kcal*1.1) },
      macroTargets: this.macros(p, kcal),
      healthPriorities: pri,
      riskFactors: risks
    };
  }

  private static analyzeCulturalProfile(p: UserProfile): CulturalProfile {
    const cuisines = p.cuisine_preferences || [];
    return {
      primaryCuisines: cuisines,
      culturalRestrictions: (p.dietary_preferences||[]).includes('halal') ? ['no_pork','no_alcohol'] :
                            (p.dietary_preferences||[]).includes('kosher') ? ['no_pork','no_shellfish'] : [],
      spicePreferences: (() => {
        const spicy = ['indian','thai','mexican','ethiopian','korean'].filter(c=>cuisines.includes(c)).length;
        const mild  = ['japanese','french','italian','german'].filter(c=>cuisines.includes(c)).length;
        if (spicy>mild) return 'spicy'; if (mild>spicy) return 'mild'; return 'medium';
      })(),
      authenticityLevel: cuisines.length>3 ? 'fusion' : cuisines.length===1 ? 'traditional' : 'modern'
    };
  }

  private static analyzeNutritionalNeeds(p: UserProfile, health: HealthProfile): NutritionalProfile {
    const daily = Math.round((health.calorieRange.min + health.calorieRange.max)/2);
    let dist = { breakfast:0.25, lunch:0.35, dinner:0.35, snack:0.05 };
    if (p.health_goals?.includes('weight_loss')) dist = { breakfast:0.30, lunch:0.40, dinner:0.25, snack:0.05 };
    if (p.activity_level==='very_active' || p.activity_level==='extra_active') dist = { breakfast:0.25,lunch:0.30,dinner:0.35,snack:0.10 };
    return {
      dailyCalories: daily,
      mealDistribution: {
        breakfast: Math.round(daily*dist.breakfast),
        lunch: Math.round(daily*dist.lunch),
        dinner: Math.round(daily*dist.dinner),
        snack: Math.round(daily*dist.snack)
      },
      nutrientFocus: health.healthPriorities,
      avoidanceList: health.riskFactors
    };
  }

  private static analyzeRestrictions(p: UserProfile): RestrictionProfile {
    return { allergens: p.dietary_restrictions || [], dietaryRestrictions: p.dietary_preferences || [] };
  }
  private static analyzePreferences(p: UserProfile): PreferenceProfile {
    const count = p.cuisine_preferences?.length || 0;
    return {
      skillLevel: p.cooking_skill_level || 'beginner',
      timeConstraints: (p.activity_level==='very_active'||p.activity_level==='extra_active') ? 'quick' : 'moderate',
      adventurousness: count>=5 ? 'adventurous' : count>=3 ? 'moderate' : 'conservative'
    };
  }

  // helpers
  private static bmr(p: UserProfile){ if(!p.age||!p.height_cm||!p.weight_kg||!p.gender) return 1800;
    return p.gender==='male' ? (10*p.weight_kg)+(6.25*p.height_cm)-(5*p.age)+5 : (10*p.weight_kg)+(6.25*p.height_cm)-(5*p.age)-161; }
  private static act(l?:string){ return ({sedentary:1.2, lightly_active:1.375, moderately_active:1.55, very_active:1.725, extra_active:1.9} as any)[l||''] || 1.4; }
  private static macros(p:UserProfile, kcal:number){
    let pr=0.20, cr=0.50, fr=0.30;
    if (p.health_goals?.includes('muscle_gain')) { pr=0.30; cr=0.40; fr=0.30; }
    if (p.health_goals?.includes('weight_loss')) { pr=0.35; cr=0.35; fr=0.30; }
    if (p.dietary_preferences?.includes('keto')) { pr=0.25; cr=0.05; fr=0.70; }
    return { protein: Math.round((kcal*pr)/4), carbs: Math.round((kcal*cr)/4), fat: Math.round((kcal*fr)/9) };
  }
}