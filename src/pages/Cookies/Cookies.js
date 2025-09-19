import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Container, Heading, Text, Separator, Flex } from "@radix-ui/themes";
import styles from "./Cookies.module.css";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import { readConsent, updateConsent, defaultConsent, } from "../../components/Cookies/consent";
export default function Cookies({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const seoTitle = t("Cookies hos Fyrrehaven 61", "Cookies at Fyrrehaven 61");
    const seoDesc = t("Læs om vores brug af cookies og administrer dine valg.", "Read about our use of cookies and manage your choices.");
    const existing = readConsent(lang) ?? defaultConsent(lang);
    const [prefs, setPrefs] = useState(existing.categories);
    const [saved, setSaved] = useState(false);
    const save = () => {
        updateConsent(prefs, lang);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
    };
    const acceptAll = () => {
        const next = {
            necessary: true,
            analytics: true,
            marketing: true,
        };
        setPrefs(next);
        updateConsent({ analytics: true, marketing: true }, lang);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
    };
    const rejectAll = () => {
        const next = {
            necessary: true,
            analytics: false,
            marketing: false,
        };
        setPrefs(next);
        updateConsent({ analytics: false, marketing: false }, lang);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
    };
    return (_jsxs(_Fragment, { children: [_jsx(Head, { lang: lang, path: pathOf(lang, "cookies"), title: seoTitle, description: seoDesc }), _jsxs(Container, { size: "3", px: "4", py: "6", children: [_jsxs("header", { className: styles.header, children: [_jsx(Heading, { as: "h1", size: "8", children: seoTitle }), _jsx(Text, { color: "gray", size: "3", children: t("Vi bruger nødvendige cookies for at få siden til at fungere, samt valgfrie cookies til statistik og marketing.", "We use necessary cookies to make the site work, and optional cookies for analytics and marketing.") })] }), _jsx(Separator, { my: "5", size: "4" }), _jsxs("section", { className: styles.section, "aria-labelledby": "choices", children: [_jsx(Heading, { as: "h2", size: "5", id: "choices", mb: "3", children: t("Dine valg", "Your choices") }), _jsxs("div", { role: "group", "aria-label": t("Cookie-indstillinger", "Cookie preferences"), className: styles.group, children: [_jsxs("label", { className: styles.row, children: [_jsx("input", { type: "checkbox", checked: true, readOnly: true, "aria-disabled": true }), _jsxs("span", { className: styles.label, children: [_jsx("strong", { children: t("Nødvendige", "Necessary") }), _jsx("small", { children: t("Påkrævet for at siden fungerer.", "Required for the site to function.") })] })] }), _jsxs("label", { className: styles.row, children: [_jsx("input", { type: "checkbox", checked: prefs.analytics, onChange: (e) => setPrefs({ ...prefs, analytics: e.currentTarget.checked }) }), _jsxs("span", { className: styles.label, children: [_jsx("strong", { children: t("Statistik", "Analytics") }), _jsx("small", { children: t("Hjælper os med at forstå brugen af siden.", "Helps us understand site usage.") })] })] }), _jsxs("label", { className: styles.row, children: [_jsx("input", { type: "checkbox", checked: prefs.marketing, onChange: (e) => setPrefs({ ...prefs, marketing: e.currentTarget.checked }) }), _jsxs("span", { className: styles.label, children: [_jsx("strong", { children: t("Marketing", "Marketing") }), _jsx("small", { children: t("Bruges til personaliseret indhold/annoncer.", "Used for personalised content/ads.") })] })] })] }), _jsxs(Flex, { gap: "3", wrap: "wrap", children: [_jsx("button", { className: styles.btnGhost, onClick: rejectAll, children: t("Afvis alle", "Reject all") }), _jsx("button", { className: styles.btnSoft, onClick: acceptAll, children: t("Accepter alle", "Accept all") }), _jsx("button", { className: styles.btnPrimary, onClick: save, children: t("Gem valg", "Save choices") }), saved && (_jsx("span", { className: styles.saved, role: "status", "aria-live": "polite", children: t("Gemt", "Saved") }))] })] }), _jsx(Separator, { my: "5", size: "4" }), _jsxs("section", { className: styles.section, "aria-labelledby": "details", children: [_jsx(Heading, { as: "h2", size: "5", id: "details", mb: "2", children: t("Detaljer om cookies", "Cookie details") }), _jsx(Text, { as: "p", color: "gray", children: t("Vi bruger kun nødvendige cookies som standard. Statistik og marketing aktiveres kun, hvis du accepterer dem.", "We only set necessary cookies by default. Analytics and marketing are enabled only if you accept them.") }), _jsxs("ul", { className: styles.table, children: [_jsxs("li", { children: [_jsx("span", { className: styles.cellHead, children: t("Kategori", "Category") }), _jsx("span", { className: styles.cellHead, children: t("Formål", "Purpose") }), _jsx("span", { className: styles.cellHead, children: t("Levetid", "Lifetime") })] }), _jsxs("li", { children: [_jsx("span", { children: t("Nødvendige", "Necessary") }), _jsx("span", { children: t("Grundlæggende funktioner (sprog, samtykke, sikkerhed).", "Core features (language, consent, security).") }), _jsx("span", { children: t("Op til 6 måneder", "Up to 6 months") })] }), _jsxs("li", { children: [_jsx("span", { children: t("Statistik", "Analytics") }), _jsx("span", { children: t("Måling af brug, så vi kan forbedre siden.", "Usage measurement to improve the site.") }), _jsx("span", { children: t("Varierer", "Varies") })] }), _jsxs("li", { children: [_jsx("span", { children: t("Marketing", "Marketing") }), _jsx("span", { children: t("Relevante anbefalinger/annoncer.", "Relevant recommendations/ads.") }), _jsx("span", { children: t("Varierer", "Varies") })] })] })] })] })] }));
}
