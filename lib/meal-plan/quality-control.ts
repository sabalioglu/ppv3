// lib/meal-plan/quality-control.ts
// Enhanced Quality Control System with Anti-Nonsense Validation
import { Meal, PantryItem, UserProfile, Ingredient } from './types';
import { findBestPantryMatch } from './pantry-consumption';
import { CONFLICTING_COMBINATIONS } from './constants';

export interface QualityCheckResult {
  stage: number;
  stageName: string;
  passed: boolean;
  confidence: number;
  issues: string[];
  suggestion?: string;
}

export interface QualityAssessment {
  overallPass: boolean;
  confidence: number;
  stages: QualityCheckResult[];
  finalMeal?: Meal;
  qualityWarning?: boolean;
  autoFixAttempted?: boolean;
}

// ✅ CRITICAL FIX: Safe validation with proper array checks
export const validateMealWithStages = async (
  meal: Meal,
  pantryItems: PantryItem[] = [],
  userProfile: UserProfile | null = null
): Promise<QualityAssessment> => {
  console.log('🔍 Starting comprehensive quality validation for:', meal.name);
  
  // ✅ ARRAY SAFETY: Ensure all arrays exist
  const safePantryItems = Array.isArray(pantryItems) ? pantryItems : [];
  const safeMealIngredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  
  // Ensure meal has ingredients array
  const safeMeal: Meal = {
    ...meal,
    ingredients: safeMealIngredients
  };

  const stages: QualityCheckResult[] = [];
  let finalMeal = { ...safeMeal };
  let overallScore = 0;

  try {
    // Stage 1: Basic Structure Check
    const structureStage = validateStructure(safeMeal);
    stages.push(structureStage);
    overallScore += structureStage.confidence;

    // Stage 2: Pantry Availability (with safe arrays)
    const pantryStage = validatePantryAvailability(safeMeal, safePantryItems);
    stages.push(pantryStage);
    overallScore += pantryStage.confidence;

    // Stage 3: Dietary Requirements (with safe user data)
    const dietaryStage = validateDietaryRequirements(safeMeal, userProfile);
    stages.push(dietaryStage);
    overallScore += dietaryStage.confidence;

    // Stage 4: Logic Check
    const logicStage = validateLogicalConsistency(safeMeal);
    stages.push(logicStage);
    overallScore += logicStage.confidence;

    // Stage 5: Nutritional Balance
    const nutritionStage = validateNutritionBalance(safeMeal, userProfile);
    stages.push(nutritionStage);
    overallScore += nutritionStage.confidence;

    const averageScore = overallScore / stages.length;
    const overallPass = averageScore >= 70 && stages.filter(s => !s.passed).length <= 1;

    console.log('📊 Quality control results:', {
      stage1: structureStage.passed,
      stage2: pantryStage.passed,
      stage3: dietaryStage.passed,
      stage4: logicStage.passed,
      stage5: nutritionStage.passed,
      overallPass,
      avgConfidence: Math.round(averageScore)
    });

    return {
      overallPass,
      confidence: Math.min(averageScore, 100),
      stages,
      finalMeal,
      qualityWarning: !overallPass,
      autoFixAttempted: false
    };

  } catch (error) {
    console.error('❌ Quality validation error:', error);
    
    // Return safe fallback assessment
    return {
      overallPass: false,
      confidence: 0,
      stages: [{
        stage: 0,
        stageName: 'Error Recovery',
        passed: false,
        confidence: 0,
        issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }],
      finalMeal: safeMeal,
      qualityWarning: true,
      autoFixAttempted: false
    };
  }
};

// ✅ SAFE VALIDATION FUNCTIONS
const validateStructure = (meal: Meal): QualityCheckResult => {
  const issues: string[] = [];
  let score = 100;

  if (!meal.name || meal.name.trim().length === 0) {
    issues.push('Missing meal name');
    score -= 30;
  }

  if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
    issues.push('No ingredients provided');
    score -= 50;
  }

  if (!meal.calories || meal.calories <= 0) {
    issues.push('Invalid calorie information');
    score -= 20;
  }

  return {
    stage: 1,
    stageName: 'Structure Check',
    passed: score >= 70,
    confidence: Math.max(0, score),
    issues
  };
};

const validatePantryAvailability = (meal: Meal, pantryItems: PantryItem[]): QualityCheckResult => {
  const issues: string[] = [];
  let score = 100;

  if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
    return {
      stage: 2,
      stageName: 'Pantry Availability',
      passed: false,
      confidence: 0,
      issues: ['No ingredients to check']
    };
  }

  if (!Array.isArray(pantryItems) || pantryItems.length === 0) {
    return {
      stage: 2,
      stageName: 'Pantry Availability',
      passed: true,
      confidence: 50,
      issues: ['No pantry data available for comparison']
    };
  }

  const pantryNames = pantryItems.map(item => item.name?.toLowerCase() || '').filter(Boolean);
  const missingIngredients: string[] = [];

  meal.ingredients.forEach(ingredient => {
    const ingredientName = ingredient.name?.toLowerCase() || '';
    if (ingredientName) {
      const isAvailable = pantryNames.some(pantryName => 
        pantryName.includes(ingredientName) || ingredientName.includes(pantryName)
      );
      
      if (!isAvailable) {
        missingIngredients.push(ingredient.name);
      }
    }
  });

  const availabilityRatio = 1 - (missingIngredients.length / meal.ingredients.length);
  score = Math.round(availabilityRatio * 100);

  if (missingIngredients.length > meal.ingredients.length * 0.5) {
    issues.push(`Too many missing ingredients: ${missingIngredients.slice(0, 3).join(', ')}${missingIngredients.length > 3 ? '...' : ''}`);
  }

  return {
    stage: 2,
    stageName: 'Pantry Availability',
    passed: score >= 60,
    confidence: score,
    issues
  };
};

