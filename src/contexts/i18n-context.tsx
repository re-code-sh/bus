import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, type Lang, type Strings } from '@/lib/i18n';
import { storage } from '@/lib/storage';

const LANG_STORAGE_KEY = 'istgah_lang';

type I18nContextValue = {
  lang: Lang;
  t: Strings;
  isRTL: boolean;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = storage.getString(LANG_STORAGE_KEY, '');
    if (saved === 'en' || saved === 'fa') return saved;
    const browserLang = navigator.language?.toLowerCase() ?? 'fa';
    return browserLang.startsWith('en') ? 'en' : 'fa';
  });

  const isRTL = lang === 'fa';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    storage.set(LANG_STORAGE_KEY, newLang);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      t: translations[lang],
      isRTL,
      setLang,
    }),
    [lang, isRTL]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
