import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/** ----- API typer ----- */
type ApiEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO (UTC) fra backend
  end: string; // ISO (UTC)
  allDay?: boolean;
};
type ApiResp =
  | { ok: true; updatedAt?: string; count?: number; events: ApiEvent[] }
  | { ok: false; error: string };

/** En “booking” vi tegner i kalenderen */
type Booking = {
  id: string;
  start: Date; // UTC Date-objekter
  end: Date;
  allDay: boolean;
  title: string;
};

/** Fast tidszone vi tolker kalenderen i (CET/CEST) */
const TZ = "Europe/Copenhagen";

/** Hvilke events er “rigtige ophold” og ikke møder/rengøring */
function isLikelyStay(e: ApiEvent): boolean {
  const title = (e.title || "").toLowerCase();

  // 1) All-day blokeringer tæller
  if (e.allDay) return true;

  // 2) Klassiske distributører / nøgleord
  const vendorHints = [
    "airbnb",
    "dancenter",
    "sol og strand",
    "campaya",
    "privat",
    "udlejning",
    "reserved",
  ];
  if (vendorHints.some((v) => title.includes(v))) return true;

  // 3) Varigheds-heuristik — typisk > 18 timer (min. 1 nat)
  const start = new Date(e.start);
  const end = new Date(e.end);
  const hours = (end.getTime() - start.getTime()) / 36e5;
  if (hours >= 18) return true;

  return false;
}

/** Formatér til Y-M-D i CZ tidszone */
const fmtParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function ymdInTz(d: Date): string {
  const parts = fmtParts.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const dd = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${dd}`;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Gør API events til interne “bookings” */
function normalizeBookings(events: ApiEvent[]): Booking[] {
  return events
    .filter(isLikelyStay)
    .map((e) => ({
      id: e.id,
      start: new Date(e.start),
      end: new Date(e.end),
      allDay: !!e.allDay,
      title: e.title,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

type Props = { lang: Lang; apiUrl?: string };

export default function AvailabilityCalendar({
  lang,
  apiUrl = "/api/ical",
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const today = new Date();
  const [cursor, setCursor] = React.useState<Date>(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  );
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Hent bookinger én gang
  React.useEffect(() => {
    let dead = false;
    setLoading(true);
    setErr(null);
    fetch(apiUrl, { headers: { Accept: "application/json" } })
      .then((r) => r.json() as Promise<ApiResp>)
      .then((data) => {
        if (dead) return;
        if (!data.ok) throw new Error("API error");
        setBookings(normalizeBookings(data.events));
      })
      .catch(
        () =>
          !dead &&
          setErr(t("Kunne ikke hente kalender.", "Failed to load calendar."))
      )
      .finally(() => !dead && setLoading(false));
    return () => {
      dead = true;
    };
  }, [apiUrl, t]); // én gang

  /** Opgør markeringer (start/slut/overnatning) for den viste måned */
  const marks = React.useMemo(() => {
    if (!bookings) return null;

    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth(); // 0-11
    const firstOfMonth = new Date(Date.UTC(y, m, 1));
    const firstShownWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // mandag=0
    const gridStart = addDays(firstOfMonth, -firstShownWeekday); // mandag i uge 1

    const startSet = new Set<string>();
    const endSet = new Set<string>();
    const nightSet = new Set<string>();

    // Hjælper der går én dag ad gangen i CZ tidszone
    function forEachYmd(
      startUtc: Date,
      endUtc: Date,
      fn: (ymd: string) => void
    ) {
      // gå fra lokal-dato til lokal-dato
      let d = new Date(startUtc.getTime());
      // start på lokal dato
      let ymd = ymdInTz(d);
      let guard = 0;
      while (true) {
        fn(ymd);
        // stop hvis vi har nået (lokal) dagen før end
        const next = addDays(d, 1);
        const nextYmd = ymdInTz(next);
        if (new Date(next.getTime()) >= endUtc) break;
        d = next;
        ymd = nextYmd;
        if (++guard > 4000) break;
      }
    }

    for (const b of bookings) {
      const startY = ymdInTz(b.start);
      const endY = ymdInTz(b.end); // check-out-dag (kl. 10)
      startSet.add(startY);
      endSet.add(endY);

      // Overnatninger = fra start-dag (inkl.) til dagen før check-out
      const lastNightUtc = addDays(b.end, -1);
      if (lastNightUtc >= b.start) {
        forEachYmd(b.start, b.end, (ymd) => {
          // udfyld ikke check-out dagen
          if (ymd !== endY) nightSet.add(ymd);
        });
      }
    }

    return { startSet, endSet, nightSet, gridStart };
  }, [bookings, cursor]);

  /** Byg gitteret: 6 uger × 7 dage */
  const cells = React.useMemo(() => {
    const result: {
      ymd: string;
      inMonth: boolean;
      day: number;
    }[] = [];

    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const firstOfMonth = new Date(Date.UTC(y, m, 1));
    const firstShownWeekday = (firstOfMonth.getUTCDay() + 6) % 7;
    const gridStart = addDays(firstOfMonth, -firstShownWeekday);

    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const inMonth = d.getUTCMonth() === m;
      // dag i CZ
      const parts = fmtParts.formatToParts(d);
      const dayNum = Number(parts.find((p) => p.type === "day")?.value ?? "0");
      result.push({ ymd: ymdInTz(d), inMonth, day: dayNum });
    }
    return result;
  }, [cursor]);

  function prevMonth() {
    setCursor(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() - 1, 1))
    );
  }
  function nextMonth() {
    setCursor(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1))
    );
  }

  const monthLabel = new Intl.DateTimeFormat(
    lang === "da" ? "da-DK" : "en-GB",
    {
      timeZone: TZ,
      year: "numeric",
      month: "long",
    }
  ).format(cursor);

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <button
          className={styles.nav}
          onClick={prevMonth}
          aria-label={t("Forrige måned", "Previous month")}
        >
          ‹
        </button>
        <div className={styles.title}>{monthLabel}</div>
        <button
          className={styles.nav}
          onClick={nextMonth}
          aria-label={t("Næste måned", "Next month")}
        >
          ›
        </button>
      </div>

      <div
        className={styles.grid}
        role="grid"
        aria-label={t("Tilgængelighedskalender", "Availability calendar")}
      >
        {["M", "T", "O", "T", "F", "L", "S"].map((d) => (
          <div key={d} className={styles.dow}>
            {
              lang === "da"
                ? d
                : "MTWTFSS"["MTWTFSS".indexOf(d)] /* bare vis DK-kolonner */
            }
          </div>
        ))}

        {cells.map((c) => {
          const busy = marks?.nightSet.has(c.ymd) ?? false;
          const isStart = marks?.startSet.has(c.ymd) ?? false;
          const isEnd = marks?.endSet.has(c.ymd) ?? false;

          return (
            <div
              key={c.ymd}
              className={[
                styles.cell,
                c.inMonth ? "" : styles.dim,
                busy ? styles.busy : "",
                isStart ? styles.start : "",
                isEnd ? styles.end : "",
              ].join(" ")}
              role="gridcell"
              aria-label={`${c.ymd}${
                busy ? (lang === "da" ? " optaget" : " booked") : ""
              }`}
            >
              <span className={styles.day}>{c.day}</span>
              {/* Trekanter tegnes med CSS via .start/.end */}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className={styles.note}>{t("Indlæser…", "Loading…")}</div>
      )}
      {err && <div className={styles.err}>{err}</div>}
    </div>
  );
}
