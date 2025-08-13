// lib/meal-plan/store.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Meal, MealPlan, UserProfile } from './api-clients/types';

interface MealPlanState {
  currentMealPlan: MealPlan | null;
  aiMeals: { [key: string]: Meal };
  setCurrentMealPlan: (mealPlan: MealPlan) => Promise<void>;
  setAIMeal: (mealId: string, meal: Meal) => Promise<void>;
  getAIMeal: (mealId: string) => Meal | null;
  clearMealPlan: () => Promise<void>;
  loadMealPlan: () => Promise<void>;
  isLoaded: boolean;
  loadingError: string | null;
  // ✅ Yeni eklenenler
  updateMealInPlan: (mealType: string, meal: Meal) => Promise<void>;
  getMealsByCategory: (category: string) => Meal[];
  hasUnsavedChanges: boolean;
}

const MEAL_PLAN_STORAGE_KEY = '@ai_food_pantry:meal_plan';
const AI_MEALS_STORAGE_KEY = '@ai_food_pantry:ai_meals';

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  currentMealPlan: null,
  aiMeals: {},
  isLoaded: false,
  loadingError: null,
  hasUnsavedChanges: false,
  
  setCurrentMealPlan: async (mealPlan: MealPlan) => {
    console.log('💾 Saving meal plan to storage...');
    
    try {
      // ✅ Optimistic update
      set({ 
        currentMealPlan: mealPlan,
        hasUnsavedChanges: false,
        loadingError: null 
      });
      
      // ✅ Batch save operations
      const saveOperations = [];
      
      // Save main meal plan
      saveOperations.push(
        AsyncStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(mealPlan))
      );
      
      // Extract and save AI meals
      const allMeals: { [key: string]: Meal } = {};
      const daily = mealPlan.daily;
      
      // ✅ Helper function to extract AI meals
      const extractAIMeal = (meal: Meal | null, mealType: string) => {
        if (meal?.source === 'ai_generated') {
          allMeals[meal.id] = meal;
          console.log(`✅ ${mealType} AI meal extracted:`, meal.id);
        }
      };
      
      extractAIMeal(daily.breakfast, 'Breakfast');
      extractAIMeal(daily.lunch, 'Lunch');
      extractAIMeal(daily.dinner, 'Dinner');
      
      // Handle snacks array safely
      if (Array.isArray(daily.snacks)) {
        daily.snacks.forEach((snack, index) => {
          extractAIMeal(snack, `Snack ${index + 1}`);
        });
      }
      
      // Merge with existing AI meals
      const currentAIMeals = get().aiMeals;
      const updatedAIMeals = { ...currentAIMeals, ...allMeals };
      
      // Save AI meals
      saveOperations.push(
        AsyncStorage.setItem(AI_MEALS_STORAGE_KEY, JSON.stringify(updatedAIMeals))
      );
      
      // ✅ Execute all saves in parallel
      await Promise.all(saveOperations);
      
      // Update state after successful save
      set({ aiMeals: updatedAIMeals });
      
      console.log(`✅ Meal plan and ${Object.keys(allMeals).length} AI meals saved`);
      
    } catch (error: any) {
      console.error('❌ Error saving meal plan:', error);
      set({ 
        loadingError: `Save failed: ${error.message || 'Unknown error'}`,
        hasUnsavedChanges: true 
      });
      throw error; // Re-throw for caller to handle
    }
  },
  
  setAIMeal: async (mealId: string, meal: Meal) => {
    console.log(`💾 Saving individual AI meal: ${mealId}`);
    
    if (!mealId || !meal) {
      console.error('❌ Invalid meal data provided');
      return;
    }
    
    try {
      const currentAIMeals = get().aiMeals;
      const updatedAIMeals = { ...currentAIMeals, [mealId]: meal };
      
      // ✅ Optimistic update
      set({ 
        aiMeals: updatedAIMeals,
        hasUnsavedChanges: true 
      });
      
      // Persist to storage
      await AsyncStorage.setItem(AI_MEALS_STORAGE_KEY, JSON.stringify(updatedAIMeals));
      
      set({ hasUnsavedChanges: false });
      console.log(`✅ AI meal ${mealId} saved successfully`);
      
    } catch (error: any) {
      console.error(`❌ Error saving AI meal ${mealId}:`, error);
      set({ 
        loadingError: `Failed to save meal ${mealId}: ${error.message || 'Unknown error'}` 
      });
      throw error;
    }
  },
  
  getAIMeal: (mealId: string) => {
    if (!mealId) {
      console.warn('⚠️ No meal ID provided');
      return null;
    }
    
    const aiMeals = get().aiMeals;
    const meal = aiMeals[mealId];
    
    if (meal) {
      console.log(`✅ AI meal ${mealId} found in storage`);
      return meal;
    }
    
    console.log(`❌ AI meal ${mealId} not found in storage`);
    console.log('🔍 Available AI meals:', Object.keys(aiMeals));
    return null;
  },
  
  // ✅ New: Update a specific meal in the plan
  updateMealInPlan: async (mealType: string, meal: Meal) => {
    const currentPlan = get().currentMealPlan;
    if (!currentPlan) {
      console.error('❌ No meal plan to update');
      return;
    }
    
    const updatedPlan = { ...currentPlan };
    
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        updatedPlan.daily.breakfast = meal;
        break;
      case 'lunch':
        updatedPlan.daily.lunch = meal;
        break;
      case 'dinner':
        updatedPlan.daily.dinner = meal;
        break;
      case 'snack':
        if (!Array.isArray(updatedPlan.daily.snacks)) {
          updatedPlan.daily.snacks = [];
        }
        updatedPlan.daily.snacks = [meal];
        break;
      default:
        console.error(`❌ Unknown meal type: ${mealType}`);
        return;
    }
    
    await get().setCurrentMealPlan(updatedPlan);
  },
  
  // ✅ New: Get meals by category
  getMealsByCategory: (category: string) => {
    const aiMeals = get().aiMeals;
    return Object.values(aiMeals).filter(meal => 
      meal.category?.toLowerCase() === category.toLowerCase()
    );
  },
  
  clearMealPlan: async () => {
    console.log('🗑️ Clearing all meal plan data');
    
    try {
      // Clear state first
      set({ 
        currentMealPlan: null, 
        aiMeals: {}, 
        loadingError: null,
        hasUnsavedChanges: false 
      });
      
      // Clear storage
      await AsyncStorage.multiRemove([MEAL_PLAN_STORAGE_KEY, AI_MEALS_STORAGE_KEY]);
      console.log('✅ All meal data cleared from storage');
      
    } catch (error: any) {
      console.error('❌ Error clearing meal plan:', error);
      set({ loadingError: `Clear failed: ${error.message || 'Unknown error'}` });
    }
  },
  
  loadMealPlan: async () => {
    console.log('📖 Loading meal plan from storage...');
    
    if (get().isLoaded) {
      console.log('ℹ️ Meal plan already loaded');
      return;
    }
    
    try {
      const [storedMealPlan, storedAIMeals] = await AsyncStorage.multiGet([
        MEAL_PLAN_STORAGE_KEY,
        AI_MEALS_STORAGE_KEY
      ]);
      
      let mealPlan = null;
      let aiMeals = {};
      
      // ✅ Safe parsing with error handling
      if (storedMealPlan[1]) {
        try {
          mealPlan = JSON.parse(storedMealPlan[1]);
          console.log('✅ Meal plan loaded from storage');
        } catch (parseError) {
          console.error('❌ Error parsing stored meal plan:', parseError);
          // Clear corrupted data
          await AsyncStorage.removeItem(MEAL_PLAN_STORAGE_KEY);
        }
      }
      
      if (storedAIMeals[1]) {
        try {
          aiMeals = JSON.parse(storedAIMeals[1]);
          console.log(`✅ ${Object.keys(aiMeals).length} AI meals loaded from storage`);
        } catch (parseError) {
          console.error('❌ Error parsing stored AI meals:', parseError);
          // Clear corrupted data
          await AsyncStorage.removeItem(AI_MEALS_STORAGE_KEY);
        }
      }
      
      set({ 
        currentMealPlan: mealPlan, 
        aiMeals: aiMeals,
        isLoaded: true,
        loadingError: null,
        hasUnsavedChanges: false
      });
      
      if (!mealPlan) {
        console.log('ℹ️ No meal plan found in storage');
      }
      
    } catch (error: any) {
      console.error('❌ Error loading meal plan:', error);
      set({ 
        isLoaded: true, 
        loadingError: `Load failed: ${error.message || 'Unknown error'}`,
        currentMealPlan: null,
        aiMeals: {}
      });
    }
  },
}));

