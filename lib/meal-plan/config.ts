// lib/meal-plan/config.ts
export interface RecipeApiConfig {
  rapidApiKey?: string;
  spoonacularHost?: string;
  tastyHost?: string;
  themealdbHost?: string;
  preferApi: boolean;
  enhanceAiRecipes: boolean;
  fallbackToAi: boolean;
  validateResults: boolean;
  defaultApiSource: 'spoonacular' | 'tasty' | 'themealdb';
  cacheTtl: number; // milliseconds
}

class ConfigManager {
  private config: RecipeApiConfig = {
    preferApi: true,
    enhanceAiRecipes: true,
    fallbackToAi: true,
    validateResults: true,
    defaultApiSource: 'spoonacular',
    cacheTtl: 3600000 // 1 saat
  };
  
  setConfig(newConfig: Partial<RecipeApiConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
  
  getConfig(): RecipeApiConfig {
    return { ...this.config };
  }
}

export const configManager = new ConfigManager();