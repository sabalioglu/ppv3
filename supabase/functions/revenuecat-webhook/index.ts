// revenuecat-webhook — RevenueCat -> Supabase entitlement sync.
//
// Deploy with verify_jwt = false: RevenueCat is a server, not a logged-in user.
// Auth is the shared secret you set in the RevenueCat dashboard
//   (Project > Integrations > Webhooks > Authorization header value),
//   compared here against REVENUECAT_WEBHOOK_SECRET.
//
// app_user_id MUST be the Supabase user id (set client-side via Purchases.logIn(userId)).
// Anonymous RC ids ($RCAnonymousID:...) are ignored.
//
// Entitlement model: for every event except EXPIRATION / SUBSCRIPTION_PAUSED we
// mark is_premium=true with expires_at = expiration_at_ms. is_user_premium() in
// SQL re-checks expiry, so a CANCELLATION (access until period end) and a
// BILLING_ISSUE (grace period) both naturally stay premium until they lapse.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// RC sends whatever you typed in the dashboard; accept it with or without "Bearer ".
function authOk(header: string | null): boolean {
  if (!header || !WEBHOOK_SECRET) return false;
  const got = header.replace(/^Bearer\s+/i, '').trim();
  return got === WEBHOOK_SECRET;
}

const REVOKE = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!authOk(req.headers.get('Authorization')))
    return json({ error: 'unauthorized' }, 401);

  const payload = await req.json().catch(() => null);
  const ev = payload?.event;
  if (!ev?.type) return json({ error: 'no event' }, 400);

  const userId: string | undefined = ev.app_user_id;
  if (!userId || !UUID_RE.test(userId)) {
    // anonymous / non-Supabase id — acknowledge so RC stops retrying.
    return json({ ok: true, skipped: 'non-supabase app_user_id' });
  }

  const isPremium = !REVOKE.has(ev.type);
  const expiresAt =
    typeof ev.expiration_at_ms === 'number'
      ? new Date(ev.expiration_at_ms).toISOString()
      : null;

  const { error } = await admin.from('user_entitlements').upsert(
    {
      user_id: userId,
      is_premium: isPremium,
      source: 'revenuecat',
      product_id: ev.product_id ?? null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error)
    return json({ error: 'upsert failed', detail: error.message }, 500);

  return json({ ok: true, type: ev.type, is_premium: isPremium });
});
