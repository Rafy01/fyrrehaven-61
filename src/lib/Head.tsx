import { useEffect } from "react";
import { site } from "./siteMeta";

type Lang = "da" | "en";

export type HeadProps = {
  lang: Lang;
  path: string; // fx "/da" eller "/en/house"
  title: string;
  description: string;
  ogImage?: string; // absolut URL eller /public-sti
  noindex?: boolean;
  jsonLd?: object;
};

const ogLocale = (l: Lang) => (l === "da" ? "da_DK" : "en_GB");

function upsertMeta(by: { name?: string; property?: string }, content: string) {
  const sel = by.name
    ? `meta[name="${by.name}"]`
    : `meta[property="${by.property}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) {
    el = document.createElement("meta");
    if (by.name) el.setAttribute("name", by.name);
    if (by.property) el.setAttribute("property", by.property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(
  rel: string,
  href: string,
  attrs: Record<string, string> = {}
) {
  const sel = `link[rel="${rel}"]${
    attrs["hreflang"] ? `[hreflang="${attrs["hreflang"]}"]` : ""
  }`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (attrs["hreflang"]) el.setAttribute("hreflang", attrs["hreflang"]);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function Head({
  lang,
  path,
  title,
  description,
  ogImage,
  noindex,
  jsonLd,
}: HeadProps) {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", "ltr");

    document.title = title;

    // Canonical + hreflang
    const rest = path.replace(/^\/(da|en)/, "");
    const canonical = `${site.baseUrl}/${lang}${rest || ""}`;
    const hrefDa = `${site.baseUrl}/da${rest || ""}`;
    const hrefEn = `${site.baseUrl}/en${rest || ""}`;

    upsertLink("canonical", canonical);
    upsertLink("alternate", hrefDa, { hreflang: "da" });
    upsertLink("alternate", hrefEn, { hreflang: "en" });
    upsertLink("alternate", canonical, { hreflang: "x-default" });

    // Description & robots
    upsertMeta({ name: "description" }, description);
    if (noindex) upsertMeta({ name: "robots" }, "noindex,nofollow");
    else {
      const robots = document.head.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    // OG + Twitter
    const image = ogImage?.startsWith("http")
      ? ogImage
      : `${site.baseUrl}${ogImage || site.defaultImage}`;
    const locale = ogLocale(lang);

    upsertMeta({ property: "og:site_name" }, site.name);
    upsertMeta({ property: "og:type" }, "website");
    upsertMeta({ property: "og:locale" }, locale);
    upsertMeta({ property: "og:title" }, title);
    upsertMeta({ property: "og:description" }, description);
    upsertMeta({ property: "og:url" }, canonical);
    upsertMeta({ property: "og:image" }, image);

    upsertMeta({ name: "twitter:card" }, "summary_large_image");
    if (site.twitter) upsertMeta({ name: "twitter:site" }, site.twitter);
    upsertMeta({ name: "twitter:title" }, title);
    upsertMeta({ name: "twitter:description" }, description);
    upsertMeta({ name: "twitter:image" }, image);

    // JSON-LD
    const id = "app-jsonld";
    const old = document.getElementById(id);
    if (old) old.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [lang, path, title, description, ogImage, noindex, jsonLd]);

  return null;
}
