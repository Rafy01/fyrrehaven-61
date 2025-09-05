import React from "react";
import styles from "./AvailabilityCalendar.module.css";

/* ===== Types ===== */
export type Booking = {
  id: string;
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (exclusive)
  guest: string;
  avatarUrl?: string;
};

export type AvailabilityCalendarProps = {
  year: number;
  month: number; // 1-12
  bookings?: Booking[] | Record<string, Booking> | null;
  loadFromIcal?: boolean; // when true → fetch from /api/ical
  weekStartsOn?: 0 | 1; // default 1 (Mon)
  className?: string;
};

/* ===== Date utils ===== */
const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const diffDays = (a: Date, b: Date) => {
  const ms =
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
    Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round(ms / 86400000);
};
function startOfGrid(y: number, m: number, weekStartsOn: 0 | 1) {
  const first = new Date(y, m - 1, 1);
  const dow = first.getDay(); // 0..6 (Sun..Sat)
  const shift = (dow - weekStartsOn + 7) % 7;
  return addDays(first, -shift);
}

type DayCell = { iso: string; date: Date; inMonth: boolean };
function buildGrid(y: number, m: number, weekStartsOn: 0 | 1) {
  const gridStart = startOfGrid(y, m, weekStartsOn);
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    cells.push({ iso: toISO(d), date: d, inMonth: d.getMonth() === m - 1 });
  }
  const weeks: DayCell[][] = [];
  for (let r = 0; r < 6; r++) weeks.push(cells.slice(r * 7, r * 7 + 7));
  return { gridStart, gridEnd: addDays(gridStart, 42), weeks };
}

/* ===== Layout bookings to segments ===== */
type Segment = {
  id: string;
  row: number;
  colStart: number;
  colSpan: number;
  lane: number;
  guest: string;
  avatarUrl?: string;
  startsHere: boolean;
  endsHere: boolean;
};
function normalizeInput(
  input: AvailabilityCalendarProps["bookings"]
): Booking[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") return Object.values(input);
  return [];
}
function layoutSegments(
  y: number,
  m: number,
  weekStartsOn: 0 | 1,
  bookings: Booking[]
) {
  const { gridStart, gridEnd } = buildGrid(y, m, weekStartsOn);
  const segments: Segment[] = [];
  const checkIn = new Set<string>();
  const checkOut = new Set<string>();

  bookings.forEach((b) => {
    checkIn.add(b.start);
    checkOut.add(b.end);
  });

  for (const b of bookings) {
    const s = new Date(b.start + "T00:00:00");
    const e = new Date(b.end + "T00:00:00"); // exclusive
    const sClamp = s < gridStart ? gridStart : s;
    const eClamp = e > gridEnd ? gridEnd : e;

    const dayStart = diffDays(sClamp, gridStart);
    const dayEnd = diffDays(eClamp, gridStart);
    if (dayEnd <= dayStart) continue;

    let cur = dayStart;
    while (cur < dayEnd) {
      const row = Math.floor(cur / 7);
      const rowStart = row * 7;
      const rowEnd = rowStart + 7;
      const segStart = cur;
      const segEnd = Math.min(dayEnd, rowEnd);

      segments.push({
        id: `${b.id}:${row}`,
        row,
        colStart: segStart - rowStart,
        colSpan: Math.max(1, segEnd - segStart),
        lane: 0,
        guest: b.guest,
        avatarUrl: b.avatarUrl,
        startsHere: segStart === dayStart,
        endsHere: segEnd === dayEnd,
      });

      cur = segEnd;
    }
  }

  // lane allocation
  const byRow = new Map<number, Segment[]>();
  segments.forEach((s) => {
    if (!byRow.has(s.row)) byRow.set(s.row, []);
    byRow.get(s.row)!.push(s);
  });
  byRow.forEach((rowSegs) => {
    rowSegs.sort((a, b) => a.colStart - b.colStart || b.colSpan - a.colSpan);
    const lanes: Segment[][] = [];
    rowSegs.forEach((seg) => {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        const last = lanes[i][lanes[i].length - 1];
        if (seg.colStart >= last.colStart + last.colSpan) {
          seg.lane = i;
          lanes[i].push(seg);
          placed = true;
          break;
        }
      }
      if (!placed) {
        seg.lane = lanes.length;
        lanes.push([seg]);
      }
    });
  });

  return { segments, checkIn, checkOut, gridStart, gridEnd };
}

