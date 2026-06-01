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
      title: "Fyrrehaven 61 – feriehus i Danmark til 10 personer ved Fjellerup Strand",
      description:
        "Familievenligt feriehus på Djursland med opvarmet udendørs pool (1. maj–1. oktober), elektrisk vildmarksbad og el-sauna. Perfekt for familier fra Danmark, Norge og Tyskland, med plads til 10 gæster og kort afstand til strand og skov.",
      keywords: [
        "feriehus danmark",
        "sommerhus fjellerup",
        "familieferie danmark",
        "feriehus for norske familier",
        "feriehus for tyske gæster",
        "opvarmet pool sommerhus",
        "vildmarksbad sommerhus",
        "sauna sommerhus",
        "djursland feriehus",
        "Fyrrehaven 61",
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
      title: "Fyrrehaven 61 – Denmark holiday home for 10 by Fjellerup Beach",
      description:
        "Family-friendly holiday home in Denmark with a heated outdoor pool (May 1–Oct 1), electric hot tub and electric sauna. Popular with families from Denmark, Norway and Germany, just minutes from Fjellerup Beach and the forest.",
      keywords: [
        "Denmark holiday home",
        "holiday home Fjellerup",
        "Norway to Denmark holiday",
        "Germany to Denmark vacation",
        "family holiday Denmark",
        "heated pool holiday home",
        "hot tub rental",
        "sauna holiday home",
        "Djursland vacation rental",
        "Fyrrehaven 61",
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
    de: {
      title:
        "Fyrrehaven 61 – Ferienhaus in Dänemark für 10 Personen nahe Fjellerup Strand",
      description:
        "Familienfreundliches Ferienhaus auf Djursland mit beheiztem Außenpool (1. Mai–1. Okt.), elektrischem Whirlpool und Sauna. Perfekt für Familien aus Dänemark, Norwegen und Deutschland, nahe Strand und Wald.",
      keywords: [
        "Ferienhaus Dänemark",
        "Sommerhaus Fjellerup",
        "Familienferien Dänemark",
        "Ferienhaus für deutsche Gäste",
        "beheizter Pool Ferienhaus",
        "Whirlpool Ferienhaus",
        "Sauna Ferienhaus",
        "Djursland Ferienhaus",
        "Fyrrehaven 61",
      ],
      image: OG_IMG,
      imageAlt: "Fyrrehaven 61 Ferienhaus bei Fjellerup Strand",
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
      title: "Sommerhuset – pool, vildmarksbad og sauna i Danmark | Fyrrehaven 61",
      description:
        "Sommerhus til 10 på Djursland med udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad og el-sauna. Familievenligt feriehus i Danmark, godt for danske, norske og tyske gæster, tæt på skov, strand og lokale attraktioner.",
      keywords: [
        "feriehus i Danmark",
        "sommerhus for norske familier",
        "tyske feriehus gæster",
        "udendørs opvarmet pool",
        "vildmarksbad",
        "el-sauna",
        "familievenligt sommerhus",
        "10 personer",
        "Fyrrehaven 61",
      ],
      image: OG_IMG,
      imageAlt: "Udendørs poolområde ved sommerhuset",
    },
    en: {
      title: "The House – pool, hot tub & sauna in Denmark | Fyrrehaven 61",
      description:
        "Holiday home for 10 in Denmark with an outdoor heated pool (May 1–Oct 1), electric hot tub and electric sauna. Family-friendly rental ideal for guests from Denmark, Norway and Germany, close to forest and beach.",
      keywords: [
        "holiday home in Denmark",
        "family friendly rental",
        "Norwegian guests",
        "German guests",
        "heated outdoor pool",
        "hot tub",
        "electric sauna",
        "Fyrrehaven 61",
      ],
      image: OG_IMG,
      imageAlt: "Outdoor pool area at the house",
    },
    de: {
      title: "Das Haus – Pool, Whirlpool & Sauna in Dänemark | Fyrrehaven 61",
      description:
        "Ferienhaus für 10 Personen auf Djursland mit beheiztem Außenpool (1. Mai–1. Okt.), elektrischem Whirlpool und Sauna. Familienfreundliche Unterkunft, ideal für Gäste aus Deutschland, Norwegen und Dänemark.",
      keywords: [
        "Ferienhaus Fjellerup",
        "beheizter Außenpool",
        "Whirlpool",
        "Sauna",
        "familienfreundlich",
        "10 Personen",
        "Djursland Urlaub",
        "Fyrrehaven 61",
      ],
      image: OG_IMG,
      imageAlt: "Außenpoolbereich beim Ferienhaus",
    },
  },

  /* AREA */
  area: {
    da: {
      title: "Området – skov, strand og oplevelser tæt på",
      description:
        "Skovsti direkte fra huset, badevenlig strand på Djursland og mange familievenlige aktiviteter i nærheden. Gode oplevelser for danske, norske og tyske feriegæster på kort afstand.",
      keywords: [
        "skov og strand",
        "Djursland oplevelser",
        "familieferie Danmark",
        "norske feriegæster",
        "tyske feriegæster",
        "cykelruter",
        "vandreruter",
      ],
      image: OG_IMG,
      imageAlt: "Skov og strand ved Fjellerup",
    },
    en: {
      title: "Area – forest, beach and nearby family experiences",
      description:
        "Forest trails from the house, a beach within easy reach and many family-friendly attractions nearby. Great for travelers from Denmark, Norway and Germany visiting Djursland.",
      keywords: [
        "forest and beach",
        "Djursland experiences",
        "Denmark family holiday",
        "Norway to Denmark",
        "Germany to Denmark",
        "hiking trails",
        "cycling routes",
      ],
      image: OG_IMG,
      imageAlt: "Beach and forest at Fjellerup",
    },
    de: {
      title: "Region – Wald, Strand und Erlebnisse in der Nähe",
      description:
        "Waldwege direkt vom Haus, ein badefreundlicher Strand in der Nähe und viele familienfreundliche Aktivitäten. Tolle Erlebnisse für Gäste aus Dänemark, Norwegen und Deutschland.",
      keywords: [
        "Wald und Strand",
        "Djursland Aktivitäten",
        "Familienurlaub Dänemark",
        "deutsche Gäste",
      ],
      image: OG_IMG,
      imageAlt: "Wald und Strand bei Fjellerup",
    },
  },

  /* GALLERY */
  gallery: {
    da: {
      title: "Galleri – billeder af hus, pool og omgivelser",
      description:
        "Se billeder af stue, køkken-alrum, soveværelser og hems – plus udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad, el-sauna og nærliggende natur. Et feriehus i Danmark, populært hos danske, norske og tyske familier.",
      keywords: [
        "galleri feriehus",
        "billeder sommerhus",
        "pool billeder",
        "vildmarksbad billeder",
        "Danmark feriehus",
        "norske gæster",
        "tyske gæster",
      ],
      image: OG_IMG,
      imageAlt: "Udklip fra galleriet",
    },
    en: {
      title: "Gallery – photos of the house, pool and surroundings",
      description:
        "Browse photos of the living room, kitchen-diner, bedrooms and loft — plus the heated outdoor pool (May 1–Oct 1), electric hot tub, electric sauna and nearby forest and beach. A holiday home in Denmark popular with families from Denmark, Norway and Germany.",
      keywords: [
        "holiday home gallery",
        "vacation home photos",
        "pool photos",
        "hot tub photos",
        "Denmark holiday home",
        "Norwegian families",
        "German families",
      ],
      image: OG_IMG,
      imageAlt: "Gallery cover collage",
    },
    de: {
      title: "Galerie – Fotos vom Haus, Pool und der Umgebung",
      description:
        "Bilder vom Wohnbereich, der Wohnküche, Schlafzimmern und dem Loft – inklusive beheiztem Außenpool, Whirlpool, Sauna und der nahegelegenen Natur. Beliebt bei Familien aus Dänemark, Norwegen und Deutschland.",
      keywords: [
        "Galerie Ferienhaus",
        "Bilder Sommerhaus",
        "Pool Fotos",
        "Whirlpool Bilder",
      ],
      image: OG_IMG,
      imageAlt: "Galerie Übersicht",
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
    de: {
      title: "FAQ – häufig gestellte Fragen zu Fyrrehaven 61",
      description:
        "Antworten zu Check-in, Pool & Wellness, Bettwäsche, Zahlung, Hausregeln und mehr.",
      image: OG_IMG,
      imageAlt: "FAQ zu Fyrrehaven 61",
    },
  },

  /* CONTACT */
  contact: {
    da: {
      title: "Kontakt Fyrrehaven 61 – spørgsmål om booking og ophold",
      description:
        "Kontakt os for spørgsmål om datoer, priser, faciliteter eller særlige ønsker. Vi svarer typisk samme dag, også for gæster fra Danmark, Norge og Tyskland.",
      keywords: [
        "kontakt feriehus",
        "booking forespørgsel",
        "Fyrrehaven 61 kontakt",
        "norske gæster",
        "tyske gæster",
        "Danmark feriehus",
      ],
      image: OG_IMG,
      imageAlt: "Familien bag huset",
    },
    en: {
      title: "Contact Fyrrehaven 61 – questions about booking and stays",
      description:
        "Contact us with questions about dates, pricing, amenities or special requests. We usually reply the same day, also for guests from Denmark, Norway and Germany.",
      keywords: [
        "contact holiday home",
        "booking inquiry",
        "Fyrrehaven 61 contact",
        "Norwegian guests",
        "German guests",
        "Denmark holiday home",
      ],
      image: OG_IMG,
      imageAlt: "The family behind the house",
    },
    de: {
      title: "Kontakt Fyrrehaven 61 – Fragen zu Buchung und Aufenthalt",
      description:
        "Kontaktieren Sie uns bei Fragen zu Terminen, Preisen, Ausstattung oder speziellen Wünschen. Wir antworten in der Regel am selben Tag, auch für Gäste aus Deutschland, Norwegen und Dänemark.",
      keywords: [
        "Kontakt Ferienhaus",
        "Buchungsanfrage",
        "Fyrrehaven 61 Kontakt",
        "deutsche Gäste",
      ],
      image: OG_IMG,
      imageAlt: "Die Familie hinter dem Haus",
    },
  },

  /* BOOKING */
  book: {
    da: {
      title: "Booking hos Fyrrehaven 61 – direkte forespørgsel eller Airbnb",
      description:
        "Book direkte hos værterne eller via Airbnb. Udendørs opvarmet pool (1. maj–1. okt.), plads til 10 og familievenligt nær skov og strand på Djursland. Ideelt for danske, norske og tyske ferier.",
      keywords: [
        "booking sommerhus",
        "Fyrrehaven 61 booking",
        "feriehus Danmark",
        "booking direkte",
        "Airbnb Fjellerup",
        "norske gæster",
        "tyske gæster",
      ],
      image: OG_IMG,
      imageAlt: "Booking af feriehus ved Fjellerup",
    },
    en: {
      title: "Book Fyrrehaven 61 – direct request or Airbnb",
      description:
        "Book directly with the hosts or via Airbnb. Heated outdoor pool (May 1–Oct 1), sleeps 10 and family-friendly near forest and beach in Denmark. Ideal for families from Denmark, Norway and Germany.",
      keywords: [
        "holiday home booking",
        "Fyrrehaven 61 booking",
        "Denmark holiday home",
        "book direct",
        "Airbnb Fjellerup",
        "Norwegian guests",
        "German guests",
      ],
      image: OG_IMG,
      imageAlt: "Book the holiday home in Fjellerup",
    },
    de: {
      title: "Buchung bei Fyrrehaven 61 – direkt oder via Airbnb",
      description:
        "Buchen Sie direkt bei den Gastgebern oder über Airbnb. Beheizter Außenpool (1. Mai–1. Okt.), Platz für 10 Personen und familienfreundlich nahe Strand und Wald.",
      keywords: [
        "Buchung Ferienhaus",
        "Fyrrehaven 61 Buchung",
        "Sommerhaus Dänemark",
      ],
      image: OG_IMG,
      imageAlt: "Buchung des Ferienhauses bei Fjellerup",
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
    de: {
      title: "Cookies | Fyrrehaven 61",
      description:
        "Lesen Sie über notwendige und optionale Cookies auf fyrrehaven-61.dk.",
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
    de: {
      title: "Gebühren | Fyrrehaven 61",
      description:
        "Gebühren, die in bestimmten Situationen anfallen können, sowie wichtige Buchungsinformationen.",
      image: OG_IMG,
      imageAlt: "Übersicht der Gebühren",
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
  const pack = (META[key] ?? META.home) as Record<string, MetaPack>;
  // Prefer exact language, otherwise fallback to English, then Danish
  return pack[lang] ?? pack["en"] ?? pack["da"];
}
