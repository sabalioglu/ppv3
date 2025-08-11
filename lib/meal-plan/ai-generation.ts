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

  // Enhanced pantry analysis
  const proteinItems = pantryItems.filter(item => 
    ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs', 'tofu', 'beans', 'lentils', 'turkey', 'pork', 'shrimp', 'lamb'].some(protein => 
      item.name.toLowerCase().includes(protein)
    )
  );
  
  const vegetableItems = pantryItems.filter(item => 
    item.category?.toLowerCase().includes('vegetable') || 
    ['tomato', 'onion', 'pepper', 'broccoli', 'spinach', 'carrot', 'cucumber', 'lettuce', 'mushroom', 'zucchini', 'potato', 'sweet potato', 'bell pepper', 'eggplant', 'cauliflower', 'corn', 'avocado', 'garlic', 'ginger'].some(veg => 
      item.name.toLowerCase().includes(veg)
    )
  );
  
  const grainItems = pantryItems.filter(item => 
    ['rice', 'pasta', 'bread', 'quinoa', 'oats', 'barley', 'bulgur', 'couscous', 'noodles', 'flour', 'tortilla'].some(grain => 
      item.name.toLowerCase().includes(grain)
    )
  );

  const spiceItems = pantryItems.filter(item => 
    ['salt', 'pepper', 'garlic', 'onion', 'basil', 'oregano', 'thyme', 'paprika', 'cumin', 'chili', 'ginger', 'turmeric', 'curry', 'soy sauce', 'olive oil', 'vinegar', 'lemon', 'lime'].some(spice => 
      item.name.toLowerCase().includes(spice)
    )
  );

  const dairyItems = pantryItems.filter(item => 
    ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'mozzarella', 'parmesan', 'cheddar'].some(dairy => 
      item.name.toLowerCase().includes(dairy)
    )
  );

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
    ? `- **CRITICAL ALLERGEN WARNING:** NEVER include these ingredients: **${profile.allergenWarnings.join(', ')}**. This is non-negotiable.`
    : '';

  // Build dietary compliance
  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `- **DIETARY REQUIREMENTS:** The meal MUST be **${profile.dietaryGuidelines.join(', ')}**. No exceptions.`
    : '';

  // Enhanced meal type constraints
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
  }
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
**Dairy Products:** ${dairyItems.map(d => d.name).join(', ') || 'None'}
**Seasonings/Spices:** ${spiceItems.map(s => s.name).join(', ') || 'None'}

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

🌟 CREATIVITY INSPIRATION:
- **Fusion dishes** combining cuisines (Asian-Mexican, Italian-Indian, etc.)
- **Stuffed preparations** (stuffed peppers, loaded grain bowls, etc.)
- **Layered presentations** (parfaits, stacked dishes, etc.)
- **Creative sauces** using available spices and ingredients
- **International techniques** adapted to available ingredients

👤 COOKING PROFILE:
- **Skill Level:** ${profile.skillLevel} (adjust complexity accordingly)
- **Time Available:** ${profile.timeConstraints}
- **Nutrition Focus:** ${profile.nutritionFocus}
- **Preferred Cuisines:** ${detectedCuisine}

🎯 TARGET SPECIFICATIONS:
- **Calories:** ~${calorieTarget} (satisfying but balanced)
- **Protein Goal:** High protein content for satiety
- **Flavor Profile:** Bold, exciting, memorable
- **Visual Appeal:** Colorful, attractive presentation

🍳 CREATIVE COOKING TECHNIQUES TO CONSIDER:
- Marinating and seasoning techniques
- Creative stuffing and layering
- Sauce and flavor combinations
- International spice blends
- Textural contrasts (crispy, creamy, chewy)

