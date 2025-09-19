import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import styles from "./ChatWidget.module.css";
import { SNIPPETS } from "../../data/chat/knowledge";
/* -------- helpers -------- */
function rid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID)
        return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
const normalize = (s) => s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
function scoreSnippet(qNorm, s) {
    const hit = (s.triggers ?? []).some((t) => qNorm.includes(normalize(t)));
    if (hit)
        return 0.95;
    const tokens = qNorm.split(/\s+/).filter(Boolean);
    const hay = normalize(`${s.titleDa} ${s.titleEn} ${s.bodyDa} ${s.bodyEn} ${(s.triggers ?? []).join(" ")}`);
    let hits = 0;
    for (const tok of tokens)
        if (hay.includes(tok))
            hits++;
    const coverage = hits / Math.max(tokens.length, 1);
    return 0.6 * coverage;
}
function bestMatch(q) {
    const qNorm = normalize(q);
    let best = null;
    let score = 0;
    for (const s of SNIPPETS) {
        const sc = scoreSnippet(qNorm, s);
        if (sc > score) {
            score = sc;
            best = s;
        }
    }
    return { snippet: best, confidence: score };
}
export default function ChatWidget({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const [open, setOpen] = React.useState(false);
    const [hidden, setHidden] = React.useState(false);
    const [input, setInput] = React.useState("");
    const [msgs, setMsgs] = React.useState([
        {
            id: rid(),
            role: "bot",
            lang,
            text: t("Hej! Spørg mig om check-in, pool, området eller forbrug.", "Hi! Ask me about check-in, the pool, the area or utilities."),
        },
    ]);
    const chips = lang === "da"
        ? ["Check-in", "Pool & wellness", "Området", "El & vand"]
        : ["Check-in", "Pool & wellness", "The area", "Utilities"];
    React.useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape")
                setOpen(false);
        }
        if (open)
            window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);
    async function onSend(e) {
        e.preventDefault();
        const q = input.trim();
        if (!q)
            return;
        const userMsg = { id: rid(), role: "user", text: q, lang };
        setMsgs((m) => [...m, userMsg]);
        setInput("");
        try {
            const { snippet, confidence } = bestMatch(q);
            if (snippet && confidence >= 0.6) {
                const title = lang === "da" ? snippet.titleDa : snippet.titleEn;
                const body = lang === "da" ? snippet.bodyDa : snippet.bodyEn;
                const linksBlock = (snippet.links ?? []).length > 0
                    ? "\n\n" +
                        snippet.links
                            .map((l) => {
                            const label = lang === "da" ? l.labelDa : l.labelEn;
                            const url = l.to ?? l.href ?? "#";
                            return `• ${label} → ${url}`;
                        })
                            .join("\n")
                    : "";
                setMsgs((m) => [
                    ...m,
                    {
                        id: rid(),
                        role: "bot",
                        lang,
                        text: `**${title}**\n\n${body}${linksBlock}`,
                        meta: { snippetId: snippet.id, confidence },
                    },
                ]);
            }
            else {
                const page = typeof window !== "undefined" ? window.location.href : "";
                // Kun Google Sheets: POST ukendt
                try {
                    const res = await fetch("/api/chat-unknown", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ q, lang, page }),
                    });
                    const json = await res.json().catch(() => ({}));
                    const unknownId = json?.id || undefined;
                    // Svar + card
                    setMsgs((m) => [
                        ...m,
                        {
                            id: rid(),
                            role: "bot",
                            lang,
                            text: t("Det ved jeg ikke endnu — jeg giver beskeden videre, så vi kan lære det til næste gang.", "I don’t know that yet — I’ll pass it along so we can learn it for next time."),
                        },
                        {
                            id: rid(),
                            role: "card",
                            lang,
                            meta: { unknownId, q },
                        },
                    ]);
                }
                catch {
                    setMsgs((m) => [
                        ...m,
                        {
                            id: rid(),
                            role: "bot",
                            lang,
                            text: t("Det ved jeg ikke endnu — og jeg kunne ikke gemme dit spørgsmål. Prøv igen om lidt.", "I don’t know that yet — and I couldn’t save your question. Please try again."),
                        },
                    ]);
                }
            }
        }
        catch {
            setMsgs((m) => [
                ...m,
                {
                    id: rid(),
                    role: "bot",
                    lang,
                    text: t("Ups, noget gik galt. Prøv igen om lidt.", "Oops, something went wrong. Please try again."),
                },
            ]);
        }
    }
    if (hidden)
        return null;
    const CONTACT_EMAIL = "kontakt@fyrrehaven-61.dk";
    function renderMessage(m) {
        if (m.role === "card" && m.meta?.q) {
            const mailSubject = lang === "da"
                ? "Spørgsmål fra chat (ukendt)"
                : "Chat question (unknown)";
            const mailBody = (lang === "da"
                ? "Hej Fyrrehaven 61,\n\nJeg har dette spørgsmål fra chatten:\n\n"
                : "Hi Fyrrehaven 61,\n\nI have this question from the chat:\n\n") +
                `"${m.meta.q}"\n\n`;
            const mailto = `mailto:${encodeURIComponent(CONTACT_EMAIL)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
            return (_jsx("div", { className: styles.msgBot, children: _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardTitle, children: lang === "da"
                                ? "Vil du kontakte os direkte?"
                                : "Want to contact us directly?" }), _jsx("div", { className: styles.cardText, children: lang === "da"
                                ? "Du kan sende spørgsmålet på mail – eller kopiere det til udklipsholderen."
                                : "You can send your question by email – or copy it to your clipboard." }), _jsxs("div", { className: styles.btnRow, children: [_jsxs("a", { className: styles.ctaBtn, href: mailto, children: ["\uD83D\uDCE7 ", lang === "da" ? "Send pr. mail" : "Send email"] }), _jsxs("button", { type: "button", className: styles.ghostBtn, onClick: () => {
                                        navigator.clipboard?.writeText(m.meta?.q ?? "");
                                    }, children: ["\uD83D\uDCCB ", lang === "da" ? "Kopiér" : "Copy"] })] })] }) }));
        }
        const isUser = m.role === "user";
        const text = m.text ?? "";
        // Simpel **bold** og afsnit
        const html = text
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n\n/g, "<br/>");
        return (_jsx("div", { className: isUser ? styles.msgUser : styles.msgBot, children: _jsx("div", { className: styles.bubble, dangerouslySetInnerHTML: { __html: html } }) }));
    }
    return (_jsxs("div", { className: styles.wrap, "data-open": open ? "1" : "0", "aria-live": "polite", children: [_jsx("button", { type: "button", className: styles.fab, "aria-expanded": open, "aria-label": open
                    ? lang === "da"
                        ? "Luk chat"
                        : "Close chat"
                    : lang === "da"
                        ? "Åbn chat"
                        : "Open chat", onClick: () => setOpen((v) => !v), children: open ? "×" : "💬" }), _jsxs("div", { className: styles.panel, role: "dialog", "aria-label": lang === "da" ? "Chat med værterne" : "Chat with hosts", children: [_jsxs("div", { className: styles.head, children: [_jsx("div", { className: styles.title, children: lang === "da" ? "Fyrrehaven 61 · Chat" : "Fyrrehaven 61 · Chat" }), _jsx("button", { type: "button", className: styles.iconBtn, "aria-label": lang === "da" ? "Minimer" : "Minimize", onClick: () => setOpen(false), title: lang === "da" ? "Minimer" : "Minimize", children: "\u25BD" }), _jsx("button", { type: "button", className: styles.iconBtn, "aria-label": lang === "da" ? "Skjul chat helt" : "Hide chat completely", onClick: () => setHidden(true), title: lang === "da" ? "Skjul chat helt" : "Hide chat completely", children: "\u2715" })] }), _jsx("div", { className: styles.messages, children: msgs.map((m) => (_jsx(React.Fragment, { children: renderMessage(m) }, m.id))) }), _jsx("div", { className: styles.chips, role: "group", "aria-label": lang === "da" ? "Hurtige spørgsmål" : "Quick questions", children: chips.map((c) => (_jsx("button", { type: "button", className: styles.chip, onClick: () => setInput(c), children: c }, c))) }), _jsxs("form", { className: styles.inputRow, onSubmit: onSend, children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), placeholder: lang === "da" ? "Skriv et spørgsmål…" : "Ask a question… ", "aria-label": lang === "da" ? "Din besked" : "Your message", onKeyDown: (e) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
                                        e.currentTarget.form?.requestSubmit();
                                    }
                                } }), _jsx("button", { type: "submit", children: lang === "da" ? "Send" : "Send" })] })] })] }));
}
