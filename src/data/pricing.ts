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
  /** Valgfri: rengøringsgebyr specifikt for denne uge */
  cleaningFeeDKK?: number;
};

/** Last minute rabat — procent baseret på hvor tæt vi er på datoen. */
export type LastMinuteTier = {
  /** Hvis antal hele dage til datoen er <= denne værdi, så brug denne rabat i % */
  daysOrLess: number;
  /** Rabat i procent (0–100) */
  percentOff: number;
};

export type LastMinuteRule = {
  /** Inklusiv datointerval i YYYY-MM-DD */
  from: string;
  to: string;
  /** Trin (f.eks. 14→10%, 7→20%, 3→30%). Vælger automatisk det højeste match. */
  tiers: LastMinuteTier[];
  /**
   * Valgfri: begræns til bestemte dage.
   * - "weekend" = bruger årets weekendDays (eller DEFAULT_WEEKEND)
   * - "weekday" = alle andre end weekend
   * - "all"     = alle dage (default hvis udeladt)
   * - DayCode[] = præcise ugedage (fx ["fri","sat"])
   */
  days?: DayCode[] | "weekend" | "weekday" | "all";
};

/** Årsniveau:
 *  - default: fallback-priser for hele året (bruges når uge ikke er sat)
 *  - weeks: ISO-uge → WeekPricing
 *  - days: dato → pris (YYYY-MM-DD, overrides alt andet)
 *  - daysMinNights: dato → min. nætter for ankomstdag (YYYY-MM-DD, højeste prioritet)
 *  - daysCleaningFeeDKK: dato → specifikt rengøringsgebyr
 *  - lastMinuteRules: valgfri last-minute rabatter (default: ingen)
 */
export type YearPricing = {
  default?: {
    price?: number;
    weekdays?: number;
    weekend?: number;
    weekendDays?: DayCode[];
    /** Global fallback for min. nætter i året */
    minNights?: number;
    /** Standard rengøringsgebyr for året */
    cleaningFeeDKK?: number;
  };
  weeks?: Partial<Record<number, WeekPricing>>;
  days?: Partial<Record<string, number>>;
  daysMinNights?: Partial<Record<string, number>>;
  daysCleaningFeeDKK?: Partial<Record<string, number>>;
  /** Valgfri liste af last-minute regler for året (default = ingen rabat) */
  lastMinuteRules?: LastMinuteRule[];
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
export const DEFAULT_CLEANING_FEE_DKK = 1500;

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

  const ymd = toYMDLocal(date);
  if (yr.daysMinNights && yr.daysMinNights[ymd] != null) {
    return yr.daysMinNights[ymd]!;
  }

  const w = isoWeek(date);
  const wp = yr.weeks?.[w];
  if (wp?.minNights != null) return wp.minNights;

  if (yr.default?.minNights != null) return yr.default.minNights;

  return GLOBAL_FALLBACK;
}

type DateRange = { from: string; to: string };

type SchoolHolidayCalendar = {
  winterBreak: DateRange;
  easterBreak: DateRange;
  ascensionBreak: DateRange;
  pentecostBreak: DateRange;
  summerBreak: DateRange;
  autumnBreak: DateRange;
  christmasBreak: DateRange;
};

type YearMarketProfile = {
  schoolHolidays: SchoolHolidayCalendar;
  newYearPeak: DateRange;
};

const VISITOR_PRICE_STORAGE_KEY = "fh61_price_profile_v1";
const FIRST_VISIT_INTRO_DISCOUNT_PCT = 6;
let visitorPriceMultiplierCache: number | null = null;

// Market-informed benchmark:
// - Fjellerup / Norddjurs coastal placement
// - large family house
// - heated pool + spa + sauna
// - lead-time behavior inspired by current Danish summerhouse market patterns
const MARKET_BENCHMARK_NIGHT_DKK = 1500;
const PROPERTY_PROFILE_MULTIPLIER =
  1 +
  0.11 + // beach / forest placement in Djursland
  0.27 + // pool premium
  0.09 + // spa premium
  0.05 + // sauna premium
  0.15; // sleeps 10 / large-house premium
const PROPERTY_MARKET_ANCHOR_DKK = Math.round(
  MARKET_BENCHMARK_NIGHT_DKK * PROPERTY_PROFILE_MULTIPLIER
);

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysLocal(d: Date, days: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + days);
  return x;
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isoWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const mondayWeek1 = addDaysLocal(jan4, 1 - jan4Day);
  return addDaysLocal(mondayWeek1, (week - 1) * 7);
}

