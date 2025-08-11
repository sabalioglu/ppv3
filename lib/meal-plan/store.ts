// lib/meal-plan/store.ts - Complete storage solution with AI meal management
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import React from 'react';
import { Meal, MealPlan } from './types';

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
}

const MEAL_PLAN_STORAGE_KEY = '@ai_food_pantry:meal_plan';
const AI_MEALS_STORAGE_KEY = '@ai_food_pantry:ai_meals';

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  currentMealPlan: null,
  aiMeals: {},
  isLoaded: false,
  loadingError: null,
  
  setCurrentMealPlan: async (mealPlan: MealPlan) => {
    console.log('💾 Saving meal plan to storage...');
    set({ currentMealPlan: mealPlan, loadingError: null });
    
    try {
      // Save main meal plan
      await AsyncStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(mealPlan));
      console.log('✅ Main meal plan saved');
      
      // ✅ Extract and save ALL AI meals with safety checks
      const allMeals: { [key: string]: Meal } = {};
      const daily = mealPlan.daily;
      
      // Save individual AI meals with null checks
      if (daily.breakfast?.source === 'ai_generated') {
        allMeals[daily.breakfast.id] = daily.breakfast;
        console.log('✅ Breakfast AI meal extracted:', daily.breakfast.id);
      }
      if (daily.lunch?.source === 'ai_generated') {
        allMeals[daily.lunch.id] = daily.lunch;
        console.log('✅ Lunch AI meal extracted:', daily.lunch.id);
      }
      if (daily.dinner?.source === 'ai_generated') {
        allMeals[daily.dinner.id] = daily.dinner;
        console.log('✅ Dinner AI meal extracted:', daily.dinner.id);
      }
      
      // Save snacks with array safety
      if (Array.isArray(daily.snacks)) {
        daily.snacks.forEach(snack => {
          if (snack.source === 'ai_generated') {
            allMeals[snack.id] = snack;
            console.log('✅ Snack AI meal extracted:', snack.id);
          }
        });
      }
      
      // Merge with existing AI meals
      const currentAIMeals = get().aiMeals || {};
      const updatedAIMeals = { ...currentAIMeals, ...allMeals };
      set({ aiMeals: updatedAIMeals });
      
      // Save to storage
      await AsyncStorage.setItem(AI_MEALS_STORAGE_KEY, JSON.stringify(updatedAIMeals));
      console.log(`✅ ${Object.keys(allMeals).length} AI meals saved to storage`);
      
    } catch (error) {
      console.error('❌ Error saving meal plan:', error);
      set({ loadingError: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  },
  
  setAIMeal: async (mealId: string, meal: Meal) => {
    if (!mealId || !meal) {
      console.error('❌ Invalid meal data for storage');
      return;
    }
    
    console.log(`💾 Saving individual AI meal: ${mealId}`);
    
    const currentAIMeals = get().aiMeals || {};
    const updatedAIMeals = { ...currentAIMeals, [mealId]: meal };
    set({ aiMeals: updatedAIMeals, loadingError: null });
    
    try {
      await AsyncStorage.setItem(AI_MEALS_STORAGE_KEY, JSON.stringify(updatedAIMeals));
      console.log(`✅ AI meal ${mealId} saved successfully`);
    } catch (error) {
      console.error(`❌ Error saving AI meal ${mealId}:`, error);
      set({ loadingError: `Failed to save meal ${mealId}` });
    }
  },
  
  getAIMeal: (mealId: string) => {
    if (!mealId) {
      console.error('❌ No meal ID provided to getAIMeal');
      return null;
    }
    
    const aiMeals = get().aiMeals || {};
    const meal = aiMeals[mealId];
    
    if (meal) {
      console.log(`✅ AI meal ${mealId} found in storage`);
      return meal;
    }
    
    console.log(`❌ AI meal ${mealId} not found in storage`);
    console.log('🔍 Available AI meals:', Object.keys(aiMeals));
    return null;
  },
  
  clearMealPlan: async () => {
    console.log('🗑️ Clearing all meal plan data');
    set({ currentMealPlan: null, aiMeals: {}, loadingError: null });
    
    try {
      await AsyncStorage.multiRemove([MEAL_PLAN_STORAGE_KEY, AI_MEALS_STORAGE_KEY]);
      console.log('✅ All meal data cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing meal plan:', error);
      set({ loadingError: 'Failed to clear storage' });
    }
  },
  
  loadMealPlan: async () => {
    console.log('📖 Loading meal plan from storage...');
    
    try {
      const [storedMealPlan, storedAIMeals] = await AsyncStorage.multiGet([
        MEAL_PLAN_STORAGE_KEY,
        AI_MEALS_STORAGE_KEY
      ]);
      
      let mealPlan = null;
      let aiMeals = {};
      
      // Load meal plan with error handling
      if (storedMealPlan[1]) {
        try {
          mealPlan = JSON.parse(storedMealPlan[1]);
          console.log('✅ Meal plan loaded from storage');
        } catch (parseError) {
          console.error('❌ Error parsing stored meal plan:', parseError);
          mealPlan = null;
        }
      }
      
      // Load AI meals with error handling
      if (storedAIMeals[1]) {
        try {
          aiMeals = JSON.parse(storedAIMeals[1]);
          console.log(`✅ ${Object.keys(aiMeals).length} AI meals loaded from storage`);
        } catch (parseError) {
          console.error('❌ Error parsing stored AI meals:', parseError);
          aiMeals = {};
        }
      }
      
      set({ 
        currentMealPlan: mealPlan, 
        aiMeals: aiMeals,
        isLoaded: true,
        loadingError: null
      });
      
      if (!mealPlan) {
        console.log('ℹ️ No meal plan found in storage');
      }
      
    } catch (error) {
      console.error('❌ Error loading meal plan:', error);
      set({ 
        isLoaded: true, 
        loadingError: `Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentMealPlan: null,
        aiMeals: {}
      });
    }
  },
}));

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
  
  if (!mealId || !isLoaded) {
    return null;
  }
  
  return getAIMeal(mealId);
};