// video-intelligence — Stovd social recipe import (yt-dlp self-host + holistic multimodal fusion).
//
// Auth: userId is derived from the JWT, never from the body (fixes the prior IDOR).
// Pipeline (HOLISTIC — three signals fused, model-agnostic):
//   1. VPS /analyze -> { caption, keyframes[] (scene-change), whisper transcript, thumbnail, meta }
//   2. Gemini fuses ALL THREE: video frames (visual) + audio transcript (spoken steps/amounts)
//      + caption (supporting hint) -> one accurate recipe.
//   3. Store into user_recipes with the source thumbnail as image_url.
// (Frames+transcript are sent as images+text, so the LLM is swappable to local Gemma later.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkQuota, quotaBody, recordUsage } from '../_shared/entitlement.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const GEMINI_MODEL = Deno.env.get('RECIPE_LLM_MODEL') ?? 'gemini-2.5-flash';
const VIDEO_SVC_URL = (Deno.env.get('VIDEO_SVC_URL') ?? '').replace(/\/$/, '');
const VIDEO_SVC_SECRET = Deno.env.get('VIDEO_SVC_SECRET')!;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
// Instagram blocks yt-dlp from datacenter IPs, so IG goes through Apify's
// managed instagram-reel-scraper (caption holds the full recipe for most reels).
const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN') ?? '';
const APIFY_IG_ACTOR = 'apify~instagram-reel-scraper';

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

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface AnalyzeBundle {
  platform?: string;
  title?: string;
  caption?: string;
  thumbnail?: string;
  webpage_url?: string;
  duration?: number;
  transcript?: string;
  language?: string;
  frame_count?: number;
  frames?: string[]; // base64 jpeg, no data: prefix
}

const FUSION_INSTRUCTION = `You are Stovd's recipe extractor. You are given THREE signals from one cooking video:
1. VIDEO KEYFRAMES (images) — what ingredients/actions are visually shown.
2. AUDIO TRANSCRIPT — the creator's spoken steps and quantities (most reliable for amounts/sequence).
3. CAPTION — the post text; a supporting hint only.
Fuse all three into ONE complete, faithful recipe. Trust the transcript + frames over the caption when they conflict. Use the frames to recover ingredients/actions not spoken, and the transcript to recover steps/amounts not written.
Return JSON ONLY:
{
  "title": "string",
  "cuisine": "string|null",
  "servings": number|null,
  "prep_time_min": number|null,
  "cook_time_min": number|null,
  "difficulty": "easy|medium|hard|null",
  "ingredients": [{"name":"string","amount":"string"}],
  "steps": ["string"],
  "confidence": 0.0
}
confidence = your 0-1 certainty the recipe is complete and faithful to the video.`;

