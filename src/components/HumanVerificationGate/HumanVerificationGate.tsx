import { useEffect, useId, useRef, useState } from "react";
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
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

type RecaptchaTheme = "dark" | "light";

type RecaptchaRenderParams = {
  sitekey: string;
  theme: RecaptchaTheme;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type Grecaptcha = {
  render: (container: HTMLElement, parameters: RecaptchaRenderParams) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    fh61RecaptchaReady?: () => void;
  }
}

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

function getRecaptchaLanguage(language?: string) {
  if (language?.startsWith("de")) return "de";
  if (language?.startsWith("en")) return "en";
  return "da";
}

function loadRecaptcha(language: string) {
  if (typeof window === "undefined") return Promise.reject();
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);

  return new Promise<Grecaptcha>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-fh61-recaptcha="true"]'
    );

    window.fh61RecaptchaReady = () => {
      if (window.grecaptcha) {
        resolve(window.grecaptcha);
      } else {
        reject(new Error("RECAPTCHA_NOT_READY"));
      }
    };

    if (existing) {
      existing.addEventListener("error", () => reject(new Error("RECAPTCHA_LOAD_FAILED")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=fh61RecaptchaReady&render=explicit&hl=${encodeURIComponent(
      language
    )}`;
    script.async = true;
    script.defer = true;
    script.dataset.fh61Recaptcha = "true";
    script.onerror = () => reject(new Error("RECAPTCHA_LOAD_FAILED"));
    document.head.appendChild(script);
  });
}

export default function HumanVerificationGate({
  resolvedAppearance,
}: {
  resolvedAppearance: ResolvedAppearance;
}) {
  const { i18n, t } = useTranslation("common");
  const titleId = useId();
  const descriptionId = useId();
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(() => !readVerified());
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!visible || !RECAPTCHA_SITE_KEY || !recaptchaRef.current) return;

    let cancelled = false;
    widgetIdRef.current = null;
    setChecked(false);
    setRecaptchaToken("");
    setError("");

    loadRecaptcha(getRecaptchaLanguage(i18n.resolvedLanguage || i18n.language))
      .then((grecaptcha) => {
        if (cancelled || !recaptchaRef.current) return;
        recaptchaRef.current.innerHTML = "";
        widgetIdRef.current = grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: resolvedAppearance === "dark" ? "dark" : "light",
          callback: (token) => {
            setRecaptchaToken(token);
            setChecked(true);
            setError("");
          },
          "expired-callback": () => {
            setRecaptchaToken("");
            setChecked(false);
          },
          "error-callback": () => {
            setRecaptchaToken("");
            setChecked(false);
            setError(t("humanCheck.recaptchaError"));
          },
        });
      })
      .catch(() => {
        if (!cancelled) setError(t("humanCheck.recaptchaError"));
      });

    return () => {
      cancelled = true;
    };
  }, [i18n.language, i18n.resolvedLanguage, resolvedAppearance, t, visible]);

  if (!visible) return null;

  const logoSrc = resolvedAppearance === "dark" ? DARK_LOGO_SRC : LIGHT_LOGO_SRC;
  const hasRecaptcha = Boolean(RECAPTCHA_SITE_KEY);
  const canContinue = ready && checked && !submitting;

  const resetRecaptcha = () => {
    if (typeof window === "undefined") return;
    if (!window.grecaptcha || widgetIdRef.current == null) return;
    window.grecaptcha.reset(widgetIdRef.current);
    setRecaptchaToken("");
    setChecked(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (honeypot) {
      setError(t("humanCheck.error"));
      return;
    }
    if (!canContinue) return;

    if (!hasRecaptcha) {
      rememberVerified();
      setVisible(false);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/human-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: recaptchaToken, website: honeypot }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean } | null;

      if (!response.ok || !result?.ok) {
        resetRecaptcha();
        setError(t("humanCheck.error"));
        return;
      }

      rememberVerified();
      setVisible(false);
    } catch {
      resetRecaptcha();
      setError(t("humanCheck.error"));
    } finally {
      setSubmitting(false);
    }
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
            {hasRecaptcha ? (
              <div className={styles.recaptchaBox}>
                <div ref={recaptchaRef} className={styles.recaptcha} />
              </div>
            ) : (
              <label className={styles.checkRow}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                />
                <span className={styles.checkText}>{t("humanCheck.checkbox")}</span>
              </label>
            )}

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
              {submitting
                ? t("humanCheck.verifying")
                : ready
                  ? t("humanCheck.continue")
                  : t("humanCheck.preparing")}
            </button>
            <p className={styles.finePrint}>{t("humanCheck.finePrint")}</p>
          </div>
        </form>
      </section>
    </div>
  );
}
