import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./Gallery.module.css";
import Buttons from "../Buttons";
/* ───────────────── helpers ───────────────── */
function tPick(da, en, lang) {
    return lang === "da" ? da : en;
}
function getCaption(it, lang) {
    const cap = lang === "da" ? it.captionDa : it.captionEn;
    if (cap && cap.trim())
        return cap.trim();
    const a = lang === "da" ? it.altDa : it.altEn;
    if (a && a.trim())
        return a.trim();
    return it.alt ?? "";
}
/** slug fra src: '/gallery/<slug>/fil.webp' -> '<slug>'; ellers 'misc' */
function folderOf(src) {
    const m = src.match(/\/gallery\/([^/]+)\//i);
    return (m?.[1] ?? "misc").toLowerCase();
}
const FOLDER_LABELS = {
    outdoor: { da: "Udendørs", en: "Outdoor" },
    evening: { da: "Aften", en: "Evening" },
    indoor: { da: "Indendørs", en: "Indoor" },
    pool: { da: "Pool", en: "Pool" },
    sauna: { da: "Sauna", en: "Sauna" },
    area: { da: "Området", en: "Area" },
    floorplan: { da: "Plantegning", en: "Floor plan" },
    misc: { da: "Blandet", en: "Misc" },
};
function labelFor(slug, lang) {
    const fromMap = FOLDER_LABELS[slug];
    if (fromMap)
        return lang === "da" ? fromMap.da : fromMap.en;
    // Fallback: Capitalize slug
    return slug.slice(0, 1).toUpperCase() + slug.slice(1);
}
/** Byg mappe-struktur i stabil rækkefølge ud fra første optræden i items */
function buildFolders(items) {
    const map = new Map();
    for (const it of items) {
        const slug = folderOf(it.src);
        let f = map.get(slug);
        if (!f) {
            f = {
                id: slug,
                labelDa: labelFor(slug, "da"),
                labelEn: labelFor(slug, "en"),
                items: [],
                cover: it,
            };
            map.set(slug, f);
        }
        f.items.push(it);
        // behold første som cover
    }
    return Array.from(map.values());
}
/* ───────────────── component ───────────────── */
export default function Gallery({ lang = "da", title, subtitle, items, cta, align = "center", dense = false, tile = { width: 260, height: 360 }, gap = 14, maxItems, fit = "cover", }) {
    // Grupper til mapper
    const folders = useMemo(() => buildFolders(items ?? []), [items]);
    const visibleFolders = useMemo(() => (typeof maxItems === "number" ? folders.slice(0, maxItems) : folders), [folders, maxItems]);
    // Lightbox (pr. mappe)
    const [open, setOpen] = useState(false);
    const [activeFolder, setActiveFolder] = useState(null);
    const [index, setIndex] = useState(0);
    const total = activeFolder?.items.length ?? 0;
    const openFolder = (f) => {
        setActiveFolder(f);
        setIndex(0);
        setOpen(true);
    };
    const prev = useCallback(() => {
        if (!activeFolder)
            return;
        setIndex((i) => (i - 1 + activeFolder.items.length) % activeFolder.items.length);
    }, [activeFolder]);
    const next = useCallback(() => {
        if (!activeFolder)
            return;
        setIndex((i) => (i + 1) % activeFolder.items.length);
    }, [activeFolder]);
    // Piletaster
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "ArrowLeft")
                prev();
            if (e.key === "ArrowRight")
                next();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, prev, next]);
    // Touch swipe
    const startX = useRef(null);
    const onTouchStart = (e) => (startX.current = e.touches[0].clientX);
    const onTouchEnd = (e) => {
        if (startX.current === null)
            return;
        const dx = e.changedTouches[0].clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50)
            (dx > 0 ? prev : next)();
    };
    // CSS vars (ens tile-dimensioner for alle)
    const gridStyle = {
        ["--tile-w"]: `${tile.width}px`,
        ["--tile-h"]: `${tile.height}px`,
        ["--gap"]: `${gap}px`,
    };
    const fitClass = fit === "fill" ? styles.fill : styles.cover;
    return (_jsxs("section", { className: [styles.wrap, dense ? styles.dense : ""].join(" "), children: [(title || subtitle) && (_jsxs("header", { className: [
                    styles.header,
                    align === "center" ? styles.center : "",
                ].join(" "), children: [title && _jsx("h2", { className: styles.hTitle, children: title }), subtitle && _jsx("p", { className: styles.hSubtitle, children: subtitle })] })), _jsx("div", { className: styles.grid, style: gridStyle, children: visibleFolders.map((f) => {
                    const label = lang === "da" ? f.labelDa : f.labelEn;
                    const cover = f.cover;
                    const count = f.items.length;
                    const extra = Math.max(0, count - 1); // ← antal ud over cover
                    const countWord = lang === "da"
                        ? count === 1
                            ? "billede"
                            : "billeder"
                        : count === 1
                            ? "photo"
                            : "photos";
                    return (_jsx("button", { className: styles.tileBtn, onClick: () => openFolder(f), "aria-label": `${label} – ${count} ${countWord}`, children: _jsxs("div", { className: styles.tile, children: [_jsx("img", { className: `${styles.img} ${fitClass}`, src: cover.src, alt: getCaption(cover, lang) || "", loading: "lazy" }), _jsx("div", { className: styles.tileOverlay, "aria-hidden": "true" }), _jsx("span", { className: styles.tileTitle, children: label }), extra > 0 && (_jsxs("span", { className: styles.tileBadge, children: ["+", extra] }))] }) }, f.id));
                }) }), cta && (_jsx("div", { className: [
                    styles.ctaRow,
                    align === "center" ? styles.center : "",
                ].join(" "), children: "to" in cta && cta.to ? (_jsx(Buttons, { variant: "secondary", label: cta.label, to: cta.to })) : "href" in cta && cta.href ? (_jsx(Buttons, { variant: "secondary", label: cta.label, href: cta.href, external: cta.external })) : null })), _jsxs(Dialog.Root, { open: open, onOpenChange: setOpen, children: [_jsx(Dialog.Portal, { children: _jsx(Dialog.Overlay, { className: styles.lbOverlay }) }), _jsx(Dialog.Portal, { children: _jsxs(Dialog.Content, { className: styles.lbContent, "aria-label": tPick("Billedfremviser", "Lightbox", lang), onTouchStart: onTouchStart, onTouchEnd: onTouchEnd, children: [_jsx(Dialog.Title, { className: styles.srOnly, children: activeFolder
                                        ? lang === "da"
                                            ? activeFolder.labelDa
                                            : activeFolder.labelEn
                                        : "" }), _jsx(Dialog.Description, { className: styles.srOnly, children: tPick("Billedviser. Brug venstre/højre piletaster for at bladre.", "Image viewer. Use left/right arrows to navigate.", lang) }), activeFolder && total > 0 && (_jsxs(_Fragment, { children: [_jsx("button", { className: styles.lbClose, "aria-label": tPick("Luk", "Close", lang), onClick: () => setOpen(false), children: "\u2715" }), _jsx("button", { className: `${styles.lbNav} ${styles.prev}`, "aria-label": tPick("Forrige", "Previous", lang), onClick: prev, children: "\u2039" }), _jsx("button", { className: `${styles.lbNav} ${styles.next}`, "aria-label": tPick("Næste", "Next", lang), onClick: next, children: "\u203A" }), _jsxs("figure", { className: styles.lbFigure, children: [_jsx("img", { className: styles.lbImg, src: activeFolder.items[index].full ??
                                                        activeFolder.items[index].src, alt: getCaption(activeFolder.items[index], lang) || "" }), _jsxs("div", { className: styles.lbCounter, children: [index + 1, " / ", total] }), getCaption(activeFolder.items[index], lang) ? (_jsx("figcaption", { className: styles.lbCap, children: getCaption(activeFolder.items[index], lang) })) : null] })] }))] }) })] })] }));
}
