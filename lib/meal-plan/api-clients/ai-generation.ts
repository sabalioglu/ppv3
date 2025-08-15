// lib/meal-plan/api-clients/ai-generation.ts
// AI meal generation with cultural intelligence and pantry optimization

import { 
  PantryItem, 
  UserProfile, 
  Meal, 
  AIGenerationRequest, 
  AIGenerationResponse, 
  MealPolicy, 
  QCValidationResult 
} from './types';
import { calculatePantryMatch } from '../pantry-analysis';
import { 
  CulturalProfile,
  CULTURAL_BREAKFAST_PATTERNS,
  REGIONAL_SEAFOOD_PATTERNS,
  RELIGIOUS_RESTRICTIONS,
  evaluateCulturalConstraints,
  detectCulturalCuisine,
  createCulturalProfile,
  includesSeafood
} from '../../policy/cultural-rules';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens: number;
  temperature: number;
  response_format?: { type: 'json_object' };
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Test metrikleri için interface
interface TestMetrics {
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  averageTokens: {
    input: number;
    output: number;
  };
}

// Test metriklerini takip et
let testMetrics: TestMetrics = {
  totalRequests: 0,
  totalCost: 0,
  averageResponseTime: 0,
  successRate: 0,
  averageTokens: { input: 0, output: 0 }
};

// ✅ NEW: Build religious constraints section
const buildReligiousConstraints = (religiousRestrictions: any[]): string => {
  if (!religiousRestrictions || religiousRestrictions.length === 0) {
    return '- No religious dietary restrictions';
  }

  const constraints: string[] = [];
  religiousRestrictions.forEach(restriction => {
    const details = RELIGIOUS_RESTRICTIONS[restriction.type];
    if (details) {
      constraints.push(`- **${restriction.type.toUpperCase()}**: NEVER include ${details.forbiddenIngredients.join(', ')}`);
      if (details.requiredPreparation) {
        constraints.push(`  Required: ${details.requiredPreparation.join(', ')}`);
      }
    }
  });

  return constraints.join('\n');
};

// ✅ NEW: Build cultural guidelines section
const buildCulturalGuidelines = (cuisineData: any, mealType: string): string => {
  if (!cuisineData) {
    return '- Follow general international cuisine standards';
  }

  const guidelines: string[] = [];
  
  if (mealType === 'breakfast') {
    guidelines.push(`- **Typical ${cuisineData.socialContext} breakfast**: ${cuisineData.typical.join(', ')}`);
    guidelines.push(`- **Avoid**: ${cuisineData.forbidden.join(', ')}`);
    guidelines.push(`- **Preferred style**: ${cuisineData.preferred.join(', ')}`);
    guidelines.push(`- **Timing context**: ${cuisineData.timing}`);
    
    if (!cuisineData.heavyMealAcceptance) {
      guidelines.push('- Keep breakfast light and balanced');
    }
    if (!cuisineData.seafoodAcceptance) {
      guidelines.push('- NO seafood in breakfast');
    }
  } else {
    guidelines.push(`- Follow authentic ${mealType} patterns for this cuisine`);
  }

  return guidelines.join('\n');
};

// ✅ NEW: Build regional preferences section
const buildRegionalPreferences = (regionalData: any): string => {
  if (!regionalData) {
    return '- No specific regional preferences';
  }

  const preferences: string[] = [];
  
  if (regionalData.consumption === 'high') {
    preferences.push(`- **Seafood preference**: High consumption region`);
    preferences.push(`- **Preferred types**: ${regionalData.preferredTypes.join(', ')}`);
    preferences.push(`- **Cooking methods**: ${regionalData.cookingMethods.join(', ')}`);
  } else if (regionalData.consumption === 'low') {
    preferences.push(`- **Seafood**: Limited consumption in this region`);
  }
  
  preferences.push(`- **Context**: ${regionalData.culturalContext}`);

  return preferences.join('\n');
};

