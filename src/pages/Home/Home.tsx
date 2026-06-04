import { Separator, Container } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import Highlights from "../../components/Highlights"; 
import { pathOf } from "../../lib/routes";
import UspStrip from "../../components/UspStrip";
import {
  ClockIcon,
  LightningBoltIcon,
  LockClosedIcon,
  StarFilledIcon,
} from "@radix-ui/react-icons";
import GalleryTeaser from "../../components/GalleryTeaser";
import Reviews from "../../components/Reviews";

import LocationAndDistances from "../../components/LocationAndDistances";
import PracticalInfo from "../../components/PracticalInfo";
import { getSeoMeta } from "../../i18n/seo";
import { chooseLang } from "../../lib/lang";
import type { Lang } from "../../lib/lang";

export default function Home({ lang }: { lang: Lang }) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);

  const meta = getSeoMeta(lang, "home");

  /** ---------- HERO TEKSTER (visuelt indhold) ---------- */
  const heroTitle = t(
    "Familievenligt sommerhus i skoven – tæt på stranden",
    "Family-friendly holiday home in the forest – near the beach",
    "Familienfreundliches Ferienhaus im Wald – in Strandnähe"
  );
  const heroSubtitle = t(
    "Indendørs pool, vildmarksbad og god plads til hele familien.",
    "Indoor pool, hot tub and plenty of space for the whole family.",
    "Hallenbad, Whirlpool und viel Platz für die ganze Familie."
  );

  // Structured data for SEO (uses centralized meta without affecting the hero)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: "Fyrrehaven 61",
    description: meta.description,
    url: "https://fyrrehaven-61.dk",
    maximumAttendeeCapacity: 10,
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: t("Indendørs pool", "Indoor pool", "Hallenbad"),
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: t("Vildmarksbad", "Hot tub", "Whirlpool"),
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: t("Tæt på strand", "Near beach", "In Strandnähe"),
        value: true,
      },
    ],
    address: { "@type": "PostalAddress", addressCountry: "DK" },
  };

  return (
    <>
      {/* SEO/meta – kun title/description for søgemaskiner og social previews */}
      <Head
        lang={lang}
        path={pathOf(lang, "home")}
        title={meta.title}
        description={meta.description}
        ogImage={meta.image}
        ogImageAlt={meta.imageAlt}
        jsonLd={jsonLd}
        robots={meta.robots}
        keywords={meta.keywords}
      />
      <UspStrip
        ariaLabel={t("Hurtige fakta", "Quick facts", "Schnelle Fakten")}
        items={[
          {
            icon: <LightningBoltIcon />,
            text: t(
              "Lynhurtigt svar på henvendelser",
              "Lightning-fast replies",
              "Blitzschnelle Antworten"
            ),
            ariaLabel: t(
              "Vi svarer hurtigt på alle henvendelser",
              "We reply quickly to all inquiries",
              "Wir antworten schnell auf alle Anfragen"
            ),
          },
          {
            icon: <LockClosedIcon />,
            text: t(
              "Nem indtjekning (nøgleboks)",
              "Easy self check-in (key box)",
              "Einfacher Check-in (Schlüsseltresor)"
            ),
            ariaLabel: t(
              "Gæster modtager kode til nøgleboks og kan tjekke ind uden vært til stede",
              "Guests receive a key box code and can check in without the host present",
              "Gäste erhalten einen Schlüsselcode und können ohne Gastgeber einchecken"
            ),
          },
          {
            icon: <StarFilledIcon />,
            text: t(
              "4,8+ stjerner på Airbnb",
              "4.8+ stars on Airbnb",
              "4,8+ Sterne auf Airbnb"
            ),
            ariaLabel: t(
              "Gæsterne giver os over 4,8 stjerner på Airbnb",
              "Guests rate us 4.8+ stars on Airbnb",
              "Gäste bewerten uns mit über 4,8 Sternen auf Airbnb"
            ),
          },
          {
            icon: <ClockIcon />,
            text: t(
              "+3 års værts erfaring",
              "+3 years hosting experience",
              "+3 Jahre Gastgebererfahrung"
            ),
            ariaLabel: t(
              "Mere end tre års erfaring som værter",
              "More than three years of hosting experience",
              "Mehr als drei Jahre Erfahrung als Gastgeber"
            ),
          },
        ]}
      />
      {/* HERO – separat visuel titel/undertekst + badges/CTA’er */}
      <Hero
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t("10 gæster", "10 guests", "10 Gäste"),
          t("4 soveværelser", "4 bedrooms", "4 Schlafzimmer"),
          t("2 badværelser", "2 bathrooms", "2 Badezimmer"),
          t(
            "Pool-Vildmarksbad-Sauna",
            "Pool-Hottub-Sauna",
            "Pool-Whirlpool-Sauna"
          ),
        ]}
        primaryCta={{
          label: t("Book nu", "Book now", "Jetzt buchen"),
          href: pathOf(lang, "book"),
        }}
        secondaryCta={{
          label: t("Se huset", "See the house", "Haus ansehen"),
          to: pathOf(lang, "house"),
        }}
        media={{
          type: "image",
          src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3736.webp",
          title: t(
            "Fyrrehaven 61 – feriehus ved Fjellerup Strand",
            "Fyrrehaven 61 – holiday home by Fjellerup Beach",
            "Fyrrehaven 61 – Ferienhaus bei Fjellerup Strand"
          ),
          alt: t(
            "Skov og strand ved sommerhuset",
            "Forest and beach near the house",
            "Wald und Strand beim Ferienhaus"
          ),
        }}
        align="left"
      />

      <Separator size="4" />

      {/* Højdepunkter / Highlights – opdateret til dine 4 punkter */}
      <Container size="3">
        <Highlights
          title={t("Højdepunkter", "Highlights", "Highlights")}
          items={[
            {
              title: t("Opvarmet udendørs pool", "Heated outdoor pool", "Beheizter Außenpool"),
              body: t(
                "Åben 1. maj – 1. oktober. Perfekt efter strandturen.",
                "Open May 1 – Oct 1. Perfect after a beach day.",
                "Geöffnet 1. Mai – 1. Okt. Perfekt nach einem Strandtag."
              ),
              media: {
                kind: "image",
                src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3720.webp",
                alt: t(
                  "Opvarmet udendørs pool – åben 1. maj til 1. oktober",
                  "Heated outdoor pool – open May 1 to Oct 1",
                  "Beheizter Außenpool – geöffnet 1. Mai bis 1. Okt."
                ),
                aspect: "4 / 3",
              },
            },
            {
              title: t("Elektrisk vildmarksbad", "Electric hot tub", "Elektrischer Whirlpool"),
              body: t(
                "Autentisk spa oplevelse med elektrisk opvarmning og afslapning under stjernehimlen.",
                "Authentic spa experience with electric heating and relaxation under the stars.",
                "Authentisches Spa-Erlebnis mit elektrischer Wärme und Entspannung unter dem Sternenhimmel."
              ),
              media: {
                kind: "image",
                src: "/highlights/hot-tub-wood.webp",
                alt: t(
                  "Elektrisk vildmarksbad ved Fjellerup Strand",
                  "Electric hot tub at Fjellerup Strand",
                  "Elektrischer Whirlpool bei Fjellerup Strand"
                ),
                aspect: "4 / 3",
              },
            },
            {
              title: t("Sauna", "Sauna"),
              body: t(
                "Hurtig opvarmning og nem betjening, perfekt efter pool eller strand.",
                "Quick heating and easy to use, perfect after pool or beach."
              ),
              media: {
                kind: "image",
                src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3731.webp",
                alt: t(
                  "Sauna i sommerhuset",
                  "Sauna in the holiday home"
                ),
                aspect: "4 / 3",
              },
            },
            {
              title: t("Fantastisk område", "Fantastic surroundings"),
              body: t(
                "Skov og strand tæt på stier, natur og ro i kort afstand.",
                "Forest and beach close to trails, nature and tranquility nearby."
              ),
              media: {
                kind: "image",
                src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3663.webp",
                alt: t(
                  "Skov og strand tæt på sommerhuset",
                  "Forest and beach close to the holiday home"
                ),
                aspect: "4 / 3",
              },
            },
          ]}
        />
      </Container>
      <Separator size="4" />
      <GalleryTeaser
        title={t("Billeder", "Photos", "Bilder")}
        subtitle={t(
          "Få et hurtigt indtryk - se stue, pool, vildmarksbad og omgivelser.",
          "Get a quick feel—see the living room, pool, hot tub and surroundings.",
          "Verschaffen Sie sich einen schnellen Eindruck – sehen Sie Wohnzimmer, Pool, Whirlpool und Umgebung."
        )}
        items={[
          {
            src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3669.webp",
            alt: t("Stue med lysindfald", "Living room with daylight", "Wohnzimmer mit Tageslicht"),
          },
          {
            src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3668.webp",
            alt: t("Køkken-alrum", "Kitchen-living area", "Küche-Wohnbereich"),
          },
          {
            src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3692.webp",
            alt: t("Opvarmet udendørs pool", "Heated outdoor pool", "Beheizter Außenpool"),
          },
          {
            src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3696.webp",
            alt: t("Elektrisk vildmarksbad", "Electric hot tub", "Elektrischer Whirlpool"),
          },
          {
            src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3709.webp",
            alt: t("El-sauna", "Electric sauna", "Elektrische Sauna"),
          },
          {
            src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/2c0c5a11-59f7-4ddf-9fda-10068650f7a1.webp",
            alt: t("Skovsti mod stranden", "Forest path to the beach", "Waldweg zum Strand"),
          },
          // du kan have flere – +N overlay vises automatisk hvis items.length > max
        ]}
        cta={{
          label: t("Åbn galleri", "Open gallery", "Galerie öffnen"),
          to: pathOf(lang, "gallery"),
        }}
        align="center"
      />
      {/* Din oprindelige FEATURES-sektion forbliver uændret */}
      <Separator size="4" />
      <Reviews
        lang={lang}
        average={4.8}
      />
      <PracticalInfo
        lang={lang}
        variant="teaser"
        maxItems={6}
        ctaHref={pathOf(lang, "house")}
        ctaLabelDa="Læs mere om huset"
        ctaLabelEn="Read more about the house"
      />
      <LocationAndDistances
        lang={lang}
        mapEmbedUrl="https://www.google.com/maps/d/embed?mid=144jHAnieVKibH7nlt3mRpmImcWVoKic&ehbc=2E312F"
        mapLinkUrl="https://www.google.com/maps/d/viewer?mid=144jHAnieVKibH7nlt3mRpmImcWVoKic"
        directionsTo="Fyrrehaven 61, 8500"
        title={
          lang === "da"
            ? "Beliggenhed & afstande"
            : lang === "de"
            ? "Lage & Entfernungen"
            : "Location & distances"
        }
        subtitle={
          lang === "da"
            ? "Skovområde med stier – kort tur til stranden."
            : lang === "de"
            ? "Waldgebiet mit Wegen – kurzer Fußweg zum Strand."
            : "Forest area with trails — a short walk to the beach."
        }
      />
    </>
  );
}
