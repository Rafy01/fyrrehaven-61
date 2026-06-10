import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import styles from "./HumanVerificationGate.module.css";
import type { ResolvedAppearance } from "../../app/App";

const STORAGE_KEY = "fh61_human_verified_v1";
const MIN_VISIBLE_MS = 900;
const REMEMBER_MS = 1000 * 60 * 60 * 24 * 30;
const LIGHT_LOGO_SRC = "/logo_trans.png";
const DARK_LOGO_SRC =
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/logo_trans_white-scaled.png";

function readVerified() {
  if (typeof window === "undefined") return true;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return false;
    const parsed = JSON.parse(value) as { expiresAt?: number };
    return typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function rememberVerified() {
  const expiresAt = Date.now() + REMEMBER_MS;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiresAt }));
}

export default function HumanVerificationGate({
  resolvedAppearance,
}: {
  resolvedAppearance: ResolvedAppearance;
}) {
  const { t } = useTranslation("common");
  const titleId = useId();
  const descriptionId = useId();
  const [visible, setVisible] = useState(() => !readVerified());
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setReady(true), MIN_VISIBLE_MS);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  const logoSrc = resolvedAppearance === "dark" ? DARK_LOGO_SRC : LIGHT_LOGO_SRC;
  const canContinue = ready && checked;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (honeypot) {
      setError(t("humanCheck.error"));
      return;
    }
    if (!canContinue) return;
    rememberVerified();
    setVisible(false);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <section className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.logoFrame} aria-hidden="true">
            <img className={styles.logo} src={logoSrc} alt="" />
          </span>
          <div className={styles.brandText}>
            <span className={styles.eyebrow}>{t("humanCheck.eyebrow")}</span>
            <span className={styles.brandName}>{t("brand")}</span>
          </div>
        </div>

        <form className={styles.content} onSubmit={onSubmit}>
          <h2 className={styles.title} id={titleId}>
            {t("humanCheck.title")}
          </h2>
          <p className={styles.body} id={descriptionId}>
            {t("humanCheck.description")}
          </p>

          <div className={styles.challenge}>
            <label className={styles.checkRow}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />
              <span className={styles.checkText}>{t("humanCheck.checkbox")}</span>
            </label>

            <label className={styles.hiddenField} aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </label>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={!canContinue}>
              {ready ? t("humanCheck.continue") : t("humanCheck.preparing")}
            </button>
            <p className={styles.finePrint}>{t("humanCheck.finePrint")}</p>
          </div>
        </form>
      </section>
    </div>
  );
}
