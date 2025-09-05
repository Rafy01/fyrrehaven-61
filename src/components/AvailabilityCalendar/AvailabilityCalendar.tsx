import * as React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ========== Date helpers (UTC, Mon–Sun) ========== */
const MS_DAY = 24 * 60 * 60 * 1000;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * MS_DAY);
const dUTC = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const dateOnlyUTC = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return dUTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
};
const daysBetween = (a: Date, b: Date) =>
  Math.round((dateOnlyUTC(b).getTime() - dateOnlyUTC(a).getTime()) / MS_DAY);
const mondayIndex = (utcDay: number) => (utcDay + 6) % 7;
function startOfMonthGridUTC(y: number, m: number) {
  const first = dUTC(y, m, 1);
  const wd = mondayIndex(first.getUTCDay());
  return addDays(first, -wd); // Monday before/at month start
}
function clampDate(d: Date, lo: Date, hi: Date) {
  if (d < lo) return lo;
  if (d > hi) return hi;
  return d;
}
function sameYM(a: { y: number; m: number }, b: { y: number; m: number }) {
  return a.y === b.y && a.m === b.m;
}

/* ========== API types ========== */
type ApiEvent = {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO
  end: string; // ISO
  allDay?: boolean;
};
type ApiOk = {
  ok: true;
  events: ApiEvent[];
  updatedAt?: string;
  count?: number;
};
type ApiErr = { ok: false; error: string };
type ApiPayload = ApiOk | ApiErr;

/* ========== Booking model (nætter) ========== */
type Booking = {
  id: string;
  startDay: Date; // check-in dag (inkl.)
  endDay: Date; // check-out dag (ekskl.)
};

function isReservationEvent(ev: ApiEvent): boolean {
  const t = (ev.title || "").toLowerCase();
  const d = (ev.description || "").toLowerCase();
  const positive =
    /(airbnb|campaya|dancenter|sol\s*og\s*strand|udlejning|reservation|reserved|not available|privat|familien|ohana)/i.test(
      t + " " + d
    );
  const negative =
    /(rengøring|rengoering|clean|møde|moede|meeting|fotograf|levering|generalforsamling|refsix|arbejde)/i.test(
      t + " " + d
    );
  if (negative) return false;
  if (positive) return true;

  // fallback: 2+ døgn antages at være et ophold
  try {
    const dur = new Date(ev.end).getTime() - new Date(ev.start).getTime();
    return dur >= 2 * MS_DAY - 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function toBookings(events: ApiEvent[]): Booking[] {
  const out: Booking[] = [];
  for (const ev of events) {
    if (!isReservationEvent(ev)) continue;
    const sDay = dateOnlyUTC(ev.start);
    const eDay = dateOnlyUTC(ev.end); // eksklusiv
    if (daysBetween(sDay, eDay) <= 0) continue;
    out.push({ id: ev.id, startDay: sDay, endDay: eDay });
  }
  out.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
  return out;
}

/* ========== Split til “week segments” ========== */
type Segment = {
  id: string;
  row: number; // 0..4
  colStart: number; // 1..7
  colEnd: number; // 2..8 (exclusive)
  isFirst: boolean;
  isLast: boolean;
  labelHere: boolean; // kun på første synlige segment
};

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
  while (cursor < lastIxEx) {
    const row = Math.floor(cursor / 7);
    const rowEndEx = (row + 1) * 7;
    const segStartIx = cursor;
    const segEndIx = Math.min(lastIxEx, rowEndEx);

    segs.push({
      id: `${b.id}:${row}:${segStartIx}-${segEndIx}`,
      row,
      colStart: (segStartIx % 7) + 1,
      colEnd: (segEndIx % 7) + 1,
      isFirst: segStartIx === firstIx,
      isLast: segEndIx === lastIxEx,
      labelHere: segStartIx === firstIx,
    });

    cursor = segEndIx;
  }
  return segs;
}

/* ========== Component ========== */
type Props = { lang: Lang };

export default function AvailabilityCalendar({ lang }: Props) {
  const now = new Date();
  const nowYM = { y: now.getUTCFullYear(), m: now.getUTCMonth() };

  // Måned kan aldrig gå bagud før nu
  const [ym, setYm] = React.useState<{ y: number; m: number }>(nowYM);

  // data
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const fetchJson = async (url: string): Promise<ApiPayload> => {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return (await r.json()) as ApiPayload;
        };

        let payload: ApiPayload;
        try {
          payload = await fetchJson("/api/ical");
        } catch {
          payload = await fetchJson("/api/ical-events");
        }
        if (!alive) return;
        if (!payload.ok) throw new Error("API returned error");

        // Kun fremtid og igangværende
        const today = dateOnlyUTC(now);
        const all = toBookings(payload.events).filter(
          (b) => b.endDay >= today // inkluder igangværende og fremtid
        );
        setBookings(all);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setBookings([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
    // kun ved mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const WEEKS = 5;
  const gridStart = startOfMonthGridUTC(ym.y, ym.m);
  const gridEnd = addDays(gridStart, WEEKS * 7);

  // Segmenter for synlig periode
  const segments: Segment[] = React.useMemo(() => {
    if (!bookings) return [];
    const list: Segment[] = [];
    for (const b of bookings) {
      // vis kun hvis der er overlap med synlig grid
      if (b.endDay <= gridStart || b.startDay >= gridEnd) continue;
      list.push(...splitIntoSegments(b, gridStart, WEEKS));
    }
    return list;
  }, [bookings, gridStart, gridEnd]);

  // Celler
  const cells = Array.from({ length: WEEKS * 7 }).map((_, i) => {
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

  const monthTitle = new Intl.DateTimeFormat(
    lang === "da" ? "da-DK" : "en-GB",
    {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }
  ).format(dUTC(ym.y, ym.m, 1));

  const onPrev = () => {
    if (sameYM(ym, nowYM)) return; // kan ikke bagud
    setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  };
  const onNext = () =>
    setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  const labelText = lang === "da" ? "Reserveret" : "Reserved";

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          className={styles.nav}
          onClick={onPrev}
          disabled={sameYM(ym, nowYM)}
          aria-label={lang === "da" ? "Forrige måned" : "Previous month"}
        >
          ‹
        </button>
        <div className={styles.title}>{monthTitle}</div>
        <button
          className={styles.nav}
          onClick={onNext}
          aria-label={lang === "da" ? "Næste måned" : "Next month"}
        >
          ›
        </button>
      </div>

      <div className={styles.weekheads}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(dUTC(2024, 0, 1), i); // Mon..Sun labels
          const txt = new Intl.DateTimeFormat(
            lang === "da" ? "da-DK" : "en-GB",
            {
              weekday: "short",
              timeZone: "UTC",
            }
          )
            .format(d)
            .replace(".", "");
          return (
            <div key={i} className={styles.wd}>
              {txt}
            </div>
          );
        })}
      </div>

      <div className={styles.grid}>
        {/* Bars (overlay) */}
        <div className={styles.overlay}>
          {segments.map((s) => {
            const style: React.CSSProperties = {
              gridRow: s.row + 1,
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

        {/* Day cells */}
        {cells}
      </div>

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
