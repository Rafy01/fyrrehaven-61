// src/pages/Cookies.tsx

import { Container, Heading, Text, Button } from "@radix-ui/themes";
import type { Lang } from "../../lib/lang";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import * as CookieConsent from "vanilla-cookieconsent"; // ✅ korrekt

export default function CookiesPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const seoTitle = t("Cookies hos Fyrrehaven 61", "Cookies at Fyrrehaven 61");
  const seoDesc = t(
    "Læs om vores brug af cookies og administrer dine valg.",
    "Read about our use of cookies and manage your choices."
  );

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "cookies")}
        title={seoTitle}
        description={seoDesc}
      />

      <Container size="3" px="4" py="6">
        <Heading as="h1" size="8" mb="4">
          {seoTitle}
        </Heading>
        <Text size="3" color="gray" as="p" mb="5">
          {t(
            "Vi bruger nødvendige cookies for at få siden til at fungere, samt valgfrie cookies til statistik og marketing.",
            "We use necessary cookies to make the site work, and optional cookies for analytics and marketing."
          )}
        </Text>

        <Button
          variant="surface"
          onClick={() => CookieConsent.showPreferences()}
        >
          {t(
            "Rediger dine cookieindstillinger",
            "Edit your cookie preferences"
          )}
        </Button>

        <Text size="2" color="gray" mt="6" as="p">
          {t(
            "Statistik og marketing cookies aktiveres kun, hvis du accepterer dem. Du kan til enhver tid ændre dine valg.",
            "Analytics and marketing cookies are only activated if you accept them. You can change your preferences at any time."
          )}
        </Text>
      </Container>
    </>
  );
}
