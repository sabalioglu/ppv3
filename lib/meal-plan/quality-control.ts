// lib/meal-plan/quality-control.ts
// 4+ Stage Quality Control System with Anti-Nonsense Validation
import { Meal, PantryItem, UserProfile, Ingredient } from './types';
import { findBestPantryMatch } from './pantry-consumption';
import { calculatePantryMatch } from './meal-matching';

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

// Main quality validation function
export const validateMealWithStages = async (
  meal: Meal,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null
): Promise<QualityAssessment> => {
  console.log('🔍 Starting 5-stage quality control for:', meal.name);
  
  // STAGE 1: Pantry Availability Check
  const stage1 = await validatePantryAvailability(meal, pantryItems);
  
  // STAGE 2: Pantry Integrity Check (Quantities, Expiry Dates)
  const stage2 = await validatePantryIntegrity(meal, pantryItems);
  
  // STAGE 3: Personalization Compatibility
  const stage3 = await validatePersonalization(meal, userProfile);
  
  // STAGE 4: Logical Consistency (Anti-Nonsense)
  const stage4 = await validateLogicalConsistency(meal);
  
  // STAGE 5: Nutrition Balance and Macro Analysis
  const stage5 = await validateNutritionBalance(meal, userProfile);
  
  const stages = [stage1, stage2, stage3, stage4, stage5];
  const overallPass = stages.every(stage => stage.passed);
  const avgConfidence = stages.reduce((sum, s) => sum + s.confidence, 0) / stages.length;
  
  console.log('📊 Quality control results:', {
    stage1: stage1.passed,
    stage2: stage2.passed,
    stage3: stage3.passed,
    stage4: stage4.passed,
    stage5: stage5.passed,
    overallPass,
    avgConfidence: Math.round(avgConfidence)
  });
  
  // Auto-fix attempt if failed
  let finalMeal = meal;
  let autoFixAttempted = false;
  
  if (!overallPass && avgConfidence < 70) {
    console.log('🔧 Attempting auto-fix...');
    try {
      finalMeal = await attemptAutoFix(meal, stages, pantryItems, userProfile);
      autoFixAttempted = true;
    } catch (error) {
      console.error('❌ Auto-fix failed:', error);
    }
  }
  
  return {
    overallPass,
    confidence: avgConfidence,
    stages,
    finalMeal,
    qualityWarning: !overallPass,
    autoFixAttempted
  };
};

// STAGE 1: Pantry Availability Check
const validatePantryAvailability = async (
  meal: Meal,
  pantryItems: PantryItem[]
): Promise<QualityCheckResult> => {
  const issues: string[] = [];
  let availableCount = 0;
  
  for (const ingredient of meal.ingredients) {
    const matchingItem = findBestPantryMatch(ingredient, pantryItems);
    if (matchingItem && matchingItem.quantity >= (ingredient.amount || 0)) {
      availableCount++;
    } else {
      issues.push(`${ingredient.name} pantry'de yok veya yetersiz`);
    }
  }
  
  const availabilityRatio = availableCount / meal.ingredients.length;
  
  return {
    stage: 1,
    stageName: 'Pantry Availability',
    passed: availabilityRatio >= 0.6, // At least 60% ingredients available
    confidence: availabilityRatio * 100,
    issues,
    suggestion: availabilityRatio < 0.6 ? 'Consider using more pantry ingredients' : undefined
  };
};

// STAGE 2: Pantry Integrity Check
const validatePantryIntegrity = async (
  meal: Meal,
  pantryItems: PantryItem[]
): Promise<QualityCheckResult> => {
  const issues: string[] = [];
  let integrityScore = 100;
  
  for (const ingredient of meal.ingredients) {
    const matchingItem = findBestPantryMatch(ingredient, pantryItems);
    
    if (matchingItem) {
      // Check expiry date
      if (matchingItem.expiry_date) {
        const expiryDate = new Date(matchingItem.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          issues.push(`${matchingItem.name} has expired`);
          integrityScore -= 20;
        } else if (daysUntilExpiry <= 1) {
          issues.push(`${matchingItem.name} expires today`);
          integrityScore -= 5; // Actually good to use expiring items
        }
      }
      
      // Check quantity sufficiency
      const requiredAmount = ingredient.amount || 1;
      if (matchingItem.quantity < requiredAmount) {
        issues.push(`${matchingItem.name} insufficient quantity (need ${requiredAmount}, have ${matchingItem.quantity})`);
        integrityScore -= 10;
      }
    }
  }
  
  return {
    stage: 2,
    stageName: 'Pantry Integrity',
    passed: integrityScore >= 70,
    confidence: Math.max(0, integrityScore),
    issues,
    suggestion: issues.length > 0 ? 'Check pantry item conditions' : undefined
  };
};

