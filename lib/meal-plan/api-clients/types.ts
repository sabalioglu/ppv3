// lib/meal-plan/api-clients/types.ts

import { PantryItem, Meal } from '../types';

// ============================================
// EXISTING SPOONACULAR/RECIPE TYPES
// ============================================

export interface ExtendedIngredient {
  id: number;
  aisle: string;
  image: string;
  consistency: string;
  name: string;
  original: string;
  originalName: string;
  amount: number;
  unit: string;
  meta: string[];
  measures: {
    us: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
    metric: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
  };
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  license: string;
  sourceName: string;
  sourceUrl: string;
  spoonacularScore: number;
  healthScore: number;
  pricePerServing: number;
  analyzedInstructions: any[];
  cheap: boolean;
  creditsText: string;
  cuisines: string[];
  dairyFree: boolean;
  diets: string[];
  gaps: string;
  glutenFree: boolean;
  instructions: string;
  ketogenic: boolean;
  lowFodmap: boolean;
  occasions: string[];
  sustainable: boolean;
  vegan: boolean;
  vegetarian: boolean;
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  weightWatcherSmartPoints: number;
  dishTypes: string[];
  extendedIngredients: ExtendedIngredient[];
  summary: string;
  winePairing: any;
  originalId: string | null;
  apiSource: 'spoonacular' | 'tasty' | 'themealdb' | 'ai';
  aiGenerated?: boolean;
}

export interface RecipeSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  type?: string;
  maxReadyTime?: number;
  limit?: number;
  offset?: number;
}

