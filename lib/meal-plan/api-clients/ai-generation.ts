//lib/meal-plan/ai-generation.ts
// AI meal generation using OpenAI GPT-4o-mini with BRUTAL pantry-focused approach + anti-duplicate logic
import { PantryItem, UserProfile, Meal, AIGenerationRequest, AIGenerationResponse } from '../types';
import { calculatePantryMatch } from '../pantry-analysis'; // ✅ Yol düzeltildi

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

// ✅ Policy interface eklendi
interface MealPolicy {
  name: string;
  dietaryRestrictions: string[];
  allergens: string[];
  targetCalories: number;
  preferredModel?: string;
  minPantryUsage: number;
  cuisines: string[];
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

// ✅ CRITICAL FIX: QC Validation Chain - "cat is not defined" hatası burada!
const validateMealQuality = async (
  meal: any,
  policy: MealPolicy,
  existingMeals: Meal[],
  attempt: number
): Promise<{ isValid: boolean; reason?: string; score: number }> => {
  
  // 1. Parse ve validate meal structure
  const parsedMeal = parseMealFromResponse(meal, {
    pantryItems: policy.pantryItems || [],
    userProfile: null,
    mealType: 'lunch',
    preferences: [],
    restrictions: []
  });
  
  if (!parsedMeal) {
    return { isValid: false, reason: "PARSE_ERROR", score: 0 };
  }

  // ✅ 2. Değişkenleri düzgün tanımla - "cat" hatasının kaynağı!
  const mealName = parsedMeal.name?.toLowerCase() || '';
  const ingredients = parsedMeal.ingredients || [];
  const category = parsedMeal.category || parsedMeal.tags?.[0] || 'unknown'; // cat -> category
  const cookingMethod = parsedMeal.difficulty || 'Easy'; // method yerine difficulty kullan
  const calories = parsedMeal.calories || 0;
  
  console.log('🔍 QC Check Variables:', {
    mealName,
    ingredientsCount: ingredients.length,
    category, // artık "cat" değil "category"
    cookingMethod,
    calories
  });

  // 3. Name duplicate check
  const isDuplicateName = existingMeals.some(existing => 
    existing.name.toLowerCase().includes(mealName.split(' ')[0]) ||
    mealName.includes(existing.name.toLowerCase().split(' ')[0])
  );
  
  if (isDuplicateName) {
    console.log('❌ QC Failed: DUPLICATE_NAME');
    return { isValid: false, reason: "DUPLICATE_NAME", score: 0.2 };
  }

  // 4. Diet enforcement check
  const dietViolation = checkDietCompliance(parsedMeal, policy);
  if (dietViolation) {
    console.log('❌ QC Failed: DIET_VIOLATION -', dietViolation);
    return { isValid: false, reason: `DIET_VIOLATION: ${dietViolation}`, score: 0.1 };
  }

  // 5. Allergen check
  const allergenViolation = checkAllergenCompliance(ingredients, policy.allergens);
  if (allergenViolation) {
    console.log('❌ QC Failed: ALLERGEN_VIOLATION -', allergenViolation);
    return { isValid: false, reason: `ALLERGEN_VIOLATION: ${allergenViolation}`, score: 0.1 };
  }

  // 6. Calorie band check
  const targetCalories = policy.targetCalories;
  const calorieVariance = Math.abs(calories - targetCalories) / targetCalories;
  
  if (calorieVariance > 0.25) {
    console.log('❌ QC Failed: CALORIE_BAND_VIOLATION');
    return { isValid: false, reason: "CALORIE_BAND_VIOLATION", score: 0.4 };
  }

  // 7. Forbidden patterns check
  const forbiddenPatterns = ['simple', 'basic', 'easy', 'quick'];
  const hasForbiddenPattern = forbiddenPatterns.some(pattern => 
    mealName.includes(pattern)
  );
  
  if (hasForbiddenPattern) {
    console.log('❌ QC Failed: FORBIDDEN_PATTERN');
    return { isValid: false, reason: "FORBIDDEN_PATTERN", score: 0.2 };
  }

  // 8. Variety check (same day cuisine/protein/method)
  const todayMeals = existingMeals.filter(m => 
    new Date(m.created_at || '').toDateString() === new Date().toDateString()
  );
  
  const hasVarietyConflict = todayMeals.some(existing => 
    existing.category === category ||
    existing.difficulty === cookingMethod
  );
  
  if (hasVarietyConflict && attempt < 3) {
    console.log('❌ QC Failed: VARIETY_CONFLICT');
    return { isValid: false, reason: "VARIETY_CONFLICT", score: 0.5 };
  }

  // Final score calculation
  const matchScore = calculateMatchScore(parsedMeal, policy);
  
  console.log('✅ QC Passed with score:', matchScore);
  return { 
    isValid: true, 
    score: matchScore,
    reason: "QUALITY_PASSED" 
  };
};

// ✅ Helper functions for QC
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
  // Basit match score hesapla
  const hasGoodCalories = Math.abs(meal.calories - policy.targetCalories) / policy.targetCalories < 0.2;
  const hasIngredients = meal.ingredients.length > 2;
  const hasGoodName = !meal.name.toLowerCase().includes('simple');
  
