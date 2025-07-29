// lib/meal-plan/api-clients/types.ts

import { Meal } from '@/lib/meal-plan/types';

/**
 * Enum for identifying different recipe API providers.
 */
export enum ApiProvider {
  SPOONACULAR = 'SPOONACULAR',
  TASTY = 'TASTY',
  THEMEALDB = 'THEMEALDB',
}

/**
 * Configuration for an API client.
 */
export interface ApiClientConfig {
  apiKey?: string;
  baseUrl: string;
}

/**
 * Defines the structure for a recipe search query.
 */
export interface RecipeSearchParams {
  query?: string;
  ingredients?: string[];
  cuisine?: string;
  diet?: string;
  maxReadyTime?: number;
  offset?: number;
  number?: number;
}

/**
 * Represents a standardized recipe object returned by any API client.
 * This ensures consistency across different data sources.
 */
export interface ApiRecipe extends Omit<Meal, 'id' | 'source'> {
  id: string | number; // API-specific ID
  source: ApiProvider;
  sourceUrl?: string;
  healthScore?: number;
}

/**
 * Abstract class defining the contract for all recipe API clients.
 * Each client must implement these methods to ensure a consistent interface.
 */
export abstract class RecipeApiClient {
  protected readonly config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Searches for recipes based on a set of parameters.
   * @param params - The search parameters.
   * @returns A promise that resolves to an array of standardized recipes.
   */
  abstract searchRecipes(params: RecipeSearchParams): Promise<ApiRecipe[]>;

  /**
   * Fetches the detailed information for a specific recipe by its ID.
   * @param id - The unique identifier for the recipe.
   * @returns A promise that resolves to a single standardized recipe, or null if not found.
   */
  abstract getRecipeDetails(id: string | number): Promise<ApiRecipe | null>;

  /**
   * Fetches a list of trending or popular recipes.
   * @returns A promise that resolves to an array of standardized recipes.
   */
  abstract getTrendingRecipes(): Promise<ApiRecipe[]>;
}
