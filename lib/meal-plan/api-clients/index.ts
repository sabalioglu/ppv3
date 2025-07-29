// lib/meal-plan/api-clients/index.ts

import { ApiProvider, ApiClientConfig, RecipeApiClient } from './types';
import { SpoonacularApiClient } from './spoonacular-client';
import { TastyApiClient } from './tasty-client';
import { TheMealDBApiClient } from './themealdb-client';

// Export all client classes for individual use if needed
export { SpoonacularApiClient } from './spoonacular-client';
export { TastyApiClient } from './tasty-client';
export { TheMealDBApiClient } from './themealdb-client';
export * from './types';

/**
 * A factory function that creates and returns an instance of a recipe API client
 * based on the specified provider.
 *
 * @param provider - The API provider to create a client for (e.g., ApiProvider.SPOONACULAR).
 * @param config - The configuration object for the API client, typically containing an API key.
 * @returns An instance of a class that extends RecipeApiClient.
 * @throws An error if an unknown provider is specified.
 */
export const ApiClientFactory = (
  provider: ApiProvider,
  config: Omit<ApiClientConfig, 'baseUrl'> // baseUrl is set within each client
): RecipeApiClient => {
  switch (provider) {
    case ApiProvider.SPOONACULAR:
      return new SpoonacularApiClient({
        apiKey: config.apiKey,
        baseUrl: 'https://api.spoonacular.com', // Default, will be overridden
      });
    case ApiProvider.TASTY:
      return new TastyApiClient({
        apiKey: config.apiKey,
        baseUrl: 'https://tasty.p.rapidapi.com', // Default, will be overridden
      });
    case ApiProvider.THEMEALDB:
      return new TheMealDBApiClient({
        apiKey: config.apiKey || '1', // TheMealDB uses '1' as a public key
        baseUrl: 'https://www.themealdb.com/api/json/v1/', // Default, will be overridden
      });
    default:
      // This ensures that if we add a new provider, we must handle it here.
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown API provider: ${exhaustiveCheck}`);
  }
};
