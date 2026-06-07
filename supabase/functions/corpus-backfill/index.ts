// corpus-backfill — feed the caller's existing user_recipes into recipe_corpus.
//
// Why: manually-added / older user_recipes rows never passed through the
// gte-small embed path (it only runs in the edge runtime, not on a plain
// client insert), so they don't enrich RAG retrieval. This fn embeds and
// inserts any of the caller's recipes that aren't in the corpus yet.
//
// Auth: requires the user's JWT (verify_jwt off; self-verify via getUser).
// Idempotent: feedCorpus() dedupes per (owner, lower(title)) — safe to re-run.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cors, json, feedCorpus } from '../_shared/embed.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'missing authorization' }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: 'invalid token' }, 401);

  const userId = user.id;

  // pull the caller's recipes (service-role; RLS bypass is fine — scoped by user_id)
  const { data: recipes, error: readErr } = await admin
    .from('user_recipes')
    .select('title, ingredients, instructions, category, image_url, tags')
    .eq('user_id', userId);

  if (readErr) return json({ error: 'read failed', detail: readErr.message }, 500);
  if (!recipes?.length) return json({ ok: true, total: 0, fed: 0 });

  for (const r of recipes) {
    // feedCorpus is fire-and-forget + dedupes by (owner, lower(title)).
    await feedCorpus(
      admin,
      userId,
      {
        title: r.title,
        cuisine: r.category ?? null,
        ingredients: r.ingredients ?? [],
        instructions: r.instructions ?? [],
        image_url: r.image_url ?? null,
        tags: r.tags ?? [],
      },
      'user',
    );
  }

  // report how many of the caller's recipes are now in the corpus
  const { count } = await admin
    .from('recipe_corpus')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', userId);

  return json({ ok: true, total: recipes.length, inCorpus: count ?? 0 });
});
