// src/components/ContactForm/ContactForm.tsx
import React from "react";
import Buttons from "../Buttons";
import styles from "./ContactForm.module.css";
import type { Lang } from "../../lib/lang";

import type { ISO2, UiLang } from "../../lib/countryCodes";
import {
  allCountries,
  findCountry,
  countryLabel,
  defaultCountryFromNavigator,
} from "../../lib/countryCodes";

type Props = { lang: Lang; submitUrl?: string };

type FormState = {
  name: string;
  email: string;
  phone: string; // national del (uden +kode)
  countryIso: ISO2;
  message: string;
};

export default function ContactForm({
  lang,
  submitUrl = "/api/contact",
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const uiLang: UiLang = lang;

  // Robust default land (falder tilbage til DK hvis intet matches)
  const initialIso: ISO2 =
    (typeof localStorage !== "undefined"
      ? (localStorage.getItem("cf_country") as ISO2 | null) ?? null
      : null) ||
    defaultCountryFromNavigator() ||
    ("DK" as ISO2);

  const [state, setState] = React.useState<FormState>({
    name:
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("cf_name") ?? ""
        : "") || "",
    email:
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("cf_email") ?? ""
        : "") || "",
    phone:
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("cf_phone") ?? ""
        : "") || "",
    countryIso: initialIso,
    message: "",
  });

  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCountry = findCountry(state.countryIso);
  const dial = selectedCountry?.dial ?? "";

  // Hjælpere til state + persistence
  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setState((s) => ({ ...s, [key]: val }));
    if (typeof localStorage !== "undefined") {
      if (key === "countryIso") localStorage.setItem("cf_country", String(val));
      if (key === "phone") localStorage.setItem("cf_phone", String(val));
      if (key === "name") localStorage.setItem("cf_name", String(val));
      if (key === "email") localStorage.setItem("cf_email", String(val));
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fullPhone = state.phone.trim() ? `${dial} ${state.phone.trim()}` : "";

    // Client-side tjek
    const missing: string[] = [];
    if (!state.name.trim()) missing.push(t("navn", "name"));
    if (!state.email.trim()) missing.push("email");
    if (!state.message.trim()) missing.push(t("besked", "message"));
    if (!state.countryIso) missing.push(t("land", "country"));
    if (missing.length) {
      setError(
        t(
          `Udfyld venligst: ${missing.join(", ")}.`,
          `Please fill: ${missing.join(", ")}.`
        )
      );
      return;
    }

    setSending(true);
    try {
      const payload = {
        lang,
        name: state.name.trim(),
        email: state.email.trim(),
        phone: fullPhone || undefined,
        countryIso: state.countryIso, // ISO
        country: countryLabel(state.countryIso, uiLang), // læseligt navn
        message: state.message.trim(),
        context: "contact",
      };

      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: unknown = await res
        .json()
        .catch(() => ({} as Record<string, unknown>));

      // forventer { ok: true } fra API ved succes
      const ok =
        res.ok &&
        typeof json === "object" &&
        json !== null &&
        (json as { ok?: boolean }).ok === true;

      if (!ok) {
        // Vis evt. præcis serverdetalje
        let serverDetail = "";
        if (
          typeof json === "object" &&
          json &&
          "detail" in json &&
          json.detail
        ) {
          serverDetail = ` – ${JSON.stringify(
            (json as { detail: unknown }).detail
          )}`;
        }
        throw new Error(`HTTP ${res.status}${serverDetail}`);
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
    const fullPhone =
      state.phone.trim() && dial ? `${dial} ${state.phone.trim()}` : "";
    return (
      <div className={styles.success} role="status" aria-live="polite">
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
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.row}>
        <label className={styles.label} htmlFor="cf-name">
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
        <label className={styles.label} htmlFor="cf-email">
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
          placeholder="you@example.com"
        />
      </div>

      <div className={styles.rowGroup}>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="cf-country">
            {t("Land", "Country")}
          </label>
          <select
            id="cf-country"
            className={styles.select}
            value={state.countryIso}
            onChange={(e) => onChange("countryIso", e.target.value as ISO2)}
          >
            {allCountries().map((c) => (
              <option key={c.iso} value={c.iso}>
                {countryLabel(c.iso, uiLang)} {c.dial ? `(${c.dial})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="cf-phone">
            {t("Telefon (valgfrit)", "Phone (optional)")}
          </label>
          <div className={styles.phone}>
            <span className={styles.dial}>{dial}</span>
            <input
              id="cf-phone"
              className={styles.input}
              type="tel"
              name="phone"
              autoComplete="tel-national"
              value={state.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder={t("Dit nummer", "Your number")}
            />
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="cf-msg">
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
