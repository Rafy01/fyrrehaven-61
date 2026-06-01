import { Container, Box } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import { chooseLang } from "../../lib/lang";
import type { Lang } from "../../lib/lang";
import Gallery from "../../components/Gallery/Gallery";
import { galleryItemsFromAlbum } from "../../data/gallery";
import styles from "./Gallery.module.css";

export default function GalleryPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const path = pathOf(lang, "gallery");

  const seoTitle = t(
    "Galleri – billeder af hus, pool og omgivelser",
    "Gallery – photos of the house, pool and surroundings",
    "Galerie – Fotos vom Haus, Pool und der Umgebung"
  );
  const seoDescription = t(
    "Se billeder af stue, køkken-alrum, soveværelser og hems – plus udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad, el-sauna og nærliggende skov og strand ved Fjellerup. Få et ærligt indtryk.",
    "Browse photos of the living room, kitchen-diner, bedrooms and loft — plus the heated outdoor pool (May 1–Oct 1), electric hot tub, electric sauna and nearby forest and beach in Fjellerup. Get a true feel for the place.",
    "Sehen Sie Fotos vom Wohnzimmer, Essbereich, Schlafzimmern und Dachboden – plus dem beheizten Außenpool (1. Mai–1. Okt), elektrischen Whirlwanne, Elektro-Sauna und dem nahegelegenen Wald und Strand bei Fjellerup. Gewinnen Sie einen echten Eindruck."
  );
  const seoKeywords =
    lang === "da"
      ? [
          "Fyrrehaven 61",
          "galleri",
          "billeder sommerhus",
          "udendørs opvarmet pool",
          "vildmarksbad",
          "sauna",
          "Fjellerup",
          "Djursland",
          "skov og strand",
          "familieferie",
        ]
      : lang === "de"
      ? [
          "Fyrrehaven 61",
          "Galerie",
          "Ferienhaus Fotos",
          "beheizter Außenpool",
          "Whirlpool",
          "Sauna",
          "Fjellerup",
          "Djursland",
          "Wald und Strand",
          "Familienurlaub",
        ]
      : [
          "Fyrrehaven 61",
          "gallery",
          "holiday home photos",
          "heated outdoor pool",
          "hot tub",
          "sauna",
          "Fjellerup",
          "Djursland",
          "forest and beach",
          "family holiday",
        ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Fyrrehaven 61",
    description: seoDescription,
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
        title={seoTitle}
        description={seoDescription}
        ogImage="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg"
        jsonLd={jsonLd}
        robots={{ index: true, follow: true, noarchive: true }}
        keywords={seoKeywords}
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
