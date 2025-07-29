//app/ai-meal-plan.tsx
// Enhanced AI Meal Plan with individual meal regeneration capabilities
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
  calculateOptimizationScore,
  calculatePantryMatch 
} from '@/lib/meal-plan/meal-matching';
import { 
  generateFallbackMeal, 
  generateFallbackSnacks, 
  generateFallbackPlan,
  categorizeIngredient,
  IngredientDiversityManager // ✅ ADDED: Import diversity manager
} from '@/lib/meal-plan/utils';

// AI Generation imports
import { 
  generateAIMealPlan,
  generateAIMeal,
  generateAlternativeMeal 
} from '@/lib/meal-plan/ai-generation';
import { mealRegenerationManager } from '@/lib/meal-plan/meal-regeneration';

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
// import PantryInsights from '@/components/meal-plan/PantryInsights';
import MealPlanSummary from '@/components/meal-plan/MealPlanSummary';
import ViewModeTabs from '@/components/meal-plan/ViewModeTabs';

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

        // Generate pantry insights
        // const insights = generatePantryInsights(validPantryItems, metrics);
        // setPantryInsights(insights);

        // ✅ Generate AI meal plan instead of mock data
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

  // ✅ Generate initial AI meal plan
  const generateInitialMealPlan = async (pantryItems: PantryItem[], userProfile: UserProfile | null) => {
    try {
      if (pantryItems.length < 3) {
        // Use fallback plan if insufficient pantry items
        setMealPlan(generateFallbackPlan(pantryItems));
        return;
      }

      // ✅ ADDED: Use IngredientDiversityManager to ensure variety
      const diversityManager = new IngredientDiversityManager();

      const breakfast = await generateAIMeal({ mealType: 'breakfast', pantryItems, userProfile });
      diversityManager.trackMeal(breakfast);

      const lunch = await generateAIMeal(
        { mealType: 'lunch', pantryItems, userProfile },
        [breakfast],
        diversityManager.getAvoidanceList()
      );
      diversityManager.trackMeal(lunch);

      const dinner = await generateAIMeal(
        { mealType: 'dinner', pantryItems, userProfile },
        [breakfast, lunch],
        diversityManager.getAvoidanceList()
      );
      diversityManager.trackMeal(dinner);

      const snacks = await generateAIMeal(
        { mealType: 'snack', pantryItems, userProfile },
        [breakfast, lunch, dinner],
        diversityManager.getAvoidanceList()
      );

      const aiMeals = { breakfast, lunch, dinner, snacks: [snacks].filter(Boolean) as Meal[] };
      
      // Calculate totals
      const totalCalories = (aiMeals.breakfast?.calories || 0) + 
                           (aiMeals.lunch?.calories || 0) + 
                           (aiMeals.dinner?.calories || 0) + 
                           aiMeals.snacks.reduce((sum, snack) => sum + snack.calories, 0);
      
      const totalProtein = (aiMeals.breakfast?.protein || 0) + 
                          (aiMeals.lunch?.protein || 0) + 
                          (aiMeals.dinner?.protein || 0) + 
                          aiMeals.snacks.reduce((sum, snack) => sum + snack.protein, 0);

      // Calculate optimization score
      const optimizationScore = calculateOptimizationScore(
        aiMeals.breakfast, 
        aiMeals.lunch, 
        aiMeals.dinner, 
        pantryItems
      );

      const plan: MealPlan = {
        daily: {
          ...aiMeals,
          totalCalories,
          totalProtein,
          optimizationScore,
          generatedAt: new Date().toISOString(),
          regenerationHistory: {}
        }
      };

      setMealPlan(plan);
    } catch (error) {
      console.error('Failed to generate AI meal plan:', error);
      // Fall back to basic plan
      setMealPlan(generateFallbackPlan(pantryItems));
    }
  };

  // ✅ Regenerate individual meal
  const regenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    if (!mealPlan || !userProfile) return;

    try {
      // Set loading state for this specific meal
      setLoadingStates(prev => ({ ...prev, [mealType]: true }));

      const currentMeal = mealPlan.daily[mealType as keyof typeof mealPlan.daily];
      const previousMeal = Array.isArray(currentMeal) ? currentMeal[0] : currentMeal;

      // Create regeneration request
      const request: MealRegenerationRequest = {
        mealType: mealType === 'snacks' ? 'snack' : mealType,
        pantryItems,
        userProfile,
        previousMeal: previousMeal || undefined,
      };

      // Generate new meal using regeneration manager
      const newMeal = await mealRegenerationManager.regenerateMeal(request);

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
        const totalCalories = (updatedDaily.breakfast?.calories || 0) + 
                             (updatedDaily.lunch?.calories || 0) + 
                             (updatedDaily.dinner?.calories || 0) + 
                             updatedDaily.snacks.reduce((sum, snack) => sum + snack.calories, 0);
        
        const totalProtein = (updatedDaily.breakfast?.protein || 0) + 
                            (updatedDaily.lunch?.protein || 0) + 
                            (updatedDaily.dinner?.protein || 0) + 
                            updatedDaily.snacks.reduce((sum, snack) => sum + snack.protein, 0);

        updatedDaily.totalCalories = totalCalories;
        updatedDaily.totalProtein = totalProtein;
        updatedDaily.optimizationScore = calculateOptimizationScore(
          updatedDaily.breakfast, 
          updatedDaily.lunch, 
          updatedDaily.dinner, 
          pantryItems
        );

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

  // ✅ ÇÖZÜM 1: Enhanced regenerate all meals
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

  // ✅ ÇÖZÜM 2: Navigate to recipe detail
  const navigateToRecipe = (meal: Meal) => {
    try {
      setModalVisible(false);
      setSelectedMeal(null); // ✅ Reset selected meal
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
        <Text style={styles.loadingSubtext}>Analyzing your pantry and preferences</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ ÇÖZÜM 3: Modal with proper onClose handler */}
      <MealDetailModal
        visible={modalVisible}
        meal={selectedMeal}
        onClose={() => {
          setModalVisible(false);
          setSelectedMeal(null); // ✅ Reset selected meal
        }}
        onViewRecipe={navigateToRecipe}
        onAddToNutrition={addToNutritionLog}
        onAddToShopping={(ingredients) => {
          setModalVisible(false);
          setSelectedMeal(null); // ✅ Reset selected meal when closing
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