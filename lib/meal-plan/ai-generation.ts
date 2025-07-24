//lib/meal-plan/ai-generation.ts
// AI meal generation using Gemini API with comprehensive user profiling and individual regeneration
import { PantryItem, UserProfile, Meal, AIGenerationRequest, AIGenerationResponse } from './types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

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

export const generateAIMeal = async (request: AIGenerationRequest): Promise<Meal> => {
  const prompt = buildEnhancedMealPrompt(request);
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      } as GeminiRequest)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    return parseMealFromResponse(generatedText, request);
  } catch (error) {
    console.error('AI meal generation error:', error);
    throw error;
  }
};

// ✅ NEW: Generate alternative meal with different cuisine/style
export const generateAlternativeMeal = async (
  request: AIGenerationRequest, 
  previousMeal?: Meal,
  alternativeType: 'different_cuisine' | 'simpler' | 'healthier' | 'random' = 'random'
): Promise<Meal> => {
  const prompt = buildAlternativeMealPrompt(request, previousMeal, alternativeType);
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      } as GeminiRequest)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    return parseMealFromResponse(generatedText, request);
  } catch (error) {
    console.error('AI alternative meal generation error:', error);
    throw error;
  }
};

const buildEnhancedMealPrompt = (request: AIGenerationRequest): string => {
  const { pantryItems, userProfile, mealType } = request;
  const profile = analyzeUserProfile(userProfile);
  
  const availableIngredients = pantryItems.map(item => 
    `${item.name} (${item.quantity} ${item.unit || 'units'})`
  ).join(', ');

  const calorieTarget = getCalorieTarget(userProfile, mealType);
  const complexityLevel = getComplexityLevel(profile.skillLevel, profile.timeConstraints);

  // Build allergen safety instructions
  const allergenSafety = profile.allergenWarnings.length > 0 
    ? `🚨 CRITICAL ALLERGEN SAFETY: User is allergic to: ${profile.allergenWarnings.join(', ')}. 
       NEVER include these ingredients or their derivatives. Double-check all ingredients for cross-contamination risks.`
    : '';

  // Build dietary compliance
  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `Dietary preferences to follow: ${profile.dietaryGuidelines.join(', ')}`
    : '';

  return `
You are a professional nutritionist and chef creating a personalized ${mealType} recipe.

USER PROFILE:
- Cooking Skill: ${profile.skillLevel}
- Time Constraints: ${profile.timeConstraints}
- Nutrition Focus: ${profile.nutritionFocus}
- Preferred Cuisines: ${profile.cuisineStyle}
- Age: ${userProfile?.age || 'not specified'}
- Gender: ${userProfile?.gender || 'not specified'}
- Activity Level: ${userProfile?.activity_level || 'moderate'}
- Health Goals: ${userProfile?.health_goals?.join(', ') || 'general health'}

${allergenSafety}

${dietaryCompliance}

AVAILABLE PANTRY INGREDIENTS: ${availableIngredients}

RECIPE REQUIREMENTS:
- Meal Type: ${mealType}
- Target Calories: ~${calorieTarget} calories
- Complexity: ${complexityLevel}
- Use maximum pantry ingredients possible
- Minimize shopping list additions
- Match user's cuisine preferences when possible
- Consider user's health goals in nutrition balance

RECIPE COMPLEXITY GUIDELINES:
${profile.skillLevel === 'beginner' ? 
  '- Keep it simple: basic cooking methods only (boiling, baking, pan-frying)\n- Maximum 5 main ingredients\n- 30 minutes total time or less' :
  profile.skillLevel === 'intermediate' ?
  '- Moderate techniques allowed (sautéing, roasting, basic seasoning)\n- Up to 8 ingredients\n- 45 minutes total time' :
  '- Advanced techniques welcome (braising, complex seasonings, multiple steps)\n- No ingredient limit\n- Any cooking time acceptable'
}

TIME CONSTRAINTS:
${profile.timeConstraints === 'quick' ? 
  '- Maximum 20 minutes total time\n- Minimal prep work\n- One-pot or sheet-pan meals preferred' :
  profile.timeConstraints === 'moderate' ?
  '- 30-45 minutes total time acceptable\n- Some prep work ok' :
  '- No time restrictions\n- Complex preparation acceptable'
}

Please respond with a JSON object in this exact format:
{
  "name": "Recipe Name (cuisine-inspired if applicable)",
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
  "difficulty": "${profile.skillLevel}",
  "instructions": [
    "Step 1: Detailed preparation step",
    "Step 2: Cooking process with timing",
    "Step 3: Final assembly and serving"
  ],
  "tags": ["health-goal-aligned", "cuisine-style", "skill-appropriate"]
}

Only return the JSON object, no additional text.
`;
};

