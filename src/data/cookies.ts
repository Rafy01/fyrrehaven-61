export type CookieEntry = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: string;
};

export type CookieCategory = {
  necessary: CookieEntry[];
  statistics: CookieEntry[];
};

export const cookieData: Record<"da" | "en" | "de", CookieCategory> = {
  da: {
    necessary: [
      {
        name: "fh61_cookie_consent",
        provider: "fyrrehaven-61.dk",
        purpose: "Husker dine cookievalg",
        duration: "6 måneder",
        type: "http",
      },
    ],
    statistics: [
      {
        name: "_ga / _ga_*",
        provider: "Google Analytics",
        purpose: "Måler besøg og hjælper os med at forstå hvilke sider der bruges.",
        duration: "op til 2 år",
        type: "http",
      },
    ],
  },
  de: {
    necessary: [
      {
        name: "fh61_cookie_consent",
        provider: "fyrrehaven-61.dk",
        purpose: "Merkt Ihre Cookie-Auswahl",
        duration: "6 Monate",
        type: "http",
      },
    ],
    statistics: [
      {
        name: "_ga / _ga_*",
        provider: "Google Analytics",
        purpose: "Misst Besuche und hilft uns zu verstehen, welche Seiten genutzt werden.",
        duration: "bis zu 2 Jahre",
        type: "http",
      },
    ],
  },
  en: {
    necessary: [
      {
        name: "fh61_cookie_consent",
        provider: "fyrrehaven-61.dk",
        purpose: "Remembers your cookie choices",
        duration: "6 months",
        type: "http",
      },
    ],
    statistics: [
      {
        name: "_ga / _ga_*",
        provider: "Google Analytics",
        purpose: "Measures visits and helps us understand which pages are used.",
        duration: "up to 2 years",
        type: "http",
      },
    ],
  },
};
