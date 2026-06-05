// lib/purchases.ts — thin RevenueCat wrapper, isolated so the rest of the app
// never imports react-native-purchases directly.
//
// Web is a no-op: the RN Purchases SDK is native-only and the app also runs on
// web (localhost test + Netlify). On web, entitlement is read purely from the
// Supabase user_entitlements table (see hooks/useEntitlement.ts).
//
// The public SDK keys are NOT secrets (they ship in the app bundle by design).
// Set them via EAS env: EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY.
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isWeb = Platform.OS === 'web';

function apiKey(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  if (Platform.OS === 'ios') return extra.rcIosKey || null;
  if (Platform.OS === 'android') return extra.rcAndroidKey || null;
  return null;
}

let configured = false;

// Lazily require so web bundles never pull in the native module.
function rc() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('react-native-purchases').default;
}

export async function configurePurchases(userId?: string): Promise<void> {
  if (isWeb) return;
  const key = apiKey();
  if (!key) {
    console.warn('[purchases] no RevenueCat key set — paywall disabled');
    return;
  }
  try {
    const Purchases = rc();
    if (!configured) {
      Purchases.configure({ apiKey: key, appUserID: userId ?? null });
      configured = true;
    } else if (userId) {
      await Purchases.logIn(userId);
    }
  } catch (e) {
    console.warn('[purchases] configure failed', e);
  }
}

export async function logInPurchases(userId: string): Promise<void> {
  if (isWeb || !configured) return;
  try {
    await rc().logIn(userId);
  } catch (e) {
    console.warn('[purchases] logIn failed', e);
  }
}

export async function logOutPurchases(): Promise<void> {
  if (isWeb || !configured) return;
  try {
    await rc().logOut();
  } catch {
    /* ignore — anonymous already */
  }
}

// True if the RC "premium" entitlement is currently active.
export async function isPremiumFromRC(): Promise<boolean> {
  if (isWeb || !configured) return false;
  try {
    const info = await rc().getCustomerInfo();
    return !!info?.entitlements?.active?.premium;
  } catch {
    return false;
  }
}

export interface PackageLite {
  identifier: string;
  priceString: string;
  title: string;
  rcPackage: any; // the raw RC package, passed back to purchasePackage
}

export async function getOfferingPackages(): Promise<PackageLite[]> {
  if (isWeb || !configured) return [];
  try {
    const offerings = await rc().getOfferings();
    const current = offerings?.current;
    if (!current?.availablePackages?.length) return [];
    return current.availablePackages.map((p: any) => ({
      identifier: p.identifier,
      priceString: p.product?.priceString ?? '',
      title: p.product?.title ?? p.identifier,
      rcPackage: p,
    }));
  } catch (e) {
    console.warn('[purchases] getOfferings failed', e);
    return [];
  }
}

// Returns true if the purchase granted premium.
export async function purchase(pkg: PackageLite): Promise<boolean> {
  if (isWeb || !configured) return false;
  try {
    const { customerInfo } = await rc().purchasePackage(pkg.rcPackage);
    return !!customerInfo?.entitlements?.active?.premium;
  } catch (e: any) {
    if (e?.userCancelled) return false;
    throw e;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (isWeb || !configured) return false;
  try {
    const info = await rc().restorePurchases();
    return !!info?.entitlements?.active?.premium;
  } catch {
    return false;
  }
}
