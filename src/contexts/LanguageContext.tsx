import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, isLanguage, translate, type Language } from '../i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem('language');
  if (isLanguage(stored)) return stored;
  const nav = window.navigator.language?.toLowerCase() ?? '';
  if (nav.startsWith('nb') || nav.startsWith('nn') || nav.startsWith('no')) return 'nb';
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('el')) return 'el';
  if (nav.startsWith('en')) return 'en';
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(key, language, params),
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
