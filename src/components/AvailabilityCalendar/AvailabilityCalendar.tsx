import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ---------- API typer ---------- */
type ApiEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO
  end: string; // ISO
  allDay?: boolean;
};
type ApiResp =
  | { ok: true; updatedAt?: string; count?: number; events: ApiEvent[] }
  | { ok: false; error: string };

type Booking = {
  id: string;
  start: Date; // UTC ISO → Date
  end: Date; // checkout
  title: string;
  allDay: boolean;
};

/* ---------- helpers ---------- */
const TZ = "Europe/Copenhagen";

const fmtParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function ymdInTz(d: Date): string {
  const ps = fmtParts.formatToParts(d);
  const y = ps.find((p) => p.type === "year")?.value ?? "0000";
  const m = ps.find((p) => p.type === "month")?.value ?? "00";
  const dd = ps.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function daysBetween(aUtc: Date, bUtc: Date): number {
  // Sammenlign rene datoer (UTC midnat)
  const MS = 24 * 3600 * 1000;
  const a = Date.UTC(
    aUtc.getUTCFullYear(),
    aUtc.getUTCMonth(),
    aUtc.getUTCDate()
  );
  const b = Date.UTC(
    bUtc.getUTCFullYear(),
    bUtc.getUTCMonth(),
    bUtc.getUTCDate()
  );
  return Math.round((b - a) / MS);
}

/** heuristik: filtrér frem rengøring/møder etc. */
function isLikelyStay(e: ApiEvent): boolean {
  if (e.allDay) return true;
  const t = (e.title || "").toLowerCase();
  const vendors = [
    "airbnb",
    "dancenter",
    "sol og strand",
    "campaya",
    "privat",
    "udlejning",
    "reserved",
  ];
  if (vendors.some((v) => t.includes(v))) return true;

  const durH = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 36e5;
  return durH >= 18; // ca. 1 nat
}

function normalizeBookings(events: ApiEvent[]): Booking[] {
  return events
    .filter(isLikelyStay)
    .map((e) => ({
      id: e.id,
      start: new Date(e.start),
      end: new Date(e.end),
      title: e.title || "",
      allDay: !!e.allDay,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** “Airbnb - Fornavn Efternavn” -> “Fornavn” */
function firstNameFromTitle(title: string): string {
  let t = title.trim();
  const dash = t.indexOf("-");
  if (dash >= 0) t = t.slice(dash + 1);
  t = t.replace(/\(.*?\)/g, ""); // fjern parantes
  t = t.replace(/\bairbnb\b/gi, "").trim();
  const word = t.split(/\s+/)[0] || "";
  return word.slice(0, 1).toUpperCase() + word.slice(1);
}

/* ---------- komponent ---------- */
type Props = { lang: Lang; apiUrl?: string };

export default function AvailabilityCalendar({
  lang,
  apiUrl = "/api/ical",
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  // cursor = 1. i måneden (UTC)
  const today = new Date();
  const [cursor, setCursor] = React.useState<Date>(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  );
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let dead = false;
    setLoading(true);
    setErr(null);
    fetch(apiUrl, { headers: { Accept: "application/json" } })
      .then((r) => r.json() as Promise<ApiResp>)
      .then((data) => {
        if (dead) return;
        if (!data.ok) throw new Error("API");
        setBookings(normalizeBookings(data.events));
      })
      .catch(
        () =>
          !dead &&
          setErr(t("Kunne ikke hente kalender.", "Failed to load calendar."))
      )
      .finally(() => !dead && setLoading(false));
    return () => {
      dead = true;
    };
  }, [apiUrl, t]);

  /* ------ grid (6 uger) ------ */
  const y = cursor.getUTCFullYear();
  const m = cursor.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(y, m, 1));
  const dowMon0 = (firstOfMonth.getUTCDay() + 6) % 7; // mandag=0
  const gridStart = addDays(firstOfMonth, -dowMon0);

  type Cell = { ymd: string; inMonth: boolean; day: number };
  const cells: Cell[] = React.useMemo(() => {
    const out: Cell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const inMonth = d.getUTCMonth() === m;
      const parts = fmtParts.formatToParts(d);
      const dayNum = Number(parts.find((p) => p.type === "day")?.value ?? "0");
      out.push({ ymd: ymdInTz(d), inMonth, day: dayNum });
    }
    return out;
  }, [gridStart, m]);

  const monthLabel = new Intl.DateTimeFormat(
    lang === "da" ? "da-DK" : "en-GB",
    {
      timeZone: TZ,
      year: "numeric",
      month: "long",
    }
  ).format(cursor);

  function prevMonth() {
    setCursor(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() - 1, 1))
    );
  }
  function nextMonth() {
    setCursor(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1))
    );
  }

  /* ----- Segmenter pr. uge ----- */
  type WeekSeg = {
    id: string;
    row: number; // 0..5
    colStart: number; // 1..7
    colEnd: number; // 2..8 (exclusive)
    isFirst: boolean; // første uge af bookingen
    isLast: boolean; // sidste uge af bookingen
    label: string; // fornavn (kun vist på første uge-del)
  };

  const weekSegs: WeekSeg[] = React.useMemo(() => {
    if (!bookings) return [];

    const segs: WeekSeg[] = [];
    for (const b of bookings) {
      const startIdx = daysBetween(gridStart, b.start); // celleindeks for check-in dato
      const endIdx = daysBetween(gridStart, b.end); // celleindeks for check-out dato

      if (endIdx < 0 || startIdx > 41) continue; // helt udenfor

      const clampS = Math.max(0, startIdx);
      const clampE = Math.min(41, endIdx);

      let i = clampS;
      while (i <= clampE) {
        const week = Math.floor(i / 7);
        const weekEndIdx = week * 7 + 6;

        const segStart = i;
        const segEnd = Math.min(clampE, weekEndIdx);

        segs.push({
          id: `${b.id}:${week}`,
          row: week,
          colStart: (segStart % 7) + 1,
          colEnd: (segEnd % 7) + 2, // exclusive
          isFirst: segStart === startIdx,
          isLast: segEnd === endIdx,
          label: firstNameFromTitle(b.title),
        });

        i = segEnd + 1;
      }
    }
    return segs;
  }, [bookings, gridStart]);

  /* ----- Gør uge-segmenter til visuelle “stykker” ----- */
  type Piece = {
    key: string;
    row: number;
    colStart: number;
    colEnd: number;
    kind: "start" | "mid" | "end" | "full";
    showLabel: boolean;
    label?: string;
  };

  const pieces: Piece[] = React.useMemo(() => {
    const out: Piece[] = [];
    for (const s of weekSegs) {
      const len = s.colEnd - s.colStart; // kolonner i denne uge-del

      // Booking helt inden for én uge
      if (s.isFirst && s.isLast) {
        if (len === 1) {
          // (edge case: check-in=check-out samme dato)
          out.push({
            key: `${s.id}:one`,
            row: s.row,
            colStart: s.colStart,
            colEnd: s.colEnd,
            kind: "full",
            showLabel: true,
            label: s.label,
          });
        } else {
          // start-halv
          out.push({
            key: `${s.id}:start`,
            row: s.row,
            colStart: s.colStart,
            colEnd: s.colStart + 1,
            kind: "start",
            showLabel: true,
            label: s.label,
          });
          // midterstykke hvis > 2 kolonner
          if (len > 2) {
            out.push({
              key: `${s.id}:mid`,
              row: s.row,
              colStart: s.colStart + 1,
              colEnd: s.colEnd - 1,
              kind: "mid",
              showLabel: false,
            });
          }
          // slut-halv
          out.push({
            key: `${s.id}:end`,
            row: s.row,
            colStart: s.colEnd - 1,
            colEnd: s.colEnd,
            kind: "end",
            showLabel: false,
          });
        }
        continue;
      }

      // Første uge-del
      if (s.isFirst) {
        // start-halv i første celle
        out.push({
          key: `${s.id}:start`,
          row: s.row,
          colStart: s.colStart,
          colEnd: Math.min(s.colStart + 1, s.colEnd),
          kind: "start",
          showLabel: true,
          label: s.label,
        });
        // resten fuld bredde
        if (s.colStart + 1 < s.colEnd) {
          out.push({
            key: `${s.id}:full-after-start`,
            row: s.row,
            colStart: s.colStart + 1,
            colEnd: s.colEnd,
            kind: "full",
            showLabel: false,
          });
        }
        continue;
      }

      // Sidste uge-del
      if (s.isLast) {
        // fuld bredde frem til sidste celle
        if (s.colStart < s.colEnd - 1) {
          out.push({
            key: `${s.id}:full-before-end`,
            row: s.row,
            colStart: s.colStart,
            colEnd: s.colEnd - 1,
            kind: "full",
            showLabel: false,
          });
        }
        // slut-halv i sidste celle
        out.push({
          key: `${s.id}:end`,
          row: s.row,
          colStart: Math.max(s.colEnd - 1, s.colStart),
          colEnd: s.colEnd,
          kind: "end",
          showLabel: false,
        });
        continue;
      }

      // Midt-uge-del (hverken første eller sidste) – fuld bredde
      out.push({
        key: `${s.id}:full`,
        row: s.row,
        colStart: s.colStart,
        colEnd: s.colEnd,
        kind: "full",
        showLabel: false,
      });
    }
    return out;
  }, [weekSegs]);

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <button
          className={styles.nav}
          onClick={prevMonth}
          aria-label={t("Forrige måned", "Previous month")}
        >
          ‹
        </button>
        <div className={styles.title}>{monthLabel}</div>
        <button
          className={styles.nav}
          onClick={nextMonth}
          aria-label={t("Næste måned", "Next month")}
        >
          ›
        </button>
      </div>

      <div className={styles.dowGrid}>
        {(lang === "da"
          ? ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        ).map((d) => (
          <div key={d} className={styles.dow}>
            {d}.
          </div>
        ))}
      </div>

      <div className={styles.cellsWrap}>
        <div className={styles.cellsGrid}>
          {cells.map((c) => (
            <div
              key={c.ymd}
              className={`${styles.cell} ${c.inMonth ? "" : styles.dim}`}
            >
              <span className={styles.day}>{c.day}</span>
            </div>
          ))}
        </div>

        {/* overlayede piller */}
        <div className={styles.eventsGrid} aria-hidden="true">
          {pieces.map((p) => (
            <div
              key={p.key}
              className={[
                styles.pill,
                p.kind === "start" ? styles.pillStart : "",
                p.kind === "end" ? styles.pillEnd : "",
              ].join(" ")}
              style={{
                gridRow: p.row + 1,
                gridColumn: `${p.colStart} / ${p.colEnd}`,
              }}
            >
              {p.showLabel && (
                <>
                  <span className={styles.avatar}>
                    {(p.label || "?").slice(0, 1).toLowerCase()}
                  </span>
                  <span className={styles.label}>{p.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {!bookings && loading && (
        <div className={styles.note}>{t("Indlæser…", "Loading…")}</div>
      )}
      {err && <div className={styles.err}>{err}</div>}
    </div>
  );
}
