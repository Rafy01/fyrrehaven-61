import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./GalleryTeaser.module.css";
import Buttons from "../Buttons";
export default function GalleryTeaser({ title, subtitle, items, cta, align = "center", dense = false, aspect = "9 / 16", stagger = true, }) {
    const first3 = items.slice(0, 3);
    const fourth = items[3];
    const extraCount = Math.max(0, items.length - 4);
    // Lightbox
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const total = items.length;
    const openAt = (i) => {
        setIndex(i);
        setOpen(true);
    };
    const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
    const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
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
    // touch-swipe
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
    const collageStyle = {
        ["--aspect"]: aspect,
        ["--amp"]: typeof stagger === "number" ? `${stagger}px` : "12px",
    };
    return (_jsxs("section", { className: [styles.wrap, dense ? styles.dense : ""].join(" "), children: [(title || subtitle) && (_jsxs("header", { className: [
                    styles.header,
                    align === "center" ? styles.center : "",
                ].join(" "), children: [title && _jsx("h2", { className: styles.hTitle, children: title }), subtitle && _jsx("p", { className: styles.hSubtitle, children: subtitle })] })), _jsxs("div", { className: [styles.collage, stagger ? styles.staggered : ""].join(" "), style: collageStyle, children: [first3.map((it, i) => (_jsx("button", { className: styles.pillBtn, "aria-label": it.alt ? `Åbn billede: ${it.alt}` : `Åbn billede ${i + 1}`, onClick: () => openAt(i), children: _jsx("div", { className: styles.pill, children: _jsx("img", { className: styles.img, src: it.src, alt: it.alt ?? "", loading: "lazy" }) }) }, `pill-${i}`))), _jsx("button", { className: styles.pillBtn, "aria-label": fourth?.alt
                            ? `Åbn billede: ${fourth.alt}`
                            : `Åbn billede ${Math.min(4, items.length)}`, onClick: () => openAt(Math.min(3, items.length - 1)), children: _jsxs("div", { className: styles.pill, children: [fourth ? (_jsx("img", { className: styles.img, src: fourth.src, alt: fourth.alt ?? "", loading: "lazy" })) : (_jsx("div", { className: styles.placeholder, "aria-hidden": "true" })), extraCount > 0 && (_jsx("div", { className: styles.more, "aria-hidden": "true", children: _jsxs("span", { className: styles.moreBadge, children: ["+", extraCount] }) }))] }) })] }), cta && (_jsx("div", { className: [
                    styles.ctaRow,
                    align === "center" ? styles.center : "",
                ].join(" "), children: cta.to ? (_jsx(Buttons, { variant: "secondary", label: cta.label, to: cta.to })) : cta.href ? (_jsx(Buttons, { variant: "secondary", label: cta.label, href: cta.href, external: cta.external })) : null })), _jsx(Dialog.Root, { open: open, onOpenChange: setOpen, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: styles.lbOverlay }), _jsx(Dialog.Content, { className: styles.lbContent, onTouchStart: onTouchStart, onTouchEnd: onTouchEnd, "aria-label": "Billedfremviser", children: total > 0 && (_jsxs(_Fragment, { children: [_jsx("button", { className: styles.lbClose, "aria-label": "Luk", onClick: () => setOpen(false), children: "\u2715" }), _jsx("button", { className: `${styles.lbNav} ${styles.prev}`, "aria-label": "Forrige", onClick: prev, children: "\u2039" }), _jsxs("figure", { className: styles.lbFigure, children: [_jsx("img", { className: styles.lbImg, src: items[index].full ?? items[index].src, alt: items[index].alt ?? "" }), items[index].alt ? (_jsx("figcaption", { className: styles.lbCap, children: items[index].alt })) : null, _jsxs("div", { className: styles.lbCounter, children: [index + 1, " / ", total] })] }), _jsx("button", { className: `${styles.lbNav} ${styles.next}`, "aria-label": "N\u00E6ste", onClick: next, children: "\u203A" })] })) })] }) })] }));
}
