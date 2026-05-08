import { format, type Locale } from 'date-fns';
import { de, el, enUS, nb } from 'date-fns/locale';
import type { Language } from '../i18n';

const dateFnsLocales: Record<Language, Locale> = {
  nb,
  en: enUS,
  de,
  el,
};

const intlLocales: Record<Language, string> = {
  nb: 'nb-NO',
  en: 'en-US',
  de: 'de-DE',
  el: 'el-GR',
};

export function getDateFnsLocale(language: Language): Locale {
  return dateFnsLocales[language] ?? nb;
}

export function getIntlLocale(language: Language): string {
  return intlLocales[language] ?? 'nb-NO';
}

export function formatDate(date: Date | string | number, fmt: string, language: Language): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, fmt, { locale: getDateFnsLocale(language) });
}

export function formatDateShort(date: Date | string | number, language: Language): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getIntlLocale(language));
}
