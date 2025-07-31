// lib/meal-plan/initialize.ts (BASİT VERSİYON - ÖNCE BU)

export interface InitializationOptions {
  enableLogging?: boolean;
  isDevelopment?: boolean;
}

export interface InitializationResult {
  success: boolean;
  message: string;
  errors: string[];
}

export class MealPlanInitializer {
  private isInitialized = false;

  async initialize(options: InitializationOptions = {}): Promise<InitializationResult> {
    if (this.isInitialized) {
      return {
        success: true,
        message: 'Already initialized',
        errors: []
      };
    }

    try {
      console.log('🚀 Initializing AI meal plan system...');

      // Basit environment check
      const hasOpenAI = !!process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      const hasGemini = !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;

      if (!hasOpenAI && !hasGemini) {
        return {
          success: false,
          message: 'No AI API keys found',
          errors: ['Please set EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY']
        };
      }

      this.isInitialized = true;

      return {
        success: true,
        message: `AI system initialized with ${hasOpenAI ? 'OpenAI' : ''} ${hasGemini ? 'Gemini' : ''}`,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        message: 'Initialization failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  isSystemReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton
export const mealPlanInitializer = new MealPlanInitializer();

// Legacy function
export async function initializeMealPlan(options?: InitializationOptions): Promise<InitializationResult> {
  return mealPlanInitializer.initialize(options);
}

// Export types
export type { InitializationOptions, InitializationResult };
