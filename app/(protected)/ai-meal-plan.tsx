// app/ai-meal-plan.tsx - AI Meal Planner (Coming Soon Version)
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
import { useMealPlanStore, useMealPlanAutoLoad } from '@/lib/meal-plan/store';

// ✅ DÜZELTME: types.ts'den import (api-clients/types değil)
import type { 
  Meal, 
  PantryItem, 
  MealPlan, 
  UserProfile,
} from '@/lib/meal-plan/types';

// ✅ DÜZELTME: PantryMetrics ve MealLoadingStates için ayrı tanımlama
interface PantryMetrics {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  categories: Record<string, number>;
}

interface MealLoadingStates {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snacks: boolean;
  initial: boolean;
}

// ✅ NEW: Enhanced meal plan interface
interface EnhancedMealPlanSummary {
  totalDiversityScore: number;
  totalPersonalizationScore: number;
  pantryUtilization: number;
  generationMethods: string[];
  insights?: {
    diversityTips: string[];
    personalizationAdaptations: string[];
    nextSuggestions: string[];
  };
}

// ✅ Utility imports düzeltildi
import { 
  calculatePantryMetrics, 
  generatePantryInsights 
} from '@/lib/meal-plan/pantry-analysis';

// ✅ Enhanced AI generation imports
import { 
  generateAIMeal,
  generateAIMealWithQualityControl,
  calculateAverageMatchScore 
} from '@/lib/meal-plan/api-clients/ai-generation';

import { generateFallbackPlan } from '@/lib/meal-plan/utils';

// ✅ NEW: Enhanced generation imports
import { 
  createEnhancedGenerator,
  generateEnhancedMealPlan 
} from '@/lib/meal-plan/enhanced-ai-generation';
import { createDiversityManager } from '@/lib/meal-plan/enhanced-diversity';
import { createPersonalizedGenerator } from '@/lib/meal-plan/personalized-generation';

