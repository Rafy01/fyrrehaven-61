// api/share-meta.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Lang = "da" | "en";
type PageKey =
  | "home"
  | "house"
  | "area"
  | "gallery"
  | "faq"
  | "contact"
  | "book";

const BASE_URL = process.env.SITE_URL || "https://fyrrehaven-61.dk";
const OG_IMAGE =
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg"; // JPG!

// Slugs (som i din router)
const SLUGS: Record<PageKey, Record<Lang, string>> = {
  home: { da: "", en: "" },
  house: { da: "Sommerhuset-fyrrehaven-61", en: "the-house-fyrrehaven-61" },
  area: { da: "omraadet-skov-og-strand", en: "area-forest-and-beach" },
  gallery: {
    da: "galleri-fyrrehaven-61-billeder",
    en: "gallery-photos-fyrrehaven-61",
  },
  faq: { da: "ofte-stillede-sporgsmal", en: "frequently-asked-questions" },
  contact: { da: "kontakt", en: "contact" },
  book: { da: "booking", en: "book" },
};

// Hurtig reverse lookup
const REVERSE: Record<Lang, Record<string, PageKey>> = {
  da: Object.fromEntries(
    Object.entries(SLUGS).map(([k, v]) => [v.da || "", k as PageKey])
  ),
  en: Object.fromEntries(
    Object.entries(SLUGS).map(([k, v]) => [v.en || "", k as PageKey])
  ),
};

function parsePath(pathname: string): { lang: Lang; key: PageKey } {
  const parts = pathname.replace(/^\/+/, "").split("/");
  const lang = (parts[0] === "en" ? "en" : "da") as Lang;
  const slug = decodeURIComponent(parts[1] || "");
  const key = (REVERSE[lang][slug] ?? "home") as PageKey;
  return { lang, key };
}

const META: Record<
  PageKey,
  {
    title: Record<Lang, string>;
    desc: Record<Lang, string>;
    image?: string;
  }
> = {
  home: {
    title: {
      da: "Fyrrehaven 61 – sommerhus til 10 ved skov & strand",
      en: "Fyrrehaven 61 – holiday home for 10 by forest & beach",
    },
    desc: {
      da: "Familievenligt sommerhus ved Fjellerup Strand med opvarmet udendørs pool (1. maj–1. oktober), elektrisk vildmarksbad og el-sauna. Plads til 10 gæster, 4 soveværelser og lyse fællesrum tæt på skov og stier. Book privat eller via Airbnb.",
      en: "Family-friendly holiday home by Fjellerup Beach with a heated outdoor pool (May 1–Oct 1), electric hot tub and electric sauna. Sleeps 10 with 4 bedrooms and bright living areas close to forest trails. Book privately or via Airbnb.",
    },
    image: OG_IMAGE,
  },
  house: {
    title: {
      da: "Sommerhuset – pool, vildmarksbad & sauna | Fyrrehaven 61",
      en: "The House – pool, hot tub & sauna | Fyrrehaven 61",
    },
    desc: {
      da: "Sommerhus til 10 med udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad og el-sauna. Familievenligt tæt på skov og strand. Book via Airbnb.",
      en: "Holiday home for 10 with an outdoor heated pool (May 1–Oct 1), electric hot tub and electric sauna. Family-friendly near forest and beach. Book on Airbnb.",
    },
    image: OG_IMAGE,
  },
  area: {
    title: {
      da: "Området – skov, strand og oplevelser tæt på",
      en: "Area – forest, beach and nearby experiences",
    },
    desc: {
      da: "Skovsti ved huset, strand i cykelafstand og masser af udflugter for hele familien. Se kort og tips til Djursland.",
      en: "Forest trails from the house, the beach within biking distance and plenty of family day trips. See the map & tips for Djursland.",
    },
    image: OG_IMAGE,
  },
  gallery: {
    title: {
      da: "Galleri – billeder af hus, pool og omgivelser",
      en: "Gallery – photos of the house, pool and surroundings",
    },
    desc: {
      da: "Se billeder af stue, køkken-alrum, soveværelser og hems – plus udendørs opvarmet pool, elektrisk vildmarksbad, el-sauna og nærliggende skov og strand ved Fjellerup.",
      en: "Browse photos of the living room, kitchen-diner, bedrooms and loft — plus the heated outdoor pool, electric hot tub, electric sauna and nearby forest & beach in Fjellerup.",
    },
    image: OG_IMAGE,
  },
  faq: {
    title: {
      da: "FAQ – ofte stillede spørgsmål om Fyrrehaven 61",
      en: "FAQ – frequently asked questions about Fyrrehaven 61",
    },
    desc: {
      da: "Find svar på tjek-ind, pool & wellness, sengetøj, betaling, regler m.m.",
      en: "Answers about check-in, pool & wellness, linens, payment, house rules and more.",
    },
    image: OG_IMAGE,
  },
  contact: {
    title: {
      da: "Kontakt Fyrrehaven 61 – spørgsmål om booking og ophold",
      en: "Contact Fyrrehaven 61 – questions about booking and stays",
    },
    desc: {
      da: "Spørg til datoer, priser, faciliteter eller særlige ønsker. Skriv via formularen — vi svarer typisk samme dag.",
      en: "Ask about dates, pricing, amenities or special requests. Send us a message — we usually reply the same day.",
    },
    image: OG_IMAGE,
  },
  book: {
    title: {
      da: "Booking hos Fyrrehaven 61 – direkte forespørgsel eller Airbnb",
      en: "Book Fyrrehaven 61 – direct request or Airbnb",
    },
    desc: {
      da: "Book direkte hos værterne eller via Airbnb. Opvarmet udendørs pool (1. maj–1. okt.), plads til 10 og familievenligt nær skov og strand.",
      en: "Book directly with the hosts or via Airbnb. Heated outdoor pool (May 1–Oct 1), sleeps 10 and family-friendly near forest and beach.",
    },
    image: OG_IMAGE,
  },
};

