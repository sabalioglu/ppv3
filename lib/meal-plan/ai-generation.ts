//lib/meal-plan/ai-generation.ts
// AI meal generation using OpenAI GPT-4o-mini with BRUTAL pantry-focused approach + anti-duplicate logic
import { PantryItem, UserProfile, Meal, AIGenerationRequest, AIGenerationResponse } from './types';
import { calculatePantryMatch } from './meal-matching'; // ✅ IMPORT aLınDI

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

  // Cooking skill level analysis
  const skillLevel = userProfile.cooking_skill_level || 'beginner';
  
  // Activity level to time constraints mapping
  const timeConstraints = getTimeConstraints(userProfile.activity_level);
  
  // Health goals to nutrition focus mapping
  const nutritionFocus = getNutritionFocus(userProfile.health_goals);
  
  // Cuisine preferences
  const cuisineStyle = userProfile.cuisine_preferences?.length > 0 
    ? userProfile.cuisine_preferences.join(', ') 
    : 'international';

  // Critical allergen warnings
  const allergenWarnings = userProfile.dietary_restrictions || [];
  
  // Dietary preferences guidelines
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
      return 'quick'; // Active people need fast meals
    case 'moderately_active':
      return 'moderate';
    case 'lightly_active':
    case 'sedentary':
      return 'flexible'; // More time for cooking
    default:
      return 'moderate';
  }
};

const getNutritionFocus = (healthGoals?: string[]): string => {
  if (!healthGoals?.length) return 'balanced';
  
  // Priority-based nutrition focus
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

  // Base calorie calculation from user data
  const { age, gender, height_cm, weight_kg, activity_level, health_goals } = userProfile;
  
  let bmr = 0;
  if (age && height_cm && weight_kg && gender) {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
      bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
    } else {
      bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
    }
  }

  // Activity level multiplier
  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extra_active': 1.9
  };
  
  const totalCalories = bmr * (activityMultipliers[activity_level as keyof typeof activityMultipliers] || 1.4);
  
  // Health goal adjustments
  let calorieAdjustment = 1.0;
  if (health_goals?.includes('weight_loss')) calorieAdjustment = 0.85;
  if (health_goals?.includes('muscle_gain')) calorieAdjustment = 1.15;
  
  const adjustedTotal = totalCalories * calorieAdjustment;
  
  // Meal distribution
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

// Skill-based cooking instructions
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

// Maliyet hesaplayıcı
const calculateCost = (usage: any) => {
  const inputCost = (usage.prompt_tokens / 1000) * 0.000150;
  const outputCost = (usage.completion_tokens / 1000) * 0.000600;
  return inputCost + outputCost;
};

// Token tahmini (yaklaşık)
const estimateTokens = (text: string) => {
  return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 chars
};

// Test metriklerini güncelle
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

// ✅ BRUTAL PANTRY-FOCUSED meal generation with anti-duplicate logic
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

