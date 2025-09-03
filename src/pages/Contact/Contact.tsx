import { Container, Box, Heading } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import ContactForm from "../../components/ContactForm";
import { pathOf, type Lang } from "../../lib/routes";

export default function ContactPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const path = pathOf(lang, "contact");

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={t("Kontakt os", "Contact us")}
        description={t(
          "Spørgsmål eller forespørgsler? Skriv til os her.",
          "Questions or requests? Send us a message here."
        )}
        ogImage="/og-contact.jpg"
      />

      <Hero
        title={t("Kontakt os", "Contact us")}
        subtitle={t(
          "Vi svarer normalt hurtigt – ofte inden for få timer.",
          "We usually reply quickly – often within a few hours."
        )}
        badges={[
          t("Familievenligt", "Family-friendly"),
          t("Tæt på strand", "Near the beach"),
        ]}
        media={{ type: "image", src: "/contact-hero.webp", alt: "" }}
        align="left"
      />

      <Container size="3">
        <Box py="6">
          <Heading size="6" mb="2">
            {t("Skriv til os", "Send us a message")}
          </Heading>
          <Box mt="4">
            <ContactForm  submitUrl="/api/contact" />
          </Box>
        </Box>
      </Container>
    </>
  );
}
