// lib/meal-plan/api-manager.ts
import { 
  Recipe, 
  RecipeApiClient, 
  RecipeSearchParams, 
  RecipeSearchResult 
} from './api-clients/types';
import { ApiSource, createApiClient } from './api-clients';
import { cacheManager } from './api-clients/cache-manager';

interface ApiConfig {
  apiKey: string;
  source: ApiSource;
  host?: string;
  isActive: boolean;
  priority: number;
}

export class ApiManager {
  private apiClients: Map<ApiSource, RecipeApiClient>;
  private apiConfigs: Map<ApiSource, ApiConfig>;
  private activeApis: ApiSource[];

  constructor() {
    this.apiClients = new Map();
    this.apiConfigs = new Map();
    this.activeApis = [];
  }

  registerApi(config: ApiConfig): void {
    this.apiConfigs.set(config.source, config);
    
    if (config.isActive) {
      const client = createApiClient(config.source, config.apiKey, config.host);
      this.apiClients.set(config.source, client);
      
      // Sort active APIs by priority
      this.activeApis.push(config.source);
      this.activeApis.sort((a, b) => 
        (this.apiConfigs.get(a)?.priority || 0) - 
        (this.apiConfigs.get(b)?.priority || 0)
      );
    }
  }

  async searchRecipes(
    params: RecipeSearchParams, 
    preferredApi?: ApiSource
  ): Promise<RecipeSearchResult> {
    // If preferred API is specified and active, try it first
    if (preferredApi && this.activeApis.includes(preferredApi)) {
      try {
        const client = this.apiClients.get(preferredApi)!;
        return await client.searchRecipes(params);
      } catch (error) {
        console.error(`Error with preferred API ${preferredApi}:`, error);
        // Fall through to try other APIs
      }
    }

    // Try APIs in priority order
    let lastError: Error | null = null;

    for (const apiSource of this.activeApis) {
      if (apiSource === preferredApi) continue; // Skip if we already tried it

      try {
        const client = this.apiClients.get(apiSource)!;
        return await client.searchRecipes(params);
      } catch (error) {
        console.error(`Error with API ${apiSource}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error('All API requests failed');
  }

  async getRecipeById(
    id: string, 
    apiSource?: ApiSource
  ): Promise<Recipe> {
    if (apiSource) {
      try {
        const client = this.apiClients.get(apiSource);
        if (client) {
          return await client.getRecipeById(id);
        }
      } catch (error) {
        console.error(`Error fetching recipe ${id} from ${apiSource}:`, error);
        // Fall through to try other APIs
      }
    }

    // If apiSource not specified or request failed, extract API source from ID if possible
    const [source, recipeId] = this.parseRecipeId(id);
    
    if (source && this.apiClients.has(source)) {
      try {
        const client = this.apiClients.get(source)!;
        return await client.getRecipeById(recipeId);
      } catch (error) {
        console.error(`Error fetching recipe ${recipeId} from ${source}:`, error);
        // Fall through to try other APIs
      }
    }

    // Try all active APIs as last resort
    let lastError: Error | null = null;

    for (const apiSource of this.activeApis) {
      try {
        const client = this.apiClients.get(apiSource)!;
        return await client.getRecipeById(id);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error(`Recipe with ID ${id} not found in any API`);
  }

  async getRandomRecipes(
    params: { tags?: string; number?: number },
    preferredApi?: ApiSource
  ): Promise<Recipe[]> {
    // If preferred API is specified and active, try it first
    if (preferredApi && this.activeApis.includes(preferredApi)) {
      try {
        const client = this.apiClients.get(preferredApi)!;
        return await client.getRandomRecipes(params);
      } catch (error) {
        console.error(`Error with preferred API ${preferredApi}:`, error);
        // Fall through to try other APIs
      }
    }

    // Try APIs in priority order
    let lastError: Error | null = null;

    for (const apiSource of this.activeApis) {
      if (apiSource === preferredApi) continue; // Skip if we already tried it

      try {
        const client = this.apiClients.get(apiSource)!;
        return await client.getRandomRecipes(params);
      } catch (error) {
        console.error(`Error with API ${apiSource}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error('All API requests failed');
  }

  clearCache(namespace?: string): void {
    if (namespace) {
      cacheManager.invalidateByNamespace(namespace);
    } else {
      cacheManager.clear();
    }
  }

  // Utility to parse composite recipe IDs in format "source:id"
  private parseRecipeId(id: string): [ApiSource | null, string] {
    const parts = id.split(':');
    if (parts.length === 2 && this.isValidApiSource(parts[0] as ApiSource)) {
      return [parts[0] as ApiSource, parts[1]];
    }
    return [null, id];
  }

  private isValidApiSource(source: string): source is ApiSource {
    return ['spoonacular', 'themealdb'].includes(source);
  }
}

// Create a singleton instance
export const apiManager = new ApiManager();
