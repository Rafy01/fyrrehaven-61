import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/House/House.tsx
import { Box, Container, Separator, Heading, Grid, Card, } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import { AIRBNB_URL } from "../../lib/links";
import styles from "./House.module.css";
import PracticalInfo from "../../components/PracticalInfo";
import Facilities from "../../components/Facilities";
import { getPageMeta } from "../../lib/meta";
export default function House({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    /* -------- SEO (kun meta) -------- */
    const Meta = getPageMeta(lang, "house");
    const seoKeywords = lang === "da"
        ? [
            "sommerhus fjellerup",
            "sommerhus med pool",
            "opvarmet udendørs pool",
            "vildmarksbad",
            "sauna",
            "familievenligt sommerhus",
            "10 personer",
            "djursland feriehus",
            "Fyrrehaven 61",
            "tæt på strand og skov",
        ]
        : [
            "holiday home Fjellerup",
            "heated outdoor pool",
            "hot tub",
            "sauna",
            "family friendly",
            "sleeps 10",
            "Djursland vacation rental",
            "Fyrrehaven 61",
            "near beach and forest",
        ];
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VacationRental",
        name: "Fyrrehaven 61 – House",
        description: Meta.description,
        url: `https://fyrrehaven-61.dk${pathOf(lang, "house")}`,
        maximumAttendeeCapacity: 10,
        amenityFeature: [
            {
                "@type": "LocationFeatureSpecification",
                name: t("Udendørs opvarmet pool", "Outdoor heated pool"),
                value: true,
                description: t("Åben 1. maj – 1. oktober", "Open May 1 – Oct 1"),
            },
            {
                "@type": "LocationFeatureSpecification",
                name: t("Brændefyret vildmarksbad", "Wood-fired hot tub"),
                value: true,
            },
            {
                "@type": "LocationFeatureSpecification",
                name: t("El-sauna", "Electric sauna"),
                value: true,
            },
            {
                "@type": "LocationFeatureSpecification",
                name: t("Tæt på strand & skov", "Near beach & forest"),
                value: true,
            },
        ],
        address: { "@type": "PostalAddress", addressCountry: "DK" },
    };
    return (_jsxs(_Fragment, { children: [_jsx(Head, { lang: lang, path: pathOf(lang, "house"), title: Meta.title, description: Meta.description, ogImage: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.jpg", jsonLd: jsonLd, robots: { index: true, follow: true, noarchive: true }, keywords: seoKeywords }), _jsx(Hero, { title: t("Sommerhuset – plads til 10, udendørs pool & wellness", "The House – sleeps 10, outdoor pool & wellness"), subtitle: t("4 soveværelser + hems. Udendørs opvarmet pool (1. maj–1. oktober), brændefyret vildmarksbad og el-sauna.", "4 bedrooms + loft. Outdoor heated pool (May 1–Oct 1), wood-fired hot tub and electric sauna."), badges: [
                    t("10 gæster", "10 guests"),
                    t("4 soveværelser", "4 bedrooms"),
                    t("2 badeværelser", "2 bathrooms"),
                    t("Udendørs opvarmet pool", "Outdoor heated pool"),
                    t("Vildmarksbad", "Hot tub"),
                    t("Sauna", "Sauna"),
                ], primaryCta: {
                    label: t("Book privat", "Book privately"),
                    href: pathOf(lang, "book"),
                    external: false,
                }, secondaryCta: {
                    label: t("Book | Airbnb", "Book | Airbnb"),
                    href: AIRBNB_URL,
                    external: true,
                }, media: {
                    type: "image",
                    src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.webp",
                    alt: t("Udendørs poolområde ved sommerhuset", "Outdoor pool area at the house"),
                    title: t("Fyrrehaven 61 – feriehus ved Fjellerup Strand", "Fyrrehaven 61 – holiday home by Fjellerup Beach"),
                }, align: "left" }), _jsxs(Container, { size: "3", children: [_jsx(Separator, { size: "4" }), _jsx(Box, { asChild: true, id: "soverum", children: _jsxs("section", { className: styles.section, children: [_jsx(Heading, { as: "h2", size: "6", children: t("Sovepladser & planløsning", "Sleeping arrangements & layout") }), _jsxs(Grid, { columns: { initial: "1", md: "2" }, gap: "4", mt: "3", children: [_jsxs(Card, { variant: "surface", children: [_jsx(Heading, { as: "h3", size: "3", children: t("Senge (dobbeltsenge)", "Beds (double)") }), _jsxs("ul", { className: styles.list, children: [_jsx("li", { children: t("4 dobbeltsenge i alt: 2× 180×200 cm og 2× 200×200 cm", "4 double beds total: 2× 180×200 cm and 2× 200×200 cm") }), _jsx("li", { children: t("Hver dobbeltseng har 2 puder (fiber 60×63/70) og 2 fiberdyner 135×200", "Each double bed includes 2 pillows (fiber 60×63/70) and 2 fiber duvets 135×200") })] })] }), _jsxs(Card, { variant: "surface", children: [_jsx(Heading, { as: "h3", size: "3", children: t("Sengetøj & opbevaring", "Linen & storage") }), _jsxs("ul", { className: styles.list, children: [_jsx("li", { children: t("Sengetøj kan lejes efter ønske – ellers medbringes", "Bed linen can be rented on request – otherwise bring your own") }), _jsx("li", { children: t("Kommode med skuffer til tøj", "Chest of drawers") }), _jsx("li", { children: t("Spejl", "Mirror") }), _jsx("li", { children: t("Hængekrog bag døren", "Hook behind the door") }), _jsx("li", { children: t("2 natlamper", "2 bedside lamps") })] })] })] })] }) }), _jsx(Box, { asChild: true, id: "wellness", children: _jsxs("section", { className: styles.section, children: [_jsx(Heading, { as: "h2", size: "6", children: t("Pool & wellness", "Pool & wellness") }), _jsxs(Grid, { columns: { initial: "1", md: "3" }, gap: "4", mt: "3", children: [_jsxs(Card, { variant: "surface", children: [_jsx(Heading, { as: "h3", size: "3", children: t("Udendørs pool", "Outdoor pool") }), _jsxs("ul", { className: styles.list, children: [_jsx("li", { children: t("1,5 m dyb", "1.5 m deep") }), _jsx("li", { children: t("3,5 m bred · 8 m lang", "3.5 m wide · 8 m long") }), _jsx("li", { children: t("Opvarmet ca. 29 °C", "Heated approx. 29 °C") }), _jsx("li", { children: t("Sæson: 1. maj – 1. oktober", "Season: May 1 – Oct 1") }), _jsx("li", { children: t("Tag/overdækning kan lukkes på kolde eller vindfulde dage", "Cover/roof can be closed on cold or windy days") }), _jsx("li", { children: t("Lys i poolen (kan tændes)", "Pool lighting (switchable)") }), _jsx("li", { children: t("Automatisk tilførsel af poolkemi", "Automatic chemical dosing") })] })] }), _jsxs(Card, { variant: "surface", children: [_jsx(Heading, { as: "h3", size: "3", children: t("Vildmarksbad", "Hot tub") }), _jsxs("ul", { className: styles.list, children: [_jsx("li", { children: t("Op til 6 personer", "Up to 6 people") }), _jsx("li", { children: t("Opvarmes med brænde", "Wood-fired heating") }), _jsx("li", { children: t("Massagefunktion og lys", "Massage jets and lighting") }), _jsx("li", { children: t("Vand fyldes med haveslange – kan mod tilkøb være fyldt før ankomst", "Water is added via garden hose – can be pre-filled before arrival for an extra fee") })] })] }), _jsxs(Card, { variant: "surface", children: [_jsx(Heading, { as: "h3", size: "3", children: t("Sauna", "Sauna") }), _jsxs("ul", { className: styles.list, children: [_jsx("li", { children: t("Op til 8 personer", "Up to 8 people") }), _jsx("li", { children: t("Lys indvendig og udvendig", "Interior and exterior lights") }), _jsx("li", { children: t("Hæld stille og roligt vand på ovnen for damp", "Gently pour water on the heater for steam") })] })] })] })] }) }), _jsx(Box, { asChild: true, id: "koekken", children: _jsxs("section", { className: styles.section, children: [_jsx(Heading, { as: "h2", size: "6", children: t("Køkken & ophold", "Kitchen & living") }), _jsxs(Grid, { columns: { initial: "1", md: "2" }, gap: "4", mt: "3", children: [_jsxs(Card, { variant: "surface", children: [_jsx(Heading, { as: "h3", size: "3", children: t("Køkken", "Kitchen") }), _jsxs("ul", { className: styles.list, children: [_jsx("li", { children: t("Fuldudstyret køkken: køle-/fryseskab, ovn, mikroovn", "Fully equipped kitchen: fridge/freezer, oven, microwave") }), _jsx("li", { children: t("Automatisk kaffemaskine, filterkaffe og stempelkande", "Automatic coffee machine, filter coffee and French press") }), _jsx("li", { children: t("Affaldssortering", "Waste sorting") })] })] }), _jsxs(Card, { variant: "surface", children: [_jsx(Heading, { as: "h3", size: "3", children: t("Ophold & underholdning", "Living & entertainment") }), _jsxs("ul", { className: styles.list, children: [_jsx("li", { children: t("Stort spisebord med plads til 10 personer", "Large dining table seating 10") }), _jsx("li", { children: t("Lyst rum med vinduer fra begge sider", "Bright room with windows on both sides") }), _jsx("li", { children: t("TV-område med sofa, stole og 55″ TV", "TV area with sofa, chairs and 55″ TV") }), _jsx("li", { children: t("Undendørs rutjebane", "Outdoor slide") }), _jsx("li", { children: t("Trampolin", "Trampoline") }), _jsx("li", { children: t("PlayStation 5", "PlayStation 5") })] })] })] })] }) })] }), _jsx(Separator, { size: "4" }), _jsx(PracticalInfo, { lang: lang, variant: "full" }), _jsx(Facilities, { lang: lang })] }));
}
