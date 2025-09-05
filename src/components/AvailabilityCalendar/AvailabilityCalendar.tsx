import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import type { Lang } from "../../lib/lang";
import { getPriceForDate } from "../../data/pricing";

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
  startDay: Date; // local midnight (check-in day)
  endDay: Date; // local midnight (check-out day, exclusive)
};

type Segment = {
  id: string;
  row: number; // 0..4
  colStart: number; // 1..7
  colEnd: number; // 2..8 (8 = end-of-week)
  isFirst: boolean;
  isLast: boolean;
  labelHere: boolean;
};

/** Brugerens valg */
export type SelectionMode = "none" | "single" | "range";
export type Selection =
  | { kind: "single"; date: Date }
  | { kind: "range"; start: Date; end?: Date }; // end kan mangle mens man "trækker"

/** Pris for valgt periode som sendes til parent */
export type SelectionPrice = {
  kind: "none" | "single" | "range";
  start?: Date; // inklusiv
  endExclusive?: Date; // eksklusiv (checkout)
  nights?: number;
  total?: number | null;
  breakdown?: Array<{ date: Date; price: number | null }>;
  hasMissing?: boolean;
};

type Props = {
  lang: Lang;
  apiPath?: string; // default "/api/ical"
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun .. 6=Sat
  selectionMode?: SelectionMode; // default "range"
  disablePastSelection?: boolean; // default true
  onSelectionChange?: (sel: Selection | null) => void;
  onSelectionPrice?: (p: SelectionPrice) => void; // ← callback med pris for valgt periode
};

