// src/components/ContactForm/ContactForm.tsx
import React from "react";
import Buttons from "../Buttons";
import styles from "./ContactForm.module.css";
import type { Lang } from "../../lib/lang";
import { useTranslation } from "react-i18next";

import type { ISO2, UiLang } from "../../lib/countryCodes";
import {
  allCountries,
  findCountry,
  countryLabel,
  defaultCountryFromNavigator,
} from "../../lib/countryCodes";

type Props = { lang?: Lang; submitUrl?: string };

type FormState = {
  name: string;
  email: string;
  phone: string; // national del (uden +kode)
  countryIso: ISO2;
  message: string;
};

const DIGITS_RE = /[^\d]/g;

/** Resolve current UI language.
 * Priority: explicit prop -> i18next -> 'da' fallback
 */
function useUiLang(explicit?: Lang): Lang {
  const { i18n } = useTranslation();
  const i18nLang =
    i18n?.language && i18n.language.toLowerCase().startsWith("da")
      ? ("da" as Lang)
      : ("en" as Lang);

  // If prop provided, follow it; else follow i18n (hook re-renders on change)
  return explicit ?? i18nLang ?? "da";
}

export default function ContactForm({
  lang: langProp,
  submitUrl = "/api/contact",
}: Props) {
  const ui = useUiLang(langProp);
  const lang: Lang = ui; // normalize type
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const uiLang: UiLang = lang;

  const initialIso: ISO2 = (() => {
    const saved =
      (typeof localStorage !== "undefined"
        ? (localStorage.getItem("cf_country") as ISO2 | null)
        : null) || defaultCountryFromNavigator();
    return saved;
  })();

  const [state, setState] = React.useState<FormState>({
    name: "",
    email: "",
    phone:
      typeof localStorage !== "undefined"
        ? localStorage.getItem("cf_phone") ?? ""
        : "",
    countryIso: initialIso,
    message: "",
  });

  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCountry = findCountry(state.countryIso);
  const dial = selectedCountry?.dial ?? "";
  const fullPhone = state.phone.trim() ? `${dial} ${state.phone.trim()}` : "";

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setState((s) => ({ ...s, [key]: val }));
    if (key === "countryIso" && typeof localStorage !== "undefined") {
      localStorage.setItem("cf_country", String(val));
    }
    if (key === "phone" && typeof localStorage !== "undefined") {
      localStorage.setItem("cf_phone", String(val));
    }
  }

  // Only digits in phone
  function onPhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }
  function onPhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(DIGITS_RE, "");
    onChange("phone", digits);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!state.name.trim() || !state.email.trim() || !state.message.trim()) {
      setError(
        t(
          "Udfyld venligst navn, e-mail og besked.",
          "Please fill in your name, email and message."
        )
      );
      return;
    }

    setSending(true);
    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          name: state.name.trim(),
          email: state.email.trim(),
          phone: fullPhone,
          countryIso: state.countryIso,
          message: state.message.trim(),
          purpose: "contact",
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${txt ? ` – ${txt}` : ""}`);
      }
      setSent(true);
    } catch (e) {
      console.error("ContactForm submit failed:", e);
      setError(
        t(
          "Kunne ikke sende beskeden. Prøv igen om lidt.",
          "Couldn't send your message. Please try again shortly."
        )
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        className={`${styles.card} ${styles.success}`}
        role="status"
        aria-live="polite"
      >
        <h3 className={styles.sTitle}>
          {t("Tak for din henvendelse!", "Thanks for your message!")}
        </h3>
        <p className={styles.sLead}>
          {t(
            "Vi vender tilbage hurtigst muligt. Her er en kopi af det, du sendte:",
            "We'll get back to you as soon as possible. Here's a copy of what you sent:"
          )}
        </p>
        <dl className={styles.echo}>
          <div>
            <dt>{t("Navn", "Name")}</dt>
            <dd>{state.name}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{state.email}</dd>
          </div>
          {fullPhone && (
            <div>
              <dt>{t("Telefon", "Phone")}</dt>
              <dd>{fullPhone}</dd>
            </div>
          )}
          <div>
            <dt>{t("Land", "Country")}</dt>
            <dd>{countryLabel(state.countryIso, uiLang)}</dd>
          </div>
          <div className={styles.echoMsg}>
            <dt>{t("Besked", "Message")}</dt>
            <dd>{state.message}</dd>
          </div>
        </dl>
        <Buttons
          to="/"
          variant="secondary"
          label={t("Til forsiden", "Back to home")}
        />
      </div>
    );
  }

  return (
    <form
      className={`${styles.card} ${styles.form}`}
      onSubmit={onSubmit}
      noValidate
    >
      <div className={styles.header}>
        <div className={styles.kicker}>{t("Skriv til os", "Write to us")}</div>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="cf-name" data-required="true">
          {t("Navn", "Name")}
        </label>
        <input
          id="cf-name"
          className={styles.input}
          type="text"
          name="name"
          required
          autoComplete="name"
          value={state.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={t("Dit navn", "Your name")}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="cf-email" data-required="true">
          E-mail
        </label>
        <input
          id="cf-email"
          className={styles.input}
          type="email"
          name="email"
          required
          autoComplete="email"
          value={state.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder={t("din@adresse.dk", "your@email.com")}
        />
      </div>

      <div className={styles.rowGroup}>
        <div className={styles.row}>
          <label
            className={styles.label}
            htmlFor="cf-country"
            data-required="true"
          >
            {t("Land", "Country")}
          </label>
          <div className={styles.selectWrap}>
            <select
              id="cf-country"
              className={styles.select}
              value={state.countryIso}
              onChange={(e) => onChange("countryIso", e.target.value as ISO2)}
              required
            >
              {allCountries().map((c) => (
                <option key={c.iso} value={c.iso}>
                  {countryLabel(c.iso, uiLang)} {c.dial ? `(${c.dial})` : ""}
                </option>
              ))}
            </select>
            <span className={styles.chev} aria-hidden>
              ▾
            </span>
          </div>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="cf-phone">
            {t("Telefon", "Phone")}
          </label>
          <div className={styles.phone}>
            <span className={styles.dial} aria-hidden="true">
              {dial}
            </span>
            <input
              id="cf-phone"
              className={styles.inputphone}
              type="tel"
              name="phone"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel-national"
              value={state.phone}
              onKeyDown={onPhoneKeyDown}
              onChange={onPhoneChange}
              placeholder={t("Telefonnummer", "Phone number")}
            />
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="cf-msg" data-required="true">
          {t("Besked", "Message")}
        </label>
        <textarea
          id="cf-msg"
          className={styles.textarea}
          name="message"
          required
          rows={6}
          value={state.message}
          onChange={(e) => onChange("message", e.target.value)}
          placeholder={t(
            "Skriv kort, hvad du ønsker hjælp til…",
            "Tell us briefly what you need help with…"
          )}
        />
      </div>

      {error && (
        <div className={styles.error} role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <Buttons
          buttonType="submit"
          loading={sending}
          variant="primary"
          label={t("Send besked", "Send message")}
          ariaLabel={t("Send formularen", "Submit the form")}
          fullWidth
        />
      </div>
    </form>
  );
}
