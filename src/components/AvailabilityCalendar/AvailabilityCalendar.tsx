import * as React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ---------------- Types ---------------- */

type ApiEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay?: boolean;
};

type ApiPayload =
  | { ok: true; events: ApiEvent[]; updatedAt?: string }
  | { ok: false; error: string };

type Booking = {
  id: string;
  startDay: Date; // local midnight of check-in day
  endDay: Date; // local midnight of check-out day (same as calendar “date”)
};

/* ---------------- Date helpers ---------------- */

const MS = 24 * 60 * 60 * 1000;

function atMidnightLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function daysDiff(a: Date, b: Date): number {
  // whole-day difference: a - b
  return Math.round(
    (atMidnightLocal(a).getTime() - atMidnightLocal(b).getTime()) / MS
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function firstMondayOnOrBefore(d: Date): Date {
  const x = atMidnightLocal(d);
  const dow = (x.getDay() + 6) % 7; // 0..6 (Mon=0)
  return addDays(x, -dow);
}

/* ---------------- API → bookings ---------------- */

function isLikelyStay(ev: ApiEvent): boolean {
  // Heuristics: real stays are multi-day (>= 18h) and not allDay placeholders.
  const dur = new Date(ev.end).getTime() - new Date(ev.start).getTime();
  if (ev.allDay) return false;
  if (dur < 18 * 60 * 60 * 1000) return false;
  return true;
}

/** Normalize events into “bookings” (check-in day → check-out day). */
function toBookings(payload: ApiPayload): Booking[] {
  if (!("ok" in payload) || !payload.ok) return [];
  const events = payload.events || [];

  const stays = events.filter(isLikelyStay);

  const out: Booking[] = [];
  for (const ev of stays) {
    const s = new Date(ev.start);
    const e = new Date(ev.end);

    // Calendar uses whole days; keep local dates.
    const startDay = atMidnightLocal(s);
    const endDay = atMidnightLocal(e);

    // Guard: ignore nonsense
    if (endDay.getTime() <= startDay.getTime()) continue;

    out.push({ id: ev.id, startDay, endDay });
  }
  // Sort by start
  out.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
  return out;
}

/* ---------------- Lay out bars per week (lanes) ---------------- */

type WeekSeg = {
  id: string;
  // columns are 1..7 within the week grid; endCol is exclusive like CSS grid
  startCol: number;
  endCol: number;
  halfLeft: boolean; // draw from middle of first cell (check-in)
  halfRight: boolean; // end in middle of last cell (check-out)
  lane: number; // vertical lane within the week (0,1,2…)
};

function segmentsForWeek(
  weekStart: Date,
  weekEndExclusive: Date,
  bookings: Booking[]
): WeekSeg[] {
  // Find bookings intersecting [weekStart, weekEnd)
  const segs: Omit<WeekSeg, "lane">[] = [];

  for (const b of bookings) {
    // Booking visually spans from startDay (half-left) to endDay (half-right)
    // Intersect with week
    const segStart = new Date(
      Math.max(b.startDay.getTime(), weekStart.getTime())
    );
    const segEndExclusive = new Date(
      Math.min(b.endDay.getTime(), weekEndExclusive.getTime())
    );

    if (segEndExclusive.getTime() <= segStart.getTime()) continue;

    const startCol = 1 + daysDiff(segStart, weekStart);
    const endCol = 1 + daysDiff(segEndExclusive, weekStart); // exclusive

    const halfLeft = isSameDay(segStart, b.startDay) && segStart >= weekStart;
    const halfRight =
      isSameDay(addDays(segEndExclusive, -1), addDays(b.endDay, -1)) &&
      segEndExclusive <= weekEndExclusive;

    segs.push({
      id: b.id,
      startCol: Math.max(1, startCol),
      endCol: Math.min(8, endCol),
      halfLeft,
      halfRight,
    });
  }

  // Assign lanes greedily to avoid vertical overlap.
  const lanesEnd: number[] = []; // per lane, the last occupied column (exclusive)
  const withLanes: WeekSeg[] = [];

  // Sort by startCol, then width
  segs.sort((a, b) => a.startCol - b.startCol || b.endCol - a.endCol);

  for (const s of segs) {
    let lane = 0;
    for (; lane < lanesEnd.length; lane++) {
      if (s.startCol >= lanesEnd[lane]) break;
    }
    if (lane === lanesEnd.length) lanesEnd.push(s.endCol);
    else lanesEnd[lane] = s.endCol;

    withLanes.push({ ...s, lane });
  }
  return withLanes;
}

/* ---------------- Component ---------------- */

type Props = {
  lang: Lang;
  /** Override API endpoint if needed. Defaults to "/api/ical". */
  api?: string;
};

export default function AvailabilityCalendar({
  lang,
  api = "/api/ical",
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const [ym, setYm] = React.useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1 }; // 1..12
  });

  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(api);
        const json = (await res.json()) as ApiPayload;
        if (alive) {
          setBookings(toBookings(json));
        }
      } catch {
        if (alive) {
          setBookings([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [api]);

  // Build a 5-week (35 cells) grid for the chosen month
  const { title, weeks, weekRows } = React.useMemo(() => {
    const monthStart = atMidnightLocal(new Date(ym.y, ym.m - 1, 1));
    const monthName = monthStart.toLocaleDateString(
      lang === "da" ? "da-DK" : "en-GB",
      {
        month: "long",
        year: "numeric",
      }
    );
    const gridStart = firstMondayOnOrBefore(monthStart);
    const days: Date[] = Array.from({ length: 35 }, (_, i) =>
      addDays(gridStart, i)
    );

    const weeksMeta = Array.from({ length: 5 }, (_, w) => ({
      start: addDays(gridStart, w * 7),
      endExclusive: addDays(gridStart, w * 7 + 7),
    }));

    return { title: monthName, weeks: days, weekRows: weeksMeta };
  }, [ym, lang]);

  const today = atMidnightLocal(new Date());

  function prevMonth() {
    setYm(({ y, m }) => {
      const d = new Date(y, m - 2, 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
  }
  function nextMonth() {
    setYm(({ y, m }) => {
      const d = new Date(y, m, 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
  }

  // Pre-compute week segments
  const allSegs = React.useMemo(() => {
    if (!bookings) return [] as WeekSeg[][];
    return weekRows.map((w) =>
      segmentsForWeek(w.start, w.endExclusive, bookings)
    );
  }, [bookings, weekRows]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          className={styles.nav}
          onClick={prevMonth}
          aria-label={t("Forrige måned", "Previous month")}
        >
          ‹
        </button>
        <div className={styles.month}>{title}</div>
        <button
          className={styles.nav}
          onClick={nextMonth}
          aria-label={t("Næste måned", "Next month")}
        >
          ›
        </button>
      </div>

      <div className={styles.dow}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((s, i) => (
          <div key={i} className={styles.dowCell}>
            {lang === "da"
              ? ["Man.", "Tir.", "Ons.", "Tor.", "Fre.", "Lør.", "Søn."][i]
              : s}
          </div>
        ))}
      </div>

      {/* Five week rows */}
      {[0, 1, 2, 3, 4].map((wIdx) => {
        const rowDays = weeks.slice(wIdx * 7, wIdx * 7 + 7);
        const segs = allSegs[wIdx] || [];
        return (
          <div key={wIdx} className={styles.weekRow}>
            {/* grid of day cells */}
            {rowDays.map((d, i) => {
              const inMonth = d.getMonth() + 1 === ym.m;
              const isTodayFlag = isSameDay(d, today);
              return (
                <div
                  key={i}
                  className={styles.cell}
                  data-dim={!inMonth ? "1" : undefined}
                >
                  <div className={styles.dayN}>
                    {d.getDate()}
                    {isTodayFlag && (
                      <span className={styles.todayDot} aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* overlay bars */}
            <div className={styles.overlay}>
              {segs.map((s) => {
                // CSS grid columns: start / end
                const style: React.CSSProperties = {
                  gridColumn: `${s.startCol} / ${s.endCol}`,
                  transform: `translateY(calc(var(--lane-gap) * ${s.lane}))`,
                  // Use clip-path to create half caps when start/stop falls inside this week
                  clipPath: clipForSeg(s),
                };
                return (
                  <div
                    key={`${s.id}-${s.startCol}-${s.endCol}-${s.lane}`}
                    className={styles.bar}
                    style={style}
                  >
                    <span className={styles.barLabel}>
                      {lang === "da" ? "Reserveret" : "Reserved"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {loading && (
        <div className={styles.loading}>{t("Indlæser…", "Loading…")}</div>
      )}
    </div>
  );
}

/** Half-cap logic via clip-path */
function clipForSeg(s: {
  startCol: number;
  endCol: number;
  halfLeft: boolean;
  halfRight: boolean;
}): string | undefined {
  // full width
  if (!s.halfLeft && !s.halfRight) return undefined;

  // inset(top right bottom left)
  if (s.halfLeft && s.halfRight) {
    // one-day stay entirely inside the week → show “half on both sides”
    return "inset(0 50% 0 50%)";
  }
  if (s.halfLeft) return "inset(0 0 0 50%)";
  if (s.halfRight) return "inset(0 50% 0 0)";
  return undefined;
}