// ✅ NEW: Build alternative meal prompt with variation instructions
const buildAlternativeMealPrompt = (
  request: AIGenerationRequest, 
  previousMeal?: Meal,
  alternativeType: string = 'random'
): string => {
  const { pantryItems, userProfile, mealType } = request;
  const profile = analyzeUserProfile(userProfile);
  
  const availableIngredients = pantryItems.map(item => 
    `${item.name} (${item.quantity} ${item.unit || 'units'})`
  ).join(', ');

  const calorieTarget = getCalorieTarget(userProfile, mealType);
  const complexityLevel = getComplexityLevel(profile.skillLevel, profile.timeConstraints);

  // Build allergen safety instructions
  const allergenSafety = profile.allergenWarnings.length > 0 
    ? `🚨 CRITICAL ALLERGEN SAFETY: User is allergic to: ${profile.allergenWarnings.join(', ')}. 
       NEVER include these ingredients or their derivatives. Double-check all ingredients for cross-contamination risks.`
    : '';

  // Build dietary compliance
  const dietaryCompliance = profile.dietaryGuidelines.length > 0
    ? `Dietary preferences to follow: ${profile.dietaryGuidelines.join(', ')}`
    : '';

  // Build variation instructions
  const variationInstructions = getVariationInstructions(alternativeType, previousMeal, profile);

  return `
You are a professional nutritionist and chef creating an ALTERNATIVE ${mealType} recipe.

${previousMeal ? `PREVIOUS MEAL TO AVOID SIMILARITY: "${previousMeal.name}"` : ''}

VARIATION REQUEST: ${variationInstructions}

USER PROFILE:
- Cooking Skill: ${profile.skillLevel}
- Time Constraints: ${profile.timeConstraints}
- Nutrition Focus: ${profile.nutritionFocus}
- Preferred Cuisines: ${profile.cuisineStyle}
- Age: ${userProfile?.age || 'not specified'}
- Gender: ${userProfile?.gender || 'not specified'}
- Activity Level: ${userProfile?.activity_level || 'moderate'}
- Health Goals: ${userProfile?.health_goals?.join(', ') || 'general health'}

${allergenSafety}

${dietaryCompliance}

AVAILABLE PANTRY INGREDIENTS: ${availableIngredients}

RECIPE REQUIREMENTS:
- Meal Type: ${mealType}
- Target Calories: ~${calorieTarget} calories
- Complexity: ${complexityLevel}
- Use maximum pantry ingredients possible
- Minimize shopping list additions
- Create something DIFFERENT from previous suggestion
- Match variation request above

Please respond with a JSON object in this exact format:
{
  "name": "Recipe Name (different from previous)",
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
  "difficulty": "${profile.skillLevel}",
  "instructions": [
    "Step 1: Detailed preparation step",
    "Step 2: Cooking process with timing",
    "Step 3: Final assembly and serving"
  ],
  "tags": ["alternative", "different-style", "skill-appropriate"]
}

Only return the JSON object, no additional text.
`;
};

const getVariationInstructions = (
  alternativeType: string, 
  previousMeal?: Meal, 
  profile?: any
): string => {
  switch (alternativeType) {
    case 'different_cuisine':
      return `Create a recipe from a COMPLETELY DIFFERENT cuisine style than the previous meal. 
              If previous was Italian, try Asian. If previous was Mexican, try Mediterranean. 
              Focus on authentic flavors and techniques from the new cuisine.`;
    
    case 'simpler':
      return `Create a SIMPLER version with fewer ingredients and easier cooking methods. 
              Maximum 5 ingredients, one-pot or no-cook preferred. 
              Reduce prep time and complexity significantly.`;
    
    case 'healthier':
      return `Create a HEALTHIER alternative focusing on:
              - Lower calories but same satiety
              - More vegetables and fiber
              - Less processed ingredients
              - Better nutrient density`;
    
    case 'random':
    default:
      const variations = [
        'Try a completely different cooking method (if previous was baked, try grilled or raw)',
        'Focus on a different primary ingredient category',
        'Create a fusion dish combining two cuisines',
        'Make it more colorful with different vegetables',
        'Change the texture profile (if previous was soft, make it crunchy)'
      ];
      return variations[Math.floor(Math.random() * variations.length)];
  }
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

// ✅ NEW: Regenerate single meal with pantry matching
export const regenerateSingleMeal = async (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  previousMeal?: Meal,
  alternativeType: 'different_cuisine' | 'simpler' | 'healthier' | 'random' = 'random'
): Promise<Meal> => {
  try {
    const baseRequest = {
      pantryItems,
      userProfile,
      mealType,
      preferences: userProfile?.dietary_preferences || [],
      restrictions: userProfile?.dietary_restrictions || [],
      targetCalories: getCalorieTarget(userProfile, mealType),
      targetProtein: Math.round(getCalorieTarget(userProfile, mealType) * 0.20 / 4)
    };

    // Generate alternative meal
    const newMeal = await generateAlternativeMeal(baseRequest, previousMeal, alternativeType);
    
    // Calculate pantry match for the new meal
    const { calculatePantryMatch } = await import('./meal-matching');
    const match = calculatePantryMatch(newMeal.ingredients, pantryItems);
    
    // Add pantry matching data
    return {
      ...newMeal,
      pantryMatch: match.matchCount,
      totalIngredients: match.totalIngredients,
      missingIngredients: match.missingIngredients,
      matchPercentage: match.matchPercentage,
      allergenSafe: true
    };
  } catch (error) {
    console.error('Error regenerating single meal:', error);
    throw error;
  }
};
