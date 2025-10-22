// src/components/CookieButton.tsx
import { useEffect, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import styles from "./CookieButton.module.css";

export default function CookieButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Vent lidt, før den vises (valgfrit)
    const timeout = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <button
      className={styles.cookieButton}
      onClick={() => CookieConsent.showPreferences()}
      aria-label="Cookie-indstillinger"
    >
      🍪
    </button>
  );
}
