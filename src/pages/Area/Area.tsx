// src/pages/Area/area.tsx
import React from "react";
import { Container, Box, Heading, Text } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import { chooseLang } from "../../lib/lang";
import type { Lang } from "../../lib/lang";
import QuickFilters from "../../components/QuickFilters";
import ActivitiesGrid from "../../components/ActivitiesGrid/ActivitiesGrid";
import type { TagId } from "../../lib/tags";
import type { Activity } from "../../components/ActivitiesGrid/ActivitiesGrid";
// import { ATTRACTIONS } from "../../lib/attractions"; // ← henter listen
// import { ATTRACTIONS } from "../../lib/attractions"; // ← henter listen
import { ATTRACTIONS } from "../../data/attractions"; // ← henter listen

export default function Area({ lang }: { lang: Lang }) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const path = pathOf(lang, "area");
  const [selected, setSelected] = React.useState<TagId[]>([]);

  /** ---------- SEO ---------- */
  const seoTitle = t(
    "Området – skov, strand og oplevelser tæt på",
    "Area – forest, beach and nearby experiences",
    "Region – Wald, Strand und Erlebnisse in der Nähe"
  );
  const seoDescription = t(
    "Oplev Fjellerup og Djursland fra Fyrrehaven 61: skovstier fra døren, strand i gå- og cykelafstand, og familievenlige attraktioner som Djurs Sommerland, Mols Bjerge og Kattegatcentret. Se kortet og vores bedste lokale tips.",
    "Explore Fjellerup and Djursland from Fyrrehaven 61: forest trails at the doorstep, a beach within walking and biking distance, and family attractions like Djurs Sommerland, Mols Bjerge and the Kattegat Centre. See the map and our top local tips.",
    "Entdecken Sie Fjellerup und Djursland von Fyrrehaven 61 aus: Wanderwege am Haus, Strand in Geh- und Fahrraddistanz und familienfreundliche Attraktionen wie Djurs Sommerland, Mols Bjerge und das Kattegat Center. Sehen Sie die Karte und unsere besten lokalen Tipps."
  );
  const seoKeywords =
    lang === "da"
      ? [
          "Fjellerup",
          "Djursland",
          "skov og strand",
          "familievenlige oplevelser",
          "Djurs Sommerland",
          "Mols Bjerge",
          "Kattegatcentret",
          "Grenaa",
          "Ebeltoft",
          "vandreruter",
          "cykelruter",
          "Fyrrehaven 61",
        ]
      : [
          "Fjellerup",
          "Djursland",
          "forest and beach",
          "family attractions",
          "Djurs Sommerland",
          "Mols Bjerge",
          "Kattegat Centre",
          "Grenaa",
          "Ebeltoft",
          "hiking trails",
          "cycling routes",
          "Fyrrehaven 61",
        ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: t(
      "Fjellerup – skov & strand",
      "Fjellerup – forest & beach",
      "Fjellerup – Wald & Strand"
    ),
    description: seoDescription,
    url: `https://fyrrehaven-61.dk${path}`,
    touristType: t("Familier", "Families", "Familien"),
    containsPlace: [
      { "@type": "Place", name: t("Fjellerup Strand", "Fjellerup Beach") },
      { "@type": "Place", name: "Djurs Sommerland" },
      {
        "@type": "Place",
        name: t("Mols Bjerge Nationalpark", "Mols Bjerge National Park"),
      },
      {
        "@type": "Place",
        name: t("Kattegatcentret (Grenaa)", "Kattegat Centre (Grenaa)"),
      },
    ],
    areaServed: { "@type": "AdministrativeArea", name: "Djursland" },
  };

  /** ---------- HERO ---------- */
  const heroTitle = t(
    "Området – skov, strand og oplevelser tæt på",
    "Area – forest, beach and nearby experiences",
    "Region – Wald, Strand und Erlebnisse in der Nähe"
  );
  const heroSubtitle = t(
    "Skovsti ved huset, strand i cykelafstand og masser af udflugter for hele familien.",
    "Forest trails from the house, bikeable beach and plenty of family-friendly day trips.",
    "Waldwege am Haus, Strand in Fahrradentfernung und viele Ausflugsziele für die ganze Familie."
  );

  /** ---------- Filterede data fra ATTRACTIONS ---------- */
  const items: Activity[] = React.useMemo(() => {
    // Single-select + “Alle”: tomt array = vis alt
    if (selected.length === 0) return ATTRACTIONS as Activity[];
    const tag = selected[0];
    return (ATTRACTIONS as Activity[]).filter((a) => a.tags.includes(tag));
  }, [selected]);

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
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t("Strand 900 m", "Beach 900 m", "Strand 900 m"),
          t("Skovstier", "Forest trails", "Waldwege"),
          t("Familievenligt", "Family friendly", "Familienfreundlich"),
          t("Djurs Sommerland 12 min", "Djurs Sommerland 12 min", "Djurs Sommerland 12 Min."),
        ]}
        primaryCta={{
          label: t("Book nu", "Book now", "Jetzt buchen"),
          to: pathOf(lang, "book"),
        }}
        secondaryCta={{
          label: t("Se området", "View the area", "Gebiet ansehen"),
          to: pathOf(lang, "house"),
        }}
        media={{
          type: "image",
          src: "/area/area-hero.webp",
          alt: t(
            "Strand og skov ved Fjellerup",
            "Beach and forest at Fjellerup",
            "Strand und Wald bei Fjellerup"
          ),
        }}
        align="left"
        layout="media-right"
      />
      {/* Kort */}
      <Container size="3" id="map">
        <Box py="6">
          <Heading size="6" mb="2">
            {t("Kort over området", "Map of the area", "Karte der Region")}
          </Heading>
          <Text color="gray">
            {t(
              "Zoom og se vores udvalgte steder. Afstande er omtrentlige.",
              "Zoom and explore our selected places. Distances are approximate.",
              "Zoomen Sie und entdecken Sie unsere ausgewählten Orte. Entfernungen sind ungefähre Angaben."
            )}
          </Text>
          <Box mt="4" style={{ aspectRatio: "16 / 9", width: "100%" }}>
            <iframe
              title={t("Områdekort", "Area map")}
              src="https://www.google.com/maps/d/embed?mid=144jHAnieVKibH7nlt3mRpmImcWVoKic&ehbc=2E312F"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Box>
        </Box>
      </Container>
      {/* Quick filters (single + “Alle”) */}
      <Container size="3" id="filters">
        <Box py="3">
          <QuickFilters
            lang={lang} // "da" eller "en"
            value={selected}
            onChange={setSelected}
            syncToUrl
            dense
            mode="single"
            includeAll
          />
        </Box>
      </Container>
      {/* Aktivitetskort */}
      <Container
        size="3"
        id="trips"
        aria-label={t(
          "Udflugter og aktiviteter",
          "Trips & activities",
          "Ausflüge und Aktivitäten"
        )}
      >
        <Box pb="6">
          <ActivitiesGrid lang={lang} items={items} selected={selected} />
        </Box>
      </Container>
    </>
  );
}
