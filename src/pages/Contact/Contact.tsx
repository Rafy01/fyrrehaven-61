// src/pages/Contact/index.tsx (eller ContactPage.tsx afhængigt af din struktur)
import { Container, Box, Heading } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import ContactForm from "../../components/ContactForm";
import HostsSection from "../../components/HostsSection";
import { chooseLang } from "../../lib/lang";
import { pathOf, type Lang } from "../../lib/routes";

export default function ContactPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const path = pathOf(lang, "contact");

  const seoTitle = t(
    "Kontakt Fyrrehaven 61 – spørgsmål om booking og ophold",
    "Contact Fyrrehaven 61 – questions about booking and stays"
  );
  const seoDescription = t(
    "Har du spørgsmål til datoer, priser, faciliteter eller særlige ønsker? Send os en besked via formularen — vi svarer typisk samme dag. Al kommunikation foregår via e-mail, og dine oplysninger behandles efter vores privatlivspolitik.",
    "Got questions about dates, pricing, amenities or special requests? Send us a message — we usually reply the same day. All communication is handled by email and your data is processed under our privacy policy."
  );
  const seoKeywords =
    lang === "da"
      ? [
          "kontakt",
          "Fyrrehaven 61",
          "sommerhus Fjellerup",
          "spørgsmål booking",
          "udlejning sommerhus",
          "familievenligt sommerhus",
          "pool vildmarksbad sauna",
          "Djursland ferie",
          "book direkte",
          "Airbnb kontakt",
        ]
      : [
          "contact",
          "Fyrrehaven 61",
          "holiday home Fjellerup",
          "booking questions",
          "holiday rental",
          "family friendly cottage",
          "pool hot tub sauna",
          "Djursland Denmark",
          "book direct",
          "Airbnb contact",
        ];

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seoTitle}
        description={seoDescription}
        ogImage="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: t("Kontakt os", "Contact us"),
          description: t(
            "Spørgsmål eller forespørgsler? Skriv til os her.",
            "Questions or requests? Send us a message here."
          ),
          url: `https://fyrrehaven-61.dk${path}`,
        }}
        robots={{ index: true, follow: true, noarchive: true }}
        keywords={seoKeywords}
      />

      <Hero
        i18nNs="contact"
        titleKey="hero.title"
        subtitleKey="hero.subtitle"
        badgeKeys={["hero.badges.family", "hero.badges.beach"]}
        media={{
          type: "image",
          src: "/hosts/familien.webp",
          altKey: "hero.imageAlt",
        }}
        align="left"
        primaryCta={{
          labelKey: "hero.primaryCta",
          to: pathOf(lang, "book"),
        }}
        secondaryCta={{
          labelKey: "hero.secondaryCta",
          href: "https://www.airbnb.dk/h/fyrrehaven-61",
          external: true,
        }}
      />

      <HostsSection
        lang={lang}
        ctaAnchor="#contact"
        titleDa="Mød værterne"
        titleEn="Meet your hosts"
        subtitleDa="Personlig hjælp og hurtige svar – vi er kun en besked væk."
        subtitleEn="Personal help and quick replies — we’re just a message away."
      />

      <Container size="3" id="contact">
        <Box py="6">
          <Heading size="6" mb="2">
            {t("Skriv til os", "Send us a message")}
          </Heading>
          <Box mt="4">
            {/* VIGTIGT: giv formen lang, så labels/placeholder skifter sprog */}
            <ContactForm
              lang={lang}
              submitUrl="/api/contact"
              variant="contact"
            />
          </Box>
        </Box>
      </Container>
    </>
  );
}
