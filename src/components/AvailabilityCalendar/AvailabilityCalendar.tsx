// src/components/AvailabilityCalendar/AvailabilityCalendar.tsx
import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import { chooseLang, type Lang } from "../../lib/lang";
import {
  getPriceForDate,
  getMinNightsForStart,
  isPoolSeason,
} from "../../data/pricing";

/* ─── Types ─── */
type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  status: string;
  transp: string;
};
type ApiResponse =
  | { ok: true; updatedAt?: string; count?: number; events: ApiEvent[] }
  | { ok: false; error: string; detail?: string };

type Booking = {
  id: string;
  startDay: Date;
  endDay: Date; // exclusive
};

type Segment = {
  id: string;
  row: number;
  colStart: number; // 1..7
  colEnd: number; // 2..8 (8 = end-of-week)
  spanDays: number;
  isFirst: boolean;
  isLast: boolean;
  labelHere: boolean;
  continuesFromPrevWeek: boolean;
  continuesToNextWeek: boolean;
};

/** Brugerens valg */
export type SelectionMode = "none" | "single" | "range";
export type Selection =
  | { kind: "single"; date: Date }
  | { kind: "range"; start: Date; end?: Date };

/** Pris for valgt periode som sendes til parent */
export type SelectionPrice = {
  kind: "none" | "single" | "range";
  start?: Date;
  endExclusive?: Date;
  nights?: number;
  total?: number | null;
  breakdown?: Array<{ date: Date; price: number | null }>;
  hasMissing?: boolean;

  /** NYE felter: min.-nætter validering for ankomstdatoen */
  minNightsRequired?: number;
  isMinNightsSatisfied?: boolean;
  validationError?: string;
};

type Props = {
  lang: Lang;
  apiPath?: string; // default "/api/ical"
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  selectionMode?: SelectionMode; // default "range"
  disablePastSelection?: boolean; // default true
  onSelectionChange?: (sel: Selection | null) => void;
  onSelectionPrice?: (p: SelectionPrice) => void;
  weekNumberColWidth?: number; // px
};

/* ─── Date utils ─── */

