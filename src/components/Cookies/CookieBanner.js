import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// components/Cookies/CookieBanner.tsx
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import styles from "./CookieBanner.module.css";
import { defaultConsent, updateConsent, readConsent, allowed, enableScriptsForConsent, // ← NY
 } from "./consent";
export default function CookieBanner({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const [visible, setVisible] = useState(false);
    const [openPrefs, setOpenPrefs] = useState(false);
    const [prefs, setPrefs] = useState(defaultConsent(lang).categories);
    useEffect(() => {
        const existing = readConsent(lang);
        if (!existing) {
            setVisible(true);
            setPrefs(defaultConsent(lang).categories);
        }
        else {
            setPrefs(existing.categories);
            setVisible(false);
            // aktiver deferred scripts hvis brugeren allerede har valgt tidligere
            enableScriptsForConsent(lang); // ← NY
        }
    }, [lang]);
    // Lyt på ændringer (fx fra andre UI'er) og enable scripts
    useEffect(() => {
        const onChange = () => {
            if (allowed("analytics", lang)) {
                // her kan du evt. kalde initAnalytics();
            }
            enableScriptsForConsent(lang); // ← NY
        };
        window.addEventListener("fh61:consentchange", onChange);
        return () => window.removeEventListener("fh61:consentchange", onChange);
    }, [lang]);
    const acceptAll = () => {
        updateConsent({ analytics: true, marketing: true }, lang);
        enableScriptsForConsent(lang); // ← NY
        setVisible(false);
    };
    const rejectAll = () => {
        updateConsent({ analytics: false, marketing: false }, lang);
        // (ingen scripts at aktivere)
        setVisible(false);
    };
    const savePrefs = () => {
        updateConsent(prefs, lang);
        enableScriptsForConsent(lang); // ← NY
        setVisible(false);
        setOpenPrefs(false);
    };
    if (!visible)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx(Box, { asChild: true, children: _jsxs("div", { className: styles.banner, role: "dialog", "aria-live": "polite", children: [_jsxs("div", { className: styles.copy, children: [_jsx(Text, { as: "p", size: "2", children: t("Vi bruger cookies til at få siden til at virke og til statistik. Du kan altid ændre dine valg.", "We use cookies to make the site work and for statistics. You can change your choices anytime.") }), _jsx("a", { className: styles.link, href: `/${lang}/cookies`, children: t("Læs mere", "Learn more") })] }), _jsxs(Flex, { gap: "2", wrap: "wrap", align: "center", className: styles.actions, children: [_jsx(Button, { size: "2", variant: "soft", color: "gray", onClick: () => setOpenPrefs(true), children: t("Indstillinger", "Preferences") }), _jsx(Button, { size: "2", variant: "soft", color: "gray", onClick: rejectAll, children: t("Afvis", "Reject") }), _jsx(Button, { size: "2", variant: "solid", color: "yellow", onClick: acceptAll, children: t("Accepter alle", "Accept all") })] })] }) }), _jsx(Dialog.Root, { open: openPrefs, onOpenChange: setOpenPrefs, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: styles.overlay }), _jsxs(Dialog.Content, { className: styles.modal, "aria-describedby": undefined, children: [_jsx(Dialog.Title, { className: styles.title, children: t("Cookie-indstillinger", "Cookie preferences") }), _jsxs("div", { className: styles.group, children: [_jsxs("label", { className: styles.row, children: [_jsx("input", { type: "checkbox", checked: true, readOnly: true, "aria-disabled": true }), _jsxs("span", { className: styles.label, children: [_jsx("strong", { children: t("Nødvendige", "Necessary") }), _jsx("small", { children: t("Påkrævet for at siden fungerer.", "Required for the site to function.") })] })] }), _jsxs("label", { className: styles.row, children: [_jsx("input", { type: "checkbox", checked: prefs.analytics, onChange: (e) => setPrefs({ ...prefs, analytics: e.currentTarget.checked }) }), _jsxs("span", { className: styles.label, children: [_jsx("strong", { children: t("Statistik", "Analytics") }), _jsx("small", { children: t("Hjælper os med at forstå brugen af siden.", "Helps us understand site usage.") })] })] }), _jsxs("label", { className: styles.row, children: [_jsx("input", { type: "checkbox", checked: prefs.marketing, onChange: (e) => setPrefs({ ...prefs, marketing: e.currentTarget.checked }) }), _jsxs("span", { className: styles.label, children: [_jsx("strong", { children: t("Marketing", "Marketing") }), _jsx("small", { children: t("Bruges til personaliseret indhold/annoncer.", "Used for personalised content/ads.") })] })] })] }), _jsxs(Flex, { gap: "2", justify: "end", children: [_jsx(Dialog.Close, { asChild: true, children: _jsx("button", { className: styles.btnGhost, children: t("Annullér", "Cancel") }) }), _jsx("button", { className: styles.btnSoft, onClick: rejectAll, children: t("Afvis alle", "Reject all") }), _jsx("button", { className: styles.btnPrimary, onClick: savePrefs, children: t("Gem valg", "Save choices") })] })] })] }) })] }));
}
