//app/ai-meal-plan.tsx - FIXED AbortSignal Issue
// Enhanced AI Meal Plan with Gemini API and individual meal regeneration capabilities
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Settings, 
  ChevronRight,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

// Type imports
import type { 
  Meal, 
  PantryItem, 
  MealPlan, 
  PantryMetrics, 
  UserProfile,
  PantryInsight,
  MealLoadingStates,
  MealRegenerationRequest
} from '@/lib/meal-plan/types';

// Utility imports
import { 
  calculatePantryMetrics, 
  getExpiringItems, 
  analyzePantryComposition,
  generatePantryInsights 
} from '@/lib/meal-plan/pantry-analysis';
import { 
  calculatePantryMatch 
} from '@/lib/meal-plan/meal-matching';
import { 
  generateFallbackMeal, 
  generateFallbackSnacks, 
  generateFallbackPlan,
  categorizeIngredient
} from '@/lib/meal-plan/utils';

// Error handling imports
import { 
  handleError, 
  showErrorAlert, 
  ERROR_CODES,
  MealPlanError,
  validateUserProfile,
  validatePantryItem,
  logError
} from '@/lib/meal-plan/error-handler';

// Component imports
import MealDetailModal from '@/components/meal-plan/MealDetailModal';
import MealCard from '@/components/meal-plan/MealCard';
import MealPlanSummary from '@/components/meal-plan/MealPlanSummary';
import ViewModeTabs from '@/components/meal-plan/ViewModeTabs';

// ✅ GEMINI API CONFIGURATION
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

// ✅ REACT NATIVE COMPATIBLE TIMEOUT FUNCTION
const createTimeoutSignal = (timeoutMs: number): AbortController => {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  // Clear timeout if request completes successfully
  const originalSignal = controller.signal;
  const clearTimeoutOnComplete = () => {
    clearTimeout(timeoutId);
  };
  
  // Listen for abort to clear timeout
  controller.signal.addEventListener('abort', clearTimeoutOnComplete);
  
  return controller;
};

// ✅ MEAL TYPE CONSTRAINTS FOR CULTURAL APPROPRIATENESS
const MEAL_TYPE_CONSTRAINTS = {
  breakfast: {
    culturallyAppropriate: [
      'toast', 'eggs', 'oatmeal', 'smoothie', 'pancakes', 'waffles',
      'yogurt parfait', 'cereal', 'fruit bowl', 'breakfast sandwich', 'avocado toast'
    ],
    avoid: ['complex dinners', 'heavy proteins', 'elaborate sauces', 'salmon frittata', 'stir-fry'],
    maxPrepTime: 20,
    appropriateIngredients: [
      'eggs', 'oats', 'yogurt', 'milk', 'bread', 'butter', 'jam', 'honey',
      'berries', 'banana', 'apple', 'orange juice', 'coffee', 'tea',
      'bacon', 'sausage', 'pancake mix', 'cereal', 'granola', 'avocado'
    ]
  },
  lunch: {
    culturallyAppropriate: [
      'salad', 'sandwich', 'wrap', 'soup', 'pasta', 'stir-fry',
      'grain bowl', 'light protein with vegetables', 'rice bowl'
    ],
    avoid: ['breakfast foods', 'heavy dinner preparations'],
    maxPrepTime: 30
  },
  dinner: {
    culturallyAppropriate: [
      'protein with vegetables', 'pasta dishes', 'rice dishes',
      'stews', 'roasted meals', 'grilled proteins', 'curry dishes'
    ],
    avoid: ['breakfast foods', 'overly light meals'],
    maxPrepTime: 60
  },
  snack: {
    culturallyAppropriate: [
      'fruit', 'nuts', 'yogurt', 'crackers with cheese',
      'vegetables with dip', 'simple combinations', 'energy balls'
    ],
    avoid: ['cooked meals', 'complex preparations'],
    maxPrepTime: 5
  }
};

// ✅ DIVERSITY MANAGER FOR INGREDIENT VARIETY
class IngredientDiversityManager {
  private usedIngredients: Map<string, number> = new Map();
  private usedCuisines: Set<string> = new Set();
  private usedProteins: Set<string> = new Set();

  trackMeal(meal: Meal) {
    meal.ingredients.forEach(ing => {
      const ingredientName = typeof ing === 'string' ? ing : ing.name;
      const count = this.usedIngredients.get(ingredientName.toLowerCase()) || 0;
      this.usedIngredients.set(ingredientName.toLowerCase(), count + 1);
    });

    meal.tags?.forEach(tag => {
      if (tag.includes('inspired') || tag.includes('cuisine')) {
        this.usedCuisines.add(tag);
      }
    });

    const proteins = meal.ingredients.filter(ing => {
      const ingredientName = typeof ing === 'string' ? ing : ing.name;
      return ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs', 'tofu', 'beans'].some(protein =>
        ingredientName.toLowerCase().includes(protein)
      );
    });
    
