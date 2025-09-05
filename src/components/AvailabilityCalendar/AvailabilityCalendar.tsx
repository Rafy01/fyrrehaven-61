import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";

/* ---------------- Types ---------------- */
type ApiEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO
  end: string; // ISO
  allDay?: boolean;
};

type ApiPayload =
  | { ok: true; updatedAt?: string; count?: number; events: ApiEvent[] }
  | { ok: false; error: string };

type Booking = {
  id: string;
  start: Date; // check-in
  end: Date; // check-out (exclusive)
};

type PieceKind = "start" | "mid" | "end" | "full";
type Piece = {
  key: string;
  row: number; // 0..5 (6 uger)
  colStart: number; // 1..7 (grid column)
  colEnd: number; // 2..8
  kind: PieceKind;
  lane: number; // stakning inden for samme uge
  showLabel: boolean;
};

/* -------------- Helpers: dates -------------- */
// klippe tider til “dato”-logik i lokal tid
const dayStart = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diffDays = (a: Date, b: Date) =>
  Math.round((dayStart(b).getTime() - dayStart(a).getTime()) / 86400000);

function gridBase(y: number, m: number) {
  // startdato for 6x7 gitteret (mandag som første dag)
  const first = new Date(y, m - 1, 1);
  const wd = first.getDay() || 7; // 1..7
  const delta = wd - 1; // hvor mange tilbage til mandag
  return addDays(first, -delta);
}

/* --------- Heuristik: vælg kun “booking” events --------- */
const POSITIVE = [
  "airbnb",
  "campaya",
  "dancenter",
  "sol og strand",
  "udlejning",
  "booking",
  "privat",
  "guest",
  "reserved",
];
const NEGATIVE = [
  "rengøring",
  "clean",
  "møde",
  "meeting",
  "fotograf",
  "deliver",
  "generalforsamling",
];

function looksLikeBooking(ev: ApiEvent): boolean {
  const t = (ev.title || "").toLowerCase();
  if (NEGATIVE.some((k) => t.includes(k))) return false;
  if (POSITIVE.some((k) => t.includes(k))) return true;

  // fallback: events der starter sen eftermiddag og slutter næste formiddag
  try {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    const hoursS = s.getHours(),
      hoursE = e.getHours();
    const span = (e.getTime() - s.getTime()) / 36e5;
    if (span >= 12 && hoursS >= 14 && hoursE <= 12) return true;
  } catch { /* empty */ }
  return false;
}

/* --------- API payload → bookings --------- */
function payloadToBookings(payload: ApiPayload): Booking[] {
  if (!("ok" in payload) || !payload.ok) return [];
  const xs = payload.events ?? [];
  const kept = xs.filter(looksLikeBooking);

  const bookings: Booking[] = [];
  for (const ev of kept) {
    try {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      if (isNaN(+s) || isNaN(+e)) continue;
      if (e <= s) continue;

      // Nogle feeds giver allDay-reservationer → normaliser til døgn
      const start = new Date(s);
      const end = new Date(e);

      bookings.push({ id: ev.id, start, end });
    } catch { /* empty */ }
  }
  return bookings;
}

