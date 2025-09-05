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

import AvailabilityCalendar, {
  type Selection,
  type SelectionMode,
  type SelectionPrice,
} from "../AvailabilityCalendar/AvailabilityCalendar";

type Purpose = "inquiry" | "booking" | "other";

type Props = {
  lang?: Lang;
  submitUrl?: string;
  /** 'contact' = ingen kalender; 'booking' = kalender + bookingfelter */
  variant?: "contact" | "booking";
};

type FormState = {
  name: string;
  email: string;
  phone: string; // national del (uden +kode)
  countryIso: ISO2;
  message: string;
  consent: boolean; // nødvendig (GDPR behandling)
  feesAccepted: boolean; // nødvendig i booking-varianten
  // Kun i booking-varianten
  adults: number;
  children: number;
  babies: number;
  stayPurpose: string; // hvad vil man bruge opholdet til
};

const CLEANING_FEE_DKK = 1200;
const DIGITS_RE = /[^\d]/g;

/** Resolve current UI language. */
function useUiLang(explicit?: Lang): Lang {
  const { i18n } = useTranslation();
  const i18nLang =
    i18n?.language && i18n.language.toLowerCase().startsWith("da")
      ? ("da" as Lang)
      : ("en" as Lang);
  return explicit ?? i18nLang ?? "da";
}

