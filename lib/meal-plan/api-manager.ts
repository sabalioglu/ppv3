// lib/meal-plan/api-manager.ts

import { RecipeApiClient, ApiProvider, RecipeSearchParams, ApiRecipe } from './api-clients';
import { ApiClientFactory } from './api-clients';
import { ApiCache } from './api-cache';

// Configuration for each provider, including priority
interface ApiProviderConfig {
  provider: ApiProvider;
  client: RecipeApiClient;
  priority: number; // Lower number means higher priority
}

/**
 * Manages multiple recipe API clients, handling request orchestration,
 * priority, fallback strategies, and caching.
 */
export class ApiManager {
  private clients: ApiProviderConfig[];
  private cache: ApiCache<ApiRecipe[]>;

  constructor(apiKeyConfig: Record<ApiProvider, string>) {
    // Initialize cache (e.g., 1-hour TTL)
    this.cache = new ApiCache<ApiRecipe[]>(3600);

    // Define API clients with their priorities
    this.clients = [
      {
        provider: ApiProvider.SPOONACULAR,
        client: ApiClientFactory(ApiProvider.SPOONACULAR, { apiKey: apiKeyConfig.SPOONACULAR }),
        priority: 1,
      },
      {
        provider: ApiProvider.TASTY,
        client: ApiClientFactory(ApiProvider.TASTY, { apiKey: apiKeyConfig.TASTY }),
        priority: 2,
      },
      {
        provider: ApiProvider.THEMEALDB,
        client: ApiClientFactory(ApiProvider.THEMEALDB, { apiKey: apiKeyConfig.THEMEALDB }),
        priority: 3, // Lowest priority, used as a fallback
      },
    ].sort((a, b) => a.priority - b.priority); // Sort clients by priority
  }

  /**
   * Searches for recipes by trying each configured API in order of priority.
   * Implements a fallback mechanism.
   * @param params - The search parameters.
   * @returns A promise that resolves to an array of recipes from the first successful API call.
   */
  async searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]> {
    const cacheKey = ApiCache.generateKey('search', params);
    const cachedResult = this.cache.get(cacheKey);

    if (cachedResult) {
      console.log('Serving search results from cache.');
      return cachedResult;
    }

    console.log('Searching recipes via API...');
    for (const { provider, client } of this.clients) {
      try {
        const results = await client.searchRecipes(params);
        if (results && results.length > 0) {
          console.log(`Successfully fetched recipes from ${provider}.`);
          this.cache.set(cacheKey, results);
          return results;
        }
      } catch (error) {
        console.error(`API call to ${provider} failed:`, error);
        // Continue to the next client (fallback)
      }
    }

    console.warn('All API providers failed to return search results.');
    return []; // Return empty array if all APIs fail
  }

  /**
   * Fetches recipe details from a specific provider.
   * This method does not use a fallback chain, as the ID is provider-specific.
   * @param id - The recipe ID.
   * @param provider - The provider from which to fetch the recipe.
   * @returns A promise resolving to the recipe details or null.
   */
  async getRecipeDetails(id: string | number, provider: ApiProvider): Promise<ApiRecipe | null> {
    const cacheKey = ApiCache.generateKey(`details:${provider}`, { id });
    const cachedResult = this.cache.get(cacheKey);
    // Note: This caches an array with one item, so we adjust.
    if (cachedResult && cachedResult[0]) {
      console.log('Serving recipe details from cache.');
      return cachedResult[0];
    }

    const clientConfig = this.clients.find(c => c.provider === provider);
    if (!clientConfig) {
      throw new Error(`No client configured for provider: ${provider}`);
    }

    try {
      const result = await clientConfig.client.getRecipeDetails(id);
      if (result) {
        this.cache.set(cacheKey, [result]); // Cache as an array for consistency
      }
      return result;
    } catch (error) {
      console.error(`Failed to get details for recipe ${id} from ${provider}:`, error);
      return null;
    }
  }

  /**
   * Fetches trending recipes, trying each API in order of priority.
   * @returns A promise resolving to an array of trending recipes.
   */
  async getTrendingRecipes(): Promise<ApiRecipe[]> {
    const cacheKey = 'trending';
    const cachedResult = this.cache.get(cacheKey);

    if (cachedResult) {
      console.log('Serving trending recipes from cache.');
      return cachedResult;
    }

    for (const { provider, client } of this.clients) {
      try {
        const results = await client.getTrendingRecipes();
        if (results && results.length > 0) {
          console.log(`Successfully fetched trending recipes from ${provider}.`);
          this.cache.set(cacheKey, results);
          return results;
        }
      } catch (error) {
        console.error(`API call for trending recipes to ${provider} failed:`, error);
      }
    }

    return [];
  }
}
