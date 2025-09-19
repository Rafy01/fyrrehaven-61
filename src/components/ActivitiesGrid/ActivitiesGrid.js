import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from "react";
import styles from "./ActivitiesGrid.module.css";
export default function ActivitiesGrid({ lang, items, selected = [], emptyTextDa = "Ingen resultater – prøv at vælge færre filtre.", emptyTextEn = "No results – try fewer filters.", className, }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const filtered = useMemo(() => {
        if (!selected.length)
            return items;
        const set = new Set(selected);
        return items.filter((it) => it.tags.some((tag) => set.has(tag)));
    }, [items, selected]);
    if (!filtered.length) {
        return (_jsx("div", { className: [styles.empty, className ?? ""].join(" "), children: t(emptyTextDa, emptyTextEn) }));
    }
    return (_jsx("div", { className: [styles.grid, className ?? ""].join(" "), children: filtered.map((it, i) => {
            const title = t(it.titleDa, it.titleEn);
            const desc = t(it.descDa ?? "", it.descEn ?? "");
            const badge = it.driveMin != null
                ? t(`${it.driveMin} min i bil`, `${it.driveMin} min by car`)
                : it.distanceKm != null
                    ? t(`${it.distanceKm} km`, `${it.distanceKm} km`)
                    : undefined;
            const CardInner = (_jsxs(_Fragment, { children: [_jsxs("figure", { className: styles.media, "aria-hidden": "true", children: [_jsx("img", { src: it.image, alt: "", loading: "lazy", decoding: "async", className: styles.img }), badge && (_jsx("figcaption", { className: styles.badge, children: badge }))] }), _jsxs("div", { className: styles.body, children: [_jsx("h3", { className: styles.title, children: title }), desc ? _jsx("p", { className: styles.desc, children: desc }) : null, it.tags?.length ? (_jsx("div", { className: styles.tags, "aria-hidden": "true", children: it.tags.slice(0, 4).map((tag) => (_jsx("span", { className: styles.tag, children: tag }, tag))) })) : null] })] }));
            // Klik hele kortet hvis der er href
            return it.href ? (_jsx("a", { className: styles.card, href: it.href, target: "_blank", rel: "noopener noreferrer", style: { animationDelay: `${i * 40}ms` }, children: CardInner }, it.id)) : (_jsx("div", { className: styles.card, style: { animationDelay: `${i * 40}ms` }, children: CardInner }, it.id));
        }) }));
}