const validateDietaryRequirements = (meal: Meal, userProfile: UserProfile | null): QualityCheckResult => {
  const issues: string[] = [];
  let score = 100;

  if (!userProfile || !Array.isArray(userProfile.dietary_restrictions)) {
    return {
      stage: 3,
      stageName: 'Dietary Requirements',
      passed: true,
      confidence: 100,
      issues: []
    };
  }

  const restrictions = userProfile.dietary_restrictions;
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

  restrictions.forEach(restriction => {
    const conflictingIngredients = ingredients.filter(ingredient => {
      const name = ingredient.name?.toLowerCase() || '';
      switch (restriction.toLowerCase()) {
        case 'vegetarian':
          return ['chicken', 'beef', 'pork', 'fish', 'meat'].some(meat => name.includes(meat));
        case 'vegan':
          return ['milk', 'cheese', 'egg', 'butter', 'cream', 'yogurt', 'honey'].some(animal => name.includes(animal));
        case 'gluten-free':
          return ['wheat', 'flour', 'bread', 'pasta', 'barley'].some(gluten => name.includes(gluten));
        case 'dairy-free':
          return ['milk', 'cheese', 'butter', 'cream', 'yogurt'].some(dairy => name.includes(dairy));
        default:
          return false;
      }
    });

    if (conflictingIngredients.length > 0) {
      issues.push(`Conflicts with ${restriction}: ${conflictingIngredients.map(i => i.name).join(', ')}`);
      score -= 40;
    }
  });

  return {
    stage: 3,
    stageName: 'Dietary Requirements',
    passed: score >= 70,
    confidence: Math.max(0, score),
    issues
  };
};

const validateLogicalConsistency = (meal: Meal): QualityCheckResult => {
  const issues: string[] = [];
  let score = 100;

  if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
    return {
      stage: 4,
      stageName: 'Logic Check',
      passed: false,
      confidence: 0,
      issues: ['No ingredients to validate']
    };
  }

  const ingredientNames = meal.ingredients.map(i => i.name?.toLowerCase() || '').filter(Boolean);
  const instructionsText = Array.isArray(meal.instructions) ? meal.instructions.join(' ').toLowerCase() : '';
  
  // Check for obvious conflicts using constants
  CONFLICTING_COMBINATIONS.forEach(conflict => {
    const hasFirst = ingredientNames.some(name => name.includes(conflict.ingredients[0]));
    const hasSecond = ingredientNames.some(name => name.includes(conflict.ingredients[1]));
    
    if (hasFirst && hasSecond) {
      issues.push(conflict.reason);
      score -= 30;
    }
  });

  // Basic recipe structure validation
  if (!Array.isArray(meal.instructions) || meal.instructions.length < 2) {
    issues.push('Insufficient cooking instructions');
    score -= 20;
  }
  
  if (meal.ingredients.length < 2) {
    issues.push('Too few ingredients for a complete meal');
    score -= 25;
  }

  return {
    stage: 4,
    stageName: 'Logic Check',
    passed: score >= 70,
    confidence: Math.max(0, score),
    issues
  };
};

const validateNutritionBalance = (meal: Meal, userProfile: UserProfile | null): QualityCheckResult => {
  const issues: string[] = [];
  let score = 100;

  // Basic nutrition validation
  if (!meal.calories || meal.calories <= 0) {
    issues.push('Missing or invalid calorie information');
    score -= 25;
  }

  if (!meal.protein || meal.protein <= 0) {
    issues.push('Missing or invalid protein information');
    score -= 25;
  }

  if (meal.calories && meal.calories > 2000) {
    issues.push('Extremely high calorie content');
    score -= 15;
  }

  // User goal-specific validation
  if (userProfile?.health_goals && Array.isArray(userProfile.health_goals)) {
    const goals = userProfile.health_goals;
    
    if (goals.includes('weight_loss') && meal.calories > 600) {
      issues.push('High calorie content for weight loss');
      score -= 15;
    }
    
    if (goals.includes('muscle_gain') && meal.protein < 25) {
      issues.push('Low protein for muscle gain goal');
      score -= 15;
    }
  }

  return {
    stage: 5,
    stageName: 'Nutritional Balance',
    passed: score >= 70,
    confidence: Math.max(0, score),
    issues
  };
};