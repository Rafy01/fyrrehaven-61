// src/pages/ChatDebug/ChatDebug.tsx
import React from "react";
import { Helmet } from "react-helmet-async";
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

const TOKEN_KEY = "chat_admin_token";
const API = "/api/chat-unknown";

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
  const [token, setToken] = React.useState<string>(
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_KEY) || ""
      : ""
  );
  const [all, setAll] = React.useState<UnknownItem[]>([]);
  const [search, setSearch] = React.useState<string>("");
  const [onlyOpen, setOnlyOpen] = React.useState<boolean>(false);
  const [langFilter, setLangFilter] = React.useState<Lang | "all">("all");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  function saveToken(v: string) {
    setToken(v);
    try {
      localStorage.setItem(TOKEN_KEY, v);
    } catch { /* empty */ }
  }

  async function fetchAll() {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (onlyOpen) params.set("onlyOpen", "1");
      if (langFilter !== "all") params.set("lang", langFilter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`${API}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      const json = (await res.json()) as { ok: boolean; items: UnknownItem[] };
      setAll((json.items || []).sort((a, b) => b.ts - a.ts));
    } catch (e: unknown) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function toggleDone(id: string, to?: boolean) {
    if (!token) return;
    try {
      const res = await fetch(API, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, done: to }),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      await fetchAll();
    } catch (e: unknown) {
      alert(`Kunne ikke opdatere: ${String(e)}`);
    }
  }
  async function remove(id: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      await fetchAll();
    } catch (e: unknown) {
      alert(`Kunne ikke slette: ${String(e)}`);
    }
  }
  async function clearAll() {
    if (!token) return;
    // eslint-disable-next-line no-alert
    if (!confirm("Slet ALLE ukendte spørgsmål fra serveren?")) return;
    try {
      const res = await fetch(`${API}?all=1`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      await fetchAll();
    } catch (e: unknown) {
      alert(`Kunne ikke tømme: ${String(e)}`);
    }
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

  React.useEffect(() => {
    fetchAll(); // ved mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Chat Debug · Ukendte spørgsmål</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Chat · Ukendte spørgsmål</h1>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="search"
            placeholder="Søg i spørgsmål…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAll()}
          />
          <select
            className={styles.select}
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value as Lang | "all")}
          >
            <option value="all">Alle sprog</option>
            <option value="da">Dansk</option>
            <option value="en">English</option>
          </select>
          <label className={styles.chk}>
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
            />
            Kun åbne
          </label>

          <div className={styles.spacer} />

          <input
            className={styles.token}
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={(e) => saveToken(e.target.value)}
          />
          <button
            className={styles.btn}
            onClick={fetchAll}
            disabled={!token || loading}
          >
            {loading ? "Henter…" : "Opdatér"}
          </button>
          <button
            className={styles.btn}
            onClick={emailAll}
            disabled={!filtered.length}
          >
            Åbn mail med liste
          </button>
          <button
            className={styles.btn}
            onClick={exportCSV}
            disabled={!filtered.length}
          >
            Eksportér CSV
          </button>
          <button
            className={styles.btnDanger}
            onClick={clearAll}
            disabled={!filtered.length}
          >
            Tøm alt
          </button>
        </div>

        {err ? <div className={styles.error}>Fejl: {err}</div> : null}
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
                      onClick={() => toggleDone(r.id, !r.done)}
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
