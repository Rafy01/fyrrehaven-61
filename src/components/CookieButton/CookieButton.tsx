// src/components/CookieButton.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as CookieConsent from "vanilla-cookieconsent";
import styles from "./CookieButton.module.css";
import type { Lang } from "../../lib/lang";

export default function CookieButton({ lang }: { lang: Lang }) {
  const { t } = useTranslation("cookiesPage");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <button
      className={styles.cookieButton}
      onClick={() => CookieConsent.showPreferences()}
      aria-label={t("consent.manageButton", { lng: lang })}
      title={t("consent.manageButton", { lng: lang })}
    >
      🍪
    </button>
  );
}
