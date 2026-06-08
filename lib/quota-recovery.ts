// lib/quota-recovery.ts — what to do when a free user hits a monthly limit.
//
// Native: offer a choice — watch a rewarded ad for +1, or go Premium.
// Web: AdMob is native-only, so go straight to the paywall.
//
// The ad's reward is credited server-side (admob-ssv), which lands a moment
// after the ad closes, so on 'earned' we wait briefly then run onGranted()
// (typically: retry the action). The server enforces the monthly bonus cap.
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { showRewardedForQuota } from '@/lib/ads';
import { t } from '@/lib/i18n';

// Rewarded ads are deferred to v1.1 (ad-free v1.0 launch). While disabled, a
// quota limit goes straight to the paywall. Flip to true + install
// react-native-google-mobile-ads + expo-tracking-transparency to re-enable.
const ADS_ENABLED = false;

async function watchAd(feature: string, onGranted: () => void) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    router.push('/paywall');
    return;
  }
  const outcome = await showRewardedForQuota(user.id, feature);
  if (outcome === 'earned') {
    // Give the AdMob -> admob-ssv -> grant_quota_bonus round-trip a moment.
    setTimeout(onGranted, 1500);
  } else if (outcome === 'unavailable') {
    Alert.alert(t('ads.unavailableTitle'), t('ads.unavailableMessage'));
  }
  // 'dismissed' (closed early, no reward) -> silently do nothing
}

// Call when a free-tier (non-fair-use) quota error is caught. `feature` is the
// metering key ('ai_meal_plan' | 'photo_scan' | 'recipe_import'). onGranted is
// run after a successful ad reward (retry the gated action).
export function offerAdOrPaywall(feature: string, onGranted: () => void): void {
  if (!ADS_ENABLED || Platform.OS === 'web') {
    router.push('/paywall');
    return;
  }
  Alert.alert(t('ads.limitTitle'), t('ads.limitMessage'), [
    {
      text: t('ads.watchCta'),
      onPress: () => void watchAd(feature, onGranted),
    },
    { text: t('ads.upgradeCta'), onPress: () => router.push('/paywall') },
    { text: t('common.cancel'), style: 'cancel' },
  ]);
}
