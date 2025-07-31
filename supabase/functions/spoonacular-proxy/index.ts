import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Consistent environment variable names
const SPOONACULAR_API_KEY = Deno.env.get('SPOONACULAR_API_KEY');
const SPOONACULAR_API_HOST = Deno.env.get('SPOONACULAR_API_HOST') || 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
      });
    }

    const { action, userId, data } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      },
    });

    switch (action) {
      case 'findRecipesByPantry':
        return await handleFindRecipesByPantry(supabase, userId, data);
      case 'getRecipeDetails':
        return await handleGetRecipeDetails(data.recipeId);
      case 'generateMealPlan':
        return await handleGenerateMealPlan(data);
      case 'complexSearch':
        return await handleComplexSearch(data);
      default:
        return new Response(JSON.stringify({
          error: 'Unknown action',
          supportedActions: ['findRecipesByPantry', 'getRecipeDetails', 'generateMealPlan', 'complexSearch']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: Deno.env.get('ENVIRONMENT') === 'dev' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function handleFindRecipesByPantry(supabase, userId, data = {}) {
  const cacheKey = `pantry_recipes_${userId}`;
  const cacheTTL = 3600 * 1000; // 1 hour in ms

  const { data: cachedData } = await supabase
    .from('recipe_cache')
    .select('data, created_at')
    .eq('key', cacheKey)
    .single();

  if (cachedData && (Date.now() - new Date(cachedData.created_at).getTime() < cacheTTL)) {
    console.log('Using cached recipe results for user:', userId);
    return new Response(JSON.stringify({
      source: 'cache',
      data: cachedData.data,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data: pantryItems, error } = await supabase
    .from('pantry_items')
    .select('name')
    .eq('user_id', userId);

  if (error) {
    console.error('Pantry fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pantry items' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (!pantryItems || pantryItems.length === 0) {
    return new Response(JSON.stringify({ data: [] }), // Return empty data instead of error
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const ingredients = pantryItems.map(item => item.name).join(',');
  const params = new URLSearchParams({
    ingredients: ingredients,
    number: data.number || '10',
    ranking: data.ranking || '1',
    ignorePantry: data.ignorePantry || 'false'
  });

  const response = await fetch(
    `https://${SPOONACULAR_API_HOST}/recipes/findByIngredients?${params.toString()}`,
    {
      headers: { 'X-RapidAPI-Key': SPOONACULAR_API_KEY || '', 'X-RapidAPI-Host': SPOONACULAR_API_HOST }
    }
  );

  if (!response.ok) {
    console.error('Spoonacular API error:', await response.text());
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const recipes = await response.json();
  const enhancedRecipes = recipes.map(recipe => {
    const totalIngredients = recipe.usedIngredientCount + recipe.missedIngredientCount;
    const matchPercentage = totalIngredients > 0
      ? Math.round((recipe.usedIngredientCount / totalIngredients) * 100)
      : 0;
    return { ...recipe, matchPercentage };
  });

  await supabase.from('recipe_cache').upsert({
    key: cacheKey,
    user_id: userId,
    data: enhancedRecipes,
    created_at: new Date().toISOString()
  });

  return new Response(JSON.stringify({ source: 'api', data: enhancedRecipes }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetRecipeDetails(recipeId) {
  if (!recipeId) {
    return new Response(JSON.stringify({ error: 'Recipe ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const params = new URLSearchParams({ includeNutrition: 'true' });
  const response = await fetch(
    `https://${SPOONACULAR_API_HOST}/recipes/${recipeId}/information?${params.toString()}`,
    {
      headers: { 'X-RapidAPI-Key': SPOONACULAR_API_KEY || '', 'X-RapidAPI-Host': SPOONACULAR_API_HOST }
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const recipeDetails = await response.json();
  return new Response(JSON.stringify({ source: 'api', data: recipeDetails }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGenerateMealPlan(data = {}) {
  const params = new URLSearchParams();
  ['timeFrame', 'targetCalories', 'diet', 'exclude'].forEach(p => {
    if (data[p]) params.append(p, data[p].toString());
  });

  const response = await fetch(
    `https://${SPOONACULAR_API_HOST}/mealplanner/generate?${params.toString()}`,
    {
      headers: { 'X-RapidAPI-Key': SPOONACULAR_API_KEY || '', 'X-RapidAPI-Host': SPOONACULAR_API_HOST }
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const mealPlan = await response.json();
  return new Response(JSON.stringify({ source: 'api', data: mealPlan }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleComplexSearch(data = {}) {
  const params = new URLSearchParams();
  const fields = ['query', 'cuisine', 'diet', 'intolerances', 'type', 'includeIngredients', 'excludeIngredients', 'maxReadyTime', 'sort'];

  fields.forEach(field => {
    if (data[field]) params.append(field, data[field]);
  });

  params.append('number', data.number || '10');
  params.append('offset', data.offset || '0');
  params.append('addRecipeInformation', data.addRecipeInformation || 'true');
  params.append('fillIngredients', data.fillIngredients || 'true');

  const response = await fetch(
    `https://${SPOONACULAR_API_HOST}/recipes/complexSearch?${params.toString()}`,
    {
      headers: { 'X-RapidAPI-Key': SPOONACULAR_API_KEY || '', 'X-RapidAPI-Host': SPOONACULAR_API_HOST }
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const searchResults = await response.json();
  return new Response(JSON.stringify({ source: 'api', data: searchResults }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
