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
import { pathOf } from "../../lib/routes";
import { AIRBNB_URL } from "../../lib/links";

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

      <Separator size="4" />

      {/* FEATURES – almindeligt sideindhold, uafhængigt af SEO/Hero */}
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

              {/* Ekstra CTA under features */}
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
