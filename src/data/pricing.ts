// src/data/pricing.ts

/* =========
 * Typer
 * ========= */

export type Currency = "DKK";

export type DayCode = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** Ugepris. Du kan enten:
 *  - give en samlet 'price' (samme pris alle 7 dage),
 *  - eller splitte på 'weekdays' og 'weekend' (se weekendDays),
 *  - eller angive specifikke dage via 'days'.
 *  Prioritet (høj → lav) i selve ugen: days[dag] > weekend/weekday > price
 */
export type WeekPricing = {
  price?: number;
  weekdays?: number;
  weekend?: number;
  weekendDays?: DayCode[];
  days?: Partial<Record<DayCode, number>>;
  note?: string;
  /** Minimum nætter ved ankomst i denne uge */
  minNights?: number;
};

/** Årsniveau:
 *  - default: fallback-priser for hele året (bruges når uge ikke er sat)
 *  - weeks: ISO-uge → WeekPricing
 *  - days: dato → pris (YYYY-MM-DD, overrides alt andet)
 *  - daysMinNights: dato → min. nætter for ankomstdag (YYYY-MM-DD, højeste prioritet)
 */
export type YearPricing = {
  default?: {
    price?: number;
    weekdays?: number;
    weekend?: number;
    weekendDays?: DayCode[];
    /** Global fallback for min. nætter i året */
    minNights?: number;
  };
  weeks?: Partial<Record<number, WeekPricing>>;
  days?: Partial<Record<string, number>>;
  daysMinNights?: Partial<Record<string, number>>;
};

/** Hele prisplanen (flere år). */
export type PricePlan = {
  currency: Currency;
  years: Record<number, YearPricing>;
};

/* =========
 * Defaults
 * ========= */

export const DEFAULT_WEEKEND: DayCode[] = ["fri", "sat"];

/** Returnerer min. nætter baseret på ANKOMSTDATO.
 *  Prioritet: daysMinNights[YYYY-MM-DD] > weeks[w].minNights > default.minNights > GLOBAL_FALLBACK(2)
 */
export function getMinNightsForStart(
  date: Date,
  plan: PricePlan = PRICES
): number {
  const GLOBAL_FALLBACK = 2; // sikrer default 2 nætter, hvis intet andet er sat
  const y = date.getFullYear();
  const yr = plan.years[y];
  if (!yr) return GLOBAL_FALLBACK;

  const ymd = date.toISOString().slice(0, 10);
  if (yr.daysMinNights && yr.daysMinNights[ymd] != null) {
    return yr.daysMinNights[ymd]!;
  }

  const w = isoWeek(date);
  const wp = yr.weeks?.[w];
  if (wp?.minNights != null) return wp.minNights;

  if (yr.default?.minNights != null) return yr.default.minNights;

  return GLOBAL_FALLBACK;
}

/* =========
 * Hjælpere til at udfylde days
 * ========= */

function addRange(
  store: Partial<Record<string, number>>,
  fromYMD: string,
  toYMD: string,
  price: number
) {
  const start = new Date(fromYMD + "T00:00:00");
  const end = new Date(toYMD + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ymd = d.toISOString().slice(0, 10);
    store[ymd] = price;
  }
}

function addOne(
  store: Partial<Record<string, number>>,
  ymd: string,
  price: number
) {
  store[ymd] = price;
}

/** Helper til at udfylde dags-specifikke min.-nætter */
function addRangeMinNights(
  store: Partial<Record<string, number>>,
  fromYMD: string,
  toYMD: string,
  minNights: number
) {
  const start = new Date(fromYMD + "T00:00:00");
  const end = new Date(toYMD + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ymd = d.toISOString().slice(0, 10);
    store[ymd] = minNights;
  }
}

/* =========
 * Airbnb-matchende priser (ud fra screenshots)
 * ========= */

const days2025: Partial<Record<string, number>> = {};
const days2026: Partial<Record<string, number>> = {};
const days2027: Partial<Record<string, number>> = {};

