// src/pages/Contact/index.tsx (eller ContactPage.tsx afhængigt af din struktur)
import { Container, Box, Heading } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import ContactForm from "../../components/ContactForm";
import HostsSection from "../../components/HostsSection";
import { pathOf, type Lang } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import { useTranslation } from "react-i18next";

export default function ContactPage({ lang }: { lang: Lang }) {
  const { t } = useTranslation("contact");
  const path = pathOf(lang, "contact");
  const seo = getSeoMeta(lang, "contact");

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: seo.title,
          description: seo.description,
          url: `https://fyrrehaven-61.dk${path}`,
          about: {
            "@type": "LodgingBusiness",
            name: "Fyrrehaven 61",
            url: "https://fyrrehaven-61.dk",
          },
        }}
        robots={seo.robots}
        keywords={seo.keywords}
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
            {t("form.heading")}
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
