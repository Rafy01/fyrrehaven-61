import * as React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ===================== Dates (UTC-safe, Monday-first) ===================== */
const MS_DAY = 24 * 60 * 60 * 1000;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * MS_DAY);

/** Strip time -> UTC date at 00:00 */
function dUTC(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}
function dateOnlyUTC(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dUTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}
function mondayIndex(utcDay: number) {
  // JS: 0=Sun..6=Sat  ->  Mon=0..Sun=6
  return (utcDay + 6) % 7;
}
function startOfMonthGridUTC(y: number, m: number) {
  // first-of-month in UTC
  const first = dUTC(y, m, 1);
  const wd = mondayIndex(first.getUTCDay());
  return addDays(first, -wd); // Monday of that grid
}
function clampDate(d: Date, lo: Date, hi: Date) {
  if (d < lo) return lo;
  if (d > hi) return hi;
  return d;
}
function daysBetween(a: Date, b: Date) {
  return Math.round(
    (dateOnlyUTC(b).getTime() - dateOnlyUTC(a).getTime()) / MS_DAY
  );
}

/* ===================== API & types ===================== */
type ApiEvent = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
};

type ApiPayload =
  | { ok: true; events: ApiEvent[]; updatedAt?: string; count?: number }
  | { ok: false; error: string };

type Booking = {
  id: string;
  startDay: Date; // inclusive (check-in day)
  endDay: Date; // checkout day (exclusive)
};

/** crude detector for bookings vs. chores/meetings */
function isReservationEvent(ev: ApiEvent): boolean {
  const t = (ev.title || "").toLowerCase();
  const d = (ev.description || "").toLowerCase();

  const positive =
    /(airbnb|campaya|dancenter|sol\s*og\s*strand|udlejning|reservation|reserved|privat|not available|familien|oh ?ana)/i.test(
      ev.title
    ) || /(reservation|not available)/i.test(d);

  const negative =
    /(rengøring|rengoering|clean|møde|moede|meeting|fotograf|levering|generalforsamling|refsix|arbejde)/i.test(
      t + " " + d
    );

  if (negative) return false;
  if (positive) return true;

  // fallback: long-ish spans likely a stay
  try {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    return e.getTime() - s.getTime() >= 2 * MS_DAY - 1 * 60 * 60 * 1000; // ~2 days
  } catch {
    return false;
  }
}

/** Normalize API events -> bookings (nights). endDay is checkout (exclusive). */
function toBookings(events: ApiEvent[]): Booking[] {
  const out: Booking[] = [];
  for (const ev of events) {
    if (!isReservationEvent(ev)) continue;

    const s = new Date(ev.start);
    const e = new Date(ev.end);

    const sDay = dateOnlyUTC(s);
    const eDay = dateOnlyUTC(e); // checkout date.

    // Ignore zero/negative spans
    if (daysBetween(sDay, eDay) <= 0) continue;

    out.push({
      id: ev.id,
      startDay: sDay,
      endDay: eDay, // exclusive
    });
  }
  // sort by start
  out.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
  return out;
}

/* Break a booking into week-segments inside visible grid (Mon..Sun rows). */
type Segment = {
  id: string;
  row: number; // 0..4
  colStart: number; // 1..7 (CSS grid columns)
  colEnd: number; // 2..8 (exclusive)
  isFirst: boolean;
  isLast: boolean;
  labelHere: boolean; // place "Reserved/Reserveret" on first visible segment only
};

function splitIntoSegments(b: Booking, gridStart: Date, weeks = 5): Segment[] {
  const gridDays = weeks * 7;
  const gridEnd = addDays(gridStart, gridDays); // exclusive
  // Clip booking to visible grid; note booking endDay is exclusive
  const visStart = clampDate(b.startDay, gridStart, gridEnd);
  const visEnd = clampDate(b.endDay, gridStart, gridEnd);

  if (visStart >= visEnd) return [];

  const firstDayIndex = daysBetween(gridStart, visStart); // 0..34
  const lastDayIndexExclusive = daysBetween(gridStart, visEnd); // 1..35

  const segs: Segment[] = [];

  let cursor = firstDayIndex;
  const endIx = lastDayIndexExclusive;

  while (cursor < endIx) {
    const row = Math.floor(cursor / 7); // 0..4
    const rowStartIx = row * 7;
    const rowEndIxExclusive = rowStartIx + 7;

    const segStartIx = cursor;
    const segEndIx = Math.min(endIx, rowEndIxExclusive);

    segs.push({
      id: `${b.id}:${row}:${segStartIx}-${segEndIx}`,
      row,
      colStart: (segStartIx % 7) + 1, // 1..7
      colEnd: (segEndIx % 7) + 1, // 2..8 (exclusive)
      isFirst: segStartIx === firstDayIndex,
      isLast: segEndIx === lastDayIndexExclusive,
      labelHere: segStartIx === firstDayIndex, // only on first visible segment
    });

    cursor = segEndIx; // next row
  }

  return segs;
}

