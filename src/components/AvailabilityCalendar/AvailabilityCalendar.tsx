import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ---------- typer ---------- */

type ApiEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO
  end: string; // ISO
  allDay?: boolean;
  status?: string;
  transp?: string;
};
type ApiResponse = {
  ok: boolean;
  updatedAt: string;
  count?: number;
  events: ApiEvent[];
};

type Booking = {
  id: string;
  start: Date; // faktisk tid
  end: Date; // faktisk tid
  startDay: Date; // kl. 00 lokal
  endDay: Date; // kl. 00 lokal (udtjek-dag)
};

type Slice = {
  id: string;
  startCol: number; // 0..6
  spanDays: number; // antal nætter i denne uge-del
  nibbleRight: boolean; // om baren skal nikke ind i udtjek-dag
};

/* ---------- utils ---------- */

const DAY = 24 * 60 * 60 * 1000;

function atMidnightLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function diffDays(a: Date, b: Date): number {
  const aa = atMidnightLocal(a).getTime();
  const bb = atMidnightLocal(b).getTime();
  return Math.round((aa - bb) / DAY);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function mondayOfWeek(d: Date): Date {
  const wd = (d.getDay() + 6) % 7; // man=0
  return addDays(atMidnightLocal(d), -wd);
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function monthLabel(lang: Lang, d: Date): string {
  return d.toLocaleDateString(lang === "da" ? "da-DK" : "en-GB", {
    month: "long",
    year: "numeric",
  });
}
function dowNames(lang: Lang): string[] {
  const base = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const da = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
  return lang === "da" ? da : base;
}

/* ---------- API → bookings (nætter) ---------- */

function normalizeBookings(payload: ApiResponse): Booking[] {
  const now = new Date();
  const result: Booking[] = [];

  for (const e of payload.events) {
    const s = new Date(e.start);
    const t = new Date(e.end);

    // vis kun kommende eller igangværende
    if (t.getTime() < now.getTime()) continue;

    const sDay = atMidnightLocal(s);
    const eDay = atMidnightLocal(t); // udtjek-dag kl 00
    const nights = diffDays(eDay, sDay);
    if (nights <= 0) continue;

    result.push({
      id: e.id,
      start: s,
      end: t,
      startDay: sDay,
      endDay: eDay, // udtjek-dag (bar slutter dagen før)
    });
  }

  // sortér efter start
  result.sort((a, b) => a.start.getTime() - b.start.getTime());
  return result;
}

/* ---------- komponent ---------- */

type Props = { lang: Lang };

export default function AvailabilityCalendar({ lang }: Props) {
  const today = new Date();
  const [cursor, setCursor] = React.useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  // hent ical-api
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ical");
        const json = (await res.json()) as ApiResponse;
        if (!alive) return;
        setBookings(normalizeBookings(json));
      } catch {
        if (alive) setBookings([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* --- grid med præcis 5 uger (35 dage) fra månedens mandag --- */

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthStartMonday = mondayOfWeek(firstOfMonth);
  const weeks: Date[][] = [];
  for (let w = 0; w < 5; w++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) row.push(addDays(monthStartMonday, w * 7 + d));
    weeks.push(row);
  }

  // Disable tilbage-knap når cursor er før denne måned
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrev = cursor.getTime() > minMonth.getTime();

  function prevMonth() {
    if (!canGoPrev) return;
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }

  /* --- slices pr. uge --- */

  function slicesForWeek(rowStart: Date): Slice[] {
    const rowEnd = addDays(rowStart, 6); // sidste dag i ugen
    const out: Slice[] = [];

    for (const b of bookings) {
      // bar dækker nætter: startDay .. endDay-1
      const sliceStart = new Date(
        Math.max(atMidnightLocal(b.startDay).getTime(), rowStart.getTime())
      );
      const sliceEnd = new Date(
        Math.min(addDays(b.endDay, -1).getTime(), rowEnd.getTime())
      );

      if (sliceEnd < sliceStart) continue;

      const startCol = clamp(diffDays(sliceStart, rowStart), 0, 6);
      const spanDays = diffDays(addDays(sliceEnd, 1), sliceStart); // inkl sidste
      const isLastWeekOfBooking =
        sliceEnd.getTime() === addDays(b.endDay, -1).getTime();

      out.push({
        id: b.id,
        startCol,
        spanDays,
        nibbleRight: isLastWeekOfBooking,
      });
    }

    // simple lane-pakning hvis flere overlapper
    out.sort((a, b) => a.startCol - b.startCol);
    return out;
  }

  /* --- render --- */

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button
          className={styles.navBtn}
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Forrige måned"
          title="Forrige måned"
        >
          ‹
        </button>
        <div className={styles.monthTitle}>{monthLabel(lang, cursor)}</div>
        <button
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label="Næste måned"
          title="Næste måned"
        >
          ›
        </button>
      </div>

      <div className={styles.grid}>
        {dowNames(lang).map((d, i) => (
          <div key={i} className={styles.dow}>
            {d}
          </div>
        ))}

        {weeks.map((row, wi) => {
          const weekStart = row[0];
          const weekSlices = slicesForWeek(weekStart);

          // Hvor mange “baner” behøves (meget sjældent >1)
          const lanes: Slice[][] = [];
          for (const s of weekSlices) {
            let placed = false;
            for (const lane of lanes) {
              const last = lane[lane.length - 1];
              const lastEnd = last.startCol + last.spanDays - 1;
              if (s.startCol > lastEnd) {
                lane.push(s);
                placed = true;
                break;
              }
            }
            if (!placed) lanes.push([s]);
          }

          return (
            <div key={wi} className={styles.week}>
              {/* celler */}
              {row.map((day) => {
                const inMonth = day.getMonth() === cursor.getMonth();
                const isToday =
                  day.getFullYear() === today.getFullYear() &&
                  day.getMonth() === today.getMonth() &&
                  day.getDate() === today.getDate();
                return (
                  <div
                    key={day.toISOString()}
                    className={styles.cell}
                    aria-hidden={!inMonth}
                  >
                    <div
                      className={
                        isToday
                          ? `${styles.dayNum} ${styles.dayNumToday}`
                          : styles.dayNum
                      }
                    >
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}

              {/* lane overlay nederst */}
              <div
                className={styles.laneLayer}
                style={
                  {
                    // reserver højde til alle lanes i denne uge
                    "--lanes": Math.max(lanes.length, 1),
                  } as React.CSSProperties
                }
              >
                <div
                  className={styles.lane}
                  style={
                    {
                      "--lanes": Math.max(lanes.length, 1),
                    } as React.CSSProperties
                  }
                >
                  {lanes.map((lane, li) =>
                    lane.map((s) => {
                      const leftPct = (s.startCol / 7) * 100;
                      const widthPct = (s.spanDays / 7) * 100;
                      const topPx = li * (26 /*bar*/ + 6) /*gap*/;

                      return (
                        <div
                          key={`${s.id}-${wi}-${s.startCol}`}
                          className={`${styles.bar} ${
                            s.nibbleRight ? " " + styles.nibbleRight : ""
                          }`}
                          style={{
                            left: `calc(${leftPct}% + ${s.startCol * 1}px)`, // lille kompensation for gaps
                            width: `calc(${widthPct}% - ${
                              (7 - (s.startCol + s.spanDays)) * 0
                            }px)`,
                            top: topPx,
                          }}
                        >
                          {lang === "da" ? "Reserved" : "Reserved"}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12 }}>
          {lang === "da" ? "Indlæser…" : "Loading…"}
        </div>
      )}
    </div>
  );
}
