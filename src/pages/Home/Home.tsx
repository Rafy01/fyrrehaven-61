import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Card,
  Separator,
  Container,
} from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import Highlights from "../../components/Highlights"; // ← NYT
import { pathOf } from "../../lib/routes";
import { AIRBNB_URL } from "../../lib/links";
import UspStrip from "../../components/UspStrip";
import { ClockIcon, LightningBoltIcon, LockClosedIcon, StarFilledIcon } from "@radix-ui/react-icons";
import GalleryTeaser from "../../components/GalleryTeaser";
import Reviews from "../../components/Reviews";

type Lang = "da" | "en";

export default function Home({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  /** ---------- SEO TEKSTER (kun til meta) ---------- */
  const seoTitle = t(
    "Fyrrehaven 61 – sommerhus til 10 personer ved skov og strand",
    "Fyrrehaven 61 – holiday home for 10 by forest & beach"
  );
  const seoDescription = t(
    "Familievenligt sommerhus tæt på stranden med indendørs pool og vildmarksbad. Book nemt via Airbnb.",
    "Family-friendly holiday home near the beach with indoor pool and hot tub. Easy booking via Airbnb."
  );

  /** ---------- HERO TEKSTER (visuelt indhold) ---------- */
  const heroTitle = t(
    "Familievenligt sommerhus i skoven – tæt på stranden",
    "Family-friendly holiday home in the forest – near the beach"
  );
  const heroSubtitle = t(
    "Indendørs pool, vildmarksbad og god plads til hele familien.",
    "Indoor pool, hot tub and plenty of space for the whole family."
  );

  // Structured data for SEO (kan bruge seoDescription uden at påvirke Hero)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: "Fyrrehaven 61",
    description: seoDescription,
    url: "https://fyrrehaven-61.dk",
    maximumAttendeeCapacity: 10,
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: t("Indendørs pool", "Indoor pool"),
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: t("Vildmarksbad", "Hot tub"),
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: t("Tæt på strand", "Near beach"),
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
        title={seoTitle}
        description={seoDescription}
        ogImage="/og-home.jpg"
        jsonLd={jsonLd}
      />
      <UspStrip
        ariaLabel={t("Hurtige fakta", "Quick facts")}
        items={[
          {
            icon: <LightningBoltIcon />,
            text: t(
              "Lynhurtigt svar på henvendelser",
              "Lightning-fast replies"
            ),
            ariaLabel: t(
              "Vi svarer hurtigt på alle henvendelser",
              "We reply quickly to all inquiries"
            ),
          },
          {
            icon: <LockClosedIcon />,
            text: t(
              "Nem indtjekning (nøgleboks)",
              "Easy self check-in (key box)"
            ),
            ariaLabel: t(
              "Gæster modtager kode til nøgleboks og kan tjekke ind uden vært til stede",
              "Guests receive a key box code and can check in without the host present"
            ),
          },
          {
            icon: <StarFilledIcon />,
            text: t("4,8+ stjerner på Airbnb", "4.8+ stars on Airbnb"),
            ariaLabel: t(
              "Gæsterne giver os over 4,8 stjerner på Airbnb",
              "Guests rate us 4.8+ stars on Airbnb"
            ),
          },
          {
            icon: <ClockIcon />,
            text: t("+3 års værts erfaring", "+3 years hosting experience"),
            ariaLabel: t(
              "Mere end tre års erfaring som værter",
              "More than three years of hosting experience"
            ),
          },
        ]}
      />
      {/* HERO – separat visuel titel/undertekst + badges/CTA’er */}
      <Hero
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t("10 gæster", "10 guests"),
          t("4 soveværelser", "4 bedrooms"),
          t("2 badværelser", "2 bathrooms"),
          t("Pool-Vildmarksbad-Sauna", "Pool-Hottub-Sauna"),
        ]}
        primaryCta={{
          label: t("Book via Airbnb", "Book on Airbnb"),
          href: AIRBNB_URL,
          external: true,
        }}
        secondaryCta={{
          label: t("Se huset", "See the house"),
          to: pathOf(lang, "house"),
        }}
        media={{
          type: "image",
          src: "/Fyrrehaven hero.webp",
          alt: t(
            "Skov og strand ved sommerhuset",
            "Forest and beach near the house"
          ),
        }}
        align="left"
      />

      {/* din eksisterende tekst under CTA-knapperne – lader den stå */}
      <a> Sikker betaling & kalender via Airbnb</a>

      <Separator size="4" />

      {/* Højdepunkter / Highlights – opdateret til dine 4 punkter */}
      <Container size="3">
        <Highlights
          title={t("Højdepunkter", "Highlights")}
          items={[
            {
              title: t("Opvarmet udendørs pool", "Heated outdoor pool"),
              body: t(
                "Åben 1. maj – 1. oktober. Perfekt efter strandturen.",
                "Open May 1 – Oct 1. Perfect after a beach day."
              ),
              media: {
                kind: "image",
                src: "/highlights/outdoor-pool.webp",
                alt: t(
                  "Opvarmet udendørs pool – åben 1. maj til 1. oktober",
                  "Heated outdoor pool – open May 1 to Oct 1"
                ),
                aspect: "4 / 3",
              },
              ctaLabel: t("Se poolområdet", "See the pool area"),
              to: pathOf(lang, "house"),
            },
            {
              title: t("Brændefyret vildmarksbad", "Wood-fired hot tub"),
              body: t(
                "Autentisk spa-oplevelse med brænde – afslapning under stjernehimlen.",
                "Authentic wood-fired soak — unwind under the stars."
              ),
              media: {
                kind: "image",
                src: "/highlights/hot-tub-wood.webp",
                alt: t(
                  "Brændefyret vildmarksbad ved Fjellerup Strand",
                  "Wood-fired hot tub at Fjellerup Strand"
                ),
                aspect: "4 / 3",
              },
              ctaLabel: t("Se vildmarksbadet", "View the hot tub"),
              to: pathOf(lang, "house"),
            },
            {
              title: t("Sauna på el", "Electric sauna"),
              body: t(
                "Hurtig opvarmning og nem betjening – perfekt efter pool eller hav.",
                "Heats quickly and easy to use — perfect after pool or sea."
              ),
              media: {
                kind: "image",
                src: "/highlights/sauna-electric.webp",
                alt: t(
                  "El-sauna i sommerhuset",
                  "Electric sauna in the holiday home"
                ),
                aspect: "4 / 3",
              },
              ctaLabel: t("Se saunaen", "View the sauna"),
              to: pathOf(lang, "house"),
            },
            {
              title: t("Fantastisk område", "Fantastic surroundings"),
              body: t(
                "Skov og strand tæt på – stier, natur og ro i kort afstand.",
                "Forest and beach nearby — trails, nature and calm close by."
              ),
              media: {
                kind: "image",
                src: "/highlights/forest-beach.webp",
                alt: t(
                  "Skov og strand tæt på sommerhuset",
                  "Forest and beach close to the holiday home"
                ),
                aspect: "4 / 3",
              },
              ctaLabel: t("Se området", "Explore the area"),
              to: pathOf(lang, "area"),
            },
          ]}
        />
      </Container>
      <Separator size="4" />
      <GalleryTeaser
        title={t("Billeder", "Photos")}
        subtitle={t(
          "Få et hurtigt indtryk – se stue, pool, vildmarksbad og omgivelser.",
          "Get a quick feel—see the living room, pool, hot tub and surroundings."
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
      {/* Din oprindelige FEATURES-sektion forbliver uændret */}
      <Separator size="4" />
      <Reviews
        lang={lang}
        title={lang === "da" ? "Gæsterne siger" : "What guests say"}
        maxCards={8}
      />
      <Box asChild>
        <section aria-label={t("Højdepunkter", "Highlights")}>
          <Container size="3">
            <Box py="6">
              <Grid columns={{ initial: "1", md: "2" }} gap="4">
                <FeatureCard
                  title={t("Indendørs pool", "Indoor pool")}
                  body={t(
                    "Poolen kan bruges året rundt – perfekt til børnefamilier og regnvejrsdage.",
                    "Heated indoor pool for year-round fun — perfect for families and rainy days."
                  )}
                />
                <FeatureCard
                  title={t(
                    "Vildmarksbad under stjernerne",
                    "Hot tub under the stars"
                  )}
                  body={t(
                    "Slap af i det udendørs vildmarksbad efter en dag på stranden eller i skoven.",
                    "Unwind in the outdoor hot tub after a day at the beach or in the woods."
                  )}
                />
                <FeatureCard
                  title={t("Skov og strand tæt på", "Forest & beach nearby")}
                  body={t(
                    "Roligt skovområde med stier – og kort cykeltur til stranden.",
                    "Quiet forest area with trails — and a short bike ride to the beach."
                  )}
                />
                <FeatureCard
                  title={t("Plads til 10 gæster", "Room for 10 guests")}
                  body={t(
                    "Fire soveværelser + hems. God plads til to familier eller tre generationer.",
                    "Four bedrooms + loft. Great for two families or multi-generational trips."
                  )}
                />
              </Grid>

              {/* Ekstra CTA under features (du kan tilføje igen her hvis ønsket) */}
            </Box>
          </Container>
        </section>
      </Box>
    </>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="2">
        <Heading size="4">{title}</Heading>
        <Text color="gray">{body}</Text>
      </Flex>
    </Card>
  );
}
