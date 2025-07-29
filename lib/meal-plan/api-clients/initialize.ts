// lib/meal-plan/initialize.ts
import { setupApiManager } from './api-setup';
import { configManager } from './config';
import { cacheManager } from './api-clients/cache-manager';

export function initializeRecipeApi(config: {
  rapidApiKey?: string;
  spoonacularHost?: string;
  tastyHost?: string;
  themealdbHost?: string;
  cacheTtl?: number;
  preferApi?: boolean;
  enhanceAiRecipes?: boolean;
  fallbackToAi?: boolean;
  validateResults?: boolean;
  defaultApiSource?: 'spoonacular' | 'tasty' | 'themealdb';
}): void {
  // Yapılandırmayı ayarla
  configManager.setConfig({
    preferApi: config.preferApi ?? true,
    enhanceAiRecipes: config.enhanceAiRecipes ?? true,
    fallbackToAi: config.fallbackToAi ?? true,
    validateResults: config.validateResults ?? true,
    defaultApiSource: config.defaultApiSource || 'spoonacular',
    cacheTtl: config.cacheTtl || 3600000
  });
  
  // API Yöneticisini ayarla
  setupApiManager({
    rapidApiKey: config.rapidApiKey,
    spoonacularHost: config.spoonacularHost,
    tastyHost: config.tastyHost,
    themealdbHost: config.themealdbHost
  });
  
  // Önbellek TTL'ini ayarla
  if (config.cacheTtl) {
    cacheManager.defaultTTL = config.cacheTtl;
  }
  
  console.log('Recipe API integration initialized');
}
