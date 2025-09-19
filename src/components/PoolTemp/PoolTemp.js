import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
export default function PoolTemp() {
    const [data, setData] = React.useState(null);
    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const r = await fetch("/api/pool-temp");
                const j = await r.json();
                if (alive)
                    setData(j);
            }
            catch (e) {
                if (alive)
                    setData({
                        ok: false,
                        error: e instanceof Error ? e.message : "Network error",
                    });
            }
        })();
        return () => {
            alive = false;
        };
    }, []);
    if (!data)
        return _jsx("div", { role: "status", children: "Pool: henter\u2026" });
    if (!data.ok)
        return _jsxs("div", { role: "status", children: ["Pool: ", data.error] });
    return (_jsxs("div", { "aria-live": "polite", style: card, children: [_jsx("div", { style: label, children: "Pool" }), _jsxs("div", { style: value, children: [data.celsius.toFixed(1), "\u00B0C"] }), _jsxs("div", { style: hint, children: ["opdateret ", new Date(data.updatedAt).toLocaleTimeString()] })] }));
}
/** Lille inline-styling – byt evt. til CSS module */
const card = {
    display: "inline-grid",
    gap: 2,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    background: "#fff",
    minWidth: 120,
};
const label = {
    fontSize: 12,
    color: "#666",
    fontWeight: 700,
};
const value = {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.1,
};
const hint = { fontSize: 11, color: "#888" };