// ✅ Custom Hooks

export const useMealPlanAutoLoad = () => {
  const { loadMealPlan, isLoaded } = useMealPlanStore();
  
  React.useEffect(() => {
    if (!isLoaded) {
      console.log('🔄 Auto-loading meal plan...');
      loadMealPlan();
    }
  }, [isLoaded, loadMealPlan]);
  
  return isLoaded;
};

export const useAIMeal = (mealId: string | null) => {
  const { getAIMeal, isLoaded } = useMealPlanStore();
  
  const meal = React.useMemo(() => {
    if (!mealId || !isLoaded) {
      return null;
    }
    return getAIMeal(mealId);
  }, [mealId, isLoaded, getAIMeal]);
  
  return meal;
};

// ✅ New: Hook for unsaved changes warning
export const useUnsavedChangesWarning = () => {
  const hasUnsavedChanges = useMealPlanStore(state => state.hasUnsavedChanges);
  
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasUnsavedChanges]);
  
  return hasUnsavedChanges;
};

// ✅ New: Hook for meal plan statistics
export const useMealPlanStats = () => {
  const currentMealPlan = useMealPlanStore(state => state.currentMealPlan);
  
  return React.useMemo(() => {
    if (!currentMealPlan) {
      return {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0,
        aiMealCount: 0
      };
    }
    
    const { daily } = currentMealPlan;
    const meals = [daily.breakfast, daily.lunch, daily.dinner, ...(daily.snacks || [])].filter(Boolean);
    
    return {
      totalCalories: meals.reduce((sum, meal) => sum + (meal?.calories || 0), 0),
      totalProtein: meals.reduce((sum, meal) => sum + (meal?.protein || 0), 0),
      totalCarbs: meals.reduce((sum, meal) => sum + (meal?.carbs || 0), 0),
      totalFat: meals.reduce((sum, meal) => sum + (meal?.fat || 0), 0),
      mealCount: meals.length,
      aiMealCount: meals.filter(meal => meal?.source === 'ai_generated').length
    };
  }, [currentMealPlan]);
};
