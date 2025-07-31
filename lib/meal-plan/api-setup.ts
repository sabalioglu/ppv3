// lib/meal-plan/api-setup.ts (KOMPLE YENİDEN YAZ)

import { aiRecipeManager } from './managers/ai-recipe-manager';

export interface AISetupConfig {
  openaiApiKey?: string;
  geminiApiKey?: string;
  defaultOptions?: {
    maxRetries?: number;
    timeoutMs?: number;
    qualityThreshold?: number;
  };
  enableLogging?: boolean;
  enableCaching?: boolean;
}

export interface SetupResult {
  success: boolean;
  availableProviders: string[];
  errors: string[];
  warnings: string[];
}

export class APISetup {
  private isSetup = false;
  private config: Required<AISetupConfig> = {
    openaiApiKey: '',
    geminiApiKey: '',
    defaultOptions: {
      maxRetries: 3,
      timeoutMs: 30000,
      qualityThreshold: 70,
    },
    enableLogging: true,
    enableCaching: true,
  };

  async setupAISystem(config: AISetupConfig = {}): Promise<SetupResult> {
    console.log('🤖 Setting up AI-only recipe system...');

    const errors: string[] = [];
    const warnings: string[] = [];
    const availableProviders: string[] = [];

    try {
      // Merge with default config
      this.config = {
        ...this.config,
        ...config,
        defaultOptions: {
          ...this.config.defaultOptions,
          ...config.defaultOptions,
        },
      };

      // Get API keys from environment or config
      const openaiKey = config.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      const geminiKey = config.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

      // Validate API keys
      if (openaiKey) {
        const openaiValid = await this.validateOpenAIKey(openaiKey);
        if (openaiValid) {
          availableProviders.push('OpenAI GPT-4o-mini');
          this.config.openaiApiKey = openaiKey;
        } else {
          errors.push('Invalid OpenAI API key');
        }
      } else {
        warnings.push('OpenAI API key not provided');
      }

      if (geminiKey) {
        const geminiValid = await this.validateGeminiKey(geminiKey);
        if (geminiValid) {
          availableProviders.push('Google Gemini');
          this.config.geminiApiKey = geminiKey;
        } else {
          errors.push('Invalid Gemini API key');
        }
      } else {
        warnings.push('Gemini API key not provided');
      }

      // Check if at least one provider is available
      if (availableProviders.length === 0) {
        errors.push('No valid AI providers available. Please provide valid API keys.');
        return {
          success: false,
          availableProviders: [],
          errors,
          warnings
        };
      }

      // Setup caching if enabled
      if (this.config.enableCaching) {
        console.log('💾 Caching enabled for AI responses');
      }

      // Setup logging if enabled
      if (this.config.enableLogging) {
        console.log('📝 Enhanced logging enabled');
      }

      this.isSetup = true;

      const result: SetupResult = {
        success: true,
        availableProviders,
        errors,
        warnings
      };

      console.log('✅ AI system setup completed:', {
        providers: availableProviders.length,
        errors: errors.length,
        warnings: warnings.length
      });

      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown setup error';
      errors.push(`Setup failed: ${errorMsg}`);
      console.error('❌ AI system setup failed:', error);

      return {
        success: false,
        availableProviders,
        errors,
        warnings
      };
    }
  }

  // Legacy method for backward compatibility
  async setupApiManager(legacyConfig?: any): Promise<void> {
    console.log('⚠️ setupApiManager is deprecated. Use setupAISystem instead.');
    
    const result = await this.setupAISystem({
      enableLogging: true,
      enableCaching: true,
    });

    if (!result.success) {
      throw new Error(`Setup failed: ${result.errors.join(', ')}`);
    }
  }

  // Validate API keys
  private async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI key validation failed:', error);
      return false;
    }
  }

  private async validateGeminiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Gemini key validation failed:', error);
      return false;
    }
  }

  // System health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: { name: string; status: 'online' | 'offline'; responseTime?: number }[];
    cacheStatus: 'enabled' | 'disabled';
    lastCheck: Date;
  }> {
    console.log('🏥 Running AI system health check...');

    const providers: Array<{ name: string; status: 'online' | 'offline'; responseTime?: number }> = [];

    // Check OpenAI
    if (this.config.openaiApiKey) {
      const startTime = Date.now();
      const isOnline = await this.validateOpenAIKey(this.config.openaiApiKey);
      const responseTime = Date.now() - startTime;
      
      providers.push({
        name: 'OpenAI GPT-4o-mini',
        status: isOnline ? 'online' : 'offline',
        responseTime: isOnline ? responseTime : undefined,
      });
    }

    // Check Gemini
    if (this.config.geminiApiKey) {
      const startTime = Date.now();
      const isOnline = await this.validateGeminiKey(this.config.geminiApiKey);
      const responseTime = Date.now() - startTime;
      
      providers.push({
        name: 'Google Gemini',
        status: isOnline ? 'offline' : 'offline',
        responseTime: isOnline ? responseTime : undefined,
      });
    }

    const onlineProviders = providers.filter(p => p.status === 'online');
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (onlineProviders.length === providers.length && providers.length > 0) {
      status = 'healthy';
    } else if (onlineProviders.length > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      providers,
      cacheStatus: this.config.enableCaching ? 'enabled' : 'disabled',
      lastCheck: new Date(),
    };
  }

  // Configuration getters
  isSystemReady(): boolean {
    return this.isSetup;
  }

  getConfig(): Required<AISetupConfig> {
    return { ...this.config };
  }

  getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    if (this.config.openaiApiKey) {
      providers.push('OpenAI GPT-4o-mini');
    }
    
    if (this.config.geminiApiKey) {
      providers.push('Google Gemini');
    }
    
    return providers;
  }

  // Clear cache and reset
  async reset(): Promise<void> {
    console.log('🔄 Resetting AI system...');
    
    aiRecipeManager.clearCache();
    this.isSetup = false;
    
    console.log('✅ AI system reset completed');
  }

  // Update configuration
  updateConfig(newConfig: Partial<AISetupConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      defaultOptions: {
        ...this.config.defaultOptions,
        ...newConfig.defaultOptions,
      },
    };

    console.log('⚙️ AI system configuration updated');
  }
}

// Export singleton instance
export const apiSetup = new APISetup();

// Legacy function for backward compatibility
export async function setupApiManager(config?: any): Promise<void> {
  return apiSetup.setupApiManager(config);
}

// Auto-setup on import
apiSetup.setupAISystem().then(result => {
  if (result.success) {
    console.log('🚀 AI system auto-initialized with providers:', result.availableProviders);
  } else {
    console.warn('⚠️ AI system auto-initialization had issues:', result.errors);
  }
}).catch(error => {
  console.error('❌ AI system auto-initialization failed:', error);
});