function rangeIsFree(
  start: Date,
  endExclusive: Date,
  bookedDays: Set<string>
): boolean {
  if (endExclusive <= start) return false;
  for (let d = startOfDay(start); d < endExclusive; d = addDays(d, 1)) {
    const ymd = d.toISOString().slice(0, 10);
    if (bookedDays.has(ymd)) return false;
  }
  return true;
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function clampDate(x: Date, lo: Date, hi: Date): Date {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
function startOfWeek(d: Date, weekStartsOn: number): Date {
  const sd = startOfDay(d);
  const w = sd.getDay();
  const diff = (w - weekStartsOn + 7) % 7;
  return addDays(sd, -diff);
}
function formatMonthTitle(d: Date, lang: Lang): string {
  return d.toLocaleDateString(lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB", {
    month: "long",
    year: "numeric",
  });
}
/** ISO-uge (mandag som uge-start) */
function getISOWeek(d: Date): number {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const diffDays =
    Math.floor((dt.getTime() - yearStart.getTime()) / 86400000) + 1;
  return Math.ceil(diffDays / 7);
}
/** Iterér dag-for-dag [start, endExclusive) */
function eachDay(start: Date, endExclusive: Date): Date[] {
  const out: Date[] = [];
  let d = startOfDay(start);
  const end = startOfDay(endExclusive);
  while (d < end) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

function getShortGapMinNights(
  start: Date,
  bookedDays: Set<string>
): number | null {
  if (!isPoolSeason(start)) return null;

  let freeNights = 0;
  let cursor = startOfDay(start);

  while (freeNights < 6) {
    const ymd = cursor.toISOString().slice(0, 10);
    if (bookedDays.has(ymd)) break;
    freeNights += 1;
    cursor = addDays(cursor, 1);
  }

  if (freeNights >= 1 && freeNights <= 5) {
    const nextYmd = cursor.toISOString().slice(0, 10);
    if (bookedDays.has(nextYmd)) return freeNights;
  }

  return null;
}

function getEffectiveMinNightsForStart(
  start: Date,
  bookedDays: Set<string>
): number {
  const base = getMinNightsForStart(start);
  if (base !== 6) return base;
  return getShortGapMinNights(start, bookedDays) ?? base;
}

function formatMinNightsError(
  start: Date,
  required: number,
  lang: Lang
): string {
  const dateStr = start.toLocaleDateString(
    lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return lang === "da"
    ? `Minimum ${required} ${
        required === 1 ? "nat" : "nætter"
      } ved ankomst ${dateStr}.`
    : lang === "de"
    ? `Mindestens ${required} ${
        required === 1 ? "Nacht" : "Nächte"
      } bei Anreise ${dateStr}.`
    : `Minimum ${required} night${
        required === 1 ? "" : "s"
      } required for arrival ${dateStr}.`;
}

/* ─── API → bookings ─── */
function looksLikeBooking(ev: ApiEvent): boolean {
  // Alt fra kalenderen tæller som reservation/blokering,
  // undtagen "i dag" hvis det er den særlige samme-dags blokering.
  const start = new Date(ev.start);
  const end = new Date(ev.end);

  const s = startOfDay(start);
  const e = startOfDay(end);
  const today = startOfDay(new Date());

  const isSingleDay = e.getTime() - s.getTime() === 24 * 3600 * 1000;

  // Tekst-hints som Airbnb typisk bruger til generelle blokeringer
  const t = (ev.title || "").toLowerCase();
  const isNoCheckinWord =
    t.includes("not available") ||
    t.includes("unavailable") ||
    t.includes("blocked") ||
    t.includes("no check-in") ||
    t.includes("no checkin") ||
    t.includes("check-in not allowed") ||
    t.includes("checkin not allowed");

  // → Ignorér KUN hvis det er "i dag", enkelt-dag og ligner no-checkin-blokering
  if (s.getTime() === today.getTime() && isSingleDay && isNoCheckinWord) {
    return false;
  }

  // Ellers: ALT andet fra ICS skal blokere (vises som reserveret)
  return true;
}
function toBooking(ev: ApiEvent): Booking {
  const s = startOfDay(new Date(ev.start));
  const e = startOfDay(new Date(ev.end)); // exclusive
  return { id: ev.id, startDay: s, endDay: e };
}
function normalizeBookingsFromApi(payload: ApiResponse): Booking[] {
  if (!("ok" in payload) || !payload.ok) return [];
  const bs: Booking[] = [];
  for (const ev of payload.events ?? []) {
    if (!looksLikeBooking(ev)) continue;
    const b = toBooking(ev);
    if (b.endDay > b.startDay) bs.push(b);
  }
  bs.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
  return bs;
}

/* ─── ICAL fetch: cache pr. apiPath (og de-dupe in-flight) ─── */
type CacheEntry = { data: Booking[]; error: string | null };
const ICAL_PROMISE = new Map<string, Promise<CacheEntry>>();

async function loadIcal(apiPath: string): Promise<CacheEntry> {
  let p = ICAL_PROMISE.get(apiPath);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(apiPath, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        let json: ApiResponse;
        try {
          json = JSON.parse(text) as ApiResponse;
        } catch {
          throw new Error(
            "Calendar availability could not be loaded right now."
          );
        }
        const norm = normalizeBookingsFromApi(json);
        if (norm.length === 0) {
          return { data: [], error: "Ingen kalenderdata fundet." };
        }
        return { data: norm, error: null };
      } catch (err: unknown) {
        return {
          data: [],
          error:
            err instanceof Error
              ? err.message
              : "Kunne ikke hente kalenderdata.",
        };
      }
    })();
    ICAL_PROMISE.set(apiPath, p);
  }
  return p;
}

/* ─── Component ─── */
type CSSVars = React.CSSProperties & {
  ["--checkin-offset"]?: string;
  ["--checkout-width"]?: string;
  ["--segment-days"]?: number;
  ["--weeks"]?: number;
};

function getSegmentStyle(
  s: Segment,
  extra?: React.CSSProperties
): CSSVars {
  const spanDays = Math.max(1, s.spanDays);
  return {
    ...extra,
    "--checkin-offset": s.isFirst ? `${66.667 / spanDays}%` : "0%",
    "--checkout-width": s.isLast ? `${41.667 / spanDays}%` : "0%",
    "--segment-days": spanDays,
  };
}

