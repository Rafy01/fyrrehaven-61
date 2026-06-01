import React from "react";
import styles from "./ChatWidget.module.css";
import { chooseLang, type Lang } from "../../lib/lang";
import { SNIPPETS, type Snippet } from "../../data/chat/knowledge";

// Define the Link type if not imported from elsewhere
type Link = {
  labelDa: string;
  labelEn: string;
  labelDe?: string;
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
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);

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

  const chips: string[] = [
    t("Check-in", "Check-in", "Check-in"),
    t("Pool & wellness", "Pool & wellness", "Pool & Wellness"),
    t("Området", "The area", "Das Gebiet"),
    t("El & vand", "Utilities", "Strom & Wasser"),
  ];

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
        const title = chooseLang(
          lang,
          snippet.titleDa,
          snippet.titleEn,
          snippet.titleEn
        );
        const body = chooseLang(
          lang,
          snippet.bodyDa,
          snippet.bodyEn,
          snippet.bodyEn
        );
        const linksBlock =
          (snippet.links ?? []).length > 0
            ? "\n\n" +
              (snippet.links as Link[])
                .map((l: Link) => {
                  const label = chooseLang(
                    lang,
                    l.labelDa,
                    l.labelEn,
                    l.labelDe
                  );
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
                "I don’t know that yet — and I couldn’t save your question. Please try again.",
                "Das weiß ich noch nicht — und ich konnte Ihre Frage nicht speichern. Bitte versuchen Sie es später noch einmal."
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
      const mailSubject = t(
        "Spørgsmål fra chat (ukendt)",
        "Chat question (unknown)",
        "Chatfrage (unbekannt)"
      );
      const mailBody =
        t(
          "Hej Fyrrehaven 61,\n\nJeg har dette spørgsmål fra chatten:\n\n",
          "Hi Fyrrehaven 61,\n\nI have this question from the chat:\n\n",
          "Hallo Fyrrehaven 61,\n\nIch habe diese Frage aus dem Chat:\n\n"
        ) +
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
              {t(
                "Vil du kontakte os direkte?",
                "Want to contact us directly?",
                "Möchten Sie uns direkt kontaktieren?"
              )}
            </div>
            <div className={styles.cardText}>
              {t(
                "Du kan sende spørgsmålet på mail – eller kopiere det til udklipsholderen.",
                "You can send your question by email – or copy it to your clipboard.",
                "Sie können Ihre Frage per E-Mail senden – oder in die Zwischenablage kopieren."
              )}
            </div>
            <div className={styles.btnRow}>
              <a className={styles.ctaBtn} href={mailto}>
                📧 {t("Send pr. mail", "Send email", "Per E-Mail senden")}
              </a>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => {
                  navigator.clipboard?.writeText(m.meta?.q ?? "");
                }}
              >
                📋 {t("Kopiér", "Copy", "Kopieren")}
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
        aria-label={t(
          "Chat med værterne",
          "Chat with hosts",
          "Chat mit den Gastgebern"
        )}
      >
        <div className={styles.head}>
          <div className={styles.title}>
            {lang === "da" ? "Fyrrehaven 61 · Chat" : "Fyrrehaven 61 · Chat"}
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t("Minimer", "Minimize", "Minimieren")}
            onClick={() => setOpen(false)}
            title={t("Minimer", "Minimize", "Minimieren")}
          >
            ▽
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t(
              "Skjul chat helt",
              "Hide chat completely",
              "Chat komplett ausblenden"
            )}
            onClick={() => setHidden(true)}
            title={t(
              "Skjul chat helt",
              "Hide chat completely",
              "Chat komplett ausblenden"
            )}
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
          aria-label={t(
            "Hurtige spørgsmål",
            "Quick questions",
            "Schnelle Fragen"
          )}
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
            placeholder={t(
              "Skriv et spørgsmål…",
              "Ask a question… ",
              "Stellen Sie eine Frage…"
            )}
            aria-label={t("Din besked", "Your message", "Ihre Nachricht")}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
                (
                  e.currentTarget.form as HTMLFormElement | null
                )?.requestSubmit();
              }
            }}
          />
          <button type="submit">{t("Send", "Send", "Senden")}</button>
        </form>
      </div>
    </div>
  );
}