  let score = 0.5; // Base score
  if (hasGoodCalories) score += 0.2;
  if (hasIngredients) score += 0.2;
  if (hasGoodName) score += 0.1;
  
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
  const allergenWarnings = userProfile.dietary_restrictions || [];
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

const getComplexityLevel = (skillLevel: string, timeConstraints: string): string => {
  if (skillLevel === 'beginner' || timeConstraints === 'quick') {
    return 'simple, 5 ingredients or less, minimal techniques';
  }
  if (skillLevel === 'intermediate' && timeConstraints === 'moderate') {
    return 'moderate complexity, up to 8 ingredients, basic techniques';
  }
  if (skillLevel === 'advanced' || skillLevel === 'expert') {
    return 'can be complex, multiple techniques allowed, gourmet ingredients ok';
  }
  return 'simple to moderate';
};

const getCalorieTarget = (userProfile: UserProfile | null, mealType: string): number => {
  if (!userProfile) {
    return mealType === 'breakfast' ? 350 : mealType === 'lunch' ? 450 : mealType === 'dinner' ? 550 : 150;
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
      testMetrics.totalRequents;
  }
  
  console.log('📊 Current metrics:', testMetrics);
};

// ✅ BRUTAL PANTRY-FOCUSED meal generation with enhanced QC
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
        model: "gpt-4o",
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

// ✅ ENHANCED: Quality Control meal generation with proper validation
export const generateAIMealWithQualityControl = async (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  previousMeals: Meal[] = []
): Promise<Meal> => {
  console.log(`🎯 Starting enhanced quality-controlled generation for ${mealType}`);
  
  const safePantryItems = Array.isArray(pantryItems) ? pantryItems : [];
  const safePreviousMeals = Array.isArray(previousMeals) ? previousMeals : [];
  
  // ✅ Build policy object
  const policy: MealPolicy = {
    name: 'enhanced_quality',
    dietaryRestrictions: userProfile?.dietary_restrictions || [],
    allergens: userProfile?.allergens || [],
    targetCalories: getCalorieTarget(userProfile, mealType),
    minPantryUsage: 0.7,
    cuisines: userProfile?.cuisine_preferences || [],
    pantryItems: safePantryItems
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
      
      // ✅ CRITICAL: Ensure meal has ingredients array
      if (!rawMeal.ingredients || !Array.isArray(rawMeal.ingredients)) {
        rawMeal.ingredients = [];
        console.warn('⚠️ Generated meal had no ingredients array, creating empty array');
      }
      
      // ✅ Quality Control validation - burada "cat" hatası düzeltildi
      const qcResult = await validateMealQuality(rawMeal, policy, safePreviousMeals, attempts);
      
      console.log(`🔍 QC Result for attempt ${attempts}:`, {
        isValid: qcResult.isValid,
        reason: qcResult.reason,
        score: qcResult.score
      });

      // Track best result
      if (qcResult.score > bestScore) {
        bestMeal = rawMeal;
        bestScore = qcResult.score;
      }

      // Accept if valid and good enough
      if (qcResult.isValid && qcResult.score > 0.7) {
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
      console.error(`❌ Generation attempt ${attempts} failed:`, error);
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }
  
  // Use best meal if no perfect match found
  if (bestMeal && bestScore > 0.3) {
    console.log(`⚠️ Using best meal with score ${bestScore}`);
    return {
      ...bestMeal,
      qualityScore: bestScore,
      qualityWarning: true,
      generationAttempts: maxAttempts
    };
  }
  
  throw new Error('Failed to generate quality meal after maximum attempts');
};

// ✅ Build pantry-focused prompt (aynı kalıyor, sadece temizlendi)
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
  "shoppingListItems": ["item1", "item2"],
  "restrictionsFollowed": true
}`;
};

// ✅ Parse meal function (düzeltildi)
const parseMealFromResponse = (responseText: string, request: AIGenerationRequest): Meal => {
  try {
    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedMeal = JSON.parse(cleanedText);
    
    if (parsedMeal.restrictionsFollowed !== true) {
      console.warn('AI reported that it failed to follow restrictions.');
      throw new Error('AI failed to follow dietary restrictions. Regenerating...');
    }
    
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
    if (error.message.includes('AI failed to follow')) {
        throw error;
    }
    throw new Error('Failed to parse AI meal response');
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

// ✅ ADDED: Missing function that ai-meal-plan.tsx needs
export const calculateAverageMatchScore = (meals: (Meal | null)[]): number => {
  const validMeals = meals.filter(Boolean) as Meal[];
  if (validMeals.length === 0) return 0;

  const totalMatchPercentage = validMeals.reduce((sum, meal) => 
    sum + (meal.matchPercentage || 0), 0
  );

  return Math.round(totalMatchPercentage / validMeals.length);
};

// Export other functions
export const generateAlternativeMeal = generateAIMeal; // Simplified
export const generateAIMealPlan = async () => { throw new Error('Not implemented yet'); };
export const getQualityMetrics = () => ({ hasQualityData: false });
export const getTestMetrics = (): TestMetrics => ({ ...testMetrics });
export const resetTestMetrics = (): void => {
  testMetrics = {
    totalRequests: 0,
    totalCost: 0,
    averageResponseTime: 0,
    successRate: 0,
    averageTokens: { input: 0, output: 0 }
  };
};