export default function AvailabilityCalendar({
  lang,
  apiPath = "/api/ical",
  weekStartsOn = 1,
  selectionMode = "range",
  disablePastSelection = true,
  onSelectionChange,
  onSelectionPrice,
  weekNumberColWidth = 15,
}: Props) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);

  // Stabil "today"
  const todayRef = React.useRef<Date>(startOfDay(new Date()));
  const today = todayRef.current;
  const minMonth = startOfMonth(today);

  const WEEKNUM_COL = weekNumberColWidth;
  const weekColTemplate = `minmax(${WEEKNUM_COL}px, ${WEEKNUM_COL}px) repeat(7, 1fr)`;

  const [monthBase, setMonthBase] = React.useState<Date>(minMonth);
  const gridStart = React.useMemo(
    () => startOfWeek(startOfMonth(monthBase), weekStartsOn),
    [monthBase, weekStartsOn]
  );
  const weeks = React.useMemo(() => {
    const lastDayOfMonth = new Date(
      monthBase.getFullYear(),
      monthBase.getMonth() + 1,
      0
    );
    return Math.ceil((daysBetween(gridStart, lastDayOfMonth) + 1) / 7);
  }, [gridStart, monthBase]);

  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // --- Selection state ---
  const [sel, setSel] = React.useState<Selection | null>(null);

  // --- NY: lokal valideringsfejl for min. nætter ---
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  const emitSelection = React.useCallback(
    (next: Selection | null) => {
      setSel(next);
      onSelectionChange?.(next);
    },
    [onSelectionChange]
  );

  // Hold altid seneste onSelectionPrice i en ref (for at undgå render-loop)
  const onPriceRef = React.useRef<typeof onSelectionPrice>(undefined);
  React.useEffect(() => {
    onPriceRef.current = onSelectionPrice;
  }, [onSelectionPrice]);

  // Hent iCal KUN én gang pr. apiPath (også i StrictMode)
  React.useEffect(() => {
    let mounted = true;
    setError(null);
    setBookings(null);

    loadIcal(apiPath).then(({ data, error }) => {
      if (!mounted) return;
      const filtered = data.filter((b) => b.endDay >= today);
      setBookings(filtered);
      if (error) setError(error);
    });

    return () => {
      mounted = false;
    };
  }, [apiPath, today]);

  const canPrev = React.useMemo(() => {
    return startOfMonth(monthBase).getTime() > startOfMonth(minMonth).getTime();
  }, [monthBase, minMonth]);

  function prevMonth() {
    if (!canPrev) return;
    setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function nextMonth() {
    setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  // cells (5 or 6 weeks, depending on the month)
  const weekStarts: Date[] = React.useMemo(
    () => Array.from({ length: weeks }, (_, r) => addDays(gridStart, r * 7)),
    [gridStart, weeks]
  );

  const cells: Date[][] = React.useMemo(
    () =>
      weekStarts.map((ws) =>
        Array.from({ length: 7 }, (_, i) => addDays(ws, i))
      ),
    [weekStarts]
  );

  // booking segments
  const segments = React.useMemo(() => {
    if (!bookings) return [];
    const segs: Segment[] = [];
    for (const b of bookings)
      segs.push(...splitIntoSegments(b, gridStart, weeks));
    return segs;
  }, [bookings, gridStart, weeks]);

  /* Bookede dage i viewporten (YYYY-MM-DD) */
  const bookedDays = React.useMemo(() => {
    const set = new Set<string>();
    if (!bookings) return set;

    const gridEnd = addDays(gridStart, weeks * 7); // eksklusiv
    for (const b of bookings) {
      const s = clampDate(b.startDay, gridStart, gridEnd);
      const e = clampDate(b.endDay, gridStart, gridEnd); // eksklusiv
      for (let d = new Date(s); d < e; d = addDays(d, 1)) {
        set.add(d.toISOString().slice(0, 10));
      }
    }
    return set;
  }, [bookings, gridStart, weeks]);

  const checkoutDays = React.useMemo(() => {
    const set = new Set<string>();
    if (!bookings) return set;

    const gridEnd = addDays(gridStart, weeks * 7);
    for (const b of bookings) {
      if (b.endDay >= gridStart && b.endDay < gridEnd) {
        set.add(b.endDay.toISOString().slice(0, 10));
      }
    }
    return set;
  }, [bookings, gridStart, weeks]);

  const checkinDays = React.useMemo(() => {
    const set = new Set<string>();
    if (!bookings) return set;

    const gridEnd = addDays(gridStart, weeks * 7);
    for (const b of bookings) {
      if (b.startDay >= gridStart && b.startDay < gridEnd) {
        set.add(b.startDay.toISOString().slice(0, 10));
      }
    }
    return set;
  }, [bookings, gridStart, weeks]);

  // selection overlay segments
  const selSegments = React.useMemo(() => {
    if (selectionMode !== "range") return [];
    if (!sel || sel.kind !== "range" || !sel.end) return [];
    const b: Booking = {
      id: "__selection__",
      startDay: startOfDay(sel.start),
      endDay: startOfDay(sel.end),
    };
    return splitIntoSegments(b, gridStart, weeks);
  }, [sel, gridStart, selectionMode, weeks]);

  const monthTitle = formatMonthTitle(monthBase, lang);
  const reservedLabel = t("Reserveret", "Reserved", "Reserviert");

  // ugedage
  const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const WD_DA = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
  const WD_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const WD = lang === "da" ? WD_DA : lang === "de" ? WD_DE : WD_EN;
  const wd = WD
    .slice(weekStartsOn)
    .concat(WD.slice(0, weekStartsOn));

  // Kun tal (ingen symbol)
  const fmtNumber = React.useMemo(
    () =>
      new Intl.NumberFormat(lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB", {
        maximumFractionDigits: 0,
      }),
    [lang]
  );

  // Emit pris + min.-nætter validering
  React.useEffect(() => {
    const send = (payload: SelectionPrice) => {
      onPriceRef.current?.(payload);
    };

    if (!sel) {
      setValidationError(null);
      send({ kind: "none" });
      return;
    }

    if (sel.kind === "single") {
      setValidationError(null);
      const day = startOfDay(sel.date);
      const price = getPriceForDate(day);
      send({
        kind: "single",
        start: day,
        endExclusive: addDays(day, 1),
        nights: 1,
        total: price ?? null,
        breakdown: [{ date: day, price }],
        hasMissing: price == null,
        minNightsRequired: 1,
        isMinNightsSatisfied: true,
      });
      return;
    }

    const start = startOfDay(sel.start);
    const endEx = sel.end ? startOfDay(sel.end) : undefined;
    if (!endEx || endEx <= start) {
      setValidationError(null);
      send({
        kind: "range",
        start,
        endExclusive: endEx,
        nights: endEx ? daysBetween(start, endEx) : undefined,
        total: null,
        breakdown: [],
        hasMissing: true,
      });
      return;
    }

    const days = eachDay(start, endEx);
    const breakdown = days.map((d) => ({ date: d, price: getPriceForDate(d) }));
    const total = breakdown.reduce((sum, it) => sum + (it.price ?? 0), 0);
    const hasMissing = breakdown.some((it) => it.price == null);

    // NY: min. nætter for ankomstdagen
    const required = getEffectiveMinNightsForStart(start, bookedDays) ?? 1;
    const nights = days.length;
    const isOk = nights >= required;

    const errMsg = !isOk ? formatMinNightsError(start, required, lang) : null;

    setValidationError(errMsg);

    send({
      kind: "range",
      start,
      endExclusive: endEx,
      nights,
      total: hasMissing && total === 0 ? null : total,
      breakdown,
      hasMissing,
      minNightsRequired: required,
      isMinNightsSatisfied: isOk,
      validationError: errMsg ?? undefined,
    });
  }, [sel, lang, bookedDays]);

  // Klik-håndtering med bookingvalidering
  function handleDayClick(d: Date) {
    if (selectionMode === "none") return;
    const day = startOfDay(d);

    // — Hvis der er et færdigt range, og man klikker inden for det ⇒ deselect
    if (
      selectionMode === "range" &&
      sel?.kind === "range" &&
      sel.end &&
      day >= startOfDay(sel.start) &&
      day <= startOfDay(sel.end)
    ) {
      const start = startOfDay(sel.start);
      const end = startOfDay(sel.end);

      if (day.getTime() === start.getTime() && day.getTime() === end.getTime()) {
        emitSelection(null);
      } else if (day.getTime() === start.getTime()) {
        emitSelection({ kind: "range", start: end });
      } else if (day.getTime() === end.getTime()) {
        emitSelection({ kind: "range", start });
      } else {
        emitSelection({ kind: "range", start: day });
      }
      return;
    }

    if (selectionMode === "range" && sel?.kind === "range" && sel.end) {
      emitSelection(null);
      return;
    }

    // Forbyd både fortid og i dag (gælder kun for NYT valg; ikke for deselect ovenfor)
    if (disablePastSelection && day <= today) return;

    const ymd = day.toISOString().slice(0, 10);
    const isBooked = bookedDays.has(ymd);

    if (selectionMode === "single") {
      if (isBooked) return;
      const current =
        sel && sel.kind === "single" && sel.date.getTime() === day.getTime()
          ? null
          : ({ kind: "single", date: day } as Selection);
      emitSelection(current);
      return;
    }

    // range
    if (!sel || sel.kind !== "range" || sel.end) {
      if (isBooked) return;
      emitSelection({ kind: "range", start: day });
      return;
    }

    const start = startOfDay(sel.start);

    if (day.getTime() === start.getTime()) {
      emitSelection(null);
      return;
    }

    if (!rangeIsFree(start, day, bookedDays)) return;

    if (day < start) {
      emitSelection({ kind: "range", start: day, end: start });
    } else {
      emitSelection({ kind: "range", start, end: day });
    }
  }

  // helpers til selected styling
  function isSingleSelected(d: Date): boolean {
    return sel?.kind === "single" && sel.date.getTime() === d.getTime();
  }
  function isRangeEdge(d: Date): "start" | "end" | "" {
    if (sel?.kind !== "range") return "";
    const t = d.getTime();
    if (sel.start && t === startOfDay(sel.start).getTime()) return "start";
    if (sel.end && t === startOfDay(sel.end).getTime()) return "end";
    return "";
  }

  return (
    <div
      className={styles.wrap}
      data-mode={selectionMode}
      aria-live="polite"
      aria-label={t("Tilgængelighedskalender", "Availability calendar", "Verfügbarkeitskalender")}
    >
      <div className={styles.head}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prevMonth}
          disabled={!canPrev}
          aria-label={t("Forrige måned", "Previous month", "Vorheriger Monat")}
        >
          ‹
        </button>
        <div className={styles.month}>{monthTitle}</div>
        <button
          type="button"
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label={t("Næste måned", "Next month", "Nächster Monat")}
        >
          ›
        </button>
      </div>

      <div
        className={styles.grid}
        style={
          {
            ["--weeks"]: weeks,
            gridTemplateColumns: weekColTemplate,
          } as CSSVars
        }
      >
        {/* Header: tom uge-kolonne + ugedage */}
        <div aria-hidden="true" />
        {wd.map((label) => (
          <div key={label} className={styles.weekday}>
            {label}
          </div>
        ))}

        {/* 5 rækker: uge-nummer + 7 dato-celler */}
        {weekStarts.map((ws, r) => {
          const iso = getISOWeek(ws);
          return (
            <React.Fragment key={`row-${r}-${iso}`}>
              <div className={styles.weeknumCell} aria-label={`Uge ${iso}`}>
                {iso}
              </div>

              {cells[r].map((d) => {
                const isToday = d.getTime() === today.getTime();
                const inMonth = d.getMonth() === monthBase.getMonth();

                const ymd = d.toISOString().slice(0, 10);
                const isBooked = bookedDays.has(ymd);
                const isCheckoutDay = checkoutDays.has(ymd);
                const isCheckinDay = checkinDays.has(ymd);
                const isTurnoverDay = isCheckoutDay && isCheckinDay;

                const awaitingEnd =
                  selectionMode === "range" &&
                  sel?.kind === "range" &&
                  sel.start &&
                  !sel.end;

                const inCurrentRange =
                  selectionMode === "range" &&
                  sel?.kind === "range" &&
                  sel.end &&
                  d >= startOfDay(sel.start) &&
                  d <= startOfDay(sel.end);

                // Klikbarhed
                let canClick = selectionMode !== "none";
                if (disablePastSelection && d <= today) canClick = false;

                if (selectionMode === "single") {
                  if (isBooked) canClick = false;
                } else if (selectionMode === "range") {
                  if (!awaitingEnd) {
                    if (isBooked) canClick = false;
                  } else {
                    const start = startOfDay(sel!.start);
                    const endEx = startOfDay(d);
                    if (
                      endEx.getTime() !== start.getTime() &&
                      !(endEx > start && rangeIsFree(start, endEx, bookedDays))
                    ) {
                      canClick = false;
                    }
                  }
                }
                if (inCurrentRange) canClick = true;

                const disabled = !canClick;
                const cursorStyle: React.CSSProperties = {
                  cursor: disabled ? "default" : "pointer",
                };
                const selectedSingle = isSingleSelected(d);
                const edge = isRangeEdge(d);

                // Vis ikke pris for fortid eller i dag
                const shouldShowPrice =
                  inMonth &&
                  d > today &&
                  (!isBooked ||
                    ((isCheckoutDay || isCheckinDay) && !isTurnoverDay));

                const value = shouldShowPrice ? getPriceForDate(d) : null;
                const priceMain =
                  value != null ? `${fmtNumber.format(value)} ` : null;

                return (
                  <div
                    key={d.toISOString()}
                    className={styles.cell}
                    data-dim={!inMonth ? "1" : undefined}
                    data-today={isToday ? "1" : undefined}
                    data-clickable={!disabled ? "1" : undefined}
                    data-selected={selectedSingle ? "1" : undefined}
                    data-edge={edge || undefined}
                  >
                    <div
                      className={styles.dayNum}
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      aria-disabled={disabled || undefined}
                      style={cursorStyle}
                      onClick={(e) => {
                        if (disabled) return;
                        e.preventDefault();
                        handleDayClick(d);
                      }}
                      onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleDayClick(d);
                        }
                      }}
                    >
                      {d.getDate()}
                    </div>

                    {priceMain && (
                      <div className={styles.price} aria-hidden="true">
                        <span className={styles.priceMain}>{priceMain}</span>
                        <span className={styles.priceCur}>DKK</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className={styles.cellBtn}
                      aria-label={d.toLocaleDateString(
                        lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB"
                      )}
                      aria-pressed={
                        selectionMode === "single" ? selectedSingle : undefined
                      }
                      disabled={disabled}
                      style={cursorStyle}
                      onClick={() => handleDayClick(d)}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Booking bars (8 kolonner pga. uge-kolonnen) */}
        <div
          className={styles.bars}
          style={{
            gridTemplateColumns: weekColTemplate,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          {segments.map((s) => (
            <div
              key={s.id}
              className={[
                styles.bar,
                s.isLast && s.colEnd < 8 ? styles.timeEnd : "",
                s.continuesFromPrevWeek ? styles.weekContinueStart : "",
                s.continuesToNextWeek ? styles.weekContinueEnd : "",
                s.spanDays >= 2 ? styles.barHasRoom : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={getSegmentStyle(s, {
                gridRow: s.row + 1,
                gridColumn: `${s.colStart + 1} / ${s.colEnd + 1}`,
              })}
            >
              {s.labelHere && (
                <span className={styles.barLabel}>{reservedLabel}</span>
              )}
            </div>
          ))}
        </div>

        {/* Valgt periode (overlay) */}
        {selectionMode === "range" && selSegments.length > 0 && (
          <div
            className={styles.selBars}
            style={{
              gridTemplateColumns: weekColTemplate,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            {selSegments.map((s) => (
              <div
                key={`sel-${s.id}`}
                className={`${styles.selBar} ${
                  s.isLast && s.colEnd < 8 ? styles.timeEnd : ""
                }`}
                style={getSegmentStyle(s, {
                  gridRow: s.row + 1,
                  gridColumn: `${s.colStart + 1} / ${s.colEnd + 1}`,
                })}
              />
            ))}
          </div>
        )}
      </div>

      {/* NY: Min.-nætter fejl under kalenderen */}
      {validationError && (
        <div className={styles.error} role="alert" aria-live="polite">
          {validationError}
        </div>
      )}

      {!bookings && (
        <div className={styles.loading}>{t("Henter…", "Loading…", "Lädt…")}</div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

/* ─── Segment helper ─── */
function splitIntoSegments(
  b: Booking,
  gridStart: Date,
  weeks: number
): Segment[] {
  const gridEnd = addDays(gridStart, weeks * 7); // exclusive
  const visStart = clampDate(b.startDay, gridStart, gridEnd);
  const visEnd = clampDate(b.endDay, gridStart, gridEnd);
  if (visStart >= visEnd) return [];

  const firstIx = daysBetween(gridStart, visStart);
  const lastIxEx = daysBetween(gridStart, visEnd);

  const segs: Segment[] = [];
  let cursor = firstIx;

  const endColLine = (ixEx: number): number => {
    const mod = ixEx % 7;
    return mod === 0 ? 8 : mod + 1;
  };

  while (cursor < lastIxEx) {
    const row = Math.floor(cursor / 7);
    const rowEndEx = (row + 1) * 7;

    const segStartIx = cursor;
    const segEndIx = Math.min(lastIxEx, rowEndEx);

    segs.push({
      id: `${b.id}:${row}:${segStartIx}-${segEndIx}`,
      row,
      colStart: (segStartIx % 7) + 1,
      colEnd: endColLine(segEndIx),
      spanDays: Math.max(1, segEndIx - segStartIx),
      isFirst: segStartIx === firstIx,
      isLast: segEndIx === lastIxEx,
      labelHere: segStartIx === firstIx,
      continuesFromPrevWeek: segStartIx !== firstIx,
      continuesToNextWeek: segEndIx !== lastIxEx,
    });

    cursor = segEndIx;
  }
  return segs;
}
