//## 📄 **app/recipe/[id].tsx - Schema'ya Uyumlu Düzeltilmiş Versiyon**
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
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Flame, 
  Heart, 
  ExternalLink, 
  Play, 
  ShoppingCart, 
  CreditCard as Edit3, 
  Share,
  CheckCircle,
  XCircle,
  TrendingUp,
  Package
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Import meal plan utilities
import { calculatePantryMatch } from '@/lib/meal-plan/meal-matching';
import { categorizeIngredient } from '@/lib/meal-plan/utils';
import type { PantryItem } from '@/lib/meal-plan/types';

// Recipe interface (updated to match actual schema)
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

interface PantryMatchResult {
  matchPercentage: number;
  availableIngredients: string[];
  missingIngredients: string[];
  sufficientQuantity: boolean;
}

export default function RecipeDetail() {
  const { id, source } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [pantryMatch, setPantryMatch] = useState<PantryMatchResult | null>(null);
  const [loadingPantry, setLoadingPantry] = useState(false);

  // Check if this recipe is from meal plan
  const isFromMealPlan = source === 'meal_plan';

  // Load recipe data
  const loadRecipe = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to view recipe details.');
        router.back();
        return;
      }

      const { data: recipeData, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading recipe:', error);
        Alert.alert('Error', 'Failed to load recipe details');
        router.back();
        return;
      }

      if (recipeData) {
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
        setRecipe(formattedRecipe);

        // Load pantry data if from meal plan
        if (isFromMealPlan) {
          await loadPantryData(user.id, formattedRecipe);
        }
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Failed to load recipe details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Load pantry data and calculate match
  const loadPantryData = async (userId: string, recipe: Recipe) => {
    try {
      setLoadingPantry(true);
      
      const { data: pantry, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .gt('quantity', 0);

      if (error) throw error;

      const pantryItems = pantry || [];
      setPantryItems(pantryItems);

      // Calculate enhanced pantry match
      const enhancedMatch = calculateEnhancedPantryMatch(recipe, pantryItems);
      setPantryMatch(enhancedMatch);

    } catch (error) {
      console.error('Error loading pantry data:', error);
      // Don't show error, just continue without pantry data
    } finally {
      setLoadingPantry(false);
    }
  };

  // Enhanced pantry match calculation
  const calculateEnhancedPantryMatch = (recipe: Recipe, pantryItems: PantryItem[]): PantryMatchResult => {
    const availableIngredients: string[] = [];
    const missingIngredients: string[] = [];
    let sufficientQuantity = true;

    recipe.ingredients.forEach(ingredient => {
      const pantryItem = pantryItems.find(item => 
        item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(item.name.toLowerCase())
      );

      if (pantryItem && pantryItem.quantity > 0) {
        availableIngredients.push(ingredient.name);
        
        // Check quantity sufficiency (basic logic)
        if (ingredient.quantity && pantryItem.quantity < parseFloat(ingredient.quantity)) {
          sufficientQuantity = false;
        }
      } else {
        missingIngredients.push(ingredient.name);
      }
    });

    const matchPercentage = recipe.ingredients.length > 0 
      ? Math.round((availableIngredients.length / recipe.ingredients.length) * 100)
      : 0;

    return {
      matchPercentage,
      availableIngredients,
      missingIngredients,
      sufficientQuantity
    };
  };

  // Real-time pantry updates listener
  useEffect(() => {
    if (!isFromMealPlan || !recipe) return;

    const subscription = supabase
      .channel('recipe_pantry_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pantry_items' },
        () => {
          // Reload pantry data when changes occur
          const { data: { user } } = supabase.auth.getUser();
          user.then(({ user }) => {
            if (user && recipe) {
              loadPantryData(user.id, recipe);
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isFromMealPlan, recipe]);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  // Toggle favorite
  const handleFavorite = async () => {
    if (!recipe) return;
    
    try {
      const newFavoriteStatus = !recipe.is_favorite;
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
    if (recipe?.source_url) {
      try {
        await Linking.openURL(recipe.source_url);
      } catch (error) {
        Alert.alert('Error', 'Could not open source URL');
      }
    }
  };

  // Enhanced action handlers for meal plan recipes
  const handleIMadeThis = async () => {
    if (!recipe || !isFromMealPlan) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to track cooking.');
        return;
      }

      // Add to nutrition log (schema-compliant)
      const nutritionEntry = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: recipe.category,
        food_name: recipe.title,
        quantity: 1,
        unit: 'serving',
        calories: recipe.nutrition?.calories || 0,
        protein: recipe.nutrition?.protein || 0,
        carbs: recipe.nutrition?.carbs || 0,
        fat: recipe.nutrition?.fat || 0,
        fiber: recipe.nutrition?.fiber || 0,
        // Note: 'source' column doesn't exist in schema, removed
      };

      const { error: nutritionError } = await supabase
        .from('nutrition_logs')
        .insert([nutritionEntry]);

      if (nutritionError) throw nutritionError;

      // Update pantry items (decrease quantities)
      if (pantryMatch?.availableIngredients) {
        const updates = pantryItems
          .filter(item => pantryMatch.availableIngredients.some(ing => 
            item.name.toLowerCase().includes(ing.toLowerCase())
          ))
          .map(item => ({
            id: item.id,
            quantity: Math.max(0, item.quantity - 1) // Decrease by 1 unit
          }));

        if (updates.length > 0) {
          for (const update of updates) {
            await supabase
              .from('pantry_items')
              .update({ quantity: update.quantity })
              .eq('id', update.id);
          }
        }
      }

      Alert.alert(
        'Great Job! 👨‍🍳',
        'Recipe marked as cooked and added to your nutrition log. Pantry quantities updated.',
        [
          { text: 'View Nutrition', onPress: () => router.push('/(tabs)/nutrition') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error marking recipe as cooked:', error);
      Alert.alert('Error', 'Failed to update cooking status');
    }
  };

  const handleAddToTodaysNutrition = async () => {
    if (!recipe) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to track nutrition.');
        return;
      }

      // Schema-compliant nutrition entry
      const nutritionEntry = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: recipe.category,
        food_name: recipe.title,
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

      Alert.alert('Success', 'Recipe added to today\'s nutrition log');
    } catch (error) {
      console.error('Error adding to nutrition log:', error);
      Alert.alert('Error', 'Failed to add to nutrition log');
    }
  };

  const handleFindSimilarRecipes = () => {
    if (!recipe) return;
    
    // Navigate to recipes page with ingredient-based search
    const mainIngredients = recipe.ingredients.slice(0, 3).map(ing => ing.name).join(',');
    router.push(`/(tabs)/recipes?search=${encodeURIComponent(mainIngredients)}`);
  };

  const handleAddMissingToCart = async () => {
    if (!pantryMatch?.missingIngredients || pantryMatch.missingIngredients.length === 0) {
      Alert.alert('Info', 'You have all ingredients needed for this recipe!');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to add items to shopping list.');
        return;
      }

      // Schema-compliant shopping list items
      const shoppingItems = pantryMatch.missingIngredients.map(ingredient => ({
        user_id: user.id,
        item_name: ingredient, // ✅ Correct column name
        category: categorizeIngredient(ingredient),
        quantity: 1,
        unit: 'unit',
        is_completed: false, // ✅ Correct column name (not is_checked)
        source: 'recipe',
        recipe_id: recipe?.id,
        ingredient_name: ingredient,
        priority: 'high', // ✅ Text value (not integer)
      }));

      const { error } = await supabase
        .from('shopping_list_items')
        .insert(shoppingItems);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Added ${pantryMatch.missingIngredients.length} missing ingredients to your shopping list`,
        [
          { text: 'View List', onPress: () => router.push('/(tabs)/shopping') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      Alert.alert('Error', 'Failed to add items to shopping list');
    }
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
          <TouchableOpacity onPress={handleFavorite} style={styles.headerActionButton}>
            <Heart
              size={24}
              color={recipe.is_favorite ? colors.error[500] : colors.neutral[600]}
              fill={recipe.is_favorite ? colors.error[500] : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerActionButton}>
            <Share size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.headerActionButton}>
            <Edit3 size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {recipe.image_url && recipe.image_url.trim() !== '' ? (
            <Image 
              source={{ uri: recipe.image_url }} 
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => {
                console.log('Image failed to load:', recipe.image_url);
              }}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderText}>No Image</Text>
            </View>
          )}
          
          {/* Badges */}
          <View style={styles.badges}>
            {recipe.is_ai_generated && (
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
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description}>{recipe.description}</Text>
          
          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.prep_time + recipe.cook_time}m</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color={colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
            {recipe.nutrition?.calories && (
              <View style={styles.metaItem}>
                <Flame size={16} color={colors.neutral[500]} />
                <Text style={styles.metaText}>{recipe.nutrition.calories} cal</Text>
              </View>
            )}
          </View>

          {/* Source URL */}
          {recipe.source_url && (
            <TouchableOpacity style={styles.sourceButton} onPress={handleOpenSource}>
              <ExternalLink size={16} color={colors.primary[500]} />
              <Text style={styles.sourceText}>View Original Source</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons - Different for meal plan vs regular recipes */}
        <View style={styles.actionButtons}>
          {isFromMealPlan ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleIMadeThis}>
                <CheckCircle size={20} color={colors.neutral[0]} />
                <Text style={styles.primaryButtonText}>I Made This</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleAddToTodaysNutrition}>
                <Heart size={20} color={colors.primary[500]} />
                <Text style={styles.secondaryButtonText}>Add to Today's Nutrition</Text>
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
                <Text style={styles.secondaryButtonText}>Add Missing to Cart</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Additional Actions for Meal Plan Recipes */}
        {isFromMealPlan && (
          <View style={styles.additionalActions}>
            <TouchableOpacity style={styles.tertiaryButton} onPress={handleAddMissingToCart}>
              <ShoppingCart size={18} color={colors.neutral[600]} />
              <Text style={styles.tertiaryButtonText}>Add Missing to Shopping</Text>
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
            const isAvailable = isFromMealPlan && pantryMatch?.availableIngredients.includes(ingredient.name);
            const isMissing = isFromMealPlan && pantryMatch?.missingIngredients.includes(ingredient.name);
            
            return (
              <View key={index} style={styles.ingredientItem}>
                <View style={[
                  styles.ingredientBullet,
                  isAvailable && { backgroundColor: colors.success[500] },
                  isMissing && { backgroundColor: colors.error[500] }
                ]} />
                <Text style={[
                  styles.ingredientText,
                  isAvailable && { color: colors.success[700] },
                  isMissing && { color: colors.error[700] }
                ]}>
                  {ingredient.quantity && ingredient.unit 
                    ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
                    : ingredient.name
                  }
                  {ingredient.notes && (
                    <Text style={styles.ingredientNotes}> ({ingredient.notes})</Text>
                  )}
                </Text>
                {isFromMealPlan && (
                  <View style={styles.ingredientStatus}>
                    {isAvailable && <CheckCircle size={16} color={colors.success[500]} />}
                    {isMissing && <XCircle size={16} color={colors.error[500]} />}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{instruction.step}</Text>
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
          ))}
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
        {recipe.tags.length > 0 && (
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
  ingredientStatus: {
    marginLeft: spacing.sm,
    marginTop: 2,
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
});