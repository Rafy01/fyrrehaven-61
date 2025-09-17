import { Container, Box } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import type { Lang } from "../../lib/lang";
import Gallery from "../../components/Gallery/Gallery";
import { galleryItemsFromAlbum } from "../../data/gallery";
import { AIRBNB_URL } from "../../lib/links";
import styles from "./Gallery.module.css";

export default function GalleryPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const path = pathOf(lang, "gallery");

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

  const albums = [
    { id: "plantegning", label: t("Plantegning", "Floor plan") },
    { id: "indoor", label: t("Indendørs", "Indoor") },
    { id: "pool", label: "Pool" },
    { id: "spa", label: "Spa" },
    { id: "sauna", label: "Sauna" },
    { id: "outdoor", label: t("Udendørs", "Outdoor") },
    { id: "area", label: t("Området", "Area (nearby)") },
  ] as const;

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
        title={t("Galleri", "Gallery")}
        subtitle={t(
          "Få fornemmelsen af stedet – klik et billede for fuld størrelse.",
          "Get a feel for the place — click any photo to view full size."
        )}
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
          src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3807.webp",
          alt: t("Udklip fra galleriet", "Gallery cover collage"),
          title: t(
            "Fyrrehaven 61 – feriehus ved Fjellerup Strand",
            "Fyrrehaven 61 – holiday home by Fjellerup Beach"
          ),
        }}
        align="left"
        layout="media-right"
      />

      <Container size="3" id="grid">
        <Box py="6">
          <div className={styles.albumGrid}>
            {albums.map(({ id, label }) => (
              <figure key={id} className={styles.albumCard}>
                <div className={styles.thumbClamp}>
                  <Gallery
                    lang={lang}
                    items={galleryItemsFromAlbum(id)}
                    maxItems={1}
                    tile={{ width: 260, height: 420 }} // ⬅️ mere højde
                    fit="cover"
                  />
                </div>
                <figcaption className={styles.albumCaption}>{label}</figcaption>
              </figure>
            ))}
          </div>
        </Box>
      </Container>
    </>
  );
}
