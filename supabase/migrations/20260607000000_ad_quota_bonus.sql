-- ============================================================================
-- Stovd — Rewarded-ad quota bonus
-- Free users can earn extra monthly allowance by watching a rewarded ad.
-- The bonus is credited ONLY by the admob-ssv edge function (service role)
-- after AdMob's Server-Side Verification signature checks out — clients can
-- never grant themselves bonus. Effective free limit = base + bonus.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- quota_bonuses: extra allowance per (user, month, feature). Resets monthly
-- with the same 'YYYY-MM' scheme as usage_counters.
-- ---------------------------------------------------------------------------
create table if not exists quota_bonuses (
  user_id       uuid not null references auth.users(id) on delete cascade,
  period_month  text not null,                 -- 'YYYY-MM' (UTC)
  feature       text not null,                 -- 'photo_scan' | 'recipe_import' | 'ai_meal_plan'
  bonus         int  not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, period_month, feature)
);

alter table quota_bonuses enable row level security;

drop policy if exists "own bonus read" on quota_bonuses;
create policy "own bonus read"
  on quota_bonuses for select
  to authenticated
  using (user_id = auth.uid());
-- writes happen only via grant_quota_bonus (SECURITY DEFINER, service role).

-- ---------------------------------------------------------------------------
-- ad_rewards: idempotency log of processed AdMob SSV callbacks. AdMob can
-- retry a callback; transaction_id is the dedupe key so we never double-credit.
-- No RLS policy => readable/writable by service role only.
-- ---------------------------------------------------------------------------
create table if not exists ad_rewards (
  transaction_id  text primary key,
  user_id         uuid,
  feature         text,
  created_at      timestamptz not null default now()
);

alter table ad_rewards enable row level security;

-- ---------------------------------------------------------------------------
-- get_quota_bonus: current-month bonus for a feature (0 if none).
-- ---------------------------------------------------------------------------
create or replace function get_quota_bonus(p_user_id uuid, p_feature text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select bonus
       from quota_bonuses
      where user_id = p_user_id
        and feature = p_feature
        and period_month = to_char(now() at time zone 'utc', 'YYYY-MM')),
    0);
$$;

-- ---------------------------------------------------------------------------
-- grant_quota_bonus: atomic += amount for the current month, capped at a
-- monthly ceiling per feature so ad-farming can't unbound the free tier.
-- Returns the new bonus. Service role only.
-- ---------------------------------------------------------------------------
create or replace function grant_quota_bonus(
  p_user_id uuid,
  p_feature text,
  p_amount  int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cap   int := 10;   -- max bonus earnable per feature per month
  v_bonus int;
begin
  if p_amount is null or p_amount <= 0 then
    return get_quota_bonus(p_user_id, p_feature);
  end if;
  insert into quota_bonuses (user_id, period_month, feature, bonus)
  values (p_user_id, to_char(now() at time zone 'utc', 'YYYY-MM'), p_feature,
          least(p_amount, v_cap))
  on conflict (user_id, period_month, feature)
  do update set bonus = least(quota_bonuses.bonus + p_amount, v_cap),
                updated_at = now()
  returning bonus into v_bonus;
  return v_bonus;
end;
$$;

grant execute on function get_quota_bonus(uuid, text) to authenticated, service_role;
grant execute on function grant_quota_bonus(uuid, text, int) to service_role;
