
import { Helmet } from "react-helmet-async";
import { site } from "./siteMeta";

type Lang = "da" | "en";

export type SEOProps = {
  lang: Lang;
  /** path inkl. sprogprefiks, fx "/da" eller "/en/house" */
  path: string;
  title: string;
  description: string;
  ogImage?: string; // absolut URL eller /public-sti
  noindex?: boolean;
  jsonLd?: object; // optional structured data
};

const localeOf = (l: Lang) => (l === "da" ? "da_DK" : "en_GB");
const hrefFor = (l: Lang, path: string) => {
  const rest = path.replace(/^\/(da|en)/, "");
  return `${site.baseUrl}/${l}${rest || ""}`;
};

export function SEO({
  lang,
  path,
  title,
  description,
  ogImage,
  noindex,
  jsonLd,
}: SEOProps) {
  const canonical = hrefFor(lang, path);
  const altDa = hrefFor("da", path);
  const altEn = hrefFor("en", path);
  const image = ogImage?.startsWith("http")
    ? ogImage
    : `${site.baseUrl}${ogImage || site.defaultImage}`;

  return (
    <Helmet htmlAttributes={{ lang, dir: "ltr" }}>
      {/* Title & meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="index,follow" />}

      {/* Canonical + hreflang */}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="da" href={altDa} />
      <link rel="alternate" hrefLang="en" href={altEn} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Open Graph */}
      <meta property="og:site_name" content={site.name} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={localeOf(lang)} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${site.name} – ${title}`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {site.twitter && <meta name="twitter:site" content={site.twitter} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD (structured data) */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
