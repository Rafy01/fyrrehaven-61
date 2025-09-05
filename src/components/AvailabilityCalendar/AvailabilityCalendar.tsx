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
  start: Date; // UTC Date
  end: Date; // UTC Date (checkout)
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

/** heuristik: udlejninger vs. rengøring/møder */
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

  // varighed > 18 timer ≈ mindst 1 nat
  const durH = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 36e5;
  return durH >= 18;
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
  t = t.replace(/\(.*?\)/g, ""); // fjern parantes-info
  t = t.replace(/\bairbnb\b/gi, "").trim();
  const word = t.split(/\s+/)[0] || "";
  // lille “capitalize” hvis alt er lowercase
  return word.slice(0, 1).toUpperCase() + word.slice(1);
}

/* ---------- komponent ---------- */
type Props = { lang: Lang; apiUrl?: string };

export default function AvailabilityCalendar({
  lang,
  apiUrl = "/api/ical",
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const today = new Date();
  const [cursor, setCursor] = React.useState<Date>(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  );
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // hent én gang
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

  /* ----- kalender gitter: 6 uger á 7 dage ----- */
  const y = cursor.getUTCFullYear();
  const m = cursor.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(y, m, 1));
  const dowMon0 = (firstOfMonth.getUTCDay() + 6) % 7; // mandag=0
  const gridStart = addDays(firstOfMonth, -dowMon0);

  type Cell = {
    ymd: string;
    inMonth: boolean;
    day: number;
    week: number;
    dow: number;
  };
  const cells: Cell[] = React.useMemo(() => {
    const out: Cell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const inMonth = d.getUTCMonth() === m;
      const parts = fmtParts.formatToParts(d);
      const dayNum = Number(parts.find((p) => p.type === "day")?.value ?? "0");
      out.push({
        ymd: ymdInTz(d),
        inMonth,
        day: dayNum,
        week: Math.floor(i / 7), // 0..5
        dow: i % 7, // 0..6 (man..søn)
      });
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

  /* ----- pille-segmenter pr. uge ----- */
  type Seg = {
    id: string;
    row: number; // uge (0..5)  -> grid-row: row+1
    colStart: number; // 1..7
    colEnd: number; // 2..8
    isFirst: boolean;
    isLast: boolean;
    label: string; // fornavn
  };

  const segments: Seg[] = React.useMemo(() => {
    if (!bookings) return [];

    const segs: Seg[] = [];
    for (const b of bookings) {

      const startIdx = daysBetween(gridStart, new Date(b.start));
      const endIdx = daysBetween(gridStart, new Date(b.end)); // inkluderer checkout-cellen (vi halvskærer til sidst)

      if (endIdx < 0 || startIdx > 41) continue; // helt udenfor

      const clampedStart = Math.max(0, startIdx);
      const clampedEnd = Math.min(41, endIdx);

      // del op pr. uge
      let i = clampedStart;
      while (i <= clampedEnd) {
        const week = Math.floor(i / 7);
        const weekEndIdx = week * 7 + 6;

        const segStart = i;
        const segEnd = Math.min(clampedEnd, weekEndIdx);

        segs.push({
          id: `${b.id}:${week}`,
          row: week,
          colStart: (segStart % 7) + 1,
          colEnd: (segEnd % 7) + 2,
          isFirst: segStart === startIdx,
          isLast: segEnd === endIdx,
          label: firstNameFromTitle(b.title),
        });

        i = segEnd + 1;
      }
    }
    return segs;
  }, [bookings, gridStart]);

  return (
    <div className={styles.wrap}>
      {/* top-bar */}
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

      {/* ugedage */}
      <div className={styles.dowGrid}>
        {(lang === "da"
          ? ["man", "tirs", "ons", "tors", "fre", "lør", "søn"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        ).map((d) => (
          <div key={d} className={styles.dow}>
            {d}.
          </div>
        ))}
      </div>

      {/* celler + overlayede piller */}
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

        <div className={styles.eventsGrid} aria-hidden="true">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className={styles.seg}
              style={{
                gridRow: seg.row + 1,
                gridColumn: `${seg.colStart} / ${seg.colEnd}`,
              }}
            >
              <div
                className={[
                  styles.pill,
                  seg.isFirst ? styles.pillStart : styles.pillMid,
                  seg.isLast ? styles.pillEnd : styles.pillMid,
                ].join(" ")}
                data-first={seg.isFirst ? "1" : "0"}
                data-last={seg.isLast ? "1" : "0"}
              >
                {/* avatar + fornavn kun på første segment */}
                {seg.isFirst && (
                  <span className={styles.avatar} aria-hidden="true">
                    {seg.label.slice(0, 1).toLowerCase()}
                  </span>
                )}
                {seg.isFirst && (
                  <span className={styles.label}>{seg.label}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className={styles.note}>{t("Indlæser…", "Loading…")}</div>
      )}
      {err && <div className={styles.err}>{err}</div>}
    </div>
  );
}
