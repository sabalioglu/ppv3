// 🚧 STUBBED: Cultural database moved to Supabase Edge Function
// This file provides minimal fallback data to prevent import errors

export type CulturalCuisine = 'turkish' | 'japanese' | 'american' | 'mediterranean' | 'indian' | 'chinese' | 'middle_eastern' | 'european';

// Minimal fallback data - prevents import errors
export const CULTURAL_KNOWLEDGE_BASE = {
  breakfast: {},
  seafood: { 
    regional: {}, 
    inland: {} 
  },
  spices: {},
  cookingMethods: {},
  religiousConstraints: {},
  mealTiming: {},
  aiInsights: {}
};

// Stub functions for backward compatibility
export const getCulturalData = (cuisine: string) => {
  console.log('🚧 Cultural data request stubbed - edge function will handle this');
  return null;
};

export const getCuisineInfo = (cuisine: CulturalCuisine) => {
  console.log('🚧 Cuisine info stubbed - using edge function fallback');
  return {
    name: cuisine,
    spices: [],
    cookingMethods: [],
    restrictions: []
  };
};

console.log('🚧 Cultural database stubbed - cultural intelligence moved to Supabase Edge Functions');
