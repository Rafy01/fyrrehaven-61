// src/pages/Cookies.tsx

import { useEffect } from "react";
import { Container, Heading, Text, Separator } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import type { Lang } from "../../lib/lang";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

export default function Cookies({ lang }: { lang: Lang }) {
  const { t } = useTranslation("cookiesPage");
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
              title: t("consent.title", { lng: "da" }),
              description: t("consent.description", { lng: "da" }),
              acceptAllBtn: t("consent.acceptAll", { lng: "da" }),
              acceptNecessaryBtn: t("consent.rejectAll", { lng: "da" }),
              showPreferencesBtn: t("consent.preferences", { lng: "da" }),
            },
            preferencesModal: {
              title: t("consent.settingsTitle", { lng: "da" }),
              closeIconLabel: t("consent.close", { lng: "da" }),
              savePreferencesBtn: t("consent.save", { lng: "da" }),
              sections: [
                {
                  title: t("categories.necessary.title", { lng: "da" }),
                  description: t("categories.necessary.description", {
                    lng: "da",
                  }),
                  linkedCategory: "necessary",
                },
                {
                  title: t("categories.analytics.title", { lng: "da" }),
                  description: t("categories.analytics.description", {
                    lng: "da",
                  }),
                  linkedCategory: "analytics",
                },
                {
                  title: t("categories.marketing.title", { lng: "da" }),
                  description: t("categories.marketing.description", {
                    lng: "da",
                  }),
                  linkedCategory: "marketing",
                },
              ],
            },
          },
          en: {
            consentModal: {
              title: t("consent.title", { lng: "en" }),
              description: t("consent.description", { lng: "en" }),
              acceptAllBtn: t("consent.acceptAll", { lng: "en" }),
              acceptNecessaryBtn: t("consent.rejectAll", { lng: "en" }),
              showPreferencesBtn: t("consent.preferences", { lng: "en" }),
            },
            preferencesModal: {
              title: t("consent.settingsTitle", { lng: "en" }),
              closeIconLabel: t("consent.close", { lng: "en" }),
              savePreferencesBtn: t("consent.save", { lng: "en" }),
              sections: [
                {
                  title: t("categories.necessary.title", { lng: "en" }),
                  description: t("categories.necessary.description", {
                    lng: "en",
                  }),
                  linkedCategory: "necessary",
                },
                {
                  title: t("categories.analytics.title", { lng: "en" }),
                  description: t("categories.analytics.description", {
                    lng: "en",
                  }),
                  linkedCategory: "analytics",
                },
                {
                  title: t("categories.marketing.title", { lng: "en" }),
                  description: t("categories.marketing.description", {
                    lng: "en",
                  }),
                  linkedCategory: "marketing",
                },
              ],
            },
          },
          de: {
            consentModal: {
              title: t("consent.title", { lng: "de" }),
              description: t("consent.description", { lng: "de" }),
              acceptAllBtn: t("consent.acceptAll", { lng: "de" }),
              acceptNecessaryBtn: t("consent.rejectAll", { lng: "de" }),
              showPreferencesBtn: t("consent.preferences", { lng: "de" }),
            },
            preferencesModal: {
              title: t("consent.settingsTitle", { lng: "de" }),
              closeIconLabel: t("consent.close", { lng: "de" }),
              savePreferencesBtn: t("consent.save", { lng: "de" }),
              sections: [
                {
                  title: t("categories.necessary.title", { lng: "de" }),
                  description: t("categories.necessary.description", {
                    lng: "de",
                  }),
                  linkedCategory: "necessary",
                },
                {
                  title: t("categories.analytics.title", { lng: "de" }),
                  description: t("categories.analytics.description", {
                    lng: "de",
                  }),
                  linkedCategory: "analytics",
                },
                {
                  title: t("categories.marketing.title", { lng: "de" }),
                  description: t("categories.marketing.description", {
                    lng: "de",
                  }),
                  linkedCategory: "marketing",
                },
              ],
            },
          },
        },
      },
    });
  }, [lang, t]);

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
            {t("page.title")}
          </Heading>
          <Text size="3" color="gray">
            {t("page.intro")}
          </Text>
        </header>

        <Separator my="5" size="4" />

        <section>
          <Heading as="h2" size="5" mb="2">
            {t("page.typesTitle")}
          </Heading>
          <ul style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
            <li>
              <strong>{t("categories.necessary.label")}: </strong>
              {t("categories.necessary.description")}
            </li>
            <li>
              <strong>{t("categories.analytics.label")}: </strong>
              {t("categories.analytics.description")}
            </li>
            <li>
              <strong>{t("categories.marketing.label")}: </strong>
              {t("categories.marketing.description")}
            </li>
          </ul>
        </section>
      </Container>
    </>
  );
}
