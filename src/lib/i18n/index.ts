import { de } from './de.js';
import { en, type Catalogue } from './en.js';
import { methodsDe } from './methods.de.js';
import { methodsEn, type MethodsCatalogue } from './methods.en.js';

export type Locale = 'en' | 'de';
export type { Catalogue };

export const LOCALES: Locale[] = ['en', 'de'];
const CATALOGUES: Record<Locale, Catalogue> = { en, de };
const STORAGE_KEY = 'neuroscreen.locale.v1';

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'de') return stored;
  } catch {
    // storage unavailable
  }
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

/**
 * The locale is resolved once per page load. Configs and components read the catalogue at
 * module load, so switching language reloads the page (see setLocale).
 */
const current: Locale = detectLocale();

if (typeof document !== 'undefined') document.documentElement.lang = current;

export function getLocale(): Locale {
  return current;
}

/** BCP 47 tag for Intl formatting and speech synthesis */
export function localeTag(locale: Locale = current): string {
  return locale === 'de' ? 'de-DE' : 'en-GB';
}

/** Access the catalogue of the active locale */
export function t(): Catalogue {
  return CATALOGUES[current];
}

/** Methods page text of the active locale */
export function methodsText(): MethodsCatalogue {
  return current === 'de' ? methodsDe : methodsEn;
}

/** Persist the locale and reload so every catalogue read picks it up */
export function setLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  location.reload();
}

/** Locale-aware number formatting (decimal comma in German) */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '–';
  return new Intl.NumberFormat(localeTag(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Percentage of a 0–1 proportion */
export function pct(value: number, digits = 0): string {
  return `${num(value * 100, digits)} %`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(localeTag(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
