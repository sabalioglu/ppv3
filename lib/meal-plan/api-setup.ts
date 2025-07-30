import { apiManager } from './api-manager';

export function setupApiManager(config: {
  rapidApiKey?: string;
  spoonacularHost?: string;
  themealdbHost?: string;
}): void {
  console.log('🚀 Setting up API Manager with RapidAPI');

  // 1. Öncelik: Spoonacular (RapidAPI üzerinden)
  if (config.rapidApiKey && config.spoonacularHost) {
    console.log('📡 Registering Spoonacular API (RapidAPI - Primary)');
    apiManager.registerApi({
      source: 'spoonacular',
      apiKey: config.rapidApiKey, // RapidAPI key
      host: config.spoonacularHost, // RapidAPI host
      isActive: true,
      priority: 1
    });
  }

  // 2. Fallback: TheMealDB (RapidAPI üzerinden)
  if (config.rapidApiKey && config.themealdbHost) {
    console.log('🔄 Registering TheMealDB API (RapidAPI - Fallback)');
    apiManager.registerApi({
      source: 'themealdb',
      apiKey: config.rapidApiKey, // Aynı RapidAPI key
      host: config.themealdbHost, // RapidAPI host
      isActive: true,
      priority: 2
    });
  }

  console.log('✅ API Manager setup completed');
}
