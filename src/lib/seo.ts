// src/lib/seo.ts
import type { Lang } from "./lang";
import type { PageKey } from "./routes";

/** Kan bruges til at bygge robots-direktiv programmatisk */
export type RobotsOptions = {
  /** index/noindex */
  index?: boolean; // default: true i prod, false i preview
  /** follow/nofollow */
  follow?: boolean; // default: true i prod, false i preview
  /** ikke vise cache-kopi */
  noarchive?: boolean; // default: false
  /** blokér billedeindeksering */
  noimageindex?: boolean; // default: false
  /** ”Oversæt ikke” i Google */
  notranslate?: boolean; // default: false
  /** snippet-længde: -1 = ubegrænset */
  maxSnippet?: number; // default: -1
  /** large | standard | none */
  maxImagePreview?: "large" | "standard" | "none"; // default: "large"
  /** ant. sek. af video preview: -1 = ubegrænset */
  maxVideoPreview?: number; // default: -1
};

/** Saml en robots-streng ud fra options */
export function robotsToString(opts: RobotsOptions): string {
  const parts: string[] = [];
  parts.push(opts.index === false ? "noindex" : "index");
  parts.push(opts.follow === false ? "nofollow" : "follow");
  if (opts.noarchive) parts.push("noarchive");
  if (opts.noimageindex) parts.push("noimageindex");
  if (opts.notranslate) parts.push("notranslate");
  parts.push(`max-snippet:${opts.maxSnippet ?? -1}`);
  parts.push(`max-image-preview:${opts.maxImagePreview ?? "large"}`);
  parts.push(`max-video-preview:${opts.maxVideoPreview ?? -1}`);
  return parts.join(", ");
}

/** Default-logik: preview/staging = noindex, production = index */
export function defaultRobots(): string {
  const env =
    (import.meta as ImportMeta).env?.MODE ||
    (typeof process !== "undefined" ? process.env.NODE_ENV : "production");

  const siteNoindex =
    (import.meta as ImportMeta).env?.VITE_ROBOTS_NOINDEX === "1" ||
    (typeof process !== "undefined" && process.env.VITE_ROBOTS_NOINDEX === "1");

  const isProd = env === "production" && !siteNoindex;

  const base: RobotsOptions = isProd
    ? { index: true, follow: true }
    : { index: false, follow: false };

  return robotsToString({
    ...base,
    maxSnippet: -1,
    maxImagePreview: "large",
    maxVideoPreview: -1,
  });
}

/** Praktiske presets */
export const ROBOTS_PRESETS = {
  public: defaultRobots, // index/follow i prod, ellers noindex
  noindex: () =>
    robotsToString({
      index: false,
      follow: false,
      maxSnippet: -1,
      maxImagePreview: "large",
      maxVideoPreview: -1,
    }),
  noarchive: () =>
    robotsToString({
      index: true,
      follow: true,
      noarchive: true,
      maxSnippet: -1,
      maxImagePreview: "large",
      maxVideoPreview: -1,
    }),
};

/** Basal site-URL til canonical */
export function siteUrl(): string {
  const envUrl =
    (import.meta as ImportMeta).env?.VITE_SITE_URL ||
    (typeof process !== "undefined" ? process.env.VITE_SITE_URL : "");
  return (envUrl || "https://fyrrehaven-61.dk").replace(/\/+$/, "");
}

