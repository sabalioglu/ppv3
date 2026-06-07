// admob-ssv — AdMob rewarded ad Server-Side Verification callback.
//
// AdMob's servers GET this URL after a user finishes a rewarded ad. The reward
// is credited HERE (not from the client) so it can't be spoofed: we verify the
// ECDSA signature over the query string against Google's published public keys.
//
// Deploy: supabase functions deploy admob-ssv --no-verify-jwt
//   (AdMob calls it unauthenticated; we self-authenticate via the signature.)
// AdMob console: set this function's URL as the rewarded ad unit's SSV callback.
//   Pass our Supabase user id + feature as custom_data: "<userId>|<feature>".
//
// Query params (AdMob): ad_network, ad_unit, custom_data, reward_amount,
//   reward_item, timestamp, transaction_id, user_id, signature, key_id.
//   The signed content is the query string up to (not including) "&signature=".
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createVerify } from 'node:crypto';
import { Buffer } from 'node:buffer';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const ALLOWED_FEATURES = new Set([
  'photo_scan',
  'recipe_import',
  'ai_meal_plan',
]);

// Cache verifier keys (rotated rarely). Map<keyId, pem>.
let keyCache: { at: number; keys: Map<string, string> } | null = null;

async function getVerifierKeys(): Promise<Map<string, string>> {
  const FRESH_MS = 6 * 60 * 60 * 1000; // 6h
  if (keyCache && Date.now() - keyCache.at < FRESH_MS) return keyCache.keys;
  const res = await fetch(KEYS_URL);
  const json = await res.json();
  const keys = new Map<string, string>();
  for (const k of json.keys ?? []) {
    if (k.keyId != null && k.pem) keys.set(String(k.keyId), k.pem as string);
  }
  keyCache = { at: Date.now(), keys };
  return keys;
}

function ok(body = 'ok'): Response {
  return new Response(body, { status: 200 });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const q = url.search.startsWith('?') ? url.search.slice(1) : url.search;

    // The signed content is everything before "&signature=".
    const sigMarker = q.indexOf('&signature=');
    if (sigMarker === -1) return ok('missing signature');
    const signedContent = q.slice(0, sigMarker);

    const params = url.searchParams;
    const signatureB64 = params.get('signature') ?? '';
    const keyId = params.get('key_id') ?? '';
    const transactionId = params.get('transaction_id') ?? '';
    const customData = params.get('custom_data') ?? '';
    if (!signatureB64 || !keyId || !transactionId) return ok('missing params');

    // Resolve the public key for this key_id.
    const keys = await getVerifierKeys();
    const pem = keys.get(keyId);
    if (!pem) return ok('unknown key');

    // Verify ECDSA(SHA-256). AdMob's signature is base64url DER — node verify
    // accepts DER directly.
    const verifier = createVerify('sha256');
    verifier.update(signedContent);
    verifier.end();
    const valid = verifier.verify(pem, Buffer.from(signatureB64, 'base64url'));
    if (!valid) return ok('invalid signature');

    // custom_data = "<userId>|<feature>"
    const [userId, feature] = customData.split('|');
    if (!userId || !feature || !ALLOWED_FEATURES.has(feature)) {
      return ok('bad custom_data');
    }

    // Idempotency: AdMob may retry. First insert wins; duplicates are no-ops.
    const { error: dupErr } = await admin
      .from('ad_rewards')
      .insert({ transaction_id: transactionId, user_id: userId, feature });
    if (dupErr) {
      // unique_violation (23505) => already processed; anything else => log & ack
      return ok('duplicate');
    }

    await admin.rpc('grant_quota_bonus', {
      p_user_id: userId,
      p_feature: feature,
      p_amount: 1,
    });

    return ok('granted');
  } catch (_e) {
    // Always 200 so AdMob doesn't hammer retries on our transient errors.
    return ok('error');
  }
});
