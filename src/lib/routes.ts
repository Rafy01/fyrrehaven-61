export type { Lang } from "./lang"; // ⟵ re-eksportér Lang
import type { Lang } from "./lang";

export type PageKey =
  | "home"
  | "house"
  | "area"
  | "gallery"
  | "faq"
  | "contact"
  | "book"
  | "cookies"
  | "fees"
  | "chat";

/** Lokale slugs pr. side pr. sprog.
 *  Tip: vi bruger ASCII (omraadet) for simplicity. Du kan godt bruge diakritiske tegn hvis du ønsker.
 */
export const SLUGS: Record<PageKey, Record<Lang, string>> = {
  home: { da: "", en: "" },
  house: { da: "Sommerhuset-fyrrehaven-61", en: "the-house-fyrrehaven-61" },
  area: { da: "omraadet-skov-og-strand", en: "area-forest-and-beach" },
  gallery: {
    da: "galleri-fyrrehaven-61-billeder",
    en: "gallery-photos-fyrrehaven-61",
  },
  faq: { da: "ofte-stillede-sporgsmal", en: "faq" },
  contact: { da: "kontakt", en: "contact" },
  book: { da: "booking", en: "book" },
  cookies: { da: "cookies", en: "cookies" },
  fees: { da: "Gebyrer", en: "Fees" },
  chat: { da: "chat-ukendte-sporgsmal", en: "chat-unknown-questions" },
};

/** Byg sti for en given side og sprog. */
export function pathOf(lang: Lang, key: PageKey): string {
  const slug = SLUGS[key][lang];
  return `/${lang}${slug ? `/${slug}` : ""}`;
}

/** Reverse lookup: slug -> page key per sprog */
const REVERSE: Record<Lang, Record<string, PageKey>> = {
  da: Object.fromEntries(
    Object.entries(SLUGS).map(([k, v]) => [v.da || "", k as PageKey])
  ),
  en: Object.fromEntries(
    Object.entries(SLUGS).map(([k, v]) => [v.en || "", k as PageKey])
  ),
};

/** Find {lang, key} ud fra en pathname. Returnerer null hvis det ikke ligner vores struktur. */
export function parsePath(
  pathname: string
): { lang: Lang; key: PageKey } | null {
  const parts = pathname.replace(/^\/+/, "").split("/");
  const langSeg = (parts[0] || "") as Lang;
  if (langSeg !== "da" && langSeg !== "en") return null;
  const slug = decodeURIComponent(parts[1] || "");
  const key = REVERSE[langSeg][slug];
  if (key) return { lang: langSeg, key };
  // tom slug = home
  if (!slug) return { lang: langSeg, key: "home" };
  return null;
}

/** Skift sprog men bevar samme side (mapper slug korrekt). */
export function switchLangPath(pathname: string, next: Lang): string {
  const parsed = parsePath(pathname);
  const key: PageKey = parsed?.key ?? "home";
  return pathOf(next, key);
}