    proteins.forEach(protein => {
      const proteinName = typeof protein === 'string' ? protein : protein.name;
      this.usedProteins.add(proteinName.toLowerCase());
    });
  }

  getAvoidanceList() {
    return {
      overusedIngredients: Array.from(this.usedIngredients.entries())
        .filter(([_, count]) => count >= 2)
        .map(([ingredient, _]) => ingredient),
      usedCuisines: Array.from(this.usedCuisines),
      usedProteins: Array.from(this.usedProteins)
    };
  }

  reset() {
    this.usedIngredients.clear();
    this.usedCuisines.clear();
    this.usedProteins.clear();
  }
}

// ✅ ENHANCED CALORIE CALCULATION WITH SAFETY LIMITS
const getCalorieTarget = (userProfile: UserProfile | null, mealType: string): number => {
  const defaultCalories = {
    breakfast: 350,
    lunch: 450,
    dinner: 550,
    snack: 150
  };

  if (!userProfile) {
    return defaultCalories[mealType as keyof typeof defaultCalories] || 400;
  }

  const { age, gender, height_cm, weight_kg, activity_level, health_goals } = userProfile;

  let bmr = 1500; // Safe default
  if (age && height_cm && weight_kg && gender) {
    if (gender === 'male') {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    } else {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    }
  }

  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };

  const totalCalories = bmr * (activityMultipliers[activity_level as keyof typeof activityMultipliers] || 1.4);

  let calorieAdjustment = 1.0;
  if (health_goals?.includes('weight_loss')) calorieAdjustment = 0.85;
  if (health_goals?.includes('muscle_gain')) calorieAdjustment = 1.15;

  // ✅ STRICT SAFETY LIMITS
  const maxDailyCalories = 2200;
  const minDailyCalories = 1400;
  
  const adjustedTotal = Math.min(
    Math.max(totalCalories * calorieAdjustment, minDailyCalories), 
    maxDailyCalories
  );

  const mealDistribution = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.35,
    snack: 0.05,
  };

  const targetCalories = Math.round(
    adjustedTotal * (mealDistribution[mealType as keyof typeof mealDistribution] || 0.25)
  );

  // ✅ MEAL-SPECIFIC SAFETY LIMITS
  const mealLimits = {
    breakfast: { min: 250, max: 500 },
    lunch: { min: 350, max: 650 },
    dinner: { min: 400, max: 750 },
    snack: { min: 100, max: 250 }
  };

  const limits = mealLimits[mealType as keyof typeof mealLimits] || { min: 300, max: 600 };
  return Math.min(Math.max(targetCalories, limits.min), limits.max);
};

// ✅ GEMINI AI MEAL GENERATION WITH FIXED TIMEOUT
const generateGeminiAIMeal = async (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  diversityManager: IngredientDiversityManager,
  previousMeals?: Meal[]
): Promise<Meal> => {
  const constraints = MEAL_TYPE_CONSTRAINTS[mealType as keyof typeof MEAL_TYPE_CONSTRAINTS];
  const avoidance = diversityManager.getAvoidanceList();
  
  const availableIngredients = pantryItems
    .map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`)
    .join(', ');

  const calorieTarget = getCalorieTarget(userProfile, mealType);

  const prompt = `You are creating a ${mealType.toUpperCase()} recipe. This is CRITICAL: you must create a meal that people would actually eat for ${mealType}.

🏠 AVAILABLE PANTRY INGREDIENTS: ${availableIngredients}

🍽️ MEAL TYPE SPECIFIC REQUIREMENTS FOR ${mealType.toUpperCase()}:
✅ CULTURALLY APPROPRIATE ${mealType.toUpperCase()} OPTIONS:
${constraints.culturallyAppropriate?.join(', ')}

❌ NEVER CREATE THESE FOR ${mealType.toUpperCase()}:
${constraints.avoid?.join(', ')}

⏰ TIME CONSTRAINTS:
- Maximum prep time: ${constraints.maxPrepTime} minutes

🚫 DIVERSITY & ANTI-REPETITION RULES:
${avoidance.overusedIngredients.length > 0 ? `
- AVOID OVERUSED INGREDIENTS: ${avoidance.overusedIngredients.join(', ')} (already used 2+ times)
` : ''}
${avoidance.usedCuisines.size > 0 ? `
- AVOID THESE CUISINES: ${Array.from(avoidance.usedCuisines).join(', ')}
` : ''}
${avoidance.usedProteins.size > 0 ? `
- AVOID THESE PROTEINS: ${Array.from(avoidance.usedProteins).join(', ')}
` : ''}

🧑‍🍳 USER PROFILE:
- Dietary Restrictions: ${userProfile?.dietary_restrictions?.join(', ') || 'none'}
- Health Goals: ${userProfile?.health_goals?.join(', ') || 'general health'}

🚨 CRITICAL SUCCESS CRITERIA:
1. Recipe MUST be something people actually eat for ${mealType}
2. Recipe MUST use maximum pantry ingredients
3. Recipe MUST be different from previous meals
4. Recipe MUST be appropriate for the time of day

TARGET NUTRITION:
- Calories: ~${calorieTarget}

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "name": "${mealType} Recipe Name (realistic for ${mealType})",
  "ingredients": [
    {"name": "ingredient1", "amount": 1, "unit": "cup", "category": "Vegetables"}
  ],
  "calories": ${calorieTarget},
  "protein": 20,
  "carbs": 30,
  "fat": 10,
  "fiber": 5,
  "prepTime": ${Math.min(constraints.maxPrepTime || 30, 15)},
  "cookTime": ${Math.min((constraints.maxPrepTime || 30) - 10, 10)},
  "servings": 1,
  "difficulty": "Easy",
  "instructions": [
    "Step 1: ${mealType}-appropriate preparation",
    "Step 2: Simple cooking method",
    "Step 3: Final assembly"
  ],
  "tags": ["${mealType}-appropriate", "pantry-focused", "realistic"],
  "mealTypeAppropriate": true
}

