import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef } from "react";
import styles from "./Reviews.module.css";
import Buttons from "../Buttons";
import { reviews as allReviews } from "../../data/reviews";
import { AIRBNB_URL } from "../../lib/links";
function Star({ filled }) {
    return (_jsx("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 20 20", className: styles.star, children: _jsx("path", { d: "M10 1.8l2.47 4.99 5.51.8-3.99 3.89.94 5.48L10 14.98 5.07 17.96 6.01 12.48 2.02 8.59l5.51-.8L10 1.8z", fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "1.1" }) }));
}
function Stars({ value }) {
    const v = Math.max(0, Math.min(5, value));
    return (_jsx("span", { className: styles.stars, "aria-label": `${v.toFixed(1)} af 5`, children: [1, 2, 3, 4, 5].map((i) => (_jsx(Star, { filled: i <= Math.round(v) }, i))) }));
}
function formatDate(iso, lang) {
    try {
        return new Date(iso).toLocaleDateString(lang === "da" ? "da-DK" : "en-GB", {
            year: "numeric",
            month: "short",
        });
    }
    catch {
        return iso;
    }
}
export default function Reviews({ lang, title, subtitle, maxCards, average, showSchema = true, }) {
    const t = (da, en) => (lang === "da" ? da : en);
    // Alle reviews, men tekster vises på valgt sprog
    const reviews = useMemo(() => allReviews.slice(0, maxCards ?? allReviews.length), [maxCards]);
    const computedAvg = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 5;
    const avgToShow = typeof average === "number" ? average : computedAvg;
    const scrollerRef = useRef(null);
    const scroll = (dir) => {
        const el = scrollerRef.current;
        if (!el)
            return;
        const dx = el.clientWidth * 0.85 * (dir === "left" ? -1 : 1);
        el.scrollBy({ left: dx, behavior: "smooth" });
    };
    // JSON-LD (valgfrí) – bruger dit manuelle gennemsnit hvis sat
    const jsonLd = showSchema
        ? {
            "@context": "https://schema.org",
            "@type": "VacationRental",
            name: "Fyrrehaven 61",
            url: "https://fyrrehaven-61.dk",
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(avgToShow.toFixed(1)),
                reviewCount: reviews.length, // tælles stadig i schema, men ikke vist i UI
            },
            review: reviews.map((r) => ({
                "@type": "Review",
                reviewBody: lang === "da" ? r.textDa : r.textEn,
                datePublished: r.date,
                reviewRating: { "@type": "Rating", ratingValue: r.rating },
                author: { "@type": "Person", name: r.author },
            })),
        }
        : null;
    return (_jsxs("section", { className: styles.wrap, "aria-label": t("Anmeldelser", "Reviews"), children: [jsonLd && (_jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd) })), _jsxs("header", { className: styles.header, children: [_jsxs("div", { className: styles.hLeft, children: [_jsx("h2", { className: styles.hTitle, children: title ?? t("Gæsterne siger", "What guests say") }), subtitle ? (_jsx("p", { className: styles.hSubtitle, children: subtitle })) : (
                            // Kun stjerner + gennemsnit (INGEN antal anmeldelser i UI)
                            _jsxs("p", { className: styles.hSubtitle, children: [_jsx(Stars, { value: avgToShow }), " ", _jsx("strong", { children: avgToShow.toFixed(1) })] }))] }), _jsxs("div", { className: styles.hRight, children: [_jsx("button", { type: "button", className: styles.navBtn, "aria-label": t("Scroll venstre", "Scroll left"), onClick: () => scroll("left"), children: "\u2039" }), _jsx("button", { type: "button", className: styles.navBtn, "aria-label": t("Scroll højre", "Scroll right"), onClick: () => scroll("right"), children: "\u203A" })] })] }), _jsx("div", { className: styles.row, ref: scrollerRef, children: reviews.map((r) => (_jsxs("article", { className: styles.card, children: [_jsxs("div", { className: styles.cardTop, children: [_jsx("div", { className: styles.avatar, "aria-hidden": "true", children: r.author.slice(0, 1).toUpperCase() }), _jsxs("div", { className: styles.meta, children: [_jsx("strong", { className: styles.name, children: r.author }), _jsx("span", { className: styles.date, children: formatDate(r.date, lang) })] }), _jsx(Stars, { value: r.rating })] }), _jsx("p", { className: styles.text, children: lang === "da" ? r.textDa : r.textEn }), _jsxs("div", { className: styles.source, children: [t("Kilde", "Source"), ": ", r.source ?? "Airbnb"] })] }, r.id))) }), _jsx("div", { className: styles.cta, children: _jsx(Buttons, { variant: "secondary", labelDa: "Se alle anmeldelser p\u00E5 Airbnb", labelEn: "See all reviews on Airbnb", href: AIRBNB_URL, external: true }) })] }));
}
