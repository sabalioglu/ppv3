//lib/meal-plan/meal-regeneration.ts
// Meal regeneration logic with smart variation handling
import { 
  Meal, 
  PantryItem, 
  UserProfile, 
  MealRegenerationRequest,
  MealRegenerationHistory 
} from './types';
import { generateAIMeal, generateAlternativeMeal } from './ai-generation';
import { calculatePantryMatch } from './meal-matching';

export class MealRegenerationManager {
  private regenerationHistory: MealRegenerationHistory = {};

  // Track regeneration attempts
  private trackRegeneration(mealType: string, variationType: string) {
    if (!this.regenerationHistory[mealType]) {
      this.regenerationHistory[mealType] = {
        attempts: 0,
        lastGenerated: new Date().toISOString(),
        variations: []
      };
    }

    this.regenerationHistory[mealType].attempts++;
    this.regenerationHistory[mealType].lastGenerated = new Date().toISOString();
    this.regenerationHistory[mealType].variations.push(variationType);
  }

  // Get next variation type based on history
  private getNextVariationType(mealType: string): 'cuisine' | 'complexity' | 'ingredients' {
    const history = this.regenerationHistory[mealType];
    if (!history || history.attempts === 0) {
      return 'cuisine'; // Start with cuisine variation
    }

    const variations = history.variations;
    const lastVariation = variations[variations.length - 1];

    // Cycle through variation types
    switch (lastVariation) {
      case 'cuisine':
        return 'complexity';
      case 'complexity':
        return 'ingredients';
      case 'ingredients':
        return 'cuisine';
      default:
        return 'cuisine';
    }
  }

  // Check if regeneration is allowed (prevent spam)
  private canRegenerate(mealType: string): boolean {
    const history = this.regenerationHistory[mealType];
    if (!history) return true;

    const now = new Date();
    const lastGenerated = new Date(history.lastGenerated);
    const timeDiff = now.getTime() - lastGenerated.getTime();
    const minutesSinceLastGen = timeDiff / (1000 * 60);

    // Allow regeneration if more than 30 seconds passed
    return minutesSinceLastGen > 0.5;
  }

  // Main regeneration method
  async regenerateMeal(request: MealRegenerationRequest): Promise<Meal> {
    const { mealType, pantryItems, userProfile, previousMeal } = request;

    // Check rate limiting
    if (!this.canRegenerate(mealType)) {
      throw new Error('Please wait before regenerating this meal again');
    }

    // Determine variation type
    const variationType = request.variationType || this.getNextVariationType(mealType);

    // Track this regeneration
    this.trackRegeneration(mealType, variationType);

    try {
      let newMeal: Meal;

      if (previousMeal && this.regenerationHistory[mealType]?.attempts > 0) {
        // Generate alternative if we have a previous meal
        newMeal = await generateAlternativeMeal(
          {
            pantryItems,
            userProfile,
            mealType,
            preferences: userProfile?.dietary_preferences || [],
            restrictions: userProfile?.dietary_restrictions || []
          },
          previousMeal,
          variationType
        );
      } else {
        // Generate fresh meal
        newMeal = await generateAIMeal({
          pantryItems,
          userProfile,
          mealType,
          preferences: userProfile?.dietary_preferences || [],
          restrictions: userProfile?.dietary_restrictions || []
        });
      }

      // Calculate pantry match for the new meal
      const pantryMatch = calculatePantryMatch(newMeal.ingredients, pantryItems);
      
      return {
        ...newMeal,
        pantryMatch: pantryMatch.matchCount,
        totalIngredients: pantryMatch.totalIngredients,
        missingIngredients: pantryMatch.missingIngredients,
        matchPercentage: pantryMatch.matchPercentage,
        allergenSafe: true
      };

    } catch (error) {
      console.error(`Failed to regenerate ${mealType}:`, error);
      throw error;
    }
  }

  // Get regeneration stats for UI
  getRegenerationStats(mealType: string) {
    const history = this.regenerationHistory[mealType];
    if (!history) {
      return {
        attempts: 0,
        canRegenerate: true,
        nextVariation: 'cuisine' as const
      };
    }

    return {
      attempts: history.attempts,
      canRegenerate: this.canRegenerate(mealType),
      nextVariation: this.getNextVariationType(mealType),
      lastGenerated: history.lastGenerated
    };
  }

  // Reset history for a meal type
  resetHistory(mealType: string) {
    delete this.regenerationHistory[mealType];
  }

  // Get full history (for debugging)
  getFullHistory(): MealRegenerationHistory {
    return this.regenerationHistory;
  }
}

// Export singleton instance
export const mealRegenerationManager = new MealRegenerationManager();
