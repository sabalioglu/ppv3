// lib/ads.ts — thin AdMob wrapper, isolated so the rest of the app never imports
// react-native-google-mobile-ads directly.
//
// Only feature: a rewarded ad that grants +1 free-tier quota. The credit is NOT
// applied here — AdMob's servers call our `admob-ssv` edge function after the
// reward, which verifies the signature and increments the bonus. The client
// just plays the ad and, on success, tells the caller to re-check quota.
//
// Web is a no-op (native-only SDK). Ad unit IDs are public (ship in the bundle);
// set them via EAS env: EXPO_PUBLIC_ADMOB_REWARDED_IOS / _ANDROID. Until a real
// AdMob account exists we fall back to Google's official test unit (TestIds).
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isWeb = Platform.OS === 'web';

export type RewardOutcome = 'earned' | 'dismissed' | 'unavailable';

// Lazily require so web bundles never pull in the native module.
function ads() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('react-native-google-mobile-ads');
}

function rewardedUnitId(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  const fromEnv =
    Platform.OS === 'ios' ? extra.admobRewardedIos : extra.admobRewardedAndroid;
  if (fromEnv) return fromEnv;
  return ads().TestIds.REWARDED; // dev / pre-account fallback
}

let initialized = false;

export async function initAds(): Promise<void> {
  if (isWeb || initialized) return;
  try {
    await ads().default().initialize();
    initialized = true;
  } catch {
    /* ads are best-effort — never block the app */
  }
}

// Play a rewarded ad tied to (userId, feature). Resolves 'earned' once AdMob
// fires the reward (the server-side grant follows via admob-ssv), 'dismissed'
// if the user closes it early, 'unavailable' if no ad could be shown.
export function showRewardedForQuota(
  userId: string,
  feature: string,
): Promise<RewardOutcome> {
  if (isWeb) return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: RewardOutcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };
    try {
      const { RewardedAd, RewardedAdEventType, AdEventType } = ads();
      const ad = RewardedAd.createForAdRequest(rewardedUnitId(), {
        serverSideVerificationOptions: { customData: `${userId}|${feature}` },
      });

      let earned = false;
      // Safety timeout: if nothing loads, don't hang the UI.
      const timer = setTimeout(() => finish('unavailable'), 20000);

      ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        clearTimeout(timer);
        finish(earned ? 'earned' : 'dismissed');
      });
      ad.addAdEventListener(AdEventType.ERROR, () => {
        clearTimeout(timer);
        finish('unavailable');
      });

      ad.load();
    } catch {
      finish('unavailable');
    }
  });
}
