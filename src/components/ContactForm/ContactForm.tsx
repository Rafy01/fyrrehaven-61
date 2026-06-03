// src/components/ContactForm/ContactForm.tsx
import React from "react";
import Buttons from "../Buttons";
import styles from "./ContactForm.module.css";
import { chooseLang, type Lang } from "../../lib/lang";
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
import { pathOf } from "../../lib/routes";

// ⬇️ NYT: importér cleaning-fee fra pricing
import {
  DEFAULT_CLEANING_FEE_DKK,
  getCleaningFeeForDate,
} from "../../data/pricing";

type Purpose = "inquiry" | "booking" | "other";

type Props = {
  lang?: Lang;
  submitUrl?: string;
  /** 'contact' = ingen kalender; 'booking' = kalender + bookingfelter */
  variant?: "contact" | "booking";
  ctaAnchor?: string;
};

type NumOrEmpty = number | ""; // ← tillad tom input

type FormState = {
  name: string;
  email: string;
  phone: string; // national del (uden +kode)
  countryIso: ISO2;
  message: string; // kun i contact-varianten
  consent: boolean;
  feesAccepted: boolean; // kun i booking-varianten
  // Kun i booking-varianten
  adults: NumOrEmpty;
  children: NumOrEmpty;
  babies: NumOrEmpty;
  stayPurpose: string;
};

const MAX_GUESTS = 10;
const DIGITS_RE = /[^\d]/g;

/** Resolve current UI language. */
function useUiLang(explicit?: Lang): Lang {
  const { i18n } = useTranslation();
  const i18nLang = i18n?.language
    ? i18n.language.toLowerCase().startsWith("da")
      ? ("da" as Lang)
      : i18n.language.toLowerCase().startsWith("de")
      ? ("de" as Lang)
      : ("en" as Lang)
    : ("en" as Lang);
  return explicit ?? i18nLang ?? "da";
}

// Hjælpere til tal↔state
const toInt = (v: NumOrEmpty) => (typeof v === "number" ? v : 0);
function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) n = min;
  return Math.min(Math.max(n, min), max);
}

