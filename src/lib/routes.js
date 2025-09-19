// src/lib/routes.ts
/** Lokale slugs pr. side pr. sprog (brug lowercase ASCII + bindestreger) */
export const SLUGS = {
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
    chat: { da: "chat-ukendte-sporgsmal", en: "chat-unknown-questions" },
    privacy: { da: "privatlivspolitik", en: "privacy-policy" },
    sitemap: { da: "sitemap", en: "sitemap" },
};
/** Byg sti for en given side og sprog. */
export function pathOf(lang, key) {
    const slug = SLUGS[key][lang] ?? "";
    return `/${lang}${slug ? `/${slug}` : ""}`;
}
/** Reverse lookup: slug -> page key pr. sprog */
const REVERSE = {
    da: Object.fromEntries(Object.entries(SLUGS).map(([k, v]) => [v.da || "", k])),
    en: Object.fromEntries(Object.entries(SLUGS).map(([k, v]) => [v.en || "", k])),
};
/** Find {lang, key} ud fra en pathname. Returnerer null hvis ikke vores struktur. */
export function parsePath(pathname) {
    const parts = pathname.replace(/^\/+/, "").split("/");
    const langSeg = (parts[0] || "");
    if (langSeg !== "da" && langSeg !== "en")
        return null;
    const slug = decodeURIComponent(parts[1] || "");
    const key = REVERSE[langSeg][slug];
    if (key)
        return { lang: langSeg, key };
    // Tom slug = home
    if (!slug)
        return { lang: langSeg, key: "home" };
    return null;
}
/** Skift sprog men bevar samme side (mapper slug korrekt). */
export function switchLangPath(pathname, next) {
    const parsed = parsePath(pathname);
    const key = parsed?.key ?? "home";
    return pathOf(next, key);
}
