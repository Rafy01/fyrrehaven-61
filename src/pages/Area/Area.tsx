// src/pages/Area/area.tsx
import React from "react";
import { Container, Box, Heading, Text } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import type { Lang } from "../../lib/lang";
import QuickFilters from "../../components/QuickFilters";
import ActivitiesGrid from "../../components/ActivitiesGrid";
import type { TagId } from "../../lib/tags";
import type { Activity } from "../../components/ActivitiesGrid/ActivitiesGrid";
// import { ATTRACTIONS } from "../../lib/attractions"; // ← henter listen
// import { ATTRACTIONS } from "../../lib/attractions"; // ← henter listen
import { ATTRACTIONS } from "../../data/attractions"; // ← henter listen

export default function Area({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const path = pathOf(lang, "area");
  const [selected, setSelected] = React.useState<TagId[]>([]);

  /** ---------- SEO ---------- */
  const seoTitle = t(
    "Området – skov, strand og oplevelser tæt på",
    "Area – forest, beach and nearby experiences"
  );
  const seoDescription = t(
    "Fra skovsti ved døren til strand på få minutter. Se kortet og vores bedste tips til udflugter på Djursland.",
    "From forest trails at your doorstep to the beach in minutes. See the map and our top tips for day trips on Djursland."
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: t("Fjellerup – skov & strand", "Fjellerup – forest & beach"),
    description: seoDescription,
    url: `https://fyrrehaven-61.dk${path}`,
    touristType: t("Familier", "Families"),
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
    "Area – forest, beach and nearby experiences"
  );
  const heroSubtitle = t(
    "Skovsti ved huset, strand i cykelafstand og masser af udflugter for hele familien.",
    "Forest trails from the house, bikeable beach and plenty of family-friendly day trips."
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
        ogImage="/og-area.jpg"
        jsonLd={jsonLd}
      />
      <Hero
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t("Strand 900 m", "Beach 900 m"),
          t("Skovstier", "Forest trails"),
          t("Familievenligt", "Family friendly"),
          t("Djurs Sommerland 12 min", "Djurs Sommerland 12 min"),
        ]}
        primaryCta={{
          label: t("Book nu", "Book now"),
          to: `${path}#book`,
        }}
        secondaryCta={{
          label: t("Se området", "View the area"),
          to: "#filters",
        }}
        media={{
          type: "image",
          src: "/area/area-hero.webp",
          alt: t(
            "Strand og skov ved Fjellerup",
            "Beach and forest at Fjellerup"
          ),
        }}
        align="left"
        layout="media-right"
      />
      {/* Kort */}
      <Container size="3" id="map">
        <Box py="6">
          <Heading size="6" mb="2">
            {t("Kort over området", "Map of the area")}
          </Heading>
          <Text color="gray">
            {t(
              "Zoom og se vores udvalgte steder. Afstande er omtrentlige.",
              "Zoom and explore our selected places. Distances are approximate."
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
        aria-label={t("Udflugter og aktiviteter", "Trips & activities")}
      >
        <Box pb="6">
          <ActivitiesGrid lang={lang} items={items} selected={selected} />
        </Box>
      </Container>
    </>
  );
}