function isoWeekRange(year: number, fromWeek: number, toWeek: number): DateRange {
  const start = isoWeekStart(year, fromWeek);
  const end = addDaysLocal(isoWeekStart(year, toWeek), 6);
  return { from: toYMDLocal(start), to: toYMDLocal(end) };
}

function buildSchoolHolidayCalendar(year: number): SchoolHolidayCalendar {
  const easter = easterSunday(year);
  const ascension = addDaysLocal(easter, 39);
  const pentecost = addDaysLocal(easter, 49);

  return {
    winterBreak: isoWeekRange(year, 7, 7),
    easterBreak: {
      from: toYMDLocal(addDaysLocal(easter, -7)),
      to: toYMDLocal(addDaysLocal(easter, 1)),
    },
    ascensionBreak: {
      from: toYMDLocal(ascension),
      to: toYMDLocal(addDaysLocal(ascension, 3)),
    },
    pentecostBreak: {
      from: toYMDLocal(addDaysLocal(pentecost, -1)),
      to: toYMDLocal(addDaysLocal(pentecost, 1)),
    },
    summerBreak: isoWeekRange(year, 27, 32),
    autumnBreak: isoWeekRange(year, 42, 42),
    christmasBreak: {
      from: `${year}-12-20`,
      to: `${year + 1}-01-03`,
    },
  };
}

function isWithinRange(date: Date, range: DateRange): boolean {
  const value = toYMDLocal(date);
  return value >= range.from && value <= range.to;
}

function roundPriceDKK(value: number): number {
  return Math.round(value / 5) * 5;
}

function monthBaseMultiplier(date: Date): number {
  const month = date.getMonth() + 1;
  if (month === 1 || month === 2) return 0.4;
  if (month === 3) return 0.44;
  if (month === 4) return 0.91;
  if (month === 5) return 1.12;
  if (month === 6) return 1.24;
  if (month === 7 || month === 8) return 1.33;
  if (month === 9) return 1.18;
  if (month === 10) return 0.72;
  if (month === 11) return 0.64;
  return 0.7;
}

function danishPublicHolidayType(date: Date): string | null {
  const year = date.getFullYear();
  const easter = easterSunday(year);
  const holidays: Record<string, string> = {
    [`${year}-01-01`]: "new-year",
    [toYMDLocal(addDaysLocal(easter, -3))]: "maundy-thursday",
    [toYMDLocal(addDaysLocal(easter, -2))]: "good-friday",
    [toYMDLocal(easter)]: "easter-sunday",
    [toYMDLocal(addDaysLocal(easter, 1))]: "easter-monday",
    [toYMDLocal(addDaysLocal(easter, 39))]: "ascension-day",
    [toYMDLocal(addDaysLocal(easter, 49))]: "pentecost-sunday",
    [toYMDLocal(addDaysLocal(easter, 50))]: "pentecost-monday",
    [`${year}-06-05`]: "constitution-day",
    [`${year}-12-24`]: "christmas-eve",
    [`${year}-12-25`]: "christmas-day",
    [`${year}-12-26`]: "boxing-day",
    [`${year}-12-31`]: "new-years-eve",
  };

  return holidays[toYMDLocal(date)] ?? null;
}

function isBridgeDay(date: Date): boolean {
  const dc = dayCodeOf(date);
  if (dc !== "fri" && dc !== "mon") return false;
  const prev = addDaysLocal(date, -1);
  const next = addDaysLocal(date, 1);
  return Boolean(danishPublicHolidayType(prev) || danishPublicHolidayType(next));
}

function holidayFloorMultiplier(date: Date, profile: YearMarketProfile): number {
  const holidays = profile.schoolHolidays;

  if (toYMDLocal(date).endsWith("-12-31")) return 2.2;
  if (isWithinRange(date, profile.newYearPeak)) return 2.0;
  if (isWithinRange(date, holidays.christmasBreak)) return 1.0;
  if (isWithinRange(date, holidays.summerBreak)) return 1.33;
  if (isWithinRange(date, holidays.easterBreak)) return 1.06;
  if (isWithinRange(date, holidays.winterBreak)) return 0.84;
  if (isWithinRange(date, holidays.autumnBreak)) return 0.88;
  if (isWithinRange(date, holidays.ascensionBreak)) return 1.12;
  if (isWithinRange(date, holidays.pentecostBreak)) return 1.08;

  const publicHoliday = danishPublicHolidayType(date);
  if (publicHoliday === "christmas-eve") return 1.16;
  if (publicHoliday === "christmas-day" || publicHoliday === "boxing-day")
    return 1.12;
  if (publicHoliday === "constitution-day") return 1.06;
  if (publicHoliday) return 1.04;

  return 0;
}

