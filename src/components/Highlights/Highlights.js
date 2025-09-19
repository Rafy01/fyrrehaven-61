import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Heading, Text } from "@radix-ui/themes";
import styles from "./Highlights.module.css";
import Buttons from "../Buttons";
function CardWrapper({ to, href, external, children, className, }) {
    if (to) {
        return (_jsx(Link, { to: to, className: className, "aria-label": undefined, children: children }));
    }
    if (href) {
        return (_jsx("a", { href: href, target: external ? "_blank" : undefined, rel: external ? "noopener noreferrer" : undefined, className: className, "aria-label": undefined, children: children }));
    }
    return _jsx("div", { className: className, children: children });
}
export default function Highlights({ id, title, subtitle, items, align = "left", dense = false, }) {
    const sectionAlign = align === "center" ? styles.center : "";
    return (_jsxs("section", { id: id, className: [styles.wrap, dense ? styles.dense : ""].join(" "), children: [(title || subtitle) && (_jsxs("header", { className: [styles.header, sectionAlign].join(" "), children: [title && (_jsx(Heading, { as: "h2", size: "7", className: styles.hTitle, children: title })), subtitle && (_jsx(Text, { as: "p", color: "gray", className: styles.hSubtitle, children: subtitle }))] })), _jsx("div", { className: styles.grid, role: "list", children: items.map((it, idx) => {
                    const hasCta = !!(it.ctaLabel && (it.to || it.href));
                    return (_jsxs("article", { role: "listitem", className: styles.card, children: [_jsxs(CardWrapper, { to: it.to, href: it.href, external: it.external, className: styles.cardBody, children: [it.media && (_jsx("figure", { className: styles.media, style: it.media.kind === "image" && it.media.aspect
                                            ? {
                                                ["--aspect"]: it.media.aspect,
                                            }
                                            : undefined, children: it.media.kind === "icon" ? (_jsx("div", { className: styles.iconBox, "aria-hidden": "true", children: it.media.icon })) : (_jsx("div", { className: styles.imgFrame, children: _jsx("img", { src: it.media.src, alt: it.media.alt ?? "", className: styles.img, loading: "lazy" }) })) })), it.badge && _jsx("span", { className: styles.badge, children: it.badge }), _jsx(Heading, { as: "h3", size: "4", className: styles.title, children: it.title }), it.body && (_jsx(Text, { as: "p", color: "gray", className: styles.body, children: it.body }))] }), hasCta && (_jsx("div", { className: styles.ctaRow, children: _jsx(Buttons, { variant: "secondary", label: it.ctaLabel, ...(it.to
                                        ? { to: it.to }
                                        : { href: it.href, external: it.external }) }) }))] }, idx));
                }) })] }));
}
