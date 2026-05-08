import { nb } from './locales/nb';
import { en } from './locales/en';
import { de } from './locales/de';
import { el } from './locales/el';

export type Language = 'nb' | 'en' | 'de' | 'el';

export const SUPPORTED_LANGUAGES: { code: Language; label: string }[] = [
  { code: 'nb', label: 'Norsk' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'el', label: 'Ελληνικά' },
];

export const DEFAULT_LANGUAGE: Language = 'nb';

const dictionaries: Record<Language, Record<string, unknown>> = { nb, en, de, el };

function getNested(dict: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function translate(
  key: string,
  language: Language,
  params?: Record<string, string | number>,
): string {
  let value = getNested(dictionaries[language], key)
    ?? getNested(dictionaries[DEFAULT_LANGUAGE], key)
    ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v));
    }
  }
  return value;
}

export function isLanguage(value: unknown): value is Language {
  return value === 'nb' || value === 'en' || value === 'de' || value === 'el';
}
