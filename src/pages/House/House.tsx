// src/pages/House/House.tsx
import {
  Box,
  Container,
  Separator,
  Heading,
  Grid,
  Card,
} from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import styles from "./House.module.css";
import PracticalInfo from "../../components/PracticalInfo";
import Facilities from "../../components/Facilities";
import { getSeoMeta } from "../../i18n/seo";
import type { Lang } from "../../lib/lang";
import { buildVacationRentalSchema } from "../../lib/structuredData";

export default function House({ lang }: { lang: Lang }) {
  const { t } = useTranslation("house");
  const list = (key: string) =>
    t(key, { returnObjects: true }) as unknown as string[];
  const Meta = getSeoMeta(lang, "house");

  const jsonLd = buildVacationRentalSchema({
    url: `https://fyrrehaven-61.dk${pathOf(lang, "house")}`,
    description: Meta.description,
    amenities: [
      { name: t("jsonLd.outdoorPool"), description: t("jsonLd.poolSeason") },
      { name: t("jsonLd.hotTub") },
      { name: t("jsonLd.sauna") },
      { name: t("jsonLd.activityRoom") },
      { name: t("jsonLd.beachForest") },
    ],
  });

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "house")}
        title={Meta.title}
        description={Meta.description}
        ogImage={Meta.image}
        ogImageAlt={Meta.imageAlt}
        jsonLd={jsonLd}
        robots={Meta.robots}
        keywords={Meta.keywords}
      />

      {/* HERO */}
      <Hero
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        badges={list("hero.badges")}
        primaryCta={{
          label: t("hero.primaryCta"),
          href: pathOf(lang, "book"),
          external: false,
        }}
        secondaryCta={{
          label: t("hero.secondaryCta"),
          href: "https://www.airbnb.dk/h/fyrrehaven-61",
          external: true,
        }}
        media={{
          type: "image",
          src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.webp",
          alt: t("hero.imageAlt"),
          title: t("hero.imageTitle"),
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
              {t("sleeping.title")}
            </Heading>

            <Grid columns={{ initial: "1", md: "2" }} gap="4" mt="3">
              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("sleeping.bedsTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("sleeping.beds").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("sleeping.storageTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("sleeping.storage").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            </Grid>
          </section>
        </Box>

        {/* Pool & wellness */}
        <Box asChild id="wellness">
          <section className={styles.section}>
            <Heading as="h2" size="6">
              {t("wellness.title")}
            </Heading>

            <Grid columns={{ initial: "1", md: "3" }} gap="4" mt="3">
              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("wellness.poolTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("wellness.pool").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("wellness.hotTubTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("wellness.hotTub").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("wellness.saunaTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("wellness.sauna").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            </Grid>
          </section>
        </Box>

        {/* Aktivitetsrum */}
        <Box asChild id="aktivitetsrum">
          <section className={styles.section}>
            <Heading as="h2" size="6">
              {t("activityRoom.title")}
            </Heading>

            <Grid columns={{ initial: "1", md: "2" }} gap="4" mt="3">
              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("activityRoom.gamesTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("activityRoom.games").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("activityRoom.movieTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("activityRoom.movie").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            </Grid>
          </section>
        </Box>

        {/* Køkken & ophold */}
        <Box asChild id="koekken">
          <section className={styles.section}>
            <Heading as="h2" size="6">
              {t("kitchenLiving.title")}
            </Heading>

            <Grid columns={{ initial: "1", md: "2" }} gap="4" mt="3">
              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("kitchenLiving.kitchenTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("kitchenLiving.kitchen").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card variant="surface">
                <Heading as="h3" size="3">
                  {t("kitchenLiving.livingTitle")}
                </Heading>
                <ul className={styles.list}>
                  {list("kitchenLiving.living").map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            </Grid>
          </section>
        </Box>
      </Container>
      <Separator size="4" />
      <PracticalInfo lang={lang} variant="full" />
      <Facilities lang={lang} />
    </>
  );
}