// ✅ NEW: Culturally filter pantry items
const culturallyFilterPantryItems = (
  pantryItems: PantryItem[],
  culturalProfile: CulturalProfile,
  mealType: string
): PantryItem[] => {
  // Filter out culturally inappropriate items
  return pantryItems.filter(item => {
    const itemName = item.name.toLowerCase();
    
    // Religious filtering
    for (const restriction of culturalProfile.religiousRestrictions) {
      const forbidden = RELIGIOUS_RESTRICTIONS[restriction.type]?.forbiddenIngredients || [];
      if (forbidden.some(f => itemName.includes(f.toLowerCase()))) {
        return false; // Exclude this item
      }
    }
    
    // Cultural breakfast filtering
    if (mealType === 'breakfast') {
      const pattern = CULTURAL_BREAKFAST_PATTERNS[culturalProfile.primaryCuisine];
      if (pattern) {
        // Check if item is in forbidden list
        if (pattern.forbidden.some(f => itemName.includes(f.toLowerCase()))) {
          return false;
        }
        
        // Special seafood handling for breakfast
        if (!pattern.seafoodAcceptance && includesSeafood([{ name: item.name }])) {
          return false;
        }
      }
    }
    
    return true; // Include this item
  });
};

// ✅ NEW: Build pantry section with cultural filtering
const buildCulturalPantrySection = (
  pantryItems: PantryItem[],
  culturalProfile: CulturalProfile,
  mealType: string
): string => {
  const filteredItems = culturallyFilterPantryItems(pantryItems, culturalProfile, mealType);
  
  const proteins = filteredItems.filter(item => 
    ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs', 'tofu', 'beans', 'lentils', 'turkey', 'pork', 'lamb'].some(p => 
      item.name.toLowerCase().includes(p)
    )
  );
  
  const vegetables = filteredItems.filter(item => 
    item.category?.toLowerCase().includes('vegetable') || 
    ['tomato', 'onion', 'pepper', 'broccoli', 'spinach', 'carrot'].some(v => 
      item.name.toLowerCase().includes(v)
    )
  );
  
  const grains = filteredItems.filter(item => 
    ['rice', 'pasta', 'bread', 'quinoa', 'oats', 'barley'].some(g => 
      item.name.toLowerCase().includes(g)
    )
  );

  return `
**Culturally Appropriate Pantry Items:**
- **Proteins**: ${proteins.map(p => p.name).join(', ') || 'None available'}
- **Vegetables**: ${vegetables.map(v => v.name).join(', ') || 'None available'}
- **Grains**: ${grains.map(g => g.name).join(', ') || 'None available'}
- **All Items**: ${filteredItems.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}

**Items Excluded for Cultural/Religious Reasons**: ${pantryItems.length - filteredItems.length} items`;
};

