import React from "react";
import Head from "../../lib/Head";
import { getSeoMeta } from "../../i18n/seo";
import styles from "./ChatDebug.module.css";
import type { Lang } from "../../lib/lang";

export type UnknownItem = {
  id: string;
  q: string;
  lang: Lang;
  page: string;
  ts: number;
  done?: boolean;
};

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
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");

  const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN as string | undefined;
  const seo = getSeoMeta("da", "chat");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (langFilter !== "all") params.set("lang", langFilter);
      if (onlyOpen) params.set("onlyOpen", "1");
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/chat-unknown?${params.toString()}`, {
        headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAll(Array.isArray(json.items) ? json.items : []);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
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

  async function toggleDone(id: string) {
    try {
      const res = await fetch(`/api/chat-unknown`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      load();
    } catch (e: unknown) {
      alert(String(e instanceof Error ? e.message : e));
    }
  }

  async function remove(id: string) {
    if (!confirm("Slet denne række i arket?")) return;
    try {
      const res = await fetch(
        `/api/chat-unknown?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: ADMIN_TOKEN
            ? { Authorization: `Bearer ${ADMIN_TOKEN}` }
            : {},
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      load();
    } catch (e: unknown) {
      alert(String(e instanceof Error ? e.message : e));
    }
  }

  function emailAll() {
    const to = "kontakt@fyrrehaven-61.dk";
    const subject = `Ukendte chatspørgsmål (${filtered.length}) – Sheets`;
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

  return (
    <div className={styles.page}>
      <Head
        lang="da"
        path="/debug/chat"
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        robots={seo.robots}
      />

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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                load();
              }
            }}
          />

          <select
            className={styles.select}
            value={langFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setLangFilter(e.target.value as Lang | "all")
            }
            title="Sprog"
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

          <button className={styles.btn} onClick={() => load()}>
            Opdater
          </button>

          <div className={styles.spacer} />

          <button className={styles.btn} onClick={emailAll}>
            Åbn mail med liste
          </button>
          <button className={styles.btn} onClick={exportCSV}>
            Eksportér CSV
          </button>
        </div>
      </header>

      <section className={styles.listWrap}>
        {loading ? (
          <div className={styles.empty}>Henter…</div>
        ) : error ? (
          <div className={styles.errorBox}>Fejl: {error}</div>
        ) : filtered.length === 0 ? (
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
