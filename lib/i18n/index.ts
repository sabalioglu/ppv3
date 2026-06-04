// lib/i18n/index.ts — Stovd localization (English-first, device-locale aware).
//
// English is the primary/default language. On startup we read the device locale;
// if it's Turkish we switch to 'tr', otherwise we stay on 'en'. Missing keys fall
// back to English. There is intentionally NO in-app language picker yet.
//
// Each screen area owns ONE file under ./locales/<area>.ts exporting
//   export default { en: { ... }, tr: { ... } }
// so areas can be edited independently (no merge conflicts). Register new areas
// in the AREAS map below.
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import common from './locales/common';
import tabs from './locales/tabs';
import home from './locales/home';
import recipes from './locales/recipes';
import recipeDetail from './locales/recipeDetail';
import cookbook from './locales/cookbook';
import pantry from './locales/pantry';
import shopping from './locales/shopping';
import camera from './locales/camera';
import nutrition from './locales/nutrition';
import settings from './locales/settings';
import auth from './locales/auth';
import mealPlan from './locales/mealPlan';
import subscription from './locales/subscription';

const AREAS = {
  common,
  tabs,
  home,
  recipes,
  recipeDetail,
  cookbook,
  pantry,
  shopping,
  camera,
  nutrition,
  settings,
  auth,
  mealPlan,
  subscription,
};

type Area = { en: Record<string, unknown>; tr: Record<string, unknown> };

function buildLocale(lang: 'en' | 'tr') {
  const out: Record<string, unknown> = {};
  for (const [ns, dict] of Object.entries(AREAS)) {
    out[ns] = (dict as Area)[lang];
  }
  return out;
}

export const i18n = new I18n({
  en: buildLocale('en'),
  tr: buildLocale('tr'),
});
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const deviceLang = getLocales?.()?.[0]?.languageCode ?? 'en';
i18n.locale = deviceLang === 'tr' ? 'tr' : 'en';

/** Translate a namespaced key, e.g. t('home.title'). Interpolate via { count: 3 }. */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/** Hook form for components. Locale is fixed at startup (device-driven). */
export function useTranslation() {
  return { t, locale: i18n.locale };
}