// ✅ ENHANCED: Culturally intelligent prompt builder
const buildCulturallyIntelligentPrompt = (
  request: AIGenerationRequest,
  culturalProfile: CulturalProfile,
  previousMeals?: Meal[]
): string => {
  const { pantryItems, mealType, userProfile } = request;
  const cuisineData = CULTURAL_BREAKFAST_PATTERNS[culturalProfile.primaryCuisine];
  const regionalKey = `${culturalProfile.primaryCuisine}_${culturalProfile.region}`;
  const regionalData = REGIONAL_SEAFOOD_PATTERNS[regionalKey];
  
  // Build constraint sections
  const hardConstraints = buildReligiousConstraints(culturalProfile.religiousRestrictions);
  const culturalGuidelines = buildCulturalGuidelines(cuisineData, mealType);
  const regionalPreferences = buildRegionalPreferences(regionalData);
  const pantrySection = buildCulturalPantrySection(pantryItems, culturalProfile, mealType);
  
  // Previous meals tracking
  const usedIngredients = previousMeals?.flatMap(m => m.ingredients.map(i => i.name.toLowerCase())) || [];
  
  // Calorie targets with cultural adjustment
  const baseCalories = getCalorieTarget(userProfile, mealType);
  const culturalCalorieAdjustment = cuisineData?.heavyMealAcceptance ? 1.1 : 0.9;
  const adjustedCalories = Math.round(baseCalories * culturalCalorieAdjustment);

  return `You are a culturally intelligent chef specializing in ${culturalProfile.primaryCuisine} cuisine, creating an authentic ${mealType}.

🌍 CULTURAL IDENTITY:
- **Primary Cuisine**: ${culturalProfile.primaryCuisine}
- **Region**: ${culturalProfile.region}
- **Social Context**: ${cuisineData?.socialContext || 'flexible'}

🚫 ABSOLUTE PROHIBITIONS (NEVER VIOLATE):
${hardConstraints}

🏛️ CULTURAL AUTHENTICITY REQUIREMENTS:
${culturalGuidelines}

🌊 REGIONAL PREFERENCES:
${regionalPreferences}

🥘 PANTRY OPTIMIZATION (Target 80%+ usage):
${pantrySection}

⚠️ AVOID REPETITION:
- Do not use these ingredients as primary components: ${usedIngredients.slice(0, 5).join(', ')}

🎯 NUTRITIONAL TARGETS:
- **Calories**: ~${adjustedCalories} kcal
- **Style**: ${cuisineData?.preferred?.join(', ') || 'balanced and flavorful'}
- **Complexity**: Match cultural expectations for ${mealType}

PRIORITY ORDER (MUST FOLLOW):
1. Religious/dietary restrictions (HARD CONSTRAINTS - never violate)
2. Cultural meal appropriateness (STRONG PREFERENCE - rarely violate)
3. Regional cooking preferences (MODERATE INFLUENCE - prefer when possible)
4. Pantry optimization targets (IMPORTANT - maximize usage)
5. Personal taste preferences (FLEXIBLE - accommodate when possible)

Create a ${mealType} that:
- Respects all cultural and religious constraints
- Feels authentic to ${culturalProfile.primaryCuisine} cuisine
- Uses primarily pantry ingredients
- Would be recognized and appreciated by someone from this culture

Respond with this JSON structure:
{
  "name": "Authentic ${culturalProfile.primaryCuisine} dish name",
  "ingredients": [
    {"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables", "fromPantry": true},
    {"name": "ingredient2", "amount": 2, "unit": "pieces", "category": "Protein", "fromPantry": true}
  ],
  "calories": ${adjustedCalories},
  "protein": 25,
  "carbs": 40,
  "fat": 15,
  "fiber": 8,
  "prepTime": 15,
  "cookTime": 20,
  "servings": 1,
  "difficulty": "Easy",
  "instructions": [
    "Step 1: Cultural preparation method",
    "Step 2: Traditional cooking technique",
    "Step 3: Authentic presentation"
  ],
  "tags": ["${culturalProfile.primaryCuisine}", "${mealType}", "authentic"],
  "pantryUsagePercentage": 85,
  "shoppingListItems": ["minimal items only"],
  "culturalAuthenticity": "high"
}`;
};

