import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from "./Facilities.module.css";
export default function Facilities({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    // ===== 4 faste kategorier (permanent) =====
    const categories = [
        {
            id: "kitchen",
            title: { da: "Køkken", en: "Kitchen" },
            bullets: [
                { da: "Fuldt udstyret køkken", en: "Fully equipped kitchen" },
                {
                    da: "Køle-/fryseskab, ovn og mikroovn",
                    en: "Fridge/freezer, oven and microwave",
                },
                {
                    da: "Automatisk kaffemaskine, filter- og stempelkaffe",
                    en: "Automatic coffee machine, filter & French press",
                },
                {
                    da: "Sodastream inkl. udskiftelig patron",
                    en: "Sodastream incl. replaceable cartridge",
                },
                {
                    da: "Service til 10: tallerkner, bestik, glas, kopper, champagne- og vinglas",
                    en: "Tableware for 10: plates, cutlery, glasses, cups, champagne & wine glasses",
                },
                { da: "Vandkander og isbakke", en: "Water jugs and ice tray" },
                { da: "Affaldssortering", en: "Waste sorting" },
                { da: "Gasgrill", en: "Gas grill" },
            ],
        },
        /* ---------- OPHOLD & PRAKTISK ---------- */
        {
            id: "living",
            title: { da: "Ophold & praktisk", en: "Living & practical" },
            bullets: [
                { da: "Stort spisebord til 10", en: "Large dining table for 10" },
                {
                    da: 'TV 55" og PlayStation 5 i stuen',
                    en: '55" TV and PlayStation 5 in the lounge',
                },
                {
                    da: "Gulvvarme i hele huset · Aircondition",
                    en: "Underfloor heating throughout · Air conditioning",
                },
                {
                    da: "Vaskemaskine og tørretumbler",
                    en: "Washing machine and tumble dryer",
                },
                {
                    da: "Rejseseng til børn (bestilles gratis forud)",
                    en: "Travel cot (pre-book for free)",
                },
                { da: "Strygejern og hårtørrer", en: "Iron and hair dryer" },
                { da: "El-lader til elbil", en: "EV charger" },
            ],
        },
        {
            id: "outdoor",
            title: { da: "Udendørs", en: "Outdoor" },
            bullets: [
                {
                    da: "Udendørs pool opvarmet ~29°C (1. maj – 1. oktober) med overdækning",
                    en: "Outdoor pool heated ~29°C (1 May – 1 Oct) with cover",
                },
                {
                    da: "Brændefyret vildmarksbad (op til 6 pers.) med lys og massage",
                    en: "Wood-fired hot tub (up to 6) with lights and massage",
                },
                {
                    da: "El-sauna (op til ca. 8 pers.) – mulighed for lidt vand på stenene",
                    en: "Electric sauna (up to ~8) – light steam by pouring water on stones",
                },
                {
                    da: "Trampolin samt gynge/legetårn med rutschebane",
                    en: "Trampoline and swing/play tower with slide",
                },
            ],
        },
        {
            id: "checkin",
            title: { da: "Indtjekning", en: "Check-in" },
            bullets: [
                {
                    da: "Selv-indtjekning via nøgleboks (kode sendes 1 time før ankomst)",
                    en: "Self check-in via key box (code sent 1 hour before arrival)",
                },
                {
                    da: "Ind kl. 16:00 · Ud kl. 10:00",
                    en: "Check-in 4:00 PM · Check-out 10:00 AM",
                },
                {
                    da: "Upload fotos af el- og vandmåler via hjemmesiden ved ind-/udtjekning",
                    en: "Upload photos of electricity & water meters on the website at check-in/out",
                },
            ],
        },
        {
            id: "rules",
            title: { da: "Husregler", en: "House rules" },
            bullets: [
                { da: "Ingen fester", en: "No parties" },
                {
                    da: "Røgfrit hus (ingen rygning indendørs)",
                    en: "No smoking indoors",
                },
                {
                    da: "Adgang forbudt i anneks og skur",
                    en: "No access to annex and shed",
                },
                {
                    da: "Ophold forbudt i pool-teknikrum",
                    en: "No access/stay in the pool utility room",
                },
            ],
        },
    ];
    return (_jsxs("section", { className: styles.wrap, "aria-label": t("Faciliteter", "Amenities"), children: [_jsxs("header", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: t("Faciliteter – komplet liste", "Amenities – full list") }), _jsx("p", { className: styles.intro, children: t("El- og vandforbrug afregnes efter endt ophold og betales via bankoverførsel.", "Electricity and water are settled after your stay and paid by bank transfer.") })] }), _jsx("div", { className: styles.grid, children: categories.map((cat) => (_jsxs("article", { className: styles.card, children: [_jsx("h3", { className: styles.cardTitle, children: t(cat.title.da, cat.title.en) }), _jsx("ul", { className: styles.list, children: cat.bullets.map((b, i) => (_jsx("li", { className: styles.item, children: t(b.da, b.en) }, i))) })] }, cat.id))) })] }));
}