function nightlyDemandMultiplier(date: Date, profile: YearMarketProfile): number {
  const weekend = DEFAULT_WEEKEND.includes(dayCodeOf(date)) ? 1.05 : 1;
  const bridge = isBridgeDay(date) ? 1.04 : 1;
  const monthBase = monthBaseMultiplier(date);
  const floor = holidayFloorMultiplier(date, profile);
  return Math.max(monthBase, floor) * weekend * bridge;
}

function yearDefaultPrice(year: number): number {
  const reference = new Date(year, 9, 1);
  const multiplier = monthBaseMultiplier(reference);
  return roundPriceDKK(PROPERTY_MARKET_ANCHOR_DKK * multiplier);
}

function computeCleaningFee(date: Date, profile: YearMarketProfile): number {
  const month = date.getMonth() + 1;
  if (
    isWithinRange(date, profile.schoolHolidays.summerBreak) ||
    isWithinRange(date, profile.newYearPeak)
  ) {
    return DEFAULT_CLEANING_FEE_DKK;
  }
  if (month <= 3 || month === 11) return 1000;
  if (month === 4 || month === 10 || month === 12) return 1250;
  return DEFAULT_CLEANING_FEE_DKK;
}

function computeMinNights(date: Date, profile: YearMarketProfile): number {
  const holidays = profile.schoolHolidays;
  if (isWithinRange(date, profile.newYearPeak)) return 4;
  if (isWithinRange(date, holidays.summerBreak)) return 6;
  if (
    isWithinRange(date, holidays.winterBreak) ||
    isWithinRange(date, holidays.easterBreak) ||
    isWithinRange(date, holidays.autumnBreak) ||
    isWithinRange(date, holidays.christmasBreak) ||
    isWithinRange(date, holidays.ascensionBreak) ||
    isWithinRange(date, holidays.pentecostBreak)
  ) {
    return 3;
  }
  return 2;
}

function computeGeneratedNightlyPrice(date: Date, profile: YearMarketProfile): number {
  const multiplier = nightlyDemandMultiplier(date, profile);
  let price = PROPERTY_MARKET_ANCHOR_DKK * multiplier;

  if (dayCodeOf(date) === "sun" && monthBaseMultiplier(date) < 0.8) {
    price *= 0.96;
  }

  return roundPriceDKK(price);
}

function buildYearMarketProfile(year: number): YearMarketProfile {
  return {
    schoolHolidays: buildSchoolHolidayCalendar(year),
    newYearPeak: {
      from: `${year}-12-27`,
      to: `${year}-12-31`,
    },
  };
}

function generateYearPricing(year: number): YearPricing {
  const profile = buildYearMarketProfile(year);
  const days: Partial<Record<string, number>> = {};
  const daysMinNights: Partial<Record<string, number>> = {};
  const daysCleaningFeeDKK: Partial<Record<string, number>> = {};
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d = addDaysLocal(d, 1)) {
    const ymd = toYMDLocal(d);
    days[ymd] = computeGeneratedNightlyPrice(d, profile);

    const minNights = computeMinNights(d, profile);
    if (minNights !== 2) daysMinNights[ymd] = minNights;

    const cleaningFee = computeCleaningFee(d, profile);
    if (cleaningFee !== DEFAULT_CLEANING_FEE_DKK) {
      daysCleaningFeeDKK[ymd] = cleaningFee;
    }
  }

  return {
    default: {
      price: yearDefaultPrice(year),
      weekendDays: DEFAULT_WEEKEND,
      minNights: 2,
      cleaningFeeDKK: DEFAULT_CLEANING_FEE_DKK,
    },
    days,
    daysMinNights,
    daysCleaningFeeDKK,
    weeks: {
      7: { minNights: 3, note: "Vinterferie" },
      27: { minNights: 6, note: "Sommerferie" },
      28: { minNights: 6, note: "Sommerferie" },
      29: { minNights: 6, note: "Sommerferie" },
      30: { minNights: 6, note: "Sommerferie" },
      31: { minNights: 6, note: "Sommerferie" },
      32: { minNights: 6, note: "Sommerferie" },
      42: { minNights: 3, note: "Efterårsferie" },
    },
  };
}

