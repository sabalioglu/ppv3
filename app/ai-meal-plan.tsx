//## 📄 **app/ai-meal-plan.tsx - Düzeltilmiş (source field kaldırıldı)**
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
  PantryInsight 
} from '@/lib/meal-plan/types';

// Utility imports
import { 
  calculatePantryMetrics, 
  getExpiringItems, 
  analyzePantryComposition,
  generatePantryInsights 
} from '@/lib/meal-plan/pantry-analysis';
import { 
  findBestMealMatch, 
  calculateOptimizationScore,
  calculatePantryMatch 
} from '@/lib/meal-plan/meal-matching';
import { 
  generateFallbackMeal, 
  generateFallbackSnacks, 
  generateFallbackPlan,
  categorizeIngredient 
} from '@/lib/meal-plan/utils';
import { MEAL_DATABASE } from '@/lib/meal-plan/constants';

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
import PantryInsights from '@/components/meal-plan/PantryInsights';
import MealPlanSummary from '@/components/meal-plan/MealPlanSummary';
import ViewModeTabs from '@/components/meal-plan/ViewModeTabs';

export default function AIMealPlan() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [pantryInsights, setPantryInsights] = useState<PantryInsight[]>([]);
  
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

  // Pantry cache for performance
  const [pantryCache, setPantryCache] = useState<{
    data: PantryItem[],
    lastUpdated: Date,
    metrics: PantryMetrics
  }>({
    data: [],
    lastUpdated: new Date(),
    metrics: {
      totalItems: 0,
      expiringItems: 0,
      expiredItems: 0,
      categories: {},
    }
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

  // Cache refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - pantryCache.lastUpdated.getTime() > 5 * 60 * 1000) {
        loadAllData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [pantryCache.lastUpdated]);

  const loadAllData = async () => {
    try {
      setLoading(true);
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

        // Validate profile data
        if (profile) {
          if (validateUserProfile(profile)) {
            userProfileData = profile;
          } else {
            console.warn('Invalid profile data, using defaults');
            await logError(
              handleError(new Error('Invalid profile data'), 'validateProfile'),
              user.id
            );
          }
        }
        
        setUserProfile(userProfileData);
      } catch (profileError) {
        const error = handleError(profileError, 'loadUserProfile');
        console.error('Profile error:', error);
        await logError(error, user.id);
        // Continue with default profile
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

        // Validate pantry items
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
        
        // Update cache
        setPantryCache({
          data: validPantryItems,
          lastUpdated: new Date(),
          metrics: metrics
        });

        // Generate pantry insights
        const insights = generatePantryInsights(validPantryItems, metrics);
        setPantryInsights(insights);

        // Generate meal plan
        await generateMealPlan(validPantryItems, userProfileData);

      } catch (pantryError) {
        const error = handleError(pantryError, 'loadPantryItems');
        await logError(error, user.id);
        
        // Show error with retry option
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

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      const appError = handleError(error, 'loadAllData');
      await logError(appError);
      showErrorAlert(appError, () => {
        // Retry with navigation to login if unauthorized
        if (appError.code === ERROR_CODES.UNAUTHORIZED) {
          router.replace('/(auth)/login');
        } else {
          loadAllData();
        }
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate meal plan based on pantry
  const generateMealPlan = async (pantryItems: PantryItem[], userProfile: UserProfile | null) => {
    try {
      // Check if we have enough pantry items
      if (pantryItems.length < 3) {
        throw new MealPlanError(
          ERROR_CODES.INSUFFICIENT_PANTRY_ITEMS,
          'Add more items to your pantry for better meal suggestions'
        );
      }

      // Analyze pantry composition for smart suggestions
      const pantryAnalysis = analyzePantryComposition(pantryItems);
      
      // Find best matches with enhanced logic
      const breakfast = findBestMealMatch('breakfast', pantryItems, userProfile, pantryAnalysis);
      const lunch = findBestMealMatch('lunch', pantryItems, userProfile, pantryAnalysis);
      const dinner = findBestMealMatch('dinner', pantryItems, userProfile, pantryAnalysis);
      
      // Check if we found any matching meals
      if (!breakfast && !lunch && !dinner) {
        throw new MealPlanError(
          ERROR_CODES.NO_MATCHING_MEALS,
          'No meals match your current pantry items. Try adding more ingredients.'
        );
      }

      // Select snacks based on availability
      const snacks = MEAL_DATABASE.snacks
        .map(snack => {
          const match = calculatePantryMatch(snack.ingredients, pantryItems);
          return {
            ...snack,
            matchPercentage: match.matchPercentage,
            available: match.matchPercentage > 50
          };
        })
        .filter(snack => snack.available)
        .slice(0, 2);

      // Calculate totals
      const totalCalories = 
        (breakfast?.calories || 0) + 
        (lunch?.calories || 0) + 
        (dinner?.calories || 0) +
        snacks.reduce((sum, snack) => sum + snack.calories, 0);

      const totalProtein = 
        (breakfast?.protein || 0) + 
        (lunch?.protein || 0) + 
        (dinner?.protein || 0) +
        snacks.reduce((sum, snack) => sum + snack.protein, 0);

      const plan: MealPlan = {
        daily: {
          breakfast: breakfast || generateFallbackMeal('breakfast'),
          lunch: lunch || generateFallbackMeal('lunch'),
          dinner: dinner || generateFallbackMeal('dinner'),
          snacks: snacks.length > 0 ? snacks : generateFallbackSnacks(),
          totalCalories,
          totalProtein,
          optimizationScore: calculateOptimizationScore(breakfast, lunch, dinner, pantryItems)
        }
      };

      setMealPlan(plan);
    } catch (error) {
      const appError = handleError(error, 'generateMealPlan');
      console.error('Meal plan generation error:', appError);
      
      // Log error for analytics
      if (userProfile?.id) {
        await logError(appError, userProfile.id);
      }
      
      // Always provide a fallback plan
      setMealPlan(generateFallbackPlan());
      
      // Show error only if it's not an expected error
      if (appError.code === ERROR_CODES.INSUFFICIENT_PANTRY_ITEMS ||
          appError.code === ERROR_CODES.NO_MATCHING_MEALS) {
        // Show a gentle notification instead of error alert
        Alert.alert(
          'Tip',
          appError.message,
          [
            { text: 'Add Items', onPress: () => router.push('/(tabs)/pantry') },
            { text: 'OK' }
          ]
        );
      } else {
        showErrorAlert(appError);
      }
    }
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
        name: ingredient,
        category: categorizeIngredient(ingredient),
        quantity: 1,
        unit: 'unit',
        is_checked: false,
        // source field removed - not in schema
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
        // source field removed - not in schema
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
        {/* Pantry Insights */}
        <PantryInsights insights={pantryInsights} />

        {/* Today's Summary Card */}
        <MealPlanSummary plan={plan} />

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
            />
          )}

          {/* Lunch */}
          {plan.lunch && (
            <MealCard
              meal={plan.lunch}
              mealType="Lunch"
              onPress={handleMealPress}
              onAddToShopping={handleAddToShoppingList}
            />
          )}

          {/* Dinner */}
          {plan.dinner && (
            <MealCard
              meal={plan.dinner}
              mealType="Dinner"
              onPress={handleMealPress}
              onAddToShopping={handleAddToShoppingList}
            />
          )}
        </View>

        {/* Snacks Section */}
        <View style={styles.snacksSection}>
          <Text style={styles.sectionTitle}>Snacks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.snacksContainer}>
            {plan.snacks.map((snack, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.snackCard}
                onPress={() => handleMealPress(snack)}
              >
                <Text style={styles.snackEmoji}>{snack.emoji}</Text>
                <Text style={styles.snackName}>{snack.name}</Text>
                <Text style={styles.snackStats}>
                  {snack.calories} cal • {snack.protein}g protein
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Creating your personalized meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modal */}
      <MealDetailModal
        visible={modalVisible}
        meal={selectedMeal}
        onClose={() => setModalVisible(false)}
        onViewRecipe={navigateToRecipe}
        onAddToNutrition={addToNutritionLog}
        onAddToShopping={(ingredients) => {
          setModalVisible(false);
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