/* ─── Date utils ─── */
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
  const w = sd.getDay(); // 0..6, 0=Sun
  const diff = (w - weekStartsOn + 7) % 7;
  return addDays(sd, -diff);
}
function formatMonthTitle(d: Date, lang: Lang): string {
  return d.toLocaleDateString(lang === "da" ? "da-DK" : "en-GB", {
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

/* ─── API → bookings ─── */
function looksLikeBooking(ev: ApiEvent): boolean {
  const t = ev.title.toLowerCase();
  const positive =
    t.includes("airbnb") ||
    t.includes("dancenter") ||
    t.includes("campaya") ||
    t.includes("sol og strand") ||
    t.includes("udlejning") ||
    t.includes("privat") ||
    t.includes("reserved") ||
    t.includes("not available");
  if (!positive) return false;

  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const durMs = end.getTime() - start.getTime();
  if (!ev.allDay && durMs < 20 * 3600 * 1000) return false;

  const neg =
    t.includes("rengøring") ||
    t.includes("rengoring") ||
    t.includes("møde") ||
    t.includes("meeting") ||
    t.includes("fotograf") ||
    t.includes("levering");
  return !neg;
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
    const row = Math.floor(cursor / 7); // 0..4
    const rowEndEx = (row + 1) * 7;

    const segStartIx = cursor;
    const segEndIx = Math.min(lastIxEx, rowEndEx);

    segs.push({
      id: `${b.id}:${row}:${segStartIx}-${segEndIx}`,
      row,
      colStart: (segStartIx % 7) + 1,
      colEnd: endColLine(segEndIx),
      isFirst: segStartIx === firstIx,
      isLast: segEndIx === lastIxEx,
      labelHere: segStartIx === firstIx,
    });

    cursor = segEndIx;
  }
  return segs;
}

/* ─── Component ─── */
type CSSVars = React.CSSProperties & { ["--weeks"]?: number };

export default function AvailabilityCalendar({
  lang,
  apiPath = "/api/ical",
  weekStartsOn = 1, // Monday
  selectionMode = "range",
  disablePastSelection = true,
  onSelectionChange,
  onSelectionPrice,
}: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const today = startOfDay(new Date());
  const minMonth = startOfMonth(today);

  const WEEKS = 5;
  const WEEKNUM_COL = 40; // px – bredde til uge-kolonnen

  const [monthBase, setMonthBase] = React.useState<Date>(minMonth);
  const gridStart = React.useMemo(
    () => startOfWeek(startOfMonth(monthBase), weekStartsOn),
    [monthBase, weekStartsOn]
  );

  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // --- Selection state ---
  const [sel, setSel] = React.useState<Selection | null>(null);

  // notify parent when selection changes
  const emitSelection = React.useCallback(
    (next: Selection | null) => {
      setSel(next);
      onSelectionChange?.(next);
    },
    [onSelectionChange]
  );

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    (async () => {
      setError(null);
      try {
        const res = await fetch(apiPath, { signal: ctrl.signal });
        if (!res.ok) throw new Error(res.statusText);
        const json = (await res.json()) as ApiResponse;

        const all = normalizeBookingsFromApi(json);
        const filtered = all.filter((b) => b.endDay >= today);
        if (!alive) return;
        setBookings(filtered);
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message || "Fetch error");
        setBookings([]);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
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

  // cells (5 weeks)
  const weekStarts: Date[] = React.useMemo(
    () => Array.from({ length: WEEKS }, (_, r) => addDays(gridStart, r * 7)),
    [gridStart]
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
      segs.push(...splitIntoSegments(b, gridStart, WEEKS));
    return segs;
  }, [bookings, gridStart]);

  // selection segments (only for range when both ends exist)
  const selSegments = React.useMemo(() => {
    if (selectionMode !== "range") return [];
    if (!sel || sel.kind !== "range" || !sel.end) return [];
    const b: Booking = {
      id: "__selection__",
      startDay: startOfDay(sel.start),
      endDay: startOfDay(sel.end),
    };
    return splitIntoSegments(b, gridStart, WEEKS);
  }, [sel, gridStart, selectionMode]);

  const monthTitle = formatMonthTitle(monthBase, lang);
  const reservedLabel = t("Reserveret", "Reserved");

  // Weekday labels rotated from Sun..Sat base
  const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const WD_DA = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
  const wd = (lang === "da" ? WD_DA : WD_EN)
    .slice(weekStartsOn)
    .concat((lang === "da" ? WD_DA : WD_EN).slice(0, weekStartsOn));

  const weekColTemplate = `${WEEKNUM_COL}px repeat(7, 1fr)`;

  const fmtPrice = React.useMemo(
    () =>
      new Intl.NumberFormat(lang === "da" ? "da-DK" : "en-GB", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }),
    [lang]
  );

  // Beregn pris for valgt periode og emit til parent
  // ↓ erstatter din eksisterende computeAndEmitPrice
  const computeAndEmitPrice = React.useCallback(
    (current: Selection | null) => {
      const send = (payload: SelectionPrice) => {
        // emit til parent hvis sat
        onSelectionPrice?.(payload);

        // console-log samlet pris + detaljer
        try {
          const totalTxt =
            payload.total != null ? fmtPrice.format(payload.total) : "—";
          console.log("[Calendar] Samlet pris:", totalTxt, payload);
        } catch {
          // fallback hvis formatter fejler
          console.log(
            "[Calendar] Samlet pris:",
            payload.total ?? null,
            payload
          );
        }
      };

      if (!current) {
        send({ kind: "none" });
        return;
      }

      if (current.kind === "single") {
        const day = startOfDay(current.date);
        const price = getPriceForDate(day);
        send({
          kind: "single",
          start: day,
          endExclusive: addDays(day, 1),
          nights: 1,
          total: price ?? null,
          breakdown: [{ date: day, price }],
          hasMissing: price == null,
        });
        return;
      }

      const start = startOfDay(current.start);
      const endEx = current.end ? startOfDay(current.end) : undefined;
      if (!endEx || endEx <= start) {
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
      const breakdown = days.map((d) => ({
        date: d,
        price: getPriceForDate(d),
      }));
      const total = breakdown.reduce((sum, it) => sum + (it.price ?? 0), 0);
      const hasMissing = breakdown.some((it) => it.price == null);

      send({
        kind: "range",
        start,
        endExclusive: endEx,
        nights: days.length,
        total: hasMissing && total === 0 ? null : total,
        breakdown,
        hasMissing,
      });
    },
    [onSelectionPrice, fmtPrice]
  );
  React.useEffect(() => {
    computeAndEmitPrice(sel);
  }, [sel, computeAndEmitPrice]);

  // Click handling
  function handleDayClick(d: Date) {
    if (selectionMode === "none") return;
    if (disablePastSelection && startOfDay(d) < today) return;

    if (selectionMode === "single") {
      const current =
        sel && sel.kind === "single" && sel.date.getTime() === d.getTime()
          ? null
          : ({ kind: "single", date: startOfDay(d) } as Selection);
      emitSelection(current);
      return;
    }

    // range mode
    if (!sel || sel.kind !== "range" || (sel.kind === "range" && sel.end)) {
      // Start a new range
      emitSelection({ kind: "range", start: startOfDay(d) });
      return;
    }
    // We have a start, set/replace end
    const start = sel.start;
    const clicked = startOfDay(d);
    if (clicked.getTime() === start.getTime()) {
      // same day -> cancel selection
      emitSelection(null);
    } else if (clicked < start) {
      // swap so start <= end
      emitSelection({ kind: "range", start: clicked, end: start });
    } else {
      emitSelection({ kind: "range", start, end: clicked });
    }
  }

  // helpers for cell selected styling
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
      aria-label={t("Tilgængelighedskalender", "Availability calendar")}
    >
      <div className={styles.head}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prevMonth}
          disabled={!canPrev}
          aria-label={t("Forrige måned", "Previous month")}
        >
          ‹
        </button>
        <div className={styles.month}>{monthTitle}</div>
        <button
          type="button"
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label={t("Næste måned", "Next month")}
        >
          ›
        </button>
      </div>

      <div
        className={styles.grid}
        style={
          {
            ["--weeks"]: WEEKS,
            gridTemplateColumns: weekColTemplate,
          } as CSSVars
        }
      >
        {/* Week header row (tom uge-kolonne + 7 ugedage) */}
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
                const disabled =
                  selectionMode === "none" ||
                  (disablePastSelection && d < today);

                const selectedSingle = isSingleSelected(d);
                const edge = isRangeEdge(d); // "start" | "end" | ""
                const price = inMonth ? getPriceForDate(d) : null;
                const priceLabel =
                  price != null ? fmtPrice.format(price) : null;

                return (
                  <div
                    key={d.toISOString()}
                    className={styles.cell}
                    data-dim={!inMonth ? "1" : undefined}
                    data-today={isToday ? "1" : undefined}
                    data-selected={selectedSingle ? "1" : undefined}
                    data-edge={edge || undefined}
                  >
                    <div className={styles.dayNum}>{d.getDate()}</div>
                    {priceLabel && (
                      <div className={styles.price} aria-hidden="true">
                        {priceLabel}
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.cellBtn}
                      aria-label={d.toLocaleDateString(
                        lang === "da" ? "da-DK" : "en-GB"
                      )}
                      aria-pressed={
                        selectionMode === "single" ? selectedSingle : undefined
                      }
                      disabled={disabled}
                      onClick={() => handleDayClick(d)}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Booking bars (8 kolonner pga uge-kolonnen) */}
        <div
          className={styles.bars}
          style={{ gridTemplateColumns: weekColTemplate }}
        >
          {segments.map((s) => (
            <div
              key={s.id}
              className={styles.bar}
              style={{
                gridRow: s.row + 1,
                gridColumn: `${s.colStart + 1} / ${s.colEnd + 1}`,
              }}
            >
              {s.labelHere && (
                <span className={styles.barLabel}>{reservedLabel}</span>
              )}
            </div>
          ))}
        </div>

        {/* Selection overlay (på toppen) */}
        {selectionMode === "range" && selSegments.length > 0 && (
          <div
            className={styles.selBars}
            style={{ gridTemplateColumns: weekColTemplate }}
            aria-hidden="true"
          >
            {selSegments.map((s) => (
              <div
                key={`sel-${s.id}`}
                className={`${styles.selBar} ${
                  s.isLast ? styles.nibbleRight : ""
                }`}
                style={{
                  gridRow: s.row + 1,
                  gridColumn: `${s.colStart + 1} / ${s.colEnd + 1}`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {!bookings && (
        <div className={styles.loading}>{t("Henter…", "Loading…")}</div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
