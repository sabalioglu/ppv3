// useEntitlement — single source of truth for "is this user premium?" in the UI.
//
// Reads the Supabase user_entitlements row (kept in sync by revenuecat-webhook
// and stripe-webhook server-side). On native it also refreshes from the RC SDK
// so a just-completed purchase reflects instantly without waiting for the
// webhook round-trip. Server stays authoritative for gating; this is for UX.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { isPremiumFromRC } from '@/lib/purchases';

interface EntitlementState {
  isPremium: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useEntitlement(): EntitlementState {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setIsPremium(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('user_entitlements')
        .select('is_premium, expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      const notExpired =
        !data?.expires_at || new Date(data.expires_at).getTime() > Date.now();
      let premium = !!data?.is_premium && notExpired;

      // Native: a fresh purchase may beat the webhook — trust the SDK too.
      if (!premium) {
        premium = await isPremiumFromRC();
      }
      setIsPremium(premium);
    } catch (e) {
      console.warn('[useEntitlement] refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isPremium, loading, refresh };
}