// ✅ ENHANCED: QC Validation with cultural constraints
const validateMealQuality = async (
  meal: any,
  policy: MealPolicy,
  culturalProfile: CulturalProfile,
  existingMeals: Meal[],
  attempt: number
): Promise<QCValidationResult> => {
  
  // Parse meal first
  const parsedMeal = parseMealFromResponse(JSON.stringify(meal), {
    pantryItems: policy.pantryItems || [],
    userProfile: null,
    mealType: meal.category || 'lunch',
    preferences: [],
    restrictions: []
  });
  
  if (!parsedMeal) {
    return { 
      isValid: false, 
      reason: "PARSE_ERROR", 
      score: 0,
      confidenceLevel: 'low'
    };
  }

  // ✅ NEW: Cultural constraint evaluation
  const culturalEvaluation = evaluateCulturalConstraints(
    parsedMeal,
    culturalProfile,
    parsedMeal.category || 'lunch'
  );

  // If there are cultural violations, fail immediately
  if (culturalEvaluation.violations.length > 0) {
    console.log('❌ Cultural violations detected:', culturalEvaluation.violations);
    return {
      isValid: false,
      reason: `CULTURAL_VIOLATION: ${culturalEvaluation.violations[0]}`,
      score: culturalEvaluation.score / 100,
      issues: culturalEvaluation.violations,
      suggestions: culturalEvaluation.suggestions,
      confidenceLevel: 'low',
      validationDetails: {
        dietCompliance: false,
        allergenSafety: true,
        calorieCompliance: true,
        varietyCheck: true,
        culturalAppropriateness: false,
        pantryUsage: 0
      }
    };
  }

  // Continue with existing validation...
  const validationDetails = {
    dietCompliance: true,
    allergenSafety: true,
    calorieCompliance: true,
    varietyCheck: true,
    culturalAppropriateness: culturalEvaluation.score >= 70,
    pantryUsage: 0
  };

  const issues: string[] = [...culturalEvaluation.suggestions];
  const suggestions: string[] = [...culturalEvaluation.suggestions];

  // Rest of validation logic remains the same...
  const matchScore = calculateMatchScore(parsedMeal, policy);
  const culturalBonus = (culturalEvaluation.score / 100) * 0.2; // Cultural score adds up to 20% bonus
  const finalScore = Math.min(1.0, matchScore + culturalBonus);
  
  console.log('✅ QC Passed with cultural score:', finalScore);
  
  return { 
    isValid: true, 
    score: finalScore,
    reason: "QUALITY_PASSED",
    issues: issues.length > 0 ? issues : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    confidenceLevel: finalScore >= 0.8 ? 'high' : finalScore >= 0.6 ? 'medium' : 'low',
    validationDetails
  };
};

// Keep existing helper functions...
const checkDietCompliance = (meal: Meal, policy: MealPolicy): string | null => {
  const dietRules = policy.dietaryRestrictions || [];
  const ingredients = meal.ingredients.map(ing => ing.name.toLowerCase());
  
  for (const rule of dietRules) {
    if (rule === 'vegan') {
      const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'dairy', 'milk', 'cheese', 'egg'];
      const violation = meatKeywords.find(keyword => 
        ingredients.some(ing => ing.includes(keyword))
      );
      if (violation) return `Vegan diet violated by: ${violation}`;
    }
    
    if (rule === 'vegetarian') {
      const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'meat'];
      const violation = meatKeywords.find(keyword => 
        ingredients.some(ing => ing.includes(keyword))
      );
      if (violation) return `Vegetarian diet violated by: ${violation}`;
    }
    
    if (rule === 'gluten_free') {
      const glutenKeywords = ['wheat', 'bread', 'pasta', 'flour', 'barley', 'rye'];
      const violation = glutenKeywords.find(keyword => 
        ingredients.some(ing => ing.includes(keyword))
      );
      if (violation) return `Gluten-free diet violated by: ${violation}`;
    }
    
    if (rule === 'dairy_free') {
      const dairyKeywords = ['milk', 'cheese', 'butter', 'cream', 'yogurt'];
      const violation = dairyKeywords.find(keyword => 
        ingredients.some(ing => ing.includes(keyword))
      );
      if (violation) return `Dairy-free diet violated by: ${violation}`;
    }
  }
  
  return null;
};

const checkAllergenCompliance = (ingredients: any[], allergens: string[]): string | null => {
  if (!allergens || allergens.length === 0) return null;
  
  const ingredientNames = ingredients.map(ing => ing.name?.toLowerCase() || '');
  
  for (const allergen of allergens) {
    const allergenLower = allergen.toLowerCase();
    const violation = ingredientNames.find(ing => ing.includes(allergenLower));
    if (violation) return allergen;
  }
  
  return null;
};

const calculateMatchScore = (meal: Meal, policy: MealPolicy): number => {
  const hasGoodCalories = Math.abs(meal.calories - policy.targetCalories) / policy.targetCalories < 0.4;
  const hasIngredients = meal.ingredients.length >= 2;
  const hasGoodName = meal.name && meal.name.length > 5;
  const hasPantryUsage = (meal.pantryUsagePercentage || 0) >= (policy.minPantryUsage * 80);
  
  let score = 0.5;
  if (hasGoodCalories) score += 0.15;
  if (hasIngredients) score += 0.15;
  if (hasGoodName) score += 0.1;
  if (hasPantryUsage) score += 0.1;
  
  return Math.min(1.0, score);
};