// ✅ BRUTAL PANTRY-FOCUSED PROMPT with anti-duplicate logic
const buildPantryFocusedPrompt = (
  request: AIGenerationRequest, 
  previousMeals?: Meal[]
): string => {
  const { pantryItems, mealType, userProfile } = request;
  const profile = analyzeUserProfile(userProfile);
  
  // Pantry analizi
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

  const highQuantityItems = pantryItems
    .filter(item => item.quantity && item.quantity > 3)
    .map(item => item.name);

  const availableIngredients = pantryItems
    .map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`)
    .join(', ');

  // Anti-duplicate logic
  const usedIngredients = previousMeals?.flatMap(m => m.ingredients.map(i => i.name.toLowerCase())) || [];
  const usedCuisines = previousMeals?.flatMap(m => m.tags?.filter(tag => tag.includes('inspired') || tag.includes('cuisine'))) || [];
  const usedMainProteins = previousMeals?.flatMap(m => 
    m.ingredients.filter(ing => ing.category?.toLowerCase().includes('protein')).map(ing => ing.name.toLowerCase())
  ) || [];

  const calorieTarget = getCalorieTarget(userProfile, mealType);
  const detectedCuisine = detectPantryCuisine(pantryItems);
  const skillInstructions = getSkillBasedInstructions(profile.skillLevel);

  // Build allergen safety instructions
  const allergenSafety = profile.allergenWarnings.length > 0
    ? `- **Allergens:** NEVER include these ingredients or their derivatives: **${profile.allergenWarnings.join(', ')}**.`
    : '';

  // Build dietary compliance
  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `- **Dietary Needs:** The meal MUST be **${profile.dietaryGuidelines.join(', ')}**.`
    : '';

  // ✅ ADDED: Meal Type Constraints Logic
  const getMealTypeConstraints = (mealType: string) => {
    switch(mealType.toLowerCase()) {
      case 'breakfast':
        return `- **Meal Type Rule:** This is a **breakfast** meal. It MUST be a typical breakfast food (like eggs, oatmeal, smoothie, pancakes, yogurt). Avoid heavy, complex dinner-style dishes like salmon fillets or steak. It should be quick to prepare.`;
      case 'lunch':
        return `- **Meal Type Rule:** This is a **lunch** meal. It can be a salad, sandwich, wrap, soup, or a light-portioned main course. Avoid overly heavy or large dinner plates.`;
      case 'dinner':
        return `- **Meal Type Rule:** This is a **dinner** meal. It should be a satisfying and complete main course. It can be more complex than breakfast or lunch.`;
      case 'snack':
        return `- **Meal Type Rule:** This is a **snack**. It MUST be a small, light, and easy-to-eat item. Examples: a piece of fruit, yogurt, a handful of nuts, or a small energy bar.`;
      default:
        return '';
    }
  }
  const mealTypeConstraint = getMealTypeConstraints(mealType);

  return `You are a world-class chef creating a single, perfect ${mealType} recipe. Your absolute top priority is to follow the user's dietary needs and then maximize pantry usage.

🛑 NON-NEGOTIABLE RULES (MUST BE FOLLOWED):
${allergenSafety}
${dietaryCompliance}
${mealTypeConstraint}
- You MUST respond with valid JSON only. No extra text or explanations.

🏠 AVAILABLE PANTRY INGREDIENTS: ${availableIngredients}

🎯 STRICT PANTRY PRIORITY RULES:
1.  **Maximize Pantry Usage:** Use AT LEAST 80% of ingredients from the available pantry items.
2.  **Minimize Shopping:** Suggest a MAXIMUM of 2 additional ingredients for purchase.
3.  **Protein First:** If the pantry contains protein (${proteinItems.map(p => p.name).join(', ')}), you MUST use one as the main protein.
4.  **Use Vegetables:** If the pantry has vegetables (${vegetableItems.map(v => v.name).join(', ')}), you MUST include at least 2-3.
5.  **Grain Base:** If grains are available (${grainItems.map(g => g.name).join(', ')}), use one as a base or side.
6.  **Use Abundant Items:** Prioritize ingredients with higher quantities to reduce waste. These are high-quantity: ${highQuantityItems.join(', ')}.
7.  **Cuisine Adaptation:** Adapt the cuisine style to match the pantry ingredients.

🚫 ANTI-DUPLICATE RULES:
- **Avoid Repeated Ingredients:** Do not use these main ingredients again: ${usedIngredients.slice(0, 10).join(', ')}.
- **Vary Cuisines:** Avoid these recently used cuisines: ${usedCuisines.join(', ')}.
- **Rotate Proteins:** Do not use these proteins again: ${usedMainProteins.join(', ')}.
- Create a DIFFERENT meal approach from previous suggestions.

👤 USER PROFILE:
- **Cooking Skill:** ${profile.skillLevel}
- **Time Constraints:** ${profile.timeConstraints}
- **Nutrition Focus:** ${profile.nutritionFocus}
- **Health Goals:** ${userProfile?.health_goals?.join(', ') || 'general health'}

🍳 COOKING GUIDELINES:
${skillInstructions}

⏰ TIME CONSTRAINTS:
${profile.timeConstraints === 'quick' ? 
  '- Maximum 20 minutes total time' :
  profile.timeConstraints === 'moderate' ?
  '- 30-45 minutes total time acceptable' :
  '- No time restrictions'
}

🌍 SUGGESTED CUISINE DIRECTION: ${detectedCuisine} (based on pantry ingredients)

🚨 FORBIDDEN ACTIONS:
- DO NOT suggest expensive proteins if cheaper ones are available in pantry
- DO NOT ignore high-quantity pantry items in favor of small purchases
- DO NOT create recipes requiring specialty ingredients when pantry has basics
- DO NOT suggest the same primary protein/vegetable combination as previous meals
- DO NOT recommend ingredients that contradict dietary restrictions
- DO NOT create meals with less than 70% pantry ingredient usage

🎯 PANTRY OPTIMIZATION GOALS:
- Minimize shopping list additions (max 2 items)
- Maximize pantry turnover
- Create satisfying meals with available resources
- Ensure nutritional balance using pantry items
- Avoid repetition from previous meals

Create a ${mealType} recipe that follows these rules strictly. Target calories: ~${calorieTarget}

Respond with this exact JSON structure:
{
  "name": "Recipe Name (highlight main pantry ingredients used)",
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
    "Step 1: Preparation using pantry ingredients",
    "Step 2: Cooking process with specific techniques",
    "Step 3: Final assembly and serving"
  ],
  "tags": ["pantry-focused", "budget-friendly", "waste-reducing", "${detectedCuisine}"],
  "pantryUsagePercentage": 85,
  "shoppingListItems": ["item1", "item2"],
  "restrictionsFollowed": true
}`;
};

// ✅ Generate alternative meal with enhanced anti-duplicate logic
export const generateAlternativeMeal = async (
  request: AIGenerationRequest, 
  previousMeal?: Meal,
  variationType: 'cuisine' | 'complexity' | 'ingredients' = 'cuisine',
  allPreviousMeals?: Meal[]
): Promise<Meal> => {
  const prompt = buildAlternativePrompt(request, previousMeal, variationType, allPreviousMeals);
  
  console.log('🧪 Testing GPT-4o-mini for alternative meal with enhanced anti-duplicate...');
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
            content: "You are a professional chef creating alternative meal options with maximum pantry usage. Always respond with valid JSON only. No explanations or additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
        response_format: { type: "json_object" }
      } as OpenAIRequest)
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`⚡ Alternative meal response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    
    if (data.usage) {
      const cost = calculateCost(data.usage);
      console.log('💰 Alternative meal token usage:', data.usage);
      console.log('💰 Alternative meal estimated cost:', `$${cost.toFixed(6)}`);
    }
    
    const generatedText = data.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ GPT-4o-mini alternative meal response received');
    success = true;
    
    updateMetrics(responseTime, data.usage, success);
    
    return parseMealFromResponse(generatedText, request);
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    updateMetrics(responseTime, null, success);
    
    console.error('❌ AI alternative meal generation error:', error);
    throw error;
  }
};