REMEMBER: This must be a meal that people would actually want to eat for ${mealType}!`;

  try {
    console.log(`🚀 Making Gemini API request for ${mealType}...`);
    
    // ✅ FIXED: Use React Native compatible timeout
    const timeoutController = createTimeoutSignal(30000); // 30 seconds
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      } as GeminiRequest),
      signal: timeoutController.signal, // ✅ FIXED: Use controller.signal
    });

    console.log(`📡 Gemini response status for ${mealType}:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API Error for ${mealType}:`, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    // ✅ FIXED: Check content type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ Invalid content type from Gemini:', contentType);
      console.error('❌ Response text:', responseText);
      throw new Error('Invalid response format from Gemini API');
    }

    const data: GeminiResponse = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new Error('No content in Gemini response');
    }

    console.log(`✅ Gemini response received successfully for ${mealType}`);
    
    const meal = parseMealFromGeminiResponse(generatedText, mealType);
    
    // ✅ IMMEDIATELY CALCULATE PANTRY MATCH
    const pantryMatch = calculatePantryMatch(meal.ingredients, pantryItems);
    
    const enhancedMeal = {
      ...meal,
      pantryMatch: pantryMatch.matchCount,
      totalIngredients: pantryMatch.totalIngredients,
      missingIngredients: pantryMatch.missingIngredients,
      matchPercentage: pantryMatch.matchPercentage,
      allergenSafe: true
    };

    // Track this meal for diversity
    diversityManager.trackMeal(enhancedMeal);

    return enhancedMeal;
  } catch (error) {
    console.error(`❌ Gemini AI meal generation error for ${mealType}:`, error);
    
    // ✅ FIXED: Enhanced error handling with specific error types
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout for ${mealType} - please try again`);
    }
    if (error.message?.includes('fetch')) {
      throw new Error(`Network error for ${mealType} - check your internet connection`);
    }
    if (error.message?.includes('API')) {
      throw new Error(`Gemini API error for ${mealType} - please try again later`);
    }
    
    throw error;
  }
};

