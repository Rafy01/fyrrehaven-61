// src/pages/Cookies.tsx

import { useEffect } from "react";
import { Container, Heading, Text, Separator } from "@radix-ui/themes";
import { chooseLang } from "../../lib/lang";
import type { Lang } from "../../lib/lang";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

export default function Cookies({ lang }: { lang: Lang }) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const seo = getSeoMeta(lang, "cookies");

  useEffect(() => {
    CookieConsent.run({
      revision: 1,
      guiOptions: {
        consentModal: {
          layout: "box",
          position: "bottom center",
          equalWeightButtons: true,
        },
        preferencesModal: {
          layout: "box",
          position: "right",
        },
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          readOnly: false,
        },
        marketing: {
          enabled: false,
          readOnly: false,
        },
      },
      language: {
        default: lang,
        translations: {
          da: {
            consentModal: {
              title: "Vi bruger cookies 🍪",
              description:
                "Vi bruger nødvendige cookies for at få siden til at fungere, samt valgfrie cookies til statistik og marketing.",
              acceptAllBtn: "Accepter alle",
              acceptNecessaryBtn: "Afvis",
              showPreferencesBtn: "Indstil cookies",
            },
            preferencesModal: {
              title: "Cookieindstillinger",
              closeIconLabel: "Luk",
              savePreferencesBtn: "Gem præferencer",
              sections: [
                {
                  title: "Nødvendige cookies",
                  description: "Påkrævet for at siden fungerer.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Statistik",
                  description: "Hjælper os med at forstå brugen af siden.",
                  linkedCategory: "analytics",
                },
                {
                  title: "Marketing",
                  description: "Bruges til personaliseret indhold og annoncer.",
                  linkedCategory: "marketing",
                },
              ],
            },
          },
          en: {
            consentModal: {
              title: "We use cookies 🍪",
              description:
                "We use necessary cookies to make the site work, and optional cookies for analytics and marketing.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
            },
            preferencesModal: {
              title: "Cookie settings",
              closeIconLabel: "Close",
              savePreferencesBtn: "Save preferences",
              sections: [
                {
                  title: "Necessary cookies",
                  description: "Required for the site to function.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics",
                  description: "Helps us understand site usage.",
                  linkedCategory: "analytics",
                },
                {
                  title: "Marketing",
                  description: "Used for personalised content and advertising.",
                  linkedCategory: "marketing",
                },
              ],
            },
          },
        },
      },
    });
  }, [lang]);

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "cookies")}
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        robots={seo.robots}
        keywords={seo.keywords}
      />

      <Container size="3" px="4" py="6">
        <header>
          <Heading as="h1" size="8" mb="2">
            {t("Cookies hos Fyrrehaven 61", "Cookies at Fyrrehaven 61")}
          </Heading>
          <Text size="3" color="gray">
            {t(
              "Her kan du læse om vores brug af cookies og hvordan du ændrer dine præferencer.",
              "Here you can read about our use of cookies and how to manage your preferences."
            )}
          </Text>
        </header>

        <Separator my="5" size="4" />

        <section>
          <Heading as="h2" size="5" mb="2">
            {t("Typer af cookies", "Types of cookies")}
          </Heading>
          <ul style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
            <li>
              <strong>{t("Nødvendige", "Necessary")}: </strong>
              {t(
                "Påkrævede for at siden fungerer.",
                "Required for the site to function."
              )}
            </li>
            <li>
              <strong>{t("Statistik", "Analytics")}: </strong>
              {t(
                "Hjælper os med at forstå brugen af siden.",
                "Helps us understand how the site is used."
              )}
            </li>
            <li>
              <strong>{t("Marketing", "Marketing")}: </strong>
              {t(
                "Bruges til personaliserede annoncer og indhold.",
                "Used for personalised content and advertising."
              )}
            </li>
          </ul>
        </section>
      </Container>
    </>
  );
}