function isBot(ua: string) {
  return /(Googlebot|AdsBot-Google|GoogleOther|bot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|discord|telegram|pinterest|embedly|quora link preview|vkShare|google-InspectionTool|googleweblight|bingbot)/i.test(
    ua || ""
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua = (req.headers["user-agent"] as string) || "";
  // Hvis det IKKE er en bot, send videre til SPA
  if (!isBot(ua)) {
    res.setHeader("Location", "/");
    res.status(307).end();
    return;
  }

  const url = new URL(req.url || "/", BASE_URL);
  const { lang, key } = parsePath(url.pathname);
  const m = META[key];
  const title = m.title[lang];
  const desc = m.desc[lang];
  const image = m.image || OG_IMAGE;
  const ogW = 1200,
    ogH = 630;

  const canonical = `${BASE_URL}/${lang}${
    SLUGS[key][lang] ? `/${SLUGS[key][lang]}` : ""
  }`;
  const hrefDa = `${BASE_URL}/da${
    SLUGS[key]["da"] ? `/${SLUGS[key]["da"]}` : ""
  }`;
  const hrefEn = `${BASE_URL}/en${
    SLUGS[key]["en"] ? `/${SLUGS[key]["en"]}` : ""
  }`;
  const locale = lang === "da" ? "da_DK" : "en_GB";
  const altLocale = lang === "da" ? "en_GB" : "da_DK";

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="da" href="${hrefDa}">
  <link rel="alternate" hreflang="en" href="${hrefEn}">
  <link rel="alternate" hreflang="x-default" href="${hrefDa}">

  <meta property="og:site_name" content="Fyrrehaven 61">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${locale}">
  <meta property="og:locale:alternate" content="${altLocale}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="${ogW}">
  <meta property="og:image:height" content="${ogH}">
  <meta property="og:image:alt" content="${escapeHtml(title)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${image}">
</head>
<body></body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ((
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as { [key: string]: string }
      )[c])
  );
}
