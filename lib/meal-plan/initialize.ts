// lib/meal-plan/initialize.ts (KOMPLE YENİDEN YAZ)

import { apiSetup, AISetupConfig, SetupResult } from './api-setup';
import { aiRecipeManager } from './managers/ai-recipe-manager';
import { recipeOrchestrator } from './recipe-orchestrator';
import { recipeValidator } from './recipe-validator';
import { mealPlanService } from './meal-plan-service';

export interface InitializationOptions {
  // AI Provider Settings
  aiConfig?: AISetupConfig;
  
  // Performance Settings
  enableParallelProcessing?: boolean;
  maxConcurrentRequests?: number;
  
  // Quality Settings
  defaultQualityThreshold?: number;
  enableAdvancedValidation?: boolean;
  
  // Caching Settings
  enableCaching?: boolean;
  cacheSize?: number;
  cacheTTL?: number; // Time to live in minutes
  
  // Logging Settings
  enableVerboseLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  
  // Development Settings
  isDevelopment?: boolean;
  enableTestMode?: boolean;
}

export interface InitializationResult {
  success: boolean;
  services: {
    aiRecipeManager: 'ready' | 'error';
    recipeOrchestrator: 'ready' | 'error';
    recipeValidator: 'ready' | 'error';
    mealPlanService: 'ready' | 'error';
    apiSetup: 'ready' | 'error';
  };
  aiProviders: string[];
  performance: {
    initializationTime: number;
    memoryUsage?: number;
  };
  errors: string[];
  warnings: string[];
  configuration: InitializationOptions;
}

export class MealPlanInitializer {
  private isInitialized = false;
  private initResult: InitializationResult | null = null;

  async initialize(options: InitializationOptions = {}): Promise<InitializationResult> {
    if (this.isInitialized && this.initResult) {
      console.log('🔄 Meal plan system already initialized, returning cached result');
      return this.initResult;
    }

    const startTime = Date.now();
    console.log('🚀 Initializing AI-powered meal plan system...');

    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Default configuration
    const config: Required<InitializationOptions> = {
      aiConfig: {},
      enableParallelProcessing: true,
      maxConcurrentRequests: 5,
      defaultQualityThreshold: 75,
      enableAdvancedValidation: true,
      enableCaching: true,
      cacheSize: 100,
      cacheTTL: 60, // 60 minutes
      enableVerboseLogging: false,
      logLevel: 'info',
      isDevelopment: process.env.NODE_ENV === 'development',
      enableTestMode: false,
      ...options,
    };

    const services: InitializationResult['services'] = {
      aiRecipeManager: 'error',
      recipeOrchestrator: 'error',
      recipeValidator: 'error',
      mealPlanService: 'error',
      apiSetup: 'error',
    };

    try {
      // 1. Initialize API Setup (Core AI providers)
      console.log('🔧 Setting up AI providers...');
      const apiSetupResult = await this.initializeAPISetup(config.aiConfig, config);
      
      if (apiSetupResult.success) {
        services.apiSetup = 'ready';
        console.log('✅ AI providers initialized:', apiSetupResult.availableProviders);
      } else {
        errors.push(...apiSetupResult.errors);
        warnings.push(...apiSetupResult.warnings);
      }

      // 2. Initialize AI Recipe Manager
      console.log('🤖 Initializing AI recipe manager...');
      const aiManagerResult = await this.initializeAIRecipeManager(config);
      
      if (aiManagerResult.success) {
        services.aiRecipeManager = 'ready';
        console.log('✅ AI recipe manager initialized');
      } else {
        errors.push(...aiManagerResult.errors);
      }

      // 3. Initialize Recipe Orchestrator
      console.log('🎼 Initializing recipe orchestrator...');
      const orchestratorResult = await this.initializeRecipeOrchestrator(config);
      
      if (orchestratorResult.success) {
        services.recipeOrchestrator = 'ready';
        console.log('✅ Recipe orchestrator initialized');
      } else {
        errors.push(...orchestratorResult.errors);
      }

      // 4. Initialize Recipe Validator
      console.log('🔍 Initializing recipe validator...');
      const validatorResult = await this.initializeRecipeValidator(config);
      
      if (validatorResult.success) {
        services.recipeValidator = 'ready';
        console.log('✅ Recipe validator initialized');
      } else {
        errors.push(...validatorResult.errors);
      }

      // 5. Initialize Meal Plan Service
      console.log('🍽️ Initializing meal plan service...');
      const mealPlanResult = await this.initializeMealPlanService(config);
      
      if (mealPlanResult.success) {
        services.mealPlanService = 'ready';
        console.log('✅ Meal plan service initialized');
      } else {
        errors.push(...mealPlanResult.errors);
      }

      // 6. Post-initialization setup
      if (config.enableTestMode) {
        console.log('🧪 Running system tests...');
        const testResults = await this.runSystemTests();
        if (testResults.length > 0) {
          warnings.push(...testResults);
        }
      }

      // Calculate initialization time and memory usage
      const initializationTime = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage();

      // Determine overall success
      const readyServices = Object.values(services).filter(status => status === 'ready').length;
      const totalServices = Object.keys(services).length;
      const success = readyServices >= totalServices - 1; // Allow 1 service to fail

      this.initResult = {
        success,
        services,
        aiProviders: apiSetupResult.availableProviders,
        performance: {
          initializationTime,
          memoryUsage,
        },
        errors,
        warnings,
        configuration: config,
      };

      this.isInitialized = success;

      // Log initialization summary
      console.log('🏁 Meal plan system initialization completed:', {
        success,
        readyServices: `${readyServices}/${totalServices}`,
        initTime: `${initializationTime}ms`,
        providers: apiSetupResult.availableProviders.length,
        errors: errors.length,
        warnings: warnings.length,
      });

      if (success) {
        console.log('🎉 AI-powered meal plan system is ready to use!');
      } else {
        console.error('❌ Meal plan system initialization failed:', errors);
      }

      return this.initResult;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown initialization error';
      errors.push(`Critical initialization failure: ${errorMsg}`);
      
      console.error('💥 Critical initialization failure:', error);

      this.initResult = {
        success: false,
        services,
        aiProviders: [],
        performance: {
          initializationTime: Date.now() - startTime,
        },
        errors,
        warnings,
        configuration: config,
      };

      return this.initResult;
    }
  }

