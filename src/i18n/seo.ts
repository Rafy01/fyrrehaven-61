import type { Lang } from "../lib/lang";
import type { PageKey } from "../lib/routes";

export type SeoPageKey = PageKey | "notFound";

export type SeoPack = {
  title: string;
  description: string;
  keywords?: string[];
  image: string;
  imageAlt: string;
  robots?: {
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

export const SEO: Record<SeoPageKey, Record<Lang, SeoPack>> = {
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
      robots: { index: true, follow: true, noarchive: true },
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
      robots: { index: true, follow: true, noarchive: true },
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
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  house: {
    da: {
      title: "Sommerhuset – pool, vildmarksbad og sauna i Danmark | Fyrrehaven 61",
      description:
        "Sommerhus til 10 på Djursland med udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad og el-sauna. Familievenligt feriehus i Danmark, godt for danske, norske og tyske gæster, tæt på skov, strand og lokale attraktioner.",
      keywords: [
        "sommerhus fjellerup",
        "sommerhus med pool",
        "opvarmet udendørs pool",
        "vildmarksbad",
        "sauna",
        "familievenligt sommerhus",
        "10 personer",
        "djursland feriehus",
        "Fyrrehaven 61",
        "tæt på strand og skov",
      ],
      image: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.jpg",
      imageAlt: "Udendørs poolområde ved sommerhuset",
      robots: { index: true, follow: true, noarchive: true },
    },
    en: {
      title: "The House – pool, hot tub & sauna in Denmark | Fyrrehaven 61",
      description:
        "Holiday home for 10 in Denmark with an outdoor heated pool (May 1–Oct 1), electric hot tub and electric sauna. Family-friendly rental ideal for guests from Denmark, Norway and Germany, close to forest and beach.",
      keywords: [
        "holiday home Fjellerup",
        "heated outdoor pool",
        "hot tub",
        "sauna",
        "family friendly",
        "sleeps 10",
        "Djursland vacation rental",
        "Fyrrehaven 61",
        "near beach and forest",
      ],
      image: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.jpg",
      imageAlt: "Outdoor pool area at the house",
      robots: { index: true, follow: true, noarchive: true },
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
      image: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.jpg",
      imageAlt: "Außenpoolbereich beim Ferienhaus",
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  area: {
    da: {
      title: "Området – skov, strand og oplevelser tæt på",
      description:
        "Oplev Fjellerup og Djursland fra Fyrrehaven 61: skovstier fra døren, strand i gå- og cykelafstand, og familievenlige attraktioner som Djurs Sommerland, Mols Bjerge og Kattegatcentret. Se kortet og vores bedste lokale tips.",
      keywords: [
        "Fjellerup",
        "Djursland",
        "skov og strand",
        "familievenlige oplevelser",
        "Djurs Sommerland",
        "Mols Bjerge",
        "Kattegatcentret",
        "Grenaa",
        "Ebeltoft",
        "vandreruter",
        "cykelruter",
        "Fyrrehaven 61",
      ],
      image: OG_IMG,
      imageAlt: "Skov og strand ved Fjellerup",
      robots: { index: true, follow: true, noarchive: true },
    },
    en: {
      title: "Area – forest, beach and nearby experiences",
      description:
        "Explore Fjellerup and Djursland from Fyrrehaven 61: forest trails at the doorstep, a beach within walking and biking distance, and family attractions like Djurs Sommerland, Mols Bjerge and the Kattegat Centre. See the map and our top local tips.",
      keywords: [
        "Fjellerup",
        "Djursland",
        "forest and beach",
        "family attractions",
        "Djurs Sommerland",
        "Mols Bjerge",
        "Kattegat Centre",
        "Grenaa",
        "Ebeltoft",
        "hiking trails",
        "cycling routes",
        "Fyrrehaven 61",
      ],
      image: OG_IMG,
      imageAlt: "Beach and forest at Fjellerup",
      robots: { index: true, follow: true, noarchive: true },
    },
    de: {
      title: "Region – Wald, Strand und Erlebnisse in der Nähe",
      description:
        "Entdecken Sie Fjellerup und Djursland von Fyrrehaven 61 aus: Wanderwege am Haus, Strand in Geh- und Fahrraddistanz und familienfreundliche Attraktionen wie Djurs Sommerland, Mols Bjerge und das Kattegat Center. Sehen Sie die Karte und unsere besten lokalen Tipps.",
      keywords: [
        "Fjellerup",
        "Djursland",
        "Wald und Strand",
        "Familienattraktionen",
        "Djurs Sommerland",
        "Mols Bjerge",
        "Kattegatcentret",
        "Grenaa",
        "Ebeltoft",
        "Wanderwege",
        "Radwege",
        "Fyrrehaven 61",
      ],
      image: OG_IMG,
      imageAlt: "Wald und Strand bei Fjellerup",
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  gallery: {
    da: {
      title: "Galleri – billeder af hus, pool og omgivelser",
      description:
        "Se billeder af stue, køkken-alrum, soveværelser og hems – plus udendørs opvarmet pool (1. maj–1. oktober), elektrisk vildmarksbad, el-sauna og nærliggende skov og strand ved Fjellerup. Få et ærligt indtryk.",
      keywords: [
        "Fyrrehaven 61",
        "galleri",
        "billeder sommerhus",
        "udendørs opvarmet pool",
        "vildmarksbad",
        "sauna",
        "Fjellerup",
        "Djursland",
        "skov og strand",
        "familieferie",
      ],
      image: OG_IMG,
      imageAlt: "Udklip fra galleriet",
      robots: { index: true, follow: true, noarchive: true },
    },
    en: {
      title: "Gallery – photos of the house, pool and surroundings",
      description:
        "Browse photos of the living room, kitchen-diner, bedrooms and loft — plus the heated outdoor pool (May 1–Oct 1), electric hot tub, electric sauna and nearby forest and beach in Fjellerup. Get a true feel for the place.",
      keywords: [
        "Fyrrehaven 61",
        "gallery",
        "holiday home photos",
        "heated outdoor pool",
        "hot tub",
        "sauna",
        "Fjellerup",
        "Djursland",
        "forest and beach",
        "family holiday",
      ],
      image: OG_IMG,
      imageAlt: "Gallery cover collage",
      robots: { index: true, follow: true, noarchive: true },
    },
    de: {
      title: "Galerie – Fotos vom Haus, Pool und der Umgebung",
      description:
        "Sehen Sie Fotos vom Wohnzimmer, Essbereich, Schlafzimmern und Dachboden – plus dem beheizten Außenpool (1. Mai–1. Okt), elektrischem Whirlpool, Elektro-Sauna und dem nahegelegenen Wald und Strand bei Fjellerup. Gewinnen Sie einen echten Eindruck.",
      keywords: [
        "Fyrrehaven 61",
        "Galerie",
        "Ferienhaus Fotos",
        "beheizter Außenpool",
        "Whirlpool",
        "Sauna",
        "Fjellerup",
        "Djursland",
        "Wald und Strand",
        "Familienurlaub",
      ],
      image: OG_IMG,
      imageAlt: "Galerie-Cover-Collage",
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  faq: {
    da: {
      title: "FAQ – ofte stillede spørgsmål om Fyrrehaven 61",
      description:
        "Find svar på tjek-ind, pool & wellness, sengetøj, betaling, regler m.m.",
      image: OG_IMG,
      imageAlt: "FAQ om Fyrrehaven 61",
      robots: { index: true, follow: true, noarchive: true },
    },
    en: {
      title: "FAQ – frequently asked questions about Fyrrehaven 61",
      description:
        "Answers about check-in, pool & wellness, linens, payment, rules and more.",
      image: OG_IMG,
      imageAlt: "FAQ about Fyrrehaven 61",
      robots: { index: true, follow: true, noarchive: true },
    },
    de: {
      title: "FAQ – häufig gestellte Fragen zu Fyrrehaven 61",
      description:
        "Antworten zu Check-in, Pool & Wellness, Bettwäsche, Zahlung, Hausregeln und mehr.",
      image: OG_IMG,
      imageAlt: "FAQ zu Fyrrehaven 61",
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  contact: {
    da: {
      title: "Kontakt Fyrrehaven 61 – spørgsmål om booking og ophold",
      description:
        "Har du spørgsmål til datoer, priser, faciliteter eller særlige ønsker? Send os en besked via formularen — vi svarer typisk samme dag. Al kommunikation foregår via e-mail, og dine oplysninger behandles efter vores privatlivspolitik.",
      keywords: [
        "kontakt",
        "Fyrrehaven 61",
        "sommerhus Fjellerup",
        "spørgsmål booking",
        "udlejning sommerhus",
        "familievenligt sommerhus",
        "pool vildmarksbad sauna",
        "Djursland ferie",
        "book direkte",
        "Airbnb kontakt",
      ],
      image: OG_IMG,
      imageAlt: "Familien bag huset",
      robots: { index: true, follow: true, noarchive: true },
    },
    en: {
      title: "Contact Fyrrehaven 61 – questions about booking and stays",
      description:
        "Got questions about dates, pricing, amenities or special requests? Send us a message — we usually reply the same day. All communication is handled by email and your data is processed under our privacy policy.",
      keywords: [
        "contact",
        "Fyrrehaven 61",
        "holiday home Fjellerup",
        "booking questions",
        "holiday rental",
        "family friendly cottage",
        "pool hot tub sauna",
        "Djursland Denmark",
        "book direct",
        "Airbnb contact",
      ],
      image: OG_IMG,
      imageAlt: "The family behind the house",
      robots: { index: true, follow: true, noarchive: true },
    },
    de: {
      title: "Kontakt Fyrrehaven 61 – Fragen zu Buchung und Aufenthalt",
      description:
        "Haben Sie Fragen zu Daten, Preisen, Ausstattung oder besonderen Wünschen? Senden Sie uns eine Nachricht über das Formular – wir antworten in der Regel am selben Tag. Die Kommunikation erfolgt per E-Mail und Ihre Daten werden gemäß unserer Datenschutzerklärung verarbeitet.",
      keywords: [
        "Kontakt",
        "Fyrrehaven 61",
        "Ferienhaus Fjellerup",
        "Buchungsfragen",
        "Ferienhausvermietung",
        "familienfreundliches Ferienhaus",
        "Pool Whirlpool Sauna",
        "Djursland Dänemark",
        "direkt buchen",
        "Airbnb Kontakt",
      ],
      image: OG_IMG,
      imageAlt: "Die Familie hinter dem Haus",
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  book: {
    da: {
      title: "Booking hos Fyrrehaven 61 – direkte forespørgsel",
      description:
        "Book direkte hos værterne eller via Airbnb. Udendørs opvarmet pool (1. maj–1. okt.), plads til 10 og familievenligt nær skov og strand. Vi svarer typisk inden for 1 time. El 4 kr./kWh og vand 80 kr./m³ afregnes efter opholdet.",
      keywords: [
        "booking sommerhus",
        "Fyrrehaven 61 booking",
        "sommerhus Fjellerup",
        "udendørs opvarmet pool",
        "vildmarksbad",
        "sauna",
        "familievenligt sommerhus",
        "book direkte",
        "Airbnb Fjellerup",
        "Djursland feriehus",
      ],
      image: OG_IMG,
      imageAlt: "Booking af feriehus ved Fjellerup",
      robots: { index: true, follow: true, noarchive: true },
    },
    en: {
      title: "Book Fyrrehaven 61 – direct request",
      description:
        "Book directly with the hosts or via Airbnb. Heated outdoor pool (May 1–Oct 1), sleeps 10 and family-friendly near forest and beach. We usually reply within 1 hour. Electricity 4 DKK/kWh and water 80 DKK/m³ are settled after your stay.",
      keywords: [
        "holiday home booking",
        "Fyrrehaven 61 booking",
        "Fjellerup cottage",
        "heated outdoor pool",
        "hot tub",
        "sauna",
        "family friendly rental",
        "book direct",
        "Airbnb Fjellerup",
        "Djursland holiday home",
      ],
      image: OG_IMG,
      imageAlt: "Book the holiday home in Fjellerup",
      robots: { index: true, follow: true, noarchive: true },
    },
    de: {
      title: "Buchung bei Fyrrehaven 61 – direkte Anfrage",
      description:
        "Buchen Sie direkt bei den Gastgebern oder über Airbnb. Beheizter Außenpool (1. Mai–1. Okt.), Platz für 10 Gäste und familienfreundlich nahe Wald und Strand. Wir antworten normalerweise innerhalb von 1 Stunde. Strom 4 DKK/kWh und Wasser 80 DKK/m³ werden nach dem Aufenthalt abgerechnet.",
      keywords: [
        "Ferienhaus Buchung",
        "Fyrrehaven 61 Buchung",
        "Ferienhaus Fjellerup",
        "beheizter Außenpool",
        "Whirlpool",
        "Sauna",
        "familienfreundliche Unterkunft",
        "direkt buchen",
        "Airbnb Fjellerup",
        "Djursland Ferienhaus",
      ],
      image: OG_IMG,
      imageAlt: "Buchung des Ferienhauses bei Fjellerup",
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  cookies: {
    da: {
      title: "Cookies hos Fyrrehaven 61",
      description: "Læs om vores brug af cookies og administrer dine valg.",
      image: OG_IMG,
      imageAlt: "Cookies",
    },
    en: {
      title: "Cookies at Fyrrehaven 61",
      description: "Read about our use of cookies and manage your choices.",
      image: OG_IMG,
      imageAlt: "Cookies",
    },
    de: {
      title: "Cookies bei Fyrrehaven 61",
      description:
        "Lesen Sie mehr über unsere Verwendung von Cookies und verwalten Sie Ihre Auswahl.",
      image: OG_IMG,
      imageAlt: "Cookies",
    },
  },
  fees: {
    da: {
      title: "Gebyrer & praktiske vilkår – Fyrrehaven 61",
      description:
        "Se vores opdaterede gebyroversigt for Fyrrehaven 61: regler for booking, rengøring, sen check-out og særlige situationer. El (4 kr./kWh) og vand (80 kr./m³) afregnes efter forbrug. Ingen fester/kæledyr. Pool åben 1/5–1/10.",
      keywords: [
        "gebyrer sommerhus",
        "gebyroversigt",
        "rengøringsgebyr",
        "elforbrug pris",
        "vandforbrug pris",
        "sen check-out gebyr",
        "skader og erstatning",
        "Fyrrehaven 61 priser",
      ],
      image: OG_IMG,
      imageAlt: "Gebyroversigt",
      robots: { index: true, follow: true, noarchive: true },
    },
    en: {
      title: "Fees & house rules – Fyrrehaven 61",
      description:
        "View the updated fee list for Fyrrehaven 61: booking rules, cleaning, late check-out and special cases. Electricity (4 DKK/kWh) and water (80 DKK/m³) are billed by usage. No parties or pets. Outdoor pool open May 1–Oct 1.",
      keywords: [
        "holiday home fees",
        "fee list",
        "cleaning fee",
        "electricity usage price",
        "water usage price",
        "late check-out fee",
        "damage and charges",
        "Fyrrehaven 61 prices",
      ],
      image: OG_IMG,
      imageAlt: "Fees overview",
      robots: { index: true, follow: true, noarchive: true },
    },
    de: {
      title: "Gebühren & praktische Bedingungen – Fyrrehaven 61",
      description:
        "Sehen Sie die aktuelle Gebührenübersicht für Fyrrehaven 61: Buchungsregeln, Reinigung, späten Check-out und besondere Situationen. Strom (4 DKK/kWh) und Wasser (80 DKK/m³) werden nach Verbrauch abgerechnet. Keine Partys/Haustiere. Pool geöffnet 1.5.–1.10.",
      keywords: [
        "Ferienhaus Gebühren",
        "Gebührenübersicht",
        "Reinigungsgebühr",
        "Stromverbrauch Preis",
        "Wasserverbrauch Preis",
        "später Check-out Gebühr",
        "Schäden und Ersatz",
        "Fyrrehaven 61 Preise",
      ],
      image: OG_IMG,
      imageAlt: "Übersicht der Gebühren",
      robots: { index: true, follow: true, noarchive: true },
    },
  },
  privacy: {
    da: {
      title: "Privatlivspolitik – Fyrrehaven 61 | GDPR & persondata",
      description:
        "Læs hvordan vi behandler personoplysninger ved kontakt og booking af Fyrrehaven 61. Vi lagrer henvendelser som e-mail hos Simply, sætter kun nødvendige cookies som udgangspunkt og respekterer dine GDPR-rettigheder.",
      keywords: [
        "privatlivspolitik",
        "GDPR",
        "persondata",
        "databehandling",
        "dataansvarlig",
        "databehandler",
        "GDPR rettigheder",
        "cookiepolitik",
        "booking personoplysninger",
        "Fyrrehaven 61 privatliv",
        "e-mail opbevaring",
        "Simply e-mailudbyder",
      ],
      image: OG_IMG,
      imageAlt: "Privatlivspolitik",
      robots: { index: false, follow: true, noarchive: true },
    },
    en: {
      title: "Privacy Policy – Fyrrehaven 61 | GDPR & personal data",
      description:
        "Learn how we process personal data when you contact us or book Fyrrehaven 61. We store enquiries as email with Simply, set only necessary cookies by default, and respect your GDPR rights.",
      keywords: [
        "privacy policy",
        "GDPR",
        "personal data",
        "data processing",
        "data controller",
        "data processor",
        "GDPR rights",
        "cookie policy",
        "booking personal data",
        "Fyrrehaven 61 privacy",
        "email storage",
        "Simply email provider",
      ],
      image: OG_IMG,
      imageAlt: "Privacy policy",
      robots: { index: false, follow: true, noarchive: true },
    },
    de: {
      title: "Datenschutzerklärung – Fyrrehaven 61 | DSGVO & personenbezogene Daten",
      description:
        "Erfahren Sie, wie wir personenbezogene Daten verarbeiten, wenn Sie uns kontaktieren oder Fyrrehaven 61 buchen. Wir speichern Anfragen als E-Mail bei Simply, setzen standardmäßig nur notwendige Cookies und respektieren Ihre DSGVO-Rechte.",
      keywords: [
        "Datenschutzerklärung",
        "DSGVO",
        "personenbezogene Daten",
        "Datenverarbeitung",
        "Verantwortlicher",
        "Auftragsverarbeiter",
        "DSGVO Rechte",
        "Cookie-Richtlinie",
        "Buchung personenbezogene Daten",
        "Fyrrehaven 61 Datenschutz",
        "E-Mail Speicherung",
        "Simply E-Mail-Anbieter",
      ],
      image: OG_IMG,
      imageAlt: "Datenschutzerklärung",
      robots: { index: false, follow: true, noarchive: true },
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
    de: {
      title: "Sitemap | Fyrrehaven 61",
      description:
        "Übersicht über Seiten, Bereiche und nützliche Links für die schnelle Navigation.",
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
      robots: { index: false, follow: false, noarchive: true },
    },
    en: {
      title: "Chat | Fyrrehaven 61",
      description: "Ask questions about the house, area and booking.",
      image: OG_IMG,
      imageAlt: "Chat",
      robots: { index: false, follow: false, noarchive: true },
    },
    de: {
      title: "Chat | Fyrrehaven 61",
      description: "Stellen Sie Fragen zum Haus, zur Umgebung und zur Buchung.",
      image: OG_IMG,
      imageAlt: "Chat",
      robots: { index: false, follow: false, noarchive: true },
    },
  },
  notFound: {
    da: {
      title: "Side ikke fundet | Fyrrehaven 61",
      description: "Den ønskede side findes ikke.",
      image: OG_IMG,
      imageAlt: "Side ikke fundet",
      robots: { index: false, follow: true, noarchive: true },
    },
    en: {
      title: "Page not found | Fyrrehaven 61",
      description: "The page you requested could not be found.",
      image: OG_IMG,
      imageAlt: "Page not found",
      robots: { index: false, follow: true, noarchive: true },
    },
    de: {
      title: "Seite nicht gefunden | Fyrrehaven 61",
      description: "Die angeforderte Seite konnte nicht gefunden werden.",
      image: OG_IMG,
      imageAlt: "Seite nicht gefunden",
      robots: { index: false, follow: true, noarchive: true },
    },
  },
};

export function getSeoMeta(lang: Lang, key: SeoPageKey): SeoPack {
  const pack = SEO[key] ?? SEO.home;
  return pack[lang] ?? pack.en ?? pack.da;
}
