import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from "./UspStrip.module.css";
export default function UspStrip({ items, size = "md", align = "center", dense = false, ariaLabel, }) {
    return (_jsx("section", { className: [
            styles.wrap,
            dense ? styles.dense : "",
            align === "center" ? styles.center : "",
        ].join(" "), "aria-label": ariaLabel ?? "Quick facts", children: _jsx("ul", { className: styles.list, role: "list", children: items.map((it, idx) => (_jsxs("li", { role: "listitem", className: [
                    styles.item,
                    size === "sm" ? styles.sSm : styles.sMd,
                ].join(" "), children: [it.icon ? (_jsx("span", { className: styles.icon, "aria-hidden": "true", children: it.icon })) : null, _jsx("span", { className: styles.text, "aria-label": it.ariaLabel, children: it.text })] }, idx))) }) }));
}
