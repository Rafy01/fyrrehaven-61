import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { da } from "./i18n/da";
import { de } from "./i18n/de";
import { en } from "./i18n/en";
import { getNavigatorLang, getStoredLang, type Lang } from "./lib/lang";

const resources = {
  da,
  en,
  de,
} as const;

function getPathLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const [, first, second] = window.location.pathname.split("/");

  if (first === "guest") {
    return second === "da" || second === "en" || second === "de"
      ? second
      : null;
  }

  return first === "da" || first === "en" || first === "de" ? first : null;
}

const initialLang = getPathLang() ?? getStoredLang() ?? getNavigatorLang();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "da",
  ns: [
    "common",
    "home",
    "book",
    "area",
    "contact",
    "house",
    "facilities",
    "fees",
    "guest",
    "navigation",
    "footer",
    "seo",
  ],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
