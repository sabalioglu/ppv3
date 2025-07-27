//lib/meal-plan/ai-generation.ts
// AI meal generation using OpenAI GPT-4o-mini with comprehensive user profiling + alternatives
import { PantryItem, UserProfile, Meal, AIGenerationRequest, AIGenerationResponse } from './types';

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

// Test için basit meal generation
export const generateAIMeal = async (request: AIGenerationRequest): Promise<Meal> => {
  const prompt = buildEnhancedMealPrompt(request);
  
  console.log('🧪 Testing GPT-4o-mini...');
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
        model: "gpt-4o-mini", // ✅ En ucuz ve hızlı model
        messages: [
          {
            role: "system",
            content: "You are a professional chef and nutritionist. Always respond with valid JSON only. No explanations or additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800, // ✅ Maliyeti kontrol et
        temperature: 0.7,
        response_format: { type: "json_object" } // ✅ JSON garantisi
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
    
    // ✅ Usage bilgilerini log'la
    if (data.usage) {
      const cost = calculateCost(data.usage);
      console.log('💰 Token usage:', data.usage);
      console.log('💰 Estimated cost:', `$${cost.toFixed(6)}`);
    }
    
    const generatedText = data.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ GPT-4o-mini response received');
    success = true;
    
    // Metrikleri güncelle
    updateMetrics(responseTime, data.usage, success);
    
    return parseMealFromResponse(generatedText, request);
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Hata durumunda da metrikleri güncelle
    updateMetrics(responseTime, null, success);
    
    console.error('❌ AI meal generation error:', error);
    throw error;
  }
};

// ✅ NEW: Generate alternative meal with different approach
export const generateAlternativeMeal = async (
  request: AIGenerationRequest, 
  previousMeal?: Meal,
  variationType: 'cuisine' | 'complexity' | 'ingredients' = 'cuisine'
): Promise<Meal> => {
  const prompt = buildAlternativePrompt(request, previousMeal, variationType);
  
  console.log('🧪 Testing GPT-4o-mini for alternative meal...');
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
            content: "You are a professional chef creating alternative meal options. Always respond with valid JSON only. No explanations or additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.8, // Slightly higher for more creativity
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
    
    // Metrikleri güncelle
    updateMetrics(responseTime, data.usage, success);
    
    return parseMealFromResponse(generatedText, request);
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Hata durumunda da metrikleri güncelle
    updateMetrics(responseTime, null, success);
    
    console.error('❌ AI alternative meal generation error:', error);
    throw error;
  }
};

