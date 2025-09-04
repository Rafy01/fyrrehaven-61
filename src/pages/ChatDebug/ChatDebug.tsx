// src/pages/ChatDebug/ChatDebug.tsx
import React from "react";
import { Helmet } from "react-helmet-async";
import styles from "./ChatDebug.module.css";
import type { Lang } from "../../lib/lang";

/** Samme struktur som i ChatWidget */
export type UnknownItem = {
  id: string;
  q: string;
  lang: Lang;
  page: string;
  ts: number;
  done?: boolean;
};

const LS_KEY = "chat_unknowns_v1";

function loadUnknowns(): UnknownItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as UnknownItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveUnknowns(list: UnknownItem[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function fmtDate(ts: number): string {
  try {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${dd} ${hh}:${mm}`;
  } catch {
    return String(ts);
  }
}

function toCSV(rows: UnknownItem[]): string {
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
  const [all, setAll] = React.useState<UnknownItem[]>([]);
  const [search, setSearch] = React.useState<string>("");
  const [onlyOpen, setOnlyOpen] = React.useState<boolean>(false);
  const [langFilter, setLangFilter] = React.useState<Lang | "all">("all");

  React.useEffect(() => {
    setAll(loadUnknowns());
  }, []);

  function update(mutator: (xs: UnknownItem[]) => UnknownItem[]) {
    setAll((prev) => {
      const next = mutator(prev);
      saveUnknowns(next);
      return next;
    });
  }

  function toggleDone(id: string) {
    update((xs) => xs.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }
  function remove(id: string) {
    update((xs) => xs.filter((x) => x.id !== id));
  }
  function clearAll() {
    if (confirm("Slet alle ukendte spørgsmål?")) update(() => []);
  }
  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-unknowns-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function emailAll() {
    const to = "kontakt@fyrrehaven-61.dk";
    const subject = `Ukendte chatspørgsmål (${filtered.length})`;
    const body =
      filtered
        .map(
          (r, i) =>
            `${i + 1}. [${r.lang}] ${fmtDate(r.ts)}\n${r.q}\n${r.page || ""}\n`
        )
        .join("\n") || "(ingen)";
    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  const q = search.trim().toLowerCase();
  const filtered = all
    .filter((r) => (langFilter === "all" ? true : r.lang === langFilter))
    .filter((r) => (onlyOpen ? !r.done : true))
    .filter((r) => (q ? r.q.toLowerCase().includes(q) : true))
    .sort((a, b) => b.ts - a.ts);

  return (
    <div className={styles.page}>
      {/* Helmet: noindex, nofollow, noarchive, nosnippet, noimageindex */}
      <Helmet>
        <title>Chat Debug · Admin</title>
        <meta
          name="description"
          content="Intern debug-side for chat (ukendte spørgsmål)."
        />
        <meta
          name="robots"
          content="noindex, nofollow, noarchive, nosnippet, noimageindex"
        />
        <meta
          name="googlebot"
          content="noindex, nofollow, noarchive, nosnippet, noimageindex"
        />
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Chat · Ukendte spørgsmål</h1>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="search"
            placeholder="Søg i spørgsmål…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
          />
          <select
            className={styles.select}
            value={langFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setLangFilter(e.target.value as Lang | "all")
            }
          >
            <option value="all">Alle sprog</option>
            <option value="da">Dansk</option>
            <option value="en">English</option>
          </select>
          <label className={styles.chk}>
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOnlyOpen(e.target.checked)
              }
            />
            Kun åbne
          </label>

          <div className={styles.spacer} />

          <button className={styles.btn} onClick={emailAll}>
            Åbn mail med liste
          </button>
          <button className={styles.btn} onClick={exportCSV}>
            Eksportér CSV
          </button>
          <button className={styles.btnDanger} onClick={clearAll}>
            Tøm alt
          </button>
        </div>
      </header>

      <section className={styles.listWrap}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>Ingen poster.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "110px" }}>Tid</th>
                <th style={{ width: "70px" }}>Sprog</th>
                <th>Spørgsmål</th>
                <th>Side</th>
                <th style={{ width: "160px" }}>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={r.done ? styles.done : undefined}>
                  <td>{fmtDate(r.ts)}</td>
                  <td>{r.lang}</td>
                  <td>{r.q}</td>
                  <td className={styles.pageCol}>
                    {r.page ? (
                      <a href={r.page} target="_blank" rel="noreferrer">
                        Åbn
                      </a>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.actions}>
                    <button
                      className={styles.btnGhost}
                      onClick={() => toggleDone(r.id)}
                      title={r.done ? "Markér som åben" : "Markér som løst"}
                    >
                      {r.done ? "↺ Åbn" : "✓ Løst"}
                    </button>
                    <button
                      className={styles.btnGhost}
                      onClick={() => {
                        navigator.clipboard?.writeText(r.q);
                      }}
                      title="Kopiér spørgsmål"
                    >
                      Kopiér
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => remove(r.id)}
                      title="Slet"
                    >
                      Slet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
