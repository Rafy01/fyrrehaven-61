// components/Cookies/CookieBanner.tsx
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import styles from "./CookieBanner.module.css";
import type { Lang } from "../../lib/lang";
import {
  defaultConsent,
  updateConsent,
  readConsent,
  allowed,
  enableScriptsForConsent, // ← NY
  type ConsentCategories,
} from "./consent";

type Props = { lang: Lang };

export default function CookieBanner({ lang }: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const [visible, setVisible] = useState(false);
  const [openPrefs, setOpenPrefs] = useState(false);
  const [prefs, setPrefs] = useState<ConsentCategories>(
    defaultConsent(lang).categories
  );

  useEffect(() => {
    const existing = readConsent(lang);
    if (!existing) {
      setVisible(true);
      setPrefs(defaultConsent(lang).categories);
    } else {
      setPrefs(existing.categories);
      setVisible(false);
      // aktiver deferred scripts hvis brugeren allerede har valgt tidligere
      enableScriptsForConsent(lang); // ← NY
    }
  }, [lang]);

  // Lyt på ændringer (fx fra andre UI'er) og enable scripts
  useEffect(() => {
    const onChange = () => {
      if (allowed("analytics", lang)) {
        // her kan du evt. kalde initAnalytics();
      }
      enableScriptsForConsent(lang); // ← NY
    };
    window.addEventListener("fh61:consentchange", onChange as EventListener);
    return () =>
      window.removeEventListener(
        "fh61:consentchange",
        onChange as EventListener
      );
  }, [lang]);

  const acceptAll = () => {
    updateConsent({ analytics: true, marketing: true }, lang);
    enableScriptsForConsent(lang); // ← NY
    setVisible(false);
  };
  const rejectAll = () => {
    updateConsent({ analytics: false, marketing: false }, lang);
    // (ingen scripts at aktivere)
    setVisible(false);
  };
  const savePrefs = () => {
    updateConsent(prefs, lang);
    enableScriptsForConsent(lang); // ← NY
    setVisible(false);
    setOpenPrefs(false);
  };

  if (!visible) return null;

  return (
    <>
      <Box asChild>
        <div className={styles.banner} role="dialog" aria-live="polite">
          <div className={styles.copy}>
            <Text as="p" size="2">
              {t(
                "Vi bruger cookies til at få siden til at virke og til statistik. Du kan altid ændre dine valg.",
                "We use cookies to make the site work and for statistics. You can change your choices anytime."
              )}
            </Text>
            <a className={styles.link} href={`/${lang}/cookies`}>
              {t("Læs mere", "Learn more")}
            </a>
          </div>

          <Flex gap="2" wrap="wrap" align="center" className={styles.actions}>
            <Button
              size="2"
              variant="soft"
              color="gray"
              onClick={() => setOpenPrefs(true)}
            >
              {t("Indstillinger", "Preferences")}
            </Button>
            <Button size="2" variant="soft" color="gray" onClick={rejectAll}>
              {t("Afvis", "Reject")}
            </Button>
            <Button size="2" variant="solid" color="yellow" onClick={acceptAll}>
              {t("Accepter alle", "Accept all")}
            </Button>
          </Flex>
        </div>
      </Box>

      {/* Preferences dialog */}
      <Dialog.Root open={openPrefs} onOpenChange={setOpenPrefs}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.modal} aria-describedby={undefined}>
            <Dialog.Title className={styles.title}>
              {t("Cookie-indstillinger", "Cookie preferences")}
            </Dialog.Title>

            <div className={styles.group}>
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

            <Flex gap="2" justify="end">
              <Dialog.Close asChild>
                <button className={styles.btnGhost}>
                  {t("Annullér", "Cancel")}
                </button>
              </Dialog.Close>
              <button className={styles.btnSoft} onClick={rejectAll}>
                {t("Afvis alle", "Reject all")}
              </button>
              <button className={styles.btnPrimary} onClick={savePrefs}>
                {t("Gem valg", "Save choices")}
              </button>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