export default function ContactForm({
  lang: langProp,
  submitUrl = "/api/contact",
  variant = "contact",
}: Props) {
  const { t: i18nT } = useTranslation("contact");
  const ui = useUiLang(langProp);
  const lang: Lang = ui;
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const uiLang: UiLang = lang;
  const isBooking = variant === "booking";

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
    isBooking ? "booking" : "inquiry"
  );

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
      new Intl.DateTimeFormat(lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [lang]
  );

  // Lang dato til fejlbeskeder (fx "14. oktober 2025")
  const fmtDateLong = React.useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [lang]
  );

  const fmtMoney = React.useMemo(
    () =>
      new Intl.NumberFormat(lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }),
    [lang]
  );

  // Lokal YYYY-MM-DD uden timezone (bruges til mails/server)
  const ymdLocal = React.useCallback((d?: Date | null) => {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, []);

  /* ─────────────── BASE & TOTALS ─────────────── */
  const baseNightsTotal = selPrice.total ?? 0;
  const includeCleaning = !!(selPrice.nights && selPrice.nights > 0);

  // Brug år/dato-specifikt rengøringsfee, ellers global default
  const cleaningFeeDKK = selPrice.start
    ? getCleaningFeeForDate(selPrice.start)
    : DEFAULT_CLEANING_FEE_DKK;

  const totalWithCleaning = includeCleaning
    ? baseNightsTotal + cleaningFeeDKK
    : baseNightsTotal;

  /* ─────────────── GUEST CAP (max 10 personer) ─────────────── */
  const nAdults = toInt(state.adults);
  const nChildren = toInt(state.children);
  const nBabies = toInt(state.babies);

  const adultsMax = Math.max(1, MAX_GUESTS - nChildren - nBabies);
  const childrenMax = Math.max(0, MAX_GUESTS - nAdults - nBabies);
  const babiesMax = Math.max(0, MAX_GUESTS - nAdults - nChildren);

  function onAdultsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val === "") return onChange("adults", "");
    const next = clampInt(Number(val), 0, adultsMax);
    onChange("adults", next);
  }
  function onChildrenChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val === "") return onChange("children", "");
    const next = clampInt(Number(val), 0, childrenMax);
    onChange("children", next);
  }
  function onBabiesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val === "") return onChange("babies", "");
    const next = clampInt(Number(val), 0, babiesMax);
    onChange("babies", next);
  }

  // Total uden extras
  const grandTotal = totalWithCleaning;

  // === Min.-nætter: afledte værdier til UI og submit-validering ===
  const minReq = selPrice.minNightsRequired ?? 2;

  // Submit
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const missingMsg = isBooking
      ? t(
          "Udfyld venligst navn og e-mail.",
          "Please fill in your name and email.",
          "Bitte geben Sie Name und E-Mail ein."
        )
      : t(
          "Udfyld venligst navn, e-mail og besked.",
          "Please fill in your name, email and message.",
          "Bitte geben Sie Name, E-Mail und Nachricht ein."
        );

    if (
      !state.name.trim() ||
      !state.email.trim() ||
      (!isBooking && !state.message.trim())
    ) {
      setError(missingMsg);
      return;
    }

    if (!state.consent) {
      setError(
        t(
          "Sæt venligst flueben for samtykke til behandling af dine oplysninger.",
          "Please check the consent box to allow us to process your information.",
          "Bitte bestätigen Sie die Einwilligung zur Verarbeitung Ihrer Daten."
        )
      );
      return;
    }

    // Booking-variant: ekstra krav
    if (isBooking) {
      const A = toInt(state.adults);
      const C = toInt(state.children);
      const B = toInt(state.babies);

      const totalGuests = A + C + B;
      if (A < 1) {
        setError(
          t(
            "Angiv venligst antal voksne (mindst 1).",
            "Please enter number of adults (at least 1).",
            "Bitte geben Sie die Anzahl der Erwachsenen an (mindestens 1)."
          )
        );
        return;
      }
      if (totalGuests > MAX_GUESTS) {
        setError(
          t(
            "Det samlede antal gæster må højst være 10.",
            "The total number of guests must not exceed 10.",
            "Die Gesamtzahl der Gäste darf höchstens 10 betragen."
          )
        );
        return;
      }

      // Datoer valgt? (brug lokal YYYY-MM-DD)
      const startYMD = ymdLocal(selPrice.start) ?? "";
      const endYMD = ymdLocal(selPrice.endExclusive) ?? "";
      if (!startYMD || !endYMD || !selPrice.nights || selPrice.nights <= 0) {
        setError(
          t(
            "Vælg venligst en periode i kalenderen (ankomst og afrejse).",
            "Please select a period in the calendar (check-in and check-out).",
            "Bitte wählen Sie einen Zeitraum im Kalender (Anreise und Abreise)."
          )
        );
        return;
      }

      // Min.-nætter opfyldt?
      if (selPrice.isMinNightsSatisfied === false) {
        const msg =
          selPrice.validationError ??
          (lang === "da"
            ? `Minimum ${minReq} ${
                minReq === 1 ? "nat" : "nætter"
              } ved ankomst ${fmtDateLong.format(
                selPrice.start!
              )}. Vælg venligst en længere periode.`
            : lang === "de"
            ? `Mindestens ${minReq} ${
                minReq === 1 ? "Nacht" : "Nächte"
              } bei Anreise ${fmtDateLong.format(
                selPrice.start!
              )}. Bitte wählen Sie einen längeren Aufenthalt.`
            : `Minimum ${minReq} night${
                minReq === 1 ? "" : "s"
              } required for arrival ${fmtDateLong.format(
                selPrice.start!
              )}. Please choose a longer stay.`);
        setError(msg);
        return;
      }

      if (!state.feesAccepted) {
        setError(
          t(
            "Bekræft venligst at du har læst og accepterer gebyroversigten.",
            "Please confirm that you have read and accept the fee list.",
            "Bitte bestätigen Sie, dass Sie die Gebührenübersicht gelesen und akzeptiert haben."
          )
        );
        return;
      }
      if (!state.stayPurpose.trim()) {
        setError(
          t(
            "Fortæl os venligst kort, hvad opholdet skal bruges til.",
            "Please briefly tell us the purpose of your stay.",
            "Bitte beschreiben Sie kurz den Zweck Ihres Aufenthalts."
          )
        );
        return;
      }
    }

    setSending(true);
    try {
      const selectionPayload = isBooking
        ? {
            // Brug lokal YYYY-MM-DD (ingen UTC-skift)
            start: ymdLocal(selPrice.start),
            endExclusive: ymdLocal(selPrice.endExclusive),
            nights: selPrice.nights ?? null,
            baseNightsTotalDKK: selPrice.total ?? null,
            cleaningFeeDKK: includeCleaning ? cleaningFeeDKK : 0,
            totalWithCleaningDKK: includeCleaning
              ? (selPrice.total ?? 0) + cleaningFeeDKK
              : selPrice.total ?? null,
            // min.-nætter metadata til server-side validering/logning
            minNightsRequired: selPrice.minNightsRequired ?? 2,
            isMinNightsSatisfied:
              selPrice.isMinNightsSatisfied ?? selPrice.nights != null,
            validationError: selPrice.validationError ?? null,
            breakdown:
              selPrice.breakdown?.map((b) => ({
                date: ymdLocal(b.date)!, // lokal dato
                price: b.price,
              })) ?? [],
          }
        : null;

      const purposeForApi: Purpose = isBooking
        ? purpose === "other"
          ? "other"
          : "booking"
        : "inquiry";

      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          purpose: purposeForApi,
          name: state.name.trim(),
          email: state.email.trim(),
          phone: fullPhone,
          countryIso: state.countryIso,
          message: isBooking ? undefined : state.message.trim(),
          consent: state.consent,
          feesAccepted: isBooking ? state.feesAccepted : undefined,
          guests: isBooking
            ? {
                adults: toInt(state.adults),
                children: toInt(state.children),
                babies: toInt(state.babies),
                total:
                  toInt(state.adults) +
                  toInt(state.children) +
                  toInt(state.babies),
              }
            : undefined,
          stayPurpose: isBooking ? state.stayPurpose.trim() : undefined,
          selection: selectionPayload,
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
          "Couldn't send your message. Please try again shortly.",
          "Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es gleich noch einmal."
        )
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    const startStr = selPrice.start
      ? fmtDate.format(selPrice.start)
      : t("—", "—");
    const endStr = selPrice.endExclusive
      ? fmtDate.format(selPrice.endExclusive)
      : t("—", "—");
    const nightsStr =
      typeof selPrice.nights === "number"
        ? String(selPrice.nights)
        : t("—", "—");
    const nightsPriceStr =
      selPrice.total != null ? fmtMoney.format(selPrice.total) : t("—", "—");
    const cleaningStr = includeCleaning
      ? fmtMoney.format(cleaningFeeDKK)
      : t("—", "—");

    const totalStr =
      includeCleaning || selPrice.total != null
        ? fmtMoney.format(grandTotal)
        : t("—", "—");

    return (
      <div
        className={`${styles.card} ${styles.success}`}
        role="status"
        aria-live="polite"
      >
        <h3 className={styles.sTitle}>
          {isBooking
            ? i18nT("form.success.bookingTitle")
            : i18nT("form.success.messageTitle")}
        </h3>
        <p className={styles.sLead}>
          {isBooking
            ? i18nT("form.success.bookingLead")
            : i18nT("form.success.messageLead")}
        </p>

        {isBooking && (
          <dl className={styles.echo}>
            <div>
              <dt>{t("Ankomst", "Check-in", "Anreise")}</dt>
              <dd>{startStr}</dd>
            </div>
            <div>
              <dt>{t("Afrejse", "Check-out", "Abreise")}</dt>
              <dd>{endStr}</dd>
            </div>
            <div>
              <dt>{t("Nætter", "Nights", "Nächte")}</dt>
              <dd>{nightsStr}</dd>
            </div>
            <div>
              <dt>{t("Pris (overnatninger)", "Price (nights)", "Preis (Übernachtungen)")}</dt>
              <dd>{nightsPriceStr}</dd>
            </div>
            <div>
              <dt>{t("Rengøring (obligatorisk)", "Cleaning (mandatory)", "Reinigung (obligatorisch)")}</dt>
              <dd>{cleaningStr}</dd>
            </div>

            <div>
              <dt>{t("Estimeret total", "Estimated total", "Geschätzter Gesamtpreis")}</dt>
              <dd>{totalStr}</dd>
            </div>
            <div>
              <dt>{t("Gæster", "Guests", "Gäste")}</dt>
              <dd>
                {`${toInt(state.adults)} ${t("voksne", "adults", "Erwachsene")}, ${toInt(
                  state.children
                )} ${t("børn", "children", "Kinder")}, ${toInt(state.babies)} ${t(
                  "babyer",
                  "babies",
                  "Babys"
                )}`}
              </dd>
            </div>
          </dl>
        )}

        {/* Kontakt-oplysninger vises for begge varianter */}
        <dl className={styles.echo}>
          <div>
            <dt>{t("Navn", "Name", "Name")}</dt>
            <dd>{state.name || t("—", "—")}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{state.email || t("—", "—")}</dd>
          </div>
          {fullPhone && (
            <div>
              <dt>{t("Telefon", "Phone", "Telefon")}</dt>
              <dd>{fullPhone}</dd>
            </div>
          )}
          <div>
            <dt>{t("Land", "Country", "Land")}</dt>
            <dd>{countryLabel(state.countryIso, uiLang)}</dd>
          </div>

          {/* Kontakt-variant: vis besked */}
          {!isBooking && state.message.trim() && (
            <div>
              <dt>{t("Besked", "Message", "Nachricht")}</dt>
              <dd>{state.message}</dd>
            </div>
          )}
        </dl>

        <Buttons
          to="/"
          variant="secondary"
          label={t("Til forsiden", "Back to home", "Zur Startseite")}
          buttonType="button"
        />
      </div>
    );
  }

  return (
    <form
      className={`${styles.card} ${styles.form}`}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const tag = (e.target as HTMLElement).tagName;
          // Allow enter i <textarea>, men ikke i andre felter
          if (tag !== "TEXTAREA") e.preventDefault();
        }
      }}
      noValidate
    >
      {/* ——— KUN i booking-varianten ——— */}
      {isBooking && (
        <>
          {/* Kalender */}
          <div className={styles.row}>
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

          {/* Ankomst/Afrejse visning */}
          <div className={styles.rowGroup}>
            <div className={styles.row}>
              <label
                className={styles.label}
                htmlFor="cf-checkin"
                data-required="true"
              >
                {t("Ankomst", "Check-in", "Anreise")}
              </label>
              <input
                id="cf-checkin"
                className={styles.input}
                type="text"
                readOnly
                required
                value={selPrice.start ? fmtDate.format(selPrice.start) : ""}
                placeholder={t("Vælg i kalenderen", "Pick in the calendar", "Im Kalender auswählen")}
              />
            </div>

            <div className={styles.row}>
              <label
                className={styles.label}
                htmlFor="cf-checkout"
                data-required="true"
              >
                {t("Afrejse", "Check-out", "Abreise")}
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
                placeholder={t("Vælg i kalenderen", "Pick in the calendar", "Im Kalender auswählen")}
              />
            </div>

            {/* Nætter + min.-nætter inline fejl */}
            <div className={styles.inlineMeta} aria-live="polite">
              <span className={styles.metaLabel}>
                {t("Nætter:", "Nights:", "Nächte:")}
              </span>
              <output className={styles.metaValue}>
                {selPrice.nights ?? t("—", "N/A")}
              </output>
            </div>
          </div>

          {/* Dropdown EFTER kalenderen */}
          <div className={styles.row}>
            <label
              className={styles.label}
              htmlFor="cf-purpose"
              data-required="true"
            >
              {t("Formål", "Purpose", "Zweck")}
            </label>
            <div className={styles.selectWrap}>
              <select
                id="cf-purpose"
                className={styles.select}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as Purpose)}
                required
              >
                <option value="booking">
                  {t("Booking forespørgsel", "Booking request", "Buchungsanfrage")}
                </option>
                <option value="other">{t("Andet", "Other", "Sonstiges")}</option>
              </select>
              <span className={styles.chev} aria-hidden>
                ▾
              </span>
            </div>
          </div>

          {/* Samlet prisboks – 3 felter (Pris, Rengøring, Total) */}
          <div
            className={styles.totalsBox}
            role="group"
            aria-label="Price summary"
          >
            <div className={styles.totalItem}>
              <span className={styles.tLabel}>
                <span className={styles.tTop}>{t("Pris", "Price", "Preis")}</span>
                <span className={styles.tSub}>
                  {t("(overnatninger)", "(nights)", "(Übernachtungen)")}
                </span>
              </span>
              <output className={styles.tValue} aria-live="polite">
                {selPrice.total != null ? fmtMoney.format(selPrice.total) : "—"}
              </output>
            </div>

            <div className={styles.totalItem}>
              <span className={styles.tLabel}>
                <span className={styles.tTop}>
                  {t("Rengøring", "Cleaning", "Reinigung")}
                </span>
                <span className={styles.tSub}>
                  {t("(obligatorisk)", "(mandatory)", "(obligatorisch)")}
                </span>
              </span>
              <output className={styles.tValue} aria-live="polite">
                {includeCleaning ? fmtMoney.format(cleaningFeeDKK) : "—"}
              </output>
            </div>

            <div className={`${styles.totalItem} ${styles.em}`}>
              <span className={styles.tLabel}>
                <span className={styles.tTop}>
                  {t("Estimeret", "Estimated", "Geschätzt")}
                </span>
                <span className={styles.tSub}>{t("total", "total", "gesamt")}</span>
              </span>
              <output className={styles.tValue} aria-live="polite">
                {includeCleaning || selPrice.total != null
                  ? fmtMoney.format(grandTotal)
                  : "—"}
              </output>
            </div>

            <div className={`${styles.totalItem} ${styles.em}`}>
              <span className={styles.tLabel}>
                <span className={styles.tWarning}>
                  {t(
                    "Overstående priser er eksklusive forbrug (EL, vand og evt. ekstra services)",
                    "The above prices exclude consumption (electricity, water, and any additional services)",
                    "Die oben genannten Preise verstehen sich ohne Verbrauch (Strom, Wasser und ggf. Zusatzleistungen)"
                  )}
                </span>
                <span className={styles.tWarning}>
                  {t(
                    "EL, vand og evt. ekstra services afregnes særskilt efter opholdet",
                    "Electricity, water, and any additional services will be settled separately after the stay",
                    "Strom, Wasser und ggf. Zusatzleistungen werden nach dem Aufenthalt separat abgerechnet"
                  )}
                </span>
              </span>
            </div>
          </div>

          {/* Formål med opholdet (påkrævet, kun booking) */}
          <div className={styles.row}>
            <label
              className={styles.label}
              htmlFor="cf-staypurpose"
              data-required="true"
            >
              {t(
                "Hvad er grunden til opholdet?",
                "What is the purpose of your stay?",
                "Was ist der Zweck Ihres Aufenthalts?"
              )}
            </label>
            <textarea
              id="cf-staypurpose"
              className={styles.textarea}
              required
              rows={3}
              value={state.stayPurpose}
              onChange={(e) => onChange("stayPurpose", e.target.value)}
              placeholder={t("Kort beskrivelse…", "Brief description…", "Kurze Beschreibung…")}
            />
          </div>
        </>
      )}

      {/* Gæsteantal — responsivt (KUN i booking) */}
      {isBooking && (
        <div className={`${styles.rowGroup} ${styles.cols3}`}>
          <div className={styles.row}>
            <label
              className={styles.label}
              htmlFor="cf-adults"
              data-required="true"
            >
              {t("Voksne", "Adults", "Erwachsene")}
            </label>
            <input
              id="cf-adults"
              className={styles.input}
              type="number"
              min={0}
              max={adultsMax}
              step={1}
              value={state.adults === "" ? "" : String(state.adults)}
              onChange={onAdultsChange}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label} htmlFor="cf-children">
              {t("Børn", "Children", "Kinder")}
            </label>
            <input
              id="cf-children"
              className={styles.input}
              type="number"
              min={0}
              max={childrenMax}
              step={1}
              value={state.children === "" ? "" : String(state.children)}
              onChange={onChildrenChange}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label} htmlFor="cf-babies">
              {t("Babyer", "Babies", "Babys")}
            </label>
            <input
              id="cf-babies"
              className={styles.input}
              type="number"
              min={0}
              max={babiesMax}
              step={1}
              value={state.babies === "" ? "" : String(state.babies)}
              onChange={onBabiesChange}
            />
          </div>
        </div>
      )}

      {/* ——— Kontaktfelter (begge varianter) ——— */}
      <div className={styles.row}>
        <label className={styles.label} htmlFor="cf-name" data-required="true">
          {t("Navn", "Name", "Name")}
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
          placeholder={t("Dit navn", "Your name", "Ihr Name")}
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
          placeholder={t("din@adresse.dk", "your@email.com", "ihre@email.de")}
        />
      </div>

      <div className={styles.rowGroup}>
        <div className={styles.row}>
          <label
            className={styles.label}
            htmlFor="cf-country"
            data-required="true"
          >
            {t("Land", "Country", "Land")}
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
            {t("Telefon", "Phone", "Telefon")}
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
              placeholder={t("Telefonnummer", "Phone number", "Telefonnummer")}
            />
          </div>
        </div>
      </div>

      {/* Besked-felt KUN i kontakt-varianten (påkrævet) */}
      {!isBooking && (
        <div className={styles.row}>
          <label className={styles.label} htmlFor="cf-msg" data-required="true">
            {t("Besked", "Message", "Nachricht")}
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
              "Tell us briefly what you need help with…",
              "Beschreiben Sie kurz, wobei wir helfen können…"
            )}
          />
        </div>
      )}

      {/* Gebyr-liste accept (obligatorisk — KUN i booking-variant) */}
      {isBooking && (
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
                  <a
                    href={pathOf(lang, "fees")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    gebyroversigten
                  </a>
                  .
                </>
              ) : lang === "de" ? (
                <>
                  Ich habe die{" "}
                  <a
                    href={pathOf(lang, "fees")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Gebührenübersicht
                  </a>{" "}
                  gelesen und akzeptiere sie.
                </>
              ) : (
                <>
                  I have read and accept the{" "}
                  <a
                    href={pathOf(lang, "fees")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    fee list
                  </a>
                  .
                </>
              )}
            </span>
          </label>
        </div>
      )}

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
              "Jeg giver samtykke til, at mine oplysninger må gemmes og bruges til at behandle min henvendelse i overensstemmelse med privatlivspolitikken ",
              "I consent to my information being stored and used to process my inquiry in accordance with the privacy policy ",
              "Ich willige ein, dass meine Daten gespeichert und zur Bearbeitung meiner Anfrage gemäß der Datenschutzerklärung verwendet werden "
            )}
          </span>
          <a href={pathOf(lang, "privacy")} target="_blank" rel="noreferrer">
            {t("privatlivspolitikken.", "privacy policy.", "Datenschutzerklärung.")}
          </a>
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
            isBooking
              ? sending
                ? i18nT("form.submit.sendingBooking")
                : i18nT("form.submit.booking")
              : sending
              ? i18nT("form.submit.sendingMessage")
              : i18nT("form.submit.message")
          }
          ariaLabel={i18nT("form.submit.aria")}
          fullWidth
        />
      </div>
    </form>
  );
}
