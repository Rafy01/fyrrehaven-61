// src/lib/seo.ts

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