// STAGE 3: Personalization Compatibility
const validatePersonalization = async (
  meal: Meal,
  userProfile: UserProfile | null
): Promise<QualityCheckResult> => {
  const issues: string[] = [];
  let personalityScore = 100;
  
  if (!userProfile) {
    return {
      stage: 3,
      stageName: 'Personalization',
      passed: true,
      confidence: 80,
      issues: ['No user profile available'],
      suggestion: 'Complete profile for better personalization'
    };
  }
  
  // Check dietary restrictions (CRITICAL)
  if (userProfile.dietary_restrictions?.length) {
    for (const restriction of userProfile.dietary_restrictions) {
      const violatesRestriction = meal.ingredients.some(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        const restrictionName = restriction.toLowerCase();
        
        // Common dietary restrictions
        if (restrictionName.includes('vegetarian') && 
            ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna'].some(meat => ingredientName.includes(meat))) {
          return true;
        }
        if (restrictionName.includes('vegan') && 
            ['milk', 'cheese', 'yogurt', 'butter', 'eggs'].some(dairy => ingredientName.includes(dairy))) {
          return true;
        }
        if (restrictionName.includes('gluten') && 
            ['bread', 'pasta', 'flour', 'wheat'].some(gluten => ingredientName.includes(gluten))) {
          return true;
        }
        
        return ingredientName.includes(restrictionName);
      });
      
      if (violatesRestriction) {
        issues.push(`Violates dietary restriction: ${restriction}`);
        personalityScore -= 30; // Major penalty
      }
    }
  }
  
  // Check health goals alignment
  if (userProfile.health_goals?.length) {
    const goals = userProfile.health_goals;
    
    if (goals.includes('weight_loss') && meal.calories > 500) {
      issues.push('High calorie content for weight loss goal');
      personalityScore -= 10;
    }
    
    if (goals.includes('muscle_gain') && meal.protein < 20) {
      issues.push('Low protein content for muscle gain goal');
      personalityScore -= 10;
    }
    
    if (goals.includes('heart_health') && meal.fat > 25) {
      issues.push('High fat content for heart health goal');
      personalityScore -= 10;
    }
  }
  
  // Check cooking skill level
  if (userProfile.cooking_skill_level === 'beginner' && meal.difficulty === 'Hard') {
    issues.push('Recipe too complex for beginner skill level');
    personalityScore -= 15;
  }
  
  return {
    stage: 3,
    stageName: 'Personalization',
    passed: personalityScore >= 70 && issues.filter(i => i.includes('Violates')).length === 0,
    confidence: Math.max(0, personalityScore),
    issues,
    suggestion: issues.length > 0 ? 'Adjust recipe to better match user preferences' : undefined
  };
};

