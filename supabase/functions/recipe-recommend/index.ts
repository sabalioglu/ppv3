// recipe-recommend — Stovd recipe engine (RAG).
// Auth: derives userId from the JWT (no body-trusted userId).
// Flow: pantry -> taste-aware query embedding -> match_recipes (pantry overlap + vector)
//       -> Gemini adapts top candidates to available ingredients + skill -> recommendations.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { embed, normalizeIngredientNames, json } from '../_shared/embed.ts';
import { checkQuota, quotaBody, recordUsage } from '../_shared/entitlement.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const GEMINI_MODEL = Deno.env.get('RECIPE_LLM_MODEL') ?? 'gemini-2.5-flash';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function geminiJSON(prompt: string): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({}, 204);

  // ---- auth: identity from token, never from body ----
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

  const body = await req.json().catch(() => ({}));
  const count: number = Math.min(body.count ?? 5, 8);
  const mealType: string = body.mealType ?? 'any';

  // ---- pantry: from body, else from pantry_items ----
  let pantryNames: string[] = Array.isArray(body.pantry) ? body.pantry : [];
  if (!pantryNames.length) {
    const { data: items } = await admin
      .from('pantry_items')
      .select('name')
      .eq('user_id', userId);
    pantryNames = (items ?? []).map((i: { name: string }) => i.name);
  }
  const pantry = normalizeIngredientNames(
    pantryNames.map((n) => ({ name: n })),
  );
  if (!pantry.length)
    return json({ error: 'empty pantry', recommendations: [] }, 200);

  // ---- freemium gate: AI recipe generation is limited per month ----
  const meter = await checkQuota(admin, userId, 'ai_meal_plan');
  if (!meter.allowed) return json(quotaBody(meter), 402);

  // ---- taste profile (derive on the fly if missing) ----
  const { data: taste } = await admin
    .from('user_taste_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  let cuisines: string[] = taste?.cuisines ?? [];
  let skill: string = taste?.skill_level ?? 'intermediate';
  let allergies: string[] = taste?.allergies ?? [];
  let likedIngredients: string[] = taste?.liked_ingredients ?? [];

  if (!taste) {
    const { data: prof } = await admin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    cuisines = prof?.cuisine_preferences ?? prof?.cuisines ?? [];
    skill = prof?.cooking_skill ?? prof?.skill_level ?? 'intermediate';
    allergies = prof?.allergies ?? [];
    // liked recipes -> infer liked ingredients later; keep light for now
    const { data: liked } = await admin
      .from('recipe_feedback')
      .select('recipe_title,cuisine')
      .eq('user_id', userId)
      .in('action', ['saved', 'liked', 'cooked'])
      .limit(20);
    if (liked?.length)
      cuisines = [
        ...new Set([
          ...cuisines,
          ...liked.map((l: { cuisine?: string }) => l.cuisine).filter(Boolean),
        ]),
      ];
  }

  // ---- query embedding: taste + pantry aware ----
  const queryText = [
    cuisines.length ? `Preferred cuisines: ${cuisines.join(', ')}` : '',
    likedIngredients.length ? `Likes: ${likedIngredients.join(', ')}` : '',
    `Skill: ${skill}`,
    mealType !== 'any' ? `Meal: ${mealType}` : '',
    `Available ingredients: ${pantry.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');
  const queryEmbedding = await embed(queryText);

  // ---- retrieve: corpus is an OPTIONAL anchor (Gemini-first engine, $0 MVP).
  // The 265 hero recipes (TheMealDB, with images) ground & anchor when they match;
  // when nothing matches we let Gemini generate from the pantry directly. ----
  const { data: candidates } = await admin.rpc('match_recipes', {
    query_embedding: queryEmbedding,
    pantry,
    p_user_id: userId,
    match_count: 15,
    min_overlap: 1,
  });

  const slim = (candidates ?? [])
    .slice(0, 10)
    .map((c: Record<string, unknown>) => ({
      id: c.id,
      title: c.title,
      cuisine: c.cuisine,
      skill: c.skill_level,
      ingredients: c.ingredient_names,
      pantry_coverage: c.pantry_coverage,
      time: c.total_time_min,
      steps_preview: (c.steps as string[])?.slice(0, 2),
    }));

  // ---- LLM: adapt anchors if present, else generate from the pantry ----
  const candidateBlock = slim.length
    ? `CANDIDATE RECIPES (real, retrieved by ingredient overlap + taste — prefer adapting these; their ingredient lists are known-good):
${JSON.stringify(slim)}`
    : `No candidate recipes were retrieved. Generate ${count} well-known dishes that genuinely fit the pantry, the user's cuisines, and their skill. Set "candidate_id" to null for each.`;

  const prompt = `You are Stovd's cooking assistant. Recommend ${count} recipes the user can make NOW from their pantry.

USER:
- Pantry: ${pantry.join(', ')}
- Skill: ${skill}
- Preferred cuisines: ${cuisines.join(', ') || 'any'}
- Allergies (MUST avoid): ${allergies.join(', ') || 'none'}

${candidateBlock}

Rules:
- Maximize use of pantry items; adapt steps to the user's skill (simpler for beginner).
- For each: "uses_from_pantry" MUST contain ONLY items copied verbatim from the pantry list above; "missing_ingredients" = what's needed but absent (the shopping list). Suggest a substitution when a missing staple or allergen blocks the dish.
- Never include an allergen. If a dish can't be made safely/realistically from the pantry (+ a few common staples), skip it.

Return JSON: { "recommendations": [ { "candidate_id": "<id or null if freshly generated>", "title": "", "cuisine": "", "skill_level": "beginner|intermediate|advanced", "uses_from_pantry": [], "missing_ingredients": [], "total_time_min": 0, "servings": 2, "ingredients": [{"name":"","amount":""}], "steps": [""], "why": "one line why it fits" } ] }`;

  let result: { recommendations?: Array<Record<string, unknown>> };
  try {
    result = (await geminiJSON(prompt)) as {
      recommendations?: Array<Record<string, unknown>>;
    };
  } catch (e) {
    return json({ error: 'llm adapt failed', detail: String(e) }, 502);
  }

  // ---- deterministic guard: never claim a pantry item the user doesn't have ----
  const pantrySet = new Set(pantry);
  const recommendations = (result.recommendations ?? []).map((r) => {
    const uses = Array.isArray(r.uses_from_pantry) ? r.uses_from_pantry : [];
    return {
      ...r,
      uses_from_pantry: uses.filter((x) =>
        pantrySet.has(String(x).toLowerCase().trim()),
      ),
    };
  });

  await recordUsage(admin, userId, 'ai_meal_plan');

  return json({
    recommendations,
    candidates_considered: slim.length,
    pantry_size: pantry.length,
    grounded: slim.length > 0,
  });
});
