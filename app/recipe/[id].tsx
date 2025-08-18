// app/recipe/[id].tsx - Complete Production-Ready Recipe Detail Page with Fixed Shopping List

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { ArrowLeft, Clock, Users, Flame, Heart, ExternalLink, Play, ShoppingCart, CreditCard as Edit3, Share, CircleCheck as CheckCircle, Circle as XCircle, TrendingUp, Package } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useMealPlanStore } from '@/lib/meal-plan/store';
import { Meal } from '@/lib/meal-plan/types';

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
  ingredients: Array<{ name: string; quantity?: string; unit?: string; notes?: string }>;
  instructions: Array<{ step: number; instruction: string; duration_mins?: number }>;
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

export default function RecipeDetail() {
  const { id, source } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ FIXED: Added missing state variables
  const [loadingPantry, setLoadingPantry] = useState(false);
  const [pantryMatch, setPantryMatch] = useState<PantryMatchResult | null>(null);
  
  // ✅ Get meal plan state for AI meals with proper hooks
  const { getAIMeal, isLoaded, loadMealPlan, loadingError } = useMealPlanStore();

  // Check if this recipe is from meal plan
  const isFromMealPlan = source === 'meal_plan';

  // Helper function to check if ID is an AI meal ID
  const isAIMealId = (recipeId: string): boolean => {
    return recipeId.startsWith('fallback_') || 
           recipeId.startsWith('ai_') || 
           !isValidUUID(recipeId);
  };

  // Helper function to validate UUID
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
          throw new Error('Recipe not found in storage. It may have been cleared.');
        }
      }

    } catch (err) {
      console.error('❌ Error loading AI meal from state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load AI meal');
      
      // Show user-friendly error
      Alert.alert(
        'Recipe Not Available',
        'This recipe is no longer available. It may have been cleared from storage.',
        [
          { text: 'Go Back', onPress: () => router.back() },
          { 
            text: 'Generate New Plan', 
            onPress: () => {
              router.dismiss();
              router.push('/ai-meal-plan');
            }
          }
        ]
      );
    }
  };

  // Load recipe from database
  const loadDatabaseRecipe = async (recipeId: string) => {
    try {
      console.log('🔍 Loading database recipe:', recipeId);
      
      const { data: { user } } = await supabase.auth.getUser();
      
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

  // ✅ UPDATED: Universal ingredient categorization function
  const categorizeIngredient = (ingredient: string): string => {
    const lowerIngredient = ingredient.toLowerCase();
    
    // Meat & Protein
    if (lowerIngredient.includes('meat') || lowerIngredient.includes('chicken') || 
        lowerIngredient.includes('beef') || lowerIngredient.includes('pork') || 
        lowerIngredient.includes('fish') || lowerIngredient.includes('turkey') ||
        lowerIngredient.includes('bacon') || lowerIngredient.includes('ham') ||
        lowerIngredient.includes('salmon') || lowerIngredient.includes('tuna')) {
      return 'meat';
    }
    // Vegetables
    else if (lowerIngredient.includes('vegetable') || lowerIngredient.includes('onion') || 
             lowerIngredient.includes('tomato') || lowerIngredient.includes('carrot') ||
             lowerIngredient.includes('pepper') || lowerIngredient.includes('lettuce') ||
             lowerIngredient.includes('spinach') || lowerIngredient.includes('garlic') ||
             lowerIngredient.includes('potato') || lowerIngredient.includes('celery')) {
      return 'vegetables';
    }
    // Dairy
    else if (lowerIngredient.includes('milk') || lowerIngredient.includes('cheese') || 
             lowerIngredient.includes('yogurt') || lowerIngredient.includes('butter') ||
             lowerIngredient.includes('cream') || lowerIngredient.includes('egg')) {
      return 'dairy';
    }
    // Grains
    else if (lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') || 
             lowerIngredient.includes('bread') || lowerIngredient.includes('flour') ||
             lowerIngredient.includes('wheat') || lowerIngredient.includes('oats') ||
             lowerIngredient.includes('quinoa') || lowerIngredient.includes('barley')) {
      return 'grains';
    }
    // Fruits
    else if (lowerIngredient.includes('apple') || lowerIngredient.includes('banana') || 
             lowerIngredient.includes('orange') || lowerIngredient.includes('berry') ||
             lowerIngredient.includes('lemon') || lowerIngredient.includes('lime') ||
             lowerIngredient.includes('grape') || lowerIngredient.includes('peach')) {
      return 'fruits';
    }
    // Condiments & Spices
    else if (lowerIngredient.includes('salt') || lowerIngredient.includes('pepper') || 
             lowerIngredient.includes('oil') || lowerIngredient.includes('sauce') ||
             lowerIngredient.includes('spice') || lowerIngredient.includes('herb') ||
             lowerIngredient.includes('vinegar') || lowerIngredient.includes('mustard')) {
      return 'condiments';
    }
    // Beverages
    else if (lowerIngredient.includes('water') || lowerIngredient.includes('juice') || 
             lowerIngredient.includes('coffee') || lowerIngredient.includes('tea') ||
             lowerIngredient.includes('soda') || lowerIngredient.includes('wine')) {
      return 'beverages';
    }
    else {
      return 'general';
    }
  };

  // ✅ FINAL: Database Schema Compatible Shopping List Function
  const handleAddMissingToCart = async () => {
    if (!recipe) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to add items to shopping list.');
        return;
      }

      // Meal plan recipes için pantry analizi varsa missing ingredients kullan
      if (isFromMealPlan && pantryMatch && pantryMatch.missingIngredients.length > 0) {
        const shoppingItems = pantryMatch.missingIngredients.map(ingredient => ({
          user_id: user.id,
          item_name: ingredient,
          category: 'general',
          quantity: 1,
          unit: 'unit',
          estimated_cost: null,
          priority: 'high' as const,
          source: 'recipe' as const,
          nutrition_goal: null,
          is_completed: false,
          completed_at: null,
          recipe_id: recipe.id, // ✅ Doğru kolon adı
          ingredient_name: ingredient,
          notes: `Missing from pantry - Recipe: ${recipe.name || (recipe as Recipe).title}`,
          purchased_at: null,
          brand: null,
          coupons_available: false,
          seasonal_availability: true,
        }));

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
          'Success! 🛒',
          `Added ${pantryMatch.missingIngredients.length} missing ingredients to your shopping list`,
          [
            { text: 'View Shopping List', onPress: () => router.push('/(tabs)/shopping-list') },
            { text: 'OK' }
          ]
        );
      } else {
        // Normal recipes veya pantry analizi yoksa tüm ingredients'ları ekle
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
          Alert.alert('Info', 'This recipe has no ingredients to add.');
          return;
        }

        const shoppingItems = recipe.ingredients.map(ingredient => ({
          user_id: user.id,
          item_name: ingredient.name,
          category: categorizeIngredient(ingredient.name),
          quantity: ingredient.quantity ? parseFloat(ingredient.quantity) || 1 : 1,
          unit: ingredient.unit || 'piece',
          estimated_cost: null,
          priority: 'medium' as const,
          source: 'recipe' as const,
          nutrition_goal: null,
          is_completed: false,
          completed_at: null,
          recipe_id: recipe.id, // ✅ Doğru kolon adı
          ingredient_name: ingredient.name,
          notes: `From recipe: ${recipe.name || (recipe as Recipe).title}`,
          purchased_at: null,
          brand: null, // Brand bilgisi ingredient'tan alınabilir
          coupons_available: false,
          seasonal_availability: true,
        }));

        console.log('🛒 Adding all ingredients:', shoppingItems);

        const { data, error } = await supabase
          .from('shopping_list_items')
          .insert(shoppingItems)
          .select();

        if (error) {
          console.error('❌ Database Error:', error);
          throw error;
        }

        console.log('✅ Successfully added all ingredients:', data);

        Alert.alert(
          'Success! 🛒',
          `Added ${recipe.ingredients.length} ingredients to your shopping list`,
          [
            { text: 'View Shopping List', onPress: () => router.push('/(tabs)/shopping-list') },
            { text: 'OK' }
          ]
        );
      }

    } catch (error) {
      console.error('❌ Error adding to shopping list:', error);
      Alert.alert('Error', 'Failed to add items to shopping list');
    }
  };

  // ✅ ADDED: Pantry analysis function
  const analyzePantryMatch = async (recipe: Recipe | Meal) => {
    if (!isFromMealPlan) return;
    
    try {
      setLoadingPantry(true);
      
      const { data: { user } } = await supabase.auth.getUser();
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
      const recipeIngredients = recipe.ingredients.map(ing => ing.name.toLowerCase());
      const pantryIngredientNames = (pantryItems || []).map(item => item.name.toLowerCase());
      
      const availableIngredients = recipeIngredients.filter(ingredient =>
        pantryIngredientNames.some(pantryItem => 
          pantryItem.includes(ingredient) || ingredient.includes(pantryItem)
        )
      );

      const missingIngredients = recipeIngredients.filter(ingredient =>
        !pantryIngredientNames.some(pantryItem => 
          pantryItem.includes(ingredient) || ingredient.includes(pantryItem)
        )
      );

      const matchPercentage = Math.round((availableIngredients.length / recipeIngredients.length) * 100);

      setPantryMatch({
        matchPercentage,
        availableIngredients,
        missingIngredients,
        sufficientQuantity: availableIngredients.length >= recipeIngredients.length * 0.8
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to track cooking.');
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
        'Great Job! 👨‍🍳',
        'Recipe marked as cooked and added to your nutrition log.',
        [
          { text: 'View Nutrition', onPress: () => router.push('/(tabs)/nutrition') },
          { text: 'OK' }
        ]
      );
      
    } catch (err) {
      console.error('❌ Recipe completion failed:', err);
      Alert.alert('Error', 'Failed to complete recipe tracking');
    }
  };

  // Helper functions for completion
  const addToNutritionLog = async (recipe: Recipe | Meal, userId: string) => {
    console.log('📊 Adding to nutrition log:', recipe.name || (recipe as Recipe).title);
    
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
        Alert.alert('Error', 'Failed to update favorite status');
        return;
      }

      setRecipe(prev => prev ? { ...prev, is_favorite: newFavoriteStatus } : null);
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Open source URL
  const handleOpenSource = async () => {
    const sourceUrl = (recipe as Recipe)?.source_url;
    if (sourceUrl) {
      try {
        await Linking.openURL(sourceUrl);
      } catch (error) {
        Alert.alert('Error', 'Could not open source URL');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to track nutrition.');
        return;
      }

      await addToNutritionLog(recipe, user.id);
      Alert.alert('Success', 'Recipe added to today\'s nutrition log');
    } catch (error) {
      console.error('Error adding to nutrition log:', error);
      Alert.alert('Error', 'Failed to add to nutrition log');
    }
  };

  const handleFindSimilarRecipes = () => {
    if (!recipe) return;
    
    const mainIngredients = recipe.ingredients.slice(0, 3).map(ing => ing.name).join(',');
    router.push(`/(tabs)/recipes?search=${encodeURIComponent(mainIngredients)}`);
  };

  // Placeholder functions for non-meal-plan recipes
  const handleCookNow = () => {
    Alert.alert('Coming Soon! 👨‍🍳', 'Interactive Cooking Mode will be implemented in the next update.');
  };

  const handleShare = () => {
    Alert.alert('Coming Soon! 📤', 'Recipe sharing feature will be implemented soon.');
  };

  const handleEdit = () => {
    Alert.alert('Coming Soon! ✏️', 'Recipe editing feature will be implemented soon.');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success[500];
      case 'Medium': return colors.warning[500];
      case 'Hard': return colors.error[500];
      default: return colors.neutral[500];
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return colors.success[500];
    if (percentage >= 60) return colors.warning[500];
    return colors.error[500];
  };

  // Render pantry analysis section (only for meal plan recipes)
  const renderPantryAnalysis = () => {
    if (!isFromMealPlan || !pantryMatch) return null;

    return (
      <View style={styles.pantryAnalysisSection}>
        <Text style={styles.sectionTitle}>Pantry Analysis</Text>
        
        {/* Match Score Card */}
        <View style={styles.matchScoreCard}>
          <View style={styles.matchScoreHeader}>
            <Text style={styles.matchScoreTitle}>Ingredient Match</Text>
            <View style={[styles.matchBadge, { backgroundColor: getMatchColor(pantryMatch.matchPercentage) + '20' }]}>
              <Text style={[styles.matchBadgeText, { color: getMatchColor(pantryMatch.matchPercentage) }]}>
                {pantryMatch.matchPercentage}%
              </Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${pantryMatch.matchPercentage}%`,
                    backgroundColor: getMatchColor(pantryMatch.matchPercentage)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {pantryMatch.availableIngredients.length} of {recipe?.ingredients.length} ingredients available
            </Text>
          </View>
        </View>

        {/* Available Ingredients */}
        {pantryMatch.availableIngredients.length > 0 && (
          <View style={styles.ingredientStatusCard}>
            <View style={styles.ingredientStatusHeader}>
              <CheckCircle size={20} color={colors.success[500]} />
              <Text style={styles.ingredientStatusTitle}>Available in Pantry</Text>
            </View>
            <View style={styles.ingredientsList}>
              {pantryMatch.availableIngredients.map((ingredient, index) => (
                <View key={index} style={styles.availableIngredient}>
                  <Text style={styles.availableIngredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Missing Ingredients */}
        {pantryMatch.missingIngredients.length > 0 && (
          <View style={styles.ingredientStatusCard}>
            <View style={styles.ingredientStatusHeader}>
              <XCircle size={20} color={colors.error[500]} />
              <Text style={styles.ingredientStatusTitle}>Missing from Pantry</Text>
            </View>
            <View style={styles.ingredientsList}>
              {pantryMatch.missingIngredients.map((ingredient, index) => (
                <View key={index} style={styles.missingIngredient}>
                  <Text style={styles.missingIngredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quantity Warning */}
        {!pantryMatch.sufficientQuantity && (
          <View style={styles.quantityWarning}>
            <Package size={16} color={colors.warning[500]} />
            <Text style={styles.quantityWarningText}>
              Some ingredients may have insufficient quantities
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading recipe details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {!isAIMealId(recipe.id) && (
            <TouchableOpacity onPress={handleFavorite} style={styles.headerActionButton}>
              <Heart
                size={24}
                color={(recipe as Recipe).is_favorite ? colors.error[500] : colors.neutral[600]}
                fill={(recipe as Recipe).is_favorite ? colors.error[500] : 'transparent'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleShare} style={styles.headerActionButton}>
            <Share size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
          {!isAIMealId(recipe.id) && (
            <TouchableOpacity onPress={handleEdit} style={styles.headerActionButton}>
              <Edit3 size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {(recipe as Recipe).image_url && (recipe as Recipe).image_url!.trim() !== '' ? (
            <Image 
              source={{ uri: (recipe as Recipe).image_url }} 
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => {
                console.log('Image failed to load:', (recipe as Recipe).image_url);
              }}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderText}>No Image</Text>
            </View>
          )}
          
          {/* Badges */}
          <View style={styles.badges}>
            {((recipe as Recipe).is_ai_generated || isAIMealId(recipe.id)) && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>AI</Text>
              </View>
            )}
            {isFromMealPlan && (
              <View style={styles.mealPlanBadge}>
                <TrendingUp size={12} color={colors.neutral[0]} />
                <Text style={styles.mealPlanText}>Meal Plan</Text>
              </View>
            )}
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty || 'Easy') }]}>
              <Text style={styles.difficultyText}>{recipe.difficulty || 'Easy'}</Text>
            </View>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{recipe.name || (recipe as Recipe).title}</Text>
          <Text style={styles.description}>{recipe.description || (recipe as Recipe).description}</Text>
          
          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.neutral[500]} />
              <Text style={styles.metaText}>
                {((recipe.prep_time || 0) + (recipe.cook_time || 0)) || 30}m
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color={colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.servings || 1} servings</Text>
            </View>
            {recipe.nutrition?.calories && (
              <View style={styles.metaItem}>
                <Flame size={16} color={colors.neutral[500]} />
                <Text style={styles.metaText}>{recipe.nutrition.calories} cal</Text>
              </View>
            )}
          </View>

          {/* Source URL */}
          {(recipe as Recipe).source_url && (
            <TouchableOpacity style={styles.sourceButton} onPress={handleOpenSource}>
              <ExternalLink size={16} color={colors.primary[500]} />
              <Text style={styles.sourceText}>View Original Source</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ UPDATED: Action Buttons - Universal Shopping List Support */}
        <View style={styles.actionButtons}>
          {isFromMealPlan ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleIMadeThis}>
                <CheckCircle size={20} color={colors.neutral[0]} />
                <Text style={styles.primaryButtonText}>I Made This</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleAddMissingToCart}>
                <ShoppingCart size={20} color={colors.primary[500]} />
                <Text style={styles.secondaryButtonText}>
                  {pantryMatch?.missingIngredients.length ? 'Add Missing to Cart' : 'Add All to Cart'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCookNow}>
                <Play size={20} color={colors.neutral[0]} />
                <Text style={styles.primaryButtonText}>Cook Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleAddMissingToCart}>
                <ShoppingCart size={20} color={colors.primary[500]} />
                <Text style={styles.secondaryButtonText}>Add Ingredients to Cart</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Additional Actions for Meal Plan Recipes */}
        {isFromMealPlan && (
          <View style={styles.additionalActions}>
            <TouchableOpacity style={styles.tertiaryButton} onPress={handleAddToTodaysNutrition}>
              <Heart size={18} color={colors.neutral[600]} />
              <Text style={styles.tertiaryButtonText}>Add to Nutrition</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tertiaryButton} onPress={handleFindSimilarRecipes}>
              <TrendingUp size={18} color={colors.neutral[600]} />
              <Text style={styles.tertiaryButtonText}>Find Similar Recipes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pantry Analysis Section (Only for meal plan recipes) */}
        {loadingPantry ? (
          <View style={styles.pantryLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text style={styles.pantryLoadingText}>Analyzing pantry...</Text>
          </View>
        ) : (
          renderPantryAnalysis()
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => {
            return (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>
                  {ingredient.quantity && ingredient.unit 
                    ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
                    : ingredient.name
                  }
                  {ingredient.notes && (
                    <Text style={styles.ingredientNotes}> ({ingredient.notes})</Text>
                  )}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {Array.isArray(recipe.instructions) ? recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{instruction.step || index + 1}</Text>
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionText}>{instruction.instruction}</Text>
                {instruction.duration_mins && (
                  <Text style={styles.instructionDuration}>
                    ⏱️ {instruction.duration_mins} minutes
                  </Text>
                )}
              </View>
            </View>
          )) : (
            <Text style={styles.noDataText}>No instructions available</Text>
          )}
        </View>

        {/* Nutrition Info */}
        {recipe.nutrition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <View style={styles.nutritionGrid}>
              {recipe.nutrition.calories && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
              )}
              {recipe.nutrition.protein && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
              )}
              {recipe.nutrition.carbs && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
              )}
              {recipe.nutrition.fat && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tags */}
        {recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.neutral[600],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.neutral[0],
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerActionButton: {
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
  heroContainer: {
    position: 'relative',
    height: 250,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
  },
  badges: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  aiBadge: {
    backgroundColor: colors.secondary[500],
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  aiText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
  mealPlanBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealPlanText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
  titleSection: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-Bold',
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    fontWeight: '500',
    color: colors.neutral[600],
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sourceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.primary[500],
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[0],
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.primary[500],
  },
  additionalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tertiaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tertiaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    fontWeight: '500',
    color: colors.neutral[600],
  },
  pantryLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  pantryLoadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginLeft: spacing.sm,
  },
  pantryAnalysisSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  matchScoreCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  matchScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  matchScoreTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
  },
  matchBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  matchBadgeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    gap: spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  ingredientStatusCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  ingredientStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ingredientStatusTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[700],
    marginLeft: spacing.sm,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  availableIngredient: {
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  availableIngredientText: {
    fontSize: typography.fontSize.sm,
    color: colors.success[700],
    fontWeight: '500',
  },
  missingIngredient: {
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  missingIngredientText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
    fontWeight: '500',
  },
  quantityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  quantityWarningText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    marginLeft: spacing.sm,
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginTop: 8,
    marginRight: spacing.md,
  },
  ingredientText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[700],
    lineHeight: 22,
  },
  ingredientNotes: {
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[700],
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  instructionDuration: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    color: colors.neutral[500],
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 80,
  },
  nutritionValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    color: colors.neutral[500],
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    paddingHorizontal: spacing.md,  
    paddingVertical: spacing.sm,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    fontWeight: '500',
    color: colors.primary[600],
  },
  noDataText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.lg,
  },
});