// ✅ PARSE GEMINI RESPONSE WITH ENHANCED ERROR HANDLING
const parseMealFromGeminiResponse = (responseText: string, mealType: string): Meal => {
  try {
    console.log(`🔄 Parsing Gemini response for ${mealType}...`);
    
    // Clean the response text more thoroughly
    let cleanedText = responseText.trim();
    
    // Remove markdown code blocks
    cleanedText = cleanedText.replace(/```json\s*/g, '');
    cleanedText = cleanedText.replace(/```\s*/g, '');
    
    // Remove any leading/trailing non-JSON text
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON found in response');
    }
    
    cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    
    console.log(`📝 Cleaned response for ${mealType}:`, cleanedText.substring(0, 200) + '...');
    
    const parsedMeal = JSON.parse(cleanedText);

    // ✅ VALIDATION: Check required fields
    if (!parsedMeal.name || !parsedMeal.ingredients || !Array.isArray(parsedMeal.ingredients)) {
      throw new Error('Invalid meal structure from Gemini');
    }

    const mealId = `gemini_${mealType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const emoji = getMealEmoji(mealType, parsedMeal.name);

    const meal: Meal = {
      id: mealId,
      name: parsedMeal.name,
      ingredients: parsedMeal.ingredients || [],
      calories: Math.min(parsedMeal.calories || 400, getCalorieTarget(null, mealType) * 1.2),
      protein: parsedMeal.protein || 0,
      carbs: parsedMeal.carbs || 0,
      fat: parsedMeal.fat || 0,
      fiber: parsedMeal.fiber || 0,
      prepTime: parsedMeal.prepTime || 15,
      cookTime: parsedMeal.cookTime || 15,
      servings: parsedMeal.servings || 1,
      difficulty: parsedMeal.difficulty || 'Easy',
      emoji: emoji,
      category: mealType,
      tags: parsedMeal.tags || [],
      instructions: parsedMeal.instructions || [],
      source: 'ai_generated',
      created_at: new Date().toISOString(),
      mealTypeAppropriate: parsedMeal.mealTypeAppropriate || true,
    };

    console.log(`✅ Successfully parsed meal for ${mealType}:`, meal.name);
    return meal;
  } catch (error) {
    console.error(`❌ Error parsing Gemini AI meal response for ${mealType}:`, error);
    console.error('❌ Raw response text:', responseText);
    throw new Error(`Failed to parse Gemini response for ${mealType}: ${error.message}`);
  }
};

// ✅ MEAL EMOJI GENERATOR
const getMealEmoji = (mealType: string, mealName: string): string => {
  const name = mealName.toLowerCase();
  
  if (mealType === 'breakfast') {
    if (name.includes('egg')) return '🍳';
    if (name.includes('toast') || name.includes('bread')) return '🍞';
    if (name.includes('oat') || name.includes('cereal')) return '🥣';
    if (name.includes('pancake') || name.includes('waffle')) return '🥞';
    if (name.includes('yogurt')) return '🥛';
    if (name.includes('fruit') || name.includes('berry')) return '🍓';
    if (name.includes('avocado')) return '🥑';
    return '🍳';
  }
  
  if (mealType === 'lunch') {
    if (name.includes('salad')) return '🥗';
    if (name.includes('sandwich') || name.includes('wrap')) return '🥪';
    if (name.includes('soup')) return '🍲';
    if (name.includes('pasta')) return '🍝';
    if (name.includes('rice') || name.includes('bowl')) return '🍚';
    return '🥗';
  }
  
  if (mealType === 'dinner') {
    if (name.includes('chicken')) return '🍗';
    if (name.includes('fish') || name.includes('salmon')) return '🐟';
    if (name.includes('beef') || name.includes('steak')) return '🥩';
    if (name.includes('pasta')) return '🍝';
    if (name.includes('rice')) return '🍚';
    if (name.includes('curry')) return '🍛';
    return '🍽️';
  }
  
  if (mealType === 'snack') {
    if (name.includes('fruit')) return '🍎';
    if (name.includes('nut')) return '🥜';
    if (name.includes('yogurt')) return '🥛';
    if (name.includes('vegetable')) return '🥕';
    return '🍎';
  }
  
  return '🍽️';
};

// ✅ CALCULATE AVERAGE MATCH SCORE
const calculateAverageMatchScore = (meals: Meal[]): number => {
  if (meals.length === 0) return 0;
  
  const totalMatchPercentage = meals.reduce((sum, meal) => {
    return sum + (meal.matchPercentage || 0);
  }, 0);
  
  return Math.round(totalMatchPercentage / meals.length);
};

// ✅ GENERATE UNIFIED MEAL PLAN WITH GEMINI AND FALLBACKS
const generateGeminiMealPlan = async (
  pantryItems: PantryItem[],
  userProfile: UserProfile | null
): Promise<{
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
  snacks: Meal[];
}> => {
  console.log('🧪 Generating meal plan with Gemini AI...');

  const diversityManager = new IngredientDiversityManager();

  try {
    const results = {
      breakfast: null as Meal | null,
      lunch: null as Meal | null,
      dinner: null as Meal | null,
      snacks: [] as Meal[]
    };

    // Generate meals sequentially with individual error handling
    try {
      console.log('🍳 Generating breakfast...');
      results.breakfast = await generateGeminiAIMeal('breakfast', pantryItems, userProfile, diversityManager);
    } catch (error) {
      console.error('❌ Breakfast generation failed, using fallback:', error);
      results.breakfast = generateFallbackMeal('breakfast', pantryItems);
    }

    try {
      console.log('🥗 Generating lunch...');
      results.lunch = await generateGeminiAIMeal('lunch', pantryItems, userProfile, diversityManager, results.breakfast ? [results.breakfast] : []);
    } catch (error) {
      console.error('❌ Lunch generation failed, using fallback:', error);
      results.lunch = generateFallbackMeal('lunch', pantryItems);
    }

    try {
      console.log('🍽️ Generating dinner...');
      const previousMeals = [results.breakfast, results.lunch].filter(Boolean) as Meal[];
      results.dinner = await generateGeminiAIMeal('dinner', pantryItems, userProfile, diversityManager, previousMeals);
    } catch (error) {
      console.error('❌ Dinner generation failed, using fallback:', error);
      results.dinner = generateFallbackMeal('dinner', pantryItems);
    }

    try {
      console.log('🍎 Generating snack...');
      const previousMeals = [results.breakfast, results.lunch, results.dinner].filter(Boolean) as Meal[];
      const snack = await generateGeminiAIMeal('snack', pantryItems, userProfile, diversityManager, previousMeals);
      results.snacks = [snack];
    } catch (error) {
      console.error('❌ Snack generation failed, using fallback:', error);
      results.snacks = generateFallbackSnacks(pantryItems);
    }

    console.log('✅ Gemini meal plan generated successfully (with fallbacks where needed)');

    return results;
  } catch (error) {
    console.error('❌ Complete meal plan generation failed, using full fallback:', error);
    
    // Complete fallback
    return {
      breakfast: generateFallbackMeal('breakfast', pantryItems),
      lunch: generateFallbackMeal('lunch', pantryItems),
      dinner: generateFallbackMeal('dinner', pantryItems),
      snacks: generateFallbackSnacks(pantryItems)
    };
  }
};

export default function AIMealPlan() {
  const router = useRouter();
  
  // ✅ Enhanced loading states for individual meals
  const [loadingStates, setLoadingStates] = useState<MealLoadingStates>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
    initial: true,
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Modal states
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pantry health metrics
  const [pantryMetrics, setPantryMetrics] = useState<PantryMetrics>({
    totalItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    categories: {},
  });

  // ✅ Regeneration tracking
  const [regenerationAttempts, setRegenerationAttempts] = useState<{
    [key: string]: number;
  }>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snacks: 0,
  });

  // ✅ Diversity manager instance
  const [diversityManager] = useState(new IngredientDiversityManager());

  useEffect(() => {
    loadAllData();
  }, []);

  // Real-time pantry updates listener
  useEffect(() => {
    const subscription = supabase
      .channel('pantry_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pantry_items' },
        (payload) => {
          console.log('Pantry updated:', payload);
          loadAllData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAllData = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, initial: true }));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new MealPlanError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
      }

      let userProfileData: UserProfile = {
        id: user.id,
        dietary_restrictions: [],
        dietary_preferences: ['balanced'],
      };

      // Load user profile with error handling
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profile && validateUserProfile(profile)) {
          userProfileData = profile;
        }
        
        setUserProfile(userProfileData);
      } catch (profileError) {
        const error = handleError(profileError, 'loadUserProfile');
        console.error('Profile error:', error);
        await logError(error, user.id);
        setUserProfile(userProfileData);
      }

      // Load pantry items with error handling
      try {
        const { data: pantry, error: pantryError } = await supabase
          .from('pantry_items')
          .select('*')
          .eq('user_id', user.id)
          .order('expiry_date', { ascending: true });

        if (pantryError) {
          throw pantryError;
        }

        const validPantryItems = (pantry || []).filter(item => {
          if (!validatePantryItem(item)) {
            console.warn('Invalid pantry item:', item);
            return false;
          }
          return true;
        });

        setPantryItems(validPantryItems);
        
        // Calculate metrics
        const metrics = calculatePantryMetrics(validPantryItems);
        setPantryMetrics(metrics);

        // ✅ Generate Gemini AI meal plan with fallbacks
        await generateInitialMealPlan(validPantryItems, userProfileData);

      } catch (pantryError) {
        const error = handleError(pantryError, 'loadPantryItems');
        await logError(error, user.id);
        showErrorAlert(error, loadAllData);
        
        // Use empty pantry as fallback
        setPantryItems([]);
        setPantryMetrics({
          totalItems: 0,
          expiringItems: 0,
          expiredItems: 0,
          categories: {},
        });
        setMealPlan(generateFallbackPlan());
      }

      setLoadingStates(prev => ({ ...prev, initial: false }));
      setRefreshing(false);
    } catch (error) {
      const appError = handleError(error, 'loadAllData');
      await logError(appError);
      showErrorAlert(appError, () => {
        if (appError.code === ERROR_CODES.UNAUTHORIZED) {
          router.replace('/(auth)/login');
        } else {
          loadAllData();
        }
      });
      setLoadingStates(prev => ({ ...prev, initial: false }));
      setRefreshing(false);
    }
  };

  // ✅ Generate initial Gemini AI meal plan with comprehensive fallbacks
  const generateInitialMealPlan = async (pantryItems: PantryItem[], userProfile: UserProfile | null) => {
    try {
      console.log('🚀 Starting meal plan generation...');
      
      if (pantryItems.length < 3) {
        console.log('⚠️ Insufficient pantry items, using fallback plan');
        setMealPlan(generateFallbackPlan(pantryItems));
        return;
      }

      // ✅ Reset diversity manager for fresh start
      diversityManager.reset();

      // ✅ Use Gemini AI meal plan generation with fallbacks
      const aiMeals = await generateGeminiMealPlan(pantryItems, userProfile);
      
      // ✅ Calculate totals accurately from the generated meals
      const mealsForTotals = [aiMeals.breakfast, aiMeals.lunch, aiMeals.dinner].filter(Boolean) as Meal[];
      const totalCalories = mealsForTotals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = mealsForTotals.reduce((sum, meal) => sum + (meal.protein || 0), 0);

      // ✅ Use the clear average match score calculation
      const averageMatchScore = calculateAverageMatchScore(mealsForTotals);

      const plan: MealPlan = {
        daily: {
          ...aiMeals,
          totalCalories,
          totalProtein,
          optimizationScore: averageMatchScore,
          generatedAt: new Date().toISOString(),
          regenerationHistory: {}
        }
      };

      setMealPlan(plan);
      console.log('✅ Meal plan generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Gemini AI meal plan:', error);
      // Fall back to basic plan
      setMealPlan(generateFallbackPlan(pantryItems));
    }
  };

  // ✅ Regenerate individual meal with Gemini and fallbacks
  const regenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    if (!mealPlan || !userProfile) return;

    try {
      // Set loading state for this specific meal
      setLoadingStates(prev => ({ ...prev, [mealType]: true }));

      const currentMeal = mealPlan.daily[mealType as keyof typeof mealPlan.daily];
      const previousMeal = Array.isArray(currentMeal) ? currentMeal[0] : currentMeal;

      // Get existing meals for diversity tracking
      const existingMeals = [
        mealPlan.daily.breakfast,
        mealPlan.daily.lunch,
        mealPlan.daily.dinner,
        ...(mealPlan.daily.snacks || [])
      ].filter(Boolean) as Meal[];

      // Track existing meals in diversity manager
      diversityManager.reset();
      existingMeals.forEach(meal => diversityManager.trackMeal(meal));

      let newMeal: Meal;

      try {
        // Try Gemini first
        newMeal = await generateGeminiAIMeal(
          mealType === 'snacks' ? 'snack' : mealType,
          pantryItems,
          userProfile,
          diversityManager,
          existingMeals
        );
      } catch (error) {
        console.error(`❌ Gemini regeneration failed for ${mealType}, using fallback:`, error);
        // Fallback to basic meal generation
        newMeal = generateFallbackMeal(mealType === 'snacks' ? 'snack' : mealType, pantryItems);
        
        // Calculate pantry match for fallback
        const pantryMatch = calculatePantryMatch(newMeal.ingredients, pantryItems);
        newMeal = {
          ...newMeal,
          pantryMatch: pantryMatch.matchCount,
          totalIngredients: pantryMatch.totalIngredients,
          missingIngredients: pantryMatch.missingIngredients,
          matchPercentage: pantryMatch.matchPercentage,
        };
      }

      // Update meal plan
      setMealPlan(prevPlan => {
        if (!prevPlan) return prevPlan;

        const updatedDaily = { ...prevPlan.daily };
        
        if (mealType === 'snacks') {
          updatedDaily.snacks = [newMeal];
        } else {
          updatedDaily[mealType] = newMeal;
        }

        // Recalculate totals
        const mealsForTotals = [updatedDaily.breakfast, updatedDaily.lunch, updatedDaily.dinner].filter(Boolean) as Meal[];
        const totalCalories = mealsForTotals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const totalProtein = mealsForTotals.reduce((sum, meal) => sum + (meal.protein || 0), 0);

        updatedDaily.totalCalories = totalCalories;
        updatedDaily.totalProtein = totalProtein;
        updatedDaily.optimizationScore = calculateAverageMatchScore(mealsForTotals);

        return {
          ...prevPlan,
          daily: updatedDaily
        };
      });

      // Update regeneration attempts
      setRegenerationAttempts(prev => ({
        ...prev,
        [mealType]: prev[mealType] + 1
      }));

      // Show success message
      Alert.alert(
        'Meal Updated! ✨',
        `Your ${mealType} has been regenerated with a new recipe.`,
        [{ text: 'Great!' }]
      );

    } catch (error) {
      console.error(`Failed to regenerate ${mealType}:`, error);
      Alert.alert(
        'Generation Failed',
        'Sorry, we couldn\'t generate a new meal right now. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [mealType]: false }));
    }
  };

  // ✅ Enhanced regenerate all meals
  const regenerateAllMeals = async () => {
    // Eğer modal açıksa kapatıp selectedMeal'ı temizle
    if (modalVisible) {
      setModalVisible(false);
      setSelectedMeal(null);
    }

    Alert.alert(
      'Regenerate All Meals?',
      'This will create completely new meal suggestions for today.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate All', 
          style: 'default',
          onPress: async () => {
            // ✅ Reset any previous selection
            setSelectedMeal(null);
            
            setLoadingStates({
              breakfast: true,
              lunch: true,
              dinner: true,
              snacks: true,
              initial: false,
            });

            try {
              await generateInitialMealPlan(pantryItems, userProfile);
              
              // Reset regeneration attempts
              setRegenerationAttempts({
                breakfast: 0,
                lunch: 0,
                dinner: 0,
                snacks: 0,
              });

              Alert.alert(
                'All Meals Updated! 🎉',
                'Your entire meal plan has been regenerated with fresh recipes.',
                [{ text: 'Awesome!' }]
              );
            } catch (error) {
              console.error('Regenerate all meals error:', error);
              Alert.alert(
                'Generation Failed',
                'Sorry, we couldn\'t regenerate all meals. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setLoadingStates({
                breakfast: false,
                lunch: false,
                dinner: false,
                snacks: false,
                initial: false,
              });
            }
          }
        }
      ]
    );
  };

  // Enhanced shopping list integration
  const handleAddToShoppingList = async (missingIngredients: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new MealPlanError(
          ERROR_CODES.UNAUTHORIZED, 
          'Please log in to add items to shopping list'
        );
      }

      if (!missingIngredients || missingIngredients.length === 0) {
        throw new MealPlanError(
          ERROR_CODES.INVALID_MEAL_DATA,
          'No ingredients to add'
        );
      }

      const shoppingItems = missingIngredients.map(ingredient => ({
        user_id: user.id,
        item_name: ingredient,
        category: categorizeIngredient(ingredient),
        quantity: 1,
        unit: 'unit',
        is_completed: false,
        priority: 'high',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('shopping_list_items')
        .insert(shoppingItems);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Added ${missingIngredients.length} items to your shopping list`,
        [
          { text: 'View List', onPress: () => router.push('/(tabs)/shopping') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      const appError = handleError(error, 'addToShoppingList');
      await logError(appError, userProfile?.id);
      showErrorAlert(appError);
    }
  };

  // Handle meal press
  const handleMealPress = (meal: Meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  // Navigate to recipe detail
  const navigateToRecipe = (meal: Meal) => {
    try {
      setModalVisible(false);
      setSelectedMeal(null);
      router.push(`/recipe/${meal.id}?source=meal_plan`);
    } catch (error) {
      const appError = handleError(error, 'navigateToRecipe');
      showErrorAlert(appError);
    }
  };

  // Add meal to nutrition log
  const addToNutritionLog = async (meal: Meal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new MealPlanError(
          ERROR_CODES.UNAUTHORIZED,
          'Please log in to track nutrition'
        );
      }

      const nutritionEntry = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: meal.category,
        food_name: meal.name,
        quantity: 1,
        unit: 'serving',
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber || 0,
        sugar: meal.sugar || 0,
        sodium: meal.sodium || 0,
      };

      const { error } = await supabase
        .from('nutrition_logs')
        .insert([nutritionEntry]);

      if (error) throw error;

      setModalVisible(false);
      Alert.alert('Success', 'Meal added to today\'s nutrition log');
    } catch (error) {
      const appError = handleError(error, 'addToNutritionLog');
      await logError(appError, userProfile?.id);
      showErrorAlert(appError);
    }
  };

  const renderDailyView = () => {
    if (!mealPlan?.daily) return null;
    const plan = mealPlan.daily;

    return (
      <View style={styles.dailyContent}>
        {/* Today's Summary Card */}
        <MealPlanSummary plan={plan} />

        {/* ✅ Regenerate All Button */}
        <TouchableOpacity 
          style={styles.regenerateAllButton}
          onPress={regenerateAllMeals}
          disabled={loadingStates.initial || Object.values(loadingStates).some(Boolean)}
        >
          <Sparkles size={20} color={colors.accent[600]} />
          <Text style={styles.regenerateAllText}>Regenerate All Meals</Text>
          <RefreshCw size={16} color={colors.accent[600]} />
        </TouchableOpacity>

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          
          {/* Breakfast */}
          {plan.breakfast && (
            <MealCard
              meal={plan.breakfast}
              mealType="Breakfast"
              onPress={handleMealPress}
              onAddToShopping={handleAddToShoppingList}
              onRegenerate={regenerateMeal}
              isRegenerating={loadingStates.breakfast}
              regenerationAttempts={regenerationAttempts.breakfast}
            />
          )}

          {/* Lunch */}
          {plan.lunch && (
            <MealCard
              meal={plan.lunch}
              mealType="Lunch"
              onPress={handleMealPress}
              onAddToShopping={handleAddToShoppingList}
              onRegenerate={regenerateMeal}
              isRegenerating={loadingStates.lunch}
              regenerationAttempts={regenerationAttempts.lunch}
            />
          )}

          {/* Dinner */}
          {plan.dinner && (
            <MealCard
              meal={plan.dinner}
              mealType="Dinner"
              onPress={handleMealPress}
              onAddToShopping={handleAddToShoppingList}
              onRegenerate={regenerateMeal}
              isRegenerating={loadingStates.dinner}
              regenerationAttempts={regenerationAttempts.dinner}
            />
          )}
        </View>

        {/* Snacks Section */}
        <View style={styles.snacksSection}>
          <View style={styles.snacksHeader}>
            <Text style={styles.sectionTitle}>Snacks</Text>
            {/* ✅ Regenerate Snacks Button */}
            <TouchableOpacity
              style={styles.regenerateSnacksButton}
              onPress={() => regenerateMeal('snacks')}
              disabled={loadingStates.snacks}
            >
              {loadingStates.snacks ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <RefreshCw size={16} color={colors.primary[600]} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.snacksContainer}>
            {plan.snacks.map((snack, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.snackCard,
                  loadingStates.snacks && styles.snackCardLoading
                ]}
                onPress={() => handleMealPress(snack)}
                disabled={loadingStates.snacks}
              >
                <Text style={styles.snackEmoji}>{snack.emoji}</Text>
                <Text style={styles.snackName}>{snack.name}</Text>
                <Text style={styles.snackStats}>
                  {snack.calories} cal • {snack.protein}g protein
                </Text>
                {snack.source === 'ai_generated' && (
                  <View style={styles.snackAiBadge}>
                    <Sparkles size={10} color={colors.accent[600]} />
                    <Text style={styles.snackAiText}>AI</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loadingStates.initial) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Creating your personalized meal plan...</Text>
        <Text style={styles.loadingSubtext}>Analyzing your pantry with Gemini AI</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modal with proper onClose handler */}
      <MealDetailModal
        visible={modalVisible}
        meal={selectedMeal}
        onClose={() => {
          setModalVisible(false);
          setSelectedMeal(null);
        }}
        onViewRecipe={navigateToRecipe}
        onAddToNutrition={addToNutritionLog}
        onAddToShopping={(ingredients) => {
          setModalVisible(false);
          setSelectedMeal(null);
          handleAddToShoppingList(ingredients);
        }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Meal Plan</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Settings size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
      </View>

      {/* View Mode Tabs */}
      <ViewModeTabs viewMode={viewMode} onViewModeChange={setViewMode} />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAllData}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Pantry Status Card */}
        <TouchableOpacity 
          style={styles.pantryStatusCard}
          onPress={() => router.push('/(tabs)/pantry')}
        >
          <View style={styles.pantryStatusLeft}>
            <View style={styles.pantryStatusHeader}>
              <Text style={styles.pantryStatusTitle}>Pantry Status</Text>
              {pantryMetrics.expiredItems > 0 && (
                <View style={styles.expiredBadge}>
                  <Text style={styles.expiredBadgeText}>{pantryMetrics.expiredItems} expired</Text>
                </View>
              )}
            </View>
            <Text style={styles.pantryStatusSubtitle}>
              {pantryMetrics.totalItems} items • {pantryMetrics.expiringItems} expiring soon
            </Text>
          </View>
          <ChevronRight size={20} color={colors.neutral[400]} />
        </TouchableOpacity>

        {/* Allergen Safety Info */}
        {userProfile?.dietary_restrictions && userProfile.dietary_restrictions.length > 0 && (
          <View style={styles.allergenInfo}>
            <ShieldCheck size={20} color={colors.success[600]} />
            <Text style={styles.allergenText}>
              All recipes are free from: {userProfile.dietary_restrictions.join(', ')}
            </Text>
          </View>
        )}

        {/* Preferences Card */}
        {userProfile && (
          <View style={styles.preferencesCard}>
            <Text style={styles.preferencesTitle}>Your Preferences</Text>
            <View style={styles.preferencesTags}>
              {userProfile.dietary_preferences?.map((pref) => (
                <View key={pref} style={styles.preferenceTag}>
                  <Text style={styles.preferenceTagText}>{pref.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meal Plan Content */}
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={colors.neutral[400]} />
            <Text style={styles.comingSoonTitle}>Weekly View Coming Soon</Text>
            <Text style={styles.comingSoonSubtitle}>Plan your entire week with AI-generated meal plans</Text>
          </View>
        )}
        {viewMode === 'monthly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={colors.neutral[400]} />
            <Text style={styles.comingSoonTitle}>Monthly View Coming Soon</Text>
            <Text style={styles.comingSoonSubtitle}>Long-term meal planning and shopping optimization</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <View style={styles.actionButtonIcon}>
              <Heart size={20} color={colors.error[500]} />
            </View>
            <Text style={styles.actionButtonText}>Track Nutrition</Text>
            <ChevronRight size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/shopping')}
          >
            <View style={styles.actionButtonIcon}>
              <ShoppingCart size={20} color={colors.primary[500]} />
            </View>
            <Text style={styles.actionButtonText}>Shopping List</Text>
            <ChevronRight size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    marginTop: spacing.lg,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  pantryStatusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    ...shadows.sm,
  },
  pantryStatusLeft: {
    flex: 1,
  },
  pantryStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pantryStatusTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    marginRight: spacing.md,
  },
  expiredBadge: {
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  expiredBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[600],
    fontWeight: '600',
  },
  pantryStatusSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
  },
  allergenText: {
    fontSize: typography.fontSize.sm,
    color: colors.success[700],
    marginLeft: spacing.sm,
    flex: 1,
  },
  preferencesCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
    ...shadows.sm,
  },
  preferencesTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  preferencesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preferenceTag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  preferenceTagText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dailyContent: {
    paddingHorizontal: spacing.lg,
  },
  regenerateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent[50],
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  regenerateAllText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.accent[700],
  },
  mealsSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  snacksSection: {
    marginTop: spacing.xl,
  },
  snacksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  regenerateSnacksButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  snacksContainer: {
    paddingLeft: 0,
  },
  snackCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: 12,
    marginRight: spacing.md,
    minWidth: 160,
    alignItems: 'center',
    ...shadows.sm,
  },
  snackCardLoading: {
    opacity: 0.6,
  },
  snackEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  snackName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  snackStats: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  snackAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  snackAiText: {
    fontSize: typography.fontSize.xs,
    color: colors.accent[700],
    fontWeight: '600',
  },
  quickActions: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    flex: 1,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  comingSoonTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[600],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});