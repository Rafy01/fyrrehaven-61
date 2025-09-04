// src/data/chat/knowledge.ts
export type Link = {
  labelDa: string;
  labelEn: string;
  to?: string;
  href?: string;
};

export type Snippet = {
  id: string;
  triggers?: string[];
  titleDa: string;
  titleEn: string;
  bodyDa: string;
  bodyEn: string;
  links?: Link[];
};

export const SNIPPETS: Snippet[] = [
  {
    id: "check-in",
    triggers: ["check-in", "check ind", "nøgleboks", "ankomst", "indtjek"],
    titleDa: "Check-in & nøgleboks",
    titleEn: "Check-in & key box",
    bodyDa:
      "Selv-indtjek via nøgleboks. Koden sendes ca. 1 time før ankomst. Standardtid: kl. 16.00.",
    bodyEn:
      "Self check-in via key box. The code is sent ~1 hour before arrival. Default time: 4 PM.",
  },
  {
    id: "pool",
    triggers: ["pool", "opvarmet", "wellness", "sauna", "vildmarksbad"],
    titleDa: "Pool & wellness",
    titleEn: "Pool & wellness",
    bodyDa:
      "Udendørs pool (~29 °C), 3,5×8 m, 1,5 m dyb. Åben 1. maj – 1. oktober. Lys i pool, automatisk kemi. Sauna (op til 8) og vildmarksbad (op til 6).",
    bodyEn:
      "Outdoor pool (~29 °C), 3.5×8 m, 1.5 m deep. Open May 1 – Oct 1. Pool lighting, automatic chemicals. Sauna (up to 8) and hot tub (up to 6).",
  },
  {
    id: "area",
    triggers: ["område", "strand", "skov", "udflugter", "area", "beach"],
    titleDa: "Området",
    titleEn: "The area",
    bodyDa:
      "Skovsti ved huset og strand i cykelafstand. Se kort og aktiviteter på områdesiden.",
    bodyEn:
      "Forest trails from the house and a bikeable beach. See map and activities on the area page.",
    links: [{ labelDa: "Se område", labelEn: "Open area", to: "/area" }],
  },
  {
    id: "utilities",
    triggers: ["forbrug", "el", "vand", "afregning", "priser"],
    titleDa: "El- og vandforbrug",
    titleEn: "Electricity & water",
    bodyDa:
      "El- og vandforbrug afregnes efter endt ophold via bankoverførsel. Indsend målerfoto ved indtjek.",
    bodyEn:
      "Electricity and water are settled after the stay via bank transfer. Send meter photos at check-in.",
  },
];
