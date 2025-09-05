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
  startDay: Date; // local midnight (check-in day)
  endDay: Date; // local midnight (check-out day)
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
  const dow = (x.getDay() + 6) % 7; // Mon=0
  return addDays(x, -dow);
}

/* ---------------- API → bookings ---------------- */

/** Normalize events into “bookings” (check-in day → check-out day). */
function toBookings(payload: ApiPayload): Booking[] {
  if (!("ok" in payload) || !payload.ok) return [];
  const events = payload.events ?? [];

  const out: Booking[] = [];
  for (const ev of events) {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;

    const durMs = e.getTime() - s.getTime();
    const spansAtLeastOneDate =
      atMidnightLocal(e).getTime() > atMidnightLocal(s).getTime();

    // Bliv meget mere tolerant: enten ≥8 timer, eller allDay der spænder over mindst én dato
    const looksLikeStay =
      durMs >= 8 * 60 * 60 * 1000 || (ev.allDay && spansAtLeastOneDate);
    if (!looksLikeStay) continue;

    const startDay = atMidnightLocal(s);
    const endDay = atMidnightLocal(e);
    if (endDay.getTime() <= startDay.getTime()) continue;

    out.push({ id: ev.id, startDay, endDay });
  }
  out.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
  return out;
}

/* ---------------- Lay out bars per week (lanes) ---------------- */

type WeekSeg = {
  id: string;
  startCol: number; // 1..7
  endCol: number; // exclusive (1..8)
  halfLeft: boolean;
  halfRight: boolean;
  lane: number; // 0,1,2…
};

function segmentsForWeek(
  weekStart: Date,
  weekEndExclusive: Date,
  bookings: Booking[]
): WeekSeg[] {
  const segs: Omit<WeekSeg, "lane">[] = [];

  for (const b of bookings) {
    const segStart = new Date(
      Math.max(b.startDay.getTime(), weekStart.getTime())
    );
    const segEndExclusive = new Date(
      Math.min(b.endDay.getTime(), weekEndExclusive.getTime())
    );
    if (segEndExclusive.getTime() <= segStart.getTime()) continue;

    const startCol = 1 + daysDiff(segStart, weekStart);
    const endCol = 1 + daysDiff(segEndExclusive, weekStart);

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

  // lane-pakning
  const lanesEnd: number[] = [];
  const withLanes: WeekSeg[] = [];
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
  api?: string; // default: /api/ical
};

export default function AvailabilityCalendar({
  lang,
  api = "/api/ical",
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const [ym, setYm] = React.useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1 };
  });

  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    let alive = true;
    (async (): Promise<void> => {
      setLoading(true);
      try {
        const res = await fetch(api);
        const json = (await res.json()) as ApiPayload;
        if (!alive) return;
        setBookings(toBookings(json));
      } catch {
        if (!alive) return;
        setBookings([]);
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api]);

  // 5 uger (35 celler)
  const { title, days, weekRows } = React.useMemo(() => {
    const monthStart = atMidnightLocal(new Date(ym.y, ym.m - 1, 1));
    const title = monthStart.toLocaleDateString(
      lang === "da" ? "da-DK" : "en-GB",
      {
        month: "long",
        year: "numeric",
      }
    );
    const gridStart = firstMondayOnOrBefore(monthStart);
    const days = Array.from({ length: 35 }, (_, i) => addDays(gridStart, i));
    const weekRows = Array.from({ length: 5 }, (_, w) => ({
      start: addDays(gridStart, w * 7),
      endExclusive: addDays(gridStart, w * 7 + 7),
    }));
    return { title, days, weekRows };
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

  const weekSegs = React.useMemo(() => {
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
        {["Man.", "Tir.", "Ons.", "Tor.", "Fre.", "Lør.", "Søn."].map(
          (s, i) => (
            <div key={i} className={styles.dowCell}>
              {lang === "da"
                ? s
                : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
            </div>
          )
        )}
      </div>

      {[0, 1, 2, 3, 4].map((w) => {
        const rowDays = days.slice(w * 7, w * 7 + 7);
        const segs = weekSegs[w] || [];
        return (
          <div key={w} className={styles.weekRow}>
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

            <div className={styles.overlay}>
              {segs.map((s) => {
                const style: React.CSSProperties = {
                  gridColumn: `${s.startCol} / ${s.endCol}`,
                  transform: `translateY(calc(var(--lane-gap) * ${s.lane}))`,
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

function clipForSeg(s: {
  halfLeft: boolean;
  halfRight: boolean;
}): string | undefined {
  if (!s.halfLeft && !s.halfRight) return undefined;
  if (s.halfLeft && s.halfRight) return "inset(0 50% 0 50%)";
  if (s.halfLeft) return "inset(0 0 0 50%)";
  if (s.halfRight) return "inset(0 50% 0 0)";
  return undefined;
}
