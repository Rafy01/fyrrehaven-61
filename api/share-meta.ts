// /api/share-meta.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsePath, pathOf, type PageKey } from "../src/lib/routes";
import type { Lang } from "../src/lib/lang";
import { getPageMeta } from "../src/lib/meta";

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)
  );

export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = (req.query.path as string) || "/";
  // parsePath returnerer { lang, key } iflg. din eksisterende helper
  const parsed = parsePath(raw) || {
    lang: "da" as Lang,
    key: "home" as PageKey,
  };
  const meta = getPageMeta(parsed.lang, parsed.key);

  const host = `https://${req.headers.host}`;
  const canonical = `${host}${raw}`;
  const hrefDa = `${host}${pathOf("da", parsed.key)}`;
  const hrefEn = `${host}${pathOf("en", parsed.key)}`;
  const ogLocale = parsed.lang === "da" ? "da_DK" : "en_GB";
  const altLocale = parsed.lang === "da" ? "en_GB" : "da_DK";

  res.setHeader("content-type", "text/html; charset=UTF-8");
  res.setHeader(
    "cache-control",
    "public, max-age=600, s-maxage=600, stale-while-revalidate=86400"
  );

  res.status(200).send(`<!doctype html>
<html lang="${parsed.lang}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="da" href="${hrefDa}">
<link rel="alternate" hreflang="en" href="${hrefEn}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
<meta property="og:site_name" content="Fyrrehaven 61">
<meta property="og:type" content="website">
<meta property="og:locale" content="${ogLocale}">
<meta property="og:locale:alternate" content="${altLocale}">
<meta property="og:title" content="${escapeHtml(meta.title)}">
<meta property="og:description" content="${escapeHtml(meta.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${meta.image}">
<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(meta.title)}">
<meta name="twitter:description" content="${escapeHtml(meta.description)}">
<meta name="twitter:image" content="${meta.image}">
</head><body></body></html>`);
}
