/** Saml en robots-streng ud fra options */
export function robotsToString(opts) {
    const parts = [];
    parts.push(opts.index === false ? "noindex" : "index");
    parts.push(opts.follow === false ? "nofollow" : "follow");
    if (opts.noarchive)
        parts.push("noarchive");
    if (opts.noimageindex)
        parts.push("noimageindex");
    if (opts.notranslate)
        parts.push("notranslate");
    parts.push(`max-snippet:${opts.maxSnippet ?? -1}`);
    parts.push(`max-image-preview:${opts.maxImagePreview ?? "large"}`);
    parts.push(`max-video-preview:${opts.maxVideoPreview ?? -1}`);
    return parts.join(", ");
}
/** Default-logik: preview/staging = noindex, production = index */
export function defaultRobots() {
    const env = import.meta.env?.MODE ||
        (typeof process !== "undefined" ? process.env.NODE_ENV : "production");
    const siteNoindex = import.meta.env?.VITE_ROBOTS_NOINDEX === "1" ||
        (typeof process !== "undefined" && process.env.VITE_ROBOTS_NOINDEX === "1");
    const isProd = env === "production" && !siteNoindex;
    const base = isProd
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
    noindex: () => robotsToString({
        index: false,
        follow: false,
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
    }),
    noarchive: () => robotsToString({
        index: true,
        follow: true,
        noarchive: true,
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
    }),
};
/** Basal site-URL til canonical */
export function siteUrl() {
    const envUrl = import.meta.env?.VITE_SITE_URL ||
        (typeof process !== "undefined" ? process.env.VITE_SITE_URL : "");
    return (envUrl || "https://fyrrehaven-61.dk").replace(/\/+$/, "");
}
/** Keywords pr. side (da/en). NB: meta keywords har lille SEO-vægt, men efterspurgt */
export const KEYWORDS = {
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
    },
    house: {
        da: [
            "sommerhuset detaljer",
            "sovepladser",
            "pool 29 grader",
            "brændefyret vildmarksbad",
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
            "wood fired hot tub",
            "electric sauna",
            "family friendly",
            "fully equipped kitchen",
            "PS5",
            "terrace",
            "free parking",
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
    },
    contact: {
        da: ["kontakt sommerhus", "bookingforespørgsel", "Fyrrehaven 61 kontakt"],
        en: ["contact holiday home", "booking request", "Fyrrehaven 61 contact"],
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
    },
    cookies: {
        da: ["cookies", "cookiepolitik", "samtykke"],
        en: ["cookies", "cookie policy", "consent"],
    },
    fees: {
        da: ["gebyrer", "rengøringsgebyr", "ekstra omkostninger", "deposition"],
        en: ["fees", "cleaning fee", "extra charges", "deposit"],
    },
    privacy: {
        da: ["privatlivspolitik", "GDPR", "databeskyttelse"],
        en: ["privacy policy", "GDPR", "data protection"],
    },
    sitemap: {
        da: ["sitemap", "oversigt", "SEO", "intern linkstruktur"],
        en: ["sitemap", "overview", "SEO", "internal linking"],
    },
    chat: {
        da: ["chat", "spørgsmål", "support"],
        en: ["chat", "questions", "support"],
    },
};