// ✅ Enhanced alternative prompt with brutal anti-duplicate logic
const buildAlternativePrompt = (
  request: AIGenerationRequest, 
  previousMeal?: Meal,
  variationType: 'cuisine' | 'complexity' | 'ingredients' = 'cuisine',
  allPreviousMeals?: Meal[]
): string => {
  const { pantryItems, userProfile, mealType } = request;
  const profile = analyzeUserProfile(userProfile);
  
  const availableIngredients = pantryItems
    .map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`)
    .join(', ');

  const calorieTarget = getCalorieTarget(userProfile, mealType);

  // Enhanced anti-duplicate logic
  const allUsedIngredients = allPreviousMeals?.flatMap(m => m.ingredients.map(i => i.name.toLowerCase())) || [];
  const allUsedCuisines = allPreviousMeals?.flatMap(m => m.tags?.filter(tag => tag.includes('inspired') || tag.includes('cuisine'))) || [];
  const allUsedMainProteins = allPreviousMeals?.flatMap(m => 
    m.ingredients.filter(ing => ing.category?.toLowerCase().includes('protein')).map(ing => ing.name.toLowerCase())
  ) || [];

  // Build variation instructions
  let variationInstructions = '';
  if (previousMeal) {
    switch (variationType) {
      case 'cuisine':
        const avoidCuisines = profile.cuisineStyle.split(', ').slice(0, 2);
        variationInstructions = `
        🎯 VARIATION FOCUS: Different cuisine style
        Previous meal was: "${previousMeal.name}"
        Try a completely different cuisine approach. Avoid: ${avoidCuisines.join(', ')}
        Consider: fusion, comfort food, or international flavors not yet explored.
        Use different spice profiles and cooking methods.
        `;
        break;
      
      case 'complexity':
        const newComplexity = previousMeal.difficulty === 'Easy' ? 'intermediate' : 'beginner';
        variationInstructions = `
        🎯 VARIATION FOCUS: Different complexity level
        Previous meal difficulty: ${previousMeal.difficulty}
        Target complexity: ${newComplexity}
        ${newComplexity === 'beginner' ? 'Make it simpler and faster with fewer steps' : 'Add more interesting techniques and flavor layers'}
        `;
        break;
      
      case 'ingredients':
        const usedIngredients = previousMeal.ingredients.map(ing => ing.name).slice(0, 3);
        variationInstructions = `
        🎯 VARIATION FOCUS: Different ingredient combination
        Previous meal used: ${usedIngredients.join(', ')}
        Try to use completely different primary ingredients from pantry while maintaining nutrition goals.
        Focus on unused pantry items.
        `;
        break;
    }
  }

  // Build allergen safety instructions
  const allergenSafety = profile.allergenWarnings.length > 0
    ? `- **Allergens:** NEVER include these ingredients or their derivatives: **${profile.allergenWarnings.join(', ')}**.`
    : '';

  // Build dietary compliance
  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `- **Dietary Needs:** The meal MUST be **${profile.dietaryGuidelines.join(', ')}**.`
    : '';

  return `You are a creative chef generating a completely DIFFERENT ${mealType} recipe. Your top priorities are zero repetition and strict adherence to user needs.

🛑 NON-NEGOTIABLE RULES (MUST BE FOLLOWED):
${allergenSafety}
${dietaryCompliance}
- You MUST respond with valid JSON only. No extra text or explanations.

${variationInstructions}

🏠 AVAILABLE PANTRY INGREDIENTS: ${availableIngredients}

🚫 BRUTAL ANTI-DUPLICATE RULES:
- **ABSOLUTELY AVOID** these main ingredients: ${allUsedIngredients.slice(0, 15).join(', ')}.
- **COMPLETELY AVOID** these cuisines: ${allUsedCuisines.join(', ')}.
- **DO NOT USE** these proteins again: ${allUsedMainProteins.join(', ')}.
- Create a **RADICALLY DIFFERENT** meal. Use new cooking methods and flavor profiles.

🎯 PANTRY MAXIMIZATION RULES:
- Use AT LEAST 80% ingredients from the pantry.
- Maximum 2 shopping list items.
- Prioritize UNUSED pantry ingredients.

👤 USER PROFILE:
- **Cooking Skill:** ${profile.skillLevel}
- **Time Constraints:** ${profile.timeConstraints}
- **Nutrition Focus:** ${profile.nutritionFocus}
- **Health Goals:** ${userProfile?.health_goals?.join(', ') || 'general health'}

🎯 ALTERNATIVE MEAL REQUIREMENTS:
- Target Calories: ~${calorieTarget}
- Use maximum pantry ingredients possible
- Create something COMPLETELY DIFFERENT from previous suggestions
- Be creative while staying within dietary restrictions
- Focus on underutilized pantry items

Respond with this exact JSON structure:
{
  "name": "Unique Creative Recipe Name (highlight pantry ingredients)",
  "ingredients": [
    {"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables", "fromPantry": true},
    {"name": "ingredient2", "amount": 2, "unit": "pieces", "category": "Protein", "fromPantry": true}
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
    "Step 1: Different preparation approach using pantry ingredients",
    "Step 2: Unique cooking process with specific techniques",
    "Step 3: Creative assembly and serving"
  ],
  "tags": ["alternative", "creative", "pantry-focused", "unique"],
  "pantryUsagePercentage": 85,
  "shoppingListItems": ["item1", "item2"],
  "restrictionsFollowed": true
}`;
};

const parseMealFromResponse = (responseText: string, request: AIGenerationRequest): Meal => {
  try {
    // Clean the response text
    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedMeal = JSON.parse(cleanedText);
    
    // ✅ AI Self-Verification Check
    if (parsedMeal.restrictionsFollowed !== true) {
      console.warn('AI reported that it failed to follow restrictions.');
      throw new Error('AI failed to follow dietary restrictions. Regenerating...');
    }
    
    // ✅ Calculate pantry match score immediately after generation
    const pantryMatch = calculatePantryMatch(parsedMeal.ingredients || [], request.pantryItems);
    
    // Generate meal ID and add metadata
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
      // ✅ Add match results to the meal object
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
  
  // Cuisine-specific emojis
  if (name.includes('italian') || name.includes('pasta')) return '🍝';
  if (name.includes('asian') || name.includes('chinese') || name.includes('stir fry')) return '🥢';
  if (name.includes('mexican') || name.includes('taco') || name.includes('burrito')) return '🌮';
  if (name.includes('indian') || name.includes('curry')) return '🍛';
  if (name.includes('japanese') || name.includes('sushi')) return '🍣';
  if (name.includes('greek') || name.includes('mediterranean')) return '🫒';
  if (name.includes('turkish') || name.includes('kebab')) return '🥙';
  
  // Specific food emojis
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
  
  // Meal type defaults
  switch (mealType) {
    case 'breakfast': return '🍳';
    case 'lunch': return '🥗';
    case 'dinner': return '🍽️';
    case 'snack': return '🍎';
    default: return '🍽️';
  }
};

export const generateAIMealPlan = async (
  pantryItems: PantryItem[],
  userProfile: UserProfile | null
): Promise<{
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
  snacks: Meal[];
}> => {
  console.log('🧪 Testing GPT-4o-mini for full meal plan with brutal pantry focus...');
  
  try {
    const baseRequest = {
      pantryItems,
      userProfile,
      preferences: userProfile?.dietary_preferences || [],
      restrictions: userProfile?.dietary_restrictions || []
    };

    // Generate meals sequentially to avoid duplicates
    const breakfast = await generateAIMeal({
      ...baseRequest,
      mealType: 'breakfast',
      targetCalories: getCalorieTarget(userProfile, 'breakfast'),
      targetProtein: Math.round(getCalorieTarget(userProfile, 'breakfast') * 0.15 / 4)
    });

    const lunch = await generateAIMeal({
      ...baseRequest,
      mealType: 'lunch',
      targetCalories: getCalorieTarget(userProfile, 'lunch'),
      targetProtein: Math.round(getCalorieTarget(userProfile, 'lunch') * 0.20 / 4)
    }, [breakfast]);

    const dinner = await generateAIMeal({
      ...baseRequest,
      mealType: 'dinner',
      targetCalories: getCalorieTarget(userProfile, 'dinner'),
      targetProtein: Math.round(getCalorieTarget(userProfile, 'dinner') * 0.25 / 4)
    }, [breakfast, lunch]);

    const snack = await generateAIMeal({
      ...baseRequest,
      mealType: 'snack',
      targetCalories: getCalorieTarget(userProfile, 'snack'),
      targetProtein: Math.round(getCalorieTarget(userProfile, 'snack') * 0.10 / 4)
    }, [breakfast, lunch, dinner]);

    console.log('✅ Full meal plan generated successfully with maximum pantry usage');
    console.log('📊 Final test metrics:', testMetrics);

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

// ✅ CRITICAL: Export the missing function that ai-meal-plan.tsx needs
export const generateAIMealWithQualityControl = async (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  previousMeals: Meal[] = []
): Promise<Meal> => {
  const { validateMealWithStages } = await import('./quality-control');
  const { consumePantryIngredients } = await import('./pantry-consumption');
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🎯 Quality-controlled generation attempt ${attempts}/${maxAttempts}`);
    
    try {
      // Generate raw meal
      const rawMeal = await generateAIMeal({
        pantryItems,
        userProfile,
        mealType,
        preferences: userProfile?.dietary_preferences || [],
        restrictions: userProfile?.dietary_restrictions || []
      }, previousMeals);
      
      // Run quality control
      const qualityAssessment = await validateMealWithStages(rawMeal, pantryItems, userProfile);
      
      if (qualityAssessment.overallPass && qualityAssessment.confidence > 70) {
        console.log(`✅ Quality control passed on attempt ${attempts}`);
        
        // Consume pantry ingredients
        if (userProfile?.id) {
          await consumePantryIngredients(qualityAssessment.finalMeal || rawMeal, pantryItems, userProfile.id);
        }
        
        return qualityAssessment.finalMeal || rawMeal;
      } else if (attempts === maxAttempts) {
        // Last attempt - return with warning
        console.warn(`⚠️ Quality control failed after ${maxAttempts} attempts`);
        return {
          ...qualityAssessment.finalMeal || rawMeal,
          qualityWarning: true,
          qualityIssues: qualityAssessment.stages.filter(s => !s.passed),
          qualityScore: qualityAssessment.confidence
        };
      }
      
      console.log(`❌ Quality control failed attempt ${attempts}, retrying...`);
      
    } catch (error) {
      console.error(`❌ Generation attempt ${attempts} failed:`, error);
      
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate quality meal after maximum attempts');
};

// Export quality metrics for UI display
export const getQualityMetrics = (meal: Meal): {
  hasQualityData: boolean;
  score?: number;
  warning?: boolean;
  issues?: any[];
} => {
  return {
    hasQualityData: !!(meal as any).qualityScore,
    score: (meal as any).qualityScore,
    warning: (meal as any).qualityWarning,
    issues: (meal as any).qualityIssues
  };
};

// Test metriklerini dışa aktar
export const getTestMetrics = (): TestMetrics => {
  return { ...testMetrics };
};

// Test metriklerini sıfırla
export const resetTestMetrics = (): void => {
  testMetrics = {
    totalRequests: 0,
    totalCost: 0,
    averageResponseTime: 0,
    successRate: 0,
    averageTokens: { input: 0, output: 0 }
  };
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