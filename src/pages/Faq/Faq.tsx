// src/pages/FAQ/Faq.tsx
import { Container, Box } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import type { Lang } from "../../lib/lang";
import PoolTemp from "../../components/PoolTemp";

export default function Faq({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const path = pathOf(lang, "faq");

  const seoTitle = t(
    "FAQ – ofte stillede spørgsmål om Fyrrehaven 61",
    "FAQ – frequently asked questions about Fyrrehaven 61"
  );
  const seoDescription = t(
    "Find svar på tjek-ind, pool & wellness, sengetøj, betaling, regler m.m.",
    "Answers about check-in, pool & wellness, linens, payment, rules and more."
  );

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
          "@type": "FAQPage",
          name: seoTitle,
          url: `https://fyrrehaven-61.dk${path}`,
          description: seoDescription,
        }}
      />

      <Hero
        title={t(
          "FAQ – Ofte stillede spørgsmål",
          "FAQ – Frequently asked questions"
        )}
        subtitle={t(
          "Hurtige svar om opholdet, tjek-ind, faciliteter og praktisk info.",
          "Quick answers about your stay, check-in, facilities and practical info."
        )}
        badges={[
          t("Selv-indtjekning", "Self check-in"),
          t("Pool & wellness", "Pool & wellness"),
          t("Sengetøj & håndklæder", "Linens & towels"),
          t("Husregler", "House rules"),
        ]}
        primaryCta={{
          label: t("Kontakt os", "Contact us"),
          to: pathOf(lang, "contact"),
        }}
        secondaryCta={{
          label: t("Se praktisk info", "See practical info"),
          to: pathOf(lang, "house") + "#practical", // hvis du har et anker der
        }}
        media={{
          type: "image",
          src: "/faq/faq-hero.webp",
          alt: t(
            "Detaljer & svar for dit ophold",
            "Details & answers for your stay"
          ),
          title: t("Fyrrehaven 61 – FAQ", "Fyrrehaven 61 – FAQ"),
        }}
        align="left"
      />

      {/* (Plads til din FAQ-accordion senere) */}
      <Container size="3">
        <Box py="6" />
      </Container>

      <PoolTemp />
    </>
  );
}
