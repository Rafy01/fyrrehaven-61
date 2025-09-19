import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Helmet } from "react-helmet-async";
import styles from "./ChatDebug.module.css";
function fmtDate(ts) {
    try {
        const d = new Date(ts);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${dd} ${hh}:${mm}`;
    }
    catch {
        return String(ts);
    }
}
function toCSV(rows) {
    const header = ["id", "lang", "ts_iso", "page", "done", "question"];
    const lines = rows.map((r) => {
        const fields = [
            r.id,
            r.lang,
            new Date(r.ts).toISOString(),
            r.page || "",
            r.done ? "1" : "0",
            r.q,
        ];
        return fields.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",");
    });
    return [header.join(","), ...lines].join("\n");
}
export default function ChatDebug() {
    const [all, setAll] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [onlyOpen, setOnlyOpen] = React.useState(false);
    const [langFilter, setLangFilter] = React.useState("all");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;
    async function load() {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("limit", "500");
            if (langFilter !== "all")
                params.set("lang", langFilter);
            if (onlyOpen)
                params.set("onlyOpen", "1");
            if (search.trim())
                params.set("q", search.trim());
            const res = await fetch(`/api/chat-unknown?${params.toString()}`, {
                headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setAll(Array.isArray(json.items) ? json.items : []);
        }
        catch (e) {
            setError(String(e instanceof Error ? e.message : e));
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => {
        // første load
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    React.useEffect(() => {
        // reload ved filter-ændring
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [langFilter, onlyOpen]);
    const q = search.trim().toLowerCase();
    const filtered = all
        .filter((r) => (q ? r.q.toLowerCase().includes(q) : true))
        .sort((a, b) => b.ts - a.ts);
    function exportCSV() {
        const csv = toCSV(filtered);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-unknowns-sheets-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    async function toggleDone(id) {
        try {
            const res = await fetch(`/api/chat-unknown`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
                },
                body: JSON.stringify({ id }),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            load();
        }
        catch (e) {
            alert(String(e instanceof Error ? e.message : e));
        }
    }
    async function remove(id) {
        if (!confirm("Slet denne række i arket?"))
            return;
        try {
            const res = await fetch(`/api/chat-unknown?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: ADMIN_TOKEN
                    ? { Authorization: `Bearer ${ADMIN_TOKEN}` }
                    : {},
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            load();
        }
        catch (e) {
            alert(String(e instanceof Error ? e.message : e));
        }
    }
    function emailAll() {
        const to = "kontakt@fyrrehaven-61.dk";
        const subject = `Ukendte chatspørgsmål (${filtered.length}) – Sheets`;
        const body = filtered
            .map((r, i) => `${i + 1}. [${r.lang}] ${fmtDate(r.ts)}\n${r.q}\n${r.page || ""}\n`)
            .join("\n") || "(ingen)";
        const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = href;
    }
    return (_jsxs("div", { className: styles.page, children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Chat \u00B7 Admin debug" }), _jsx("meta", { name: "robots", content: "noindex" })] }), _jsxs("header", { className: styles.header, children: [_jsx("h1", { className: styles.title, children: "Chat \u00B7 Ukendte sp\u00F8rgsm\u00E5l" }), _jsxs("div", { className: styles.toolbar, children: [_jsx("input", { className: styles.search, type: "search", placeholder: "S\u00F8g i sp\u00F8rgsm\u00E5l\u2026", value: search, onChange: (e) => setSearch(e.target.value), onKeyDown: (e) => {
                                    if (e.key === "Enter") {
                                        load();
                                    }
                                } }), _jsxs("select", { className: styles.select, value: langFilter, onChange: (e) => setLangFilter(e.target.value), title: "Sprog", children: [_jsx("option", { value: "all", children: "Alle sprog" }), _jsx("option", { value: "da", children: "Dansk" }), _jsx("option", { value: "en", children: "English" })] }), _jsxs("label", { className: styles.chk, children: [_jsx("input", { type: "checkbox", checked: onlyOpen, onChange: (e) => setOnlyOpen(e.target.checked) }), "Kun \u00E5bne"] }), _jsx("button", { className: styles.btn, onClick: () => load(), children: "Opdater" }), _jsx("div", { className: styles.spacer }), _jsx("button", { className: styles.btn, onClick: emailAll, children: "\u00C5bn mail med liste" }), _jsx("button", { className: styles.btn, onClick: exportCSV, children: "Eksport\u00E9r CSV" })] })] }), _jsx("section", { className: styles.listWrap, children: loading ? (_jsx("div", { className: styles.empty, children: "Henter\u2026" })) : error ? (_jsxs("div", { className: styles.errorBox, children: ["Fejl: ", error] })) : filtered.length === 0 ? (_jsx("div", { className: styles.empty, children: "Ingen poster." })) : (_jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { width: "110px" }, children: "Tid" }), _jsx("th", { style: { width: "70px" }, children: "Sprog" }), _jsx("th", { children: "Sp\u00F8rgsm\u00E5l" }), _jsx("th", { children: "Side" }), _jsx("th", { style: { width: "160px" }, children: "Handlinger" })] }) }), _jsx("tbody", { children: filtered.map((r) => (_jsxs("tr", { className: r.done ? styles.done : undefined, children: [_jsx("td", { children: fmtDate(r.ts) }), _jsx("td", { children: r.lang }), _jsx("td", { children: r.q }), _jsx("td", { className: styles.pageCol, children: r.page ? (_jsx("a", { href: r.page, target: "_blank", rel: "noreferrer", children: "\u00C5bn" })) : (_jsx("span", { className: styles.muted, children: "\u2014" })) }), _jsxs("td", { className: styles.actions, children: [_jsx("button", { className: styles.btnGhost, onClick: () => toggleDone(r.id), title: r.done ? "Markér som åben" : "Markér som løst", children: r.done ? "↺ Åbn" : "✓ Løst" }), _jsx("button", { className: styles.btnGhost, onClick: () => {
                                                    navigator.clipboard?.writeText(r.q);
                                                }, title: "Kopi\u00E9r sp\u00F8rgsm\u00E5l", children: "Kopi\u00E9r" }), _jsx("button", { className: styles.btnDanger, onClick: () => remove(r.id), title: "Slet", children: "Slet" })] })] }, r.id))) })] })) })] }));
}
