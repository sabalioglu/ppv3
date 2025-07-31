// supabase/functions/spoonacular-api/recipe-services.ts
import "https://deno.land/x/dotenv/load.ts";

/**
 * Fetches recipes from the Spoonacular API based on a list of ingredients.
 * @param ingredients A comma-separated string of ingredients.
 * @param numberOfResults The number of recipes to return.
 * @returns A promise that resolves to the JSON response from the API.
 */
export async function fetchRecipesFromIngredients(
  ingredients: string,
  numberOfResults: number = 10
) {
  const apiKey = Deno.env.get('SPOONACULAR_API_KEY');
  const apiHost = Deno.env.get('SPOONACULAR_API_HOST') || 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com';

  if (!apiKey) {
    console.error('SPOONACULAR_API_KEY environment variable not set.');
    throw new Error('Spoonacular API key is not configured.');
  }

  const queryParams = new URLSearchParams({
    ingredients: ingredients,
    number: String(numberOfResults),
    // ranking=1: Maximize used ingredients, minimize missing ingredients
    ranking: '1',
    // ignorePantry=true: Considers only the provided ingredients
    ignorePantry: 'true',
  });

  const url = `https://${apiHost}/recipes/findByIngredients?${queryParams}`;

  console.log(`Fetching recipes from Spoonacular: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Spoonacular API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch recipes from Spoonacular. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} recipes.`);
    return data;

  } catch (error) {
    console.error('An unexpected error occurred while fetching from Spoonacular:', error);
    throw new Error('An unexpected error occurred while fetching recipes.');
  }
}
