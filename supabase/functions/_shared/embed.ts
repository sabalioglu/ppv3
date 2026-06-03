// Shared helpers for the Stovd recipe engine edge functions.
// Embeddings use Supabase's built-in gte-small model (384 dims, open-source, runs in-edge, free).

// deno-lint-ignore no-explicit-any
declare const Supabase: any;

/** Embed text -> 384-dim normalized vector using the in-edge gte-small model. */
export async function embed(text: string): Promise<number[]> {
  const session = new Supabase.ai.Session('gte-small');
  const out = await session.run(text, { mean_pool: true, normalize: true });
  return out as number[];
}

/** Normalize a list of ingredient objects to a deduped lowercase name array (for overlap filtering). */
export function normalizeIngredientNames(
  items: Array<{ name?: string } | string>,
): string[] {
  const names = items
    .map((i) => (typeof i === 'string' ? i : (i?.name ?? '')))
    .map((n) => n.toLowerCase().trim())
    // strip quantities/units noise like "2 cups " left in names
    .map((n) =>
      n
        .replace(
          /^\d+[\d/.\s]*(g|kg|ml|l|cups?|tbsp|tsp|oz|lb|pcs?|cloves?)?\s*/i,
          '',
        )
        .trim(),
    )
    .filter(Boolean);
  return [...new Set(names)];
}

/** Build the text we embed for a recipe (title + cuisine + ingredients). */
export function recipeEmbeddingText(r: {
  title: string;
  cuisine?: string | null;
  ingredient_names: string[];
  tags?: string[];
}): string {
  return [
    r.title,
    r.cuisine ? `Cuisine: ${r.cuisine}` : '',
    `Ingredients: ${r.ingredient_names.join(', ')}`,
    r.tags?.length ? `Tags: ${r.tags.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
