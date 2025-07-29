//lib/meal-plan/ai-generation.ts
// AI meal generation using Google Gemini API with all enhancements preserved
import { PantryItem, UserProfile, Meal, AIGenerationRequest } from './types';
import { calculatePantryMatch } from './meal-matching';
import { MIN_DAILY_CALORIES, MAX_DAILY_CALORIES } from './constants';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Gemini-specific interfaces
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

// --- All helper functions from our previous work are preserved ---

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
  return { skillLevel, timeConstraints, nutritionFocus, cuisineStyle, allergenWarnings, dietaryGuidelines };
};

const getTimeConstraints = (activityLevel?: string): string => {
  switch (activityLevel) {
    case 'extra_active': case 'very_active': return 'quick';
    case 'moderately_active': return 'moderate';
    case 'lightly_active': case 'sedentary': return 'flexible';
    default: return 'moderate';
  }
};

const getNutritionFocus = (healthGoals?: string[]): string => {
  if (!healthGoals?.length) return 'balanced';
  if (healthGoals.includes('weight_loss')) return 'low-calorie, high-protein';
  if (healthGoals.includes('muscle_gain')) return 'high-protein, moderate-carb';
  return 'balanced';
};

const getCalorieTarget = (userProfile: UserProfile | null, mealType: string): number => {
  if (!userProfile) {
    return mealType === 'breakfast' ? 350 : mealType === 'lunch' ? 450 : 550;
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
  const activityMultipliers = { 'sedentary': 1.2, 'lightly_active': 1.375, 'moderately_active': 1.55, 'very_active': 1.725, 'extra_active': 1.9 };
  const totalCalories = bmr * (activityMultipliers[activity_level as keyof typeof activityMultipliers] || 1.4);
  let calorieAdjustment = 1.0;
  if (health_goals?.includes('weight_loss')) calorieAdjustment = 0.85;
  if (health_goals?.includes('muscle_gain')) calorieAdjustment = 1.15;
  const adjustedTotal = totalCalories * calorieAdjustment;
  const clampedTotal = Math.max(MIN_DAILY_CALORIES, Math.min(adjustedTotal, MAX_DAILY_CALORIES));
  const mealDistribution = { 'breakfast': 0.25, 'lunch': 0.35, 'dinner': 0.35, 'snack': 0.05 };
  return Math.round(clampedTotal * (mealDistribution[mealType as keyof typeof mealDistribution] || 0.25));
};

const detectPantryCuisine = (pantryItems: PantryItem[]): string => {
  const ingredients = pantryItems.map(item => item.name.toLowerCase());
  if (ingredients.some(ing => ['soy sauce', 'ginger', 'rice'].includes(ing))) return 'Asian-inspired';
  if (ingredients.some(ing => ['tomato', 'basil', 'pasta'].includes(ing))) return 'Italian-inspired';
  if (ingredients.some(ing => ['cumin', 'beans', 'lime'].includes(ing))) return 'Mexican-inspired';
  return 'International fusion';
};

const getSkillBasedInstructions = (skillLevel: string): string => {
  switch (skillLevel) {
    case 'beginner': return "Use simple cooking methods.";
    case 'intermediate': return "Can use moderate techniques.";
    case 'advanced': return "Advanced techniques welcome.";
    default: return "Keep techniques simple.";
  }
};

const buildPantryFocusedPrompt = (request: AIGenerationRequest, previousMeals?: Meal[], avoidanceList?: string[]): string => {
    const { pantryItems, mealType, userProfile } = request;
    const profile = analyzeUserProfile(userProfile);
    const availableIngredients = pantryItems.map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`).join(', ');
    const usedIngredients = previousMeals?.flatMap(m => m.ingredients.map(i => i.name.toLowerCase())) || [];
    const combinedAvoidance = [...new Set([...(avoidanceList || []), ...usedIngredients.slice(0, 5)])];
    const calorieTarget = getCalorieTarget(userProfile, mealType);
    const detectedCuisine = detectPantryCuisine(pantryItems);
    const skillInstructions = getSkillBasedInstructions(profile.skillLevel);

    const allergenSafety = profile.allergenWarnings.length > 0
        ? `- **Allergens:** NEVER include these ingredients or their derivatives: **${profile.allergenWarnings.join(', ')}**.`
        : '';
    const dietaryCompliance = profile.dietaryGuidelines.length > 0
        ? `- **Dietary Needs:** The meal MUST be **${profile.dietaryGuidelines.join(', ')}**.`
        : '';
    
    const getMealTypeConstraints = (mealType: string) => {
        switch(mealType.toLowerCase()) {
            case 'breakfast': return `- **Meal Type Rule:** This is a **breakfast**. It MUST be a typical breakfast food (like eggs, oatmeal, smoothie). Avoid heavy dinner-style dishes.`;
            case 'lunch': return `- **Meal Type Rule:** This is a **lunch**. It can be a salad, sandwich, wrap, or a light main course.`;
            case 'dinner': return `- **Meal Type Rule:** This is a **dinner**. It should be a satisfying main course.`;
            case 'snack': return `- **Meal Type Rule:** This is a **snack**. It MUST be a small, light item.`;
            default: return '';
        }
    }
    const mealTypeConstraint = getMealTypeConstraints(mealType);

    return `You are a world-class chef creating a single, perfect ${mealType} recipe. Your top priority is to follow the user's dietary needs and then maximize pantry usage.

🛑 NON-NEGOTIABLE RULES:
${allergenSafety}
${dietaryCompliance}
${mealTypeConstraint}
- You MUST respond with valid JSON only. No extra text or explanations.

🏠 AVAILABLE PANTRY INGREDIENTS: ${availableIngredients}

🎯 STRICT PANTRY PRIORITY RULES:
1.  **Maximize Pantry Usage:** Use AT LEAST 80% of ingredients from pantry.
2.  **Minimize Shopping:** Suggest a MAXIMUM of 2 new ingredients.
3.  **Cuisine Adaptation:** Adapt cuisine to match pantry ingredients.

🚫 ANTI-DUPLICATE RULES:
- **Avoid Repeated Ingredients:** Do not use these main ingredients again: ${combinedAvoidance.join(', ')}.

👤 USER PROFILE:
- **Cooking Skill:** ${profile.skillLevel}
- **Nutrition Focus:** ${profile.nutritionFocus}

Create a ${mealType} recipe that follows these rules strictly. Target calories: ~${calorieTarget}.

Respond with this exact JSON structure:
{
  "name": "Recipe Name",
  "ingredients": [{"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables", "fromPantry": true}],
  "calories": ${calorieTarget},
  "protein": 25,
  "carbs": 40,
  "fat": 15,
  "fiber": 8,
  "prepTime": 15,
  "cookTime": 20,
  "servings": 1,
  "difficulty": "Easy",
  "instructions": ["Step 1", "Step 2"],
  "tags": ["pantry-focused", "${detectedCuisine}"],
  "pantryUsagePercentage": 85,
  "shoppingListItems": ["new item 1"],
  "restrictionsFollowed": true
}`;
};

const parseMealFromResponse = (responseText: string, request: AIGenerationRequest): Meal => {
    try {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedMeal = JSON.parse(cleanedText);

        if (parsedMeal.restrictionsFollowed !== true) {
            console.warn('AI reported failure to follow restrictions.');
            throw new Error('AI failed to follow dietary restrictions.');
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
        console.error('Error parsing Gemini meal response:', error);
        if (error.message.includes('AI failed to follow')) {
            throw error;
        }
        throw new Error('Failed to parse Gemini meal response');
    }
};

const getMealEmoji = (mealType: string, mealName: string): string => {
    const name = mealName.toLowerCase();
    if (name.includes('pasta')) return '🍝';
    if (name.includes('salad')) return '🥗';
    if (name.includes('chicken')) return '🍗';
    if (name.includes('fish')) return '🐟';
    if (name.includes('soup')) return '🍲';
    switch (mealType) {
        case 'breakfast': return '🍳';
        case 'lunch': return '🥗';
        case 'dinner': return '🍽️';
        case 'snack': return '🍎';
        default: return '🍽️';
    }
};

// Main generation function adapted for Gemini
export const generateAIMeal = async (
  request: AIGenerationRequest, 
  previousMeals?: Meal[],
  avoidanceList?: string[]
): Promise<Meal> => {
  const prompt = buildPantryFocusedPrompt(request, previousMeals, avoidanceList);
  
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      } as GeminiRequest)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', errorText);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response text from Gemini API');
    }
    
    return parseMealFromResponse(generatedText, request);
    
  } catch (error) {
    console.error('Gemini meal generation error:', error);
    throw error;
  }
};

// This function is now redundant as generateAIMeal handles alternatives,
// but we keep it for potential future use with different logic.
export const generateAlternativeMeal = async (
    request: AIGenerationRequest,
    previousMeal?: Meal,
    variationType: 'cuisine' | 'complexity' | 'ingredients' = 'cuisine',
    allPreviousMeals?: Meal[]
  ): Promise<Meal> => {
      // For now, it just calls the main generator with more previous meals to avoid.
      return generateAIMeal(request, allPreviousMeals);
};