/* ===== Labels ===== */
const WD_DA = ["S", "M", "T", "O", "T", "F", "L"];
const WD_DA_MON = ["M", "T", "O", "T", "F", "L", "S"];

/* ===== Component ===== */
export default function AvailabilityCalendar({
  year,
  month,
  bookings,
  loadFromIcal = false,
  weekStartsOn = 1,
  className,
}: AvailabilityCalendarProps) {
  const [icalBookings, setIcalBookings] = React.useState<Booking[] | null>(
    loadFromIcal ? [] : null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(!!loadFromIcal);

  React.useEffect(() => {
    let cancelled = false;
    async function go() {
      if (!loadFromIcal) return;
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/ical", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        if (!json || !json.ok) throw new Error("Bad JSON");
        if (!cancelled) setIcalBookings(json.bookings ?? []);
      } catch (e) {
        if (!cancelled) setError(String(e instanceof Error ? e.message : e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    go();
    return () => {
      cancelled = true;
    };
  }, [loadFromIcal]);

  const inputBookings =
    loadFromIcal && icalBookings !== null
      ? icalBookings
      : normalizeInput(bookings);

  const { weeks } = buildGrid(year, month, weekStartsOn);
  const { segments, checkIn, checkOut } = React.useMemo(
    () => layoutSegments(year, month, weekStartsOn, inputBookings),
    [year, month, weekStartsOn, inputBookings]
  );

  const wd = weekStartsOn === 1 ? WD_DA_MON : WD_DA;

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.header}>
        <div className={styles.monthLabel}>
          {new Date(year, month - 1, 1).toLocaleDateString("da-DK", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className={styles.weekdays}>
          {wd.map((d, i) => (
            <div key={i} className={styles.wd}>
              {d}
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <div style={{ color: "#b91c1c", fontWeight: 600 }}>
          Fejl ved indlæsning af kalender: {error}
        </div>
      ) : (
        <div className={styles.grid} aria-busy={loading || undefined}>
          {weeks.map((row, r) => (
            <div key={r} className={styles.weekRow}>
              {row.map((cell) => {
                const iso = cell.iso;
                const isIn = checkIn.has(iso);
                const isOut = checkOut.has(iso);

                return (
                  <div
                    key={iso}
                    className={[
                      styles.day,
                      cell.inMonth ? "" : styles.outside,
                    ].join(" ")}
                  >
                    <div className={styles.dayTop}>
                      <span className={styles.dayNum}>
                        {cell.date.getDate()}
                      </span>
                      <div className={styles.markers}>
                        {isIn && (
                          <span
                            className={`${styles.dot} ${styles.in}`}
                            title="Check-in"
                          />
                        )}
                        {isOut && (
                          <span
                            className={`${styles.dot} ${styles.out}`}
                            title="Check-out"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className={styles.segsLayer}>
                {segments
                  .filter((s) => s.row === r)
                  .map((s) => (
                    <div
                      key={s.id}
                      className={[
                        styles.seg,
                        s.startsHere ? styles.start : "",
                        s.endsHere ? styles.end : "",
                      ].join(" ")}
                      style={{
                        gridColumn: `${s.colStart + 1} / span ${s.colSpan}`,
                        top: `calc(${s.lane} * (var(--seg-h) + 4px))`,
                      }}
                      title={s.guest}
                    >
                      {s.avatarUrl ? (
                        <img
                          className={styles.avatar}
                          src={s.avatarUrl}
                          alt=""
                        />
                      ) : (
                        <span className={styles.initial}>
                          {s.guest.trim().slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className={styles.segText}>{s.guest}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