// ✅ NEW: Build alternative prompt with variation focus
const buildAlternativePrompt = (
  request: AIGenerationRequest, 
  previousMeal?: Meal,
  variationType: 'cuisine' | 'complexity' | 'ingredients' = 'cuisine'
): string => {
  const { pantryItems, userProfile, mealType } = request;
  const profile = analyzeUserProfile(userProfile);
  
  const availableIngredients = pantryItems
    .slice(0, 8) // Token tasarrufu için sadece ilk 8 ingredient
    .map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`)
    .join(', ');

  const calorieTarget = getCalorieTarget(userProfile, mealType);

  // Build variation instructions
  let variationInstructions = '';
  if (previousMeal) {
    switch (variationType) {
      case 'cuisine':
        const avoidCuisines = profile.cuisineStyle.split(', ').slice(0, 2);
        variationInstructions = `
        VARIATION FOCUS: Different cuisine style
        Previous meal was: "${previousMeal.name}"
        Try a different cuisine approach. Avoid: ${avoidCuisines.join(', ')}
        Consider: fusion, comfort food, or international flavors not yet explored.
        `;
        break;
      
      case 'complexity':
        const newComplexity = previousMeal.difficulty === 'Easy' ? 'intermediate' : 'beginner';
        variationInstructions = `
        VARIATION FOCUS: Different complexity level
        Previous meal difficulty: ${previousMeal.difficulty}
        Target complexity: ${newComplexity}
        ${newComplexity === 'beginner' ? 'Make it simpler and faster' : 'Add more interesting techniques'}
        `;
        break;
      
      case 'ingredients':
        const usedIngredients = previousMeal.ingredients.map(ing => ing.name).slice(0, 3);
        variationInstructions = `
        VARIATION FOCUS: Different ingredient combination
        Previous meal used: ${usedIngredients.join(', ')}
        Try to use different primary ingredients from pantry while maintaining nutrition goals.
        `;
        break;
    }
  }

  // Build allergen safety instructions
  const allergenSafety = profile.allergenWarnings.length > 0 
    ? `🚨 CRITICAL ALLERGEN SAFETY: User is allergic to: ${profile.allergenWarnings.join(', ')}. 
       NEVER include these ingredients or their derivatives.`
    : '';

  // Build dietary compliance
  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `Dietary preferences: ${profile.dietaryGuidelines.join(', ')}`
    : '';

  return `Create an ALTERNATIVE ${mealType} recipe.

${variationInstructions}

USER PROFILE:
- Cooking Skill: ${profile.skillLevel}
- Time Constraints: ${profile.timeConstraints}
- Nutrition Focus: ${profile.nutritionFocus}
- Health Goals: ${userProfile?.health_goals?.join(', ') || 'general health'}

${allergenSafety}

${dietaryCompliance}

AVAILABLE INGREDIENTS: ${availableIngredients}

REQUIREMENTS:
- Target Calories: ~${calorieTarget}
- Use maximum pantry ingredients possible
- Create something DIFFERENT from typical ${mealType} options
- Be creative within dietary restrictions

Respond with this exact JSON structure:
{
  "name": "Creative Recipe Name",
  "ingredients": [
    {"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables"},
    {"name": "ingredient2", "amount": 2, "unit": "pieces", "category": "Protein"}
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
    "Step 1: Detailed preparation step",
    "Step 2: Cooking process with timing",
    "Step 3: Final assembly and serving"
  ],
  "tags": ["alternative", "creative", "personalized"]
}`;
};

const buildEnhancedMealPrompt = (request: AIGenerationRequest): string => {
  const { pantryItems, userProfile, mealType } = request;
  const profile = analyzeUserProfile(userProfile);
  
  const availableIngredients = pantryItems
    .slice(0, 8) // Token tasarrufu için sadece ilk 8 ingredient
    .map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`)
    .join(', ');

  const calorieTarget = getCalorieTarget(userProfile, mealType);
  const complexityLevel = getComplexityLevel(profile.skillLevel, profile.timeConstraints);

  // Build allergen safety instructions
  const allergenSafety = profile.allergenWarnings.length > 0 
    ? `🚨 CRITICAL ALLERGEN SAFETY: User is allergic to: ${profile.allergenWarnings.join(', ')}. 
       NEVER include these ingredients or their derivatives.`
    : '';

  // Build dietary compliance
  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `Dietary preferences: ${profile.dietaryGuidelines.join(', ')}`
    : '';

  return `Create a personalized ${mealType} recipe.

USER PROFILE:
- Cooking Skill: ${profile.skillLevel}
- Time Constraints: ${profile.timeConstraints}
- Nutrition Focus: ${profile.nutritionFocus}
- Preferred Cuisines: ${profile.cuisineStyle}
- Health Goals: ${userProfile?.health_goals?.join(', ') || 'general health'}

${allergenSafety}

${dietaryCompliance}

AVAILABLE INGREDIENTS: ${availableIngredients}

REQUIREMENTS:
- Target Calories: ~${calorieTarget}
- Complexity: ${complexityLevel}
- Use maximum pantry ingredients possible
- Match user's cuisine preferences when possible

TIME CONSTRAINTS:
${profile.timeConstraints === 'quick' ? 
  '- Maximum 20 minutes total time' :
  profile.timeConstraints === 'moderate' ?
  '- 30-45 minutes total time acceptable' :
  '- No time restrictions'
}

Respond with this exact JSON structure:
{
  "name": "Recipe Name",
  "ingredients": [
    {"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables"},
    {"name": "ingredient2", "amount": 2, "unit": "pieces", "category": "Protein"}
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
    "Step 1: Detailed preparation step",
    "Step 2: Cooking process with timing",
    "Step 3: Final assembly and serving"
  ],
  "tags": ["health-goal-aligned", "skill-appropriate"]
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
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing AI meal response:', error);
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
  console.log('🧪 Testing GPT-4o-mini for full meal plan...');
  
  try {
    const baseRequest = {
      pantryItems,
      userProfile,
      preferences: userProfile?.dietary_preferences || [],
      restrictions: userProfile?.dietary_restrictions || []
    };

    // Generate meals in parallel with personalized targets
    const breakfastCalories = getCalorieTarget(userProfile, 'breakfast');
    const lunchCalories = getCalorieTarget(userProfile, 'lunch');
    const dinnerCalories = getCalorieTarget(userProfile, 'dinner');
    const snackCalories = getCalorieTarget(userProfile, 'snack');

    const [breakfast, lunch, dinner] = await Promise.all([
      generateAIMeal({
        ...baseRequest,
        mealType: 'breakfast',
        targetCalories: breakfastCalories,
        targetProtein: Math.round(breakfastCalories * 0.15 / 4) // 15% protein
      }),
      generateAIMeal({
        ...baseRequest,
        mealType: 'lunch',
        targetCalories: lunchCalories,
        targetProtein: Math.round(lunchCalories * 0.20 / 4) // 20% protein
      }),
      generateAIMeal({
        ...baseRequest,
        mealType: 'dinner',
        targetCalories: dinnerCalories,
        targetProtein: Math.round(dinnerCalories * 0.25 / 4) // 25% protein
      })
    ]);

    // Generate a personalized snack
    const snack = await generateAIMeal({
      ...baseRequest,
      mealType: 'snack',
      targetCalories: snackCalories,
      targetProtein: Math.round(snackCalories * 0.10 / 4) // 10% protein
    });

    console.log('✅ Full meal plan generated successfully');
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
