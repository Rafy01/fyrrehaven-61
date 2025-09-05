// src/pages/Book/Book.tsx
import { Container, Box, Heading, Text } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import Buttons from "../../components/Buttons";
import { pathOf } from "../../lib/routes";
import type { Lang } from "../../lib/lang";
import styles from "./Book.module.css";

// Hvis du har en index-barrel for AvailabilityCalendar, kan du bruge
//  import AvailabilityCalendar from "../../components/AvailabilityCalendar";
// men denne direkte sti virker altid:
import AvailabilityCalendar from "../../components/AvailabilityCalendar/AvailabilityCalendar";

export default function Book({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const path = pathOf(lang, "book");

  /** ——— SEO ——— */
  const seoTitle = t(
    "Booking – forespørgsel eller Airbnb",
    "Booking – request or Airbnb"
  );
  const seoDescription = t(
    "Send en direkte bookingforespørgsel eller book via Airbnb. Udendørs opvarmet pool (1. maj – 1. okt.), plads til 10.",
    "Send a direct booking request or book via Airbnb. Outdoor heated pool (May 1 – Oct 1), sleeps 10."
  );

  // Sæt din rigtige Airbnb-URL her
  const AIRBNB_URL = "https://www.airbnb.com/rooms/your-listing-id";

  // Struktureret data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Fyrrehaven 61",
    url: `https://fyrrehaven-61.dk${path}`,
    description: seoDescription,
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
  const heroTitle = t("Booking", "Booking");
  const heroSubtitle = t(
    "Forespørg direkte hos os – eller book via Airbnb, hvis du foretrækker det.",
    "Send a direct request – or book via Airbnb if you prefer."
  );

  // Link til kontaktformularen med “booking-intent”
  const contactTo = `${pathOf(lang, "contact")}#contact`;

  // Aktuel måned til kalenderen
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seoTitle}
        description={seoDescription}
        ogImage="/og-book.jpg"
        jsonLd={jsonLd}
      />

      <Hero
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t(
            "Opvarmet udendørs pool (1/5–1/10)",
            "Heated outdoor pool (May–Oct)"
          ),
          t("Plads til 10 gæster", "Sleeps 10 guests"),
          t("Familievenligt", "Family friendly"),
        ]}
        primaryCta={{
          label: t("Anmod om booking", "Request booking"),
          to: contactTo,
        }}
        // Brug ekstern href til Airbnb for at undgå router-redirects
        secondaryCta={
          AIRBNB_URL
            ? {
                label: t("Se kalender på Airbnb", "View calendar on Airbnb"),
                href: AIRBNB_URL,
                external: true,
              }
            : undefined
        }
        media={{
          type: "image",
          src: "/book/hero-book.webp",
          alt: t(
            "Booking af feriehus ved Fjellerup",
            "Book the holiday home in Fjellerup"
          ),
        }}
        align="left"
        layout="media-right"
      />

      {/* ——— Link-sektion ——— */}
      <Container size="3">
        <Box py="6">
          <div className={styles.grid}>
            {/* Direkte forespørgsel */}
            <section className={styles.card}>
              <header className={styles.cardHead}>
                <h2 className={styles.cardTitle}>
                  {t("Direkte forespørgsel", "Direct request")}
                </h2>
                <p className={styles.cardSub}>
                  {t(
                    "Udfyld formularen – vi svarer som regel inden for en time.",
                    "Fill in the form – we usually reply within an hour."
                  )}
                </p>
              </header>
              <ul className={styles.list}>
                <li>
                  {t(
                    "Ofte bedre pris end platforme",
                    "Often better price than platforms"
                  )}
                </li>
                <li>
                  {t(
                    "Fleksibel ankomst/afrejse hvis muligt",
                    "Flexible check-in/out when possible"
                  )}
                </li>
                <li>
                  {t(
                    "El- og vandforbrug afregnes efter endt ophold via bankoverførsel",
                    "Electricity and water are settled after the stay via bank transfer"
                  )}
                </li>
              </ul>
              <div className={styles.actions}>
                <Buttons
                  to={contactTo}
                  variant="primary"
                  labelDa="Anmod om booking"
                  labelEn="Request booking"
                />
              </div>
            </section>

            {/* Airbnb */}
            <section className={styles.card}>
              <header className={styles.cardHead}>
                <h2 className={styles.cardTitle}>Airbnb</h2>
                <p className={styles.cardSub}>
                  {t(
                    "Se live-kalender, anmeldelser og priser på Airbnb.",
                    "See live calendar, reviews and pricing on Airbnb."
                  )}
                </p>
              </header>
              <ul className={styles.list}>
                <li>
                  {t("Nemt, sikkert checkout", "Simple, secure checkout")}
                </li>
                <li>{t("Anmeldelser fra gæster", "Guest reviews")}</li>
                <li>{t("Opdateret kalender", "Updated calendar")}</li>
              </ul>
              <div className={styles.actions}>
                {AIRBNB_URL ? (
                  <Buttons
                    href={AIRBNB_URL}
                    external
                    variant="secondary"
                    labelDa="Gå til Airbnb"
                    labelEn="Go to Airbnb"
                  />
                ) : (
                  <Text color="gray">
                    {t("Airbnb-link kommer snart…", "Airbnb link coming soon…")}
                  </Text>
                )}
              </div>
            </section>
          </div>

          {/* Lille “praktisk” note */}
          <div className={styles.note}>
            <Heading as="h3" size="3" mb="1">
              {t("Praktisk", "Good to know")}
            </Heading>
            <Text color="gray">
              {t(
                "Udendørs pool er opvarmet ca. 29 °C og åben 1. maj – 1. oktober. Maks. 10 personer. Ingen fester.",
                "Outdoor pool heated to ~29 °C and open May 1 – Oct 1. Max 10 guests. No parties."
              )}
            </Text>
          </div>
        </Box>

        {/* ——— Kalender ——— */}
        <Box mt="3">
          <AvailabilityCalendar
            year={year}
            month={month}
            loadFromIcal
            weekStartsOn={1} // mandag
          />
        </Box>
      </Container>
    </>
  );
}
