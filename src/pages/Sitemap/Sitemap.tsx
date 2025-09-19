import React from "react";
import { Helmet } from "react-helmet-async";
import { SLUGS } from "../../lib/routes";

type Props = { lang: "da" | "en" };

const labels = {
  da: {
    title: "Sitemap",
    home: "Forside",
    house: "Sommerhuset",
    area: "Området",
    gallery: "Galleri",
    faq: "FAQ",
    contact: "Kontakt",
    book: "Booking",
    cookies: "Cookies",
    fees: "Gebyrer",
    privacy: "Privatlivspolitik",
    xml: "XML sitemap",
  },
  en: {
    title: "Sitemap",
    home: "Home",
    house: "The house",
    area: "Area",
    gallery: "Gallery",
    faq: "FAQ",
    contact: "Contact",
    book: "Book",
    cookies: "Cookies",
    fees: "Fees",
    privacy: "Privacy policy",
    xml: "XML sitemap",
  },
} as const;

const Sitemap: React.FC<Props> = ({ lang }) => {
  const L = labels[lang];

  // Hjælper til at bygge absolut sti pr. side
  const href = (key: keyof typeof SLUGS) =>
    `/${lang}${SLUGS[key][lang] ? `/${SLUGS[key][lang]}` : ""}`;

  return (
    <>
      <Helmet>
        <title>{L.title}</title>
        {/* HTML-sitemap som side: noindex (brug /sitemap.xml til bots) */}
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={`https://fyrrehaven-61.dk/${lang}`} />
        <link
          rel="alternate"
          href="https://fyrrehaven-61.dk/da"
          hrefLang="da"
        />
        <link
          rel="alternate"
          href="https://fyrrehaven-61.dk/en"
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://fyrrehaven-61.dk/${lang}`}
          hrefLang="x-default"
        />
      </Helmet>

      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">{L.title}</h1>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <a href={href("home")}>{L.home}</a>
          </li>
          <li>
            <a href={href("house")}>{L.house}</a>
          </li>
          <li>
            <a href={href("area")}>{L.area}</a>
          </li>
          <li>
            <a href={href("gallery")}>{L.gallery}</a>
          </li>
          <li>
            <a href={href("faq")}>{L.faq}</a>
          </li>
          <li>
            <a href={href("contact")}>{L.contact}</a>
          </li>
          <li>
            <a href={href("book")}>{L.book}</a>
          </li>
          <li>
            <a href={href("fees")}>{L.fees}</a>
          </li>
          <li>
            <a href={href("privacy")}>{L.privacy}</a>
          </li>
          <li>
            <a href={href("cookies")}>{L.cookies}</a>
          </li>
          <li>
            <a href="/sitemap.xml">{L.xml}</a>
          </li>
        </ul>
      </main>
    </>
  );
};

// 🔧 Default export for at matche importen i main.tsx
export default Sitemap;
