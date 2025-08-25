// Gelişmiş AI Meal Plan Servisi - Pantry ve Kullanıcı Tercihlerine Göre
import { SmartMealPlanner, createSmartMealPlanner } from './smart-meal-planner';

// Export the new system
export { SmartMealPlanner, createSmartMealPlanner };

// Export types for backward compatibility
export type { Meal, MealPlan } from './smart-meal-planner';

// Export pantry analyzer
export { PantryAnalyzer } from './pantry-analyzer';
export type { PantryItem, UserPreferences, MealPlanConstraints } from './pantry-analyzer';