// src/lib/lang.ts
export type Lang = "da" | "en";

const KEY = "lang";

export function getStoredLang(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "da" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

export function getNavigatorLang(): Lang {
  const nav =
    typeof navigator !== "undefined"
      ? navigator.languages?.[0] ?? navigator.language ?? ""
      : "";
  return nav.toLowerCase().startsWith("da") ? "da" : "en";
}

/** Vælg startsprog: først localStorage, ellers device/browser. */
export function pickInitialLang(): Lang {
  return getStoredLang() ?? getNavigatorLang();
}

/** Gem valgt sprog (localStorage + cookie) */
export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch { /* empty */ }
  try {
    document.cookie = `lang=${lang};path=/;max-age=${60 * 60 * 24 * 365}`;
  } catch { /* empty */ }
}

/** Byg sprogpræfiksede paths sikkert */
export function lp(lang: Lang, path = ""): string {
  const clean = path ? (path.startsWith("/") ? path : "/" + path) : "";
  return `/${lang}${clean}`;
}
