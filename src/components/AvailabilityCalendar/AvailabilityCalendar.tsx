import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ────────────────────────── Types ────────────────────────── */

type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  status: string;
  transp: string;
};

type ApiResponse =
  | { ok: true; updatedAt?: string; count?: number; events: ApiEvent[] }
  | { ok: false; error: string; detail?: string };

type Booking = {
  id: string;
  /** Lokal dato ved midnat (check-in-dagen). */
  startDay: Date;
  /** Lokal dato ved midnat (check-out-dagen, eksklusiv). */
  endDay: Date;
};

type Segment = {
  id: string;
  row: number; // 0..4
  colStart: number; // 1..7
  colEnd: number; // 2..8 (8 betyder “til slutningen af ugen”)
  isFirst: boolean;
  isLast: boolean;
  labelHere: boolean;
};

type Props = {
  lang: Lang; // "da" | "en"
  /** API-path der returnerer JSON som i dit eksempel. */
  apiPath?: string; // default: "/api/ical"
  /** Uge-start (0=søn … 6=lør). Airbnb-stilen bruger mandag=1. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

/* ────────────────────────── Date utils ────────────────────────── */

// lokal midnat (fjerner klokkeslæt)
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function daysBetween(a: Date, b: Date): number {
  // hele dage fra a til b (b - a)
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
  const w = sd.getDay(); // 0..6, søn=0
  const diff = (w - weekStartsOn + 7) % 7;
  return addDays(sd, -diff);
}
function formatMonthTitle(d: Date, lang: Lang): string {
  return d.toLocaleDateString(lang === "da" ? "da-DK" : "en-GB", {
    month: "long",
    year: "numeric",
  });
}

/* ────────────────────────── API → Bookings ────────────────────────── */

function looksLikeBooking(ev: ApiEvent): boolean {
  // positiv whitelist i titlen
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

  // hold korte “møder” ude
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const durMs = end.getTime() - start.getTime();
  if (!ev.allDay && durMs < 20 * 3600 * 1000) return false; // < 20h

  // udeluk oplagte rengøringer/møder
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
  // vi viser dagsniveau; brug lokal kalenderdag
  const s = startOfDay(new Date(ev.start));
  const e = startOfDay(new Date(ev.end)); // eksklusiv
  return { id: ev.id, startDay: s, endDay: e };
}

function normalizeBookingsFromApi(payload: ApiResponse): Booking[] {
  if (!("ok" in payload) || !payload.ok) return [];
  const events = payload.events ?? [];
  const bs: Booking[] = [];
  for (const ev of events) {
    if (!looksLikeBooking(ev)) continue;
    const b = toBooking(ev);
    if (b.endDay > b.startDay) bs.push(b);
  }
  // sortér efter start
  bs.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
  return bs;
}

/* ────────────────────────── Grid & segments ────────────────────────── */

function splitIntoSegments(
  b: Booking,
  gridStart: Date,
  weeks: number
): Segment[] {
  const gridEnd = addDays(gridStart, weeks * 7); // eksklusiv
  const visStart = clampDate(b.startDay, gridStart, gridEnd);
  const visEnd = clampDate(b.endDay, gridStart, gridEnd);
  if (visStart >= visEnd) return [];

  const firstIx = daysBetween(gridStart, visStart);
  const lastIxEx = daysBetween(gridStart, visEnd);

  const segs: Segment[] = [];
  let cursor = firstIx;

  // kolonnelinje-udregning: 1..7, og 8 = “til slutningen af ugen”
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

/* ────────────────────────── Component ────────────────────────── */

export default function AvailabilityCalendar({
  lang,
  apiPath = "/api/ical",
  weekStartsOn = 1, // mandag
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const today = startOfDay(new Date());
  const minMonth = startOfMonth(today);

  // vi viser 5 uger fast
  const WEEKS = 5;

  // aktuel måned i state (1. dag)
  const [monthBase, setMonthBase] = React.useState<Date>(minMonth);

  const gridStart = React.useMemo(
    () => startOfWeek(startOfMonth(monthBase), weekStartsOn),
    [monthBase, weekStartsOn]
  );

  // data
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function load() {
      setError(null);
      try {
        const res = await fetch(apiPath, { signal: ctrl.signal });
        if (!res.ok) throw new Error(res.statusText);
        const json = (await res.json()) as ApiResponse;

        const all = normalizeBookingsFromApi(json);
        // vis kun igangværende/kommende
        const filtered = all.filter((b) => b.endDay >= today);
        if (!alive) return;
        setBookings(filtered);
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message || "Fetch error");
        setBookings([]);
      }
    }

    load();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [apiPath, today]);

  // navigation: må ikke gå bagud før minMonth
  const canPrev = React.useMemo(() => {
    const a = startOfMonth(monthBase).getTime();
    const b = startOfMonth(minMonth).getTime();
    return a > b;
  }, [monthBase, minMonth]);

  function prevMonth() {
    if (!canPrev) return;
    setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function nextMonth() {
    setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  // celler til 5 uger
  const cells = React.useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < WEEKS * 7; i++) arr.push(addDays(gridStart, i));
    return arr;
  }, [gridStart]);

  // segmenter for vist grid
  const segments = React.useMemo(() => {
    if (!bookings) return [];
    const segs: Segment[] = [];
    for (const b of bookings) {
      segs.push(...splitIntoSegments(b, gridStart, WEEKS));
    }
    return segs;
  }, [bookings, gridStart]);

  const monthTitle = formatMonthTitle(monthBase, lang);
  const reservedLabel = t("Reserveret", "Reserved");

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
        style={{ ["--weeks" as string]: WEEKS } as React.CSSProperties}
      >
        {/* ugedage */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          .slice(weekStartsOn)
          .concat(
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].slice(
              0,
              weekStartsOn
            )
          )
          .map((label) => (
            <div key={label} className={styles.weekday}>
              {lang === "da"
                ? (
                    {
                      Mon: "Man",
                      Tue: "Tir",
                      Wed: "Ons",
                      Thu: "Tor",
                      Fri: "Fre",
                      Sat: "Lør",
                      Sun: "Søn",
                    } as Record<string, string>
                  )[label]
                : label}
            </div>
          ))}

        {/* dato-celler */}
        {cells.map((d) => {
          const isToday = d.getTime() === today.getTime();
          const inMonth = d.getMonth() === monthBase.getMonth();

          return (
            <div
              key={d.toISOString()}
              className={styles.cell}
              data-dim={!inMonth ? "1" : undefined}
            >
              <div
                className={styles.dayNum}
                data-today={isToday ? "1" : undefined}
              >
                {d.getDate()}
                {isToday && <span className={styles.dot} aria-hidden />}
              </div>
            </div>
          );
        })}

        {/* bars-lag */}
        <div className={styles.bars}>
          {segments.map((s) => (
            <div
              key={s.id}
              className={styles.bar}
              style={{
                gridRow: s.row + 2, // +1 for header, +1 fordi grid ligger i samme container
                gridColumn: `${s.colStart} / ${s.colEnd}`,
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
