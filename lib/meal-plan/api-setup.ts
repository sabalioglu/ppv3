// lib/meal-plan/api-setup.ts
import { apiManager } from './api-manager';

export function setupApiManager(config: {
  spoonacularApiKey?: string;
  tastyApiKey?: string;
  themealdbApiKey?: string;
}): void {
  // Register Spoonacular (primary API)
  if (config.spoonacularApiKey) {
    apiManager.registerApi({
      source: 'spoonacular',
      apiKey: config.spoonacularApiKey,
      isActive: true,
      priority: 1 // Highest priority
    });
  }

  // Register Tasty API (secondary API)
  if (config.tastyApiKey) {
    apiManager.registerApi({
      source: 'tasty',
      apiKey: config.tastyApiKey,
      isActive: true,
      priority: 2
    });
  }

  // Register TheMealDB (tertiary API, free)
  apiManager.registerApi({
    source: 'themealdb',
    apiKey: config.themealdbApiKey || '', // TheMealDB has a free tier that doesn't require an API key
    isActive: true,
    priority: 3 // Lowest priority
  });
}