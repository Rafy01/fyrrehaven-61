import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Container, Heading, Text, Separator, Flex, } from "@radix-ui/themes";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import { readConsent, updateConsent, defaultConsent, } from "../../components/Cookies/consent";
export default function CookiesPage({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const seoTitle = t("Cookies hos Fyrrehaven 61", "Cookies at Fyrrehaven 61");
    const seoDesc = t("Læs om vores brug af cookies og administrer dine valg.", "Read about our use of cookies and manage your choices.");
    const existing = readConsent(lang) ?? defaultConsent(lang);
    const [prefs, setPrefs] = useState(existing.categories);
    const save = () => updateConsent(prefs, lang);
    return (_jsxs(_Fragment, { children: [_jsx(Head, { lang: lang, path: pathOf(lang, "cookies"), title: seoTitle, description: seoDesc }), _jsxs(Container, { size: "3", px: "4", py: "6", children: [_jsx(Heading, { as: "h1", size: "8", children: seoTitle }), _jsx(Text, { as: "p", color: "gray", size: "3", mt: "2", children: t("Vi bruger nødvendige cookies for at få siden til at fungere, og valgfrie cookies til statistik og marketing.", "We use necessary cookies to make the site work, and optional cookies for analytics and marketing.") }), _jsx(Separator, { my: "5", size: "4" }), _jsx(Heading, { as: "h2", size: "5", mb: "3", children: t("Dine valg", "Your choices") }), _jsxs("div", { role: "group", "aria-label": t("Cookie-indstillinger", "Cookie preferences"), children: [_jsxs("label", { style: {
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                    marginBottom: 12,
                                }, children: [_jsx("input", { type: "checkbox", checked: true, readOnly: true, "aria-disabled": true }), _jsxs("span", { children: [_jsx("strong", { children: t("Nødvendige", "Necessary") }), _jsx("br", {}), _jsx(Text, { color: "gray", children: t("Påkrævet for at siden fungerer.", "Required for the site to function.") })] })] }), _jsxs("label", { style: {
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                    marginBottom: 12,
                                }, children: [_jsx("input", { type: "checkbox", checked: prefs.analytics, onChange: (e) => setPrefs({ ...prefs, analytics: e.currentTarget.checked }) }), _jsxs("span", { children: [_jsx("strong", { children: t("Statistik", "Analytics") }), _jsx("br", {}), _jsx(Text, { color: "gray", children: t("Hjælper os med at forstå brugen af siden.", "Helps us understand site usage.") })] })] }), _jsxs("label", { style: {
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                    marginBottom: 20,
                                }, children: [_jsx("input", { type: "checkbox", checked: prefs.marketing, onChange: (e) => setPrefs({ ...prefs, marketing: e.currentTarget.checked }) }), _jsxs("span", { children: [_jsx("strong", { children: t("Marketing", "Marketing") }), _jsx("br", {}), _jsx(Text, { color: "gray", children: t("Bruges til personaliseret indhold/annoncer.", "Used for personalised content/ads.") })] })] }), _jsxs(Flex, { gap: "3", children: [_jsx("button", { onClick: () => {
                                            setPrefs({ ...prefs, analytics: false, marketing: false });
                                            save();
                                        }, children: t("Afvis alle", "Reject all") }), _jsx("button", { onClick: () => {
                                            setPrefs({ ...prefs, analytics: true, marketing: true });
                                            save();
                                        }, children: t("Accepter alle", "Accept all") }), _jsx("button", { onClick: save, style: {
                                            background: "var(--gold-500)",
                                            color: "var(--ink-900)",
                                            borderRadius: "var(--radius)",
                                            padding: ".5rem .8rem",
                                            fontWeight: 700,
                                        }, children: t("Gem valg", "Save choices") })] })] }), _jsx(Separator, { my: "5", size: "4" }), _jsx(Heading, { as: "h2", size: "5", mb: "2", children: t("Detaljer", "Details") }), _jsx(Text, { as: "p", color: "gray", children: t("Nødvendige cookies bruges til ting som sikkerhed, sprogvalg og grundlæggende funktionalitet. Statistik hjælper os med at forbedre siden. Marketing kan bruges til at vise relevante tilbud.", "Necessary cookies are for security, language, and core functionality. Analytics help us improve the site. Marketing may be used to show relevant offers.") })] })] }));
}
