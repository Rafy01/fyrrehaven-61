// src/components/AvailabilityCalendar/AvailabilityCalendar.tsx
import React from "react";
import styles from "./AvailabilityCalendar.module.css";

export type Booking = {
  start: string; // ISO dag: "2025-09-05" (check-in, inkl.)
  end: string; // ISO dag: "2025-09-12" (check-out, ekskl.)
  title?: string;
};

type Props = {
  year: number; // fx 2025
  month: number; // 1-12
  weekStartsOn?: 0 | 1; // 0=søndag, 1=mandag (default)
  loadFromIcal?: boolean; // hvis true henter vi /api/ical
  bookings?: Booking[]; // alternativt kan du selv levere bookinger
};

export default function AvailabilityCalendar({
  year,
  month,
  weekStartsOn = 1,
  loadFromIcal = false,
  bookings: bookingsProp,
}: Props) {
  // indre state for navigation
  const [{ y, m }, setYM] = React.useState({ y: year, m: month });

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => setYM({ y: year, m: month }), [year, month]);

  React.useEffect(() => {
    let active = true;
    async function load() {
      if (!loadFromIcal) {
        setBookings(bookingsProp ?? []);
        return;
      }
      setLoading(true);
      try {
        const from = iso(y, m, 1);
        const to = iso(nextYearMonth(y, m).y, nextYearMonth(y, m).m, 1);
        const res = await fetch(`/api/ical?from=${from}&to=${to}`);
        const j = (await res.json()) as { ok: boolean; bookings?: Booking[] };
        if (active && j.ok && j.bookings) setBookings(j.bookings);
      } catch {
        if (active) setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [y, m, loadFromIcal, bookingsProp]);

  const days = buildMonthGrid(y, m, weekStartsOn);
  const perDay = annotateDays(days, bookings);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          className={styles.nav}
          onClick={() => setYM((prev) => prevMonth(prev.y, prev.m))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className={styles.title}>{monthLabel(y, m)}</div>
        <button
          className={styles.nav}
          onClick={() => setYM((prev) => nextMonth(prev.y, prev.m))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className={styles.grid} data-wso={weekStartsOn}>
        {weekdayLabels(weekStartsOn).map((lab) => (
          <div key={lab} className={styles.wd}>
            {lab}
          </div>
        ))}

        {perDay.map((d) => (
          <div
            key={d.key}
            className={styles.cell}
            data-dim={d.inMonth ? "1" : "0"}
          >
            <div className={styles.dayNum}>{d.day}</div>

            {/* 2 tynde striber ved samme-dag check-out & check-in */}
            {d.hasCheckout && d.hasCheckin ? (
              <div className={styles.stack2}>
                <div
                  className={`${styles.mini} ${styles.endCap}`}
                  title="Checkout"
                />
                <div
                  className={`${styles.mini} ${styles.startCap}`}
                  title="Checkin"
                />
              </div>
            ) : d.segment ? (
              <div
                className={
                  d.segment.type === "single"
                    ? `${styles.bar} ${styles.startCap} ${styles.endCap}`
                    : d.segment.type === "start"
                    ? `${styles.bar} ${styles.startCap}`
                    : d.segment.type === "end"
                    ? `${styles.bar} ${styles.endCap}`
                    : styles.bar
                }
                title={d.segment.title ?? ""}
              />
            ) : null}
          </div>
        ))}
      </div>

      {loading && <div className={styles.loading}>Loading…</div>}
    </div>
  );
}

/* ---------- helpers ---------- */

function monthLabel(y: number, m: number): string {
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
function weekdayLabels(wso: 0 | 1): string[] {
  const base = ["S", "M", "T", "O", "T", "F", "L"]; // dansk: Søn-Man…
  if (wso === 1) return base.slice(1).concat(base[0]); // Man først
  return base; // Søndag først
}
function firstWeekday(y: number, m: number) {
  return new Date(y, m - 1, 1).getDay(); // 0=søndag..6=lørdag
}
function buildMonthGrid(y: number, m: number, wso: 0 | 1) {
  const first = firstWeekday(y, m); // 0..6 med søndag=0
  const leading = (first - wso + 7) % 7;
  const cells = 42; // 6 uger, fast grid
  const out: {
    y: number;
    m: number;
    d: number;
    inMonth: boolean;
    key: string;
  }[] = [];
  // start dato som første felt
  const start = new Date(y, m - 1, 1 - leading);
  for (let i = 0; i < cells; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    const inMonth = dt.getMonth() === m - 1;
    out.push({
      y: dt.getFullYear(),
      m: dt.getMonth() + 1,
      d: dt.getDate(),
      inMonth,
      key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(dt.getDate()).padStart(2, "0")}`,
    });
  }
  return out;
}
function iso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function nextMonth(y: number, m: number) {
  const mm = m + 1;
  return mm === 13 ? { y: y + 1, m: 1 } : { y, m: mm };
}
function prevMonth(y: number, m: number) {
  const mm = m - 1;
  return mm === 0 ? { y: y - 1, m: 12 } : { y, m: mm };
}
function nextYearMonth(y: number, m: number) {
  return m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
}

type DaySeg = {
  type: "start" | "mid" | "end" | "single";
  title?: string;
} | null;

function annotateDays(
  cells: ReturnType<typeof buildMonthGrid>,
  bookings: Booking[]
) {
  // lav opslag på datoer (start/end samt fuld interval)
  const map = new Map<
    string,
    {
      hasCheckin: boolean;
      hasCheckout: boolean;
      segment: DaySeg;
    }
  >();

  for (const c of cells) {
    map.set(c.key, { hasCheckin: false, hasCheckout: false, segment: null });
  }

  for (const b of bookings) {
    // event dækker [start, end) — end er eksklusiv
    const start = new Date(`${b.start}T00:00:00Z`);
    const end = new Date(`${b.end}T00:00:00Z`);
    const title = b.title;

    // markér start+slut
    const sKey = b.start;
    const eKey = b.end; // checkout-dag (selve dagen er IKKE inkluderet i udfyldningen)
    if (map.has(sKey)) map.get(sKey)!.hasCheckin = true;
    if (map.has(eKey)) map.get(eKey)!.hasCheckout = true;

    // udfyld alle dage i [start, end)
    for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = toIso(d);
      if (!map.has(key)) continue;
      const isStart = key === b.start;
      const isEndPrev = addDays(end, -1);
      const isEnd = key === isEndPrev;

      map.get(key)!.segment = {
        type:
          isStart && isEnd
            ? "single"
            : isStart
            ? "start"
            : isEnd
            ? "end"
            : "mid",
        title,
      };
    }
  }

  return cells.map((c) => {
    const a = map.get(c.key)!;
    return {
      key: c.key,
      day: c.d,
      inMonth: c.inMonth,
      hasCheckin: a.hasCheckin,
      hasCheckout: a.hasCheckout,
      segment: a.segment,
    };
  });
}
function toIso(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function addDays(d: Date, n: number): string {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return toIso(c);
}
