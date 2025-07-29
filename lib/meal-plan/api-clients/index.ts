// lib/meal-plan/api-clients/index.ts
import { RecipeApiClient } from './types';
import { SpoonacularApiClient } from './spoonacular-client';
import { TastyApiClient } from './tasty-client';
import { TheMealDbApiClient } from './themealdb-client';

export type ApiSource = 'spoonacular' | 'tasty' | 'themealdb';

// Host parametresini ekleyin
export function createApiClient(source: ApiSource, apiKey: string, host?: string): RecipeApiClient {
  switch (source) {
    case 'spoonacular':
      return new SpoonacularApiClient(apiKey, host);
    case 'tasty':
      return new TastyApiClient(apiKey, host);
    case 'themealdb':
      return new TheMealDbApiClient(apiKey, host);
    default:
      throw new Error(`Unknown API source: ${source}`);
  }
}
