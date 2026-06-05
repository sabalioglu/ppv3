// _shared/entitlement.ts — server-side freemium metering for Stovd edge functions.
//
// Free tier: N calls / calendar month / feature. Premium (RevenueCat or Stripe): unlimited.
// Usage:
//   const meter = await checkQuota(admin, userId, 'photo_scan');
//   if (!meter.allowed) return json(quotaBody(meter), 402);
//   ... do the expensive work ...
//   await recordUsage(admin, userId, 'photo_scan');   // only after success
//
// `admin` must be a service-role client (the metering RPCs are SECURITY DEFINER
// and increment_usage is granted to service_role only).
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Free monthly limits. Single source of truth — tune here.
export const FREE_LIMITS: Record<string, number> = {
  photo_scan: 20, // vision-analyze (receipt / food / fridge photo)
  recipe_import: 10, // recipe-from-url + video-intelligence (social/URL import)
  ai_meal_plan: 5, // generateEnhancedMealPlan (full daily AI plan)
};

// Premium fair-use ceilings. "Unlimited" still has a hard monthly cap per
// feature to stop scripted abuse / runaway LLM cost. Normal humans never hit
// these. Tune here. (Set a value to Infinity to truly uncap a feature.)
export const FAIR_USE_LIMITS: Record<string, number> = {
  photo_scan: 600,
  recipe_import: 300,
  ai_meal_plan: 150, // ~5 full plans/day — far above any real meal-planning need
};

export interface MeterResult {
  allowed: boolean;
  isPremium: boolean;
  feature: string;
  used: number;
  limit: number;
  remaining: number;
}

// Gate BEFORE doing the work. Does not increment. Fails OPEN: a metering
// infra error must never block a (possibly paying) user from their feature.
export async function checkQuota(
  admin: SupabaseClient,
  userId: string,
  feature: string,
): Promise<MeterResult> {
  const limit = FREE_LIMITS[feature] ?? Infinity;
  try {
    const { data: premium } = await admin.rpc('is_user_premium', {
      p_user_id: userId,
    });
    if (premium === true) {
      // Premium is "unlimited" but still bounded by a fair-use ceiling.
      const fairLimit = FAIR_USE_LIMITS[feature] ?? Infinity;
      const { data: pUsed } = await admin.rpc('get_usage', {
        p_user_id: userId,
        p_feature: feature,
      });
      const pu = typeof pUsed === 'number' ? pUsed : 0;
      return {
        allowed: pu < fairLimit,
        isPremium: true,
        feature,
        used: pu,
        limit: fairLimit,
        remaining:
          fairLimit === Infinity ? Infinity : Math.max(0, fairLimit - pu),
      };
    }

    const { data: used } = await admin.rpc('get_usage', {
      p_user_id: userId,
      p_feature: feature,
    });
    const u = typeof used === 'number' ? used : 0;
    return {
      allowed: u < limit,
      isPremium: false,
      feature,
      used: u,
      limit,
      remaining: Math.max(0, limit - u),
    };
  } catch (_e) {
    return {
      allowed: true,
      isPremium: false,
      feature,
      used: 0,
      limit,
      remaining: limit,
    };
  }
}

// Record one successful use. Best-effort: a failed increment must not fail the
// request the user already paid (in quota) for.
export async function recordUsage(
  admin: SupabaseClient,
  userId: string,
  feature: string,
): Promise<void> {
  try {
    await admin.rpc('increment_usage', {
      p_user_id: userId,
      p_feature: feature,
    });
  } catch (_e) {
    /* best-effort */
  }
}

// Standard 402 body when a monthly limit is reached. For free users this means
// "upgrade to premium"; for premium users it means "fair-use ceiling hit".
export function quotaBody(meter: MeterResult) {
  return {
    error: meter.isPremium ? 'fair_use_limit_reached' : 'monthly_limit_reached',
    feature: meter.feature,
    limit: meter.limit,
    used: meter.used,
    remaining: 0,
    upgrade: !meter.isPremium,
    fairUse: meter.isPremium,
  };
}
