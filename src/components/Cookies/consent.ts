import type { Lang } from "../../lib/lang";

export type ConsentCategories = {
  necessary: true; // altid sand
  analytics: boolean;
  marketing: boolean;
};

export type ConsentState = {
  v: number; // versionsnummer (bump ved større ændring)
  ts: string; // ISO timestamp
  lang: Lang;
  categories: ConsentCategories;
};

const COOKIE_NAME = "fh61_consent";
const COOKIE_DAYS = 180;
const VERSION = 1;

function setCookie(name: string, value: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}
function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function defaultConsent(lang: Lang): ConsentState {
  return {
    v: VERSION,
    ts: new Date().toISOString(),
    lang,
    categories: { necessary: true, analytics: false, marketing: false },
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function readConsent(_lang: Lang): ConsentState | null {
  try {
    const raw = getCookie(COOKIE_NAME) || localStorage.getItem(COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.v !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(next: ConsentState) {
  const str = JSON.stringify(next);
  setCookie(COOKIE_NAME, str, COOKIE_DAYS);
  try {
    localStorage.setItem(COOKIE_NAME, str);
  } catch { /* empty */ }
  // emit event så andre kan reagere (fx init analytics)
  window.dispatchEvent(
    new CustomEvent<ConsentState>("fh61:consentchange", { detail: next })
  );
}

export function updateConsent(partial: Partial<ConsentCategories>, lang: Lang) {
  const current = readConsent(lang) ?? defaultConsent(lang);
  const next: ConsentState = {
    ...current,
    ts: new Date().toISOString(),
    lang,
    categories: { ...current.categories, ...partial },
  };
  writeConsent(next);
  return next;
}

export function allowed(cat: keyof ConsentCategories, lang: Lang): boolean {
  const c = readConsent(lang);
  if (!c) return cat === "necessary"; // før valg: kun nødvendige
  return !!c.categories[cat];
}