/* ===================== Component ===================== */
type Props = { lang: Lang };

export default function AvailabilityCalendar({ lang }: Props) {
  // month in UTC
  const now = new Date();
  const [ym, setYm] = React.useState<{ y: number; m: number }>(() => ({
    y: now.getUTCFullYear(),
    m: now.getUTCMonth(),
  }));

  // data
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Try /api/ical first, fallback to /api/ical-events
        const tryFetch = async (url: string) => {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`${r.status}`);
          return (await r.json()) as ApiPayload;
        };

        let payload: ApiPayload;
        try {
          payload = await tryFetch("/api/ical");
          if (!payload.ok) throw new Error("API");
        } catch {
          payload = await tryFetch("/api/ical-events");
        }
        if (!alive) return;

        if (!("ok" in payload) || payload.ok !== true) {
          throw new Error("Bad API payload");
        }
        const b = toBookings(payload.events);
        setBookings(b);
      } catch (e: unknown) {
        const message =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : String(e);
        setError(message);
        setBookings([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const gridStart = startOfMonthGridUTC(ym.y, ym.m); // Monday
  const gridDays = 5 * 7;

  // Prepare segments for visible month
  const segments: Segment[] = React.useMemo(() => {
    if (!bookings) return [];
    const all: Segment[] = [];
    for (const b of bookings) {
      const segs = splitIntoSegments(b, gridStart, 5);
      all.push(...segs);
    }
    return all;
  }, [bookings, gridStart]);

  // Grid cells (5 weeks)
  const cells = Array.from({ length: gridDays }).map((_, i) => {
    const d = addDays(gridStart, i);
    const inMonth = d.getUTCMonth() === ym.m;

    const isToday =
      d.getUTCFullYear() === now.getUTCFullYear() &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate();

    return (
      <div
        key={i}
        className={styles.cell}
        data-dim={!inMonth ? "1" : undefined}
      >
        <div className={styles.dayWrap}>
          <span className={isToday ? styles.todayBadge : styles.dayNum}>
            {d.getUTCDate()}
          </span>
        </div>
      </div>
    );
  });

  const monthFormatter = new Intl.DateTimeFormat(
    lang === "da" ? "da-DK" : "en-GB",
    {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }
  );

  const monthTitle = monthFormatter.format(dUTC(ym.y, ym.m, 1));

  const prevMonth = () => {
    setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  };
  const nextMonth = () => {
    setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  };

  // Weekday headings Mon..Sun
  const wdFmt = new Intl.DateTimeFormat(lang === "da" ? "da-DK" : "en-GB", {
    weekday: "short",
    timeZone: "UTC",
  });
  const monday = dUTC(2024, 0, 1); // Mon 1 Jan 2024 UTC
  const weekHeads = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(monday, i);
    const s = wdFmt.format(d).replace(".", "");
    return (
      <div key={i} className={styles.wd}>
        {s}
      </div>
    );
  });

  const labelText = lang === "da" ? "Reserveret" : "Reserved";

  return (
    <div className={styles.wrap}>
      {/* header */}
      <div className={styles.head}>
        <button
          className={styles.nav}
          onClick={prevMonth}
          aria-label="Prev month"
        >
          ‹
        </button>
        <div className={styles.title}>{monthTitle}</div>
        <button
          className={styles.nav}
          onClick={nextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* week headings */}
      <div className={styles.weekheads}>{weekHeads}</div>

      {/* grid with overlay */}
      <div className={styles.grid}>
        {/* booking bars overlay */}
        <div className={styles.overlay}>
          {segments.map((s) => {
            const style: React.CSSProperties = {
              gridRow: s.row + 1, // 1..5
              gridColumn: `${s.colStart} / ${s.colEnd}`,
              borderTopLeftRadius: s.isFirst ? 12 : 6,
              borderBottomLeftRadius: s.isFirst ? 12 : 6,
              borderTopRightRadius: s.isLast ? 12 : 6,
              borderBottomRightRadius: s.isLast ? 12 : 6,
            };

            return (
              <div key={s.id} className={styles.bar} style={style}>
                {s.labelHere && (
                  <span className={styles.barLabel}>{labelText}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* day cells */}
        {cells}
      </div>

      {/* status */}
      <div className={styles.status}>
        {loading && (
          <span>
            {lang === "da" ? "Henter kalender…" : "Loading calendar…"}
          </span>
        )}
        {!loading && error && (
          <span className={styles.error}>
            {lang === "da"
              ? "Kunne ikke hente kalender"
              : "Failed to load calendar"}
          </span>
        )}
      </div>
    </div>
  );
}
