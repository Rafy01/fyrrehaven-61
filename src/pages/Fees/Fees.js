import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Container, Box, Heading, Text, Separator } from "@radix-ui/themes";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import styles from "./Fees.module.css";
import { fees } from "../../data/fees";
export default function Fees({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const path = pathOf(lang, "fees");
    const seoTitle = t("Gebyrer & praktiske vilkår – Fyrrehaven 61", "Fees & house rules – Fyrrehaven 61");
    const seoDescription = t("Se vores opdaterede gebyroversigt for Fyrrehaven 61: regler for booking, rengøring, sen check-out og særlige situationer. El (4 kr./kWh) og vand (80 kr./m³) afregnes efter forbrug. Ingen fester/kæledyr. Pool åben 1/5–1/10.", "View the updated fee list for Fyrrehaven 61: booking rules, cleaning, late check-out and special cases. Electricity (4 DKK/kWh) and water (80 DKK/m³) are billed by usage. No parties or pets. Outdoor pool open May 1–Oct 1.");
    const seoKeywords = lang === "da"
        ? [
            "gebyrer sommerhus",
            "gebyroversigt",
            "rengøringsgebyr",
            "elforbrug pris",
            "vandforbrug pris",
            "sen check-out gebyr",
            "skader og erstatning",
            "Fyrrehaven 61 priser",
        ]
        : [
            "holiday home fees",
            "fee list",
            "cleaning fee",
            "electricity usage price",
            "water usage price",
            "late check-out fee",
            "damage and charges",
            "Fyrrehaven 61 prices",
        ];
    return (_jsxs(_Fragment, { children: [_jsx(Head, { lang: lang, path: path, title: seoTitle, description: seoDescription, ogImage: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg", jsonLd: {
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    name: seoTitle,
                    description: seoDescription,
                    url: `https://fyrrehaven-61.dk${path}`,
                }, robots: { index: true, follow: true, noarchive: true }, keywords: seoKeywords }), _jsx(Container, { size: "3", children: _jsxs(Box, { py: "6", className: styles.page, children: [_jsx(Heading, { as: "h1", size: "8", mb: "3", children: t("Gebyrer", "Fees") }), _jsx(Text, { className: styles.lead, as: "p", children: t("For at sikre den bedste oplevelse for alle gæster har vi samlet en oversigt over gebyrer, der kan blive relevante i særlige situationer.", "To ensure the best experience for all guests, we’ve listed fees that may apply in specific situations.") }), _jsx(Separator, { my: "5", size: "4" }), _jsxs("section", { className: styles.section, "aria-labelledby": "info-h", children: [_jsx(Heading, { id: "info-h", as: "h2", size: "5", mb: "2", children: t("Vigtig information for booking af sommerhuset", "Important information for booking the holiday home") }), _jsxs("div", { className: styles.badges, style: { marginBottom: ".5rem" }, children: [_jsx("span", { className: styles.badge, children: t("Ingen udlejning til fester eller grupper under 25 år.", "No rentals for parties or groups under 25 years.") }), _jsx("span", { className: styles.badge, children: t("Ingen kæledyr tilladt indendørs.", "No pets allowed indoors.") }), _jsx("span", { className: styles.badge, children: t("Udendørspoolen åben 1. maj – 1. oktober.", "Outdoor pool open May 1 – October 1.") })] }), _jsx("div", { className: styles.hr }), _jsx(Text, { as: "p", mb: "1", children: _jsx("strong", { children: t("Forbrug afregnes efter opholdet", "Consumption is settled after your stay") }) }), _jsxs("ul", { children: [_jsx("li", { children: t("El- og vandforbrug ift. lejekontrakten.", "Electricity and water consumption according to the rental agreement.") }), _jsx("li", { children: t("Er der bestilt ekstra service efter booking, vil dette bliver opkrævet.", "If extra services are ordered after booking, these will be charged.") })] })] }), _jsx(Separator, { my: "5", size: "4" }), _jsxs("section", { className: styles.section, "aria-labelledby": "fees-h", children: [_jsx(Heading, { id: "fees-h", as: "h2", size: "5", mb: "2", children: t("Gebyrliste", "Fee list") }), _jsx("div", { className: styles.grid, role: "list", children: fees.map((f) => {
                                        const title = t(f.titleDa, f.titleEn);
                                        const unit = f.unitDa || f.unitEn ? t(f.unitDa ?? "", f.unitEn ?? "") : "";
                                        const note = f.noteDa || f.noteEn ? t(f.noteDa ?? "", f.noteEn ?? "") : "";
                                        return (_jsx("div", { className: styles.row, role: "listitem", children: _jsxs("div", { className: styles.item, children: [_jsx("div", { className: styles.title, children: title }), (unit || note) && (_jsxs("div", { className: styles.unit, children: [unit, unit && note ? " · " : "", note && _jsx("span", { className: styles.note, children: note })] })), _jsxs("div", { className: styles.price, children: [f.amountDKK.toLocaleString(lang === "da" ? "da-DK" : "en-GB"), " ", "DKK"] })] }) }, f.id));
                                    }) })] }), _jsx(Separator, { my: "6", size: "4" }), _jsx(Text, { as: "p", color: "gray", children: t("Bemærk: Gebyrer kan opkræves, hvis vilkår ikke overholdes. Kontakt os ved spørgsmål.", "Note: Fees may be charged if terms are not met. Contact us if you have questions.") })] }) })] }));
}