/* --------- Booking → “stykker” hen over månedens gitter --------- */
function piecesForMonth(bookings: Booking[], y: number, m: number): Piece[] {
  // gitterdatoer (6 uger)
  const base = gridBase(y, m);
  const gridStart = dayStart(base);
  const gridEnd = addDays(gridStart, 42);

  // per uge
  const pieces: Piece[] = [];

  for (const b of bookings) {
    // klip til gitterets periode
    const Bstart = new Date(
      Math.max(dayStart(b.start).getTime(), gridStart.getTime())
    );
    const Bend = new Date(
      Math.min(dayStart(b.end).getTime(), gridEnd.getTime())
    );

    if (Bend <= Bstart) continue;

    // gennem 6 uger
    for (let row = 0; row < 6; row++) {
      const rowStart = addDays(gridStart, row * 7);
      const rowEnd = addDays(rowStart, 7);

      // skæringsmængde
      const a = new Date(Math.max(Bstart.getTime(), rowStart.getTime()));
      const bEnd = new Date(Math.min(Bend.getTime(), rowEnd.getTime()));
      if (bEnd <= a) continue;

      const colStart = diffDays(rowStart, a) + 1; // 1..7
      const colEnd = diffDays(rowStart, bEnd) + 1; // 2..8 (exclusive)

      // bestemme “kind”
      const touchesStart = a.getTime() === dayStart(b.start).getTime();
      const touchesEnd = bEnd.getTime() === dayStart(b.end).getTime();
      let kind: PieceKind;
      if (!touchesStart && !touchesEnd && colStart === 1 && colEnd === 8)
        kind = "full";
      else if (touchesStart && !touchesEnd) kind = "start";
      else if (!touchesStart && touchesEnd) kind = "end";
      else if (touchesStart && touchesEnd) {
        // hele booking ligger inde i denne uge – brug 'mid' men vi flader enderne
        kind = "mid";
      } else {
        kind = "mid";
      }

      pieces.push({
        key: `${b.id}-${row}-${colStart}-${colEnd}`,
        row,
        colStart,
        colEnd,
        kind,
        lane: 0, // lanes tilføjes senere
        showLabel: touchesStart, // label kun hvor booking starter (indenfor gitteret)
      });
    }
  }

  // Lanes pr. uge: simple kollisionsdetektion
  for (let row = 0; row < 6; row++) {
    const inRow = pieces
      .filter((p) => p.row === row)
      .sort((a, b) => a.colStart - b.colStart);
    const lanes: number[] = []; // sidste colEnd for lane i
    for (const p of inRow) {
      let lane = 0;
      while (lane < lanes.length && p.colStart <= lanes[lane]) lane++;
      p.lane = lane;
      lanes[lane] = p.colEnd - 0.001; // lidt overlap-bias
    }
  }

  return pieces;
}

/* ---------------- Component ---------------- */
type Props = { lang: Lang };

export default function AvailabilityCalendar({ lang }: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const today = new Date();
  const [ym, setYm] = React.useState<{ y: number; m: number }>(() => ({
    y: today.getFullYear(),
    m: today.getMonth() + 1, // 1..12
  }));
  const [loading, setLoading] = React.useState(false);
  const [bookings, setBookings] = React.useState<Booking[]>([]);

  // hent én gang (hele feedet)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ical");
        const json: ApiPayload = await res.json();
        if (!cancelled) setBookings(payloadToBookings(json));
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { y, m } = ym;
  const monthName = new Intl.DateTimeFormat(lang === "da" ? "da-DK" : "en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));

  const base = gridBase(y, m);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(base, i));
  const weekdayLabels =
    lang === "da"
      ? ["Man.", "Tir.", "Ons.", "Tor.", "Fre.", "Lør.", "Søn."]
      : ["Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat.", "Sun."];

  const pcs = piecesForMonth(bookings, y, m);

  function prevMonth() {
    setYm(({ y, m }) => (m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }));
  }
  function nextMonth() {
    setYm(({ y, m }) => (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          className={styles.navBtn}
          onClick={prevMonth}
          aria-label={t("Forrige måned", "Previous month")}
        >
          ‹
        </button>
        <div className={styles.title}>
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

      <div
        className={styles.grid}
        style={{ "--gap": "10px" } as React.CSSProperties}
      >
        {weekdayLabels.map((w) => (
          <div key={w} className={styles.wd}>
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const inMonth = d.getMonth() + 1 === m;
          const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
          return (
            <div
              key={d.toISOString()}
              className={[
                styles.cell,
                inMonth ? "" : styles.dim,
                isToday ? styles.today : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.date}>{d.getDate()}</span>
            </div>
          );
        })}

        {/* overlay til “pills” */}
        <div className={styles.overlay}>
          {pcs.map((p) => {
            const span = p.colEnd - p.colStart;
            const cls = [
              styles.pill,
              span > 1 && (p.kind === "mid" || p.kind === "full")
                ? styles.pillBridge
                : "",
              p.kind === "start" ? styles.pillStart : "",
              p.kind === "end" ? styles.pillEnd : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={p.key}
                className={cls}
                style={{
                  gridRow: p.row + 3, // +2 for ugedage + 1 fordi gridRow starter fra 1
                  gridColumn: `${p.colStart} / ${p.colEnd}`,
                  marginTop: `calc(6px + ${p.lane} * 30px)`,
                }}
                aria-label={t("Reserveret", "Reserved")}
                title={t("Reserveret", "Reserved")}
              >
                {p.showLabel && (
                  <span className={styles.label}>
                    {t("Reserveret", "Reserved")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>{t("Indlæser…", "Loading…")}</div>
      )}
    </div>
  );
}
