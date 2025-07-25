// lib/meal-plan/store.ts - Meal Plan State Management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MealPlanState {
  currentMealPlan: any | null;
  setCurrentMealPlan: (mealPlan: any) => void;
  clearMealPlan: () => void;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set) => ({
      currentMealPlan: null,
      setCurrentMealPlan: (mealPlan) => set({ currentMealPlan: mealPlan }),
      clearMealPlan: () => set({ currentMealPlan: null }),
    }),
    {
      name: 'meal-plan-storage',
    }
  )
);