// Enhanced user profile analysis
const analyzeUserProfile = (userProfile: UserProfile | null) => {
  if (!userProfile) {
    return {
      skillLevel: 'beginner',
      timeConstraints: 'moderate',
      nutritionFocus: 'balanced',
      cuisineStyle: 'international',
      allergenWarnings: [],
      dietaryGuidelines: []
    };
  }

  const skillLevel = userProfile.cooking_skill_level || 'beginner';
  const timeConstraints = getTimeConstraints(userProfile.activity_level);
  const nutritionFocus = getNutritionFocus(userProfile.health_goals);
  const cuisineStyle = userProfile.cuisine_preferences?.length > 0 
    ? userProfile.cuisine_preferences.join(', ') 
    : 'international';
  const allergenWarnings = userProfile.allergens || [];
  const dietaryGuidelines = userProfile.dietary_preferences || [];

  return {
    skillLevel,
    timeConstraints,
    nutritionFocus,
    cuisineStyle,
    allergenWarnings,
    dietaryGuidelines
  };
};

const getTimeConstraints = (activityLevel?: string): string => {
  switch (activityLevel) {
    case 'extra_active':
    case 'very_active':
      return 'quick';
    case 'moderately_active':
      return 'moderate';
    case 'lightly_active':
    case 'sedentary':
      return 'flexible';
    default:
      return 'moderate';
  }
};

const getNutritionFocus = (healthGoals?: string[]): string => {
  if (!healthGoals?.length) return 'balanced';
  
  if (healthGoals.includes('weight_loss')) return 'low-calorie, high-protein';
  if (healthGoals.includes('muscle_gain')) return 'high-protein, moderate-carb';
  if (healthGoals.includes('heart_health')) return 'low-sodium, omega-3 rich';
  if (healthGoals.includes('digestive_health')) return 'high-fiber, probiotic';
  if (healthGoals.includes('energy_boost')) return 'complex-carb, B-vitamin rich';
  if (healthGoals.includes('blood_sugar_control')) return 'low-glycemic, balanced-macro';
  
  return 'balanced';
};

const getCalorieTarget = (userProfile: UserProfile | null, mealType: string): number => {
  if (!userProfile) {
    return mealType === 'breakfast' ? 350 : 
           mealType === 'lunch' ? 450 : 
           mealType === 'dinner' ? 550 : 150;
  }

  const { age, gender, height_cm, weight_kg, activity_level, health_goals } = userProfile;
  
  let bmr = 0;
  if (age && height_cm && weight_kg && gender) {
    if (gender === 'male') {
      bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
    } else {
      bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
    }
  }

  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extra_active': 1.9
  };
  
  const totalCalories = bmr * (activityMultipliers[activity_level as keyof typeof activityMultipliers] || 1.4);
  
  let calorieAdjustment = 1.0;
  if (health_goals?.includes('weight_loss')) calorieAdjustment = 0.85;
  if (health_goals?.includes('muscle_gain')) calorieAdjustment = 1.15;
  
  const adjustedTotal = totalCalories * calorieAdjustment;
  
  const mealDistribution = {
    'breakfast': 0.25,
    'lunch': 0.35,
    'dinner': 0.35,
    'snack': 0.05
  };
  
  return Math.round(adjustedTotal * (mealDistribution[mealType as keyof typeof mealDistribution] || 0.25));
};

const calculateCost = (usage: any) => {
  const inputCost = (usage.prompt_tokens / 1000) * 0.000150;
  const outputCost = (usage.completion_tokens / 1000) * 0.000600;
  return inputCost + outputCost;
};

const estimateTokens = (text: string) => {
  return Math.ceil(text.length / 4);
};

