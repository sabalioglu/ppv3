// supabase/functions/spoonacular-api/cache.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchRecipesFromIngredients } from './recipe-services.ts';

const CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Creates a deterministic cache key from a list of ingredients.
 * Sorts ingredients to ensure the key is the same regardless of order.
 * @param ingredients A comma-separated string of ingredients.
 * @returns A stable cache key.
 */
function createCacheKey(ingredients: string): string {
  const sortedIngredients = ingredients.split(',').map(s => s.trim()).sort().join(',');
  return `recipes-by-ingredients:${sortedIngredients}`;
}

/**
 * Retrieves recipes from the cache or fetches them from the API if not cached or expired.
 * @param ingredients A comma-separated string of ingredients.
 * @param supabase An instance of the Supabase client.
 * @returns A promise that resolves to the recipe data.
 */
export async function getCachedOrFetchRecipes(ingredients: string, supabase: SupabaseClient) {
  const cacheKey = createCacheKey(ingredients);

  // 1. Check cache first
  try {
    const { data: cached, error } = await supabase
      .from('recipe_cache')
      .select('data, created_at')
      .eq('key', cacheKey)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 'Not a single row'
      console.warn(`Cache lookup failed for key "${cacheKey}":`, error.message);
    }

    // 2. If a valid, non-expired cache entry is found, return it
    if (cached && (Date.now() - new Date(cached.created_at).getTime() < CACHE_TTL_MS)) {
      console.log(`[CACHE HIT] Returning cached data for key: "${cacheKey}"`);
      return cached.data;
    }

    if (cached) {
      console.log(`[CACHE STALE] Stale data found for key: "${cacheKey}"`);
    } else {
      console.log(`[CACHE MISS] No data found for key: "${cacheKey}"`);
    }

  } catch (e) {
    console.error(`An unexpected error occurred during cache lookup:`, e);
  }

  // 3. If not in cache or expired, fetch from API
  console.log(`[API FETCH] Fetching fresh data for key: "${cacheKey}"`);
  const freshData = await fetchRecipesFromIngredients(ingredients);

  // 4. Don't cache empty or invalid responses
  if (!freshData || !Array.isArray(freshData) || freshData.length === 0) {
    console.warn('API returned no data. Not caching response.');
    return freshData;
  }

  // 5. Save the fresh data to the cache
  try {
    const { error: cacheError } = await supabase
      .from('recipe_cache')
      .upsert({
        key: cacheKey,
        data: freshData,
        created_at: new Date().toISOString(),
      });

    if (cacheError) {
      console.error(`[CACHE WRITE FAILED] Could not cache data for key "${cacheKey}":`, cacheError.message);
    } else {
      console.log(`[CACHE WRITE SUCCESS] Successfully cached data for key "${cacheKey}"`);
    }
  } catch(e) {
      console.error(`An unexpected error occurred during cache write:`, e);
  }

  return freshData;
}
