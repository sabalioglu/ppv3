// lib/meal-plan/edge-client.ts
import { supabase } from '@/lib/supabase';

/**
 * Invokes the 'spoonacular-api' edge function to get recipe recommendations
 * based on the user's pantry.
 *
 * @returns {Promise<any>} A promise that resolves with the recipe recommendations.
 * @throws {Error} If the edge function invocation fails.
 */
export async function getRecipesFromPantry() {
  // First, get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User is not authenticated.');
  }

  console.log(`[Edge-Client] Invoking 'spoonacular-api' for user: ${user.id}`);

  const { data, error } = await supabase.functions.invoke('spoonacular-api', {
    body: { userId: user.id },
  });

  if (error) {
    console.error("[Edge-Client] Error invoking 'spoonacular-api':", error);
    throw new Error(`Failed to get recipe recommendations: ${error.message}`);
  }

  console.log('[Edge-Client] Successfully received data from edge function.');
  return data;
}
