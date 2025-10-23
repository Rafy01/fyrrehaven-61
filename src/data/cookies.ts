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

export const cookieData: Record<"da" | "en", CookieCategory> = {
  da: {
    necessary: [
      {
        name: "_consent",
        provider: "fyrrehaven-61.dk",
        purpose: "Husker dine cookievalg",
        duration: "6 måneder",
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
    ],
    marketing: [
      {
        name: "_fbp",
        provider: "Meta",
        purpose: "Bruges af Facebook til annoncering",
        duration: "3 måneder",
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
    ],
    analytics: [
      {
        name: "_ga",
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
    ],
  },
};
