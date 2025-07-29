// lib/meal-plan/api-clients/index.ts

import { ApiProvider, ApiClientConfig, RecipeApiClient } from './types';
import { SpoonacularApiClient } from './spoonacular-client';
import { TastyApiClient } from './tasty-client';
import { TheMealDbApiClient } from './themealdb-client';

/**
 * Belirtilen API sağlayıcısı için uygun istemciyi oluşturur
 */
export function createApiClient(config: ApiClientConfig): RecipeApiClient {
  switch (config.provider) {
    case ApiProvider.SPOONACULAR:
      return new SpoonacularApiClient(config);
    case ApiProvider.TASTY:
      return new TastyApiClient(config);
    case ApiProvider.THEMEALDB:
      return new TheMealDbApiClient(config);
    default:
      throw new Error(`Unsupported API provider: ${config.provider}`);
  }
}

// Tipleri ve sınıfları dışa aktar
export * from './types';
export * from './spoonacular-client';
export * from './tasty-client';
export * from './themealdb-client';
