// recipe-corpus-seed — seed the public recipe_corpus from TheMealDB (free, world cuisine).
// Idempotent: dedupes by (source='themealdb', external_id=idMeal).
// Admin/service use: protected by a shared SEED_SECRET header. Seeds ONE area per call
// (call repeatedly per area) to stay within edge wall-clock limits.
//
// POST { "area": "Italian" }  header: x-seed-secret: <SEED_SECRET>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  embed,
  normalizeIngredientNames,
  recipeEmbeddingText,
  json,
} from '../_shared/embed.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SEED_SECRET = Deno.env.get('SEED_SECRET')!;
const MEALDB = 'https://www.themealdb.com/api/json/v1/1';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function parseIngredients(meal: Record<string, string>) {
  const items: Array<{ name: string; amount: string }> = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] ?? '').trim();
    const measure = (meal[`strMeasure${i}`] ?? '').trim();
    if (name) items.push({ name, amount: measure });
  }
  return items;
}

function parseSteps(instructions: string): string[] {
  return (instructions ?? '')
    .split(/\r?\n|\.\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({}, 204);
  if (req.headers.get('x-seed-secret') !== SEED_SECRET)
    return json({ error: 'unauthorized' }, 401);

  const reqBody = await req.json().catch(() => ({ area: null }));
  const area = reqBody?.area;
  // Cap embeds per invocation — gte-small is memory-heavy on small compute, so
  // process a few NEW recipes per call and loop externally until done (idempotent).
  const MAX = Math.min(reqBody?.max ?? 6, 12);
  if (!area) return json({ error: 'area required' }, 400);

  // 1) list meals in area
  const list = await fetch(
    `${MEALDB}/filter.php?a=${encodeURIComponent(area)}`,
  ).then((r) => r.json());
  const meals = list?.meals ?? [];
  let inserted = 0,
    skipped = 0,
    failed = 0;

  for (const m of meals) {
    if (inserted >= MAX) break;
    try {
      // dedupe
      const { data: existing } = await admin
        .from('recipe_corpus')
        .select('id')
        .eq('source', 'themealdb')
        .eq('external_id', m.idMeal)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }

      // 2) full lookup
      const full = await fetch(`${MEALDB}/lookup.php?i=${m.idMeal}`).then((r) =>
        r.json(),
      );
      const meal = full?.meals?.[0];
      if (!meal) {
        failed++;
        continue;
      }

      const ingredients = parseIngredients(meal);
      const ingredient_names = normalizeIngredientNames(ingredients);
      if (!ingredient_names.length) {
        failed++;
        continue;
      }

      const tags = (meal.strTags ?? '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);
      if (meal.strCategory) tags.push(meal.strCategory);

      const row = {
        source: 'themealdb',
        external_id: meal.idMeal,
        title: meal.strMeal,
        cuisine: meal.strArea ?? area,
        ingredients,
        ingredient_names,
        steps: parseSteps(meal.strInstructions),
        skill_level: null,
        image_url: meal.strMealThumb ?? null,
        tags,
        owner_user_id: null,
      };

      const embedding = await embed(recipeEmbeddingText(row));
      const { error } = await admin
        .from('recipe_corpus')
        .insert({ ...row, embedding });
      if (error) {
        failed++;
        continue;
      }
      inserted++;
    } catch (_e) {
      failed++;
    }
  }

  return json({ area, total: meals.length, inserted, skipped, failed });
});
