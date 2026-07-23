// Re-eksportér Lang for andre moduler, og importér den lokalt som type
export type { Lang } from "./lang";
import type { Lang } from "./lang";

export type PageKey =
  | "home"
  | "house"
  | "area"
  | "gallery"
  | "faq"
  | "contact"
  | "book"
  | "fees"
  | "chat"
  | "privacy"
  | "sitemap";

// Public slugs pr. side pr. sprog
export const SLUGS: Record<PageKey, Record<Lang, string>> = {
  home: { da: "", en: "", de: "" },
  house: { da: "sommerhuset-fyrrehaven-61", en: "the-house-fyrrehaven-61", de: "das-haus-fyrrehaven-61" },
  area: { da: "omraadet-skov-og-strand", en: "area-forest-and-beach", de: "region-wald-und-strand" },
  gallery: {
    da: "galleri-fyrrehaven-61-billeder",
    en: "gallery-photos-fyrrehaven-61",
    de: "galerie-fotos-fyrrehaven-61",
  },
  faq: { da: "ofte-stillede-sporgsmal", en: "frequently-asked-questions", de: "haufig-gestellte-fragen" },
  contact: { da: "kontakt", en: "contact", de: "kontakt" },
  book: { da: "booking", en: "book", de: "buchung" },
  fees: { da: "gebyrer", en: "fees", de: "gebuehren" },
  chat: { da: "chat-ukendte-sporgsmal", en: "chat-unknown-questions", de: "chat-unbekannte-fragen" },
  privacy: { da: "privatlivspolitik", en: "privacy-policy", de: "datenschutzrichtlinie" },
  sitemap: { da: "sitemap", en: "sitemap", de: "sitemap" },
};

// Gæste-sider (separat fordi de har præfikset `/guest`)
export const GUEST_PAGES: Record<"welcome" | "manual" | "activityRoom" | "pool" | "sauna" | "spa" | "contact" | "practicalInfo" | "checkInOut" | "extraServices", Record<Lang, string>> = {
  welcome: { da: "velkomst", en: "welcome", de: "willkommen" },
  manual: { da: "manual", en: "manual", de: "benutzerhandbuch" },
  activityRoom: { da: "aktivitetsrum", en: "activity-room", de: "aktivitaetsraum" },
  pool: { da: "pool", en: "pool", de: "pool" },
  sauna: { da: "sauna", en: "sauna", de: "sauna" },
  spa: { da: "vildmarksbad", en: "hot-tub", de: "whirlpool" },
  contact: { da: "kontakt", en: "contact", de: "kontakt" },
  practicalInfo: { da: "praktisk-info", en: "practical-info", de: "praktische-infos" },
  checkInOut: { da: "tjek-ind-ud", en: "check-inout", de: "check-in-check-out" },
  extraServices: { da: "ekstra-services", en: "extra-services", de: "zusatzleistungen" },
};

// Bruges til at lave URL-stier for public sider
export function pathOf(lang: Lang, key: PageKey): string {
  const slug = SLUGS[key][lang] ?? "";
  return `/${lang}${slug ? `/${slug}` : ""}`;
}

export type GuestPageKey = keyof typeof GUEST_PAGES;

export function guestPathOf(lang: Lang, key: GuestPageKey, hash?: string): string {
  const slug = GUEST_PAGES[key][lang] ?? GUEST_PAGES[key].en;
  return `/guest/${lang}/${slug}${hash ? `#${hash}` : ""}`;
}

// Reverse lookup: slug -> page key
const REVERSE: Record<Lang, Record<string, PageKey>> = {
  da: Object.fromEntries(
    Object.entries(SLUGS).map(([k, v]) => [v.da || "", k as PageKey])
  ),
  en: Object.fromEntries(
    Object.entries(SLUGS).map(([k, v]) => [v.en || "", k as PageKey])
  ),
  de: Object.fromEntries(
    Object.entries(SLUGS).map(([k, v]) => [v.de || "", k as PageKey])
  ),
};

// Find {lang, key} ud fra public path
export function parsePath(
  pathname: string
): { lang: Lang; key: PageKey } | null {
  const parts = pathname.replace(/^\/+/, "").split("/");
  const langSeg = (parts[0] || "") as Lang;
  if (langSeg !== "da" && langSeg !== "en" && langSeg !== "de") return null;

  const slug = decodeURIComponent(parts[1] || "");
  const key = REVERSE[langSeg][slug];
  if (key) return { lang: langSeg, key };

  if (!slug) return { lang: langSeg, key: "home" };
  return null;
}

// Bruges til sprogskift – understøtter både public og guest
export function switchLangPath(pathname: string, next: Lang): string {
  const parts = pathname.replace(/^\/+/, "").split("/");

  // Hvis det er gæste-side
  if (parts[0] === "guest") {
    const currentLang = parts[1] as Lang;
    const guestSlug = parts[2] || "";

    const matchingKey = Object.entries(GUEST_PAGES).find(
      ([, slugs]) => slugs[currentLang] === guestSlug
    )?.[0] as keyof typeof GUEST_PAGES;

    if (matchingKey) {
      const newSlug = GUEST_PAGES[matchingKey][next];
      return `/guest/${next}/${newSlug}`;
    }

    return `/guest/${next}`; // fallback hvis ukendt slug
  }

  // Ellers: public side
  const parsedPublic = parsePath(pathname);
  const key: PageKey = parsedPublic?.key ?? "home";
  return pathOf(next, key);
}
