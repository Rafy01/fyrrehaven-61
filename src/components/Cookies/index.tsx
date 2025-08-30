import { useState } from "react";
import {
  Container,
  Heading,
  Text,
  Separator,
  Flex,
} from "@radix-ui/themes";
import type { Lang } from "../../lib/lang";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import {
  readConsent,
  updateConsent,
  defaultConsent,
  type ConsentCategories,
} from "../../components/Cookies/consent";

export default function CookiesPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const seoTitle = t("Cookies hos Fyrrehaven 61", "Cookies at Fyrrehaven 61");
  const seoDesc = t(
    "Læs om vores brug af cookies og administrer dine valg.",
    "Read about our use of cookies and manage your choices."
  );

  const existing = readConsent(lang) ?? defaultConsent(lang);
  const [prefs, setPrefs] = useState<ConsentCategories>(existing.categories);

  const save = () => updateConsent(prefs, lang);

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "cookies")}
        title={seoTitle}
        description={seoDesc}
      />
      <Container size="3" px="4" py="6">
        <Heading as="h1" size="8">
          {seoTitle}
        </Heading>
        <Text as="p" color="gray" size="3" mt="2">
          {t(
            "Vi bruger nødvendige cookies for at få siden til at fungere, og valgfrie cookies til statistik og marketing.",
            "We use necessary cookies to make the site work, and optional cookies for analytics and marketing."
          )}
        </Text>

        <Separator my="5" size="4" />

        <Heading as="h2" size="5" mb="3">
          {t("Dine valg", "Your choices")}
        </Heading>
        <div
          role="group"
          aria-label={t("Cookie-indstillinger", "Cookie preferences")}
        >
          <label
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <input type="checkbox" checked readOnly aria-disabled />
            <span>
              <strong>{t("Nødvendige", "Necessary")}</strong>
              <br />
              <Text color="gray">
                {t(
                  "Påkrævet for at siden fungerer.",
                  "Required for the site to function."
                )}
              </Text>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) =>
                setPrefs({ ...prefs, analytics: e.currentTarget.checked })
              }
            />
            <span>
              <strong>{t("Statistik", "Analytics")}</strong>
              <br />
              <Text color="gray">
                {t(
                  "Hjælper os med at forstå brugen af siden.",
                  "Helps us understand site usage."
                )}
              </Text>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) =>
                setPrefs({ ...prefs, marketing: e.currentTarget.checked })
              }
            />
            <span>
              <strong>{t("Marketing", "Marketing")}</strong>
              <br />
              <Text color="gray">
                {t(
                  "Bruges til personaliseret indhold/annoncer.",
                  "Used for personalised content/ads."
                )}
              </Text>
            </span>
          </label>

          <Flex gap="3">
            <button
              onClick={() => {
                setPrefs({ ...prefs, analytics: false, marketing: false });
                save();
              }}
            >
              {t("Afvis alle", "Reject all")}
            </button>
            <button
              onClick={() => {
                setPrefs({ ...prefs, analytics: true, marketing: true });
                save();
              }}
            >
              {t("Accepter alle", "Accept all")}
            </button>
            <button
              onClick={save}
              style={{
                background: "var(--gold-500)",
                color: "var(--ink-900)",
                borderRadius: "var(--radius)",
                padding: ".5rem .8rem",
                fontWeight: 700,
              }}
            >
              {t("Gem valg", "Save choices")}
            </button>
          </Flex>
        </div>

        <Separator my="5" size="4" />

        <Heading as="h2" size="5" mb="2">
          {t("Detaljer", "Details")}
        </Heading>
        <Text as="p" color="gray">
          {t(
            "Nødvendige cookies bruges til ting som sikkerhed, sprogvalg og grundlæggende funktionalitet. Statistik hjælper os med at forbedre siden. Marketing kan bruges til at vise relevante tilbud.",
            "Necessary cookies are for security, language, and core functionality. Analytics help us improve the site. Marketing may be used to show relevant offers."
          )}
        </Text>
      </Container>
    </>
  );
}
