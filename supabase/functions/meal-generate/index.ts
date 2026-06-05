// meal-generate — Stovd server-side LLM relay for AI meal generation.
// Keeps the AI key off the app bundle: the client sends only the built prompt;
// this function calls the LLM with a server-side key and returns the raw JSON
// completion text. All cultural/validation logic stays client-side.
//
// Provider-switchable via MEAL_PROVIDER env ('gemini' default | 'groq'):
//   - gemini : Gemini 2.5 Flash (reuses existing GEMINI_API_KEY secret).
//   - groq   : Groq (OpenAI-compatible) open-source models, needs GROQ_API_KEY.
// Both return { content, usage } in the same shape, so the client is agnostic.
//
// Auth: requires a valid user JWT (no open proxy). No metering here on purpose —
// one meal plan fans out to many calls; the ai_meal_plan quota is enforced once
// per plan by meal-plan-quota, not per LLM call.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const PROVIDER = (Deno.env.get('MEAL_PROVIDER') ?? 'gemini').toLowerCase();

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const GEMINI_MODEL = Deno.env.get('MEAL_GEMINI_MODEL') ?? 'gemini-2.5-flash';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = Deno.env.get('MEAL_GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

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

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
interface LLMResult {
  content: string | null;
  usage: Usage | null;
  error?: { status: number; detail: string };
}

// ---- Gemini 2.5 Flash ----
async function callGemini(
  system: string | undefined,
  prompt: string,
  temperature: number,
): Promise<LLMResult> {
  const resp = await fetch(
    `${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature, responseMimeType: 'application/json' },
      }),
    },
  );
  if (!resp.ok) {
    return {
      content: null,
      usage: null,
      error: { status: resp.status, detail: await resp.text() },
    };
  }
  const data = await resp.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  const um = data?.usageMetadata;
  const usage = um
    ? {
        prompt_tokens: um.promptTokenCount ?? 0,
        completion_tokens: um.candidatesTokenCount ?? 0,
        total_tokens: um.totalTokenCount ?? 0,
      }
    : null;
  return { content, usage };
}

// ---- Groq (OpenAI-compatible) ----
async function callGroq(
  system: string | undefined,
  prompt: string,
  temperature: number,
): Promise<LLMResult> {
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
      temperature,
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) {
    return {
      content: null,
      usage: null,
      error: { status: resp.status, detail: await resp.text() },
    };
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? null;
  const u = data?.usage;
  const usage = u
    ? {
        prompt_tokens: u.prompt_tokens ?? 0,
        completion_tokens: u.completion_tokens ?? 0,
        total_tokens: u.total_tokens ?? 0,
      }
    : null;
  return { content, usage };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // ---- auth: require a valid user JWT ----
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer '))
    return json({ error: 'unauthorized' }, 401);
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: 'unauthorized' }, 401);

  // ---- parse request ----
  let payload: { system?: string; prompt?: string; temperature?: number };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const { system, prompt, temperature } = payload;
  if (!prompt || typeof prompt !== 'string') {
    return json({ error: 'missing_prompt' }, 400);
  }
  const temp = typeof temperature === 'number' ? temperature : 0.1;

  // ---- relay to the configured provider ----
  let result: LLMResult;
  try {
    result =
      PROVIDER === 'groq'
        ? await callGroq(system, prompt, temp)
        : await callGemini(system, prompt, temp);
  } catch (e) {
    return json({ error: 'upstream_unreachable', detail: String(e) }, 502);
  }

  if (result.error) {
    return json(
      {
        error: `${PROVIDER}_error`,
        status: result.error.status,
        detail: result.error.detail,
      },
      502,
    );
  }
  if (!result.content) return json({ error: 'empty_completion' }, 502);

  return json({
    content: result.content,
    usage: result.usage,
    provider: PROVIDER,
  });
});
