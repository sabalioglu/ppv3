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

// ✅ FIXED: Proper imports restored
import type { 
  Meal, 
  PantryItem, 
  MealPlan, 
  PantryMetrics, 
  UserProfile,
  MealLoadingStates
} from '@/lib/meal-plan/types';

// ✅ FIXED: Proper utility imports
import { 
  calculatePantryMetrics, 
  generatePantryInsights 
} from '@/lib/meal-plan/pantry-analysis';

import { 
  generateAIMeal,
  generateAIMealWithQualityControl,
  calculateAverageMatchScore 
} from '@/lib/meal-plan/ai-generation';

import { generateFallbackPlan } from '@/lib/meal-plan/utils';

// ❌ ESKİ COMPONENT IMPORT'LAR - Geçici mock components
// import MealDetailModal from '@/components/meal-plan/MealDetailModal';
// import MealCard from '@/components/meal-plan/MealCard';
// import MealPlanSummary from '@/components/meal-plan/MealPlanSummary';
// import ViewModeTabs from '@/components/meal-plan/ViewModeTabs';

// ✅ GEÇİCİ MOCK COMPONENTS
const MealDetailModal = ({ visible, onClose, meal, onViewRecipe, onAddToNutrition, onAddToShopping }: any) => {
  if (!visible || !meal) return null;
  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <View style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        margin: 20,
        maxWidth: 300
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>{meal.name}</Text>
        <Text style={{ marginBottom: 10 }}>{meal.calories} cal • {meal.protein}g protein</Text>
        <TouchableOpacity 
          style={{ 
            backgroundColor: colors.primary[500], 
            padding: 12, 
            borderRadius: 8,
            marginBottom: 10
          }}
          onPress={() => onViewRecipe && onViewRecipe(meal)}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>View Recipe</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ backgroundColor: colors.neutral[200], padding: 12, borderRadius: 8 }}
          onPress={onClose}
        >
          <Text style={{ textAlign: 'center' }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MealCard = ({ meal, mealType, onPress, onRegenerate, isRegenerating, regenerationAttempts }: any) => (
  <TouchableOpacity 
    style={{
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}
    onPress={() => onPress && onPress(meal)}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{meal.emoji} {meal.name}</Text>
        <Text style={{ color: colors.neutral[600], marginBottom: 8 }}>{mealType}</Text>
        <Text style={{ color: colors.neutral[500] }}>{meal.calories} cal • {meal.protein}g protein</Text>
      </View>
      <TouchableOpacity
        style={{
          padding: 8,
          backgroundColor: colors.primary[50],
          borderRadius: 8
        }}
        onPress={() => onRegenerate && onRegenerate(mealType.toLowerCase())}
        disabled={isRegenerating}
      >
        {isRegenerating ? (
          <ActivityIndicator size="small" color={colors.primary[500]} />
        ) : (
          <RefreshCw size={16} color={colors.primary[600]} />
        )}
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const MealPlanSummary = ({ plan }: any) => (
  <View style={{
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Today's Summary</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary[500] }}>{plan.totalCalories}</Text>
        <Text style={{ color: colors.neutral[600] }}>Calories</Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.success[500] }}>{plan.totalProtein}g</Text>
        <Text style={{ color: colors.neutral[600] }}>Protein</Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.accent[500] }}>{Math.round(plan.optimizationScore)}</Text>
        <Text style={{ color: colors.neutral[600] }}>Match %</Text>
      </View>
    </View>
  </View>
);

const ViewModeTabs = ({ viewMode, onViewModeChange }: any) => (
  <View style={{ 
    flexDirection: 'row', 
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4
  }}>
    {['daily', 'weekly', 'monthly'].map((mode) => (
      <TouchableOpacity
        key={mode}
        style={{
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: viewMode === mode ? colors.primary[500] : 'transparent'
        }}
        onPress={() => onViewModeChange(mode)}
      >
        <Text style={{
          textAlign: 'center',
          color: viewMode === mode ? 'white' : colors.neutral[600],
          fontWeight: viewMode === mode ? '600' : '400',
          textTransform: 'capitalize'
        }}>
          {mode}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

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
        throw new Error('User not authenticated');
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

        if (profile) {
          userProfileData = profile;
        }
        
        setUserProfile(userProfileData);
      } catch (profileError) {
        console.error('Profile error:', profileError);
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

        const validPantryItems = pantry || [];
        setPantryItems(validPantryItems);
        
        // Calculate metrics
        const metrics = calculatePantryMetrics(validPantryItems);
        setPantryMetrics(metrics);

        // ✅ Generate AI meal plan instead of mock data
        await generateInitialMealPlan(validPantryItems, userProfileData);

      } catch (pantryError) {
        console.error('Pantry error:', pantryError);
        
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
      console.error('Load data error:', error);
      setLoadingStates(prev => ({ ...prev, initial: false }));
      setRefreshing(false);
    }
  };

  // ✅ Generate initial AI meal plan
  const generateInitialMealPlan = async (pantryItems: PantryItem[], userProfile: UserProfile | null) => {
    try {
      // ✅ ARRAY SAFETY: Check pantry items
      if (pantryItems.length < 3) {
        // Use fallback plan if insufficient pantry items
        setMealPlan(generateFallbackPlan(pantryItems));
        console.log('⚠️ Using fallback plan due to insufficient pantry items');
        return;
      }

      console.log('🤖 Generating AI meal plan with quality control...');
      
      // ✅ FIXED: Use quality-controlled generation
      const breakfast = await generateAIMealWithQualityControl('breakfast', pantryItems, userProfile, []);
      const lunch = await generateAIMealWithQualityControl('lunch', pantryItems, userProfile, [breakfast]);
      const dinner = await generateAIMealWithQualityControl('dinner', pantryItems, userProfile, [breakfast, lunch]);
      const snacks = await generateAIMealWithQualityControl('snack', pantryItems, userProfile, [breakfast, lunch, dinner]);

      // ✅ ARRAY SAFETY: Filter out null meals
      const aiMeals = { 
        breakfast: breakfast || null, 
        lunch: lunch || null, 
        dinner: dinner || null, 
        snacks: [snacks].filter(Boolean) as Meal[] 
      };
      
      // ✅ FIXED: Calculate totals accurately from the generated meals
      const mealsForTotals = [aiMeals.breakfast, aiMeals.lunch, aiMeals.dinner].filter(Boolean) as Meal[];
      const totalCalories = mealsForTotals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = mealsForTotals.reduce((sum, meal) => sum + (meal.protein || 0), 0);

      // ✅ FIXED: Use the new, clear average match score calculation
      const averageMatchScore = calculateAverageMatchScore(mealsForTotals);

      const plan: MealPlan = {
        daily: {
          ...aiMeals,
          totalCalories,
          totalProtein,
          optimizationScore: averageMatchScore, // Use the clear average score
          generatedAt: new Date().toISOString(),
          regenerationHistory: {}
        }
      };

      // ✅ CRITICAL: Save to storage using the store
      const { setCurrentMealPlan } = useMealPlanStore.getState();
      await setCurrentMealPlan(plan);
      
      setMealPlan(plan);
      console.log('✅ AI meal plan generated and saved successfully');
      
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

      // Generate new meal
      const newMeal = await generateAIMealWithQualityControl(
        mealType === 'snacks' ? 'snack' : mealType,
        pantryItems,
        userProfile,
        Object.values(mealPlan.daily).filter(Boolean) as Meal[]
      );

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
        updatedDaily.optimizationScore = 85; // Mock score

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
        throw new Error('Please log in to add items to shopping list');
      }

      if (!missingIngredients || missingIngredients.length === 0) {
        throw new Error('No ingredients to add');
      }

      const shoppingItems = missingIngredients.map(ingredient => ({
        user_id: user.id,
        item_name: ingredient,
        category: 'general',
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
          { text: 'View List', onPress: () => router.push('/(tabs)/shopping-list') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Add to shopping list error:', error);
      Alert.alert('Error', 'Failed to add items to shopping list');
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
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate to recipe');
    }
  };

  // Add meal to nutrition log
  const addToNutritionLog = async (meal: Meal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in to track nutrition');
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
      console.error('Add to nutrition error:', error);
      Alert.alert('Error', 'Failed to add meal to nutrition log');
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
        onAddToShopping={(ingredients: string[]) => {
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
            onPress={() => router.push('/(tabs)/shopping-list')}
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