// STAGE 4: Logical Consistency (Anti-Nonsense)
const validateLogicalConsistency = async (
  meal: Meal
): Promise<QualityCheckResult> => {
  const issues: string[] = [];
  let logicScore = 100;
  
  const ingredientNames = meal.ingredients.map(ing => ing.name.toLowerCase());
  const instructionsText = meal.instructions?.join(' ').toLowerCase() || '';
  
  // Conflicting ingredient combinations
  const conflictingCombos = [
    { combo: ['chocolate', 'salmon'], penalty: 25, message: 'Chocolate with salmon is unusual' },
    { combo: ['ice cream', 'curry'], penalty: 25, message: 'Ice cream with curry is unusual' },
    { combo: ['sugar', 'raw meat'], penalty: 30, message: 'Sugar with raw meat is unsafe' },
    { combo: ['dessert', 'fish'], penalty: 20, message: 'Dessert ingredients with fish is unusual' },
    { combo: ['sweet', 'savory meat'], penalty: 15, message: 'Sweet and savory meat combination needs care' }
  ];
  
  for (const conflict of conflictingCombos) {
    const hasConflict = conflict.combo.every(item => 
      ingredientNames.some(name => name.includes(item)) ||
      instructionsText.includes(item)
    );
    
    if (hasConflict) {
      issues.push(conflict.message);
      logicScore -= conflict.penalty;
    }
  }
  
  // Cooking method and ingredient compatibility
  if (instructionsText.includes('grill') && 
      ingredientNames.some(name => name.includes('ice') || name.includes('frozen'))) {
    issues.push('Grilling method with frozen ingredients needs thawing step');
    logicScore -= 10;
  }
  
  if (instructionsText.includes('raw') && 
      ingredientNames.some(name => ['chicken', 'pork', 'beef'].some(meat => name.includes(meat)))) {
    issues.push('Raw meat preparation requires safety warnings');
    logicScore -= 15;
  }
  
  // Cuisine consistency
  const cuisineKeywords = {
    'italian': ['pasta', 'tomato', 'basil', 'parmesan'],
    'asian': ['soy sauce', 'ginger', 'rice', 'sesame'],
    'mexican': ['beans', 'lime', 'cilantro', 'cumin'],
    'indian': ['curry', 'turmeric', 'garam masala', 'yogurt']
  };
  
  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    const hasCuisineIngredients = keywords.some(keyword => 
      ingredientNames.some(name => name.includes(keyword))
    );
    
    if (hasCuisineIngredients) {
      // Check for conflicting cuisine ingredients
      const conflictingCuisines = Object.entries(cuisineKeywords)
        .filter(([c]) => c !== cuisine)
        .some(([, conflictKeywords]) => 
          conflictKeywords.some(keyword => 
            ingredientNames.some(name => name.includes(keyword))
          )
        );
      
      if (conflictingCuisines) {
        issues.push(`Mixed cuisine styles detected - may lack coherence`);
        logicScore -= 10;
      }
    }
  }
  
  // Basic recipe structure validation
  if (!meal.instructions || meal.instructions.length < 2) {
    issues.push('Insufficient cooking instructions');
    logicScore -= 20;
  }
  
  if (meal.ingredients.length < 2) {
    issues.push('Too few ingredients for a complete meal');
    logicScore -= 25;
  }
  
  return {
    stage: 4,
    stageName: 'Logical Consistency',
    passed: logicScore >= 70 && issues.length <= 2,
    confidence: Math.max(0, logicScore),
    issues,
    suggestion: issues.length > 0 ? 'Review ingredient combinations and cooking methods' : undefined
  };
};

// STAGE 5: Nutrition Balance and Macro Analysis
const validateNutritionBalance = async (
  meal: Meal,
  userProfile: UserProfile | null
): Promise<QualityCheckResult> => {
  const issues: string[] = [];
  let nutritionScore = 100;
  
  // Basic nutrition validation
  if (!meal.calories || meal.calories <= 0) {
    issues.push('Missing or invalid calorie information');
    nutritionScore -= 20;
  }
  
  if (!meal.protein || meal.protein <= 0) {
    issues.push('Missing or invalid protein information');
    nutritionScore -= 15;
  }
  
  // Macro balance validation
  if (meal.calories > 0 && meal.protein > 0) {
    const proteinCalories = meal.protein * 4;
    const carbCalories = (meal.carbs || 0) * 4;
    const fatCalories = (meal.fat || 0) * 9;
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;
    
    // Check if macros add up to total calories (within 20% tolerance)
    const calorieDiscrepancy = Math.abs(meal.calories - totalMacroCalories) / meal.calories;
    if (calorieDiscrepancy > 0.2) {
      issues.push('Macro nutrients don\'t match total calories');
      nutritionScore -= 10;
    }
    
    // Check extreme macro ratios
    const proteinRatio = proteinCalories / meal.calories;
    const carbRatio = carbCalories / meal.calories;
    const fatRatio = fatCalories / meal.calories;
    
    if (proteinRatio > 0.6) {
      issues.push('Extremely high protein ratio');
      nutritionScore -= 5;
    }
    
    if (carbRatio > 0.8) {
      issues.push('Extremely high carbohydrate ratio');
      nutritionScore -= 10;
    }
    
    if (fatRatio > 0.5) {
      issues.push('Extremely high fat ratio');
      nutritionScore -= 10;
    }
  }
  
  // User goal-specific validation
  if (userProfile?.health_goals?.length) {
    const goals = userProfile.health_goals;
    
    if (goals.includes('weight_loss')) {
      if (meal.calories > 600) {
        issues.push('High calorie content for weight loss');
        nutritionScore -= 15;
      }
      if ((meal.fat || 0) > 20) {
        issues.push('High fat content for weight loss');
        nutritionScore -= 10;
      }
    }
    
    if (goals.includes('muscle_gain')) {
      if (meal.protein < 25) {
        issues.push('Low protein for muscle gain goal');
        nutritionScore -= 15;
      }
    }
    
    if (goals.includes('heart_health')) {
      if ((meal.fat || 0) > 15) {
        issues.push('High fat content for heart health');
        nutritionScore -= 10;
      }
      // Check for high sodium (if available)
      if ((meal as any).sodium && (meal as any).sodium > 800) {
        issues.push('High sodium content for heart health');
        nutritionScore -= 15;
      }
    }
  }
  
  return {
    stage: 5,
    stageName: 'Nutrition Balance',
    passed: nutritionScore >= 70,
    confidence: Math.max(0, nutritionScore),
    issues,
    suggestion: issues.length > 0 ? 'Adjust nutrition profile to better match health goals' : undefined
  };
};

