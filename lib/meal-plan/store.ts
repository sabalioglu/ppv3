// lib/meal-plan/store.ts - Zustand + Manual AsyncStorage

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MealPlanState {
  currentMealPlan: any | null;
  setCurrentMealPlan: (mealPlan: any) => void;
  clearMealPlan: () => void;
  loadMealPlan: () => Promise<void>;
  isLoaded: boolean;
}

const MEAL_PLAN_STORAGE_KEY = '@ai_food_pantry:meal_plan';

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  currentMealPlan: null,
  isLoaded: false,
  
  setCurrentMealPlan: async (mealPlan) => {
    set({ currentMealPlan: mealPlan });
    
    // Manual persist to AsyncStorage
    try {
      await AsyncStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(mealPlan));
      console.log('✅ Meal plan saved to storage');
    } catch (error) {
      console.error('❌ Error saving meal plan:', error);
    }
  },
  
  clearMealPlan: async () => {
    set({ currentMealPlan: null });
    
    try {
      await AsyncStorage.removeItem(MEAL_PLAN_STORAGE_KEY);
      console.log('✅ Meal plan cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing meal plan:', error);
    }
  },
  
  loadMealPlan: async () => {
    try {
      const storedMealPlan = await AsyncStorage.getItem(MEAL_PLAN_STORAGE_KEY);
      
      if (storedMealPlan) {
        const mealPlan = JSON.parse(storedMealPlan);
        set({ currentMealPlan: mealPlan, isLoaded: true });
        console.log('✅ Meal plan loaded from storage');
      } else {
        set({ isLoaded: true });
        console.log('ℹ️ No meal plan found in storage');
      }
    } catch (error) {
      console.error('❌ Error loading meal plan:', error);
      set({ isLoaded: true }); // Mark as loaded even on error
    }
  },
}));

// Auto-load helper hook
export const useMealPlanAutoLoad = () => {
  const { loadMealPlan, isLoaded } = useMealPlanStore();
  
  React.useEffect(() => {
    if (!isLoaded) {
      loadMealPlan();
    }
  }, [isLoaded, loadMealPlan]);
  
  return isLoaded;
};
