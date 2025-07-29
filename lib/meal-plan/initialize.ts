// lib/meal-plan/initialize.ts
import { setupApiManager } from './api-setup';
import { configManager, RecipeApiConfig } from './config';
import { cacheManager } from './api-clients/cache-manager';

export function initializeRecipeApi(config: Partial<RecipeApiConfig>): void {
  // Yapılandırmayı ayarla
  configManager.setConfig(config);
  
  // API Yöneticisini ayarla
  setupApiManager({
    spoonacularApiKey: config.spoonacularApiKey,
    tastyApiKey: config.tastyApiKey,
    themealdbApiKey: config.themealdbApiKey
  });
  
  // Önbellek TTL'ini ayarla
  if (config.cacheTtl) {
    cacheManager.defaultTTL = config.cacheTtl;
  }
  
  console.log('Recipe API integration initialized');
}