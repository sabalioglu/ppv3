// contexts/LocaleContext.tsx — reactive app language.
//
// i18n.locale is a global mutable field and t() reads it directly, but plain
// t() calls don't re-render on a locale switch. This provider holds the active
// locale in React state so any component that calls useTranslation()/useLocale()
// re-renders the instant the language changes (no app restart).
//
// Module-level strings resolved once at import time (e.g. pantry CATEGORIES)
// still need a restart to fully re-resolve — that trade-off is accepted; the
// visible tab bar + screen strings update immediately.
import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  t as translate,
  getLocale,
  setLocale as persistLocale,
  type AppLocale,
} from '@/lib/i18n';

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (lang: AppLocale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: async () => {},
});

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // getLocale() reflects loadSavedLocale() which runs in app bootstrap before
  // the first render, so the initial value is already the persisted choice.
  const [locale, setLocaleState] = useState<AppLocale>(getLocale());

  const setLocale = useCallback(
    async (lang: AppLocale) => {
      if (lang === locale) return;
      await persistLocale(lang); // updates i18n.locale + AsyncStorage
      setLocaleState(lang); // re-render every consumer with the new strings
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

/** Active locale + a persisting setter. Use for the language picker. */
export const useLocale = () => useContext(LocaleContext);

/**
 * Reactive translation hook. Subscribing components re-render on locale change;
 * `t` is the global translator (reads the now-updated i18n.locale).
 */
export function useTranslation() {
  const { locale } = useContext(LocaleContext);
  return { t: translate, locale };
}
