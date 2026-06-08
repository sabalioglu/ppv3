// app/recipe/[id].tsx - Recipe Detail (Warm Kitchen restyle) with Smart Ingredient Parsing
// Visual restyle only — all data hooks, parsing, pantry analysis, navigation and
// handlers are preserved exactly; presentation moved to the editorial cookbook language.

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Clock,
  Users,
  Flame,
  Bookmark,
  ExternalLink,
  ShoppingCart,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  TrendingUp,
  Package,
  ChefHat,
  Plus,
  Check,
  Star,
  Gauge,
  Sparkles,
} from 'lucide-react-native';
import { spacing, radius, colors as palette, fonts } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '@/components/UI/ThemedText';
import { Display, Eyebrow } from '@/components/UI/Display';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useMealPlanStore } from '@/lib/meal-plan/store';
import { Meal } from '@/lib/meal-plan/types';
import { t, i18n } from '@/lib/i18n';

// Locale is fixed at startup (device-driven), so compute label formats once.
const TR = i18n.locale === 'tr';
const minLabel = (m: number) => (TR ? `${m} dk` : `${m} min`);
const pctLabel = (pct: number) => (TR ? `%${pct}` : `${pct}%`);

// Recipe interface (schema-compliant)
interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
    notes?: string;
  }>;
  instructions: Array<
    | {
        step: number;
        instruction: string;
        duration_mins?: number;
      }
    | string
  >;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  tags: string[];
  category: string;
  is_favorite: boolean;
  is_ai_generated: boolean;
  source_url?: string;
  ai_match_score?: number;
  created_at: string;
  updated_at: string;
}

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface PantryMatchResult {
  matchPercentage: number;
  availableIngredients: string[];
  missingIngredients: string[];
  sufficientQuantity: boolean;
}

const DIFFICULTY_KEY: Record<string, string> = {
  Easy: 'recipeDetail.difficultyEasy',
  Medium: 'recipeDetail.difficultyMedium',
  Hard: 'recipeDetail.difficultyHard',
};
const difficultyLabel = (level?: string) =>
  level && DIFFICULTY_KEY[level] ? t(DIFFICULTY_KEY[level]) : level || '';

