-- ============================================================================
-- Stovd Freemium Entitlement Layer
-- Premium source of truth: RevenueCat (mobile) OR Stripe (web) — unified here.
-- Free tier is metered per calendar month via usage_counters.
-- All helper RPCs are SECURITY DEFINER so edge functions (service role) can
-- read/write past RLS while clients can only SELECT their own rows.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- user_entitlements: one row per user, upserted by the RevenueCat webhook.
--   is_premium is the RAW flag from the provider; the canonical "is this user
--   premium right now" answer is is_user_premium() which also honors expiry
--   and an active Stripe subscription.
-- ---------------------------------------------------------------------------
create table if not exists user_entitlements (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  is_premium  boolean not null default false,
  source      text check (source in ('revenuecat', 'stripe')),
  product_id  text,
  expires_at  timestamptz,
  updated_at  timestamptz not null default now()
);

alter table user_entitlements enable row level security;

drop policy if exists "own entitlement read" on user_entitlements;
create policy "own entitlement read"
  on user_entitlements for select
  to authenticated
  using (user_id = auth.uid());
-- writes happen only via the webhook (service role) / SECURITY DEFINER RPCs.

-- ---------------------------------------------------------------------------
-- usage_counters: per (user, month, feature) metered count for the free tier.
--   period_month is 'YYYY-MM' in UTC; a new month resets quota implicitly.
-- ---------------------------------------------------------------------------
create table if not exists usage_counters (
  user_id       uuid not null references auth.users(id) on delete cascade,
  period_month  text not null,                 -- 'YYYY-MM'
  feature       text not null,                 -- 'photo_scan' | 'recipe_import' | 'ai_meal_plan'
  count         int  not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, period_month, feature)
);

alter table usage_counters enable row level security;

drop policy if exists "own usage read" on usage_counters;
create policy "own usage read"
  on usage_counters for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- is_user_premium: canonical entitlement check.
--   true if RevenueCat/Stripe entitlement is_premium AND not expired,
--   OR an active/trialing Stripe subscription exists for the user.
-- ---------------------------------------------------------------------------
create or replace function is_user_premium(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select e.is_premium
       and (e.expires_at is null or e.expires_at > now())
       from user_entitlements e
      where e.user_id = p_user_id),
    false)
  or exists (
    select 1
      from stripe_subscriptions s
      join stripe_customers c on c.customer_id = s.customer_id
     where c.user_id = p_user_id
       and c.deleted_at is null
       and s.deleted_at is null
       and s.status in ('active', 'trialing')
  );
$$;

-- ---------------------------------------------------------------------------
-- get_usage: current-month count for a feature (0 if none).
-- ---------------------------------------------------------------------------
create or replace function get_usage(p_user_id uuid, p_feature text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select count
       from usage_counters
      where user_id = p_user_id
        and feature = p_feature
        and period_month = to_char(now() at time zone 'utc', 'YYYY-MM')),
    0);
$$;

-- ---------------------------------------------------------------------------
-- increment_usage: atomic +1 for the current month; returns the new count.
-- ---------------------------------------------------------------------------
create or replace function increment_usage(p_user_id uuid, p_feature text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into usage_counters (user_id, period_month, feature, count)
  values (p_user_id, to_char(now() at time zone 'utc', 'YYYY-MM'), p_feature, 1)
  on conflict (user_id, period_month, feature)
  do update set count = usage_counters.count + 1,
                updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$;

grant execute on function is_user_premium(uuid) to authenticated, service_role;
grant execute on function get_usage(uuid, text) to authenticated, service_role;
grant execute on function increment_usage(uuid, text) to service_role;
