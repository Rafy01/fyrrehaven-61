// src/lib/countryCodes.ts
const COUNTRIES = [
    { iso: "DK", dial: "+45", nameDa: "Danmark", nameEn: "Denmark" },
    { iso: "SE", dial: "+46", nameDa: "Sverige", nameEn: "Sweden" },
    { iso: "NO", dial: "+47", nameDa: "Norge", nameEn: "Norway" },
    { iso: "FI", dial: "+358", nameDa: "Finland", nameEn: "Finland" },
    { iso: "DE", dial: "+49", nameDa: "Tyskland", nameEn: "Germany" },
    {
        iso: "GB",
        dial: "+44",
        nameDa: "Storbritannien",
        nameEn: "United Kingdom",
    },
    { iso: "IE", dial: "+353", nameDa: "Irland", nameEn: "Ireland" },
    { iso: "NL", dial: "+31", nameDa: "Holland", nameEn: "Netherlands" },
    { iso: "BE", dial: "+32", nameDa: "Belgien", nameEn: "Belgium" },
    { iso: "FR", dial: "+33", nameDa: "Frankrig", nameEn: "France" },
    { iso: "ES", dial: "+34", nameDa: "Spanien", nameEn: "Spain" },
    { iso: "IT", dial: "+39", nameDa: "Italien", nameEn: "Italy" },
    { iso: "PT", dial: "+351", nameDa: "Portugal", nameEn: "Portugal" },
    { iso: "AT", dial: "+43", nameDa: "Østrig", nameEn: "Austria" },
    { iso: "CH", dial: "+41", nameDa: "Schweiz", nameEn: "Switzerland" },
    { iso: "PL", dial: "+48", nameDa: "Polen", nameEn: "Poland" },
    { iso: "CZ", dial: "+420", nameDa: "Tjekkiet", nameEn: "Czechia" },
];
export function allCountries() {
    return COUNTRIES;
}
export function findCountry(iso) {
    return COUNTRIES.find((c) => c.iso === iso);
}
export function countryLabel(iso, lang) {
    const c = findCountry(iso);
    if (!c)
        return iso;
    return lang === "da" ? c.nameDa : c.nameEn;
}
/** Gæt ud fra navigator.language – fallback DK */
export function defaultCountryFromNavigator() {
    const l = (typeof navigator !== "undefined" ? navigator.language : "da").toLowerCase();
    if (l.startsWith("da"))
        return "DK";
    if (l.startsWith("sv"))
        return "SE";
    if (l.startsWith("no") || l.startsWith("nb") || l.startsWith("nn"))
        return "NO";
    if (l.startsWith("fi"))
        return "FI";
    if (l.startsWith("de"))
        return "DE";
    if (l.startsWith("en-gb"))
        return "GB";
    if (l.startsWith("en"))
        return "GB";
    if (l.startsWith("nl"))
        return "NL";
    if (l.startsWith("fr"))
        return "FR";
    if (l.startsWith("es"))
        return "ES";
    if (l.startsWith("it"))
        return "IT";
    if (l.startsWith("pt"))
        return "PT";
    if (l.startsWith("pl"))
        return "PL";
    if (l.startsWith("cs"))
        return "CZ";
    return "DK";
}
