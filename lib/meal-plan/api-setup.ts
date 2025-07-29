// lib/meal-plan/api-setup.ts
import { apiManager } from './api-manager';

export function setupApiManager(config: {
  rapidApiKey?: string;
  spoonacularHost?: string;
  tastyHost?: string;
  themealdbHost?: string;
}): void {
  // RapidAPI üzerinden Spoonacular
  if (config.rapidApiKey && config.spoonacularHost) {
    apiManager.registerApi({
      source: 'spoonacular',
      apiKey: config.rapidApiKey,
      host: config.spoonacularHost,
      isActive: true,
      priority: 1 // En yüksek öncelik
    });
  }

  // RapidAPI üzerinden Tasty API
  if (config.rapidApiKey && config.tastyHost) {
    apiManager.registerApi({
      source: 'tasty',
      apiKey: config.rapidApiKey,
      host: config.tastyHost,
      isActive: true,
      priority: 2
    });
  }

  // RapidAPI üzerinden TheMealDB
  if (config.rapidApiKey && config.themealdbHost) {
    apiManager.registerApi({
      source: 'themealdb',
      apiKey: config.rapidApiKey,
      host: config.themealdbHost,
      isActive: true,
      priority: 3 // En düşük öncelik
    });
  }
}
