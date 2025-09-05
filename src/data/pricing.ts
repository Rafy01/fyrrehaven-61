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
  /** Samme pris alle 7 dage i ugen (ISO-uge, man–søn). */
  price?: number;

  /** Pris for hverdage i ugen. Som standard: man–tor. */
  weekdays?: number;

  /** Pris for weekenddage i ugen. Som standard: fre–lør (se weekendDays). */
  weekend?: number;

  /** Hvilke ugedage regnes som weekend i *denne* uge. Default: ["fri","sat"]. */
  weekendDays?: DayCode[];

  /** Dagsspecifik pris (overrides ovenstående for den valgte dag). */
  days?: Partial<Record<DayCode, number>>;

  /** Valgfri note til internt brug. */
  note?: string;
};

/** Årsniveau:
 *  - default: fallback-priser for hele året (bruges når uge ikke er sat)
 *  - weeks: ISO-uge → WeekPricing
 *  - days: dato → pris (YYYY-MM-DD, overrides alt andet)
 */
export type YearPricing = {
  /** Standard for hele året (hvis uge/dags pris ikke er sat). */
  default?: {
    /** Samme pris alle dage. Hvis sat, trumfer den weekdays/weekend her. */
    price?: number;

    /** Hverdagspris (årsniveau). Som standard: man–tor. */
    weekdays?: number;

    /** Weekendpris (årsniveau). Som standard: fre–lør. */
    weekend?: number;

    /** Hvilke dage der regnes som weekend på årsniveau. Default: ["fri","sat"]. */
    weekendDays?: DayCode[];
  };

  /** ISO-uge (1..53) → ugepris-konfiguration. */
  weeks?: Partial<Record<number, WeekPricing>>;

  /** Enkelt-dags overrides (YYYY-MM-DD → pris). */
  days?: Partial<Record<string, number>>;
};

/** Hele prisplanen (flere år). */
export type PricePlan = {
  currency: Currency;
  years: Record<number, YearPricing>;
};

/* =========
 * Defaults
 * ========= */

/** Standard weekend-dage hvis ikke andet er angivet. */
export const DEFAULT_WEEKEND: DayCode[] = ["fri", "sat"];

/* =========
 * DIN DATA (eksempel — ret frit!)
 * ========= */

export const PRICES: PricePlan = {
  currency: "DKK",
  years: {
    /* =====================
     *        2025
     * ===================== */
    2025: {
      // Fallback for hele året: man–tor billigere, fre–lør dyrere.
      default: {
        weekdays: 1800,
        weekend: 2400,
        weekendDays: ["fri", "sat"], // kan ændres pr. år
      },

      // ISO-uger (man–søn). Ugepris trumfer år-default i de uger.
      weeks: {
        // Uge 7: samme pris hele ugen
        7: { price: 2200, note: "Vinterferie" },

        // Uge 28: høj sæson — hverdage/weekend split
        28: { weekdays: 2600, weekend: 3200 },

        // Uge 29 + 30: flad ugepris
        29: { price: 3500 },
        30: { price: 3500 },

        // Uge 42: efterårsferie med split
        42: { weekdays: 2200, weekend: 2800 },

        // Uge 52: juleuge – specifikke dagspriser (trumfer alt i denne uge)
        52: {
          days: {
            tue: 2800, // tirsdag
            wed: 3200, // onsdag
            thu: 3600, // torsdag
            fri: 4200, // fredag (lillejuleaften/juledage kan variere)
            sat: 4200, // lørdag
          },
          note: "Juleugen – dagsspecifik",
        },
      },

      // Enkelt-dags overrides (YYYY-MM-DD) — højeste prioritet
      days: {
        "2025-12-24": 3800, // Juleaften
        "2025-12-31": 4200, // Nytårsaften
      },
    },

    /* =====================
     *        2026
     * ===================== */
    2026: {
      default: {
        weekdays: 1850,
        weekend: 2450,
        weekendDays: ["fri", "sat"],
      },
      weeks: {
        27: { price: 3200 },
        28: { price: 3600 },
        29: { weekdays: 3000, weekend: 3600 },
      },
      days: {
        "2026-12-31": 4300,
      },
    },
  },
};

/* =========
 * (Valgfrit) Hjælpere — praktisk når vi skal bruge det i kalenderen
 *  Prioritet: dagspris > ugepris > år-default > null
 * ========= */

/** Map JS Date.getDay() → vores DayCode */
export function dayCodeOf(d: Date): DayCode {
  const i = d.getDay(); // 0=Sun..6=Sat
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as DayCode[])[i];
}

/** ISO-uge (1..53) for lokal dato. */
export function isoWeek(d: Date): number {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Torsdag i denne uge afgør uge-nummeret
  const dayNum = tmp.getUTCDay() || 7; // 1..7, hvor 7=søndag
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
}

/** Hent pris for en given lokal dato. */
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
    // 2a) Dag i ugen specifikt
    const dc = dayCodeOf(date);
    if (wp.days && wp.days[dc] != null) return wp.days[dc]!;

    // 2b) Weekend/hverdag split i ugen
    if (wp.weekdays != null || wp.weekend != null) {
      const weekend = wp.weekendDays ?? DEFAULT_WEEKEND;
      const isWeekend = weekend.includes(dc);
      const val = isWeekend ? wp.weekend : wp.weekdays;
      if (val != null) return val!;
    }

    // 2c) Flad ugepris
    if (wp.price != null) return wp.price;
  }

  // 3) Års-default
  if (yr.default) {
    const def = yr.default;

    // 3a) Flad årspris
    if (def.price != null) return def.price;

    // 3b) År: weekend/hverdag split
    const weekend = def.weekendDays ?? DEFAULT_WEEKEND;
    const isWeekend = weekend.includes(dayCodeOf(date));
    const val = isWeekend ? def.weekend : def.weekdays;
    if (val != null) return val!;
  }

  return null;
}
