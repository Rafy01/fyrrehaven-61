import React from "react";
import styles from "./ChatWidget.module.css";
import type { Lang } from "../../lib/lang";
import { SNIPPETS, type Snippet } from "../../data/chat/knowledge";

// Define the Link type if not imported from elsewhere
type Link = {
  labelDa: string;
  labelEn: string;
  to?: string;
  href?: string;
};

/* -------- helpers -------- */
function rid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function scoreSnippet(qNorm: string, s: Snippet): number {
  const hit = (s.triggers ?? []).some((t: string) =>
    qNorm.includes(normalize(t))
  );
  if (hit) return 0.95;
  const tokens = qNorm.split(/\s+/).filter(Boolean);
  const hay = normalize(
    `${s.titleDa} ${s.titleEn} ${s.bodyDa} ${s.bodyEn} ${(
      s.triggers ?? []
    ).join(" ")}`
  );
  let hits = 0;
  for (const tok of tokens) if (hay.includes(tok)) hits++;
  const coverage = hits / Math.max(tokens.length, 1);
  return 0.6 * coverage;
}

function bestMatch(q: string): { snippet: Snippet | null; confidence: number } {
  const qNorm = normalize(q);
  let best: Snippet | null = null;
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

/* -------- types -------- */
type Msg = {
  id: string;
  role: "user" | "bot" | "card";
  text?: string;
  lang: Lang;
  meta?: {
    snippetId?: string;
    confidence?: number;
    unknownId?: string;
    q?: string;
  };
};

type Props = { lang: Lang };

export default function ChatWidget({ lang }: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const [open, setOpen] = React.useState<boolean>(false);
  const [hidden, setHidden] = React.useState<boolean>(false);
  const [input, setInput] = React.useState<string>("");

  const [msgs, setMsgs] = React.useState<Msg[]>([
    {
      id: rid(),
      role: "bot",
      lang,
      text: t(
        "Hej! Spørg mig om check-in, pool, området eller forbrug.",
        "Hi! Ask me about check-in, the pool, the area or utilities."
      ),
    },
  ]);

  const chips: string[] =
    lang === "da"
      ? ["Check-in", "Pool & wellness", "Området", "El & vand"]
      : ["Check-in", "Pool & wellness", "The area", "Utilities"];

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;

    const userMsg: Msg = { id: rid(), role: "user", text: q, lang };
    setMsgs((m) => [...m, userMsg]);
    setInput("");

    try {
      const { snippet, confidence } = bestMatch(q);

      if (snippet && confidence >= 0.6) {
        const title = lang === "da" ? snippet.titleDa : snippet.titleEn;
        const body = lang === "da" ? snippet.bodyDa : snippet.bodyEn;
        const linksBlock =
          (snippet.links ?? []).length > 0
            ? "\n\n" +
              (snippet.links as Link[])
                .map((l: Link) => {
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
      } else {
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
              text: t(
                "Det ved jeg ikke endnu — jeg giver beskeden videre, så vi kan lære det til næste gang.",
                "I don’t know that yet — I’ll pass it along so we can learn it for next time."
              ),
            },
            {
              id: rid(),
              role: "card",
              lang,
              meta: { unknownId, q },
            },
          ]);
        } catch {
          setMsgs((m) => [
            ...m,
            {
              id: rid(),
              role: "bot",
              lang,
              text: t(
                "Det ved jeg ikke endnu — og jeg kunne ikke gemme dit spørgsmål. Prøv igen om lidt.",
                "I don’t know that yet — and I couldn’t save your question. Please try again."
              ),
            },
          ]);
        }
      }
    } catch {
      setMsgs((m) => [
        ...m,
        {
          id: rid(),
          role: "bot",
          lang,
          text: t(
            "Ups, noget gik galt. Prøv igen om lidt.",
            "Oops, something went wrong. Please try again."
          ),
        },
      ]);
    }
  }

  if (hidden) return null;

  const CONTACT_EMAIL = "kontakt@fyrrehaven-61.dk";

  function renderMessage(m: Msg) {
    if (m.role === "card" && m.meta?.q) {
      const mailSubject =
        lang === "da"
          ? "Spørgsmål fra chat (ukendt)"
          : "Chat question (unknown)";
      const mailBody =
        (lang === "da"
          ? "Hej Fyrrehaven 61,\n\nJeg har dette spørgsmål fra chatten:\n\n"
          : "Hi Fyrrehaven 61,\n\nI have this question from the chat:\n\n") +
        `"${m.meta.q}"\n\n`;

      const mailto = `mailto:${encodeURIComponent(
        CONTACT_EMAIL
      )}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(
        mailBody
      )}`;

      return (
        <div className={styles.msgBot}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              {lang === "da"
                ? "Vil du kontakte os direkte?"
                : "Want to contact us directly?"}
            </div>
            <div className={styles.cardText}>
              {lang === "da"
                ? "Du kan sende spørgsmålet på mail – eller kopiere det til udklipsholderen."
                : "You can send your question by email – or copy it to your clipboard."}
            </div>
            <div className={styles.btnRow}>
              <a className={styles.ctaBtn} href={mailto}>
                📧 {lang === "da" ? "Send pr. mail" : "Send email"}
              </a>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => {
                  navigator.clipboard?.writeText(m.meta?.q ?? "");
                }}
              >
                📋 {lang === "da" ? "Kopiér" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isUser = m.role === "user";
    const text = m.text ?? "";
    // Simpel **bold** og afsnit
    const html = text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "<br/>");
    return (
      <div className={isUser ? styles.msgUser : styles.msgBot}>
        <div
          className={styles.bubble}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      data-open={open ? "1" : "0"}
      aria-live="polite"
    >
      <button
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-label={
          open
            ? lang === "da"
              ? "Luk chat"
              : "Close chat"
            : lang === "da"
            ? "Åbn chat"
            : "Open chat"
        }
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "×" : "💬"}
      </button>

      <div
        className={styles.panel}
        role="dialog"
        aria-label={lang === "da" ? "Chat med værterne" : "Chat with hosts"}
      >
        <div className={styles.head}>
          <div className={styles.title}>
            {lang === "da" ? "Fyrrehaven 61 · Chat" : "Fyrrehaven 61 · Chat"}
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={lang === "da" ? "Minimer" : "Minimize"}
            onClick={() => setOpen(false)}
            title={lang === "da" ? "Minimer" : "Minimize"}
          >
            ▽
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={
              lang === "da" ? "Skjul chat helt" : "Hide chat completely"
            }
            onClick={() => setHidden(true)}
            title={lang === "da" ? "Skjul chat helt" : "Hide chat completely"}
          >
            ✕
          </button>
        </div>

        <div className={styles.messages}>
          {msgs.map((m) => (
            <React.Fragment key={m.id}>{renderMessage(m)}</React.Fragment>
          ))}
        </div>

        <div
          className={styles.chips}
          role="group"
          aria-label={lang === "da" ? "Hurtige spørgsmål" : "Quick questions"}
        >
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.chip}
              onClick={() => setInput(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <form className={styles.inputRow} onSubmit={onSend}>
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            placeholder={
              lang === "da" ? "Skriv et spørgsmål…" : "Ask a question… "
            }
            aria-label={lang === "da" ? "Din besked" : "Your message"}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
                (
                  e.currentTarget.form as HTMLFormElement | null
                )?.requestSubmit();
              }
            }}
          />
          <button type="submit">{lang === "da" ? "Send" : "Send"}</button>
        </form>
      </div>
    </div>
  );
}
