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
        name: "fh61_analytics_visitor / fh61_analytics_session",
        provider: "Fyrrehaven 61",
        purpose:
          "Måler besøg, sider, enheder og anonym brugsstatistik med førstepartsdata, så vi kan forbedre hjemmesiden.",
        duration: "session og op til 6 måneder",
        type: "lokal/session storage",
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
        name: "fh61_analytics_visitor / fh61_analytics_session",
        provider: "Fyrrehaven 61",
        purpose:
          "Misst Besuche, Seiten, Geräte und anonyme Nutzungsstatistiken mit Erstanbieterdaten, damit wir die Website verbessern können.",
        duration: "Sitzung und bis zu 6 Monate",
        type: "Local/Session Storage",
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
        name: "fh61_analytics_visitor / fh61_analytics_session",
        provider: "Fyrrehaven 61",
        purpose:
          "Measures visits, pages, devices and anonymous usage statistics with first-party data so we can improve the website.",
        duration: "session and up to 6 months",
        type: "local/session storage",
      },
    ],
  },
};
