import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/ContactForm/ContactForm.tsx
import React from "react";
import Buttons from "../Buttons";
import styles from "./ContactForm.module.css";
import { useTranslation } from "react-i18next";
import { allCountries, findCountry, countryLabel, defaultCountryFromNavigator, } from "../../lib/countryCodes";
import AvailabilityCalendar from "../AvailabilityCalendar/AvailabilityCalendar";
import { pathOf } from "../../lib/routes";
const CLEANING_FEE_DKK = 1200;
const MAX_GUESTS = 10;
const DIGITS_RE = /[^\d]/g;
/** Resolve current UI language. */
function useUiLang(explicit) {
    const { i18n } = useTranslation();
    const i18nLang = i18n?.language && i18n.language.toLowerCase().startsWith("da")
        ? "da"
        : "en";
    return explicit ?? i18nLang ?? "da";
}
// Hjælpere til tal↔state
const toInt = (v) => (typeof v === "number" ? v : 0);
function clampInt(n, min, max) {
    if (!Number.isFinite(n))
        n = min;
    return Math.min(Math.max(n, min), max);
}
export default function ContactForm({ lang: langProp, submitUrl = "/api/contact", variant = "contact", }) {
    const ui = useUiLang(langProp);
    const lang = ui;
    const t = (da, en) => (lang === "da" ? da : en);
    const uiLang = lang;
    const isBooking = variant === "booking";
    // init land/telefon fra localStorage
    const initialIso = (() => {
        const saved = (typeof localStorage !== "undefined"
            ? localStorage.getItem("cf_country")
            : null) || defaultCountryFromNavigator();
        return saved;
    })();
    const [state, setState] = React.useState({
        name: "",
        email: "",
        phone: typeof localStorage !== "undefined"
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
    const [purpose, setPurpose] = React.useState(isBooking ? "booking" : "inquiry");
    // Kalender-valg/pris (kun relevant i booking-varianten)
    const [, setSel] = React.useState(null);
    const [selPrice, setSelPrice] = React.useState({
        kind: "none",
    });
    const [sending, setSending] = React.useState(false);
    const [sent, setSent] = React.useState(false);
    const [error, setError] = React.useState(null);
    const selectedCountry = findCountry(state.countryIso);
    const dial = selectedCountry?.dial ?? "";
    const fullPhone = state.phone.trim() ? `${dial} ${state.phone.trim()}` : "";
    function onChange(key, val) {
        setState((s) => ({ ...s, [key]: val }));
        if (key === "countryIso" && typeof localStorage !== "undefined") {
            localStorage.setItem("cf_country", String(val));
        }
        if (key === "phone" && typeof localStorage !== "undefined") {
            localStorage.setItem("cf_phone", String(val));
        }
    }
    // Kun cifre i telefon
    function onPhoneKeyDown(e) {
        const allowed = [
            "Backspace",
            "Delete",
            "Tab",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
        ];
        if (allowed.includes(e.key))
            return;
        if (!/^\d$/.test(e.key))
            e.preventDefault();
    }
    function onPhoneChange(e) {
        const digits = e.target.value.replace(DIGITS_RE, "");
        onChange("phone", digits);
    }
    const fmtDate = React.useMemo(() => new Intl.DateTimeFormat(lang === "da" ? "da-DK" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }), [lang]);
    // Lang dato til fejlbeskeder (fx "14. oktober 2025")
    const fmtDateLong = React.useMemo(() => new Intl.DateTimeFormat(lang === "da" ? "da-DK" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }), [lang]);
    const fmtMoney = React.useMemo(() => new Intl.NumberFormat(lang === "da" ? "da-DK" : "en-GB", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
    }), [lang]);
    /* ─────────────── BASE & TOTALS ─────────────── */
    const baseNightsTotal = selPrice.total ?? 0;
    const includeCleaning = !!(selPrice.nights && selPrice.nights > 0);
    const totalWithCleaning = includeCleaning
        ? baseNightsTotal + CLEANING_FEE_DKK
        : baseNightsTotal;
    /* ─────────────── GUEST CAP (max 10 personer) ─────────────── */
    const nAdults = toInt(state.adults);
    const nChildren = toInt(state.children);
    const nBabies = toInt(state.babies);
    // const totalGuests = nAdults + nChildren + nBabies;
    const adultsMax = Math.max(1, MAX_GUESTS - nChildren - nBabies);
    const childrenMax = Math.max(0, MAX_GUESTS - nAdults - nBabies);
    const babiesMax = Math.max(0, MAX_GUESTS - nAdults - nChildren);
    function onAdultsChange(e) {
        const val = e.target.value;
        if (val === "")
            return onChange("adults", "");
        const next = clampInt(Number(val), 0, adultsMax);
        onChange("adults", next);
    }
    function onChildrenChange(e) {
        const val = e.target.value;
        if (val === "")
            return onChange("children", "");
        const next = clampInt(Number(val), 0, childrenMax);
        onChange("children", next);
    }
    function onBabiesChange(e) {
        const val = e.target.value;
        if (val === "")
            return onChange("babies", "");
        const next = clampInt(Number(val), 0, babiesMax);
        onChange("babies", next);
    }
    // Total uden extras
    const grandTotal = includeCleaning ? totalWithCleaning : baseNightsTotal;
    // === Min.-nætter: afledte værdier til UI og submit-validering ===
    const minReq = selPrice.minNightsRequired ?? 2;
    // Submit
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        const missingMsg = isBooking
            ? t("Udfyld venligst navn og e-mail.", "Please fill in your name and email.")
            : t("Udfyld venligst navn, e-mail og besked.", "Please fill in your name, email and message.");
        if (!state.name.trim() ||
            !state.email.trim() ||
            (!isBooking && !state.message.trim())) {
            setError(missingMsg);
            return;
        }
        if (!state.consent) {
            setError(t("Sæt venligst flueben for samtykke til behandling af dine oplysninger.", "Please check the consent box to allow us to process your information."));
            return;
        }
        // Booking-variant: ekstra krav
        if (isBooking) {
            const A = toInt(state.adults);
            const C = toInt(state.children);
            const B = toInt(state.babies);
            const totalGuests = A + C + B;
            if (A < 1) {
                setError(t("Angiv venligst antal voksne (mindst 1).", "Please enter number of adults (at least 1)."));
                return;
            }
            if (totalGuests > MAX_GUESTS) {
                setError(t("Det samlede antal gæster må højst være 10.", "The total number of guests must not exceed 10."));
                return;
            }
            // Datoer valgt?
            const startISO = selPrice.start?.toISOString().slice(0, 10) ?? "";
            const endISO = selPrice.endExclusive?.toISOString().slice(0, 10) ?? "";
            if (!startISO || !endISO || !selPrice.nights || selPrice.nights <= 0) {
                setError(t("Vælg venligst en periode i kalenderen (ankomst og afrejse).", "Please select a period in the calendar (check-in and check-out)."));
                return;
            }
            // Min.-nætter opfyldt?
            if (selPrice.isMinNightsSatisfied === false) {
                // Brug kalenderens egen tekst hvis sat – ellers generér vores
                const msg = selPrice.validationError ??
                    (lang === "da"
                        ? `Minimum ${minReq} ${minReq === 1 ? "nat" : "nætter"} ved ankomst ${fmtDateLong.format(selPrice.start)}. Vælg venligst en længere periode.`
                        : `Minimum ${minReq} night${minReq === 1 ? "" : "s"} required for arrival ${fmtDateLong.format(selPrice.start)}. Please choose a longer stay.`);
                setError(msg);
                return;
            }
            if (!state.feesAccepted) {
                setError(t("Bekræft venligst at du har læst og accepterer gebyroversigten.", "Please confirm that you have read and accept the fee list."));
                return;
            }
            if (!state.stayPurpose.trim()) {
                setError(t("Fortæl os venligst kort, hvad opholdet skal bruges til.", "Please briefly tell us the purpose of your stay."));
                return;
            }
        }
        setSending(true);
        try {
            const selectionPayload = isBooking
                ? {
                    start: selPrice.start?.toISOString().slice(0, 10) ?? null,
                    endExclusive: selPrice.endExclusive?.toISOString().slice(0, 10) ?? null,
                    nights: selPrice.nights ?? null,
                    baseNightsTotalDKK: selPrice.total ?? null,
                    cleaningFeeDKK: includeCleaning ? CLEANING_FEE_DKK : 0,
                    totalWithCleaningDKK: includeCleaning
                        ? (selPrice.total ?? 0) + CLEANING_FEE_DKK
                        : selPrice.total ?? null,
                    // min.-nætter metadata til server-side validering/logning
                    minNightsRequired: selPrice.minNightsRequired ?? 2,
                    isMinNightsSatisfied: selPrice.isMinNightsSatisfied ?? selPrice.nights != null,
                    validationError: selPrice.validationError ?? null,
                    breakdown: selPrice.breakdown?.map((b) => ({
                        date: b.date.toISOString().slice(0, 10),
                        price: b.price,
                    })) ?? [],
                }
                : null;
            const purposeForApi = isBooking
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
                            total: toInt(state.adults) +
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
        }
        catch (err) {
            console.error("ContactForm submit failed:", err);
            setError(t("Kunne ikke sende beskeden. Prøv igen om lidt.", "Couldn't send your message. Please try again shortly."));
        }
        finally {
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
        const nightsStr = typeof selPrice.nights === "number"
            ? String(selPrice.nights)
            : t("—", "—");
        const nightsPriceStr = selPrice.total != null ? fmtMoney.format(selPrice.total) : t("—", "—");
        const cleaningStr = includeCleaning
            ? fmtMoney.format(CLEANING_FEE_DKK)
            : t("—", "—");
        const totalStr = includeCleaning || selPrice.total != null
            ? fmtMoney.format(grandTotal)
            : t("—", "—");
        return (_jsxs("div", { className: `${styles.card} ${styles.success}`, role: "status", "aria-live": "polite", children: [_jsx("h3", { className: styles.sTitle, children: isBooking
                        ? t("Tak for din bookingforespørgsel!", "Thanks for your booking request!")
                        : t("Tak for din henvendelse!", "Thanks for your message!") }), _jsx("p", { className: styles.sLead, children: isBooking
                        ? t("Vi vender tilbage hurtigst muligt. Her er en oversigt over din forespørgsel:", "We’ll get back to you shortly. Here’s a summary of your request:")
                        : t("Vi vender tilbage hurtigst muligt. Her er en kopi af det, du sendte:", "We'll get back to you as soon as possible. Here's a copy of what you sent:") }), isBooking && (_jsxs("dl", { className: styles.echo, children: [_jsxs("div", { children: [_jsx("dt", { children: t("Ankomst", "Check-in") }), _jsx("dd", { children: startStr })] }), _jsxs("div", { children: [_jsx("dt", { children: t("Afrejse", "Check-out") }), _jsx("dd", { children: endStr })] }), _jsxs("div", { children: [_jsx("dt", { children: t("Nætter", "Nights") }), _jsx("dd", { children: nightsStr })] }), _jsxs("div", { children: [_jsx("dt", { children: t("Pris (overnatninger)", "Price (nights)") }), _jsx("dd", { children: nightsPriceStr })] }), _jsxs("div", { children: [_jsx("dt", { children: t("Rengøring (obligatorisk)", "Cleaning (mandatory)") }), _jsx("dd", { children: cleaningStr })] }), _jsxs("div", { children: [_jsx("dt", { children: t("Estimeret total", "Estimated total") }), _jsx("dd", { children: totalStr })] }), _jsxs("div", { children: [_jsx("dt", { children: t("Gæster", "Guests") }), _jsx("dd", { children: `${toInt(state.adults)} ${t("voksne", "adults")}, ${toInt(state.children)} ${t("børn", "children")}, ${toInt(state.babies)} ${t("babyer", "babies")}` })] })] })), _jsxs("dl", { className: styles.echo, children: [_jsxs("div", { children: [_jsx("dt", { children: t("Navn", "Name") }), _jsx("dd", { children: state.name || t("—", "—") })] }), _jsxs("div", { children: [_jsx("dt", { children: "E-mail" }), _jsx("dd", { children: state.email || t("—", "—") })] }), fullPhone && (_jsxs("div", { children: [_jsx("dt", { children: t("Telefon", "Phone") }), _jsx("dd", { children: fullPhone })] })), _jsxs("div", { children: [_jsx("dt", { children: t("Land", "Country") }), _jsx("dd", { children: countryLabel(state.countryIso, uiLang) })] }), !isBooking && state.message.trim() && (_jsxs("div", { children: [_jsx("dt", { children: t("Besked", "Message") }), _jsx("dd", { children: state.message })] }))] }), _jsx(Buttons, { to: "/", variant: "secondary", label: t("Til forsiden", "Back to home"), buttonType: "button" })] }));
    }
    return (_jsxs("form", { className: `${styles.card} ${styles.form}`, onSubmit: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onSubmit(e);
        }, onKeyDown: (e) => {
            if (e.key === "Enter") {
                const tag = e.target.tagName;
                // Allow enter i <textarea>, men ikke i andre felter
                if (tag !== "TEXTAREA")
                    e.preventDefault();
            }
        }, noValidate: true, children: [isBooking && (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.row, children: _jsx("div", { className: styles.calendarWrap, children: _jsx(AvailabilityCalendar, { lang: lang, weekStartsOn: 1, selectionMode: "range", disablePastSelection: true, onSelectionChange: (s) => setSel(s), onSelectionPrice: (p) => setSelPrice(p) }) }) }), _jsxs("div", { className: styles.rowGroup, children: [_jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-checkin", "data-required": "true", children: t("Ankomst", "Check-in") }), _jsx("input", { id: "cf-checkin", className: styles.input, type: "text", readOnly: true, required: true, value: selPrice.start ? fmtDate.format(selPrice.start) : "", placeholder: t("Vælg i kalenderen", "Pick in the calendar") })] }), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-checkout", "data-required": "true", children: t("Afrejse", "Check-out") }), _jsx("input", { id: "cf-checkout", className: styles.input, type: "text", readOnly: true, required: true, value: selPrice.endExclusive
                                            ? fmtDate.format(selPrice.endExclusive)
                                            : "", placeholder: t("Vælg i kalenderen", "Pick in the calendar") })] }), _jsxs("div", { className: styles.inlineMeta, "aria-live": "polite", children: [_jsx("span", { className: styles.metaLabel, children: t("Nætter:", "Nights:") }), _jsx("output", { className: styles.metaValue, children: selPrice.nights ?? t("—", "N/A") })] })] }), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-purpose", "data-required": "true", children: t("Formål", "Purpose") }), _jsxs("div", { className: styles.selectWrap, children: [_jsxs("select", { id: "cf-purpose", className: styles.select, value: purpose, onChange: (e) => setPurpose(e.target.value), required: true, children: [_jsx("option", { value: "booking", children: t("Booking forespørgsel", "Booking request") }), _jsx("option", { value: "other", children: t("Andet", "Other") })] }), _jsx("span", { className: styles.chev, "aria-hidden": true, children: "\u25BE" })] })] }), _jsxs("div", { className: styles.totalsBox, role: "group", "aria-label": "Price summary", children: [_jsxs("div", { className: styles.totalItem, children: [_jsxs("span", { className: styles.tLabel, children: [_jsx("span", { className: styles.tTop, children: t("Pris", "Price") }), _jsx("span", { className: styles.tSub, children: t("(overnatninger)", "(nights)") })] }), _jsx("output", { className: styles.tValue, "aria-live": "polite", children: selPrice.total != null ? fmtMoney.format(selPrice.total) : "—" })] }), _jsxs("div", { className: styles.totalItem, children: [_jsxs("span", { className: styles.tLabel, children: [_jsx("span", { className: styles.tTop, children: t("Rengøring", "Cleaning") }), _jsx("span", { className: styles.tSub, children: t("(obligatorisk)", "(mandatory)") })] }), _jsx("output", { className: styles.tValue, "aria-live": "polite", children: includeCleaning ? fmtMoney.format(CLEANING_FEE_DKK) : "—" })] }), _jsxs("div", { className: `${styles.totalItem} ${styles.em}`, children: [_jsxs("span", { className: styles.tLabel, children: [_jsx("span", { className: styles.tTop, children: t("Estimeret", "Estimated") }), _jsx("span", { className: styles.tSub, children: t("total", "total") })] }), _jsx("output", { className: styles.tValue, "aria-live": "polite", children: includeCleaning || selPrice.total != null
                                            ? fmtMoney.format(grandTotal)
                                            : "—" })] })] }), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-staypurpose", "data-required": "true", children: t("Hvad er grunden til opholdet?", "What is the purpose of your stay?") }), _jsx("textarea", { id: "cf-staypurpose", className: styles.textarea, required: true, rows: 3, value: state.stayPurpose, onChange: (e) => onChange("stayPurpose", e.target.value), placeholder: t("Kort beskrivelse…", "Brief description…") })] })] })), isBooking && (_jsxs("div", { className: `${styles.rowGroup} ${styles.cols3}`, children: [_jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-adults", "data-required": "true", children: t("Voksne", "Adults") }), _jsx("input", { id: "cf-adults", className: styles.input, type: "number", min: 0, max: adultsMax, step: 1, value: state.adults === "" ? "" : String(state.adults), onChange: onAdultsChange })] }), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-children", children: t("Børn", "Children") }), _jsx("input", { id: "cf-children", className: styles.input, type: "number", min: 0, max: childrenMax, step: 1, value: state.children === "" ? "" : String(state.children), onChange: onChildrenChange })] }), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-babies", children: t("Babyer", "Babies") }), _jsx("input", { id: "cf-babies", className: styles.input, type: "number", min: 0, max: babiesMax, step: 1, value: state.babies === "" ? "" : String(state.babies), onChange: onBabiesChange })] })] })), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-name", "data-required": "true", children: t("Navn", "Name") }), _jsx("input", { id: "cf-name", className: styles.input, type: "text", name: "name", required: true, autoComplete: "name", value: state.name, onChange: (e) => onChange("name", e.target.value), placeholder: t("Dit navn", "Your name") })] }), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-email", "data-required": "true", children: "E-mail" }), _jsx("input", { id: "cf-email", className: styles.input, type: "email", name: "email", required: true, autoComplete: "email", value: state.email, onChange: (e) => onChange("email", e.target.value), placeholder: t("din@adresse.dk", "your@email.com") })] }), _jsxs("div", { className: styles.rowGroup, children: [_jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-country", "data-required": "true", children: t("Land", "Country") }), _jsxs("div", { className: styles.selectWrap, children: [_jsx("select", { id: "cf-country", className: styles.select, value: state.countryIso, onChange: (e) => onChange("countryIso", e.target.value), required: true, children: allCountries().map((c) => (_jsxs("option", { value: c.iso, children: [countryLabel(c.iso, uiLang), " ", c.dial ? `(${c.dial})` : ""] }, c.iso))) }), _jsx("span", { className: styles.chev, "aria-hidden": true, children: "\u25BE" })] })] }), _jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-phone", children: t("Telefon", "Phone") }), _jsxs("div", { className: styles.phone, children: [_jsx("span", { className: styles.dial, "aria-hidden": "true", children: dial }), _jsx("input", { id: "cf-phone", className: styles.inputphone, type: "tel", name: "phone", inputMode: "numeric", pattern: "[0-9]*", autoComplete: "tel-national", value: state.phone, onKeyDown: onPhoneKeyDown, onChange: onPhoneChange, placeholder: t("Telefonnummer", "Phone number") })] })] })] }), !isBooking && (_jsxs("div", { className: styles.row, children: [_jsx("label", { className: styles.label, htmlFor: "cf-msg", "data-required": "true", children: t("Besked", "Message") }), _jsx("textarea", { id: "cf-msg", className: styles.textarea, name: "message", required: true, rows: 6, value: state.message, onChange: (e) => onChange("message", e.target.value), placeholder: t("Skriv kort, hvad du ønsker hjælp til…", "Tell us briefly what you need help with…") })] })), isBooking && (_jsx("div", { className: styles.row, children: _jsxs("label", { className: styles.checkbox, children: [_jsx("input", { type: "checkbox", checked: state.feesAccepted, onChange: (e) => onChange("feesAccepted", e.target.checked), required: true }), _jsx("span", { children: lang === "da" ? (_jsxs(_Fragment, { children: ["Jeg har l\u00E6st og accepterer", " ", _jsx("a", { href: pathOf(lang, "fees"), target: "_blank", rel: "noreferrer", children: "gebyroversigten" }), "."] })) : (_jsxs(_Fragment, { children: ["I have read and accept the", " ", _jsx("a", { href: pathOf(lang, "fees"), target: "_blank", rel: "noreferrer", children: "fee list" }), "."] })) })] }) })), _jsx("div", { className: styles.row, children: _jsxs("label", { className: styles.checkbox, children: [_jsx("input", { type: "checkbox", checked: state.consent, onChange: (e) => onChange("consent", e.target.checked), required: true }), _jsx("span", { children: t("Jeg giver samtykke til, at mine oplysninger må gemmes og bruges til at behandle min henvendelse i overensstemmelse med privatlivspolitikken ", "I consent to my information being stored and used to process my inquiry in accordance with the privacy policy ") }), _jsx("a", { href: pathOf(lang, "privacy"), target: "_blank", rel: "noreferrer", children: t("privatlivspolitikken.", "privacy policy.") })] }) }), error && (_jsx("div", { className: styles.error, role: "alert", "aria-live": "assertive", children: error })), _jsx("div", { className: styles.actions, children: _jsx(Buttons, { buttonType: "submit", loading: sending, variant: "primary", label: isBooking
                        ? t("Send booking", "Send booking")
                        : t("Send besked", "Send message"), ariaLabel: t("Send formularen", "Submit the form"), fullWidth: true }) })] }));
}