// Mulighed for dags-specifik min. nætter
const daysMinNights2025: Partial<Record<string, number>> = {};
const daysMinNights2026: Partial<Record<string, number>> = {};
const daysMinNights2027: Partial<Record<string, number>> = {};

/** ——— 2025 ——— **/

// SEPTEMBER 2025
addRange(days2025, "2025-09-01", "2025-09-06", 2090);
addRange(days2025, "2025-09-07", "2025-09-20", 2090);
addRange(days2025, "2025-09-21", "2025-09-26", 2200);
addRange(days2025, "2025-09-27", "2025-09-30", 2500);

// OKTOBER 2025
addRange(days2025, "2025-10-01", "2025-10-04", 2500);
addRange(days2025, "2025-10-05", "2025-10-08", 1800);
addRange(days2025, "2025-10-09", "2025-10-19", 2200); // efterårsferie
addRange(days2025, "2025-10-20", "2025-10-31", 1800);

// NOVEMBER 2025 — fladt 1.800
addRange(days2025, "2025-11-01", "2025-11-30", 1800);

// DECEMBER 2025
addRange(days2025, "2025-12-01", "2025-12-15", 1800);
addRange(days2025, "2025-12-16", "2025-12-25", 1710);
addOne(days2025, "2025-12-26", 1140);
addRange(days2025, "2025-12-27", "2025-12-31", 665);

/** ——— 2026 ——— **/

// JANUAR 2026 — fladt 1.900
addRange(days2026, "2026-01-01", "2026-01-31", 1900);

// FEBRUAR 2026 — 1.805 m/ vinterferie (uge 7) på 2.090 (man–lør)
addRange(days2026, "2026-02-01", "2026-02-08", 1805);
addRange(days2026, "2026-02-09", "2026-02-14", 2090); // man–lør
addRange(days2026, "2026-02-15", "2026-02-28", 1805);

// MARTS 2026 — fladt 1.805
addRange(days2026, "2026-03-01", "2026-03-31", 1805);

// APRIL 2026 — 1–5: 2.660, 6–30: 2.280
addRange(days2026, "2026-04-01", "2026-04-05", 2660);
addRange(days2026, "2026-04-06", "2026-04-30", 2280);

// MAJ 2026 — fladt 3.325
addRange(days2026, "2026-05-01", "2026-05-31", 3325);

// JUNI 2026 — fladt 3.325
addRange(days2026, "2026-06-01", "2026-06-30", 3325);

// JULI–SEPTEMBER 2026 — fladt 3.325 (matcher screenshots)
addRange(days2026, "2026-07-01", "2026-09-30", 3325);

// (Eksempel på kendt enkelt-dag senere)
addOne(days2026, "2026-12-31", 4300);

/** ——— JULEFERIE MIN. NÆTTER (3) ——— **/

// Juleferie 2025 → 20/12–31/12 (3 nætter)
addRangeMinNights(daysMinNights2025, "2025-12-20", "2025-12-31", 3);

// Fortsættelse af juleferien ind i 2026 → 01/01–03/01 (3 nætter)
addRangeMinNights(daysMinNights2026, "2026-01-01", "2026-01-03", 3);

// Juleferie 2026 → 20/12–31/12 (3 nætter)
addRangeMinNights(daysMinNights2026, "2026-12-20", "2026-12-31", 3);

// Fortsættelse ind i 2027 → 01/01–03/01 (3 nætter)
addRangeMinNights(daysMinNights2027, "2027-01-01", "2027-01-03", 3);

// Juleferie 2027 → 20/12–31/12 (3 nætter)
addRangeMinNights(daysMinNights2027, "2027-12-20", "2027-12-31", 3);

/* =========
 * Eksporter prisplan
 * ========= */

