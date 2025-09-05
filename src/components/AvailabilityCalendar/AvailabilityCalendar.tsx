import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ───────── Types ───────── */
type ApiEvent = {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  start: string; // ISO
  end: string; // ISO
  allDay?: boolean;
  status?: string;
  transp?: string;
};


type Booking = {
  start: string; // YYYY-MM-DD (check-in, inkl.)
  end: string; // YYYY-MM-DD (check-out, ekskl.)
  title?: string;
};

/* ───────── Date utils ───────── */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseISODate(s: string): Date {
  // fortolk YYYY-MM-DD som lokal midnat (nem rendering i grid)
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function cmpDate(a: Date, b: Date): number {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return aa - bb;
}

function firstWeekdayMonday(y: number, m: number): number {
  // 0=Mon … 6=Sun
  const d = new Date(y, m, 1).getDay(); // 0=Sun … 6=Sat
  return (d + 6) % 7;
}

/* ───────── API parsing (no any) ───────── */
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function isApiEvent(x: unknown): x is ApiEvent {
  if (!isObject(x)) return false;
  return typeof x.start === "string" && typeof x.end === "string";
}
function looksLikeStay(ev: ApiEvent): boolean {
  const title = (ev.title || "").toLowerCase();
  // frasorter åbenlyse ikke-overnatninger
  if (
    /rengøring|clean|møde|meeting|fotograf|levering|entrepren|bank|nordea|work|arbejde|fest/.test(
      title
    )
  )
    return false;

  const durMs = new Date(ev.end).getTime() - new Date(ev.start).getTime();
  const minStayMs = 20 * 60 * 60 * 1000; // ≥ ~20 timer
  return ev.allDay === true || durMs >= minStayMs;
}
function normalizeBookings(xs: Booking[]): Booking[] {
  // sortér + fjern ugyldige
  const arr = xs
    .filter((b) => {
      const s = parseISODate(b.start);
      const e = parseISODate(b.end);
      return cmpDate(s, e) < 0;
    })
    .sort((a, b) => cmpDate(parseISODate(a.start), parseISODate(b.start)));

  // (valgfrit) merge overlap
  const out: Booking[] = [];
  for (const b of arr) {
    if (out.length === 0) {
      out.push(b);
      continue;
    }
    const last = out[out.length - 1];
    const lastEnd = parseISODate(last.end);
    const curStart = parseISODate(b.start);
    if (cmpDate(curStart, lastEnd) <= 0) {
      // overlap eller rører – forlæng
      if (cmpDate(parseISODate(b.end), lastEnd) > 0) {
        last.end = b.end;
      }
    } else {
      out.push(b);
    }
  }
  return out;
}

function toBookingsFromApi(payload: unknown): Booking[] {
  // { bookings: [...] }
  if (isObject(payload) && Array.isArray(payload.bookings)) {
    const xs = (payload.bookings as unknown[]).flatMap((b) => {
      if (!isObject(b)) return [];
      const s = typeof b.start === "string" ? b.start : null;
      const e = typeof b.end === "string" ? b.end : null;
      if (!s || !e) return [];
      return [{ start: s, end: e } as Booking];
    });
    return normalizeBookings(xs);
  }

  // { ok, updatedAt, count, events: ApiEvent[] }
  if (isObject(payload) && Array.isArray(payload.events)) {
    const events = payload.events as unknown[];
    const out: Booking[] = [];
    for (const raw of events) {
      if (!isApiEvent(raw)) continue;
      if (!looksLikeStay(raw)) continue;

      const s = new Date(raw.start);
      const e = new Date(raw.end);
      if (Number.isNaN(+s) || Number.isNaN(+e)) continue;

      const start = isoDate(s);
      const end = isoDate(e); // checkout (eksklusiv)
      if (cmpDate(parseISODate(start), parseISODate(end)) >= 0) continue;

      out.push({ start, end, title: raw.title });
    }
    return normalizeBookings(out);
  }

  return [];
}

/* ───────── Segmentering pr. uge ───────── */
type Seg = {
  row: number; // uge 0..5
  colStart: number; // 1..7  (grid-column start)
  colEnd: number; // 1..8   (grid-column end)
  isStart: boolean; // er dette segmentets faktiske check-in dag?
  isEnd: boolean; // ender segmentet ved bookingens faktiske check-out-1?
  title?: string;
};

function buildGrid(y: number, m: number) {
  const first = new Date(y, m, 1);
  const firstColMon0 = firstWeekdayMonday(y, m); // 0..6
  const gridStart = addDays(first, -firstColMon0);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
  const gridEnd = addDays(gridStart, 42); // ekskl.

  return { cells, gridStart, gridEnd };
}

function bookingsToSegments(
  bookings: Booking[],
  cells: Date[]
): { segs: Seg[]; checkIn: Set<string>; checkOut: Set<string> } {
  const indexByDate = new Map<string, number>();
  cells.forEach((d, i) => indexByDate.set(isoDate(d), i));

  const checkIn = new Set<string>();
  const checkOut = new Set<string>();
  const segs: Seg[] = [];

  for (const b of bookings) {
    checkIn.add(b.start);
    checkOut.add(b.end);

    // find inklusiv dag-indeks i gridden
    const sIdx = indexByDate.get(b.start) ?? -Infinity; // kan være udenfor
    const eIdxExclusive = indexByDate.get(b.end) ?? Infinity;
    const lastIdx = (eIdxExclusive as number) - 1;

    // Clip til 0..41
    const from = Math.max(0, Math.min(41, sIdx));
    const to = Math.max(0, Math.min(41, lastIdx));
    if (!(from <= 41 && to >= 0 && from <= to)) continue;

    // Uge-for-uge segmenter
    const firstRow = Math.floor(from / 7);
    const lastRow = Math.floor(to / 7);

    for (let row = firstRow; row <= lastRow; row++) {
      const rowStart = row * 7;
      const rowEnd = rowStart + 6;

      const segStartIdx = Math.max(from, rowStart);
      const segEndIdx = Math.min(to, rowEnd);

      const colStart = (segStartIdx % 7) + 1; // 1..7
      const colEnd = (segEndIdx % 7) + 1 + 1; // grid end er ekskl.

      segs.push({
        row,
        colStart,
        colEnd,
        isStart: segStartIdx === sIdx,
        isEnd: segEndIdx === lastIdx,
        title: b.title,
      });
    }
  }

  return { segs, checkIn, checkOut };
}

/* ───────── UI ───────── */
type Props = { lang: Lang };

export default function AvailabilityCalendar({ lang }: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const today = new Date();
  const [ym, setYm] = React.useState<{ y: number; m: number }>({
    y: today.getFullYear(),
    m: today.getMonth(),
  });

  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        const res = await fetch("/api/ical", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: unknown = await res.json();
        const bs = toBookingsFromApi(json);
        if (!cancelled) setBookings(bs);
      } catch (e) {
        if (!cancelled) setErr(String(e instanceof Error ? e.message : e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { cells } = React.useMemo(() => buildGrid(ym.y, ym.m), [ym.y, ym.m]);

  const monthName = new Intl.DateTimeFormat(lang === "da" ? "da-DK" : "en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(ym.y, ym.m, 1));

  const { segs, checkIn, checkOut } = React.useMemo(() => {
    if (!bookings)
      return {
        segs: [] as Seg[],
        checkIn: new Set<string>(),
        checkOut: new Set<string>(),
      };
    return bookingsToSegments(bookings, cells);
  }, [bookings, cells]);

  function prevMonth() {
    setYm((p) => {
      const d = new Date(p.y, p.m, 1);
      d.setMonth(d.getMonth() - 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }
  function nextMonth() {
    setYm((p) => {
      const d = new Date(p.y, p.m, 1);
      d.setMonth(d.getMonth() + 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const weekdayLabels =
    lang === "da"
      ? ["M", "T", "O", "T", "F", "L", "S"]
      : ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <button
          className={styles.navBtn}
          onClick={prevMonth}
          aria-label={t("Forrige måned", "Previous month")}
        >
          ‹
        </button>
        <div className={styles.month}>
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </div>
        <button
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label={t("Næste måned", "Next month")}
        >
          ›
        </button>
      </div>

      <div className={styles.headerGrid}>
        {weekdayLabels.map((w) => (
          <div key={w} className={styles.wd}>
            {w}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Dage */}
        {cells.map((d, i) => {
          const isCurMonth = d.getMonth() === ym.m;
          const ds = isoDate(d);
          const inMark = checkIn.has(ds);
          const outMark = checkOut.has(ds);

          return (
            <div
              key={i}
              className={`${styles.cell} ${isCurMonth ? "" : styles.dim}`}
              aria-label={ds}
            >
              <div className={styles.dayNum}>{d.getDate()}</div>

              {/* Check-in/out-markører i kanten af cellen */}
              <div className={styles.flags}>
                {inMark && (
                  <span
                    className={`${styles.flag} ${styles.in}`}
                    title={t("Check-in", "Check-in")}
                  />
                )}
                {outMark && (
                  <span
                    className={`${styles.flag} ${styles.out}`}
                    title={t("Check-out", "Check-out")}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Booking-segmenter (pile/barer) */}
        {segs.map((s, i) => (
          <div
            key={i}
            className={`${styles.seg} ${s.isStart ? styles.segStart : ""} ${
              s.isEnd ? styles.segEnd : ""
            }`}
            style={
              {
                gridRow: s.row + 1, // rækker er 1..6
                gridColumn: `${s.colStart} / ${s.colEnd}`,
              } as React.CSSProperties
            }
            title={s.title || ""}
          >
            <div className={styles.segBody} />
          </div>
        ))}
      </div>

      {bookings === null && !err && (
        <div className={styles.loading}>
          {t("Henter kalender…", "Loading calendar…")}
        </div>
      )}
      {err && (
        <div className={styles.error}>
          {t("Kunne ikke hente kalenderen:", "Failed to load calendar:")} {err}
        </div>
      )}
    </div>
  );
}
