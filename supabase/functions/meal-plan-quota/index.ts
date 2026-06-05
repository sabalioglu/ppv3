// meal-plan-quota — gate one full AI meal-plan generation against the
// ai_meal_plan quota (free monthly limit + premium fair-use ceiling).
//
// The client calls this ONCE at the start of generateEnhancedMealPlan. A full
// plan fans out to ~12 meal-generate calls; metering belongs here (per plan),
// not per LLM call. Body: { consume?: boolean } (default true) — when true and
// allowed, records one use. Returns the meter so the client can show remaining.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkQuota, quotaBody, recordUsage } from '../_shared/entitlement.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

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

  let consume = true;
  try {
    const body = await req.json();
    if (body && typeof body.consume === 'boolean') consume = body.consume;
  } catch {
    /* default consume=true */
  }

  const meter = await checkQuota(admin, user.id, 'ai_meal_plan');
  if (!meter.allowed) return json(quotaBody(meter), 402);

  if (consume) await recordUsage(admin, user.id, 'ai_meal_plan');

  return json({
    allowed: true,
    isPremium: meter.isPremium,
    feature: 'ai_meal_plan',
    used: consume ? meter.used + 1 : meter.used,
    limit: meter.limit,
    remaining:
      meter.remaining === Infinity
        ? null
        : Math.max(0, meter.remaining - (consume ? 1 : 0)),
  });
});