export const PRICES: PricePlan = {
  currency: "DKK",
  years: {
    2025: {
      // Fallback (bruges hvis en dato ikke er specificeret)
      default: {
        price: 1800,
        weekendDays: ["fri", "sat"],
        minNights: 2, // globalt default minimum booking
      },
      days: days2025,
      daysMinNights: daysMinNights2025,
      weeks: {
        // VINTERFERIE (uge 7)
        7: { minNights: 3 },

        // SOMMERFERIE (uge 27–32)
        27: { minNights: 6 },
        28: { minNights: 6 },
        29: { minNights: 6 },
        30: { minNights: 6 },
        31: { minNights: 6 },
        32: { minNights: 6 },

        // EFTERÅRSFERIE (uge 42) – behold prisnote
        42: {
          price: 2200,
          note: "Efterårsferie – dækket af days",
          minNights: 3,
        },
      },
    },

    2026: {
      // Fallback uden for de specificerede perioder
      default: {
        price: 3500, // generel lavsæson; justér hvis du vil splitte weekday/weekend
        weekendDays: ["fri", "sat"],
        minNights: 2, // globalt default minimum booking
      },
      // Sommeren + vinter/forår er dagsspecifik (mest præcis ift. Airbnb)
      days: days2026,
      daysMinNights: daysMinNights2026,
      weeks: {
        // VINTERFERIE (uge 7)
        7: { minNights: 3 },

        // SOMMERFERIE (uge 27–32)
        27: { minNights: 6 },
        28: { minNights: 6 },
        29: { minNights: 6 },
        30: { minNights: 6 },
        31: { minNights: 6 },
        32: { minNights: 6 },

        // EFTERÅRSFERIE (uge 42)
        42: { minNights: 3 },
      },
    },

    2027: {
      // Fallback uden for de specificerede perioder
      default: {
        price: 3700, // generel lavsæson; justér hvis du vil splitte weekday/weekend
        weekendDays: ["fri", "sat"],
        minNights: 2, // globalt default minimum booking
      },
      // Sommeren + vinter/forår er dagsspecifik (mest præcis ift. Airbnb)
      days: days2027,
      daysMinNights: daysMinNights2027,
      weeks: {
        // VINTERFERIE (uge 7)
        7: { minNights: 3 },

        // SOMMERFERIE (uge 27–32)
        27: { minNights: 6 },
        28: { minNights: 6 },
        29: { minNights: 6 },
        30: { minNights: 6 },
        31: { minNights: 6 },
        32: { minNights: 6 },

        // EFTERÅRSFERIE (uge 42)
        42: { minNights: 3 },
      },
    },
  },
};

/* =========
 * Hjælpere (uændret)
 *  Prioritet: dagspris > ugepris > år-default > null
 * ========= */

export function dayCodeOf(d: Date): DayCode {
  const i = d.getDay(); // 0=Sun..6=Sat
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as DayCode[])[i];
}

export function isoWeek(d: Date): number {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7; // 1..7, hvor 7=søndag
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
}

export function getPriceForDate(
  date: Date,
  plan: PricePlan = PRICES
): number | null {
  const y = date.getFullYear();
  const yr = plan.years[y];
  if (!yr) return null;

  // 1) Dags-override (YYYY-MM-DD)
  const ymd = date.toISOString().slice(0, 10);
  if (yr.days && yr.days[ymd] != null) return yr.days[ymd]!;

  // 2) Ugepris
  const w = isoWeek(date);
  const wp = yr.weeks?.[w];
  if (wp) {
    const dc = dayCodeOf(date);
    if (wp.days && wp.days[dc] != null) return wp.days[dc]!;
    if (wp.weekdays != null || wp.weekend != null) {
      const weekend = wp.weekendDays ?? DEFAULT_WEEKEND;
      const isWeekend = weekend.includes(dc);
      const val = isWeekend ? wp.weekend : wp.weekdays;
      if (val != null) return val!;
    }
    if (wp.price != null) return wp.price;
  }

  // 3) Års-default
  if (yr.default) {
    const def = yr.default;
    if (def.price != null) return def.price;
    const weekend = def.weekendDays ?? DEFAULT_WEEKEND;
    const isWeekend = weekend.includes(dayCodeOf(date));
    const val = isWeekend ? def.weekend : def.weekdays;
    if (val != null) return val!;
  }

  return null;
}
