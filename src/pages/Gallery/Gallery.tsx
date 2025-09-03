// src/pages/Gallery/gallery.tsx
import { Container, Box } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import type { Lang } from "../../lib/lang";
// import Gallery from "../../components/Gallery";
import Gallery from "../../components/Gallery/Gallery";
import { galleryItems } from "../../data/gallery";
import { AIRBNB_URL } from "../../lib/links";

export default function GalleryPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const path = pathOf(lang, "gallery");

  /** ---------- SEO (meta + JSON-LD) ---------- */
  const seoTitle = t(
    "Galleri – billeder af hus, pool og omgivelser",
    "Gallery – photos of the house, pool and surroundings"
  );
  const seoDescription = t(
    "Se stemningsbilleder fra stue, køkken-alrum, soveværelser samt udendørs pool, vildmarksbad og skov/strand tæt på.",
    "Browse photos of living areas, bedrooms and the heated outdoor pool, hot tub and nearby forest/beach."
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Fyrrehaven 61",
    description: seoDescription,
    url: `https://fyrrehaven-61.dk${path}`,
  };

  /** ---------- Hero-tekster ---------- */
  const heroTitle = t("Galleri", "Gallery");
  const heroSubtitle = t(
    "Få fornemmelsen af stedet – klik et billede for fuld størrelse.",
    "Get a feel for the place — click any photo to view full size."
  );

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seoTitle}
        description={seoDescription}
        ogImage="/og-gallery.jpg"
        jsonLd={jsonLd}
      />

      <Hero
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t("Opvarmet udendørs pool", "Heated outdoor pool"),
          t("Vildmarksbad & sauna", "Hot tub & sauna"),
          t("Skov & strand i nærheden", "Forest & beach nearby"),
        ]}
        primaryCta={{
          label: t("Book via Airbnb", "Book on Airbnb"),
          href: AIRBNB_URL,
          external: true,
        }}
        secondaryCta={{
          label: t("Se billederne", "See photos"),
          to: `${path}#grid`,
        }}
        media={{
          type: "image",
          src: "/gallery/hero-cover.webp",
          alt: t("Udklip fra galleriet", "Gallery cover collage"),
        }}
        align="left"
        layout="media-right"
      />

      {/* Fuldt galleri (grid med faste tile-størrelser) */}
      <Container size="3" id="grid">
        <Box py="6">
          <Gallery
            lang={lang}
            title={t("Alle billeder", "All photos")}
            subtitle={t(
              "Klik for at åbne billedfremviser. Brug piletasterne, swipe – og “I” for tekst.",
              "Click to open the lightbox. Use arrows, swipe – and “I” for text."
            )}
            items={galleryItems(lang)} // din datafil med alt/captions på DA/EN
            tile={{ width: 260, height: 360 }} // faste dimensioner
            gap={14}
            maxItems={6} // viser 6 felter + “+N” på sidste
          />
        </Box>
      </Container>
    </>
  );
}
