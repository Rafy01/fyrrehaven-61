import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import styles from "./LocationAndDistances.module.css";
import Buttons from "../Buttons";
import { pathOf } from "../../lib/routes";
/** Små inline-ikoner (ingen ekstra lib) */
const Icon = {
    Beach: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M3 18h18v2H3v-2Zm7.5-9c1.7 0 3.2.8 4.2 2.1l-1.6.9c-.7-.9-1.7-1.4-2.6-1.4-1 0-2 .5-2.7 1.4l-1.6-.9c1-1.3 2.5-2.1 4.3-2.1Zm0-4c3.1 0 5.8 1.9 7 4.6l-1.8 1c-.9-2-3-3.4-5.2-3.4s-4.4 1.4-5.3 3.4l-1.7-1C4.7 6.9 7.4 5 10.5 5Zm8 12c-1.2 0-2.1.5-2.8 1.1-.7-.6-1.6-1.1-2.7-1.1s-2.1.5-2.8 1.1c-.7-.6-1.6-1.1-2.7-1.1S5.4 17.5 4.7 18c.8.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c.7.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c.7.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c-.7-.5-1.6-1.1-2.8-1.1Z" }) })),
    Forest: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M7 2 2 10h3l-3 5h4v5h2v-5h4l-3-5h3L7 2Zm10 3-4 7h3l-3 4h4v4h2v-4h3l-3-4h3l-5-7Z" }) })),
    Walk: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M13 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-1.3 6.2 1.9.6c1 .3 1.7 1.3 1.7 2.4V20h-2v-5.3l-1-.3-1.7 2.7L9 20H7.1l1.7-3-1.3-2.1-2.4 1.2-.9-1.8 3.4-1.7 1.3-2.4c.5-1 1.7-1.5 2.8-1.1Z" }) })),
    Car: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M5 11 7.2 6.2A2 2 0 0 1 9 5h6a2 2 0 0 1 1.8 1.2L19 11v6h-1a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H5v-6Zm3.2-4L7.5 9H16.5l-.7-2h-7.6Z" }) })),
    Shop: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M4 7h16l-1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7Zm2-4h12l1 3H5l1-3Zm2 9h2v6H8v-6Zm6 0h2v6h-2v-6Z" }) })),
    City: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M4 20V8h6V4h4l6 6v10h-6v-4H10v4H4Zm8-12v2h2V8h-2Z" }) })),
};
const defaultItems = [
    {
        key: "beach",
        icon: "Beach",
        labelDa: "Strand",
        labelEn: "Beach",
        value: "900 m",
    },
    {
        key: "forest",
        icon: "Forest",
        labelDa: "Skovstier",
        labelEn: "Forest trails",
        value: "50 m",
    },
    {
        key: "walk",
        icon: "Walk",
        labelDa: "Lokal købmand",
        labelEn: "Local shop",
        value: "12 min",
        subDa: "til fods",
        subEn: "on foot",
    },
    {
        key: "shop",
        icon: "Shop",
        labelDa: "Supermarked",
        labelEn: "Supermarket",
        value: "3.2 km",
    },
    {
        key: "city",
        icon: "City",
        labelDa: "Nærmeste by",
        labelEn: "Nearest town",
        value: "8 km",
    },
    {
        key: "car",
        icon: "Car",
        labelDa: "Aarhus",
        labelEn: "Aarhus",
        value: "55 min",
        subDa: "i bil",
        subEn: "by car",
    },
];
export default function LocationAndDistances({ lang, mapEmbedUrl, mapLinkUrl, directionsTo, title, subtitle, aspect = "16 / 10", items, ctaLabelDa, ctaLabelEn, }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const list = items ?? defaultItems;
    // Lazy-load iframe, kun når sektionen er i viewport
    const [ready, setReady] = useState(false);
    const boxRef = useRef(null);
    useEffect(() => {
        const el = boxRef.current;
        if (!el)
            return;
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                setReady(true);
                io.disconnect();
            }
        }, { rootMargin: "200px" });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    const directionsUrl = directionsTo
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsTo)}`
        : mapLinkUrl ?? mapEmbedUrl;
    const openMapUrl = mapLinkUrl ?? mapEmbedUrl;
    return (_jsxs("section", { className: styles.wrap, "aria-label": t("Beliggenhed & afstande", "Location & distances"), children: [_jsxs("header", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: title ?? t("Beliggenhed & afstande", "Location & distances") }), subtitle ? (_jsx("p", { className: styles.subtitle, children: subtitle })) : (_jsx("p", { className: styles.subtitle, children: t("Skovområde tæt på stranden – perfekt til familier", "Forest setting near the beach — ideal for families") }))] }), _jsxs("div", { className: styles.grid, children: [_jsxs("div", { className: styles.mapBox, style: { ["--aspect"]: aspect }, ref: boxRef, children: [!ready && _jsx("div", { className: styles.skeleton, "aria-hidden": "true" }), ready && (_jsx("iframe", { title: t("Kort over området", "Map of the area"), className: styles.iframe, src: mapEmbedUrl, loading: "lazy", referrerPolicy: "no-referrer-when-downgrade", allowFullScreen: true })), _jsxs("div", { className: styles.mapActions, children: [_jsx(Buttons, { variant: "secondary", labelDa: "\u00C5bn i Google Maps", labelEn: "Open in Google Maps", href: openMapUrl, external: true }), _jsx(Buttons, { labelDa: ctaLabelDa ?? "Rutevejledning", labelEn: ctaLabelEn ?? "Get directions", href: directionsUrl, external: true })] })] }), _jsxs("div", { className: styles.list, children: [_jsx("ul", { className: styles.ul, children: list.map((it) => {
                                    const Ico = Icon[it.icon];
                                    return (_jsxs("li", { className: styles.li, children: [_jsx("span", { className: styles.ico, children: _jsx(Ico, {}) }), _jsxs("span", { className: styles.label, children: [t(it.labelDa, it.labelEn), it.subDa || it.subEn ? (_jsxs("span", { className: styles.sub, children: [" · ", t(it.subDa ?? "", it.subEn ?? "")] })) : null] }), _jsx("span", { className: styles.value, children: it.value })] }, it.key));
                                }) }), _jsx("p", { className: styles.note, children: t("Afstande er omtrentlige og kan variere.", "Distances are approximate and may vary.") }), _jsx(Buttons, { labelDa: ctaLabelDa ?? "Se området", labelEn: ctaLabelEn ?? "See the area", href: pathOf(lang, "area"), variant: "secondary" })] })] })] }));
}
