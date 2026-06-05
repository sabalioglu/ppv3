// vision-analyze — Stovd image understanding (receipt scan + food/fridge photo recognition).
// Replaces the former client-side OpenAI gpt-4o call: the AI key now lives server-side
// (no EXPO_PUBLIC key in the app bundle) and the model is Gemini 2.5 Flash vision.
// Auth: requires a valid user JWT (prevents the proxy from being an open, abusable key).
// Input:  { image: "<base64 jpeg, no data: prefix>", mode: string }
// Output: { text: "<model JSON string>", model }   <- the client parses/validates this.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkQuota, quotaBody, recordUsage } from '../_shared/entitlement.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const MODEL = Deno.env.get('VISION_LLM_MODEL') ?? 'gemini-2.5-flash';
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

function promptFor(mode: string): string {
  switch (mode) {
    case 'food-recognition':
      return `Analyze this image and identify all food items. Return ONLY a JSON response with:
{
  "type": "food",
  "mainItem": "primary food item name",
  "confidence": confidence_score_0_to_100,
  "detectedItems": [{"name": "item", "confidence": score, "category": "food|drink"}],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;
    case 'calorie-counter':
      return `Analyze this food image and calculate nutritional information. Return ONLY JSON:
{
  "type": "food",
  "mainItem": "food name",
  "confidence": score,
  "detectedItems": [{"name": "item", "confidence": score, "category": "food"}],
  "calories": total_calories_number,
  "nutrition": {"protein": grams, "carbs": grams, "fat": grams, "fiber": grams},
  "suggestions": ["calorie-focused suggestions"]
}`;
    case 'receipt-scanner':
      return `Analyze this receipt image and extract ONLY food and beverage items.

Return response in this EXACT JSON format:
{
  "type": "receipt",
  "mainItem": "Receipt Analysis Complete",
  "confidence": 85,
  "store_name": "Store name if visible",
  "detectedItems": [
    {"name": "PROPER ITEM NAME", "price": 0.00, "category": "food", "confidence": 85, "is_food": true}
  ],
  "suggestions": ["Review items before adding", "Confirm food items only"],
  "text": "raw extracted text if needed"
}

STRICT RULES:
1. ONLY include food, beverages, snacks, fresh produce
2. EXCLUDE: toiletries, cleaning products, medicine, household items
3. Clean item names: "MLK 2%" -> "MILK 2%", "BRD WHL WHT" -> "BREAD WHOLE WHEAT"
4. Include price if visible, use 0.00 if not found
5. Set confidence 70-95 based on image clarity
6. Maximum 50 items to prevent spam
EXCLUDE: toilet paper, tissues, shampoo, soap, toothpaste, detergent, medicine, vitamins, batteries.
INCLUDE: milk, eggs, cheese, bread, cereal, pasta, rice, fruits, vegetables, meat, fish, snacks, beverages, spices, sauces.`;
    case 'multiple-images':
      return `Analyze this image as part of multiple food analysis. Return ONLY JSON:
{
  "type": "multiple",
  "detectedItems": [{"name": "item", "confidence": score, "category": "food|drink"}],
  "suggestions": ["batch analysis suggestions"]
}`;
    default:
      return `Analyze this image and identify any food items or text. Return ONLY JSON format.`;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true }, 200);

  // ---- auth: require a valid user (don't expose an open AI proxy) ----
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
  const image: string | undefined = body?.image;
  const mode: string = body?.mode ?? 'food-recognition';
  if (!image || typeof image !== 'string')
    return json({ error: 'image (base64) required' }, 400);

  // ---- freemium gate: free tier is limited per month ----
  const meter = await checkQuota(admin, user.id, 'photo_scan');
  if (!meter.allowed) return json(quotaBody(meter), 402);

  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: image } },
              { text: promptFor(mode) },
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
  if (!res.ok)
    return json(
      { error: `vision model ${res.status}`, detail: await res.text() },
      502,
    );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  await recordUsage(admin, user.id, 'photo_scan');
  return json({ text, model: MODEL });
});
