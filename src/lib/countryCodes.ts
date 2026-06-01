// src/lib/countryCodes.ts

/** UI-sprog til labels */
export type UiLang = "da" | "en" | "de";

/** ISO 3166-1 alpha-2 koder vi understøtter i UI’et */
export type ISO2 =
  | "DK"
  | "SE"
  | "NO"
  | "FI"
  | "DE"
  | "GB"
  | "IE"
  | "NL"
  | "BE"
  | "FR"
  | "ES"
  | "IT"
  | "PT"
  | "AT"
  | "CH"
  | "PL"
  | "CZ";

/** Basisdata til dropdown og labels */
type C = { iso: ISO2; dial: `+${number}`; nameDa: string; nameEn: string; nameDe: string };

const COUNTRIES: C[] = [
  { iso: "DK", dial: "+45", nameDa: "Danmark", nameEn: "Denmark", nameDe: "Dänemark" },
  { iso: "SE", dial: "+46", nameDa: "Sverige", nameEn: "Sweden", nameDe: "Schweden" },
  { iso: "NO", dial: "+47", nameDa: "Norge", nameEn: "Norway", nameDe: "Norwegen" },
  { iso: "FI", dial: "+358", nameDa: "Finland", nameEn: "Finland", nameDe: "Finnland" },
  { iso: "DE", dial: "+49", nameDa: "Tyskland", nameEn: "Germany", nameDe: "Deutschland" },
  {
    iso: "GB",
    dial: "+44",
    nameDa: "Storbritannien",
    nameEn: "United Kingdom",
    nameDe: "Vereinigtes Königreich",
  },
  { iso: "IE", dial: "+353", nameDa: "Irland", nameEn: "Ireland", nameDe: "Irland" },
  { iso: "NL", dial: "+31", nameDa: "Holland", nameEn: "Netherlands", nameDe: "Niederlande" },
  { iso: "BE", dial: "+32", nameDa: "Belgien", nameEn: "Belgium", nameDe: "Belgien" },
  { iso: "FR", dial: "+33", nameDa: "Frankrig", nameEn: "France", nameDe: "Frankreich" },
  { iso: "ES", dial: "+34", nameDa: "Spanien", nameEn: "Spain", nameDe: "Spanien" },
  { iso: "IT", dial: "+39", nameDa: "Italien", nameEn: "Italy", nameDe: "Italien" },
  { iso: "PT", dial: "+351", nameDa: "Portugal", nameEn: "Portugal", nameDe: "Portugal" },
  { iso: "AT", dial: "+43", nameDa: "Østrig", nameEn: "Austria", nameDe: "Österreich" },
  { iso: "CH", dial: "+41", nameDa: "Schweiz", nameEn: "Switzerland", nameDe: "Schweiz" },
  { iso: "PL", dial: "+48", nameDa: "Polen", nameEn: "Poland", nameDe: "Polen" },
  { iso: "CZ", dial: "+420", nameDa: "Tjekkiet", nameEn: "Czechia", nameDe: "Tschechien" },
];

export function allCountries(): ReadonlyArray<C> {
  return COUNTRIES;
}

export function findCountry(iso: ISO2): C | undefined {
  return COUNTRIES.find((c) => c.iso === iso);
}

export function countryLabel(iso: ISO2, lang: UiLang): string {
  const c = findCountry(iso);
  if (!c) return iso;
  if (lang === "da") return c.nameDa;
  if (lang === "de") return c.nameDe;
  return c.nameEn;
}

/** Gæt ud fra navigator.language – fallback DK */
export function defaultCountryFromNavigator(): ISO2 {
  const l = (
    typeof navigator !== "undefined" ? navigator.language : "da"
  ).toLowerCase();
  if (l.startsWith("da")) return "DK";
  if (l.startsWith("sv")) return "SE";
  if (l.startsWith("no") || l.startsWith("nb") || l.startsWith("nn"))
    return "NO";
  if (l.startsWith("fi")) return "FI";
  if (l.startsWith("de")) return "DE";
  if (l.startsWith("en-gb")) return "GB";
  if (l.startsWith("en")) return "GB";
  if (l.startsWith("nl")) return "NL";
  if (l.startsWith("fr")) return "FR";
  if (l.startsWith("es")) return "ES";
  if (l.startsWith("it")) return "IT";
  if (l.startsWith("pt")) return "PT";
  if (l.startsWith("pl")) return "PL";
  if (l.startsWith("cs")) return "CZ";
  return "DK";
}