export interface RecipeSearchResult {
  results: Recipe[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface RecipeApiClient {
  searchRecipes(params: RecipeSearchParams): Promise<RecipeSearchResult>;
  getRecipeById(id: string): Promise<Recipe>;
  getRandomRecipes(params: { tags?: string; number?: number }): Promise<Recipe[]>;
}

// ============================================
// NEW AI GENERATION & QUALITY CONTROL TYPES
// ============================================

// ✅ Policy Interface for AI Generation
export interface MealPolicy {
  name: string;
  dietaryRestrictions: string[];
  allergens: string[];
  targetCalories: number;
  preferredModel?: string;
  minPantryUsage: number;
  cuisines: string[];
  pantryItems?: PantryItem[];
  culturalConstraints?: string[];     // Cultural rules (e.g., no seafood for breakfast)
  pantryCulture?: string;              // Detected culture from pantry
  behaviorHints?: UserBehaviorHints;   // Learned user preferences
  seasonalPreferences?: SeasonalPreferences;
  mealTypeRules?: MealTypeRules;
}

// ✅ User Behavior Hints for AI
export interface UserBehaviorHints {
  preferredIngredients: string[];
  avoidedIngredients: string[];
  preferredComplexity: 'simple' | 'moderate' | 'complex';
  preferredCookingTime: 'quick' | 'moderate' | 'elaborate';
  flavorProfiles: FlavorProfile[];
  texturePreferences: TexturePreference[];
}

// ✅ Flavor and Texture Preferences
export interface FlavorProfile {
  type: 'sweet' | 'savory' | 'spicy' | 'umami' | 'sour' | 'bitter';
  intensity: 1 | 2 | 3 | 4 | 5;
}

export interface TexturePreference {
  type: 'crispy' | 'creamy' | 'chewy' | 'crunchy' | 'smooth' | 'fluffy';
  preference: 'love' | 'like' | 'neutral' | 'dislike' | 'hate';
}

// ✅ Seasonal Preferences
export interface SeasonalPreferences {
  currentSeason: 'spring' | 'summer' | 'fall' | 'winter';
  preferredIngredients: Record<string, string[]>;
  avoidedIngredients: Record<string, string[]>;
}

// ✅ Meal Type Specific Rules
export interface MealTypeRules {
  breakfast?: {
    allowSeafood: boolean;
    allowHeavyMeats: boolean;
    preferSweetOptions: boolean;
    preferredCategories: string[];
  };
  lunch?: {
    preferLightMeals: boolean;
    allowLeftovers: boolean;
    preferredCategories: string[];
  };
  dinner?: {
    requireCompleteMeal: boolean;
    allowExperimental: boolean;
    preferredCategories: string[];
  };
  snack?: {
    maxCalories: number;
    preferHealthy: boolean;
    preferredCategories: string[];
  };
}

// ✅ QC Validation Result
export interface QCValidationResult {
  isValid: boolean;
  reason?: string;
  score: number;
  issues?: string[];
  suggestions?: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  validationDetails?: {
    dietCompliance: boolean;
    allergenSafety: boolean;
    calorieCompliance: boolean;
    varietyCheck: boolean;
    culturalAppropriateness: boolean;
    pantryUsage: number;
  };
}

// ✅ Enhanced Meal with Quality Data
export interface EnhancedMeal extends Meal {
  qualityScore?: number;
  qualityReason?: string;
  qualityWarning?: boolean;
  generationAttempts?: number;
  qualityIssues?: string[];
  confidenceLevel?: 'high' | 'medium' | 'low';
  userRating?: number;
  regenerationCount?: number;
  lastModified?: string;
  nutritionConfidence?: number;
  sustainabilityScore?: number;
}

// ✅ User Behavior Profile for Learning
export interface UserBehaviorProfile {
  userId: string;
  preferredIngredients: string[];
  avoidedIngredients: string[];
  cuisineRatings: Record<string, number>;
  mealComplexityPreference: 'simple' | 'moderate' | 'complex';
  cookingTimePreference: 'quick' | 'moderate' | 'elaborate';
  regenerationPatterns: RegenerationPattern;
  mealRatings: MealRatingHistory[];
  dietaryJourney: DietaryJourney;
}

// ✅ Regeneration Pattern Analysis
export interface RegenerationPattern {
  mostRegeneratedMealTypes: string[];
  commonRejectionReasons: string[];
  averageRegenerationsPerMeal: number;
  timeOfDayPreferences: Record<string, string[]>;
}

// ✅ Meal Rating History
export interface MealRatingHistory {
  mealId: string;
  mealName: string;
  rating: number;
  timestamp: string;
  feedback?: string;
  tags: string[];
}

// ✅ Dietary Journey Tracking
export interface DietaryJourney {
  startDate: string;
  currentPhase: 'exploration' | 'refinement' | 'established';
  goalsAchieved: string[];
  currentGoals: string[];
  preferenceEvolution: Array<{
    date: string;
    change: string;
    reason?: string;
  }>;
}

// ✅ Cultural Learning Model
export interface CulturalLearningModel {
  detectedCultures: string[];
  primaryCulture: string;
  breakfastPreferences: CulturalMealPreferences;
  lunchPreferences: CulturalMealPreferences;
  dinnerPreferences: CulturalMealPreferences;
  seasonalAdaptations: Record<string, string[]>;
  cookingMethodPreferences: Record<string, number>;
  spiceToleranceLevel: 1 | 2 | 3 | 4 | 5;
  fusionAcceptance: boolean;
}

// ✅ Cultural Meal Preferences
export interface CulturalMealPreferences {
  allowedIngredients: string[];
  forbiddenIngredients: string[];
  preferredCombinations: string[][];
  avoidedCombinations: string[][];
  typicalDishes: string[];
  cookingMethods: string[];
}

// ✅ Meal Loading States
export interface MealLoadingStates {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snacks: boolean;
  initial: boolean;
  regenerating: Record<string, boolean>;
  saving: boolean;
  error: string | null;
}

// ✅ Agent Learning Data
export interface AgentLearningData {
  userBehavior: UserBehaviorProfile;
  culturalModel: CulturalLearningModel;
  timestamp: string;
  version: string;
  confidence: number;
  dataPoints: number;
  lastUpdated: string;
  insights: AgentInsights;
}

// ✅ Agent Insights
export interface AgentInsights {
  topRecommendations: string[];
  avoidancePatterns: string[];
  optimalMealTimes: Record<string, string>;
  nutritionBalance: {
    current: NutritionBalance;
    recommended: NutritionBalance;
  };
  shoppingOptimizations: string[];
}

// ✅ Nutrition Balance
export interface NutritionBalance {
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
  fiberGramsPerDay: number;
  micronutrientScore: number;
}

// ✅ AI Generation Metrics
export interface AIGenerationMetrics {
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  averageTokens: {
    input: number;
    output: number;
  };
  qualityScores: {
    average: number;
    min: number;
    max: number;
    distribution: Record<string, number>;
  };
  userSatisfaction: {
    acceptanceRate: number;
    regenerationRate: number;
    averageRating: number;
  };
}

// ✅ Pantry Optimization Suggestions
export interface PantryOptimization {
  itemsToUseFirst: PantryItem[];
  suggestedPurchases: Array<{
    item: string;
    reason: string;
    recipes: string[];
    estimatedUsage: number;
  }>;
  expiringItems: Array<{
    item: PantryItem;
    daysUntilExpiry: number;
    suggestedUse: string[];
  }>;
  overstockedItems: PantryItem[];
  understockedItems: string[];
}

// ✅ Meal Plan Analytics
export interface MealPlanAnalytics {
  nutritionScore: number;
  varietyScore: number;
  pantryUsageScore: number;
  costEfficiencyScore: number;
  healthScore: number;
  sustainabilityScore: number;
  overallScore: number;
  improvements: string[];
  achievements: string[];
}

// ✅ Export all types for easy import
export type {
  MealPolicy,
  UserBehaviorHints,
  FlavorProfile,
  TexturePreference,
  SeasonalPreferences,
  MealTypeRules,
  QCValidationResult,
  EnhancedMeal,
  UserBehaviorProfile,
  RegenerationPattern,
  MealRatingHistory,
  DietaryJourney,
  CulturalLearningModel,
  CulturalMealPreferences,
  MealLoadingStates,
  AgentLearningData,
  AgentInsights,
  NutritionBalance,
  AIGenerationMetrics,
  PantryOptimization,
  MealPlanAnalytics
};