export default function RecipeDetail() {
  const { colors } = useTheme();
  const { id, source } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Interactive step-by-step cooking mode (opened from the "Start cooking" CTA).
  const [cooking, setCooking] = useState(false);
  const [cookStep, setCookStep] = useState(0);

  // ✅ FIXED: Added missing state variables
  const [loadingPantry, setLoadingPantry] = useState(false);
  const [pantryMatch, setPantryMatch] = useState<PantryMatchResult | null>(
    null,
  );

  // ✅ Get meal plan state for AI meals with proper hooks
  const { getAIMeal, isLoaded, loadMealPlan, loadingError } =
    useMealPlanStore();

  // Check if this recipe is from meal plan
  const isFromMealPlan = source === 'meal_plan';

  // Helper function to check if ID is an AI meal ID
  const isAIMealId = (recipeId: string): boolean => {
    return (
      recipeId.startsWith('fallback_') ||
      recipeId.startsWith('ai_') ||
      !isValidUUID(recipeId)
    );
  };

  // Helper function to validate UUID
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Load AI meal from meal plan state
  const loadAIMealFromState = async (mealId: string) => {
    try {
      console.log('🔍 Loading AI meal from state:', mealId);

      // Ensure meal plan is loaded from storage
      if (!isLoaded) {
        console.log('📦 Loading meal plan from storage...');
        await loadMealPlan();
      }

      // ✅ CRITICAL FIX: Use getAIMeal function
      const foundMeal = getAIMeal(mealId);

      if (foundMeal) {
        console.log('✅ AI meal loaded from storage:', foundMeal.name);
        setRecipe(foundMeal);
        setError(null);
      } else {
        console.error('❌ AI meal not found in storage:', mealId);

        if (loadingError) {
          throw new Error(`Storage error: ${loadingError}`);
        } else {
          throw new Error(
            'Recipe not found in storage. It may have been cleared.',
          );
        }
      }
    } catch (err) {
      console.error('❌ Error loading AI meal from state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load AI meal');

      // Show user-friendly error
      Alert.alert(
        t('recipeDetail.aiUnavailableTitle'),
        t('recipeDetail.aiUnavailableMessage'),
        [
          {
            text: t('recipeDetail.aiUnavailableGoBack'),
            onPress: () => router.back(),
          },
          {
            text: t('recipeDetail.aiUnavailableGenerate'),
            onPress: () => {
              router.dismiss();
              router.push('/ai-meal-plan');
            },
          },
        ],
      );
    }
  };

  // Load recipe from database
  const loadDatabaseRecipe = async (recipeId: string) => {
    try {
      console.log('🔍 Loading database recipe:', recipeId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Authentication required');
      }

      const { data: recipeData, error: dbError } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('id', recipeId)
        .eq('user_id', user.id)
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      if (!recipeData) {
        throw new Error('Recipe not found in database');
      }

      const formattedRecipe: Recipe = {
        id: recipeData.id,
        title: recipeData.title,
        description: recipeData.description || '',
        image_url: recipeData.image_url,
        prep_time: recipeData.prep_time || 0,
        cook_time: recipeData.cook_time || 0,
        servings: recipeData.servings || 1,
        difficulty: recipeData.difficulty || 'Easy',
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        nutrition: recipeData.nutrition,
        tags: recipeData.tags || [],
        category: recipeData.category || 'General',
        is_favorite: recipeData.is_favorite || false,
        is_ai_generated: recipeData.is_ai_generated || false,
        source_url: recipeData.source_url,
        ai_match_score: recipeData.ai_match_score,
        created_at: recipeData.created_at,
        updated_at: recipeData.updated_at,
      };

      console.log('✅ Database recipe loaded:', formattedRecipe.title);
      setRecipe(formattedRecipe);
    } catch (err) {
      console.error('❌ Error loading database recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    }
  };

  // ✅ IMPROVED: Smart Ingredient Parsing Function
  const parseIngredient = (ingredient: {
    name: string;
    quantity?: string;
    unit?: string;
  }) => {
    let itemName = ingredient.name;
    let quantity = 1;
    let unit = 'piece';

    // Eğer quantity ve unit zaten ayrıştırılmışsa
    if (ingredient.quantity && ingredient.unit) {
      quantity = parseFloat(ingredient.quantity) || 1;
      unit = ingredient.unit;
      return { itemName, quantity, unit };
    }

    // Ingredient name'den quantity ve unit çıkarmaya çalış
    const ingredientText = ingredient.name.toLowerCase();

    // Quantity regex patterns
    const quantityPatterns = [
      /^(\d+(?:\.\d+)?|\d+\s*\d+\/\d+|\d+\/\d+)\s*(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|kilograms?|ml|l|liters?|packages?|package|slices?|slice|pieces?|piece|pcs?)\s+(.+)/i,
      /^(\d+(?:\.\d+)?|\d+\s*\d+\/\d+|\d+\/\d+)\s+(.+)/i,
    ];

    for (const pattern of quantityPatterns) {
      const match = ingredient.name.match(pattern);
      if (match) {
        // Parse quantity (handle fractions like "1 1/2")
        let parsedQuantity = match[1];
        if (parsedQuantity.includes('/')) {
          // Handle fractions like "1/2" or "1 1/2"
          const parts = parsedQuantity.split(' ');
          if (parts.length === 2) {
            // "1 1/2" format
            const whole = parseFloat(parts[0]);
            const [num, den] = parts[1].split('/').map(Number);
            quantity = whole + num / den;
          } else {
            // "1/2" format
            const [num, den] = parsedQuantity.split('/').map(Number);
            quantity = num / den;
          }
        } else {
          quantity = parseFloat(parsedQuantity) || 1;
        }

        if (match[3]) {
          // Unit was captured
          unit = match[2];
          itemName = match[3];
        } else {
          // No unit, just quantity and name
          itemName = match[2];
          unit = 'piece';
        }
        break;
      }
    }

    // Clean up item name - remove extra descriptions
    itemName = itemName
      .replace(/,.*$/, '') // Remove everything after first comma
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Capitalize first letter
    itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);

    return { itemName, quantity, unit };
  };

  // ✅ IMPROVED: Enhanced categorization
  const categorizeIngredient = (ingredient: string): string => {
    const lowerIngredient = ingredient.toLowerCase();

    // Dairy
    if (
      lowerIngredient.includes('cheese') ||
      lowerIngredient.includes('mozzarella') ||
      lowerIngredient.includes('milk') ||
      lowerIngredient.includes('yogurt') ||
      lowerIngredient.includes('butter') ||
      lowerIngredient.includes('cream') ||
      lowerIngredient.includes('egg')
    ) {
      return 'dairy';
    }
    // Meat & Protein
    else if (
      lowerIngredient.includes('meat') ||
      lowerIngredient.includes('chicken') ||
      lowerIngredient.includes('beef') ||
      lowerIngredient.includes('pork') ||
      lowerIngredient.includes('fish') ||
      lowerIngredient.includes('turkey') ||
      lowerIngredient.includes('bacon') ||
      lowerIngredient.includes('ham') ||
      lowerIngredient.includes('salmon') ||
      lowerIngredient.includes('tuna')
    ) {
      return 'meat';
    }
    // Vegetables
    else if (
      lowerIngredient.includes('onion') ||
      lowerIngredient.includes('tomato') ||
      lowerIngredient.includes('carrot') ||
      lowerIngredient.includes('pepper') ||
      lowerIngredient.includes('lettuce') ||
      lowerIngredient.includes('spinach') ||
      lowerIngredient.includes('garlic') ||
      lowerIngredient.includes('potato') ||
      lowerIngredient.includes('celery') ||
      lowerIngredient.includes('vegetable')
    ) {
      return 'vegetables';
    }
    // Grains & Packaged
    else if (
      lowerIngredient.includes('ramen') ||
      lowerIngredient.includes('pasta') ||
      lowerIngredient.includes('rice') ||
      lowerIngredient.includes('bread') ||
      lowerIngredient.includes('flour') ||
      lowerIngredient.includes('wheat') ||
      lowerIngredient.includes('oats') ||
      lowerIngredient.includes('package')
    ) {
      return 'grains';
    }
    // Condiments & Seasonings
    else if (
      lowerIngredient.includes('sauce') ||
      lowerIngredient.includes('seasoning') ||
      lowerIngredient.includes('salt') ||
      lowerIngredient.includes('pepper') ||
      lowerIngredient.includes('oil') ||
      lowerIngredient.includes('spice') ||
      lowerIngredient.includes('herb') ||
      lowerIngredient.includes('vinegar')
    ) {
      return 'condiments';
    }
    // Beverages
    else if (
      lowerIngredient.includes('water') ||
      lowerIngredient.includes('juice') ||
      lowerIngredient.includes('coffee') ||
      lowerIngredient.includes('tea')
    ) {
      return 'beverages';
    } else {
      return 'general';
    }
  };

  // ✅ UPDATED: Smart Shopping List Function with Improved Parsing
  const handleAddMissingToCart = async () => {
    if (!recipe) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(
          t('recipeDetail.authRequiredTitle'),
          t('recipeDetail.authRequiredShopping'),
        );
        return;
      }

      // Meal plan recipes için pantry analizi varsa missing ingredients kullan
      if (
        isFromMealPlan &&
        pantryMatch &&
        pantryMatch.missingIngredients.length > 0
      ) {
        const shoppingItems = pantryMatch.missingIngredients.map(
          (ingredientName) => {
            // Parse the missing ingredient name
            const { itemName, quantity, unit } = parseIngredient({
              name: ingredientName,
            });

            return {
              user_id: user.id,
              item_name: itemName,
              category: categorizeIngredient(itemName),
              quantity: quantity,
              unit: unit,
              estimated_cost: null,
              priority: 'high' as const,
              source: 'recipe' as const,
              nutrition_goal: null,
              is_completed: false,
              completed_at: null,
              recipe_id: recipe.id,
              ingredient_name: itemName,
              notes: `Missing from pantry - Recipe: ${recipe.name || (recipe as Recipe).title}`,
              purchased_at: null,
              brand: null,
              coupons_available: false,
              seasonal_availability: true,
            };
          },
        );

        console.log('🛒 Adding missing ingredients:', shoppingItems);

        const { data, error } = await supabase
          .from('shopping_list_items')
          .insert(shoppingItems)
          .select();

        if (error) {
          console.error('❌ Database Error:', error);
          throw error;
        }

        console.log('✅ Successfully added missing ingredients:', data);

        Alert.alert(
          t('recipeDetail.addedMissingTitle'),
          t('recipeDetail.addedMissingMessage', {
            count: pantryMatch.missingIngredients.length,
          }),
          [
            {
              text: t('recipeDetail.viewShoppingList'),
              onPress: () => router.push('/(tabs)/shopping-list'),
            },
            { text: t('common.ok') },
          ],
        );
      } else {
        // Normal recipes veya pantry analizi yoksa tüm ingredients'ları smart parse ile ekle
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
          Alert.alert(
            t('recipeDetail.noIngredientsTitle'),
            t('recipeDetail.noIngredientsMessage'),
          );
          return;
        }

        const shoppingItems = recipe.ingredients.map((ingredient) => {
          const { itemName, quantity, unit } = parseIngredient(ingredient);

          return {
            user_id: user.id,
            item_name: itemName,
            category: categorizeIngredient(itemName),
            quantity: quantity,
            unit: unit,
            estimated_cost: null,
            priority: 'medium' as const,
            source: 'recipe' as const,
            nutrition_goal: null,
            is_completed: false,
            completed_at: null,
            recipe_id: recipe.id,
            ingredient_name: itemName,
            notes: `From recipe: ${recipe.name || (recipe as Recipe).title}`,
            purchased_at: null,
            brand: null,
            coupons_available: false,
            seasonal_availability: true,
          };
        });

        console.log('🛒 Adding smart parsed ingredients:', shoppingItems);

        const { data, error } = await supabase
          .from('shopping_list_items')
          .insert(shoppingItems)
          .select();

        if (error) {
          console.error('❌ Database Error:', error);
          throw error;
        }

        console.log('✅ Successfully added ingredients:', data);

        Alert.alert(
          t('recipeDetail.addedAllTitle'),
          t('recipeDetail.addedAllMessage', {
            count: recipe.ingredients.length,
          }),
          [
            {
              text: t('recipeDetail.viewShoppingList'),
              onPress: () => router.push('/(tabs)/shopping-list'),
            },
            { text: t('common.ok') },
          ],
        );
      }
    } catch (error) {
      console.error('❌ Error adding to shopping list:', error);
      Alert.alert(t('common.error'), t('recipeDetail.addToShoppingError'));
    }
  };

  // ✅ ADDED: Pantry analysis function
  const analyzePantryMatch = async (recipe: Recipe | Meal) => {
    if (!isFromMealPlan) return;

    try {
      setLoadingPantry(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's pantry items
      const { data: pantryItems, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching pantry:', error);
        return;
      }

      // Analyze ingredient matches
      const recipeIngredients = recipe.ingredients.map((ing) =>
        ing.name.toLowerCase(),
      );
      const pantryIngredientNames = (pantryItems || []).map((item) =>
        item.name.toLowerCase(),
      );

      const availableIngredients = recipeIngredients.filter((ingredient) =>
        pantryIngredientNames.some(
          (pantryItem) =>
            pantryItem.includes(ingredient) || ingredient.includes(pantryItem),
        ),
      );

      const missingIngredients = recipeIngredients.filter(
        (ingredient) =>
          !pantryIngredientNames.some(
            (pantryItem) =>
              pantryItem.includes(ingredient) ||
              ingredient.includes(pantryItem),
          ),
      );

      const matchPercentage = Math.round(
        (availableIngredients.length / recipeIngredients.length) * 100,
      );

      setPantryMatch({
        matchPercentage,
        availableIngredients,
        missingIngredients,
        sufficientQuantity:
          availableIngredients.length >= recipeIngredients.length * 0.8,
      });
    } catch (error) {
      console.error('Error analyzing pantry match:', error);
    } finally {
      setLoadingPantry(false);
    }
  };

  // Main recipe loading function - Universal ID Handler
  const loadRecipe = async () => {
    try {
      setLoading(true);
      setError(null);

      const recipeId = Array.isArray(id) ? id[0] : id;

      if (!recipeId) {
        throw new Error('Recipe ID not provided');
      }

      console.log('🚀 Loading recipe with ID:', recipeId, 'Source:', source);

      // Route to appropriate data source based on ID type
      if (isAIMealId(recipeId)) {
        await loadAIMealFromState(recipeId);
      } else {
        await loadDatabaseRecipe(recipeId);
      }
    } catch (err) {
      console.error('❌ Recipe loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  // Universal completion handler
  const handleRecipeCompletion = async () => {
    try {
      if (!recipe) return;

      console.log('🍳 Starting universal recipe completion...');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(
          t('recipeDetail.authRequiredTitle'),
          t('recipeDetail.authRequiredCooking'),
        );
        return;
      }

      // Determine if this is from meal plan
      const isFromMealPlan = source === 'meal_plan' || isAIMealId(recipe.id);

      // Add to nutrition logs
      await addToNutritionLog(recipe, user.id);

      // Update statistics if it's a database recipe
      if (!isAIMealId(recipe.id)) {
        await updateRecipeStatistics(recipe.id);
      }

      // Show success message
      console.log('✅ Recipe completion successful!');
      Alert.alert(
        t('recipeDetail.completedTitle'),
        t('recipeDetail.completedMessage'),
        [{ text: t('common.ok') }],
      );
    } catch (err) {
      console.error('❌ Recipe completion failed:', err);
      Alert.alert(t('common.error'), t('recipeDetail.completionError'));
    }
  };

  // Helper functions for completion
  const addToNutritionLog = async (recipe: Recipe | Meal, userId: string) => {
    console.log(
      '📊 Adding to nutrition log:',
      recipe.name || (recipe as Recipe).title,
    );

    const nutritionEntry = {
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      meal_type: recipe.category || 'General',
      food_name: recipe.name || (recipe as Recipe).title,
      quantity: 1,
      unit: 'serving',
      calories: recipe.nutrition?.calories || 0,
      protein: recipe.nutrition?.protein || 0,
      carbs: recipe.nutrition?.carbs || 0,
      fat: recipe.nutrition?.fat || 0,
      fiber: recipe.nutrition?.fiber || 0,
    };

    const { error } = await supabase
      .from('nutrition_logs')
      .insert([nutritionEntry]);

    if (error) throw error;
  };

  const updateRecipeStatistics = async (recipeId: string) => {
    console.log('📈 Updating recipe statistics');
    // This would update cooking frequency, last cooked date, etc.
    // Implementation depends on your statistics schema
  };

  // Auto-load meal plan on component mount
  useEffect(() => {
    if (!isLoaded) {
      console.log('🔄 Auto-loading meal plan...');
      loadMealPlan();
    }
  }, [isLoaded, loadMealPlan]);

  // Main load effect - wait for store to be ready for AI meals
  useEffect(() => {
    const recipeId = Array.isArray(id) ? id[0] : id;

    if (!recipeId) return;

    // For AI meals, wait for store to be loaded
    if (isAIMealId(recipeId) && !isLoaded) {
      console.log('⏳ Waiting for meal plan store to load...');
      return;
    }

    // Load recipe when ready
    loadRecipe();
  }, [id, source, isLoaded]);

  // ✅ ADDED: Recipe yüklendiğinde pantry analizi yap
  useEffect(() => {
    if (recipe && isFromMealPlan) {
      analyzePantryMatch(recipe);
    }
  }, [recipe, isFromMealPlan]);

  // Toggle favorite (only for database recipes)
  const handleFavorite = async () => {
    if (!recipe || isAIMealId(recipe.id)) return;

    try {
      const newFavoriteStatus = !(recipe as Recipe).is_favorite;
      const { error } = await supabase
        .from('user_recipes')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', recipe.id);

      if (error) {
        Alert.alert(t('common.error'), t('recipeDetail.favoriteError'));
        return;
      }

      setRecipe((prev) =>
        prev ? { ...prev, is_favorite: newFavoriteStatus } : null,
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert(t('common.error'), t('recipeDetail.favoriteError'));
    }
  };

  // Open source URL
  const handleOpenSource = async () => {
    const sourceUrl = (recipe as Recipe)?.source_url;
    if (sourceUrl) {
      try {
        await Linking.openURL(sourceUrl);
      } catch (error) {
        Alert.alert(t('common.error'), t('recipeDetail.openSourceError'));
      }
    }
  };

  // Enhanced action handlers for meal plan recipes
  const handleIMadeThis = async () => {
    await handleRecipeCompletion();
  };

  const handleAddToTodaysNutrition = async () => {
    if (!recipe) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(
          t('recipeDetail.authRequiredTitle'),
          t('recipeDetail.authRequiredNutrition'),
        );
        return;
      }

      await addToNutritionLog(recipe, user.id);
      Alert.alert(
        t('common.success'),
        t('recipeDetail.addedToNutritionMessage'),
      );
    } catch (error) {
      console.error('Error adding to nutrition log:', error);
      Alert.alert(t('common.error'), t('recipeDetail.addToNutritionError'));
    }
  };

  const handleFindSimilarRecipes = () => {
    if (!recipe) return;

    const mainIngredients = recipe.ingredients
      .slice(0, 3)
      .map((ing) => ing.name)
      .join(',');
    router.push(
      `/(tabs)/recipes?search=${encodeURIComponent(mainIngredients)}`,
    );
  };

  // Opens the step-by-step cooking mode from the recipe's instructions.
  const handleCookNow = () => {
    setCookStep(0);
    setCooking(true);
  };

  const handleShare = () => {
    Alert.alert(
      t('recipeDetail.shareComingSoonTitle'),
      t('recipeDetail.shareComingSoonMessage'),
    );
  };

  const handleEdit = () => {
    Alert.alert(
      t('recipeDetail.editComingSoonTitle'),
      t('recipeDetail.editComingSoonMessage'),
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return colors.success;
      case 'Medium':
        return colors.warning;
      case 'Hard':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return colors.secondary;
    if (percentage >= 60) return colors.accent;
    return colors.error;
  };

  // Normalized step list for cooking mode (handles string | {instruction} shapes).
  const cookingSteps = (
    Array.isArray((recipe as Recipe | null)?.instructions)
      ? ((recipe as Recipe).instructions as Recipe['instructions'])
      : []
  )
    .map((ins) =>
      typeof ins === 'string'
        ? { text: ins, duration: undefined as number | undefined }
        : {
            text: ins?.instruction ?? '',
            duration: ins?.duration_mins as number | undefined,
          },
    )
    .filter((s) => s.text.trim().length > 0);
  const lastStep = cookingSteps.length - 1;

  // Star rating row (saffron stars). Uses ai_match_score / pantry match as the
  // signal when present, otherwise defaults to a confident 4-star presentation.
  const ratingValue = (() => {
    const r = recipe as Recipe | null;
    if (pantryMatch)
      return Math.max(1, Math.round((pantryMatch.matchPercentage / 100) * 5));
    if (r?.ai_match_score)
      return Math.max(1, Math.min(5, Math.round(r.ai_match_score * 5)));
    return 4;
  })();

  // Whether a given recipe ingredient is owned (only meaningful for meal-plan flow).
  const isIngredientOwned = (name: string) => {
    if (!pantryMatch) return false;
    return pantryMatch.availableIngredients.includes(name.toLowerCase());
  };

  // Render pantry analysis section (only for meal plan recipes)
  const renderPantryAnalysis = () => {
    if (!isFromMealPlan || !pantryMatch) return null;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <View style={styles.matchScoreHeader}>
          <Display size="md" color={colors.textPrimary}>
            {t('recipeDetail.pantryMatchTitle')}
          </Display>
          <View
            style={[
              styles.matchBadge,
              {
                backgroundColor:
                  getMatchColor(pantryMatch.matchPercentage) + '22',
              },
            ]}
          >
            <ThemedText
              style={[
                styles.matchBadgeText,
                { color: getMatchColor(pantryMatch.matchPercentage) },
              ]}
            >
              {pctLabel(pantryMatch.matchPercentage)}
            </ThemedText>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarBackground,
              { backgroundColor: colors.borderLight },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${pantryMatch.matchPercentage}%`,
                  backgroundColor: getMatchColor(pantryMatch.matchPercentage),
                },
              ]}
            />
          </View>
          <ThemedText
            style={[styles.progressText, { color: colors.textSecondary }]}
          >
            {t('recipeDetail.pantryProgress', {
              have: pantryMatch.availableIngredients.length,
              total: recipe?.ingredients.length,
            })}
          </ThemedText>
        </View>

        {/* Quantity Warning */}
        {!pantryMatch.sufficientQuantity && (
          <View
            style={[
              styles.quantityWarning,
              { backgroundColor: colors.accent + '18' },
            ]}
          >
            <Package size={16} color={colors.accent} />
            <ThemedText
              style={[
                styles.quantityWarningText,
                { color: colors.textSecondary },
              ]}
            >
              {t('recipeDetail.quantityWarning')}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          style={[styles.loadingText, { color: colors.textSecondary }]}
        >
          {t('recipeDetail.loading')}
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
          {error}
        </ThemedText>
        <TouchableOpacity
          style={[styles.backCta, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backCtaText}>
            {t('recipeDetail.goBack')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
          {t('recipeDetail.notFound')}
        </ThemedText>
        <TouchableOpacity
          style={[styles.backCta, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backCtaText}>
            {t('recipeDetail.goBack')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const r = recipe as Recipe;
  const heroImage =
    r.image_url && r.image_url.trim() !== '' ? r.image_url : null;
  const title = recipe.name || r.title;
  const description = recipe.description || r.description;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0) || 30;
  const difficultyTr =
    difficultyLabel(recipe.difficulty || 'Easy') ||
    t('recipeDetail.difficultyFallback');
  const isSaved = !isAIMealId(recipe.id) && (r as Recipe).is_favorite;
  const missingCount = pantryMatch?.missingIngredients.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Full-bleed hero */}
        <View style={styles.hero}>
          {heroImage ? (
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => console.log('Image failed to load:', heroImage)}
            />
          ) : (
            <LinearGradient
              colors={['#D56A4F', '#C8472B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroFallback}
            >
              <ChefHat size={56} color="rgba(255,255,255,0.55)" />
            </LinearGradient>
          )}
          {/* bottom scrim so the sheet blends in */}
          <LinearGradient
            colors={['rgba(18,11,7,0)', 'rgba(18,11,7,0.18)']}
            style={styles.heroScrim}
          />

          {/* circular controls */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.heroBtn}
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          {!isAIMealId(recipe.id) && (
            <TouchableOpacity
              onPress={handleFavorite}
              style={[styles.heroBtn, styles.heroBtnRight]}
              hitSlop={8}
            >
              <Bookmark
                size={19}
                color="#fff"
                fill={isSaved ? '#fff' : 'transparent'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Overlapping cream sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Eyebrow style={styles.kicker}>
            {(recipe.category && recipe.category !== 'General'
              ? recipe.category
              : difficultyTr
            ).toUpperCase()}
          </Eyebrow>
          <Display size="xl" style={styles.title}>
            {title}
          </Display>

          {/* Star rating */}
          <View style={styles.ratingRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                size={16}
                color={colors.accent}
                fill={i < ratingValue ? colors.accent : 'transparent'}
              />
            ))}
            <ThemedText
              style={[styles.ratingText, { color: colors.textSecondary }]}
            >
              {ratingValue.toFixed(1)}
            </ThemedText>
          </View>

          {description ? (
            <ThemedText
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {description}
            </ThemedText>
          ) : null}

          {/* Stat chips */}
          <View style={styles.statsRow}>
            <StatChip
              icon={Clock}
              value={`${totalTime}`}
              label={t('recipeDetail.statTime')}
              colors={colors}
            />
            <StatChip
              icon={Users}
              value={`${recipe.servings || 1}`}
              label={t('recipeDetail.statServings')}
              colors={colors}
            />
            <StatChip
              icon={Gauge}
              value={difficultyTr}
              label={t('recipeDetail.statDifficulty')}
              colors={colors}
            />
            <StatChip
              icon={Sparkles}
              value={pantryMatch ? pctLabel(pantryMatch.matchPercentage) : '—'}
              label={t('recipeDetail.statMatch')}
              colors={colors}
            />
          </View>

          {/* Source URL */}
          {r.source_url ? (
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={handleOpenSource}
            >
              <ExternalLink size={15} color={colors.primary} />
              <ThemedText
                style={[styles.sourceText, { color: colors.primary }]}
              >
                {t('recipeDetail.openSource')}
              </ThemedText>
            </TouchableOpacity>
          ) : null}

          {/* Pantry analysis (meal-plan recipes) */}
          {loadingPantry ? (
            <View
              style={[
                styles.card,
                styles.pantryLoading,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText
                style={[
                  styles.pantryLoadingText,
                  { color: colors.textSecondary },
                ]}
              >
                {t('recipeDetail.pantryMatchScanning')}
              </ThemedText>
            </View>
          ) : (
            renderPantryAnalysis()
          )}

          {/* Ingredients */}
          <Display
            size="md"
            style={styles.sectionTitle}
            color={colors.textPrimary}
          >
            {t('recipeDetail.ingredients')}
          </Display>
          {recipe.ingredients.map((ingredient, index) => {
            const owned = isIngredientOwned(ingredient.name);
            const label =
              ingredient.quantity && ingredient.unit
                ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
                : ingredient.name;
            return (
              <View key={index} style={styles.ingredientRow}>
                {owned ? (
                  <View
                    style={[styles.tick, { backgroundColor: colors.secondary }]}
                  >
                    <Check size={13} color="#fff" strokeWidth={3} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.tick,
                      styles.tickMissing,
                      { borderColor: colors.primary },
                    ]}
                  >
                    <Plus size={13} color={colors.primary} strokeWidth={3} />
                  </View>
                )}
                <ThemedText
                  style={[styles.ingredientText, { color: colors.textPrimary }]}
                >
                  {label}
                  {ingredient.notes ? (
                    <ThemedText
                      style={[
                        styles.ingredientNotes,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {` (${ingredient.notes})`}
                    </ThemedText>
                  ) : null}
                </ThemedText>
              </View>
            );
          })}

          {/* Instructions */}
          <Display
            size="md"
            style={styles.sectionTitle}
            color={colors.textPrimary}
          >
            {t('recipeDetail.instructions')}
          </Display>
          {Array.isArray(recipe.instructions) ? (
            recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <ThemedText style={styles.stepNumberText}>
                    {(typeof instruction === 'object' && instruction?.step) ||
                      index + 1}
                  </ThemedText>
                </View>
                <View style={styles.instructionContent}>
                  <ThemedText
                    style={[
                      styles.instructionText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {typeof instruction === 'string'
                      ? instruction
                      : instruction?.instruction}
                  </ThemedText>
                  {instruction.duration_mins ? (
                    <View style={styles.instructionDurationRow}>
                      <Clock size={12} color={colors.textSecondary} />
                      <ThemedText
                        style={[
                          styles.instructionDuration,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {minLabel(instruction.duration_mins)}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <ThemedText
              style={[styles.noDataText, { color: colors.textSecondary }]}
            >
              {t('recipeDetail.noInstructions')}
            </ThemedText>
          )}

          {/* Nutrition */}
          {recipe.nutrition ? (
            <>
              <Display
                size="md"
                style={styles.sectionTitle}
                color={colors.textPrimary}
              >
                {t('recipeDetail.nutrition')}
              </Display>
              <View style={styles.nutritionGrid}>
                {recipe.nutrition.calories ? (
                  <NutritionItem
                    value={`${recipe.nutrition.calories}`}
                    label={t('recipeDetail.calories')}
                    colors={colors}
                  />
                ) : null}
                {recipe.nutrition.protein ? (
                  <NutritionItem
                    value={`${recipe.nutrition.protein}g`}
                    label={t('recipeDetail.protein')}
                    colors={colors}
                  />
                ) : null}
                {recipe.nutrition.carbs ? (
                  <NutritionItem
                    value={`${recipe.nutrition.carbs}g`}
                    label={t('recipeDetail.carbs')}
                    colors={colors}
                  />
                ) : null}
                {recipe.nutrition.fat ? (
                  <NutritionItem
                    value={`${recipe.nutrition.fat}g`}
                    label={t('recipeDetail.fat')}
                    colors={colors}
                  />
                ) : null}
              </View>
            </>
          ) : null}

          {/* Tags */}
          {recipe.tags &&
          Array.isArray(recipe.tags) &&
          recipe.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.tagText, { color: colors.textSecondary }]}
                  >
                    {tag}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {/* Meal-plan secondary actions */}
          {isFromMealPlan ? (
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={[
                  styles.ghostButton,
                  { borderColor: colors.borderLight },
                ]}
                onPress={handleIMadeThis}
              >
                <CheckCircle size={17} color={colors.secondary} />
                <ThemedText
                  style={[
                    styles.ghostButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t('recipeDetail.iMadeThis')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ghostButton,
                  { borderColor: colors.borderLight },
                ]}
                onPress={handleAddToTodaysNutrition}
              >
                <TrendingUp size={17} color={colors.textSecondary} />
                <ThemedText
                  style={[
                    styles.ghostButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t('recipeDetail.addToNutrition')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleAddMissingToCart}
          hitSlop={6}
          style={styles.cartLink}
        >
          <ShoppingCart size={14} color={colors.primary} />
          <ThemedText style={[styles.cartLinkText, { color: colors.primary }]}>
            {missingCount > 0
              ? t('recipeDetail.addMissingToList')
              : t('recipeDetail.addAllToList')}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cookCta, { backgroundColor: colors.primary }]}
          onPress={isFromMealPlan ? handleIMadeThis : handleCookNow}
          activeOpacity={0.9}
        >
          <Flame size={19} color="#fff" />
          <ThemedText style={styles.cookCtaText}>
            {t('recipeDetail.startCooking')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Step-by-step cooking mode */}
      <Modal
        visible={cooking}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCooking(false)}
      >
        <View style={[styles.cookRoot, { backgroundColor: colors.background }]}>
          <View style={styles.cookHeader}>
            <ThemedText
              style={[styles.cookHeaderText, { color: colors.textSecondary }]}
            >
              {`${TR ? 'Adım' : 'Step'} ${Math.min(
                cookStep + 1,
                Math.max(cookingSteps.length, 1),
              )}/${cookingSteps.length || 1}`}
            </ThemedText>
            <TouchableOpacity onPress={() => setCooking(false)} hitSlop={12}>
              <XCircle size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.cookBody}>
            <View
              style={[
                styles.cookStepBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <ThemedText style={styles.cookStepBadgeText}>
                {cookStep + 1}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.cookStepText, { color: colors.textPrimary }]}
            >
              {cookingSteps[cookStep]?.text || t('recipeDetail.noInstructions')}
            </ThemedText>
            {cookingSteps[cookStep]?.duration ? (
              <View style={styles.cookDurRow}>
                <Clock size={14} color={colors.textSecondary} />
                <ThemedText
                  style={[styles.cookDurText, { color: colors.textSecondary }]}
                >
                  {minLabel(cookingSteps[cookStep]!.duration!)}
                </ThemedText>
              </View>
            ) : null}
          </ScrollView>

          <View
            style={[styles.cookFooter, { borderTopColor: colors.borderLight }]}
          >
            <TouchableOpacity
              style={[
                styles.cookNavBtn,
                {
                  borderColor: colors.borderLight,
                  opacity: cookStep === 0 ? 0.4 : 1,
                },
              ]}
              disabled={cookStep === 0}
              onPress={() => setCookStep((s) => Math.max(0, s - 1))}
            >
              <ThemedText
                style={[styles.cookNavText, { color: colors.textPrimary }]}
              >
                {TR ? 'Geri' : 'Back'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cookNavBtn,
                styles.cookNavPrimary,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                if (cookStep >= lastStep) setCooking(false);
                else setCookStep((s) => s + 1);
              }}
            >
              <ThemedText style={[styles.cookNavText, { color: '#fff' }]}>
                {cookStep >= lastStep
                  ? TR
                    ? 'Bitir'
                    : 'Finish'
                  : TR
                    ? 'Sonraki'
                    : 'Next'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Small presentational helpers (Warm Kitchen) ───────────────────────────
function StatChip({
  icon: Icon,
  value,
  label,
  colors,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  value: string;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={[
        styles.statChip,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <Icon size={16} color={colors.primary} />
      <ThemedText
        style={[styles.statValue, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {value}
      </ThemedText>
      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

function NutritionItem({
  value,
  label,
  colors,
}: {
  value: string;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={[
        styles.nutritionItem,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <Display size="sm" color={colors.textPrimary}>
        {value}
      </Display>
      <ThemedText
        style={[styles.nutritionLabel, { color: colors.textSecondary }]}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const WARM_SHADOW = {
  shadowColor: '#3C2814',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  backCta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 18,
  },
  backCtaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },

  // Hero
  hero: { position: 'relative', height: 320, width: '100%' },
  heroImage: { width: '100%', height: '100%' },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  heroBtn: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18,11,7,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnRight: { left: undefined, right: spacing.lg },

  // Sheet
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
  },
  kicker: { marginBottom: 8 },
  title: { marginBottom: 12 },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  ratingText: { fontFamily: fonts.bodySemibold, fontSize: 13, marginLeft: 6 },

  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 18,
  },

  // Stat chips
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 8 },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    ...WARM_SHADOW,
  },
  statValue: { fontFamily: fonts.bodySemibold, fontSize: 14, marginTop: 2 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 0.8 },

  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  sourceText: { fontFamily: fonts.bodySemibold, fontSize: 13 },

  // Generic card
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...WARM_SHADOW,
  },
  pantryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pantryLoadingText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  matchScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  matchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  matchBadgeText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  progressBarContainer: { gap: 8 },
  progressBarBackground: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  quantityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  quantityWarningText: { fontFamily: fonts.bodyMedium, fontSize: 12, flex: 1 },

  // Sections
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickMissing: { backgroundColor: 'transparent', borderWidth: 1.5 },
  ingredientText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  ingredientNotes: { fontFamily: fonts.body, fontStyle: 'italic' },

  // Instructions
  instructionItem: { flexDirection: 'row', marginBottom: spacing.lg, gap: 12 },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' },
  instructionContent: { flex: 1 },
  instructionText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  instructionDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  instructionDuration: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  noDataText: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Nutrition
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutritionItem: {
    minWidth: 78,
    alignItems: 'center',
    gap: 3,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    ...WARM_SHADOW,
  },
  nutritionLabel: { fontFamily: fonts.bodyMedium, fontSize: 11 },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.lg,
  },
  tag: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 12 },

  // Secondary actions
  secondaryActions: { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  ghostButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 13,
  },
  ghostButtonText: { fontFamily: fonts.bodySemibold, fontSize: 13 },

  // Footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  cartLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cartLinkText: { fontFamily: fonts.bodySemibold, fontSize: 12.5 },
  cookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 54,
    borderRadius: 18,
    alignSelf: 'stretch',
    shadowColor: palette.primary[600],
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cookCtaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },
  cookRoot: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 28 },
  cookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  cookHeaderText: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  cookBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cookStepBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookStepBadgeText: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: '#fff',
  },
  cookStepText: { fontFamily: fonts.body, fontSize: 22, lineHeight: 32 },
  cookDurRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cookDurText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  cookFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cookNavBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookNavPrimary: { borderWidth: 0 },
  cookNavText: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