/** Keywords pr. side (da/en). NB: meta keywords har lille SEO-vægt, men efterspurgt */
export const KEYWORDS: Record<PageKey, Record<Lang, string[]>> = {
  home: {
    da: [
      "sommerhus med pool",
      "vildmarksbad",
      "sauna",
      "Fjellerup Strand",
      "Djursland ferie",
      "familieferie",
      "10 personer",
      "privat udlejning",
      "feriehus",
      "udendørs opvarmet pool",
      "Djurs Sommerland",
      "Fyrrehaven 61",
    ],
    en: [
      "holiday home with pool",
      "hot tub",
      "sauna",
      "Fjellerup Beach",
      "Djursland",
      "family holiday",
      "sleeps 10",
      "private rental",
      "outdoor heated pool",
      "Denmark vacation home",
      "Fyrrehaven 61",
    ],
    de: [
      "Ferienhaus mit Pool",
      "Whirlpool",
      "Sauna",
      "Fjellerup Strand",
      "Djursland Urlaub",
      "Familienurlaub",
      "10 Personen",
      "private Vermietung",
      "Ferienhaus",
      "Außenpool beheizt",
      "Djurs Sommerland",
      "Fyrrehaven 61",
    ],
  },
  house: {
    da: [
      "sommerhuset detaljer",
      "sovepladser",
      "pool 29 grader",
      "Elektrisk vildmarksbad",
      "el sauna",
      "familievenligt",
      "køkken med alt",
      "PS5",
      "terrasse",
      "gratis parkering",
    ],
    en: [
      "house details",
      "sleeping arrangements",
      "29C outdoor pool",
      "electric hot tub",
      "electric sauna",
      "family friendly",
      "fully equipped kitchen",
      "PS5",
      "terrace",
      "free parking",
    ],
    de: [
      "Hausdetails",
      "Schlafplätze",
      "29°C Außenpool",
      "elektrischer Whirlpool",
      "elektrische Sauna",
      "familienfreundlich",
      "voll ausgestattete Küche",
      "PS5",
      "Terrasse",
      "kostenlose Parkplätze",
    ],
  },
  area: {
    da: [
      "Fjellerup oplevelser",
      "strand og skov",
      "Djursland seværdigheder",
      "vandreruter",
      "cykelruter",
      "spisesteder Fjellerup",
    ],
    en: [
      "Fjellerup attractions",
      "beach and forest",
      "Djursland sights",
      "hiking trails",
      "cycling routes",
      "places to eat Fjellerup",
    ],
    de: [
      "Fjellerup Attraktionen",
      "Strand und Wald",
      "Djursland Sehenswürdigkeiten",
      "Wanderwege",
      "Fahrradwege",
      "Restaurants Fjellerup",
    ],
  },
  gallery: {
    da: [
      "billeder sommerhus",
      "pool billeder",
      "wellness billeder",
      "interiør",
      "eksteriør",
    ],
    en: [
      "holiday home photos",
      "pool photos",
      "wellness photos",
      "interior",
      "exterior",
    ],
    de: [
      "Bilder Ferienhaus",
      "Pool Bilder",
      "Wellness Bilder",
      "Interieur",
      "Exterieur",
    ],
  },
  faq: {
    da: [
      "praktisk info sommerhus",
      "check ind",
      "rengøring",
      "sengetøj",
      "regler",
      "afbestilling",
    ],
    en: [
      "practical info holiday home",
      "check in",
      "cleaning",
      "linen",
      "house rules",
      "cancellation",
    ],
    de: [
      "praktische Infos Ferienhaus",
      "Check-in",
      "Reinigung",
      "Bettwäsche",
      "Hausregeln",
      "Stornierung",
    ],
  },
  contact: {
    da: ["kontakt sommerhus", "bookingforespørgsel", "Fyrrehaven 61 kontakt"],
    en: ["contact holiday home", "booking request", "Fyrrehaven 61 contact"],
    de: ["Kontakt Ferienhaus", "Buchungsanfrage", "Fyrrehaven 61 Kontakt"],
  },
  book: {
    da: [
      "book sommerhus",
      "pris pr nat",
      "tilgængelighed",
      "kalender",
      "ferie Djursland",
    ],
    en: [
      "book holiday home",
      "price per night",
      "availability",
      "calendar",
      "Djursland holiday",
    ],
    de: [
      "Ferienhaus buchen",
      "Preis pro Nacht",
      "Verfügbarkeit",
      "Kalender",
      "Djursland Urlaub",
    ],
  },
  cookies: {
    da: ["cookies", "cookiepolitik", "samtykke"],
    en: ["cookies", "cookie policy", "consent"],
    de: ["Cookies", "Cookie-Richtlinie", "Zustimmung"],
  },
  fees: {
    da: ["gebyrer", "rengøringsgebyr", "ekstra omkostninger", "deposition"],
    en: ["fees", "cleaning fee", "extra charges", "deposit"],
    de: ["Gebühren", "Reinigungsgebühr", "zusätzliche Kosten", "Kaution"],
  },
  privacy: {
    da: ["privatlivspolitik", "GDPR", "databeskyttelse"],
    en: ["privacy policy", "GDPR", "data protection"],
    de: ["Datenschutzerklärung", "DSGVO", "Datenschutz"],
  },
  sitemap: {
    da: ["sitemap", "oversigt", "SEO", "intern linkstruktur"],
    en: ["sitemap", "overview", "SEO", "internal linking"],
    de: ["Sitemap", "Übersicht", "SEO", "interne Verlinkung"],
  },
  chat: {
    da: ["chat", "spørgsmål", "support"],
    en: ["chat", "questions", "support"],
    de: ["Chat", "Fragen", "Support"],
  },
};
