import { useState } from "react";
import { Container, Heading, Text, Separator, Flex } from "@radix-ui/themes";
import styles from "./Cookies.module.css";
import type { Lang } from "../../lib/lang";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import {
  readConsent,
  updateConsent,
  defaultConsent,
  type ConsentCategories,
} from "../../components/Cookies/consent";

export default function Cookies({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const seoTitle = t("Cookies hos Fyrrehaven 61", "Cookies at Fyrrehaven 61");
  const seoDesc = t(
    "Læs om vores brug af cookies og administrer dine valg.",
    "Read about our use of cookies and manage your choices."
  );

  const existing = readConsent(lang) ?? defaultConsent(lang);
  const [prefs, setPrefs] = useState<ConsentCategories>(existing.categories);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateConsent(prefs, lang);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const acceptAll = () => {
    const next: ConsentCategories = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPrefs(next);
    updateConsent({ analytics: true, marketing: true }, lang);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const rejectAll = () => {
    const next: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPrefs(next);
    updateConsent({ analytics: false, marketing: false }, lang);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "cookies")}
        title={seoTitle}
        description={seoDesc}
      />

      <Container size="3" px="4" py="6">
        <header className={styles.header}>
          <Heading as="h1" size="8">
            {seoTitle}
          </Heading>
          <Text color="gray" size="3">
            {t(
              "Vi bruger nødvendige cookies for at få siden til at fungere, samt valgfrie cookies til statistik og marketing.",
              "We use necessary cookies to make the site work, and optional cookies for analytics and marketing."
            )}
          </Text>
        </header>

        <Separator my="5" size="4" />

        <section className={styles.section} aria-labelledby="choices">
          <Heading as="h2" size="5" id="choices" mb="3">
            {t("Dine valg", "Your choices")}
          </Heading>

          <div
            role="group"
            aria-label={t("Cookie-indstillinger", "Cookie preferences")}
            className={styles.group}
          >
            <label className={styles.row}>
              <input type="checkbox" checked readOnly aria-disabled />
              <span className={styles.label}>
                <strong>{t("Nødvendige", "Necessary")}</strong>
                <small>
                  {t(
                    "Påkrævet for at siden fungerer.",
                    "Required for the site to function."
                  )}
                </small>
              </span>
            </label>

            <label className={styles.row}>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) =>
                  setPrefs({ ...prefs, analytics: e.currentTarget.checked })
                }
              />
              <span className={styles.label}>
                <strong>{t("Statistik", "Analytics")}</strong>
                <small>
                  {t(
                    "Hjælper os med at forstå brugen af siden.",
                    "Helps us understand site usage."
                  )}
                </small>
              </span>
            </label>

            <label className={styles.row}>
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) =>
                  setPrefs({ ...prefs, marketing: e.currentTarget.checked })
                }
              />
              <span className={styles.label}>
                <strong>{t("Marketing", "Marketing")}</strong>
                <small>
                  {t(
                    "Bruges til personaliseret indhold/annoncer.",
                    "Used for personalised content/ads."
                  )}
                </small>
              </span>
            </label>
          </div>

          <Flex gap="3" wrap="wrap">
            <button className={styles.btnGhost} onClick={rejectAll}>
              {t("Afvis alle", "Reject all")}
            </button>
            <button className={styles.btnSoft} onClick={acceptAll}>
              {t("Accepter alle", "Accept all")}
            </button>
            <button className={styles.btnPrimary} onClick={save}>
              {t("Gem valg", "Save choices")}
            </button>
            {saved && (
              <span className={styles.saved} role="status" aria-live="polite">
                {t("Gemt", "Saved")}
              </span>
            )}
          </Flex>
        </section>

        <Separator my="5" size="4" />

        <section className={styles.section} aria-labelledby="details">
          <Heading as="h2" size="5" id="details" mb="2">
            {t("Detaljer om cookies", "Cookie details")}
          </Heading>
          <Text as="p" color="gray">
            {t(
              "Vi bruger kun nødvendige cookies som standard. Statistik og marketing aktiveres kun, hvis du accepterer dem.",
              "We only set necessary cookies by default. Analytics and marketing are enabled only if you accept them."
            )}
          </Text>

          <ul className={styles.table}>
            <li>
              <span className={styles.cellHead}>
                {t("Kategori", "Category")}
              </span>
              <span className={styles.cellHead}>{t("Formål", "Purpose")}</span>
              <span className={styles.cellHead}>
                {t("Levetid", "Lifetime")}
              </span>
            </li>
            <li>
              <span>{t("Nødvendige", "Necessary")}</span>
              <span>
                {t(
                  "Grundlæggende funktioner (sprog, samtykke, sikkerhed).",
                  "Core features (language, consent, security)."
                )}
              </span>
              <span>{t("Op til 6 måneder", "Up to 6 months")}</span>
            </li>
            <li>
              <span>{t("Statistik", "Analytics")}</span>
              <span>
                {t(
                  "Måling af brug, så vi kan forbedre siden.",
                  "Usage measurement to improve the site."
                )}
              </span>
              <span>{t("Varierer", "Varies")}</span>
            </li>
            <li>
              <span>{t("Marketing", "Marketing")}</span>
              <span>
                {t(
                  "Relevante anbefalinger/annoncer.",
                  "Relevant recommendations/ads."
                )}
              </span>
              <span>{t("Varierer", "Varies")}</span>
            </li>
          </ul>
        </section>
      </Container>
    </>
  );
}
