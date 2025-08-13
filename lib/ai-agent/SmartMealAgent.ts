// lib/agents/smart-meal-agent.ts
import { UserContextAnalyzer, UserContext } from '../ai-agent/UserContextAnalyzer';
import { identifyPrimaryCuisine } from '../ai-agent/helpers';

// ✅ Düzeltilmiş import - api-clients/types kullanıyoruz
import type { 
  UserProfile, 
  PantryItem, 
  Meal,
  MealPolicy,
  UserBehaviorProfile,
  CulturalLearningModel,
  AgentLearningData
} from '../meal-plan/api-clients/types';

export class SmartMealAgent {
  private userContext: UserContext;
  private policy: MealPolicy | null = null;
  private learningData: AgentLearningData | null = null;

  constructor(userProfile: UserProfile) {
    this.userContext = UserContextAnalyzer.analyzeUser(userProfile);
    this.initializePolicy(userProfile);
  }

  buildPrompt(
    mealType: string, 
    pantry: PantryItem[], 
    previousMeals: Meal[],
    opts?: { targetCuisine?: string; perSlot?: { kcal:number; protein:number; carbs:number; fat:number } }
  ) {
    this.policy = {
      name: 'smart_agent_policy',
      dietaryRestrictions: userProfile.dietary_restrictions || [],
      allergens: userProfile.allergens || [],
      targetCalories: 2000, // Default, will be calculated per meal
      minPantryUsage: 0.8,
      cuisines: userProfile.cuisine_preferences || [],
      culturalConstraints: this.detectCulturalConstraints(userProfile),
      behaviorHints: {
        preferredIngredients: [],
        avoidedIngredients: [],
        preferredComplexity: 'moderate',
        preferredCookingTime: 'moderate',
        flavorProfiles: [],
        texturePreferences: []
      }
    };
  }

  private detectCulturalConstraints(userProfile: UserProfile): string[] {
    const constraints: string[] = [];
    
    // Add cultural rules based on user preferences
    if (userProfile.cuisine_preferences?.includes('japanese')) {
      constraints.push('no_heavy_breakfast');
    }
    if (userProfile.cuisine_preferences?.includes('mediterranean')) {
      constraints.push('olive_oil_preferred');
    }
    
    return constraints;
  }

  buildPrompt(
    mealType: string, 
    pantry: PantryItem[], 
    previousMeals: Meal[],
    opts?: {
      targetCuisine?: string;
      perSlot?: { kcal: number; protein: number; carbs: number; fat: number };
      forbiddenTokens?: string[];
      breakfastSeafoodMode?: 'allow' | 'avoid' | 'contextual';
      breakfastSeafoodAllowList?: string[];
    }
  ): string {
    const u = this.userContext;
    const goal = opts?.perSlot?.kcal ?? 
      u.nutritionalNeeds.mealDistribution[mealType as keyof typeof u.nutritionalNeeds.mealDistribution];

    const prevNames = previousMeals.map(m => m.name).join(', ');
    const usedMain = previousMeals
      .flatMap(m => (m.ingredients || []).slice(0, 2).map(i => i.name))
      .join(', ');

    // Apply policy constraints
    const policyConstraints = this.policy ? [
      `POLICY_ALLERGENS: ${this.policy.allergens.join(', ') || 'none'}`,
      `POLICY_RESTRICTIONS: ${this.policy.dietaryRestrictions.join(', ') || 'none'}`,
      `CULTURAL_RULES: ${this.policy.culturalConstraints?.join(', ') || 'none'}`,
      `MIN_PANTRY_USAGE: ${this.policy.minPantryUsage * 100}%`
    ].join('\n') : '';

    const HARD = [
      `MEAL_TYPE: ${mealType}`,
      `MEAL_KCAL_TARGET: ${goal}`,
      `MACROS_TARGET_PER_SLOT: ${opts?.perSlot ? 
        `${opts.perSlot.protein}P/${opts.perSlot.carbs}C/${opts.perSlot.fat}F` : 
        'derive from distribution'}`,
      `TARGET_CUISINE: ${opts?.targetCuisine || 
        (u.culturalProfile.primaryCuisines[0] || 'modern')} (MUST MATCH)`,
      `DIET_RULES_SELECTED: ${(u.restrictions.dietaryRestrictions || []).join(', ') || 'none'}`,
      `ALLERGENS_FORBIDDEN: ${u.restrictions.allergens.join(', ') || 'none'}`,
      `ABSOLUTE_FORBIDDEN_TOKENS: ${(opts?.forbiddenTokens || []).join(', ') || 'none'}`,
      policyConstraints,
      ...(mealType === 'breakfast' ? [
        `BREAKFAST_SEAFOOD_MODE: ${opts?.breakfastSeafoodMode || 'contextual'}`,
        `BREAKFAST_SEAFOOD_ALLOWED_CUISINES: ${
          (opts?.breakfastSeafoodAllowList || []).join(', ') || 'none'
        }`
      ] : [])
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

    const PANTRY = pantry
      .map(p => `${p.name} (${p.quantity} ${p.unit || ''})`)
      .join(', ');

    const SCHEMA = `Return ONLY JSON:
{
  "name": string,
  "ingredients": [{"name": string, "amount": number, "unit": string, "category": string, "fromPantry": boolean}],
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "prepTime": number,
  "cookTime": number,
  "servings": 1,
  "difficulty": "Easy" | "Medium" | "Hard",
  "instructions": [string],
  "tags": [string],
  "pantryUsagePercentage": number,
  "shoppingListItems": [string],
  "restrictionsFollowed": boolean
}`;

    return [
      'HARD_RULES:\n' + HARD,
      'STYLE:\n' + STYLE,
      'VARIETY:\n' + VARIETY,
      `PANTRY:\n${PANTRY || 'empty'}`,
      SCHEMA
    ].join('\n\n');
  }

  // Learning methods
  updateLearning(feedback: {
    mealId: string;
    rating: number;
    regenerated: boolean;
    feedback?: string;
  }) {
    // Update learning data based on user feedback
    console.log('Learning from feedback:', feedback);
    
    // Update behavior hints if needed
    if (this.policy?.behaviorHints && feedback.regenerated) {
      // Track regeneration patterns
      console.log('Meal was regenerated, learning preferences...');
    }
  }

  pickPrimaryCuisineFrom(meal: any) {
    return identifyPrimaryCuisine(
      meal, 
      this.userContext.culturalProfile.primaryCuisines || []
    );
  }

  getContext() { 
    return this.userContext; 
  }

  getPolicy() {
    return this.policy;
  }

  // Export learning data for persistence
  exportLearningData(): AgentLearningData | null {
    return this.learningData;
  }

  // Import learning data from storage
  importLearningData(data: AgentLearningData) {
    this.learningData = data;
    // Apply learned preferences to policy
    if (data.userBehavior && this.policy?.behaviorHints) {
      this.policy.behaviorHints.preferredIngredients = data.userBehavior.preferredIngredients;
      this.policy.behaviorHints.avoidedIngredients = data.userBehavior.avoidedIngredients;
      this.policy.behaviorHints.preferredComplexity = data.userBehavior.mealComplexityPreference;
      this.policy.behaviorHints.preferredCookingTime = data.userBehavior.cookingTimePreference;
    }
  }
}