async function geminiFuse(b: AnalyzeBundle): Promise<Record<string, unknown>> {
  const frames = (b.frames ?? []).slice(0, 14);
  const parts: unknown[] = frames.map((data) => ({
    inlineData: { mimeType: 'image/jpeg', data },
  }));
  parts.push({
    text: `${FUSION_INSTRUCTION}

VIDEO TITLE: ${b.title || '(none)'}
AUDIO TRANSCRIPT: ${b.transcript || '(no speech detected)'}
CAPTION (hint only): ${b.caption || '(none)'}`,
  });

  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.2,
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

function isInstagram(url: string): boolean {
  return /(^|\.)instagram\.com\//i.test(url);
}

interface IgResolved {
  videoUrl: string;
  caption: string;
  thumbnail?: string;
}

// Instagram blocks yt-dlp from datacenter IPs, so we use Apify's managed
// instagram-reel-scraper ONLY to obtain the direct CDN video URL (+ caption).
// The video itself is still analyzed (frames + whisper) by the VPS, exactly like
// TikTok/YouTube — caption stays a supporting hint, never the sole source.
async function resolveInstagram(url: string): Promise<IgResolved> {
  if (!APIFY_TOKEN) throw new Error('APIFY_TOKEN not set');
  const res = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_IG_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: [url], resultsLimit: 1 }),
    },
  );
  if (!res.ok) throw new Error(`apify ${res.status}: ${await res.text()}`);
  const items = (await res.json()) as Array<Record<string, unknown>>;
  const it = items?.[0];
  if (!it) throw new Error('apify returned no item');
  const videoUrl = (it.videoUrl as string) ?? '';
  if (!videoUrl) throw new Error('instagram post has no video (not a reel?)');
  return {
    videoUrl,
    caption: (it.caption as string) ?? '',
    thumbnail:
      (it.displayUrl as string) ?? (it.images as string[])?.[0] ?? undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true }, 200);

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
  const url: string | undefined = body?.url;
  if (!url) return json({ error: 'url required' }, 400);

  // ---- freemium gate: imports are limited per month on the free tier
  // (shares the 'recipe_import' counter with URL imports) ----
  const meter = await checkQuota(admin, userId, 'recipe_import');
  if (!meter.allowed) return json(quotaBody(meter), 402);

  // ---- 1) analyze the video + extract the recipe ----
  // Instagram: Apify resolves the CDN video, then Gemini watches it directly
  // (the VPS yt-dlp can't ingest IG's signed CDN URL). TikTok/YouTube: the VPS
  // extracts frames + whisper transcript, then Gemini fuses the signals.
  // Either way the actual video (visuals + audio) is analyzed — caption is only
  // ever a supporting hint, never the sole source.
  let bundle: AnalyzeBundle;
  let recipe: Record<string, unknown>;

  if (isInstagram(url)) {
    // Apify resolves the CDN video URL (yt-dlp can't reach IG from a datacenter
    // IP); the video service then analyzes the actual clip (frames + whisper) at
    // any size, exactly like TikTok. Apify's caption is usually the fullest text.
    let ig: IgResolved;
    try {
      ig = await resolveInstagram(url);
    } catch (e) {
      return json(
        { error: 'instagram resolve failed', detail: String(e) },
        502,
      );
    }
    try {
      const res = await fetch(`${VIDEO_SVC_URL}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VIDEO_SVC_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: ig.videoUrl }),
      });
      if (!res.ok)
        return json({ error: 'analyze failed', detail: await res.text() }, 502);
      bundle = await res.json();
    } catch (e) {
      return json(
        { error: 'video service unreachable', detail: String(e) },
        502,
      );
    }
    bundle.platform = 'instagram';
    bundle.webpage_url = url;
    bundle.caption = ig.caption || bundle.caption;
    bundle.thumbnail = ig.thumbnail || bundle.thumbnail;
    if (!bundle.frames?.length && !bundle.transcript && !bundle.caption)
      return json({ error: 'no analyzable content' }, 422);
    try {
      recipe = await geminiFuse(bundle);
    } catch (e) {
      return json({ error: 'fusion failed', detail: String(e) }, 502);
    }
  } else {
    try {
      const res = await fetch(`${VIDEO_SVC_URL}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VIDEO_SVC_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      if (!res.ok)
        return json({ error: 'analyze failed', detail: await res.text() }, 502);
      bundle = await res.json();
    } catch (e) {
      return json(
        { error: 'video service unreachable', detail: String(e) },
        502,
      );
    }
    if (!bundle.frames?.length && !bundle.transcript)
      return json(
        {
          error: 'no analyzable content (no frames or speech)',
          bundle: { ...bundle, frames: undefined },
        },
        422,
      );
    try {
      recipe = await geminiFuse(bundle);
    } catch (e) {
      return json({ error: 'fusion failed', detail: String(e) }, 502);
    }
  }
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];
  if (!ingredients.length)
    return json({ error: 'no recipe found', recipe }, 422);

  // ---- 3) store into user_recipes (image = source thumbnail) ----
  const row = {
    user_id: userId,
    title: (recipe.title as string) ?? bundle.title ?? 'Imported recipe',
    description: null,
    ingredients,
    instructions: Array.isArray(recipe.steps)
      ? recipe.steps.map((s: unknown, i: number) =>
          typeof s === 'string' ? { step: i + 1, instruction: s } : s,
        )
      : [],
    category: (recipe.cuisine as string) ?? null,
    servings: (recipe.servings as number) ?? null,
    prep_time: (recipe.prep_time_min as number) ?? null,
    cook_time: (recipe.cook_time_min as number) ?? null,
    difficulty: (recipe.difficulty as string) ?? null,
    image_url: bundle.thumbnail ?? null,
    source_url: bundle.webpage_url ?? url,
    source_platform: (bundle.platform ?? null) as string | null,
    extraction_method: 'frames_whisper_caption_fusion',
    is_ai_generated: false,
    ai_confidence_score:
      typeof recipe.confidence === 'number'
        ? Math.round((recipe.confidence as number) * 100)
        : null,
  };
  const { data: saved, error } = await admin
    .from('user_recipes')
    .insert(row)
    .select()
    .single();
  if (error)
    return json(
      { error: 'store failed', detail: error.message, recipe: row },
      500,
    );

  await recordUsage(admin, userId, 'recipe_import');

  return json({
    success: true,
    method: 'frames_whisper_caption_fusion',
    signals: {
      frames: bundle.frame_count ?? 0,
      transcript_chars: (bundle.transcript ?? '').length,
      has_caption: !!bundle.caption,
      language: bundle.language ?? null,
    },
    recipe: saved,
  });
});
