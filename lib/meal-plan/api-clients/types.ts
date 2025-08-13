// lib/meal-plan/api-clients/types.ts

// ✅ DÜZELTME: Döngüsel import'u kaldırdık, types'ı direkt burada tanımlıyoruz
// import { PantryItem, Meal } from '../types'; // KALDIRILDI
// import { MealPolicy, QCValidationResult } from './types'; // KALDIRILDI - zaten burada tanımlı

// ============================================
// BASE TYPES (from ../types.ts if needed)
// ============================================

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  expiry_date?: string;
  purchase_date?: string;
  location?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string;
  fromPantry?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  emoji?: string;
  category?: string;
  tags?: string[];
  instructions?: string[];
  source?: 'ai_generated' | 'spoonacular' | 'user_created' | 'database';
  created_at?: string;
  pantryUsagePercentage?: number;
  shoppingListItems?: string[];
  matchPercentage?: number;
  pantryMatch?: number;
  totalIngredients?: number;
  missingIngredients?: string[];
  qualityScore?: number;
  qualityReason?: string;
  qualityWarning?: boolean;
  generationAttempts?: number;
}

export interface MealPlan {
  daily: {
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
    snacks: Meal[];
    totalCalories: number;
    totalProtein: number;
    optimizationScore: number;
    generatedAt: string;
    regenerationHistory?: Record<string, number>;
  };
  weekly?: {
    [key: string]: {
      breakfast: Meal | null;
      lunch: Meal | null;
      dinner: Meal | null;
      snacks: Meal[];
    };
  };
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  dietary_restrictions?: string[];
  dietary_preferences?: string[];
  allergens?: string[];
  cuisine_preferences?: string[];
  cooking_skill_level?: string;
  activity_level?: string;
  health_goals?: string[];
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PantryMetrics {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  categories: Record<string, number>;
  healthScore?: number;
  varietyScore?: number;
  freshness?: number;
}

export interface AIGenerationRequest {
  pantryItems: PantryItem[];
  userProfile: UserProfile | null;
  mealType: string;
  preferences: string[];
  restrictions: string[];
  targetCalories?: number;
  targetProtein?: number;
}

export interface AIGenerationResponse {
  meal: Meal;
  confidence: number;
  alternativeOptions?: Meal[];
  reasoning?: string;
}

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
  culturalConstraints?: string[];
  pantryCulture?: string;
  behaviorHints?: UserBehaviorHints;
  seasonalPreferences?: SeasonalPreferences;
  mealTypeRules?: MealTypeRules;
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

// ✅ Cultural Meal Preferences
export interface CulturalMealPreferences {
  allowedIngredients: string[];
  forbiddenIngredients: string[];
  preferredCombinations: string[][];
  avoidedCombinations: string[][];
  typicalDishes: string[];
  cookingMethods: string[];
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

// ✅ Nutrition Balance
export interface NutritionBalance {
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
  fiberGramsPerDay: number;
  micronutrientScore: number;
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

// ✅ Shopping List Item
export interface ShoppingListItem {
  id?: string;
  user_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  is_completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ Nutrition Log Entry
export interface NutritionLogEntry {
  id?: string;
  user_id: string;
  date: string;
  meal_type: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  created_at?: string;
}

// ✅ Recipe Review
export interface RecipeReview {
  id?: string;
  user_id: string;
  recipe_id: string;
  rating: number;
  review?: string;
  difficulty_rating?: number;
  would_make_again: boolean;
  tags?: string[];
  created_at?: string;
}

// ✅ User Preferences (Extended)
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  measurementSystem?: 'metric' | 'imperial';
  notifications?: {
    mealReminders: boolean;
    expiryAlerts: boolean;
    weeklyReports: boolean;
    shoppingReminders: boolean;
  };
  privacy?: {
    shareData: boolean;
    allowAnalytics: boolean;
    publicProfile: boolean;
  };
}

// ✅ Export all types
export * from './types';
