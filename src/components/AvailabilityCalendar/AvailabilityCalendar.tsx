import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string | null; // ISO
  end: string | null; // ISO
  allDay: boolean;
  status: string;
  transp: string;
};

type ApiResponse = {
  ok: boolean;
  updatedAt?: string;
  events?: ApiEvent[];
  error?: string;
  detail?: string;
};

export type AvailabilityCalendarProps = {
  lang: Lang;
  apiPath?: string; // default "/api/ical"
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Lav et sæt af “bookede datoer” (yyyy-mm-dd) ud fra events der overlapper dagen. */
function computeBookedDateSet(
  events: ApiEvent[],
  monthStart: Date,
  monthEnd: Date
): Set<string> {
  const set = new Set<string>();
  for (const ev of events) {
    if (!ev.start) continue;
    const s = new Date(ev.start);
    const e = ev.end ? new Date(ev.end) : new Date(s.getTime());
    // Gå dag for dag igennem overlappet interval
    const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    // Hvis ikke allDay og DTEND er eksklusiv, markér også slutdagen ved overnatning:
    const endInclusive = ev.allDay ? last : new Date(last.getTime());
    if (!ev.allDay) {
      // hvis sluttid > 00:00, så markér slutdagen
      if (e.getHours() !== 0 || e.getMinutes() !== 0 || e.getSeconds() !== 0) {
        // ok
      } else {
        // ellers decrement, så “ikke-overnatning” ikke maler slutdagen
        endInclusive.setDate(endInclusive.getDate() - 1);
      }
    }
    // Loop
    while (cur <= endInclusive) {
      if (cur >= monthStart && cur <= monthEnd) {
        set.add(ymd(cur));
      }
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

const WEEKDAYS_DA = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_DA = [
  "Januar",
  "Februar",
  "Marts",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "December",
];
const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AvailabilityCalendar({
  lang,
  apiPath = "/api/ical",
}: AvailabilityCalendarProps) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const wk = lang === "da" ? WEEKDAYS_DA : WEEKDAYS_EN;
  const mo = lang === "da" ? MONTHS_DA : MONTHS_EN;

  const [cursor, setCursor] = React.useState<Date>(() =>
    startOfMonth(new Date())
  );
  const [busy, setBusy] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  React.useEffect(() => {
    // Hent kun månedens interval (lidt buffer er ikke strengt nødvendigt)
    const qs = new URLSearchParams({
      start: monthStart.toISOString(),
      end: new Date(
        monthEnd.getFullYear(),
        monthEnd.getMonth(),
        monthEnd.getDate() + 1
      ).toISOString(),
    }).toString();

    let alive = true;
    setLoading(true);
    setErr(null);

    fetch(`${apiPath}?${qs}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP_${r.status}`);
        const data = (await r.json()) as ApiResponse;
        if (!data.ok || !data.events) {
          throw new Error(data.error || "INVALID_RESPONSE");
        }
        if (!alive) return;
        setBusy(computeBookedDateSet(data.events, monthStart, monthEnd));
      })
      .catch((e) => {
        if (!alive) return;
        setErr(String(e && e.message ? e.message : e));
        setBusy(new Set());
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [apiPath, monthStart, monthEnd]);

  // Opbyg dag-celler
  const firstDay = new Date(monthStart);
  const pad = (firstDay.getDay() + 6) % 7; // gør mandag=0
  const daysInMonth = monthEnd.getDate();
  const grid: Array<{ d: number | null; key: string; booked: boolean }> = [];
  for (let i = 0; i < pad; i++)
    grid.push({ d: null, key: `pad-${i}`, booked: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
    const k = ymd(date);
    grid.push({ d, key: k, booked: busy.has(k) });
  }

  return (
    <section
      className={styles.wrap}
      aria-label={t("Tilgængelighed", "Availability")}
    >
      <header className={styles.head}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label={t("Forrige måned", "Previous month")}
          onClick={() => setCursor((c) => addMonths(c, -1))}
        >
          ‹
        </button>
        <div className={styles.title}>
          {mo[monthStart.getMonth()]} {monthStart.getFullYear()}
        </div>
        <button
          type="button"
          className={styles.navBtn}
          aria-label={t("Næste måned", "Next month")}
          onClick={() => setCursor((c) => addMonths(c, +1))}
        >
          ›
        </button>
      </header>

      <div className={styles.week}>
        {wk.map((w) => (
          <div key={w} className={styles.wk}>
            {w}
          </div>
        ))}
      </div>

      <div
        className={styles.grid}
        role="grid"
        aria-busy={loading ? "true" : "false"}
      >
        {grid.map((cell) =>
          cell.d === null ? (
            <div
              key={cell.key}
              className={`${styles.cell} ${styles.pad}`}
              aria-hidden="true"
            />
          ) : (
            <div
              key={cell.key}
              className={`${styles.cell} ${
                cell.booked ? styles.booked : styles.free
              }`}
              role="gridcell"
              aria-label={
                cell.booked
                  ? t(`Optaget ${cell.d}.`, `Booked ${cell.d}.`)
                  : t(`Ledig ${cell.d}.`, `Available ${cell.d}.`)
              }
            >
              <span className={styles.num}>{cell.d}</span>
            </div>
          )
        )}
      </div>

      <footer className={styles.legend}>
        <span className={`${styles.dot} ${styles.free}`} />
        <span>{t("Ledig", "Available")}</span>
        <span className={styles.sep} />
        <span className={`${styles.dot} ${styles.booked}`} />
        <span>{t("Optaget", "Booked")}</span>
        {err ? (
          <span className={styles.err}>
            {t(
              "Kunne ikke hente kalender (prøv igen).",
              "Failed to load calendar (try again)."
            )}
          </span>
        ) : null}
      </footer>
    </section>
  );
}
