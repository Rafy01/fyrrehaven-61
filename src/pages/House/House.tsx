// src/pages/House/House.tsx
import {
  Box,
  Container,
  Separator,
  Heading,
  Grid,
  Card,
} from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import { AIRBNB_URL } from "../../lib/links";
import styles from "./House.module.css";
import PracticalInfo from "../../components/PracticalInfo";
import Facilities from "../../components/Facilities";
import GalleryTeaser from "../../components/GalleryTeaser";

type Lang = "da" | "en";

export default function House({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  /* -------- SEO (kun meta) -------- */
  const seoTitle = t(
    "Sommerhuset – udendørs opvarmet pool, vildmarksbad & sauna | Fyrrehaven 61",
    "The House – outdoor heated pool, hot tub & sauna | Fyrrehaven 61"
  );
  const seoDescription = t(
    "Sommerhus til 10 med udendørs opvarmet pool (1. maj–1. oktober), brændefyret vildmarksbad og el-sauna. Familievenligt tæt på skov og strand. Book via Airbnb.",
    "Holiday home for 10 with an outdoor heated pool (May 1–Oct 1), wood-fired hot tub and electric sauna. Family-friendly near forest and beach. Book on Airbnb."
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: "Fyrrehaven 61 – House",
    description: seoDescription,
    url: `https://fyrrehaven-61.dk${pathOf(lang, "house")}`,
    maximumAttendeeCapacity: 10,
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: t("Udendørs opvarmet pool", "Outdoor heated pool"),
        value: true,
        description: t("Åben 1. maj – 1. oktober", "Open May 1 – Oct 1"),
      },
      {
        "@type": "LocationFeatureSpecification",
        name: t("Brændefyret vildmarksbad", "Wood-fired hot tub"),
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: t("El-sauna", "Electric sauna"),
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: t("Tæt på strand & skov", "Near beach & forest"),
        value: true,
      },
    ],
    address: { "@type": "PostalAddress", addressCountry: "DK" },
  };

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "house")}
        title={seoTitle}
        description={seoDescription}
        ogImage="/og-house.jpg"
        jsonLd={jsonLd}
      />

      {/* HERO */}
      <Hero
        title={t(
          "Sommerhuset – plads til 10, udendørs pool & wellness",
          "The House – sleeps 10, outdoor pool & wellness"
        )}
        subtitle={t(
          "4 soveværelser + hems. Udendørs opvarmet pool (1. maj–1. oktober), brændefyret vildmarksbad og el-sauna.",
          "4 bedrooms + loft. Outdoor heated pool (May 1–Oct 1), wood-fired hot tub and electric sauna."
        )}
        badges={[
          t("10 gæster", "10 guests"),
          t("4 soveværelser", "4 bedrooms"),
          t("2 badeværelser", "2 bathrooms"),
          t("Udendørs opvarmet pool", "Outdoor heated pool"),
          t("Vildmarksbad", "Hot tub"),
          t("Sauna", "Sauna"),
        ]}
        primaryCta={{
          label: t("Book via Airbnb", "Book on Airbnb"),
          href: AIRBNB_URL,
          external: true,
        }}
        secondaryCta={{
          label: t("Se galleri", "See gallery"),
          to: pathOf(lang, "gallery"),
        }}
        media={{
          type: "image",
          src: "/Fyrrehaven hero.webp",
          alt: t(
            "Udendørs poolområde ved sommerhuset",
            "Outdoor pool area at the house"
          ),
        }}
        align="left"
      />

      <Container size="3">
        {/* (FJERNET info-boks under hero som ønsket) */}

        <Separator size="4" />

        {/* Sovepladser & planløsning */}
        <Box asChild id="soverum">
          <section className={styles.section}>
            <Heading as="h2" size="6">
              {t("Sovepladser & planløsning", "Sleeping arrangements & layout")}
            </Heading>

            <Grid columns={{ initial: "1", md: "2" }} gap="4" mt="3">
              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("Senge (dobbeltsenge)", "Beds (double)")}
                </Heading>
                <ul className={styles.list}>
                  <li>
                    {t(
                      "4 dobbeltsenge i alt: 2× 180×200 cm og 2× 200×200 cm",
                      "4 double beds total: 2× 180×200 cm and 2× 200×200 cm"
                    )}
                  </li>
                  <li>
                    {t(
                      "Hver dobbeltseng har 2 puder (fiber 60×63/70) og 2 fiberdyner 135×200",
                      "Each double bed includes 2 pillows (fiber 60×63/70) and 2 fiber duvets 135×200"
                    )}
                  </li>
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("Sengetøj & opbevaring", "Linen & storage")}
                </Heading>
                <ul className={styles.list}>
                  <li>
                    {t(
                      "Sengetøj kan lejes efter ønske – ellers medbringes",
                      "Bed linen can be rented on request – otherwise bring your own"
                    )}
                  </li>
                  <li>
                    {t("Kommode med skuffer til tøj", "Chest of drawers")}
                  </li>
                  <li>{t("Spejl", "Mirror")}</li>
                  <li>{t("Hængekrog bag døren", "Hook behind the door")}</li>
                  <li>{t("2 natlamper", "2 bedside lamps")}</li>
                </ul>
              </Card>
            </Grid>
          </section>
        </Box>

        {/* Pool & wellness */}
        <Box asChild id="wellness">
          <section className={styles.section}>
            <Heading as="h2" size="6">
              {t("Pool & wellness", "Pool & wellness")}
            </Heading>

            <Grid columns={{ initial: "1", md: "3" }} gap="4" mt="3">
              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("Udendørs pool", "Outdoor pool")}
                </Heading>
                <ul className={styles.list}>
                  <li>{t("1,5 m dyb", "1.5 m deep")}</li>
                  <li>{t("3,5 m bred · 8 m lang", "3.5 m wide · 8 m long")}</li>
                  <li>{t("Opvarmet ca. 29 °C", "Heated approx. 29 °C")}</li>
                  <li>
                    {t("Sæson: 1. maj – 1. oktober", "Season: May 1 – Oct 1")}
                  </li>
                  <li>
                    {t(
                      "Tag/overdækning kan lukkes på kolde eller vindfulde dage",
                      "Cover/roof can be closed on cold or windy days"
                    )}
                  </li>
                  <li>
                    {t(
                      "Lys i poolen (kan tændes)",
                      "Pool lighting (switchable)"
                    )}
                  </li>
                  <li>
                    {t(
                      "Automatisk tilførsel af poolkemi",
                      "Automatic chemical dosing"
                    )}
                  </li>
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("Vildmarksbad", "Hot tub")}
                </Heading>
                <ul className={styles.list}>
                  <li>{t("Op til 6 personer", "Up to 6 people")}</li>
                  <li>{t("Opvarmes med brænde", "Wood-fired heating")}</li>
                  <li>
                    {t("Massagefunktion og lys", "Massage jets and lighting")}
                  </li>
                  <li>
                    {t(
                      "Vand fyldes med haveslange – kan mod tilkøb være fyldt før ankomst",
                      "Water is added via garden hose – can be pre-filled before arrival for an extra fee"
                    )}
                  </li>
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("Sauna", "Sauna")}
                </Heading>
                <ul className={styles.list}>
                  <li>{t("Op til 8 personer", "Up to 8 people")}</li>
                  <li>
                    {t(
                      "Lys indvendig og udvendig",
                      "Interior and exterior lights"
                    )}
                  </li>
                  <li>
                    {t(
                      "Hæld stille og roligt vand på ovnen for damp",
                      "Gently pour water on the heater for steam"
                    )}
                  </li>
                </ul>
              </Card>
            </Grid>
          </section>
        </Box>

        {/* Køkken & ophold */}
        <Box asChild id="koekken">
          <section className={styles.section}>
            <Heading as="h2" size="6">
              {t("Køkken & ophold", "Kitchen & living")}
            </Heading>

            <Grid columns={{ initial: "1", md: "2" }} gap="4" mt="3">
              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("Køkken", "Kitchen")}
                </Heading>
                <ul className={styles.list}>
                  <li>
                    {t(
                      "Fuldudstyret køkken: køle-/fryseskab, ovn, mikroovn",
                      "Fully equipped kitchen: fridge/freezer, oven, microwave"
                    )}
                  </li>
                  <li>
                    {t(
                      "Automatisk kaffemaskine, filterkaffe og stempelkande",
                      "Automatic coffee machine, filter coffee and French press"
                    )}
                  </li>
                  <li>{t("Affaldssortering", "Waste sorting")}</li>
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("Ophold & underholdning", "Living & entertainment")}
                </Heading>
                <ul className={styles.list}>
                  <li>
                    {t(
                      "Stort spisebord med plads til 10 personer",
                      "Large dining table seating 10"
                    )}
                  </li>
                  <li>
                    {t(
                      "Lyst rum med vinduer fra begge sider",
                      "Bright room with windows on both sides"
                    )}
                  </li>
                  <li>
                    {t(
                      "TV-område med sofa, stole og 55″ TV",
                      "TV area with sofa, chairs and 55″ TV"
                    )}
                  </li>
                  <li>{t("PlayStation 5", "PlayStation 5")}</li>
                </ul>
              </Card>
            </Grid>
          </section>
        </Box>
      </Container>
      <Separator size="4" />
      <PracticalInfo lang={lang} variant="full" />
      <Facilities lang={lang} />
      <GalleryTeaser
              title={t("Billeder", "Photos")}
              subtitle={t(
                "Få et hurtigt indtryk – se hvad alle snakker om",
                "Get a quick feel—see what everyone is talking about"
              )}
              items={[
                {
                  src: "/gallery/01.webp",
                  alt: t("Stue med lysindfald", "Living room with daylight"),
                },
                {
                  src: "/gallery/02.webp",
                  alt: t("Køkken-alrum", "Kitchen-living area"),
                },
                {
                  src: "/gallery/03.webp",
                  alt: t("Opvarmet udendørs pool", "Heated outdoor pool"),
                },
                {
                  src: "/gallery/04.webp",
                  alt: t("Brændefyret vildmarksbad", "Wood-fired hot tub"),
                },
                {
                  src: "/gallery/05.webp",
                  alt: t("El-sauna", "Electric sauna"),
                },
                {
                  src: "/gallery/06.webp",
                  alt: t("Skovsti mod stranden", "Forest path to the beach"),
                },
                // du kan have flere – +N overlay vises automatisk hvis items.length > max
              ]}
              cta={{
                label: t("Åbn galleri", "Open gallery"),
                to: pathOf(lang, "gallery"),
              }}
              align="center"
            />
    </>
  );
}
