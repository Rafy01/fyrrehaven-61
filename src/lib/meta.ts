// src/lib/meta.ts
import type { Lang } from "./lang";
import type { PageKey } from "./routes";

export type MetaPack = {
  title: string;
  description: string;
  keywords?: string[];
  image: string;
  imageAlt: string;
  robots?:
    | string
    | {
        index?: boolean;
        follow?: boolean;
        noarchive?: boolean;
        noimageindex?: boolean;
        notranslate?: boolean;
        maxSnippet?: number;
        maxImagePreview?: "large" | "standard" | "none";
        maxVideoPreview?: number;
      };
};

const OG_IMG =
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg";

const META: Record<PageKey, Record<Lang, MetaPack>> = {
  /* HOME */
  home: {
    da: {
      title: "Fyrrehaven 61 – sommerhus til 10 personer ved skov og strand",
      description:
        "Familievenligt sommerhus ved Fjellerup Strand med opvarmet udendørs pool (1. maj–1. oktober), elektrisk vildmarksbad og el-sauna. Plads til 10 gæster, 4 soveværelser og lyse fællesrum tæt på skov og stier. Book privat eller via Airbnb.",
      keywords: [
        "sommerhus fjellerup",
        "sommerhus med pool",
        "opvarmet pool sommerhus",
        "vildmarksbad sommerhus",
        "sauna sommerhus",
        "familievenligt sommerhus",
        "djursland feriehus",
        "Fyrrehaven 61",
        "udlejning privat",
        "sommerhus tæt på strand",
      ],
      image: OG_IMG,
      imageAlt: "Fyrrehaven 61 sommerhus ved Fjellerup Strand",
      robots: {
        index: true,
        follow: true,
        noarchive: true,
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
      },
    },
    en: {
      title: "Fyrrehaven 61 – holiday home for 10 by forest & beach",
      description:
        "Family-friendly holiday home by Fjellerup Beach with a heated outdoor pool (May 1–Oct 1), wood-fired hot tub and electric sauna. Sleeps 10 with 4 bedrooms and bright living areas close to forest trails. Book privately or via Airbnb.",
      keywords: [
        "holiday home fjellerup",
        "holiday home with pool",
        "heated pool holiday home",
        "wood-fired hot tub",
        "sauna holiday home",
        "family friendly cottage",
        "djursland vacation rental",
        "Fyrrehaven 61",
        "private booking",
        "near beach Denmark",
      ],
      image: OG_IMG,
      imageAlt: "Fyrrehaven 61 holiday home by Fjellerup Beach",
      robots: {
        index: true,
        follow: true,
        noarchive: true,
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
      },
    },
  },

  /* HOUSE */
  house: {
    da: {
      title: "Sommerhuset – pool, vildmarksbad & sauna | Fyrrehaven 61",
      description:
        "Sommerhus til 10 med udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad og el-sauna. Familievenligt tæt på skov og strand. Book via Airbnb.",
      image: OG_IMG,
      imageAlt: "Udendørs poolområde ved sommerhuset",
    },
    en: {
      title: "The House – pool, hot tub & sauna | Fyrrehaven 61",
      description:
        "Holiday home for 10 with an outdoor heated pool (May 1–Oct 1), electric hot tub and electric sauna. Family-friendly near forest and beach. Book on Airbnb.",
      image: OG_IMG,
      imageAlt: "Outdoor pool area at the house",
    },
  },

  /* AREA */
  area: {
    da: {
      title: "Området – skov, strand og oplevelser tæt på",
      description:
        "Skovsti ved huset, strand i cykelafstand og masser af udflugter for hele familien. Se kortet og vores bedste tips til oplevelser på Djursland.",
      image: OG_IMG,
      imageAlt: "Skov og strand ved Fjellerup",
    },
    en: {
      title: "Area – forest, beach and nearby experiences",
      description:
        "Forest trails from the house, a bikeable beach and plenty of family-friendly day trips. See the map and our top tips around Djursland.",
      image: OG_IMG,
      imageAlt: "Beach and forest at Fjellerup",
    },
  },

  /* GALLERY */
  gallery: {
    da: {
      title: "Galleri – billeder af hus, pool og omgivelser",
      description:
        "Se billeder af stue, køkken-alrum, soveværelser og hems – plus udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad, el-sauna og nærliggende skov og strand ved Fjellerup. Få et ærligt indtryk.",
      image: OG_IMG,
      imageAlt: "Udklip fra galleriet",
    },
    en: {
      title: "Gallery – photos of the house, pool and surroundings",
      description:
        "Browse photos of the living room, kitchen-diner, bedrooms and loft — plus the heated outdoor pool (May 1–Oct 1), electric hot tub, electric sauna and nearby forest and beach in Fjellerup. Get a true feel for the place.",
      image: OG_IMG,
      imageAlt: "Gallery cover collage",
    },
  },

  /* FAQ */
  faq: {
    da: {
      title: "FAQ – ofte stillede spørgsmål om Fyrrehaven 61",
      description:
        "Find svar på tjek-ind, pool & wellness, sengetøj, betaling, regler m.m.",
      image: OG_IMG,
      imageAlt: "FAQ om Fyrrehaven 61",
    },
    en: {
      title: "FAQ – frequently asked questions about Fyrrehaven 61",
      description:
        "Answers about check-in, pool & wellness, linens, payment, rules and more.",
      image: OG_IMG,
      imageAlt: "FAQ about Fyrrehaven 61",
    },
  },

  /* CONTACT */
  contact: {
    da: {
      title: "Kontakt Fyrrehaven 61 – spørgsmål om booking og ophold",
      description:
        "Har du spørgsmål til datoer, priser, faciliteter eller særlige ønsker? Send os en besked via formularen — vi svarer typisk samme dag. Al kommunikation foregår via e-mail, og dine oplysninger behandles efter vores privatlivspolitik.",
      image: OG_IMG,
      imageAlt: "Familien bag huset",
    },
    en: {
      title: "Contact Fyrrehaven 61 – questions about booking and stays",
      description:
        "Got questions about dates, pricing, amenities or special requests? Send us a message — we usually reply the same day. All communication is handled by email and your data is processed under our privacy policy.",
      image: OG_IMG,
      imageAlt: "The family behind the house",
    },
  },

  /* BOOKING */
  book: {
    da: {
      title: "Booking hos Fyrrehaven 61 – direkte forespørgsel eller Airbnb",
      description:
        "Book direkte hos værterne eller via Airbnb. Udendørs opvarmet pool (1. maj–1. okt.), plads til 10 og familievenligt nær skov og strand. Vi svarer typisk inden for 1 time. El 4 kr./kWh og vand 80 kr./m³ afregnes efter opholdet.",
      image: OG_IMG,
      imageAlt: "Booking af feriehus ved Fjellerup",
    },
    en: {
      title: "Book Fyrrehaven 61 – direct request or Airbnb",
      description:
        "Book directly with the hosts or via Airbnb. Heated outdoor pool (May 1–Oct 1), sleeps 10 and family-friendly near forest and beach. We usually reply within 1 hour. Electricity 4 DKK/kWh and water 80 DKK/m³ are settled after your stay.",
      image: OG_IMG,
      imageAlt: "Book the holiday home in Fjellerup",
    },
  },

  /* The rest (kept concise so META is complete) */
  cookies: {
    da: {
      title: "Cookies | Fyrrehaven 61",
      description: "Læs om nødvendige og valgfrie cookies på fyrrehaven-61.dk.",
      image: OG_IMG,
      imageAlt: "Cookies",
    },
    en: {
      title: "Cookies | Fyrrehaven 61",
      description:
        "Read about essential and optional cookies on fyrrehaven-61.dk.",
      image: OG_IMG,
      imageAlt: "Cookies",
    },
  },
  fees: {
    da: {
      title: "Gebyrer | Fyrrehaven 61",
      description:
        "Gebyrer der kan være relevante i særlige situationer samt vigtig booking-info.",
      image: OG_IMG,
      imageAlt: "Gebyroversigt",
    },
    en: {
      title: "Fees | Fyrrehaven 61",
      description:
        "Fees that may apply in specific situations plus important booking info.",
      image: OG_IMG,
      imageAlt: "Fees overview",
    },
  },
  privacy: {
    da: {
      title: "Privatlivspolitik | Fyrrehaven 61",
      description:
        "GDPR-oplysninger om behandling af persondata ved kontakt, booking og ekstra services.",
      image: OG_IMG,
      imageAlt: "Privatlivspolitik",
    },
    en: {
      title: "Privacy Policy | Fyrrehaven 61",
      description:
        "GDPR information on the processing of personal data for contact, booking and extras.",
      image: OG_IMG,
      imageAlt: "Privacy policy",
    },
  },
  sitemap: {
    da: {
      title: "Sitemap | Fyrrehaven 61",
      description:
        "Oversigt over sider, sektioner og nyttige links for hurtig navigation.",
      image: OG_IMG,
      imageAlt: "Sitemap",
    },
    en: {
      title: "Sitemap | Fyrrehaven 61",
      description:
        "Overview of pages, sections and useful links for fast navigation.",
      image: OG_IMG,
      imageAlt: "Sitemap",
    },
  },
  chat: {
    da: {
      title: "Chat | Fyrrehaven 61",
      description: "Stil spørgsmål om huset, området og booking.",
      image: OG_IMG,
      imageAlt: "Chat",
    },
    en: {
      title: "Chat | Fyrrehaven 61",
      description: "Ask questions about the house, area and booking.",
      image: OG_IMG,
      imageAlt: "Chat",
    },
  },
};

export function getPageMeta(lang: Lang, key: PageKey): MetaPack {
  return (META[key] ?? META.home)[lang];
}
