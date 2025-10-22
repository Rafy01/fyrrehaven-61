// scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";

const DOMAIN = "https://fyrrehaven-61.dk";
const pages = [
  "", // home
  "da",
  "da/sommerhuset-fyrrehaven-61",
  "da/omraadet-skov-og-strand",
  "da/galleri-fyrrehaven-61-billeder",
  "da/ofte-stillede-sporgsmal",
  "da/kontakt",
  "da/booking",
  "da/gebyrer",
  "da/privatlivspolitik",
  "da/cookies",
  "en",
  "en/the-house-fyrrehaven-61",
  "en/area-forest-and-beach",
  "en/gallery-photos-fyrrehaven-61",
  "en/frequently-asked-questions",
  "en/contact",
  "en/book",
  "en/fees",
  "en/privacy-policy",
  "en/cookies",
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `<url>
  <loc>${DOMAIN}/${page}</loc>
</url>`
  )
  .join("\n")}
</urlset>`;

const sitemapPath = path.resolve("public/sitemap.xml");
fs.writeFileSync(sitemapPath, xml);
console.log("✓ wrote sitemap.xml");