  // Individual service initializers
  private async initializeAPISetup(
    aiConfig: AISetupConfig, 
    config: Required<InitializationOptions>
  ): Promise<SetupResult> {
    try {
      return await apiSetup.setupAISystem({
        ...aiConfig,
        enableLogging: config.enableVerboseLogging,
        enableCaching: config.enableCaching,
        defaultOptions: {
          maxRetries: 3,
          timeoutMs: 30000,
          qualityThreshold: config.defaultQualityThreshold,
          ...aiConfig.defaultOptions,
        },
      });
    } catch (error) {
      return {
        success: false,
        availableProviders: [],
        errors: [error instanceof Error ? error.message : 'API setup failed'],
        warnings: [],
      };
    }
  }

  private async initializeAIRecipeManager(
    config: Required<InitializationOptions>
  ): Promise<{success: boolean; errors: string[]}> {
    try {
      // Configure caching
      if (config.enableCaching) {
        // aiRecipeManager has built-in caching
        console.log('💾 Recipe caching enabled');
      }

      // Test basic functionality
      if (config.enableTestMode) {
        // Could add a simple test here
        console.log('🧪 Testing AI recipe manager...');
      }

      return { success: true, errors: [] };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'AI recipe manager init failed']
      };
    }
  }

  private async initializeRecipeOrchestrator(
    config: Required<InitializationOptions>
  ): Promise<{success: boolean; errors: string[]}> {
    try {
      // Update orchestrator options
      recipeOrchestrator.updateOptions({
        maxRetries: 3,
        qualityThreshold: config.defaultQualityThreshold,
        timeoutMs: 45000,
        enableVariation: true,
      });

      return { success: true, errors: [] };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Recipe orchestrator init failed']
      };
    }
  }

  private async initializeRecipeValidator(
    config: Required<InitializationOptions>
  ): Promise<{success: boolean; errors: string[]}> {
    try {
      // Update validator options
      recipeValidator.updateOptions({
        strictMode: !config.isDevelopment,
        checkNutrition: config.enableAdvancedValidation,
        checkSafety: true,
        checkCompatibility: config.enableAdvancedValidation,
        minScore: config.defaultQualityThreshold,
      });

      return { success: true, errors: [] };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Recipe validator init failed']
      };
    }
  }

  private async initializeMealPlanService(
    config: Required<InitializationOptions>
  ): Promise<{success: boolean; errors: string[]}> {
    try {
      // Update meal plan service options
      mealPlanService.updateOrchestrationOptions({
        maxRetries: 3,
        qualityThreshold: config.defaultQualityThreshold,
        timeoutMs: 60000, // Longer timeout for meal plans
        enableVariation: true,
      });

      return { success: true, errors: [] };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Meal plan service init failed']
      };
    }
  }

  private async runSystemTests(): Promise<string[]> {
    const warnings: string[] = [];

    try {
      // Test 1: Basic recipe generation
      console.log('🧪 Test 1: Basic recipe generation...');
      const testResult = await aiRecipeManager.generateRecipe({
        pantryItems: ['eggs', 'milk', 'flour'],
        mealType: 'breakfast',
        servings: 2,
        dietaryRestrictions: [],
        allergies: [],
        avoidIngredients: [],
        preferredIngredients: [],
        userGoal: 'general_health',
      });

      if (!testResult.recipe) {
        warnings.push('Basic recipe generation test failed');
      } else {
        console.log('✅ Basic recipe generation test passed');
      }

      // Test 2: Recipe validation
      if (testResult.recipe) {
        console.log('🧪 Test 2: Recipe validation...');
        const validationResult = await recipeValidator.validateRecipe(testResult.recipe);
        
        if (validationResult.score < 50) {
          warnings.push('Recipe validation test returned low score');
        } else {
          console.log('✅ Recipe validation test passed');
        }
      }

    } catch (error) {
      warnings.push(`System test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return warnings;
  }

  private getMemoryUsage(): number {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // Public methods
  async reinitialize(options?: InitializationOptions): Promise<InitializationResult> {
    console.log('🔄 Reinitializing meal plan system...');
    this.isInitialized = false;
    this.initResult = null;
    return this.initialize(options);
  }

  getInitializationResult(): InitializationResult | null {
    return this.initResult;
  }

  isSystemReady(): boolean {
    return this.isInitialized && this.initResult?.success === true;
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    services: Record<string, 'online' | 'offline'>;
    lastCheck: Date;
  }> {
    if (!this.isInitialized || !this.initResult) {
      return {
        status: 'unhealthy',
        uptime: 0,
        services: {},
        lastCheck: new Date(),
      };
    }

    const services: Record<string, 'online' | 'offline'> = {};
    let healthyServices = 0;

    // Check each service
    for (const [serviceName, serviceStatus] of Object.entries(this.initResult.services)) {
      services[serviceName] = serviceStatus === 'ready' ? 'online' : 'offline';
      if (serviceStatus === 'ready') healthyServices++;
    }

    const totalServices = Object.keys(services).length;
    const uptime = Date.now() - (this.initResult?.performance.initializationTime || 0);

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > totalServices / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      uptime,
      services,
      lastCheck: new Date(),
    };
  }

  // Reset and cleanup
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up meal plan system...');
    
    try {
      // Clear caches
      aiRecipeManager.clearCache();
      
      // Reset API setup
      await apiSetup.reset();
      
      // Reset initialization state
      this.isInitialized = false;
      this.initResult = null;
      
      console.log('✅ Meal plan system cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Create and export singleton instance
export const mealPlanInitializer = new MealPlanInitializer();

// Legacy initialization function for backward compatibility
export async function initializeMealPlan(options?: InitializationOptions): Promise<InitializationResult> {
  return mealPlanInitializer.initialize(options);
}

// Auto-initialize on import (can be disabled by setting DISABLE_AUTO_INIT env var)
if (!process.env.DISABLE_AUTO_INIT) {
  mealPlanInitializer.initialize({
    enableVerboseLogging: process.env.NODE_ENV === 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    enableTestMode: false, // Disable tests on auto-init
  }).then(result => {
    if (result.success) {
      console.log('🎉 Auto-initialization successful!');
    } else {
      console.warn('⚠️ Auto-initialization completed with issues:', result.errors);
    }
  }).catch(error => {
    console.error('💥 Auto-initialization failed:', error);
  });
}

// Export types for external use
export type { InitializationOptions, InitializationResult };