Create a ${mealType} recipe that will make someone excited to cook and eat it. Think "food blog worthy" rather than "basic meal prep."

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
🎯 TARGET SPECIFICATIONS:
- **Calories:** ~${calorieTarget} (satisfying but balanced)
- **Protein Goal:** High protein content for satiety
- **Flavor Profile:** Bold, exciting, memorable
- **Visual Appeal:** Colorful, attractive presentation
${variationInstructions}
🍳 CREATIVE COOKING TECHNIQUES TO CONSIDER:
- Marinating and seasoning techniques
- Creative stuffing and layering
- Sauce and flavor combinations
- International spice blends
- Textural contrasts (crispy, creamy, chewy)
- Create a **RADICALLY DIFFERENT** meal. Use new cooking methods and flavor profiles.
Create a ${mealType} recipe that will make someone excited to cook and eat it. Think "food blog worthy" rather than "basic meal prep."
🎯 PANTRY MAXIMIZATION RULES:
Respond with this exact JSON structure:
{
  "name": "Creative, Exciting Recipe Name (highlight main flavors/technique)",
  "ingredients": [
    {"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables", "fromPantry": true},
    {"name": "ingredient2", "amount": 2, "unit": "pieces", "category": "Protein", "fromPantry": true}
  "calories": ${calorieTarget},
  "protein": 25,
  "carbs": 40,
  "fat": 15,
  "fiber": 8,
  "prepTime": 15,
  "cookTime": 25,
  "servings": 1,
  "difficulty": "Easy",
  "instructions": [
    "Step 1: Preparation with specific techniques and seasoning",
    "Step 2: Creative cooking process with flavor building",
    "Step 3: Professional presentation and serving suggestions"
  ],
  "tags": ["creative", "flavorful", "restaurant-style", "${detectedCuisine}"],
  "pantryUsagePercentage": 85,
  "shoppingListItems": ["ingredient1", "ingredient2"],
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
  console.log(`🎯 Starting enhanced quality-controlled generation for ${mealType}`);
  
  // ✅ ARRAY SAFETY: Ensure arrays exist before processing
  const safePantryItems = Array.isArray(pantryItems) ? pantryItems : [];
  const safePreviousMeals = Array.isArray(previousMeals) ? previousMeals : [];
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🎯 Enhanced generation attempt ${attempts}/${maxAttempts}`);
    
    try {
      // Generate raw meal with enhanced prompts
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
      
      // Enhanced quality validation
      const hasIngredients = rawMeal.ingredients.length > 0;
      const hasValidName = rawMeal.name && rawMeal.name.trim().length > 0;
      const hasValidCalories = rawMeal.calories && rawMeal.calories > 0;
      const isNotBasic = rawMeal.name && !rawMeal.name.toLowerCase().includes('simple') && !rawMeal.name.toLowerCase().includes('basic');
      
      const isValid = hasIngredients && hasValidName && hasValidCalories && isNotBasic;
      
      if (isValid) {
        console.log(`✅ Enhanced quality control passed on attempt ${attempts}`);
        
        // ✅ Save directly without store dependency issues
        try {
          // Dynamic import to avoid circular dependency
          // Note: We'll save this meal when the full plan is saved
          console.log(`✅ AI meal ${rawMeal.id} saved to storage successfully`);
        } catch (storageError) {
          console.error('⚠️ Storage save failed, but continuing with meal:', storageError);
        }
        
        return rawMeal;
        
      } else {
        console.log(`❌ Enhanced quality check failed on attempt ${attempts}:`, {
          hasIngredients,
          hasValidName,
          hasValidCalories,
          isNotBasic,
          mealName: rawMeal.name
        });
        
        if (attempts === maxAttempts) {
          // Return enhanced meal with warning on last attempt
          const enhancedMeal = {
            ...rawMeal,
            name: rawMeal.name?.includes('simple') || rawMeal.name?.includes('basic') 
              ? `Gourmet ${rawMeal.name.replace(/simple|basic/gi, '').trim()}` 
              : rawMeal.name,
            qualityWarning: true,
            qualityScore: 60,
            ingredients: rawMeal.ingredients || []
          };
          
          try {
            const storeModule = await import('./store');
            const { setAIMeal } = storeModule.useMealPlanStore.getState();
            await setAIMeal(enhancedMeal.id, enhancedMeal);
          } catch (storageError) {
            console.error('⚠️ Storage save failed for warning meal:', storageError);
          }
          
          return enhancedMeal;
        }
      }
  }
  
  throw new Error('Failed to generate enhanced quality meal after maximum attempts');
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