// Auto-fix system using AI
const attemptAutoFix = async (
  meal: Meal,
  failedStages: QualityCheckResult[],
  pantryItems: PantryItem[],
  userProfile: UserProfile | null
): Promise<Meal> => {
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  
  if (!OPENAI_API_KEY) {
    console.warn('No OpenAI key for auto-fix, returning original meal');
    return meal;
  }
  
  const failedIssues = failedStages
    .filter(stage => !stage.passed)
    .map(stage => `${stage.stageName}: ${stage.issues.join(', ')}`)
    .join('\n');
  
  const availableIngredients = pantryItems
    .map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`)
    .join(', ');
  
  const fixPrompt = `Fix this recipe to resolve quality control issues:

FAILED QUALITY CHECKS:
${failedIssues}

CURRENT RECIPE:
${JSON.stringify(meal, null, 2)}

AVAILABLE PANTRY:
${availableIngredients}

USER RESTRICTIONS:
${userProfile?.dietary_restrictions?.join(', ') || 'None'}

HEALTH GOALS:
${userProfile?.health_goals?.join(', ') || 'General health'}

INSTRUCTIONS:
1. Fix all quality issues mentioned above
2. Maintain the same meal type and general concept
3. Use maximum pantry ingredients possible
4. Ensure logical ingredient combinations
5. Balance nutrition according to health goals
6. Keep the same JSON structure

Return the fixed recipe in the same JSON format.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional chef fixing recipe quality issues. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: fixPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const fixedMealText = data.choices[0]?.message?.content;
    
    if (!fixedMealText) {
      throw new Error('No response from OpenAI auto-fix');
    }
    
    const fixedMeal = JSON.parse(fixedMealText);
    
    console.log('✅ Auto-fix completed successfully');
    return {
      ...meal,
      ...fixedMeal,
      id: meal.id, // Keep original ID
      autoFixed: true
    };
    
  } catch (error) {
    console.error('❌ Auto-fix failed:', error);
    return meal; // Return original if fix fails
  }
};

// Enhanced meal generation with quality control integration
export const generateAIMealWithQualityControl = async (
  mealType: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile | null,
  previousMeals: Meal[] = []
): Promise<Meal> => {
  const { generateAIMeal } = await import('./ai-generation');
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🎯 Quality-controlled generation attempt ${attempts}/${maxAttempts}`);
    
    try {
      // Generate raw meal
      const rawMeal = await generateAIMeal({
        pantryItems,
        userProfile,
        mealType,
        preferences: userProfile?.dietary_preferences || [],
        restrictions: userProfile?.dietary_restrictions || []
      }, previousMeals);
      
      // Run quality control
      const qualityAssessment = await validateMealWithStages(rawMeal, pantryItems, userProfile);
      
      if (qualityAssessment.overallPass && qualityAssessment.confidence > 70) {
        console.log(`✅ Quality control passed on attempt ${attempts}`);
        return qualityAssessment.finalMeal || rawMeal;
      } else if (attempts === maxAttempts) {
        // Last attempt - return with warning
        console.warn(`⚠️ Quality control failed after ${maxAttempts} attempts`);
        return {
          ...qualityAssessment.finalMeal || rawMeal,
          qualityWarning: true,
          qualityIssues: qualityAssessment.stages.filter(s => !s.passed),
          qualityScore: qualityAssessment.confidence
        };
      }
      
      console.log(`❌ Quality control failed attempt ${attempts}, retrying...`);
      
    } catch (error) {
      console.error(`❌ Generation attempt ${attempts} failed:`, error);
      
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate quality meal after maximum attempts');
};

// Export quality metrics for UI display
export const getQualityMetrics = (meal: Meal): {
  hasQualityData: boolean;
  score?: number;
  warning?: boolean;
  issues?: any[];
} => {
  return {
    hasQualityData: !!(meal as any).qualityScore,
    score: (meal as any).qualityScore,
    warning: (meal as any).qualityWarning,
    issues: (meal as any).qualityIssues
  };
};