const updateMetrics = (responseTime: number, usage: any, success: boolean) => {
  testMetrics.totalRequests++;
  if (usage) {
    testMetrics.totalCost += calculateCost(usage);
    testMetrics.averageTokens.input = 
      (testMetrics.averageTokens.input * (testMetrics.totalRequests - 1) + usage.prompt_tokens) / 
      testMetrics.totalRequests;
    testMetrics.averageTokens.output = 
      (testMetrics.averageTokens.output * (testMetrics.totalRequests - 1) + usage.completion_tokens) / 
      testMetrics.totalRequests;
  }
  
  testMetrics.averageResponseTime = 
    (testMetrics.averageResponseTime * (testMetrics.totalRequests - 1) + responseTime) / 
    testMetrics.totalRequests;
  
  if (success) {
    testMetrics.successRate = 
      ((testMetrics.successRate * (testMetrics.totalRequests - 1)) + 1) / 
      testMetrics.totalRequests;
  } else {
    testMetrics.successRate = 
      (testMetrics.successRate * (testMetrics.totalRequests - 1)) / 
      testMetrics.totalRequests;
  }
  
  console.log('📊 Current metrics:', testMetrics);
};

// ✅ FIXED: Parse meal from response
const parseMealFromResponse = (responseText: string, request: AIGenerationRequest): Meal => {
  try {
    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedMeal = JSON.parse(cleanedText);
    
    const pantryMatch = calculatePantryMatch(parsedMeal.ingredients || [], request.pantryItems);
    const mealId = `ai_${request.mealType}_${Date.now()}`;
    const emoji = getMealEmoji(request.mealType, parsedMeal.name);

    return {
      id: mealId,
      name: parsedMeal.name,
      ingredients: parsedMeal.ingredients || [],
      calories: parsedMeal.calories || 0,
      protein: parsedMeal.protein || 0,
      carbs: parsedMeal.carbs || 0,
      fat: parsedMeal.fat || 0,
      fiber: parsedMeal.fiber || 0,
      prepTime: parsedMeal.prepTime || 15,
      cookTime: parsedMeal.cookTime || 15,
      servings: parsedMeal.servings || 1,
      difficulty: parsedMeal.difficulty || 'Easy',
      emoji: emoji,
      category: request.mealType,
      tags: parsedMeal.tags || [],
      instructions: parsedMeal.instructions || [],
      source: 'ai_generated',
      created_at: new Date().toISOString(),
      pantryUsagePercentage: parsedMeal.pantryUsagePercentage || 0,
      shoppingListItems: parsedMeal.shoppingListItems || [],
      matchPercentage: pantryMatch.matchPercentage,
      pantryMatch: pantryMatch.matchCount,
      totalIngredients: pantryMatch.totalIngredients,
      missingIngredients: pantryMatch.missingIngredients,
    };
  } catch (error: any) {
    console.error('Error parsing AI meal response:', error);
    throw new Error('Failed to parse AI meal response - will use fallback');
  }
};

const getMealEmoji = (mealType: string, mealName: string): string => {
  const name = mealName.toLowerCase();
  
  if (name.includes('italian') || name.includes('pasta')) return '🍝';
  if (name.includes('asian') || name.includes('chinese') || name.includes('stir fry')) return '🥢';
  if (name.includes('mexican') || name.includes('taco') || name.includes('burrito')) return '🌮';
  if (name.includes('indian') || name.includes('curry')) return '🍛';
  if (name.includes('japanese') || name.includes('sushi')) return '🍣';
  if (name.includes('greek') || name.includes('mediterranean')) return '🫒';
  if (name.includes('turkish') || name.includes('kebab')) return '🥙';
  
  if (name.includes('egg')) return '🍳';
  if (name.includes('salad')) return '🥗';
  if (name.includes('chicken')) return '🍗';
  if (name.includes('fish') || name.includes('salmon')) return '🐟';
  if (name.includes('soup')) return '🍲';
  if (name.includes('sandwich')) return '🥪';
  if (name.includes('rice')) return '🍚';
  if (name.includes('pizza')) return '🍕';
  if (name.includes('burger')) return '🍔';
  if (name.includes('smoothie') || name.includes('juice')) return '🥤';
  if (name.includes('yogurt')) return '🥛';
  if (name.includes('oatmeal') || name.includes('porridge')) return '🥣';
  
  switch (mealType) {
    case 'breakfast': return '🍳';
    case 'lunch': return '🥗';
    case 'dinner': return '🍽️';
    case 'snack': return '🍎';
    default: return '🍽️';
  }
};

