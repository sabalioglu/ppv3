// recipe-from-url — Stovd URL recipe import (Firecrawl scrape + JSON-LD fast-path + Gemini).
// Full server-side flow: no scraping key and no AI key ship in the app bundle.
//   1. Firecrawl /scrape -> clean markdown + rawHtml + metadata (ogImage).
//   2. JSON-LD fast-path from rawHtml -> exact recipe, no LLM (free, ~98% accurate when present).
//   3. Gemini 2.5 Flash on the clean markdown -> structured recipe (fallback).
// Auth: requires a valid user JWT. Output: { recipe: ExtractedRecipeData, method }.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkQuota, quotaBody, recordUsage } from '../_shared/entitlement.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const MODEL = Deno.env.get('RECIPE_LLM_MODEL') ?? 'gemini-2.5-flash';
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')!;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// ---- ISO-8601 duration (PT1H30M) -> minutes ----
function isoToMin(s: unknown): number | null {
  if (typeof s !== 'string') return null;
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(s);
  if (!m) return null;
  const min = parseInt(m[1] || '0') * 60 + parseInt(m[2] || '0');
  return min || null;
}

// ---- compact schema.org Recipe extractor from raw HTML ----
function extractJsonLd(html: string): Record<string, unknown> | null {
  const scripts = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((m) => m[1]);
  for (const raw of scripts) {
    let data: unknown;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const pool: unknown[] = Array.isArray(data)
      ? data
      : (data as { '@graph'?: unknown[] })?.['@graph']
        ? (data as { '@graph': unknown[] })['@graph']
        : [data];
    const isRecipe = (n: unknown) => {
      const t = (n as { '@type'?: unknown })?.['@type'];
      return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'));
    };
    const r = pool.find(isRecipe) as Record<string, any> | undefined;
    if (!r) continue;

    const ingredients = (r.recipeIngredient ?? r.ingredients ?? [])
      .filter((x: unknown) => typeof x === 'string')
      .map((s: string) => ({ name: s.trim() }));
    if (!ingredients.length) continue;

    const rawInstr = r.recipeInstructions ?? [];
    const flat: string[] = [];
    const pushInstr = (it: any) => {
      if (typeof it === 'string') flat.push(it);
      else if (it?.text) flat.push(it.text);
      else if (it?.name) flat.push(it.name);
      else if (it?.itemListElement) it.itemListElement.forEach(pushInstr);
    };
    (Array.isArray(rawInstr) ? rawInstr : [rawInstr]).forEach(pushInstr);
    const instructions = flat
      .map((t, i) => ({ step: i + 1, instruction: t.trim() }))
      .filter((s) => s.instruction.length > 2);

    const img = Array.isArray(r.image)
      ? typeof r.image[0] === 'string'
        ? r.image[0]
        : r.image[0]?.url
      : typeof r.image === 'string'
        ? r.image
        : r.image?.url;
    const yield_ = Array.isArray(r.recipeYield)
      ? r.recipeYield[0]
      : r.recipeYield;

    return {
      title: r.name ?? '',
      description: typeof r.description === 'string' ? r.description : '',
      image_url: img ?? null,
      prep_time: isoToMin(r.prepTime),
      cook_time: isoToMin(r.cookTime),
      servings: parseInt(String(yield_ ?? '')) || null,
      ingredients,
      instructions,
      category: r.recipeCategory ?? null,
      is_ai_generated: false,
      ai_match_score: 98,
    };
  }
  return null;
}

async function firecrawlScrape(url: string): Promise<{
  markdown: string;
  rawHtml: string;
  ogImage: string | null;
  title: string | null;
}> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'rawHtml'],
      onlyMainContent: true,
    }),
  });
  if (!res.ok) throw new Error(`firecrawl ${res.status}: ${await res.text()}`);
  const out = await res.json();
  const d = out?.data ?? {};
  return {
    markdown: d.markdown ?? '',
    rawHtml: d.rawHtml ?? '',
    ogImage: d.metadata?.ogImage ?? d.metadata?.['og:image'] ?? null,
    title: d.metadata?.title ?? null,
  };
}

const GEMINI_PROMPT = `You are an expert culinary assistant. Extract the recipe from the provided page content (clean markdown).
Rules: use ONLY information present in the content; if a field is missing use null — do not invent. Provide a 0-100 confidence_score.
Respond ONLY with valid JSON:
{
  "title": "string",
  "description": "string|null",
  "image_url": "string|null",
  "prep_time": number|null,
  "cook_time": number|null,
  "servings": number|null,
  "difficulty": "Easy|Medium|Hard|null",
  "ingredients": [{"name":"string","quantity":"string","unit":"string","notes":"string"}],
  "instructions": [{"step":number,"instruction":"string","duration_mins":number}],
  "nutrition": {"calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number},
  "tags": ["string"],
  "category": "string|null",
  "confidence_score": number
}`;

async function geminiFromMarkdown(
  markdown: string,
  url: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: GEMINI_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [
              { text: `URL: ${url}\n\nCONTENT:\n${markdown.slice(0, 16000)}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({}, 204);

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

  const body = await req.json().catch(() => ({}));
  const url: string | undefined = body?.url;
  if (!url) return json({ error: 'url required' }, 400);
  try {
    new URL(url);
  } catch {
    return json({ error: 'invalid url' }, 400);
  }

  // ---- freemium gate: imports are limited per month on the free tier ----
  const meter = await checkQuota(admin, user.id, 'recipe_import');
  if (!meter.allowed) return json(quotaBody(meter), 402);

  // 1) scrape (clean markdown + rawHtml)
  let scraped;
  try {
    scraped = await firecrawlScrape(url);
  } catch (e) {
    return json({ error: 'scrape failed', detail: String(e) }, 502);
  }

  // 2) JSON-LD fast-path (free, no LLM)
  const ld = extractJsonLd(scraped.rawHtml);
  if (ld && (ld.ingredients as unknown[])?.length) {
    if (!ld.image_url) ld.image_url = scraped.ogImage;
    await recordUsage(admin, user.id, 'recipe_import');
    return json({ recipe: ld, method: 'jsonld' });
  }

  // 3) Gemini on clean markdown
  if (!scraped.markdown) return json({ error: 'no content extracted' }, 422);
  let parsed: Record<string, unknown>;
  try {
    parsed = await geminiFromMarkdown(scraped.markdown, url);
  } catch (e) {
    return json({ error: 'extraction failed', detail: String(e) }, 502);
  }
  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients
    : [];
  const conf =
    typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0;
  if (!parsed.title || !ingredients.length)
    return json({ error: 'incomplete recipe', recipe: parsed }, 422);
  if (conf && conf < 60)
    return json({ error: `low confidence (${conf})`, recipe: parsed }, 422);

  const recipe = {
    title: parsed.title,
    description: parsed.description ?? '',
    image_url: parsed.image_url ?? scraped.ogImage ?? null,
    prep_time: parsed.prep_time ?? null,
    cook_time: parsed.cook_time ?? null,
    servings: parsed.servings ?? null,
    difficulty: parsed.difficulty ?? null,
    ingredients,
    instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
    nutrition: parsed.nutrition ?? null,
    tags: parsed.tags ?? [],
    category: parsed.category ?? null,
    is_ai_generated: true,
    ai_match_score: conf || null,
  };
  await recordUsage(admin, user.id, 'recipe_import');
  return json({ recipe, method: 'gemini' });
});
