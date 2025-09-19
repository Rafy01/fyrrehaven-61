// scripts/generate-sitemap.ts
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/* ---------- Konfiguration ---------- */
const BASE_URL = process.env.SITE_URL || "https://fyrrehaven-61.dk";
type Lang = "da" | "en";
const LANGS: Lang[] = ["da", "en"];

/* ---------- Slugs (samme som i din router) ---------- */
type PageKey =
  | "home"
  | "house"
  | "area"
  | "gallery"
  | "faq"
  | "contact"
  | "book"
  | "cookies"
  | "fees"
  | "privacy";

const SLUGS: Record<PageKey, Record<Lang, string>> = {
  home: { da: "", en: "" },
  house: { da: "sommerhuset-fyrrehaven-61", en: "the-house-fyrrehaven-61" },
  area: { da: "omraadet-skov-og-strand", en: "area-forest-and-beach" },
  gallery: {
    da: "galleri-fyrrehaven-61-billeder",
    en: "gallery-photos-fyrrehaven-61",
  },
  faq: { da: "ofte-stillede-sporgsmal", en: "frequently-asked-questions" },
  contact: { da: "kontakt", en: "contact" },
  book: { da: "booking", en: "book" },
  cookies: { da: "cookies", en: "cookies" },
  fees: { da: "gebyrer", en: "fees" },
  privacy: { da: "privatlivspolitik", en: "privacy-policy" },
};

function pathOf(lang: Lang, key: PageKey): string {
  const slug = SLUGS[key][lang];
  return `/${lang}${slug ? `/${slug}` : ""}`;
}

/* ---------- Sider der skal med i sitemap ---------- */
type ChangeFreq = "daily" | "weekly" | "monthly" | "yearly";
const PAGES: Array<{
  key: PageKey;
  priority: number;
  changefreq: ChangeFreq;
  images?: Array<{ loc: string; title?: string; caption?: string }>;
}> = [
  {
    key: "home",
    priority: 1.0,
    changefreq: "daily",
    images: [
      {
        loc: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.webp",
        title: "Fyrrehaven 61 – udendørs pool & wellness",
        caption:
          "Forsidebillede: opvarmet udendørs pool, vildmarksbad og sauna.",
      },
    ],
  },
  {
    key: "house",
    priority: 0.95,
    changefreq: "monthly",
    images: [
      {
        loc: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.webp",
        title: "Sommerhuset – plads til 10",
        caption: "Sengepladser, køkken, ophold, pool, sauna og vildmarksbad.",
      },
    ],
  },
  { key: "book", priority: 0.9, changefreq: "daily" },
  { key: "fees", priority: 0.8, changefreq: "monthly" },
  { key: "privacy", priority: 0.5, changefreq: "yearly" },
  { key: "cookies", priority: 0.5, changefreq: "yearly" },
  { key: "area", priority: 0.7, changefreq: "monthly" },
  { key: "gallery", priority: 0.7, changefreq: "monthly" },
  { key: "faq", priority: 0.6, changefreq: "monthly" },
  { key: "contact", priority: 0.7, changefreq: "monthly" },
];

const nowISO = new Date().toISOString();
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const abs = (u: string) => (u.startsWith("http") ? u : `${BASE_URL}${u}`);

function buildUrlEntry(
  key: PageKey,
  priority: number,
  changefreq: ChangeFreq,
  images?: Array<{ loc: string; title?: string; caption?: string }>
) {
  const primaryLang: Lang = "da";
  const canonical = abs(pathOf(primaryLang, key));

  const alternates = LANGS.map(
    (l) =>
      `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(
        abs(pathOf(l, key))
      )}"/>`
  ).join("");

  const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(
    canonical
  )}"/>`;

  const imageTags =
    images
      ?.map((im) => {
        const parts = [
          `<image:loc>${esc(abs(im.loc))}</image:loc>`,
          im.title ? `<image:title>${esc(im.title)}</image:title>` : "",
          im.caption ? `<image:caption>${esc(im.caption)}</image:caption>` : "",
        ].join("");
        return `<image:image>${parts}</image:image>`;
      })
      .join("") ?? "";

  return `
  <url>
    <loc>${esc(canonical)}</loc>
    ${alternates}
    ${xDefault}
    <lastmod>${nowISO}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>
    ${imageTags}
  </url>`;
}

function writePublic(file: string, contents: string) {
  mkdirSync(join(process.cwd(), "public"), { recursive: true });
  writeFileSync(join(process.cwd(), "public", file), contents, "utf8");
  console.log(`✓ wrote /public/${file}`);
}

function generatePageSitemap() {
  const body = PAGES.map((p) =>
    buildUrlEntry(p.key, p.priority, p.changefreq, p.images)
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${body}
</urlset>`.trim();
  writePublic("sitemap.xml", xml);
}

function generateRobots() {
  const robots = `User-agent: *
Allow: /

# Undgå index af parameter-URL'er
Disallow: /*?*

Sitemap: ${abs("/sitemap.xml")}
`;
  writePublic("robots.txt", robots);
}

generatePageSitemap();
generateRobots();

/* Gør filen til et modul for at tilfredsstille tsconfig `isolatedModules` */
export {};
