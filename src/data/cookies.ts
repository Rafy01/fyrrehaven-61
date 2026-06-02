export type CookieEntry = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: string;
};

export type CookieCategory = {
  necessary: CookieEntry[];
  analytics: CookieEntry[];
  marketing: CookieEntry[];
};

export const cookieData: Record<"da" | "en" | "de", CookieCategory> = {
  da: {
    necessary: [
      {
        name: "_consent",
        provider: "fyrrehaven-61.dk",
        purpose: "Husker dine cookievalg",
        duration: "6 måneder",
        type: "http",
      },
      {
        name: "__cfruid",
        provider: "t.zopim.com",
        purpose: "Styrer trafik for at sikre webstedets stabilitet",
        duration: "Session",
        type: "http",
      },
    ],
    analytics: [
      {
        name: "_ga",
        provider: "Google",
        purpose: "Google Analytics – statistik",
        duration: "2 år",
        type: "http",
      },
      {
        name: "_ga_XXXXXXXXXX", // ← Udskift med din rigtige GA4-ID-cookie hvis ønsket
        provider: "Google",
        purpose: "Google Analytics – statistik",
        duration: "2 år",
        type: "http",
      },
    ],
    marketing: [
      {
        name: "_fbp",
        provider: "Meta",
        purpose: "Bruges af Facebook til annoncering",
        duration: "3 måneder",
        type: "http",
      },
      {
        name: "fr",
        provider: "Meta",
        purpose:
          "Bruges til at levere, måle og forbedre relevansen af annoncer",
        duration: "3 måneder",
        type: "http",
      },
      {
        name: "IDE",
        provider: "doubleclick.net",
        purpose: "Viser målrettede annoncer på Google-netværket",
        duration: "1 år",
        type: "http",
      },
    ],
  },
  de: {
    necessary: [
      {
        name: "_consent",
        provider: "fyrrehaven-61.dk",
        purpose: "Merkt Ihre Cookie-Auswahl",
        duration: "6 Monate",
        type: "http",
      },
      {
        name: "__cfruid",
        provider: "t.zopim.com",
        purpose: "Verwaltet Traffic, um die Stabilität der Website zu gewährleisten",
        duration: "Session",
        type: "http",
      },
    ],
    analytics: [
      {
        name: "_ga",
        provider: "Google",
        purpose: "Google Analytics – Statistik",
        duration: "2 Jahre",
        type: "http",
      },
      {
        name: "_ga_XXXXXXXXXX",
        provider: "Google",
        purpose: "Google Analytics – Statistik",
        duration: "2 Jahre",
        type: "http",
      },
    ],
    marketing: [
      {
        name: "_fbp",
        provider: "Meta",
        purpose: "Wird von Facebook für Werbung verwendet",
        duration: "3 Monate",
        type: "http",
      },
      {
        name: "fr",
        provider: "Meta",
        purpose: "Wird verwendet, um Relevanz von Anzeigen zu liefern, zu messen und zu verbessern",
        duration: "3 Monate",
        type: "http",
      },
      {
        name: "IDE",
        provider: "doubleclick.net",
        purpose: "Zeigt zielgerichtete Anzeigen im Google-Netzwerk",
        duration: "1 Jahr",
        type: "http",
      },
    ],
  },
  en: {
    necessary: [
      {
        name: "_consent",
        provider: "fyrrehaven-61.dk",
        purpose: "Remembers your cookie choices",
        duration: "6 months",
        type: "http",
      },
      {
        name: "__cfruid",
        provider: "t.zopim.com",
        purpose: "Manages traffic to maintain website stability",
        duration: "Session",
        type: "http",
      },
    ],
    analytics: [
      {
        name: "_ga",
        provider: "Google",
        purpose: "Google Analytics – statistics",
        duration: "2 years",
        type: "http",
      },
      {
        name: "_ga_XXXXXXXXXX", // ← Replace with your actual GA4 cookie name if used
        provider: "Google",
        purpose: "Google Analytics – statistics",
        duration: "2 years",
        type: "http",
      },
    ],
    marketing: [
      {
        name: "_fbp",
        provider: "Meta",
        purpose: "Used by Facebook for advertising",
        duration: "3 months",
        type: "http",
      },
      {
        name: "fr",
        provider: "Meta",
        purpose: "Delivers, measures and improves relevance of ads",
        duration: "3 months",
        type: "http",
      },
      {
        name: "IDE",
        provider: "doubleclick.net",
        purpose: "Used to show targeted ads across the Google network",
        duration: "1 year",
        type: "http",
      },
    ],
  },
};
