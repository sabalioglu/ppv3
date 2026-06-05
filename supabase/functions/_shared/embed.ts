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

/**
 * Feed a user-imported / user-added recipe into recipe_corpus so it enriches RAG
 * retrieval for everyone (community flywheel). Fire-and-forget: never throw — a
 * corpus-feed failure must not break the import the user actually asked for.
 *
 * Dedupes per owner by lowercased title so re-importing the same recipe is a no-op.
 * `admin` must be a service-role client (corpus insert bypasses RLS).
 */
// deno-lint-ignore no-explicit-any
export async function feedCorpus(
  admin: any,
  userId: string,
  // deno-lint-ignore no-explicit-any
  recipe: Record<string, any>,
  source: 'imported' | 'user' = 'imported',
): Promise<void> {
  try {
    const title = (recipe.title ?? '').trim();
    if (!title) return;
    const ingredient_names = normalizeIngredientNames(recipe.ingredients ?? []);
    if (!ingredient_names.length) return;

    // dedupe by (owner, lower(title))
    const { data: existing } = await admin
      .from('recipe_corpus')
      .select('id')
      .eq('owner_user_id', userId)
      .ilike('title', title)
      .maybeSingle();
    if (existing) return;

    const steps: string[] = Array.isArray(recipe.steps)
      ? recipe.steps.filter(Boolean)
      : Array.isArray(recipe.instructions)
        ? recipe.instructions
            .map((s) => (typeof s === 'string' ? s : (s?.instruction ?? '')))
            .filter(Boolean)
        : [];

    const row = {
      source,
      external_id: null,
      title,
      cuisine: recipe.cuisine ?? null,
      ingredients: recipe.ingredients ?? [],
      ingredient_names,
      steps,
      skill_level: null,
      image_url: recipe.image_url ?? recipe.imageUrl ?? null,
      tags: recipe.tags ?? [],
      owner_user_id: userId,
    };
    const embedding = await embed(recipeEmbeddingText(row));
    await admin.from('recipe_corpus').insert({ ...row, embedding });
  } catch (_e) {
    // swallow — corpus enrichment is best-effort
  }
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
