// 🚧 STUBBED: Cultural rules moved to Supabase Edge Function
// This file provides minimal stub functions to prevent import errors

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CulturalCuisine = 'turkish' | 'japanese' | 'american' | 'mediterranean' | 'indian' | 'chinese' | 'middle_eastern' | 'european';

export interface CulturalProfile {
  cuisine: CulturalCuisine;
  region: 'coastal' | 'inland' | 'urban' | 'rural';
  religiousRestrictions?: string[];
  personalPreferences?: string[];
}

export interface CulturalValidation {
  isAppropriate: boolean;
  violations: string[];
  score: number;
  suggestions: string[];
  warnings: string[];
}

// Stub functions - prevent import errors while maintaining app functionality
export const detectCulturalCuisine = (meal: any, prefs: string[] = []): CulturalCuisine => {
  console.log('🚧 Cultural cuisine detection stubbed - edge function will handle this');
  return 'american'; // Safe fallback
};

export const createCulturalProfile = (user: any): CulturalProfile => {
  return {
    cuisine: user?.cuisine || 'american',
    region: user?.region || 'urban',
    religiousRestrictions: user?.religiousRestrictions || [],
    personalPreferences: user?.personalPreferences || []
  };
};

export const evaluateCulturalAppropriateness = (
  meal: any, 
  mealType: MealType, 
  profile: CulturalProfile
): CulturalValidation => {
  console.log('🚧 Cultural validation stubbed - edge function will provide analysis');
  return {
    isAppropriate: true,
    violations: [],
    score: 80, // Neutral score
    suggestions: ['Cultural analysis will be provided by edge function'],
    warnings: []
  };
};

export const applyCulturalConstraints = (generationParams: any) => {
  console.log('🚧 Cultural constraints stubbed - edge function will apply constraints');
  return generationParams; // Pass through unchanged
};

// Legacy compatibility exports
export const identifyPrimaryCuisine = detectCulturalCuisine;
export const includesSeafood = (ingredients: string[]) => false;
export const breakfastSeafoodMode = () => 'avoid' as const;

console.log('🚧 Cultural rules stubbed - cultural intelligence moved to Supabase Edge Functions');
