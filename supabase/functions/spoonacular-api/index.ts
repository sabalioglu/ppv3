// supabase/functions/spoonacular-api/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCachedOrFetchRecipes } from './cache.ts';

console.log('🚀 spoonacular-api function initialized');

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getPantryIngredients(supabase: SupabaseClient, userId: string): Promise<string> {
  console.log(`Fetching pantry for user: ${userId}`);
  const { data: pantryItems, error } = await supabase
    .from('pantry_items') // Assuming the table is named 'pantry_items'
    .select('name')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching pantry:', error);
    throw new Error('Could not fetch user pantry.');
  }

  if (!pantryItems || pantryItems.length === 0) {
    console.log(`Pantry is empty for user: ${userId}`);
    return '';
  }

  const ingredients = pantryItems.map(item => item.name).join(',');
  console.log(`Found ingredients: ${ingredients}`);
  return ingredients;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. Extract user ID from the request body
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Get ingredients from the user's pantry
    const ingredients = await getPantryIngredients(supabase, userId);
    if (!ingredients) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Get recipes using the caching layer
    const recipes = await getCachedOrFetchRecipes(ingredients, supabase);

    // 5. Return the recipes
    return new Response(JSON.stringify(recipes), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in spoonacular-api function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