/* =========
 * Eksporter prisplan
 * ========= */

export const PRICES: PricePlan = {
  currency: "DKK",
  years: {
    2025: generateYearPricing(2025),
    2026: generateYearPricing(2026),
    2027: generateYearPricing(2027),
  },
};

/* =========
 * Hjælpere (uændret + last-minute)
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

/* ─── Last-minute helpers ─── */

function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseYMD(ymd: string): Date {
  return new Date(ymd + "T00:00:00");
}

function isWithinYMD(date: Date, fromYMD: string, toYMD: string): boolean {
  const x = startOfDayLocal(date);
  return x >= parseYMD(fromYMD) && x <= parseYMD(toYMD);
}

function getLeadTimeAdjustmentPercent(date: Date): number {
  const today = startOfDayLocal(new Date());
  const target = startOfDayLocal(date);
  const daysUntil = Math.floor((target.getTime() - today.getTime()) / 86400000);
  if (daysUntil < 0) return 0;

  if (daysUntil <= 3) return 18;
  if (daysUntil <= 7) return 12;
  if (daysUntil <= 21) return 6;

  const profile = buildYearMarketProfile(date.getFullYear());
  const farAheadSummerDemand =
    isWithinRange(date, profile.schoolHolidays.summerBreak) && daysUntil >= 120;
  const farAheadHolidayDemand =
    isWithinRange(date, profile.schoolHolidays.easterBreak) && daysUntil >= 60;

  if (farAheadSummerDemand) return -4;
  if (farAheadHolidayDemand) return -2;
  return 0;
}

function getVisitorPriceMultiplier(): number {
  if (typeof window === "undefined") return 1;
  if (visitorPriceMultiplierCache != null) return visitorPriceMultiplierCache;

  try {
    const raw = window.localStorage.getItem(VISITOR_PRICE_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        VISITOR_PRICE_STORAGE_KEY,
        JSON.stringify({
          activatedAt: new Date().toISOString(),
          lockedMultiplier: 1,
        })
      );
      visitorPriceMultiplierCache = 1 - FIRST_VISIT_INTRO_DISCOUNT_PCT / 100;
      return visitorPriceMultiplierCache;
    }
  } catch {
    visitorPriceMultiplierCache = 1;
    return visitorPriceMultiplierCache;
  }

  visitorPriceMultiplierCache = 1;
  return visitorPriceMultiplierCache;
}

function applyLeadTimeAdjustment(
  date: Date,
  base: number | null,
): number | null {
  if (base == null) return base;
  const percent = getLeadTimeAdjustmentPercent(date);
  if (percent === 0) return base;

  const multiplier = percent > 0 ? 1 - percent / 100 : 1 + Math.abs(percent) / 100;
  return roundPriceDKK(base * multiplier);
}

/** Anvend evt. last-minute rabat (i procent) på en grundpris. */
function applyLastMinuteDiscount(
  date: Date,
  base: number | null,
  plan: PricePlan
): number | null {
  if (base == null) return base;

  const leadTimeAdjusted = applyLeadTimeAdjustment(date, base);

  const y = date.getFullYear();
  const yr = plan.years[y];
  const rules = yr?.lastMinuteRules;
  if (!rules || rules.length === 0) return leadTimeAdjusted; // default: ingen rabat

  const today = startOfDayLocal(new Date());
  const target = startOfDayLocal(date);
  const daysUntil = Math.floor((target.getTime() - today.getTime()) / 86400000);
  if (daysUntil < 0) return leadTimeAdjusted; // ingen rabat for fortid

  // Brug årets weekenddefinition hvis en regel siger "weekend"
  const yearWeekend =
    yr?.default?.weekendDays && yr.default.weekendDays.length > 0
      ? yr.default.weekendDays
      : DEFAULT_WEEKEND;

  const dc = dayCodeOf(date);
  let maxPercent = 0;

  for (const r of rules) {
    if (!isWithinYMD(date, r.from, r.to)) continue;

    // Dagsfilter
    let dayOk = true;
    if (r.days && r.days !== "all") {
      if (r.days === "weekend") {
        dayOk = yearWeekend.includes(dc);
      } else if (r.days === "weekday") {
        dayOk = !yearWeekend.includes(dc);
      } else {
        dayOk = (r.days as DayCode[]).includes(dc);
      }
    }
    if (!dayOk) continue;

    // Find bedste (største) procent der matcher daysUntil
    let tierPct = 0;
    for (const t of r.tiers) {
      if (daysUntil <= t.daysOrLess) {
        tierPct = Math.max(tierPct, t.percentOff);
      }
    }
    maxPercent = Math.max(maxPercent, tierPct);
  }

  if (maxPercent <= 0) return leadTimeAdjusted;

  // Rund af til heltal som resten af prisplanen
  return roundPriceDKK((leadTimeAdjusted ?? base) * (1 - maxPercent / 100));
}

