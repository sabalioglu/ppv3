// lib/meal-plan/api-clients/ai-generation.ts
// AI meal generation using OpenAI GPT-4o-mini with BRUTAL pantry-focused approach + anti-duplicate logic

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

// ✅ FIXED: QC Validation with relaxed constraints
const validateMealQuality = async (
  meal: any,
  policy: MealPolicy,
  existingMeals: Meal[],
  attempt: number
): Promise<QCValidationResult> => {
  
  // 1. Parse ve validate meal structure
  const parsedMeal = parseMealFromResponse(JSON.stringify(meal), {
    pantryItems: policy.pantryItems || [],
    userProfile: null,
    mealType: 'lunch',
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

  // 2. Extract variables properly
  const mealName = parsedMeal.name?.toLowerCase() || '';
  const ingredients = parsedMeal.ingredients || [];
  const category = parsedMeal.category || parsedMeal.tags?.[0] || 'unknown';
  const cookingMethod = parsedMeal.difficulty || 'Easy';
  const calories = parsedMeal.calories || 0;
  
  console.log('🔍 QC Check Variables:', {
    mealName,
    ingredientsCount: ingredients.length,
    category,
    cookingMethod,
    calories
  });

  // Initialize validation details
  const validationDetails = {
    dietCompliance: true,
    allergenSafety: true,
    calorieCompliance: true,
    varietyCheck: true,
    culturalAppropriateness: true,
    pantryUsage: 0
  };

  const issues: string[] = [];
  const suggestions: string[] = [];

  // 3. Name duplicate check - RELAXED
  const isDuplicateName = existingMeals.some(existing => 
    existing.name.toLowerCase() === mealName // Only exact matches
  );
  
  if (isDuplicateName && attempt < 2) { // Only fail on first attempt
    console.log('⚠️ QC Warning: Similar name detected, but allowing');
    issues.push('Similar meal name detected');
    // Don't return failure, just note it
  }

  // 4. Diet enforcement check
  const dietViolation = checkDietCompliance(parsedMeal, policy);
  if (dietViolation) {
    console.log('❌ QC Failed: DIET_VIOLATION -', dietViolation);
    issues.push(dietViolation);
    validationDetails.dietCompliance = false;
    
    return { 
      isValid: false, 
      reason: `DIET_VIOLATION: ${dietViolation}`, 
      score: 0.1,
      issues,
      suggestions: ['Ensure all ingredients comply with dietary restrictions'],
      confidenceLevel: 'low',
      validationDetails
    };
  }

  // 5. Allergen check
  const allergenViolation = checkAllergenCompliance(ingredients, policy.allergens);
  if (allergenViolation) {
    console.log('❌ QC Failed: ALLERGEN_VIOLATION -', allergenViolation);
    issues.push(`Contains allergen: ${allergenViolation}`);
    validationDetails.allergenSafety = false;
    
    return { 
      isValid: false, 
      reason: `ALLERGEN_VIOLATION: ${allergenViolation}`, 
      score: 0.1,
      issues,
      suggestions: ['Remove allergen ingredients'],
      confidenceLevel: 'low',
      validationDetails
    };
  }

  // 6. ✅ RELAXED: Calorie band check - increased tolerance to 40%
  const targetCalories = policy.targetCalories;
  const calorieVariance = Math.abs(calories - targetCalories) / targetCalories;
  
  if (calorieVariance > 0.40) { // Changed from 0.25 to 0.40
    console.log('⚠️ QC Warning: Calorie variance high but allowing');
    issues.push(`Calories ${calories} outside ideal range (${targetCalories}±40%)`);
    // Don't fail, just reduce score slightly
  }

  // 7. ✅ RELAXED: Forbidden patterns check - only warn, don't fail
  const forbiddenPatterns = ['simple', 'basic', 'easy', 'quick'];
  const hasForbiddenPattern = forbiddenPatterns.some(pattern => 
    mealName.includes(pattern)
  );
  
  if (hasForbiddenPattern) {
    console.log('⚠️ QC Warning: Forbidden pattern detected but allowing');
    issues.push('Consider using more creative meal names');
    // Don't fail, just note it
  }

  // 8. ✅ RELAXED: Variety check - only on third attempt
  const todayMeals = existingMeals.filter(m => 
    new Date(m.created_at || '').toDateString() === new Date().toDateString()
  );
  
  const hasVarietyConflict = todayMeals.some(existing => 
    existing.category === category &&
    existing.difficulty === cookingMethod
  );
  
  if (hasVarietyConflict && attempt >= 3) { // Only fail on third attempt
    console.log('⚠️ QC Warning: Variety conflict but allowing after multiple attempts');
    issues.push('Similar meal type exists');
  }

  // Calculate pantry usage
  const pantryUsage = parsedMeal.pantryUsagePercentage || 0;
  validationDetails.pantryUsage = pantryUsage / 100;

  // ✅ RELAXED: Final score calculation - more lenient
  const matchScore = calculateMatchScore(parsedMeal, policy);
  const adjustedScore = Math.max(0.6, matchScore); // Minimum score of 0.6
  
  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (adjustedScore >= 0.8) confidenceLevel = 'high';
  else if (adjustedScore < 0.5) confidenceLevel = 'low';
  
  console.log('✅ QC Passed with adjusted score:', adjustedScore);
  
  return { 
    isValid: true, 
    score: adjustedScore,
    reason: "QUALITY_PASSED",
    issues: issues.length > 0 ? issues : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    confidenceLevel,
    validationDetails
  };
};

// Helper functions for QC
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

// ✅ RELAXED: More lenient match score calculation
const calculateMatchScore = (meal: Meal, policy: MealPolicy): number => {
  const hasGoodCalories = Math.abs(meal.calories - policy.targetCalories) / policy.targetCalories < 0.4; // Relaxed
  const hasIngredients = meal.ingredients.length >= 2; // Reduced from > 2
  const hasGoodName = meal.name && meal.name.length > 5; // Just check it has a name
  const hasPantryUsage = (meal.pantryUsagePercentage || 0) >= (policy.minPantryUsage * 80); // 80% of target
  
  let score = 0.5; // Higher base score
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

// Pantry cuisine detection
const detectPantryCuisine = (pantryItems: PantryItem[]): string => {
  const ingredients = pantryItems.map(item => item.name.toLowerCase());
  
  if (ingredients.some(ing => ['soy sauce', 'ginger', 'rice', 'sesame oil'].includes(ing))) {
    return 'Asian-inspired';
  }
  if (ingredients.some(ing => ['tomato', 'basil', 'pasta', 'olive oil', 'parmesan'].includes(ing))) {
    return 'Italian-inspired';
  }
  if (ingredients.some(ing => ['cumin', 'paprika', 'beans', 'lime', 'cilantro'].includes(ing))) {
    return 'Mexican-inspired';
  }
  if (ingredients.some(ing => ['yogurt', 'cucumber', 'feta', 'olives', 'lemon'].includes(ing))) {
    return 'Mediterranean-inspired';
  }
  if (ingredients.some(ing => ['curry powder', 'turmeric', 'coconut milk', 'garam masala'].includes(ing))) {
    return 'Indian-inspired';
  }
  return 'International fusion';
};

const getSkillBasedInstructions = (skillLevel: string): string => {
  switch (skillLevel) {
    case 'beginner':
      return "Use simple cooking methods (boiling, baking, pan-frying). Avoid complex techniques.";
    case 'intermediate':
      return "Can use moderate techniques (sautéing, roasting, basic seasoning combinations).";
    case 'advanced':
      return "Advanced techniques welcome (braising, complex seasonings, multiple cooking methods).";
    default:
      return "Keep techniques simple to moderate.";
  }
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

// ✅ UPDATED: Build pantry-focused prompt with relaxed restrictions
const buildPantryFocusedPrompt = (
  request: AIGenerationRequest, 
  previousMeals?: Meal[]
): string => {
  const { pantryItems, mealType, userProfile } = request;
  const profile = analyzeUserProfile(userProfile);
  
  const proteinItems = pantryItems.filter(item => 
    ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs', 'tofu', 'beans', 'lentils', 'turkey', 'pork'].some(protein => 
      item.name.toLowerCase().includes(protein)
    )
  );
  
  const vegetableItems = pantryItems.filter(item => 
    item.category?.toLowerCase().includes('vegetable') || 
    ['tomato', 'onion', 'pepper', 'broccoli', 'spinach', 'carrot', 'cucumber', 'lettuce', 'mushroom', 'zucchini', 'potato', 'sweet potato'].some(veg => 
      item.name.toLowerCase().includes(veg)
    )
  );
  
  const grainItems = pantryItems.filter(item => 
    ['rice', 'pasta', 'bread', 'quinoa', 'oats', 'barley', 'bulgur', 'couscous'].some(grain => 
      item.name.toLowerCase().includes(grain)
    )
  );

  const availableIngredients = pantryItems
    .map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`)
    .join(', ');

  const usedIngredients = previousMeals?.flatMap(m => m.ingredients.map(i => i.name.toLowerCase())) || [];
  const calorieTarget = getCalorieTarget(userProfile, mealType);
  const detectedCuisine = detectPantryCuisine(pantryItems);

  const allergenSafety = profile.allergenWarnings.length > 0
    ? `- **CRITICAL ALLERGEN WARNING:** NEVER include these ingredients: **${profile.allergenWarnings.join(', ')}**. This is non-negotiable.`
    : '';

  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `- **DIETARY REQUIREMENTS:** The meal MUST be **${profile.dietaryGuidelines.join(', ')}**. No exceptions.`
    : '';

  const getMealTypeConstraints = (mealType: string) => {
    switch(mealType.toLowerCase()) {
      case 'breakfast':
        return `- **Breakfast Rule:** Create an EXCITING, restaurant-quality breakfast. Think gourmet omelets, stuffed pancakes, breakfast bowls, fusion breakfast dishes, or creative egg preparations. Avoid simple toast - make it SPECIAL and memorable!`;
      case 'lunch':
        return `- **Lunch Rule:** Create a SATISFYING, flavorful lunch. Think hearty salads with protein, gourmet sandwiches, grain bowls, wraps with creative fillings, or international lunch dishes. Make it restaurant-worthy!`;
      case 'dinner':
        return `- **Dinner Rule:** Create an IMPRESSIVE, complete dinner. Think main course with creative sides, international cuisines, fusion dishes, or elevated comfort food. This should be the STAR meal of the day!`;
      case 'snack':
        return `- **Snack Rule:** Create an INTERESTING, nutritious snack. Think energy balls, stuffed items, creative dips, or unique combinations. Avoid plain fruits - make it SPECIAL and satisfying!`;
      default:
        return '';
    }
  };
  const mealTypeConstraint = getMealTypeConstraints(mealType);

  return `You are a creative, world-class chef tasked with creating an EXCITING and DELICIOUS ${mealType} recipe. Your goal is to create restaurant-quality, impressive meals that people will love and want to make again.

🛑 ABSOLUTE REQUIREMENTS (MUST FOLLOW):
${allergenSafety}
${dietaryCompliance}
${mealTypeConstraint}
- You MUST respond with valid JSON only.
- Create something EXCITING, not basic or boring.
- Use creative cooking techniques and flavor combinations.

🏠 AVAILABLE PANTRY INVENTORY:
**Proteins Available:** ${proteinItems.map(p => p.name).join(', ') || 'None'}
**Vegetables Available:** ${vegetableItems.map(v => v.name).join(', ') || 'None'}  
**Grains/Starches:** ${grainItems.map(g => g.name).join(', ') || 'None'}

**Complete Pantry:** ${availableIngredients}

🎯 CREATIVE COOKING CHALLENGE:
1. **Use 80%+ pantry ingredients** - maximize what's available
2. **Create something EXCITING** - avoid boring, basic recipes
3. **Restaurant-quality presentation** - make it special and appealing
4. **Flavor-packed combinations** - use spices and techniques creatively
5. **Instagram-worthy** - something people would want to photograph and share

🚫 AVOID THESE BORING PATTERNS:
- Simple [protein] and [vegetable] combinations
- Basic salads without interesting components
- Plain grilled/boiled preparations
- Recipes that sound like "Simple X" or "Basic Y"
- Repetitive ingredients from: ${usedIngredients.slice(0, 8).join(', ')}

🎯 TARGET SPECIFICATIONS:
- **Calories:** ~${calorieTarget} (satisfying but balanced)
- **Protein Goal:** High protein content for satiety
- **Flavor Profile:** Bold, exciting, memorable
- **Visual Appeal:** Colorful, attractive presentation

🍳 COOKING GUIDELINES:
${getSkillBasedInstructions(profile.skillLevel)}

🌍 SUGGESTED CUISINE DIRECTION: ${detectedCuisine} (based on pantry ingredients)

Create a ${mealType} recipe that follows these rules strictly. Target calories: ~${calorieTarget}

Respond with this exact JSON structure:
{
  "name": "Creative, Exciting Recipe Name (highlight main flavors/technique)",
  "ingredients": [
    {"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables", "fromPantry": true},
    {"name": "ingredient2", "amount": 2, "unit": "pieces", "category": "Protein", "fromPantry": true},
    {"name": "ingredient3", "amount": 1, "unit": "tbsp", "category": "Condiment", "fromPantry": false}
  ],
  "calories": ${calorieTarget},
  "protein": 25,
  "carbs": 40,
  "fat": 15,
  "fiber": 8,
  "prepTime": 15,
  "cookTime": 20,
  "servings": 1,
  "difficulty": "Easy",
  "instructions": [
    "Step 1: Preparation with specific techniques and seasoning",
    "Step 2: Creative cooking process with flavor building",
    "Step 3: Professional presentation and serving suggestions"
  ],
  "tags": ["creative", "flavorful", "restaurant-style", "${detectedCuisine}"],
  "pantryUsagePercentage": 85,
  "shoppingListItems": ["item1", "item2"]
}

IMPORTANT: Do NOT include "restrictionsFollowed" field. The system will validate compliance automatically.`;
};

// ✅ FIXED: Parse meal from response with relaxed restriction checking
const parseMealFromResponse = (responseText: string, request: AIGenerationRequest): Meal => {
  try {
    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedMeal = JSON.parse(cleanedText);
    
    // ✅ REMOVED: restrictionsFollowed check - no longer required
    // The QC validation will handle compliance checking
    
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

// ✅ MAIN EXPORT: Generate AI Meal
export const generateAIMeal = async (
  request: AIGenerationRequest, 
  previousMeals?: Meal[]
): Promise<Meal> => {
  const prompt = buildPantryFocusedPrompt(request, previousMeals);
  
  console.log('🧪 Testing GPT-4o-mini with BRUTAL pantry focus...');
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
            content: "You are a professional chef specialized in maximizing pantry ingredient usage. You MUST prioritize pantry ingredients above all else. Always respond with valid JSON only. No explanations or additional text."
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

    console.log('✅ GPT-4o-mini pantry-focused response received');
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

// ✅ ENHANCED: Quality Control meal generation with relaxed validation
export const generateAIMealWithQualityControl = async (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  previousMeals: Meal[] = []
): Promise<Meal> => {
  console.log(`🎯 Starting enhanced quality-controlled generation for ${mealType}`);
  
  const safePantryItems = Array.isArray(pantryItems) ? pantryItems : [];
  const safePreviousMeals = Array.isArray(previousMeals) ? previousMeals : [];
  
  // Build policy object with proper types
  const policy: MealPolicy = {
    name: 'enhanced_quality',
    dietaryRestrictions: userProfile?.dietary_restrictions || [],
    allergens: userProfile?.allergens || [],
    targetCalories: getCalorieTarget(userProfile, mealType),
    minPantryUsage: 0.7,
    cuisines: userProfile?.cuisine_preferences || [],
    pantryItems: safePantryItems,
    culturalConstraints: [],
    behaviorHints: {
      preferredIngredients: [],
      avoidedIngredients: [],
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
    console.log(`🎯 Enhanced generation attempt ${attempts}/${maxAttempts}`);
    
    try {
      // Generate raw meal
      const rawMeal = await generateAIMeal({
        pantryItems: safePantryItems,
        userProfile,
        mealType,
        preferences: userProfile?.dietary_preferences || [],
        restrictions: userProfile?.dietary_restrictions || []
      }, safePreviousMeals);
      
      // Ensure meal has ingredients array
      if (!rawMeal.ingredients || !Array.isArray(rawMeal.ingredients)) {
        rawMeal.ingredients = [];
        console.warn('⚠️ Generated meal had no ingredients array, creating empty array');
      }
      
      // Quality Control validation with relaxed constraints
      const qcResult = await validateMealQuality(rawMeal, policy, safePreviousMeals, attempts);
      
      console.log(`🔍 QC Result for attempt ${attempts}:`, {
        isValid: qcResult.isValid,
        reason: qcResult.reason,
        score: qcResult.score,
        confidence: qcResult.confidenceLevel
      });

      // Track best result
      if (qcResult.score > bestScore) {
        bestMeal = rawMeal;
        bestScore = qcResult.score;
      }

      // ✅ RELAXED: Accept if valid and score > 0.5 (reduced from 0.7)
      if (qcResult.isValid && qcResult.score > 0.5) {
        console.log(`✅ Quality meal accepted on attempt ${attempts}`);
        
        // Save meal with quality data
        const enhancedMeal = {
          ...rawMeal,
          qualityScore: qcResult.score,
          qualityReason: qcResult.reason,
          generationAttempts: attempts
        };
        
        return enhancedMeal;
      }
      
    } catch (error) {
      console.error(`⚠️ Generation attempt ${attempts} warning:`, error);
      // Don't throw on intermediate attempts
      if (attempts === maxAttempts && !bestMeal) {
        throw error;
      }
    }
  }
  
  // ✅ RELAXED: Use best meal even with lower score
  if (bestMeal) {
    console.log(`✅ Using best available meal with score ${bestScore}`);
    return {
      ...bestMeal,
      qualityScore: bestScore,
      qualityWarning: bestScore < 0.5,
      generationAttempts: maxAttempts
    };
  }
  
  throw new Error('Failed to generate quality meal after maximum attempts');
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

// ✅ Generate alternative meal (simplified)
export const generateAlternativeMeal = generateAIMeal;

// ✅ Generate full meal plan
export const generateAIMealPlan = async (
  pantryItems: PantryItem[],
  userProfile: UserProfile | null
): Promise<{
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
  snacks: Meal[];
}> => {
  console.log('🧪 Generating full meal plan with quality control...');
  
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
    console.error('Error generating AI meal plan:', error);
    throw error;
  }
};

// ✅ Get quality metrics
export const getQualityMetrics = (meal: Meal) => {
  return {
    hasQualityData: !!(meal as any).qualityScore,
    score: (meal as any).qualityScore,
    warning: (meal as any).qualityWarning,
    attempts: (meal as any).generationAttempts
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