// ✅ ENHANCED: Main AI Meal Generation with Cultural Intelligence
export const generateAIMeal = async (
  request: AIGenerationRequest, 
  previousMeals?: Meal[]
): Promise<Meal> => {
  // Create cultural profile from user data
  const detectedCuisine = detectCulturalCuisine(
    request.pantryItems,
    request.userProfile?.cuisine_preferences || []
  );
  
  const culturalProfile = createCulturalProfile(
    request.userProfile,
    detectedCuisine
  );

  // Use culturally intelligent prompt
  const prompt = buildCulturallyIntelligentPrompt(request, culturalProfile, previousMeals);
  
  console.log('🌍 Generating culturally intelligent meal for:', culturalProfile.primaryCuisine);
  console.log('📊 Estimated tokens - Input:', estimateTokens(prompt));
  
  const startTime = Date.now();
  let success = false;
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a culturally intelligent chef specializing in ${culturalProfile.primaryCuisine} cuisine. You understand religious dietary laws, cultural meal conventions, and regional cooking preferences. Always respond with valid JSON only.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
        response_format: { type: "json_object" }
      } as OpenAIRequest)
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`⚡ Response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    
    if (data.usage) {
      const cost = calculateCost(data.usage);
      console.log('💰 Token usage:', data.usage);
      console.log('💰 Estimated cost:', `$${cost.toFixed(6)}`);
    }
    
    const generatedText = data.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ Culturally intelligent response received');
    success = true;
    
    updateMetrics(responseTime, data.usage, success);
    
    return parseMealFromResponse(generatedText, request);
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    updateMetrics(responseTime, null, success);
    
    console.error('❌ AI meal generation error:', error);
    throw error;
  }
};

// ✅ ENHANCED: Quality Control with Cultural Validation
export const generateAIMealWithQualityControl = async (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  previousMeals: Meal[] = []
): Promise<Meal> => {
  console.log(`🎯 Starting culturally-aware quality-controlled generation for ${mealType}`);
  
  const safePantryItems = Array.isArray(pantryItems) ? pantryItems : [];
  const safePreviousMeals = Array.isArray(previousMeals) ? previousMeals : [];
  
  // Create cultural profile
  const detectedCuisine = detectCulturalCuisine(
    safePantryItems,
    userProfile?.cuisine_preferences || []
  );
  
  const culturalProfile = createCulturalProfile(
    userProfile,
    detectedCuisine
  );
  
  // Build policy with cultural constraints
  const policy: MealPolicy = {
    name: 'culturally_intelligent',
    dietaryRestrictions: userProfile?.dietary_restrictions || [],
    allergens: userProfile?.allergens || [],
    targetCalories: getCalorieTarget(userProfile, mealType),
    minPantryUsage: 0.7,
    cuisines: userProfile?.cuisine_preferences || [],
    pantryItems: safePantryItems,
    culturalConstraints: CULTURAL_BREAKFAST_PATTERNS[culturalProfile.primaryCuisine]?.forbidden || [],
    pantryCulture: culturalProfile.primaryCuisine,
    behaviorHints: {
      preferredIngredients: CULTURAL_BREAKFAST_PATTERNS[culturalProfile.primaryCuisine]?.typical || [],
      avoidedIngredients: CULTURAL_BREAKFAST_PATTERNS[culturalProfile.primaryCuisine]?.forbidden || [],
      preferredComplexity: 'moderate',
      preferredCookingTime: 'moderate',
      flavorProfiles: [],
      texturePreferences: []
    }
  };
  
  let attempts = 0;
  const maxAttempts = 3;
  let bestMeal: Meal | null = null;
  let bestScore = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🎯 Cultural generation attempt ${attempts}/${maxAttempts}`);
    
    try {
      // Generate meal with cultural awareness
      const rawMeal = await generateAIMeal({
        pantryItems: safePantryItems,
        userProfile,
        mealType,
        preferences: userProfile?.dietary_preferences || [],
        restrictions: userProfile?.dietary_restrictions || []
      }, safePreviousMeals);
      
      if (!rawMeal.ingredients || !Array.isArray(rawMeal.ingredients)) {
        rawMeal.ingredients = [];
        console.warn('⚠️ Generated meal had no ingredients array');
      }
      
      // Validate with cultural constraints
      const qcResult = await validateMealQuality(
        rawMeal, 
        policy, 
        culturalProfile,
        safePreviousMeals, 
        attempts
      );
      
      console.log(`🔍 Cultural QC Result for attempt ${attempts}:`, {
        isValid: qcResult.isValid,
        reason: qcResult.reason,
        score: qcResult.score,
        confidence: qcResult.confidenceLevel
      });

      if (qcResult.score > bestScore) {
        bestMeal = rawMeal;
        bestScore = qcResult.score;
      }

      if (qcResult.isValid && qcResult.score > 0.6) {
        console.log(`✅ Culturally appropriate meal accepted on attempt ${attempts}`);
        
        const enhancedMeal = {
          ...rawMeal,
          qualityScore: qcResult.score,
          qualityReason: qcResult.reason,
          generationAttempts: attempts,
          culturalAuthenticity: qcResult.score > 0.8 ? 'high' : 'medium'
        };
        
        return enhancedMeal;
      }
      
    } catch (error) {
      console.error(`⚠️ Generation attempt ${attempts} warning:`, error);
      if (attempts === maxAttempts && !bestMeal) {
        throw error;
      }
    }
  }
  
  if (bestMeal) {
    console.log(`✅ Using best culturally appropriate meal with score ${bestScore}`);
    return {
      ...bestMeal,
      qualityScore: bestScore,
      qualityWarning: bestScore < 0.6,
      generationAttempts: maxAttempts
    };
  }
  
  throw new Error('Failed to generate culturally appropriate meal');
};

