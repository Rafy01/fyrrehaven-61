import type { Lang } from "../lib/lang";

export type ExtraService = {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  priceDKK?: number;
  priceLabel?: Record<Lang, string>;
  unit?: Record<Lang, string>;
};

export const extraServices: ExtraService[] = [
  {
    id: "bedding",
    title: {
      da: "Sengetøj",
      en: "Bed linen",
      de: "Bettwaren",
    },
    description: {
      da: "Dyne og pude kan tilvælges, hvis du ikke selv medbringer det.",
      en: "Duvet and pillow can be added if you do not bring your own.",
      de: "Decke und Kissen können hinzugebucht werden, wenn Sie diese nicht selbst mitbringen.",
    },
    priceDKK: 75,
    unit: {
      da: "pr. person",
      en: "per person",
      de: "pro Person",
    },
  },
  {
    id: "sheets",
    title: {
      da: "Sengelinned",
      en: "Sheets",
      de: "Bettwäsche",
    },
    description: {
      da: "Lagen, dynebetrak og pudebetrak til opholdet.",
      en: "Sheet, duvet cover and pillowcase for the stay.",
      de: "Laken, Bettbezug und Kissenbezug für den Aufenthalt.",
    },
    priceDKK: 50,
    unit: {
      da: "pr. person",
      en: "per person",
      de: "pro Person",
    },
  },
  {
    id: "towels",
    title: {
      da: "Håndklæder",
      en: "Towels",
      de: "Handtücher",
    },
    description: {
      da: "Håndklæder kan bestilles på forhånd, så de ligger klar ved ankomst.",
      en: "Towels can be ordered in advance so they are ready on arrival.",
      de: "Handtücher können vorab bestellt werden, damit sie bei Ankunft bereitliegen.",
    },
    priceDKK: 75,
    unit: {
      da: "pr. person",
      en: "per person",
      de: "pro Person",
    },
  },
  {
    id: "bundle",
    title: {
      da: "Pakke: sengetøj, sengelinned og håndklæder",
      en: "Bundle: bed linen, sheets and towels",
      de: "Paket: Bettwaren, Bettwäsche und Handtücher",
    },
    description: {
      da: "Den enkle løsning, hvis I vil slippe for selv at pakke tekstiler.",
      en: "The simple option if you want to avoid packing textiles yourself.",
      de: "Die einfache Lösung, wenn Sie keine Textilien selbst mitbringen möchten.",
    },
    priceDKK: 150,
    unit: {
      da: "pr. person",
      en: "per person",
      de: "pro Person",
    },
  },
  {
    id: "hot-tub-fill",
    title: {
      da: "Påfyldning af vildmarksbad",
      en: "Hot tub fill-up",
      de: "Befüllung des Badezubers",
    },
    description: {
      da: "Vildmarksbadet kan være fyldt før ankomst. Det tager ca. 2 timer at fylde op.",
      en: "The hot tub can be filled before arrival. Filling takes about 2 hours.",
      de: "Der Badezuber kann vor Ankunft gefüllt werden. Das Befüllen dauert etwa 2 Stunden.",
    },
      priceLabel: {
      da: "Gratis",
      en: "Free",
      de: "Kostenlos",
    },
  },
  {
    id: "high-chair",
    title: {
      da: "Højstol",
      en: "High chair",
      de: "Hochstuhl",
    },
    description: {
      da: "Bestilles på forhånd, så den er klar til de mindste gæster.",
      en: "Pre-order so it is ready for the youngest guests.",
      de: "Bitte vorab bestellen, damit er für die kleinsten Gäste bereitsteht.",
    },
    priceLabel: {
      da: "Gratis",
      en: "Free",
      de: "Kostenlos",
    },
  },
  {
    id: "baby-cot",
    title: {
      da: "Babyseng",
      en: "Baby cot",
      de: "Babybett",
    },
    description: {
      da: "Leveres efter aftale og bestilles bedst inden ankomst.",
      en: "Available by arrangement and best ordered before arrival.",
      de: "Nach Absprache verfügbar und am besten vor Ankunft bestellen.",
    },
    priceLabel: {
      da: "Gratis",
      en: "Free",
      de: "Kostenlos",
    },
  },
];
