// src/pages/Book/Book.tsx
import { Container, Box, Heading, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import type { Lang } from "../../lib/lang";
import styles from "./Book.module.css";


// Hvis du har en index-barrel for AvailabilityCalendar, kan du bruge
//  import AvailabilityCalendar from "../../components/AvailabilityCalendar";
// men denne direkte sti virker altid:
import ContactForm from "../../components/ContactForm";
import BookingProcess from "../../components/BookingProcess/BookingProcess";

export default function Book({ lang }: { lang: Lang }) {
  const { t } = useTranslation("book");
  const path = pathOf(lang, "book");

  const seo = getSeoMeta(lang, "book");

  // Struktureret data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Fyrrehaven 61",
    url: `https://fyrrehaven-61.dk${path}`,
    description: seo.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Fyrrehaven 61",
      postalCode: "8585",
      addressLocality: "Glesborg",
      addressCountry: "DK",
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: `https://fyrrehaven-61.dk${path}`,
    },
  };

  /** ——— Hero ——— */
  const heroTitle = t("hero.title");
  const heroSubtitle = t("hero.subtitle");

  // Aktuel måned til kalenderen

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
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t("hero.badges.pool"),
          t("hero.badges.guests"),
          t("hero.badges.family"),
        ]}
        // primaryCta={{
        //   label: t("Anmod om booking", "Request booking"),
        //   to: pathOf(lang, "book") + "#booking",
        // }}
        // Brug ekstern href til Airbnb for at undgå router-redirects
        secondaryCta={{
          label: t("hero.airbnbCta"),
          href: "https://www.airbnb.dk/h/fyrrehaven-61",
          external: true,
        }}
        media={{
          type: "image",
          src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3807.webp",
          alt: t("hero.imageAlt"),
        }}
        align="left"
        layout="media-right"
      />
      <Container size="3">
        <Box py="6">
          <Heading as="h2" size="4" mb="2">
            {t("intro.title")}
          </Heading>
          <Text size="2" mb="4" color="gray">
            {t("intro.body")}
          </Text>
          {/* Lille “praktisk” note */}
          <div className={styles.note}>
            <Heading as="h3" size="3" mb="1">
              {t("intro.noteTitle")}
            </Heading>
            <Text>
              {t("intro.notePool")}
            </Text>
            <br />
            <Text>
              {t("intro.noteUtilities")}
            </Text>
          </div>
        </Box>
      </Container>
      <Container size="3">
        <BookingProcess lang={lang} />
      </Container>
      
      <ContactForm
        lang={lang}
        submitUrl="/api/contact"
        variant="booking"
        ctaAnchor="#booking"
      />
    </>
  );
}