// ✅ Calculate average match score
export const calculateAverageMatchScore = (meals: (Meal | null)[]): number => {
  const validMeals = meals.filter(Boolean) as Meal[];
  if (validMeals.length === 0) return 0;

  const totalMatchPercentage = validMeals.reduce((sum, meal) => 
    sum + (meal.matchPercentage || 0), 0
  );

  return Math.round(totalMatchPercentage / validMeals.length);
};

// ✅ Generate alternative meal
export const generateAlternativeMeal = generateAIMeal;

// ✅ Generate full meal plan with cultural awareness
export const generateAIMealPlan = async (
  pantryItems: PantryItem[],
  userProfile: UserProfile | null
): Promise<{
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
  snacks: Meal[];
}> => {
  console.log('🌍 Generating culturally intelligent meal plan...');
  
  try {
    const breakfast = await generateAIMealWithQualityControl('breakfast', pantryItems, userProfile, []);
    const lunch = await generateAIMealWithQualityControl('lunch', pantryItems, userProfile, [breakfast]);
    const dinner = await generateAIMealWithQualityControl('dinner', pantryItems, userProfile, [breakfast, lunch]);
    const snack = await generateAIMealWithQualityControl('snack', pantryItems, userProfile, [breakfast, lunch, dinner]);

    return {
      breakfast,
      lunch,
      dinner,
      snacks: [snack]
    };
  } catch (error) {
    console.error('Error generating culturally aware meal plan:', error);
    throw error;
  }
};

// ✅ Get quality metrics
export const getQualityMetrics = (meal: Meal) => {
  return {
    hasQualityData: !!(meal as any).qualityScore,
    score: (meal as any).qualityScore,
    warning: (meal as any).qualityWarning,
    attempts: (meal as any).generationAttempts,
    culturalAuthenticity: (meal as any).culturalAuthenticity
  };
};

// ✅ Get test metrics
export const getTestMetrics = (): TestMetrics => ({ ...testMetrics });

// ✅ Reset test metrics
export const resetTestMetrics = (): void => {
  testMetrics = {
    totalRequests: 0,
    totalCost: 0,
    averageResponseTime: 0,
    successRate: 0,
    averageTokens: { input: 0, output: 0 }
  };
};
