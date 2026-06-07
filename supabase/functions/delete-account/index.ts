// delete-account — permanently delete the calling user's account + data.
// App Store Guideline 5.1.1(v) / Play Account Deletion requirement.
//
// Auth: requires the user's JWT (verify_jwt off; we self-verify via getUser).
// Flow: identify user -> best-effort wipe of user-scoped rows (tolerant of
// tables that don't exist) -> auth.admin.deleteUser (the authoritative step).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// user-scoped tables keyed by user_id (best-effort; missing tables are ignored)
const USER_ID_TABLES = [
  'pantry_items',
  'user_recipes',
  'shopping_list_items',
  'shopping_list',
  'nutrition_logs',
  'cookbooks',
  'usage_counters',
  'user_entitlements',
  'recipe_feedback',
  'user_taste_profile',
  'consent_logs',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true }, 200);
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

  // 1) best-effort data wipe (each tolerant — ignore unknown tables / errors)
  for (const table of USER_ID_TABLES) {
    try {
      await admin.from(table).delete().eq('user_id', userId);
    } catch {
      /* table may not exist — ignore */
    }
  }
  // tables with a different owner column
  try {
    await admin.from('recipe_corpus').delete().eq('owner_user_id', userId);
  } catch {
    /* ignore */
  }
  try {
    await admin.from('user_profiles').delete().eq('id', userId);
  } catch {
    /* ignore */
  }

  // 2) authoritative: remove the auth user (the account itself)
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr)
    return json({ error: 'account deletion failed', detail: delErr.message }, 500);

  return json({ ok: true, deleted: userId });
});
