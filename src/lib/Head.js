// src/lib/Head.tsx
import { useEffect } from "react";
import { site } from "./siteMeta";
const ogLocale = (l) => (l === "da" ? "da_DK" : "en_GB");
// FIX: alternate skal være det MODSATTE sprog
const altLocale = (l) => (l === "da" ? "en_GB" : "da_DK");
function absUrl(u) {
    if (!u)
        return undefined;
    return u.startsWith("http") ? u : `${site.baseUrl.replace(/\/+$/, "")}${u}`;
}
function upsertMeta(by, content) {
    const sel = by.name
        ? `meta[name="${by.name}"]`
        : `meta[property="${by.property}"]`;
    let el = document.head.querySelector(sel);
    if (content == null || content === "") {
        if (el)
            el.remove();
        return;
    }
    if (!el) {
        el = document.createElement("meta");
        if (by.name)
            el.setAttribute("name", by.name);
        if (by.property)
            el.setAttribute("property", by.property);
        document.head.appendChild(el);
    }
    el.setAttribute("content", content);
}
function upsertLink(rel, href, attrs = {}) {
    const sel = `link[rel="${rel}"]` +
        (attrs["hreflang"] ? `[hreflang="${attrs["hreflang"]}"]` : "");
    let el = document.head.querySelector(sel);
    if (href == null || href === "") {
        if (el)
            el.remove();
        return;
    }
    if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        if (attrs["hreflang"])
            el.setAttribute("hreflang", attrs["hreflang"]);
        document.head.appendChild(el);
    }
    el.setAttribute("href", href);
}
/** Default-robots: noindex i preview (VITE_ROBOTS_NOINDEX=1) – ellers index/follow */
function defaultRobotsString() {
    const mode = import.meta.env?.MODE ||
        (typeof process !== "undefined" ? process.env.NODE_ENV : "production");
    const forceNoindex = import.meta?.env?.VITE_ROBOTS_NOINDEX === "1" ||
        (typeof process !== "undefined" && process.env.VITE_ROBOTS_NOINDEX === "1");
    const isProd = mode === "production" && !forceNoindex;
    return robotsToString({
        index: isProd,
        follow: isProd,
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
    });
}
function robotsToString(r) {
    const parts = [];
    parts.push(r.index === false ? "noindex" : "index");
    parts.push(r.follow === false ? "nofollow" : "follow");
    if (r.noarchive)
        parts.push("noarchive");
    if (r.noimageindex)
        parts.push("noimageindex");
    if (r.notranslate)
        parts.push("notranslate");
    parts.push(`max-snippet:${r.maxSnippet ?? -1}`);
    parts.push(`max-image-preview:${r.maxImagePreview ?? "large"}`);
    parts.push(`max-video-preview:${r.maxVideoPreview ?? -1}`);
    return parts.join(", ");
}
export default function Head({ lang, path, title, description, ogImage, ogImageAlt, ogImageWidth, ogImageHeight, noindex, robots, keywords, canonical, jsonLd, }) {
    useEffect(() => {
        // <html lang>
        const html = document.documentElement;
        html.setAttribute("lang", lang);
        html.setAttribute("dir", "ltr");
        // <title>
        document.title = title;
        // Canonical + hreflang (da/en/x-default)
        const rest = path.replace(/^\/(da|en)/, "");
        const base = site.baseUrl.replace(/\/+$/, "");
        const canonicalHref = canonical || `${base}/${lang}${rest || ""}`;
        const hrefDa = `${base}/da${rest || ""}`;
        const hrefEn = `${base}/en${rest || ""}`;
        upsertLink("canonical", canonicalHref);
        upsertLink("alternate", hrefDa, { hreflang: "da" });
        upsertLink("alternate", hrefEn, { hreflang: "en" });
        upsertLink("alternate", canonicalHref, { hreflang: "x-default" });
        // Meta: description
        upsertMeta({ name: "description" }, description);
        // Robots (prioritet: robots-prop > noindex-prop > default)
        let robotsStr;
        if (typeof robots === "string")
            robotsStr = robots;
        else if (typeof robots === "object")
            robotsStr = robotsToString(robots);
        else if (noindex)
            robotsStr =
                "noindex,nofollow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
        else
            robotsStr = defaultRobotsString();
        upsertMeta({ name: "robots" }, robotsStr);
        upsertMeta({ name: "googlebot" }, robotsStr);
        upsertMeta({ name: "bingbot" }, robotsStr);
        // Keywords (fjern hvis tom/ikke angivet)
        upsertMeta({ name: "keywords" }, keywords && keywords.length ? keywords.join(", ") : undefined);
        // Open Graph / Twitter
        const imageAbs = absUrl(ogImage || site.defaultImage);
        const locale = ogLocale(lang);
        const localeAlt = altLocale(lang);
        upsertMeta({ property: "og:site_name" }, site.name);
        upsertMeta({ property: "og:type" }, "website");
        upsertMeta({ property: "og:locale" }, locale);
        upsertMeta({ property: "og:title" }, title);
        upsertMeta({ property: "og:description" }, description);
        upsertMeta({ property: "og:url" }, canonicalHref);
        upsertMeta({ property: "og:image" }, imageAbs);
        upsertMeta({ property: "og:image:alt" }, ogImageAlt || title);
        upsertMeta({ property: "og:image:width" }, "1200");
        upsertMeta({ property: "og:image:height" }, "630");
        upsertMeta({ property: "og:locale:alternate" }, localeAlt);
        upsertMeta({ name: "twitter:card" }, "summary_large_image");
        if (site.twitter)
            upsertMeta({ name: "twitter:site" }, site.twitter);
        upsertMeta({ name: "twitter:title" }, title);
        upsertMeta({ name: "twitter:description" }, description);
        upsertMeta({ name: "twitter:image" }, imageAbs);
        upsertMeta({ name: "twitter:image:alt" }, ogImageAlt || title);
        // JSON-LD
        const id = "app-jsonld";
        const old = document.getElementById(id);
        if (old)
            old.remove();
        if (jsonLd) {
            const script = document.createElement("script");
            script.type = "application/ld+json";
            script.id = id;
            script.text = JSON.stringify(jsonLd);
            document.head.appendChild(script);
        }
    }, [
        lang,
        path,
        title,
        description,
        ogImage,
        ogImageAlt,
        ogImageWidth,
        ogImageHeight,
        noindex,
        robots,
        keywords,
        canonical,
        jsonLd,
    ]);
    return null;
}
