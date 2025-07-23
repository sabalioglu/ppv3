// lib/meal-plan/error-handler.ts
import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class MealPlanError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'MealPlanError';
  }
}

// Error codes
export const ERROR_CODES = {
  // Data loading errors
  LOAD_PROFILE_FAILED: 'LOAD_PROFILE_FAILED',
  LOAD_PANTRY_FAILED: 'LOAD_PANTRY_FAILED',
  LOAD_NUTRITION_FAILED: 'LOAD_NUTRITION_FAILED',
  
  // Meal plan generation errors
  GENERATE_MEAL_PLAN_FAILED: 'GENERATE_MEAL_PLAN_FAILED',
  NO_MATCHING_MEALS: 'NO_MATCHING_MEALS',
  INSUFFICIENT_PANTRY_ITEMS: 'INSUFFICIENT_PANTRY_ITEMS',
  
  // Shopping list errors
  ADD_TO_SHOPPING_FAILED: 'ADD_TO_SHOPPING_FAILED',
  
  // Nutrition log errors
  ADD_TO_NUTRITION_FAILED: 'ADD_TO_NUTRITION_FAILED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  INVALID_USER_PROFILE: 'INVALID_USER_PROFILE',
  INVALID_MEAL_DATA: 'INVALID_MEAL_DATA',
} as const;

// Error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.LOAD_PROFILE_FAILED]: 'Failed to load your profile. Please try again.',
  [ERROR_CODES.LOAD_PANTRY_FAILED]: 'Failed to load pantry items. Please check your connection.',
  [ERROR_CODES.LOAD_NUTRITION_FAILED]: 'Failed to load nutrition data.',
  [ERROR_CODES.GENERATE_MEAL_PLAN_FAILED]: 'Failed to generate meal plan. Using default suggestions.',
  [ERROR_CODES.NO_MATCHING_MEALS]: 'No meals found matching your pantry items.',
  [ERROR_CODES.INSUFFICIENT_PANTRY_ITEMS]: 'Your pantry needs more items to generate a meal plan.',
  [ERROR_CODES.ADD_TO_SHOPPING_FAILED]: 'Failed to add items to shopping list.',
  [ERROR_CODES.ADD_TO_NUTRITION_FAILED]: 'Failed to log meal to nutrition tracker.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please check your internet.',
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue.',
  [ERROR_CODES.INVALID_USER_PROFILE]: 'Invalid user profile data.',
  [ERROR_CODES.INVALID_MEAL_DATA]: 'Invalid meal data received.',
};

// Error handler function
export const handleError = (error: any, context?: string): AppError => {
  console.error(`Error in ${context || 'MealPlan'}:`, error);
  
  // If it's already our custom error
  if (error instanceof MealPlanError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date(),
    };
  }
  
  // Supabase errors
  if (error?.code === 'PGRST116') {
    return {
      code: ERROR_CODES.LOAD_PROFILE_FAILED,
      message: 'Profile not found. Creating default profile.',
      details: error,
      timestamp: new Date(),
    };
  }
  
  if (error?.code === '401' || error?.message?.includes('JWT')) {
    return {
      code: ERROR_CODES.UNAUTHORIZED,
      message: ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
      details: error,
      timestamp: new Date(),
    };
  }
  
  // Network errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      details: error,
      timestamp: new Date(),
    };
  }
  
  // Default error
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'An unexpected error occurred.',
    details: error,
    timestamp: new Date(),
  };
};

// Show error alert
export const showErrorAlert = (error: AppError, onRetry?: () => void) => {
  const buttons: any[] = [{ text: 'OK' }];
  
  if (onRetry) {
    buttons.unshift({ text: 'Retry', onPress: onRetry });
  }
  
  Alert.alert('Error', error.message, buttons);
};

// Log error for analytics (future implementation)
export const logError = async (error: AppError, userId?: string) => {
  // TODO: Implement error logging to analytics service
  console.log('Error logged:', {
    ...error,
    userId,
    platform: Platform.OS,
    timestamp: error.timestamp.toISOString(),
  });
};

// Validation helpers
export const validateMealData = (meal: any): boolean => {
  if (!meal || typeof meal !== 'object') return false;
  if (!meal.id || !meal.name || !meal.category) return false;
  if (!Array.isArray(meal.ingredients)) return false;
  if (typeof meal.calories !== 'number' || meal.calories < 0) return false;
  if (typeof meal.protein !== 'number' || meal.protein < 0) return false;
  return true;
};

export const validatePantryItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  if (!item.name || !item.category) return false;
  if (typeof item.quantity !== 'number' || item.quantity < 0) return false;
  return true;
};

export const validateUserProfile = (profile: any): boolean => {
  if (!profile || typeof profile !== 'object') return false;
  if (!profile.id) return false;
  if (!Array.isArray(profile.dietary_restrictions)) return false;
  if (!Array.isArray(profile.dietary_preferences)) return false;
  return true;
};
