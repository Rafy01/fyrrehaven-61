import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/QuickFilters/index.tsx
import React from "react";
import styles from "./QuickFilters.module.css";
import { DEFAULT_TAGS } from "../../lib/tags";
export default function QuickFilters({ lang, value, onChange, dense, syncToUrl, mode = "single", includeAll = true, }) {
    const tags = React.useMemo(() => {
        return includeAll
            ? DEFAULT_TAGS
            : DEFAULT_TAGS.filter((t) => t.id !== "all");
    }, [includeAll]);
    // Skriv til URL når selection ændres
    React.useEffect(() => {
        if (!syncToUrl)
            return;
        const url = new URL(window.location.href);
        if (value.length === 0)
            url.searchParams.delete("tags");
        else
            url.searchParams.set("tags", value.join(","));
        window.history.replaceState({}, "", url.toString());
    }, [value, syncToUrl]);
    const isActive = (id) => id === "all" ? value.length === 0 : value.includes(id);
    const setSingle = (id) => {
        if (id === "all")
            onChange([]); // ← VIGTIGT: tomt udvalg = vis alle
        else
            onChange([id]);
    };
    const toggleMulti = (id) => {
        if (id === "all")
            return onChange([]); // ← nulstil i multi-mode
        const next = value.slice();
        const idx = next.indexOf(id);
        if (idx >= 0)
            next.splice(idx, 1);
        else
            next.push(id);
        onChange(next);
    };
    const onChipClick = (id) => {
        if (mode === "single")
            setSingle(id);
        else
            toggleMulti(id);
    };
    return (_jsx("div", { className: `${styles.wrap} ${dense ? styles.dense : ""}`, children: _jsx("div", { role: "tablist", "aria-label": lang === "da" ? "Filtre" : "Filters", className: styles.row, children: tags.map(({ id, Icon, labelDa, labelEn }) => (_jsxs("button", { role: "tab", "aria-selected": isActive(id), className: `${styles.chip} ${isActive(id) ? styles.active : ""}`, onClick: () => onChipClick(id), children: [_jsx(Icon, {}), _jsx("span", { children: lang === "da" ? labelDa : labelEn })] }, id))) }) }));
}