// ✅ Enhanced insights modal
const EnhancedInsightsModal = ({ visible, onClose, insights }: any) => {
  if (!visible || !insights) return null;
  
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
        maxWidth: 340,
        maxHeight: '80%'
      }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
            🌟 Meal Plan Insights
          </Text>
          
          {/* Diversity Tips */}
          {insights.diversityTips && insights.diversityTips.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary[700], marginBottom: 8 }}>
                🎯 Variety Tips
              </Text>
              {insights.diversityTips.map((tip: string, index: number) => (
                <Text key={index} style={{ 
                  fontSize: 14, 
                  color: colors.neutral[700], 
                  marginBottom: 4,
                  paddingLeft: 8
                }}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

          {/* Personalization Adaptations */}
          {insights.personalizationAdaptations && insights.personalizationAdaptations.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.success[700], marginBottom: 8 }}>
                🎨 Personal Touches
              </Text>
              {insights.personalizationAdaptations.slice(0, 3).map((adaptation: string, index: number) => (
                <Text key={index} style={{ 
                  fontSize: 14, 
                  color: colors.neutral[700], 
                  marginBottom: 4,
                  paddingLeft: 8
                }}>
                  • {adaptation}
                </Text>
              ))}
            </View>
          )}

          {/* Next Suggestions */}
          {insights.nextSuggestions && insights.nextSuggestions.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.accent[700], marginBottom: 8 }}>
                💡 What's Next
              </Text>
              {insights.nextSuggestions.slice(0, 2).map((suggestion: string, index: number) => (
                <Text key={index} style={{ 
                  fontSize: 14, 
                  color: colors.neutral[700], 
                  marginBottom: 4,
                  paddingLeft: 8
                }}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
        
        <TouchableOpacity 
          style={{ 
            backgroundColor: colors.primary[500], 
            padding: 12, 
            borderRadius: 8,
            marginTop: 16
          }}
          onPress={onClose}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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

const MealPlanSummary = ({ plan, enhancedSummary }: any) => (
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
    
    {/* ✅ Basic stats */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
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

    {/* ✅ Enhanced stats if available */}
    {enhancedSummary && (
      <>
        <View style={{ 
          borderTopWidth: 1, 
          borderTopColor: colors.neutral[200], 
          paddingTop: 12,
          marginTop: 4
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                color: enhancedSummary.totalDiversityScore >= 80 ? colors.success[600] : 
                       enhancedSummary.totalDiversityScore >= 60 ? colors.warning[600] : colors.error[600]
              }}>
                {enhancedSummary.totalDiversityScore}%
              </Text>
              <Text style={{ color: colors.neutral[600], fontSize: 12 }}>Diversity</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                color: enhancedSummary.totalPersonalizationScore >= 80 ? colors.success[600] : 
                       enhancedSummary.totalPersonalizationScore >= 60 ? colors.warning[600] : colors.error[600]
              }}>
                {enhancedSummary.totalPersonalizationScore}%
              </Text>
              <Text style={{ color: colors.neutral[600], fontSize: 12 }}>Personal</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                color: enhancedSummary.pantryUtilization >= 70 ? colors.success[600] : 
                       enhancedSummary.pantryUtilization >= 50 ? colors.warning[600] : colors.error[600]
              }}>
                {enhancedSummary.pantryUtilization}%
              </Text>
              <Text style={{ color: colors.neutral[600], fontSize: 12 }}>Pantry Use</Text>
            </View>
          </View>
          
          {/* Generation methods indicator */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            <View style={{
              backgroundColor: colors.accent[50],
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Sparkles size={12} color={colors.accent[600]} />
              <Text style={{
                fontSize: 10,
                color: colors.accent[700],
                marginLeft: 4,
                fontWeight: '500'
              }}>
                {enhancedSummary.generationMethods.includes('personalized') ? 'AI Personalized' : 'AI Enhanced'}
              </Text>
            </View>
          </View>
        </View>
      </>
    )}
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
  
  // ✅ CRITICAL: Use the store hooks properly
  const isStoreLoaded = useMealPlanAutoLoad();
  const { 
    currentMealPlan, 
    setCurrentMealPlan,
    aiMeals,
    setAIMeal,
    loadingError 
  } = useMealPlanStore();
  
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
  
  // ✅ NEW: Enhanced meal plan state
  const [enhancedPlanSummary, setEnhancedPlanSummary] = useState<EnhancedMealPlanSummary | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  
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

  // ✅ CRITICAL: Use currentMealPlan from store when available
  useEffect(() => {
    if (currentMealPlan && isStoreLoaded) {
      setMealPlan(currentMealPlan);
      console.log('✅ Meal plan loaded from store');
    }
  }, [currentMealPlan, isStoreLoaded]);

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

        // ✅ Generate AI meal plan if not already loaded from store
        if (!currentMealPlan) {
          await generateInitialMealPlan(validPantryItems, userProfileData);
        }

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
        if (!currentMealPlan) {
          const fallbackPlan = generateFallbackPlan();
          await setCurrentMealPlan(fallbackPlan);
          setMealPlan(fallbackPlan);
        }
      }

      setLoadingStates(prev => ({ ...prev, initial: false }));
      setRefreshing(false);
    } catch (error) {
      console.error('Load data error:', error);
      setLoadingStates(prev => ({ ...prev, initial: false }));
      setRefreshing(false);
    }
  };

  // ✅ ENHANCED: Generate initial AI meal plan with diversity and personalization
  const generateInitialMealPlan = async (pantryItems: PantryItem[], userProfile: UserProfile | null) => {
    try {
      if (pantryItems.length < 3) {
        console.log('⚠️ Insufficient pantry items, using fallback...');
        const fallbackPlan = generateFallbackPlan(pantryItems);
        await setCurrentMealPlan(fallbackPlan);
        setMealPlan(fallbackPlan);
        return;
      }

      console.log('🌟 Generating enhanced AI meal plan with personalization and diversity...');
      
      // ✅ Use enhanced generation system
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const enhancedResult = await generateEnhancedMealPlan(
        user.id,
        pantryItems,
        userProfile
      );

      // Convert enhanced results to standard meal plan format
      const aiMeals = {
        breakfast: enhancedResult.breakfast?.meal || null,
        lunch: enhancedResult.lunch?.meal || null,
        dinner: enhancedResult.dinner?.meal || null,
        snacks: enhancedResult.snacks.map(s => s.meal).filter(Boolean) as Meal[]
      };

      const mealsForTotals = [aiMeals.breakfast, aiMeals.lunch, aiMeals.dinner].filter(Boolean) as Meal[];
      const totalCalories = mealsForTotals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = mealsForTotals.reduce((sum, meal) => sum + (meal.protein || 0), 0);

      const plan: MealPlan = {
        daily: {
          ...aiMeals,
          totalCalories,
          totalProtein,
          optimizationScore: enhancedResult.summary.totalPersonalizationScore,
          generatedAt: new Date().toISOString(),
          regenerationHistory: {}
        }
      };

      // ✅ Store enhanced summary for insights
      setEnhancedPlanSummary({
        ...enhancedResult.summary,
        insights: {
          diversityTips: enhancedResult.breakfast?.insights.diversityTips || [],
          personalizationAdaptations: [
            ...(enhancedResult.breakfast?.insights.adaptations || []),
            ...(enhancedResult.lunch?.insights.adaptations || []),
            ...(enhancedResult.dinner?.insights.adaptations || [])
          ],
          nextSuggestions: enhancedResult.breakfast?.insights.nextSuggestions || []
        }
      });

      // ✅ Save to store
      await setCurrentMealPlan(plan);
      setMealPlan(plan);
      
      console.log('✅ Enhanced AI meal plan generated successfully:', {
        diversityScore: enhancedResult.summary.totalDiversityScore,
        personalizationScore: enhancedResult.summary.totalPersonalizationScore,
        pantryUtilization: enhancedResult.summary.pantryUtilization,
        methods: enhancedResult.summary.generationMethods
      });
      
    } catch (error) {
      console.error('Failed to generate enhanced AI meal plan:', error);
      console.log('🔄 Generating fallback meal plan...');
      
      // ✅ Enhanced fallback with basic diversity
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const generator = createEnhancedGenerator(user.id);
          const fallbackResult = await generator.generateEnhancedMeal('lunch', pantryItems, userProfile, [], {
            allowFallback: true,
            maxAttempts: 1
          });
          
          const plan: MealPlan = {
            daily: {
              breakfast: null,
              lunch: fallbackResult.meal,
              dinner: null,
              snacks: [],
              totalCalories: fallbackResult.meal.calories,
              totalProtein: fallbackResult.meal.protein,
              optimizationScore: fallbackResult.personalizationScore,
              generatedAt: new Date().toISOString(),
              regenerationHistory: {}
            }
          };
          
          await setCurrentMealPlan(plan);
          setMealPlan(plan);
          return;
        }
      } catch (fallbackError) {
        console.error('Enhanced fallback also failed:', fallbackError);
      }
      
      // Final fallback
      const fallbackPlan = generateFallbackPlan(pantryItems);
      await setCurrentMealPlan(fallbackPlan);
      setMealPlan(fallbackPlan);
    }
  };

  // ✅ ENHANCED: Regenerate individual meal with diversity and personalization
  const regenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    if (!mealPlan || !userProfile) return;

    try {
      // Set loading state for this specific meal
      setLoadingStates(prev => ({ ...prev, [mealType]: true }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // ✅ Use enhanced generator for better variety and personalization
      const generator = createEnhancedGenerator(user.id);
      const existingMeals = Object.values(mealPlan.daily)
        .flat()
        .filter(meal => meal && typeof meal === 'object') as Meal[];

      const enhancedResult = await generator.generateEnhancedMeal(
        mealType === 'snacks' ? 'snack' : mealType,
        pantryItems,
        userProfile,
        existingMeals,
        {
          prioritizeDiversity: true, // Focus on diversity for regeneration
          prioritizePersonalization: true,
          diversityThreshold: 60, // Lower threshold for regeneration
          maxAttempts: 2 // Faster regeneration
        }
      );

      const newMeal = enhancedResult.meal;

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
        updatedDaily.optimizationScore = enhancedResult.personalizationScore;

        const updatedPlan = {
          ...prevPlan,
          daily: updatedDaily
        };

        // ✅ Save to store using hook
        setCurrentMealPlan(updatedPlan);

        return updatedPlan;
      });

      // Update regeneration attempts
      setRegenerationAttempts(prev => ({
        ...prev,
        [mealType]: prev[mealType] + 1
      }));

      // ✅ Enhanced success message with insights
      const diversityInfo = enhancedResult.diversityScore > 80 
        ? '🌟 Great variety!' 
        : enhancedResult.diversityScore > 60 
          ? '✨ Good diversity!' 
          : '🔄 More variety next time!';

      const generationInfo = enhancedResult.generationMethod === 'personalized'
        ? '🎯 Personalized for you!'
        : '🌍 Culturally optimized!';

      Alert.alert(
        'Meal Updated! ✨',
        `Your ${mealType} has been regenerated.\n${diversityInfo}\n${generationInfo}`,
        [
          { 
            text: 'See Insights', 
            onPress: () => setShowInsights(true) 
          },
          { 
            text: 'Great!' 
          }
        ]
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
        <MealPlanSummary plan={plan} enhancedSummary={enhancedPlanSummary} />

        {/* ✅ Action buttons row */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity 
            style={[styles.regenerateAllButton, { flex: 1 }]}
            onPress={regenerateAllMeals}
            disabled={loadingStates.initial || Object.values(loadingStates).some(Boolean)}
          >
            <Sparkles size={18} color={colors.accent[600]} />
            <Text style={[styles.regenerateAllText, { fontSize: 14 }]}>Regenerate All</Text>
            <RefreshCw size={14} color={colors.accent[600]} />
          </TouchableOpacity>
          
          {/* ✅ Show insights button */}
          {enhancedPlanSummary?.insights && (
            <TouchableOpacity 
              style={[styles.insightsButton]}
              onPress={() => setShowInsights(true)}
            >
              <Text style={styles.insightsButtonText}>💡 Insights</Text>
            </TouchableOpacity>
          )}
        </View>

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
        {loadingError && (
          <Text style={styles.errorText}>Storage: {loadingError}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ Enhanced insights modal */}
      <EnhancedInsightsModal
        visible={showInsights}
        insights={enhancedPlanSummary?.insights}
        onClose={() => setShowInsights(false)}
      />
      
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

        {/* Meal Plan Content - ACTIVATED */}
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
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[600],
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
  insightsButton: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  insightsButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary[700],
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
  comingSoonTitle2: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  featuresList: {
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  featureItem: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
