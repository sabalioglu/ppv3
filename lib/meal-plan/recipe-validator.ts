// lib/meal-plan/recipe-validator.ts (KOMPLE YENİDEN YAZ)

import { AIRecipe, AIRecipeRequest } from './types/ai-recipe-types';
import { apiManager } from './api-manager';

// Backward compatibility
export interface Recipe extends AIRecipe {}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
  confidence: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'ingredients' | 'instructions' | 'nutrition' | 'safety' | 'compatibility';
  message: string;
  severity: number; // 1-10
}

export interface ValidationOptions {
  strictMode?: boolean;
  checkNutrition?: boolean;
  checkSafety?: boolean;
  checkCompatibility?: boolean;
  minScore?: number;
}

export class RecipeValidator {
  private options: Required<ValidationOptions>;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      strictMode: options.strictMode ?? false,
      checkNutrition: options.checkNutrition ?? true,
      checkSafety: options.checkSafety ?? true,
      checkCompatibility: options.checkCompatibility ?? true,
      minScore: options.minScore ?? 70,
    };
  }

  // Main validation method
  async validateRecipe(recipe: Recipe, context?: AIRecipeRequest): Promise<ValidationResult> {
    console.log('🔍 Validating recipe:', recipe.name);

    const issues: ValidationIssue[] = [];
    let score = 100;

    // Basic structure validation
    const basicIssues = this.validateBasicStructure(recipe);
    issues.push(...basicIssues);
    score -= basicIssues.reduce((sum, issue) => sum + issue.severity, 0);

    // Ingredient validation
    const ingredientIssues = await this.validateIngredients(recipe, context);
    issues.push(...ingredientIssues);
    score -= ingredientIssues.reduce((sum, issue) => sum + issue.severity, 0);

    // Instruction validation
    const instructionIssues = this.validateInstructions(recipe);
    issues.push(...instructionIssues);
    score -= instructionIssues.reduce((sum, issue) => sum + issue.severity, 0);

    // Nutrition validation
    if (this.options.checkNutrition) {
      const nutritionIssues = this.validateNutrition(recipe, context);
      issues.push(...nutritionIssues);
      score -= nutritionIssues.reduce((sum, issue) => sum + issue.severity, 0);
    }

    // Safety validation
    if (this.options.checkSafety) {
      const safetyIssues = await this.validateSafety(recipe);
      issues.push(...safetyIssues);
      score -= safetyIssues.reduce((sum, issue) => sum + issue.severity, 0);
    }

    // Compatibility validation
    if (this.options.checkCompatibility && context) {
      const compatibilityIssues = this.validateCompatibility(recipe, context);
      issues.push(...compatibilityIssues);
      score -= compatibilityIssues.reduce((sum, issue) => sum + issue.severity, 0);
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, Math.min(100, score));

    const suggestions = this.generateSuggestions(issues, recipe);
    const confidence = this.calculateConfidence(recipe, issues);

    const result: ValidationResult = {
      isValid: score >= this.options.minScore && issues.filter(i => i.type === 'error').length === 0,
      score,
      issues,
      suggestions,
      confidence
    };

    console.log(`✅ Recipe validation completed - Score: ${score}, Valid: ${result.isValid}`);
    return result;
  }

  // Validate multiple recipes and rank them
  async validateAndRankRecipes(recipes: Recipe[], context?: AIRecipeRequest): Promise<{recipe: Recipe, validation: ValidationResult}[]> {
    console.log(`🔍 Validating and ranking ${recipes.length} recipes...`);

    const validationPromises = recipes.map(async recipe => ({
      recipe,
      validation: await this.validateRecipe(recipe, context)
    }));

    const results = await Promise.all(validationPromises);

    // Sort by score (highest first)
    results.sort((a, b) => b.validation.score - a.validation.score);

    console.log('📊 Recipe ranking completed:', results.map(r => ({
      name: r.recipe.name,
      score: r.validation.score,
      valid: r.validation.isValid
    })));

    return results;
  }

  // Legacy method for backward compatibility
  async validateAiRecipe(recipe: Recipe, pantryItems?: string[]): Promise<ValidationResult> {
    const context: AIRecipeRequest | undefined = pantryItems ? {
      pantryItems,
      mealType: recipe.mealType || 'breakfast',
      servings: recipe.servings || 2,
      dietaryRestrictions: [],
      allergies: [],
      avoidIngredients: [],
      preferredIngredients: [],
      userGoal: 'general_health'
    } : undefined;

    return this.validateRecipe(recipe, context);
  }

  // Private validation methods
  private validateBasicStructure(recipe: Recipe): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!recipe.name || recipe.name.trim().length === 0) {
      issues.push({
        type: 'error',
        category: 'ingredients',
        message: 'Recipe name is required',
        severity: 10
      });
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      issues.push({
        type: 'error',
        category: 'ingredients',
        message: 'Recipe must have ingredients',
        severity: 10
      });
    }

    if (!recipe.instructions || recipe.instructions.length === 0) {
      issues.push({
        type: 'error',
        category: 'instructions',
        message: 'Recipe must have cooking instructions',
        severity: 10
      });
    }

    if (recipe.cookingTime <= 0) {
      issues.push({
        type: 'warning',
        category: 'instructions',
        message: 'Cooking time should be specified',
        severity: 3
      });
    }

    if (recipe.servings <= 0) {
      issues.push({
        type: 'warning',
        category: 'instructions',
        message: 'Number of servings should be specified',
        severity: 2
      });
    }

    return issues;
  }

  private async validateIngredients(recipe: Recipe, context?: AIRecipeRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for incompatible ingredient combinations
    const incompatiblePairs = [
      ['fish', 'dairy'],
      ['citrus', 'milk'],
      ['tomato', 'dairy'],
      ['wine', 'sweet']
    ];

    const ingredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase());

    for (const [ing1, ing2] of incompatiblePairs) {
      const hasIng1 = ingredientNames.some(name => name.includes(ing1));
      const hasIng2 = ingredientNames.some(name => name.includes(ing2));

      if (hasIng1 && hasIng2) {
        issues.push({
          type: 'warning',
          category: 'compatibility',
          message: `Potentially incompatible ingredients: ${ing1} and ${ing2}`,
          severity: 4
        });
      }
    }

    // Check ingredient quantities
    for (const ingredient of recipe.ingredients) {
      if (!ingredient.amount || ingredient.amount <= 0) {
        issues.push({
          type: 'warning',
          category: 'ingredients',
          message: `Missing or invalid amount for ${ingredient.name}`,
          severity: 3
        });
      }

      if (!ingredient.unit || ingredient.unit.trim().length === 0) {
        issues.push({
          type: 'info',
          category: 'ingredients',
          message: `Missing unit for ${ingredient.name}`,
          severity: 1
        });
      }
    }

    // Check pantry availability
    if (context?.pantryItems) {
      const missingIngredients = recipe.ingredients.filter(recipeIng => 
        !context.pantryItems.some(pantryItem =>
          pantryItem.toLowerCase().includes(recipeIng.name.toLowerCase()) ||
          recipeIng.name.toLowerCase().includes(pantryItem.toLowerCase())
        )
      );

      if (missingIngredients.length > recipe.ingredients.length * 0.5) {
        issues.push({
          type: 'warning',
          category: 'compatibility',
          message: `Many ingredients not available in pantry: ${missingIngredients.map(i => i.name).join(', ')}`,
          severity: 6
        });
      }
    }

    return issues;
  }

  private validateInstructions(recipe: Recipe): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (recipe.instructions.length < 2) {
      issues.push({
        type: 'warning',
        category: 'instructions',
        message: 'Recipe should have multiple cooking steps',
        severity: 3
      });
    }

    // Check for vague instructions
    const vagueWords = ['some', 'a bit', 'little', 'much', 'many'];
    const hasVagueInstructions = recipe.instructions.some(instruction => 
      vagueWords.some(word => instruction.toLowerCase().includes(word))
    );

    if (hasVagueInstructions) {
      issues.push({
        type: 'info',
        category: 'instructions',
        message: 'Instructions contain vague measurements',
        severity: 2
      });
    }

    // Check instruction length
    const tooShortInstructions = recipe.instructions.filter(inst => inst.trim().length < 10);
    if (tooShortInstructions.length > 0) {
      issues.push({
        type: 'info',
        category: 'instructions',
        message: 'Some instructions are very brief',
        severity: 1
      });
    }

    return issues;
  }

  private validateNutrition(recipe: Recipe, context?: AIRecipeRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check if nutrition info is provided
    if (!recipe.calories || recipe.calories <= 0) {
      issues.push({
        type: 'info',
        category: 'nutrition',
        message: 'Calorie information is missing',
        severity: 2
      });
    }

    if (!recipe.macros || (!recipe.macros.protein && !recipe.macros.carbs && !recipe.macros.fat)) {
      issues.push({
        type: 'info',
        category: 'nutrition',
        message: 'Macronutrient information is missing',
        severity: 2
      });
    }

    // Check nutritional balance
    if (recipe.macros) {
      const totalMacros = (recipe.macros.protein || 0) + (recipe.macros.carbs || 0) + (recipe.macros.fat || 0);
      
      if (totalMacros > 0) {
        const proteinRatio = (recipe.macros.protein || 0) / totalMacros;
        const carbRatio = (recipe.macros.carbs || 0) / totalMacros;
        const fatRatio = (recipe.macros.fat || 0) / totalMacros;

        // Check for extreme ratios
        if (proteinRatio > 0.6) {
          issues.push({
            type: 'info',
            category: 'nutrition',
            message: 'Very high protein content',
            severity: 1
          });
        }

        if (carbRatio > 0.8) {
          issues.push({
            type: 'warning',
            category: 'nutrition',
            message: 'Very high carbohydrate content',
            severity: 3
          });
        }

        if (fatRatio > 0.5) {
          issues.push({
            type: 'warning',
            category: 'nutrition',
            message: 'Very high fat content',
            severity: 3
          });
        }
      }
    }

    // Context-based validation
    if (context?.userGoal) {
      if (context.userGoal === 'weight_loss' && recipe.calories > 500) {
        issues.push({
          type: 'info',
          category: 'nutrition',
          message: 'High calorie content for weight loss goal',
          severity: 2
        });
      }

      if (context.userGoal === 'muscle_gain' && (!recipe.macros?.protein || recipe.macros.protein < 20)) {
        issues.push({
          type: 'info',
          category: 'nutrition',
          message: 'Low protein content for muscle gain goal',
          severity: 2
        });
      }
    }

    return issues;
  }

  private async validateSafety(recipe: Recipe): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check for potentially dangerous ingredient combinations
    const dangerousCombinations = [
      { ingredients: ['raw', 'egg'], message: 'Raw eggs may pose salmonella risk' },
      { ingredients: ['raw', 'meat'], message: 'Raw meat requires careful handling' },
      { ingredients: ['alcohol', 'high heat'], message: 'Be careful with alcohol and high heat' }
    ];

    const recipeText = `${recipe.name} ${recipe.ingredients.map(i => i.name).join(' ')} ${recipe.instructions.join(' ')}`.toLowerCase();

    for (const combo of dangerousCombinations) {
      if (combo.ingredients.every(ingredient => recipeText.includes(ingredient))) {
        issues.push({
          type: 'warning',
          category: 'safety',
          message: combo.message,
          severity: 4
        });
      }
    }

    // Check cooking temperatures and times
    const hasProperCooking = recipe.instructions.some(instruction => 
      /cook|bake|fry|boil|simmer|roast/i.test(instruction)
    );

    if (!hasProperCooking && recipe.ingredients.some(ing => 
      /meat|chicken|fish|egg/i.test(ing.name)
    )) {
      issues.push({
        type: 'warning',
        category: 'safety',
        message: 'Recipe with protein ingredients should include proper cooking instructions',
        severity: 5
      });
    }

    return issues;
  }

  private validateCompatibility(recipe: Recipe, context: AIRecipeRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check dietary restrictions
    for (const restriction of context.dietaryRestrictions) {
      const violatesRestriction = this.checkDietaryViolation(recipe, restriction);
      if (violatesRestriction) {
        issues.push({
          type: 'error',
          category: 'compatibility',
          message: `Recipe violates dietary restriction: ${restriction}`,
          severity: 8
        });
      }
    }

    // Check allergies
    for (const allergy of context.allergies) {
      const containsAllergen = recipe.ingredients.some(ing =>
        ing.name.toLowerCase().includes(allergy.toLowerCase())
      );
      if (containsAllergen) {
        issues.push({
          type: 'error',
          category: 'safety',
          message: `Recipe contains allergen: ${allergy}`,
          severity: 10
        });
      }
    }

    // Check cooking time constraints
    if (context.maxCookingTime && recipe.cookingTime > context.maxCookingTime) {
      issues.push({
        type: 'warning',
        category: 'compatibility',
        message: `Cooking time (${recipe.cookingTime}min) exceeds limit (${context.maxCookingTime}min)`,
        severity: 4
      });
    }

    return issues;
  }

  private checkDietaryViolation(recipe: Recipe, restriction: string): boolean {
    const restrictionMap = {
      'vegetarian': ['meat', 'chicken', 'fish', 'beef', 'pork'],
      'vegan': ['meat', 'chicken', 'fish', 'beef', 'pork', 'dairy', 'milk', 'cheese', 'egg'],
      'gluten-free': ['wheat', 'flour', 'bread', 'pasta'],
      'dairy-free': ['milk', 'cheese', 'butter', 'cream', 'yogurt'],
      'low-carb': [] // Handled in nutrition validation
    };

    const prohibitedIngredients = restrictionMap[restriction.toLowerCase()] || [];
    
    return recipe.ingredients.some(ingredient =>
      prohibitedIngredients.some(prohibited =>
        ingredient.name.toLowerCase().includes(prohibited)
      )
    );
  }

  private generateSuggestions(issues: ValidationIssue[], recipe: Recipe): string[] {
    const suggestions: string[] = [];

    // Generate suggestions based on issues
    if (issues.some(i => i.message.includes('missing amount'))) {
      suggestions.push('Add specific measurements for all ingredients');
    }

    if (issues.some(i => i.message.includes('vague measurements'))) {
      suggestions.push('Use precise measurements instead of vague terms');
    }

    if (issues.some(i => i.message.includes('high calorie'))) {
      suggestions.push('Consider reducing portion sizes or using lighter ingredients');
    }

    if (issues.some(i => i.message.includes('low protein'))) {
      suggestions.push('Add protein-rich ingredients like eggs, beans, or lean meat');
    }

    if (issues.some(i => i.message.includes('incompatible ingredients'))) {
      suggestions.push('Review ingredient combinations for better flavor harmony');
    }

    return suggestions;
  }

  private calculateConfidence(recipe: Recipe, issues: ValidationIssue[]): number {
    let confidence = 90; // Start with high confidence

    // Reduce confidence based on issues
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    confidence -= errorCount * 15;
    confidence -= warningCount * 5;

    // Increase confidence based on completeness
    if (recipe.calories > 0) confidence += 2;
    if (recipe.macros?.protein) confidence += 2;
    if (recipe.instructions.length >= 3) confidence += 3;
    if (recipe.cookingTime > 0) confidence += 2;

    return Math.max(0, Math.min(100, confidence));
  }

  // Configuration methods
  updateOptions(newOptions: Partial<ValidationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  getOptions(): ValidationOptions {
    return { ...this.options };
  }
}

// Export singleton instance
export const recipeValidator = new RecipeValidator();

// Legacy export
export default RecipeValidator;