function applyVisitorAdjustment(base: number | null): number | null {
  if (base == null) return base;
  return roundPriceDKK(base * getVisitorPriceMultiplier());
}

export function getPriceForDate(
  date: Date,
  plan: PricePlan = PRICES
): number | null {
  const y = date.getFullYear();
  const yr = plan.years[y];
  if (!yr) return null;

  // 1) Dags-override (YYYY-MM-DD)
  const ymd = toYMDLocal(date);
  if (yr.days && yr.days[ymd] != null)
    return applyVisitorAdjustment(applyLastMinuteDiscount(date, yr.days[ymd]!, plan));

  // 2) Ugepris
  const w = isoWeek(date);
  const wp = yr.weeks?.[w];
  if (wp) {
    const dc = dayCodeOf(date);
    if (wp.days && wp.days[dc] != null)
      return applyVisitorAdjustment(
        applyLastMinuteDiscount(date, wp.days[dc]!, plan)
      );

    if (wp.weekdays != null || wp.weekend != null) {
      const weekend = wp.weekendDays ?? DEFAULT_WEEKEND;
      const isWeekend = weekend.includes(dc);
      const val = isWeekend ? wp.weekend : wp.weekdays;
      if (val != null)
        return applyVisitorAdjustment(applyLastMinuteDiscount(date, val!, plan));
    }
    if (wp.price != null)
      return applyVisitorAdjustment(applyLastMinuteDiscount(date, wp.price, plan));
  }

  // 3) Års-default
  if (yr.default) {
    const def = yr.default;
    if (def.price != null)
      return applyVisitorAdjustment(applyLastMinuteDiscount(date, def.price, plan));
    const weekend = def.weekendDays ?? DEFAULT_WEEKEND;
    const isWeekend = weekend.includes(dayCodeOf(date));
    const val = isWeekend ? def.weekend : def.weekdays;
    if (val != null)
      return applyVisitorAdjustment(applyLastMinuteDiscount(date, val!, plan));
  }

  return null;
}

/** Rengøringsgebyr for en given dato.
 * Prioritet: dags-specifik > uge-specifik > år-default > global default.
 */
export function getCleaningFeeForDate(
  date: Date,
  plan: PricePlan = PRICES
): number {
  const y = date.getFullYear();
  const yr = plan.years[y];
  if (!yr) return DEFAULT_CLEANING_FEE_DKK;

  const ymd = toYMDLocal(date);

  // 1) Dags-specifik rengøring
  const dayFee = yr.daysCleaningFeeDKK?.[ymd];
  if (typeof dayFee === "number") return dayFee;

  // 2) Uge-specifik rengøring
  const w = isoWeek(date);
  const wp = yr.weeks?.[w];
  if (wp?.cleaningFeeDKK != null) return wp.cleaningFeeDKK;

  // 3) Års-default
  if (yr.default?.cleaningFeeDKK != null) return yr.default.cleaningFeeDKK;

  // 4) Global fallback
  return DEFAULT_CLEANING_FEE_DKK;
}

/* =========
 * Brug af lastMinuteRules (eksempler – IKKE aktiv som standard)
 * =========
 *
 * // 1) Kun weekender (bruger year's weekendDays el. DEFAULT_WEEKEND)
 * years[2025].lastMinuteRules = [
 *   {
 *     from: "2025-09-19",
 *     to:   "2025-11-30",
 *     days: "weekend",
 *     tiers: [
 *       { daysOrLess: 14, percentOff: 10 },
 *       { daysOrLess: 7,  percentOff: 20 },
 *       { daysOrLess: 3,  percentOff: 30 },
 *     ],
 *   },
 * ];
 *
 * // 2) Hele uger/alle dage i et datointerval
 * years[2026].lastMinuteRules = [
 *   {
 *     from: "2026-04-01",
 *     to:   "2026-04-30",
 *     days: "all", // eller udelad 'days'
 *     tiers: [{ daysOrLess: 10, percentOff: 15 }],
 *   },
 * ];
 *
 */
