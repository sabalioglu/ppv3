// lib/meal-plan/api-setup.ts
import { apiManager } from './api-manager';

export function setupApiManager(config: {
  spoonacularApiKey?: string;
  theMealDbApiKey?: string; // Genellikle ücretsiz API için '1' kullanılır
}): void {
  // Doğrudan Spoonacular entegrasyonu
  if (config.spoonacularApiKey) {
    apiManager.registerApi({
      source: 'spoonacular',
      apiKey: config.spoonacularApiKey,
      // Host belirtilmediğinde istemci varsayılan adresi (api.spoonacular.com) kullanacak
      isActive: true,
      priority: 1 // En yüksek öncelik
    });
  }

  // Ücretsiz TheMealDB entegrasyonu
  if (config.theMealDbApiKey) {
    apiManager.registerApi({
      source: 'themealdb',
      apiKey: config.theMealDbApiKey,
      // Host belirtilmediğinde istemci varsayılan adresi (www.themealdb.com) kullanacak
      isActive: true,
      priority: 2 // Yedek (fallback) önceliği
    });
  }
}
