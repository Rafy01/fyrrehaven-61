import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import styles from "./PracticalInfo.module.css";
/* ---------- Ikoner (små inline SVG’er) ---------- */
const Icon = {
    Key: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M14.5 3a4.5 4.5 0 1 0 2.8 8.03L22 15.7V18h-2v2h-2v2h-2v-3.3l-4.1-4.1a4.5 4.5 0 0 0 2.6-4.1A4.5 4.5 0 0 0 14.5 3Zm0 2a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5Z" }) })),
    Clock: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 5h-2v6l5 3 .9-1.8L13 12.3V7Z" }) })),
    Wifi: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0-6a8 8 0 0 1 5.7 2.3l1.4-1.4A10 10 0 0 0 12 10a10 10 0 0 0-7.1 2.9l1.4 1.4A8 8 0 0 1 12 12Zm0-6c3.6 0 7 1.4 9.5 3.9l1.4-1.4A14 14 0 0 0 12 2 14 14 0 0 0 1.1 8.6l1.4 1.4A12 12 0 0 1 12 6Z" }) })),
    Car: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M5 11 7.2 6.2A2 2 0 0 1 9 5h6a2 2 0 0 1 1.8 1.2L19 11v6h-1a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H5v-6Zm3.2-4L7.5 9H16.5l-.7-2h-7.6Z" }) })),
    Bed: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M3 7h7a3 3 0 0 1 3 3v1h8v6h-2v-2H5v2H3V7Zm2 2v4h6v-1a1 1 0 0 0-1-1H5Zm8 2h6v-1a1 1 0 0 0-1-1h-5v2Z" }) })),
    NoParty: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M4.2 3 21 19.8 19.8 21 17.6 18.8A8 8 0 0 1 4 12h2a6 6 0 0 0 9.9 4.7L13 13.8V15h-2v-3.2L5.4 5.2 4.2 3ZM12 4a8 8 0 0 1 8 8h-2a6 6 0 0 0-8.7-5.3L7.8 5.2A7.9 7.9 0 0 1 12 4Z" }) })),
    Roll: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M4 7a5 5 0 1 1 10 0v9H9a5 5 0 0 1-5-5V7Zm10 0a3 3 0 1 0-6 0v4a3 3 0 1 0 6 0V7Zm2 1h4v10H16V8Z" }) })),
    Heat: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M7 4c1 1 1 2 0 3s-1 2 0 3 1 2 0 3-1 2 0 3M12 4c1 1 1 2 0 3s-1 2 0 3 1 2 0 3-1 2 0 3M17 4c1 1 1 2 0 3s-1 2 0 3 1 2 0 3-1 2 0 3", stroke: "currentColor", fill: "none", strokeWidth: "1.6" }) })),
    Washer: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M5 3h14v18H5V3Zm2 2v2h10V5H7Zm5 4a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 9Zm-3-4h2v2H9V5Zm4 0h2v2h-2V5Z" }) })),
    Tv: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M4 6h16v10H4V6Zm5 12h6v2H9v-2Z" }) })),
    Gamepad: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M7 8h10a5 5 0 1 1 0 10h-1l-2-2H10l-2 2H7a5 5 0 1 1 0-10Zm1.5 2.5H7v1.5H5.5V14H7v1.5h1.5V14H10v-1.5H8.5v-2Zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-2 3a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" }) })),
    Ac: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M3 6h18v4H3V6Zm2 8h2l-1 2h2l-1 2h-2l1-2H4l1-2Zm7 0h2l-1 2h2l-1 2h-2l1-2h-2l1-2Zm7 0h2l-1 2h2l-1 2h-2l1-2h-2l1-2Z" }) })),
    Ev: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M6 6h8l-3 5h3l-6 7 2.5-6H7l-1-6Zm10.5 0 1.5 3h2v2h-2l-1 2h-1l1-2h-2V9h2l-1.5-3h1Z" }) })),
    Baby: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M12 3a5 5 0 1 1-4.9 6H5a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H9v-2h2a1 1 0 1 0 0-2H7a5 5 0 0 1 0-10h.1A5 5 0 0 1 12 3Z" }) })),
    Iron: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M3 15h16a2 2 0 0 0 2-2V9h-6a7 7 0 0 0-7 7H3v-1Z" }) })),
    Grill: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M4 7h16v2H4V7Zm1 4h14a7 7 0 0 1-7 6 7 7 0 0 1-7-6Zm6 6h2l3 4h-2l-1-2h-2l-1 2H8l3-4Z" }) })),
};
function defaultItems() {
    return [
        // ——— eksisterende nøglepunkter ———
        {
            key: "checkin",
            icon: "Key",
            titleDa: "Selv-indtjekning",
            titleEn: "Self check-in",
            textDa: "Nøgleboks – kode sendes 1 time før ankomst",
            textEn: "Key box – code is sent 1 hour prior to arrival",
        },
        {
            key: "times",
            icon: "Clock",
            titleDa: "Tjek ind/ud",
            titleEn: "Check-in/out",
            textDa: "Ind 16:00 · Ud 10:00",
            textEn: "In 4:00 PM · Out 10:00 AM",
        },
        {
            key: "wifi",
            icon: "Wifi",
            titleDa: "Hurtigt Wi-Fi",
            titleEn: "Fast Wi-Fi",
            textDa: "Stabilt net i hele huset – også udenfor",
            textEn: "Reliable coverage across the house and outside",
        },
        {
            key: "parking",
            icon: "Car",
            titleDa: "Parkering",
            titleEn: "Parking",
            textDa: "Plads til 6 biler ved huset",
            textEn: "Space for 6 cars by the house",
        },
        {
            key: "linens",
            icon: "Bed",
            titleDa: "Sengetøj & håndklæder",
            titleEn: "Linens & towels",
            textDa: "Medbring selv (eller tilkøb efter booking)",
            textEn: "Bring your own (or rent after booking)",
        },
        {
            key: "rules",
            icon: "NoParty",
            titleDa: "Husregler",
            titleEn: "House rules",
            textDa: "Ingen fester · Røgfrit hus",
            textEn: "No parties · No smoking",
        },
        // ——— NYE punkter fra din liste ———
        {
            key: "starter-pack",
            icon: "Roll",
            titleDa: "Startpakke ",
            titleEn: "Starter pack",
            textDa: "Toiletpapir, køkkenrulle, opvaskemiddel, opvasketabs, håndsæbe, diverse klude",
            textEn: "Toilet paper, kitchen roll, dish soap, dishwasher tablets, hand soap, various cloths",
        },
        {
            key: "floor-heat",
            icon: "Heat",
            titleDa: "Gulvvarme",
            titleEn: "Underfloor heating",
            textDa: "Gulvvarme i hele huset for jævn komfort",
            textEn: "Underfloor heating throughout for even comfort",
        },
        {
            key: "laundry",
            icon: "Washer",
            titleDa: "Vask & tørring",
            titleEn: "Laundry",
            textDa: "Vaskemaskine og tørretumbler til rådighed",
            textEn: "Washing machine and tumble dryer available",
        },
        {
            key: "tv",
            icon: "Tv",
            titleDa: 'Fjernsyn 55"',
            titleEn: '55" TV',
            textDa: "Stue med 55” TV til hygge og film",
            textEn: "Living room with 55” TV for movies & nights in",
        },
        {
            key: "playstation",
            icon: "Gamepad",
            titleDa: "PlayStation",
            titleEn: "PlayStation",
            textDa: "PlayStation med familievenlige spil",
            textEn: "PlayStation with family-friendly games",
        },
        {
            key: "ac",
            icon: "Ac",
            titleDa: "Aircondition",
            titleEn: "Air conditioning",
            textDa: "Køl/varme efter behov i opholdsrum",
            textEn: "Cooling/heating as needed in the living area",
        },
        {
            key: "ev",
            icon: "Ev",
            titleDa: "EL-lader",
            titleEn: "EV charger",
            textDa: "Mulighed for opladning af elbil ved huset",
            textEn: "EV charging available at the house",
        },
        {
            key: "travel-cot",
            icon: "Baby",
            titleDa: "Rejseseng (gratis)",
            titleEn: "Travel cot (free)",
            textDa: "Gratis rejseseng til børn – bestilles på forhånd",
            textEn: "Free travel cot for children – request in advance",
        },
        {
            key: "iron-dryer",
            icon: "Iron",
            titleDa: "Strygejern & hårtørrer",
            titleEn: "Iron & hair dryer",
            textDa: "Til rådighed for dit ophold",
            textEn: "Available during your stay",
        },
        {
            key: "gas-grill",
            icon: "Grill",
            titleDa: "Gasgrill",
            titleEn: "Gas grill",
            textDa: "Terrasse med gasgrill til nem madlavning",
            textEn: "Terrace with gas grill for easy cooking",
        },
    ];
}
export default function PracticalInfo({ lang, title, subtitle, items, variant = "teaser", maxItems = 4, ctaTo, ctaHref, ctaLabelDa, ctaLabelEn, }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const data = items ?? defaultItems();
    const list = variant === "teaser" ? data.slice(0, Math.max(1, maxItems)) : data;
    const renderCardInner = (it) => {
        const Ico = Icon[it.icon];
        return (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.ico, children: _jsx(Ico, {}) }), _jsxs("div", { className: styles.texts, children: [_jsx("div", { className: styles.itemTitle, children: t(it.titleDa, it.titleEn) }), _jsx("div", { className: styles.itemSub, children: t(it.textDa, it.textEn) })] })] }));
    };
    return (_jsxs("section", { className: styles.wrap, "aria-label": t("Praktisk info", "Practical info"), children: [_jsxs("header", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: title ?? t("Praktisk info", "Practical info") }), subtitle ? _jsx("p", { className: styles.subtitle, children: subtitle }) : null] }), _jsx("div", { className: styles.grid, children: list.map((it) => {
                    if (it.to) {
                        return (_jsx(Link, { to: it.to, className: styles.card, children: renderCardInner(it) }, it.key));
                    }
                    if (it.href) {
                        return (_jsx("a", { href: it.href, target: "_blank", rel: "noopener noreferrer", className: styles.card, children: renderCardInner(it) }, it.key));
                    }
                    return (_jsx("div", { className: styles.card, role: "group", "aria-label": t(it.titleDa, it.titleEn), children: renderCardInner(it) }, it.key));
                }) }), (ctaTo || ctaHref) && (_jsx("div", { className: styles.cta, children: ctaTo ? (_jsx(Link, { to: ctaTo, className: styles.ctaBtn, children: t(ctaLabelDa ?? "Læs mere", ctaLabelEn ?? "Learn more") })) : (_jsx("a", { href: ctaHref, rel: "noopener noreferrer", className: styles.ctaBtn, children: t(ctaLabelDa ?? "Læs mere", ctaLabelEn ?? "Learn more") })) }))] }));
}