export default function ContactForm({
  lang: langProp,
  submitUrl = "/api/contact",
  variant = "contact",
}: Props) {
  const ui = useUiLang(langProp);
  const lang: Lang = ui;
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const uiLang: UiLang = lang;

  const feesUrl =
    lang === "da"
      ? "http://localhost:5173/da/Gebyrer"
      : "http://localhost:5173/en/fees";

  // init land/telefon fra localStorage
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
    consent: false,
    feesAccepted: false,
    adults: 2,
    children: 0,
    babies: 0,
    stayPurpose: "",
  });

  // Formål (kun synligt i booking-varianten, men vi holder state alligevel)
  const [purpose, setPurpose] = React.useState<Purpose>(
    variant === "booking" ? "booking" : "inquiry"
  );
  const effectivePurpose: Purpose = variant === "booking" ? purpose : "inquiry";

  // Kalender-valg/pris (kun relevant i booking-varianten)
  const [, setSel] = React.useState<Selection | null>(null);
  const [selPrice, setSelPrice] = React.useState<SelectionPrice>({
    kind: "none",
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

  // Kun cifre i telefon
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

  const fmtDate = React.useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "da" ? "da-DK" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [lang]
  );
  const fmtMoney = React.useMemo(
    () =>
      new Intl.NumberFormat(lang === "da" ? "da-DK" : "en-GB", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }),
    [lang]
  );

  // Udregn total inkl. rengøring (kun hvis der er nætter)
  const baseNightsTotal = selPrice.total ?? 0;
  const includeCleaning = !!(selPrice.nights && selPrice.nights > 0);
  const totalWithCleaning = includeCleaning
    ? baseNightsTotal + CLEANING_FEE_DKK
    : baseNightsTotal;

  // Submit
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Basal validering
    if (!state.name.trim() || !state.email.trim() || !state.message.trim()) {
      setError(
        t(
          "Udfyld venligst navn, e-mail og besked.",
          "Please fill in your name, email and message."
        )
      );
      return;
    }

    if (!state.consent) {
      setError(
        t(
          "Sæt venligst flueben for samtykke til behandling af dine oplysninger.",
          "Please check the consent box to allow us to process your information."
        )
      );
      return;
    }

    // Booking-variant: ekstra krav
    if (variant === "booking") {
      const startISO = selPrice.start?.toISOString().slice(0, 10) ?? "";
      const endISO = selPrice.endExclusive?.toISOString().slice(0, 10) ?? "";
      if (!startISO || !endISO || !selPrice.nights || selPrice.nights <= 0) {
        setError(
          t(
            "Vælg venligst en periode i kalenderen (ankomst og afrejse).",
            "Please select a period in the calendar (check-in and check-out)."
          )
        );
        return;
      }
      if (!state.feesAccepted) {
        setError(
          t(
            "Bekræft venligst at du har læst og accepterer gebyroversigten.",
            "Please confirm that you have read and accept the fee list."
          )
        );
        return;
      }
      if (!state.stayPurpose.trim()) {
        setError(
          t(
            "Fortæl os venligst kort, hvad opholdet skal bruges til.",
            "Please briefly tell us the purpose of your stay."
          )
        );
        return;
      }
      if (state.adults < 1) {
        setError(
          t(
            "Angiv venligst antal voksne (mindst 1).",
            "Please enter number of adults (at least 1)."
          )
        );
        return;
      }
    }

    setSending(true);
    try {
      const selectionPayload =
        variant === "booking"
          ? {
              start: selPrice.start?.toISOString().slice(0, 10) ?? null,
              endExclusive:
                selPrice.endExclusive?.toISOString().slice(0, 10) ?? null,
              nights: selPrice.nights ?? null,
              baseNightsTotalDKK: selPrice.total ?? null,
              cleaningFeeDKK: includeCleaning ? CLEANING_FEE_DKK : 0,
              totalWithCleaningDKK: includeCleaning
                ? (selPrice.total ?? 0) + CLEANING_FEE_DKK
                : selPrice.total ?? null,
              breakdown:
                selPrice.breakdown?.map((b) => ({
                  date: b.date.toISOString().slice(0, 10),
                  price: b.price,
                })) ?? [],
            }
          : null;

      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          purpose: effectivePurpose, // "inquiry" | "booking" | "other"
          name: state.name.trim(),
          email: state.email.trim(),
          phone: fullPhone,
          countryIso: state.countryIso,
          message: state.message.trim(),
          consent: state.consent,
          feesAccepted: variant === "booking" ? state.feesAccepted : undefined,
          guests:
            variant === "booking"
              ? {
                  adults: state.adults,
                  children: state.children,
                  babies: state.babies,
                }
              : undefined,
          stayPurpose:
            variant === "booking" ? state.stayPurpose.trim() : undefined,
          selection: selectionPayload, // kun udfyldt i booking-variant
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${txt ? ` – ${txt}` : ""}`);
      }
      setSent(true);
    } catch (err) {
      console.error("ContactForm submit failed:", err);
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

          {variant === "booking" && selPrice.start && selPrice.endExclusive && (
            <>
              <div>
                <dt>{t("Periode", "Period")}</dt>
                <dd>
                  {fmtDate.format(selPrice.start)} –{" "}
                  {fmtDate.format(selPrice.endExclusive)} · {selPrice.nights}{" "}
                  {t("nætter", "nights")}
                </dd>
              </div>
              <div>
                <dt>{t("Pris (overnatninger)", "Price (nights)")}</dt>
                <dd>
                  {selPrice.total != null
                    ? fmtMoney.format(selPrice.total)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>{t("Rengøring", "Cleaning")}</dt>
                <dd>{fmtMoney.format(CLEANING_FEE_DKK)}</dd>
              </div>
              <div>
                <dt>{t("Estimeret total", "Estimated total")}</dt>
                <dd>{fmtMoney.format(totalWithCleaning)}</dd>
              </div>
              <div>
                <dt>{t("Gæster", "Guests")}</dt>
                <dd>
                  {t("Voksne", "Adults")}: {state.adults}
                  {", "}
                  {t("Børn", "Children")}: {state.children}
                  {", "}
                  {t("Babyer", "Babies")}: {state.babies}
                </dd>
              </div>
              {state.stayPurpose && (
                <div>
                  <dt>{t("Formål med opholdet", "Purpose of stay")}</dt>
                  <dd>{state.stayPurpose}</dd>
                </div>
              )}
            </>
          )}

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
      {/* ——— KUN i booking-varianten ——— */}
      {variant === "booking" && (
        <>
          {/* Kalender først (vises uafhængigt af dropdown-valget) */}
          <div className={styles.row}>
            <label className={styles.label}>
              {t("Vælg datoer", "Select dates")}
            </label>
            <div className={styles.calendarWrap}>
              <AvailabilityCalendar
                lang={lang}
                weekStartsOn={1}
                selectionMode={"range" as SelectionMode}
                disablePastSelection
                onSelectionChange={(s) => setSel(s)}
                onSelectionPrice={(p) => setSelPrice(p)}
              />
            </div>
          </div>

          {/* Nu dropdown EFTER kalenderen */}
          <div className={styles.row}>
            <label
              className={styles.label}
              htmlFor="cf-purpose"
              data-required="true"
            >
              {t("Formål", "Purpose")}
            </label>
            <div className={styles.selectWrap}>
              <select
                id="cf-purpose"
                className={styles.select}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as Purpose)}
                required
              >
                <option value="booking">{t("Booking", "Booking")}</option>
                <option value="inquiry">{t("Forspørgsel", "Inquiry")}</option>
                <option value="other">{t("Andet", "Other")}</option>
              </select>
              <span className={styles.chev} aria-hidden>
                ▾
              </span>
            </div>
          </div>

          {/* Ankomst/Afrejse visning */}
          <div className={styles.rowGroup}>
            <div className={styles.row}>
              <label
                className={styles.label}
                htmlFor="cf-checkin"
                data-required="true"
              >
                {t("Ankomst", "Check-in")}
              </label>
              <input
                id="cf-checkin"
                className={styles.input}
                type="text"
                readOnly
                required
                value={selPrice.start ? fmtDate.format(selPrice.start) : ""}
                placeholder={t("Vælg i kalenderen", "Pick in the calendar")}
              />
            </div>
            <div className={styles.row}>
              <label
                className={styles.label}
                htmlFor="cf-checkout"
                data-required="true"
              >
                {t("Afrejse", "Check-out")}
              </label>
              <input
                id="cf-checkout"
                className={styles.input}
                type="text"
                readOnly
                required
                value={
                  selPrice.endExclusive
                    ? fmtDate.format(selPrice.endExclusive)
                    : ""
                }
                placeholder={t("Vælg i kalenderen", "Pick in the calendar")}
              />
            </div>
          </div>

          {/* Gæsteantal — på linje (3 kolonner) */}
          <div
            className={styles.rowGroup}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <div className={styles.row}>
              <label
                className={styles.label}
                htmlFor="cf-adults"
                data-required="true"
              >
                {t("Voksne", "Adults")}
              </label>
              <input
                id="cf-adults"
                className={styles.input}
                type="number"
                min={1}
                step={1}
                required
                value={state.adults}
                onChange={(e) =>
                  onChange("adults", Math.max(1, Number(e.target.value || 0)))
                }
              />
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="cf-children">
                {t("Børn", "Children")}
              </label>
              <input
                id="cf-children"
                className={styles.input}
                type="number"
                min={0}
                step={1}
                value={state.children}
                onChange={(e) =>
                  onChange("children", Math.max(0, Number(e.target.value || 0)))
                }
              />
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="cf-babies">
                {t("Babyer", "Babies")}
              </label>
              <input
                id="cf-babies"
                className={styles.input}
                type="number"
                min={0}
                step={1}
                value={state.babies}
                onChange={(e) =>
                  onChange("babies", Math.max(0, Number(e.target.value || 0)))
                }
              />
            </div>
          </div>

          {/* Formål med opholdet */}
          <div className={styles.row}>
            <label
              className={styles.label}
              htmlFor="cf-staypurpose"
              data-required="true"
            >
              {t(
                "Hvad er grunden til opholdet?",
                "What is the purpose of your stay?"
              )}
            </label>
            <textarea
              id="cf-staypurpose"
              className={styles.textarea}
              required
              rows={3}
              value={state.stayPurpose}
              onChange={(e) => onChange("stayPurpose", e.target.value)}
              placeholder={t("Kort beskrivelse…", "Brief description…")}
            />
          </div>

          {/* Prisopsummering */}
          <div className={styles.rowGroup}>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="cf-nights">
                {t("Nætter", "Nights")}
              </label>
              <input
                id="cf-nights"
                className={styles.input}
                type="text"
                readOnly
                value={selPrice.nights ?? ""}
                placeholder="—"
              />
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="cf-base-total">
                {t("Pris (overnatninger)", "Price (nights)")}
              </label>
              <input
                id="cf-base-total"
                className={styles.input}
                type="text"
                readOnly
                value={
                  selPrice.total != null ? fmtMoney.format(selPrice.total) : ""
                }
                placeholder="—"
              />
            </div>
          </div>

          <div className={styles.rowGroup}>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="cf-cleaning">
                {t("Rengøring (obligatorisk)", "Cleaning (mandatory)")}
              </label>
              <input
                id="cf-cleaning"
                className={styles.input}
                type="text"
                readOnly
                value={
                  includeCleaning ? fmtMoney.format(CLEANING_FEE_DKK) : "—"
                }
              />
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="cf-total">
                {t("Estimeret total", "Estimated total")}
              </label>
              <input
                id="cf-total"
                className={styles.input}
                type="text"
                readOnly
                value={
                  includeCleaning
                    ? fmtMoney.format(totalWithCleaning)
                    : selPrice.total != null
                    ? fmtMoney.format(selPrice.total)
                    : ""
                }
                placeholder="—"
              />
            </div>
          </div>
        </>
      )}

      {/* ——— Kontaktfelter (begge varianter) ——— */}
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

      {/* Gebyr-liste accept (obligatorisk) */}
      <div className={styles.row}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={state.feesAccepted}
            onChange={(e) => onChange("feesAccepted", e.target.checked)}
            required
          />
          <span>
            {lang === "da" ? (
              <>
                Jeg har læst og accepterer{" "}
                <a href={feesUrl} target="_blank" rel="noreferrer">
                  gebyroversigten
                </a>
                .
              </>
            ) : (
              <>
                I have read and accept the{" "}
                <a href={feesUrl} target="_blank" rel="noreferrer">
                  fee list
                </a>
                .
              </>
            )}
          </span>
        </label>
      </div>
      {/* GDPR — behandling (obligatorisk) */}
      <div className={styles.row}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={state.consent}
            onChange={(e) => onChange("consent", e.target.checked)}
            required
          />
          <span>
            {t(
              "Jeg giver samtykke til, at mine oplysninger må gemmes og bruges til at behandle min henvendelse i overensstemmelse med privatlivspolitikken.",
              "I consent to my information being stored and used to process my inquiry in accordance with the privacy policy."
            )}
          </span>
        </label>
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
          label={
            variant === "booking"
              ? t("Send booking", "Send booking")
              : t("Send besked", "Send message")
          }
          ariaLabel={t("Send formularen", "Submit the form")}
          fullWidth
        />
      </div>
    </form>
  );
}
