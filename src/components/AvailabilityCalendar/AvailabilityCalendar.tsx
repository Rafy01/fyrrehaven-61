import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ─── Types ─── */
type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  status: string;
  transp: string;
};
type ApiResponse =
  | { ok: true; updatedAt?: string; count?: number; events: ApiEvent[] }
  | { ok: false; error: string; detail?: string };

type Booking = {
  id: string;
  startDay: Date; // local midnight (check-in day)
  endDay: Date; // local midnight (check-out day, exclusive)
};

type Segment = {
  id: string;
  row: number; // 0..4
  colStart: number; // 1..7
  colEnd: number; // 2..8 (8 = end-of-week)
  isFirst: boolean;
  isLast: boolean;
  labelHere: boolean;
};

type Props = {
  lang: Lang;
  apiPath?: string; // default "/api/ical"
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun .. 6=Sat
};

/* ─── Date utils ─── */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function clampDate(x: Date, lo: Date, hi: Date): Date {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
function startOfWeek(d: Date, weekStartsOn: number): Date {
  const sd = startOfDay(d);
  const w = sd.getDay(); // 0..6, 0=Sun
  const diff = (w - weekStartsOn + 7) % 7;
  return addDays(sd, -diff);
}
function formatMonthTitle(d: Date, lang: Lang): string {
  return d.toLocaleDateString(lang === "da" ? "da-DK" : "en-GB", {
    month: "long",
    year: "numeric",
  });
}

/** ISO-uge (ISO 8601, mandag=uge-start). Behold weekStartsOn=1 for korrekt ISO. */
function getISOWeek(d: Date): number {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7; // 1..7, hvor 1=Mon
  dt.setUTCDate(dt.getUTCDate() + 4 - day); // til torsdag i samme uge
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const diffDays =
    Math.floor((dt.getTime() - yearStart.getTime()) / 86400000) + 1;
  return Math.ceil(diffDays / 7);
}

/* ─── API → bookings ─── */
function looksLikeBooking(ev: ApiEvent): boolean {
  const t = ev.title.toLowerCase();

  const positive =
    t.includes("airbnb") ||
    t.includes("dancenter") ||
    t.includes("campaya") ||
    t.includes("sol og strand") ||
    t.includes("udlejning") ||
    t.includes("privat") ||
    t.includes("reserved") ||
    t.includes("not available");

  if (!positive) return false;

  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const durMs = end.getTime() - start.getTime();

  if (!ev.allDay && durMs < 20 * 3600 * 1000) return false; // short meeting

  const neg =
    t.includes("rengøring") ||
    t.includes("rengoring") ||
    t.includes("møde") ||
    t.includes("meeting") ||
    t.includes("fotograf") ||
    t.includes("levering");

  return !neg;
}
function toBooking(ev: ApiEvent): Booking {
  const s = startOfDay(new Date(ev.start));
  const e = startOfDay(new Date(ev.end)); // exclusive
  return { id: ev.id, startDay: s, endDay: e };
}
function normalizeBookingsFromApi(payload: ApiResponse): Booking[] {
  if (!("ok" in payload) || !payload.ok) return [];
  const bs: Booking[] = [];
  for (const ev of payload.events ?? []) {
    if (!looksLikeBooking(ev)) continue;
    const b = toBooking(ev);
    if (b.endDay > b.startDay) bs.push(b);
  }
  bs.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
  return bs;
}

/* ─── Segments ─── */
function splitIntoSegments(
  b: Booking,
  gridStart: Date,
  weeks: number
): Segment[] {
  const gridEnd = addDays(gridStart, weeks * 7); // exclusive
  const visStart = clampDate(b.startDay, gridStart, gridEnd);
  const visEnd = clampDate(b.endDay, gridStart, gridEnd);
  if (visStart >= visEnd) return [];

  const firstIx = daysBetween(gridStart, visStart);
  const lastIxEx = daysBetween(gridStart, visEnd);

  const segs: Segment[] = [];
  let cursor = firstIx;

  const endColLine = (ixEx: number): number => {
    const mod = ixEx % 7;
    return mod === 0 ? 8 : mod + 1;
  };

  while (cursor < lastIxEx) {
    const row = Math.floor(cursor / 7); // 0..4
    const rowEndEx = (row + 1) * 7;

    const segStartIx = cursor;
    const segEndIx = Math.min(lastIxEx, rowEndEx);

    segs.push({
      id: `${b.id}:${row}:${segStartIx}-${segEndIx}`,
      row,
      colStart: (segStartIx % 7) + 1,
      colEnd: endColLine(segEndIx),
      isFirst: segStartIx === firstIx,
      isLast: segEndIx === lastIxEx,
      labelHere: segStartIx === firstIx,
    });

    cursor = segEndIx;
  }
  return segs;
}

/* ─── Component ─── */
type CSSVars = React.CSSProperties & { ["--weeks"]?: number };

export default function AvailabilityCalendar({
  lang,
  apiPath = "/api/ical",
  weekStartsOn = 1, // Monday
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const today = startOfDay(new Date());
  const minMonth = startOfMonth(today);

  const WEEKS = 5;
  const WEEKNUM_COL = 40; // px – bredde til uge-kolonnen

  const [monthBase, setMonthBase] = React.useState<Date>(minMonth);
  const gridStart = React.useMemo(
    () => startOfWeek(startOfMonth(monthBase), weekStartsOn),
    [monthBase, weekStartsOn]
  );

  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    (async () => {
      setError(null);
      try {
        const res = await fetch(apiPath, { signal: ctrl.signal });
        if (!res.ok) throw new Error(res.statusText);
        const json = (await res.json()) as ApiResponse;

        const all = normalizeBookingsFromApi(json);
        const filtered = all.filter((b) => b.endDay >= today);
        if (!alive) return;
        setBookings(filtered);
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message || "Fetch error");
        setBookings([]);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [apiPath, today]);

  const canPrev = React.useMemo(() => {
    return startOfMonth(monthBase).getTime() > startOfMonth(minMonth).getTime();
  }, [monthBase, minMonth]);

  function prevMonth() {
    if (!canPrev) return;
    setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function nextMonth() {
    setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  // cells (5 weeks)
  const weekStarts: Date[] = React.useMemo(
    () => Array.from({ length: WEEKS }, (_, r) => addDays(gridStart, r * 7)),
    [gridStart]
  );

  const cells: Date[][] = React.useMemo(
    () =>
      weekStarts.map((ws) =>
        Array.from({ length: 7 }, (_, i) => addDays(ws, i))
      ),
    [weekStarts]
  );

  // segments
  const segments = React.useMemo(() => {
    if (!bookings) return [];
    const segs: Segment[] = [];
    for (const b of bookings)
      segs.push(...splitIntoSegments(b, gridStart, WEEKS));
    return segs;
  }, [bookings, gridStart]);

  const monthTitle = formatMonthTitle(monthBase, lang);
  const reservedLabel = t("Reserveret", "Reserved");

  // Weekday labels rotated from Sun..Sat base
  const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const WD_DA = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
  const wd = (lang === "da" ? WD_DA : WD_EN)
    .slice(weekStartsOn)
    .concat((lang === "da" ? WD_DA : WD_EN).slice(0, weekStartsOn));

  const weekColTemplate = `${WEEKNUM_COL}px repeat(7, 1fr)`;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prevMonth}
          disabled={!canPrev}
          aria-label={t("Forrige måned", "Previous month")}
        >
          ‹
        </button>
        <div className={styles.month}>{monthTitle}</div>
        <button
          type="button"
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label={t("Næste måned", "Next month")}
        >
          ›
        </button>
      </div>

      <div
        className={styles.grid}
        style={
          {
            ["--weeks"]: WEEKS,
            gridTemplateColumns: weekColTemplate, // ← ekstra uge-kolonne
          } as CSSVars
        }
      >
        {/* Week header row (først uge-etiket, så 7 hverdage) */}
        <div className={styles.weeknumHead} aria-hidden="true" />
        {wd.map((label) => (
          <div key={label} className={styles.weekday}>
            {label}
          </div>
        ))}

        {/* 5 rækker: uge-nummer + 7 dato-celler */}
        {weekStarts.map((ws, r) => {
          const iso = getISOWeek(ws);
          return (
            <React.Fragment key={`row-${r}-${iso}`}>
              {/* uge-nummer-celle */}
              <div className={styles.weeknumCell} aria-label={`Uge ${iso}`}>
                {iso}
              </div>

              {/* 7 datoer i ugen */}
              {cells[r].map((d) => {
                const isToday = d.getTime() === today.getTime();
                const inMonth = d.getMonth() === monthBase.getMonth();
                return (
                  <div
                    key={d.toISOString()}
                    className={styles.cell}
                    data-dim={!inMonth ? "1" : undefined}
                    data-today={isToday ? "1" : undefined}
                  >
                    <div className={styles.dayNum}>{d.getDate()}</div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Bars layer – nu med 8 kolonner (uge + 7 dage) */}
        <div
          className={styles.bars}
          style={{ gridTemplateColumns: weekColTemplate }}
        >
          {segments.map((s) => (
            <div
              key={s.id}
              className={styles.bar}
              style={{
                gridRow: s.row + 1, // samme række
                gridColumn: `${s.colStart + 1} / ${s.colEnd + 1}`, // +1 pga. uge-kolonnen
              }}
            >
              {s.labelHere && (
                <span className={styles.barLabel}>{reservedLabel}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!bookings && (
        <div className={styles.loading}>{t("Henter…", "Loading…")}</div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
