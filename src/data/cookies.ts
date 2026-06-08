export type CookieEntry = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: string;
};

export type CookieCategory = {
  necessary: CookieEntry[];
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
  },
};
