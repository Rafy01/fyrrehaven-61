import { Container, Box } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import { chooseLang } from "../../lib/lang";
import type { Lang } from "../../lib/lang";
import Gallery from "../../components/Gallery/Gallery";
import { galleryItemsFromAlbum } from "../../data/gallery";
import styles from "./Gallery.module.css";

export default function GalleryPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const path = pathOf(lang, "gallery");
  const seo = getSeoMeta(lang, "gallery");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Fyrrehaven 61",
    description: seo.description,
    url: `https://fyrrehaven-61.dk${path}`,
  };

  const albums = [
    { id: "plantegning", label: t("Plantegning", "Floor plan", "Grundriss") },
    { id: "indoor", label: t("Indendørs", "Indoor", "Innenbereich") },
    { id: "pool", label: t("Pool", "Pool", "Pool") },
    { id: "spa", label: t("Spa", "Spa", "Spa") },
    { id: "sauna", label: t("Sauna", "Sauna", "Sauna") },
    { id: "outdoor", label: t("Udendørs", "Outdoor", "Outdoor") },
    { id: "area", label: t("Området", "Area (nearby)", "Umgebung") },
  ] as const;

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        jsonLd={jsonLd}
        robots={seo.robots}
        keywords={seo.keywords}
      />

      <Hero
        title={t("Galleri", "Gallery")}
        subtitle={t(
          "Få fornemmelsen af stedet – klik et billede for fuld størrelse.",
          "Get a feel for the place — click any photo to view full size.",
          "Erhalten Sie einen Eindruck vom Ort – klicken Sie auf ein Bild für die Vollansicht."
        )}
        badges={[
          t("Opvarmet udendørs pool", "Heated outdoor pool", "Beheizter Außenpool"),
          t("Vildmarksbad & sauna", "Hot tub & sauna", "Whirlpool & Sauna"),
          t("Skov & strand i nærheden", "Forest & beach nearby", "Wald & Strand in der Nähe"),
        ]}
        primaryCta={{
          label: t("Book privat", "Book direct", "Direkt buchen"),
          to: `${pathOf(lang, "book")}`,
        }}
        secondaryCta={{
          label: t("Se billederne", "See photos", "Fotos ansehen"),
          to: `${path}#grid`,
        }}
        media={{
          type: "image",
          src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3807.webp",
          alt: t("Udklip fra galleriet", "Gallery cover collage", "Galerie-Cover-Collage"),
          title: t(
            "Fyrrehaven 61 – feriehus ved Fjellerup Strand",
            "Fyrrehaven 61 – holiday home by Fjellerup Beach",
            "Fyrrehaven 61 – Ferienhaus am Fjellerup Strand"
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
