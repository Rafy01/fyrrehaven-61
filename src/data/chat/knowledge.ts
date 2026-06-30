// src/data/chat/knowledge.ts
export type ChatLink = {
  labelDa: string;
  labelEn: string;
  to?: string;   // intern route
  href?: string; // ekstern URL
};

export type Snippet = {
  id: string;
  titleDa: string;
  titleEn: string;
  bodyDa: string; // kan indeholde **bold** og tomme linjer som linjeskift
  bodyEn: string;
  triggers: string[]; // ord/fraser der bør matche dette svar
  links?: ChatLink[];
};

/** Små hjælpefraser der går igen */
const L = {
  approxDa: "ca.",
  approxEn: "approx.",
};


export const SNIPPETS: Snippet[] = [
  /* =========================
   * BOOKING & PRISER
   * ========================= */
  {
    id: "booking-direct",
    titleDa: "Direkte booking",
    titleEn: "Direct booking",
    bodyDa:
      "**Ja, du kan sende en privat booking-forespørgsel via hjemmesiden.**\n\n" +
      "Vi har både Airbnb og privat forespørgsel. Ved privat booking bekræfter vi pr. mail og sender lejekontrakt.",
    bodyEn:
      "**Yes, you can send a private booking request on our website.**\n\n" +
      "We use both Airbnb and private requests. For private bookings we confirm by email and send a rental agreement.",
    triggers: ["booking", "book", "direkte booking", "privat booking", "reservation", "forespørgsel"],
    links: [
      { labelDa: "Kontakt", labelEn: "Contact", to: "/da/kontakt" },
      { labelDa: "Contact", labelEn: "Contact", to: "/en/contact" },
    ],
  },
  {
    id: "deposit",
    titleDa: "Depositum",
    titleEn: "Deposit",
    bodyDa:
      "Airbnb: **intet depositum**.\n\n" +
      "Privat booking: **depositum fremgår af lejekontrakten**. Tilbagebetales **hurtigst muligt** efter ophold, fratrukket evt. forbrug.",
    bodyEn:
      "Airbnb: **no deposit**.\n\n" +
      "Private booking: **deposit is specified in the contract**. It is **refunded promptly** after departure, minus any utilities.",
    triggers: ["depositum", "deposit", "sikkerhed", "pantsætning"],
  },
  {
    id: "cancellation",
    titleDa: "Afbestilling",
    titleEn: "Cancellation",
    bodyDa: "Følg **Airbnbs afbestillingsregler** for Airbnb-bookinger. Privat booking følger lejekontraktens betingelser.",
    bodyEn: "For Airbnb bookings, follow **Airbnb’s cancellation policy**. Private bookings follow the contract terms.",
    triggers: ["afbestil", "aflys", "afbestilling", "cancel", "cancellation", "refund"],
  },
  {
    id: "minmax-nights",
    titleDa: "Antal nætter",
    titleEn: "Number of nights",
    bodyDa: "**Varierer efter sæson.** Skriv gerne, hvis du er i tvivl—vi finder typisk en god løsning.",
    bodyEn: "**Varies by season.** Feel free to ask—there’s often a flexible solution.",
    triggers: ["minimum nætter", "min nætter", "max nætter", "antal nætter", "minimum nights", "nights"],
  },
  {
    id: "max-guests",
    titleDa: "Maks. gæster",
    titleEn: "Max guests",
    bodyDa: "**Op til 10 personer i alt** (inkl. børn og babyer).",
    bodyEn: "**Up to 10 guests in total** (including children and infants).",
    triggers: ["gæster", "maks gæster", "max guests", "capacity", "10 personer"],
  },
  {
    id: "no-parties",
    titleDa: "Fester & aldersgrænse",
    titleEn: "Parties & age limit",
    bodyDa:
      "**Ingen fester/arrangementer.** Minimumsalder for ansvarlig lejer er **25 år**. Tak for forståelsen 🌿",
    bodyEn:
      "**No parties or events.** The minimum age for the responsible renter is **25 years**. Thanks for understanding 🌿",
    triggers: ["fester", "fest", "arrangement", "party", "event", "alder", "age"],
  },

  /* =========================
   * CHECK-IN / CHECK-OUT & NØGLER
   * ========================= */
  {
    id: "checkin",
    titleDa: "Check-in / Check-out",
    titleEn: "Check-in / Check-out",
    bodyDa:
      "Standard: **Check-in kl. 16** / **Check-out kl. 10**.\n\n" +
      "Tidlig indtjekning/sen udtjekning er **muligt mod betaling**, hvis der ikke er gæster lige før/efter. Bekræftes **et par dage før ankomst**.",
    bodyEn:
      "Standard: **Check-in 16:00** / **Check-out 10:00**.\n\n" +
      "Early check-in/late check-out is **possible (paid)** if the calendar allows. Confirmed **a few days before arrival**.",
    triggers: ["check in", "check-in", "check out", "check-out", "tidlig", "sen"],
  },
  {
    id: "keybox",
    titleDa: "Nøgleboks",
    titleEn: "Key box",
    bodyDa:
      "Nøgleboksen er **til højre for hoveddøren**. Koden udsendes **1 time før** indtjekning.",
    bodyEn:
      "The key box is **to the right of the front door**. The code is sent **1 hour before** check-in.",
    triggers: ["nøgle", "nøgleboks", "key", "keybox", "kode", "code"],
  },
  {
    id: "id-check",
    titleDa: "ID før indtjek",
    titleEn: "ID before check-in",
    bodyDa: "**Nej, vi kræver ikke ID** før check-in.",
    bodyEn: "**No, we do not require ID** before check-in.",
    triggers: ["id", "legitimation", "pas", "passport"],
  },

  /* =========================
   * FORBRUG & AFREGNING
   * ========================= */
  {
    id: "utilities",
    titleDa: "El & vand – afregning",
    titleEn: "Electricity & water – settlement",
    bodyDa:
      "El og vand afregnes **efter forbrug** via **bankoverførsel efter opholdet**.\n\n" +
      "Forventningsniveau: el **" + L.approxDa + " 200–250 DKK/dag**, vand **" + L.approxDa + " 50 DKK/dag** (afhængigt af sæson/brug).",
    bodyEn:
      "Electricity and water are **billed by usage**, paid via **bank transfer after your stay**.\n\n" +
      "Typical usage: electricity **" + L.approxEn + " 200–250 DKK/day**, water **" + L.approxEn + " 50 DKK/day** (season/usage dependent).",
    triggers: ["el", "strøm", "vand", "forbrug", "afregning", "utilities", "electricity", "water", "kwh", "m3"],
  },
  {
    id: "meters",
    titleDa: "Aflæsning af målere",
    titleEn: "Meter readings",
    bodyDa:
      "Ved ankomst **aflæs el- og vandmåler** og **upload et foto** via link i vores beskeder/ved indgangen til huset.",
    bodyEn:
      "On arrival, please **read the electricity and water meters** and **upload a photo** via the link in our messages/at the house entrance.",
    triggers: ["måler", "måling", "aflæsning", "meter", "readings", "aflæse"],
  },
  {
    id: "ev",
    titleDa: "Elbil – opladning",
    titleEn: "EV charging",
    bodyDa:
      "**Type 2**. Medbring **eget kabel**. Forbrug **indgår i el-afregningen**.",
    bodyEn:
      "**Type 2**. Bring **your own cable**. Usage **is part of the electricity billing**.",
    triggers: ["elbil", "ev", "lade", "oplade", "charger", "charge"],
  },

  /* =========================
   * RENGØRING, Linned & EKSTRA
   * (fra prislisten på billedet)
   * ========================= */
  {
    id: "extras-overview",
    titleDa: "Ekstra ydelser (tilkøb)",
    titleEn: "Extras (add-ons)",
    bodyDa:
      "**Sengetøj**: DKK 75 pr. person\n\n" +
      "**Sengelinned**: DKK 50 pr. person\n\n" +
      "**Håndklæder**: DKK 75 pr. person\n\n" +
      "**Pakke: Sengetøj + Sengelinned + Håndklæder**: DKK 150 pr. person\n\n" +
      "**Påfyldning af vildmarksbad**: Gratis (ca. 2 timer for at fylde op)\n\n" +
      "**Højstol**: Gratis (bestilles på forhånd)\n\n" +
      "**Babyseng**: Gratis (bestilles på forhånd)\n\n" +
      "**Inkluderet i lejen**: Viskestykke, karklud, shampoo, shower gel, håndsæbe, opvaskemiddel, opvaskepulver, kaffebønner.",
    bodyEn:
      "**Bed linen**: DKK 75 per person\n\n" +
      "**Sheets**: DKK 50 per person\n\n" +
      "**Towels**: DKK 75 per person\n\n" +
      "**Bundle: Bed linen + Sheets + Towels**: DKK 150 per person\n\n" +
      "**Wilderness tub fill-up**: Free (about 2 hours to fill)\n\n" +
      "**High chair**: Free (pre-order)\n\n" +
      "**Baby cot**: Free (pre-order)\n\n" +
      "**Included**: Tea towel, cloth, shampoo, shower gel, hand soap, dish soap, dishwasher powder, coffee beans.",
    triggers: [
      "sengetøj",
      "sengelinned",
      "håndklæder",
      "pakke",
      "vildmarksbad påfyldning",
      "højstol",
      "babyseng",
      "ekstra",
      "tilkøb",
      "linnen",
      "towels",
      "extras",
    ],
  },

  /* =========================
   * HUSREGLER
   * ========================= */
  {
    id: "rules-core",
    titleDa: "Husregler",
    titleEn: "House rules",
    bodyDa:
      "• **Ingen fester**, ingen rygning indendørs, **25+ år** for ansvarlig lejer.\n\n" +
      "• **Adgang forbudt** i **anneks** og **skur**, samt **pool-teknik**.\n\n" +
      "• **Stilleperiode**: **22–06**. Vis hensyn til naboer 🌙",
    bodyEn:
      "• **No parties**, no indoor smoking, **25+ years** for responsible renter.\n\n" +
      "• **No access** to **annex**, **shed**, or **pool technical room**.\n\n" +
      "• **Quiet hours**: **22:00–06:00**. Please be considerate 🌙",
    triggers: ["regler", "husregler", "rules", "party", "smoking", "rygning", "quiet"],
  },

  /* =========================
   * SIKKERHED & UDSTYR
   * ========================= */
  {
    id: "safety-core",
    titleDa: "Sikkerhed",
    titleEn: "Safety",
    bodyDa:
      "• **Røgalarm + kuliltealarm (Nest)** i køkken/alrum – sender også besked til os.\n\n" +
      "• **Førstehjælpskasse**: på **køkkenøen**.\n\n" +
      "• **Pool/vildmarksbad/sauna** – læs venligst vores retningslinjer før brug.",
    bodyEn:
      "• **Smoke + CO alarm (Nest)** in the kitchen/living area – notifies us as well.\n\n" +
      "• **First-aid kit**: on the **kitchen island**.\n\n" +
      "• **Pool/wilderness tub/sauna** – please read our guidelines before use.",
    triggers: ["sikkerhed", "safety", "brand", "alarm", "first aid", "førstehjælp"],
    links: [
      {
        labelDa: "Pool & vildmarksbad – retningslinjer",
        labelEn: "Pool & hot tub – guidelines",
        href: "https://booking.fyrrehaven-61.dk/pool-vildmarksbad/",
      },
    ],
  },

  /* =========================
   * KOMFORT & TEKNIK
   * ========================= */
  {
    id: "wifi",
    titleDa: "Wi-Fi",
    titleEn: "Wi-Fi",
    bodyDa: "**Wi-Fi password**: Dolma3000",
    bodyEn: "**Wi-Fi password**: Dolma3000",
    triggers: ["wifi", "wi-fi", "internet", "kode", "password", "adgangskode"],
  },
  {
    id: "ac",
    titleDa: "Klimaanlæg",
    titleEn: "Air conditioning",
    bodyDa: "**1 enhed i køkken/alrum**.",
    bodyEn: "**1 unit in the kitchen/living area**.",
    triggers: ["aircon", "air condition", "ac", "klimaanlæg"],
  },
  {
    id: "floor-heat",
    titleDa: "Gulvvarme",
    titleEn: "Floor heating",
    bodyDa: "**Gulvvarme i alle rum** med termostat. Slukkes normalt i sommerperioden.",
    bodyEn: "**Floor heating in all rooms** with thermostats. Usually off during summer.",
    triggers: ["gulvvarme", "floor", "heat", "varme"],
  },
  {
    id: "tv-apps",
    titleDa: "TV & streaming",
    titleEn: "TV & streaming",
    bodyDa:
      "**Chromecast** med adgang til alle apps—brug dit eget login, hvis tjenesten kræver det. Ingen flow-TV inkluderet.",
    bodyEn:
      "**Chromecast** with access to all apps—use your own logins if required. No linear TV included.",
    triggers: ["tv", "chromecast", "streaming", "apps", "netflix", "hbo", "viaplay"],
  },
  {
    id: "ps4",
    titleDa: "PlayStation 4",
    titleEn: "PlayStation 4",
    bodyDa: "Der er **PS4** og spil. Du må gerne **logge ind med dit eget PSN**.",
    bodyEn: "We provide a **PS4** with games. You may **sign in with your own PSN**.",
    triggers: ["ps4", "playstation", "spil", "games", "console"],
  },

  /* =========================
   * KØKKEN & BABY
   * ========================= */
  {
    id: "baby-equip",
    titleDa: "Babyudstyr",
    titleEn: "Baby equipment",
    bodyDa:
      "**Babyseng** (gratis, bestilles) – **højstol** (gratis, bestilles).\n\n" +
      "Vi har **børneservice**. Rejseseng leveres **inkl. madras og lagen**.",
    bodyEn:
      "**Baby cot** (free, pre-order) – **high chair** (free, pre-order).\n\n" +
      "We provide **kids’ tableware**. Travel cot comes **with mattress & sheet**.",
    triggers: ["baby", "babyseng", "højstol", "high chair", "cot", "rejseseng", "kids"],
  },
  {
    id: "kitchen-gear",
    titleDa: "Køkkenudstyr",
    titleEn: "Kitchen gear",
    bodyDa:
      "**Opvaskemaskine**, **ovn**, **mikroovn**. **Kaffemaskine (bønner)** – en pose bønner er inkluderet.\n\n" +
      "**Sodastream**: 2 cylindre (1 i brug + 1 ekstra). **Startpakke** med basale forbrugsvarer.",
    bodyEn:
      "**Dishwasher**, **oven**, **microwave**. **Coffee machine (beans)** – one bag of beans included.\n\n" +
      "**Sodastream**: 2 cylinders (1 in use + 1 spare). **Starter kit** with basics provided.",
    triggers: ["køkken", "opvasker", "opvaskemaskine", "ovn", "mikro", "kaffe", "sodastream"],
  },

  /* =========================
   * GRILL & UDENDØRS (SPLITTET)
   * ========================= */
  {
    id: "grill",
    titleDa: "Gasgrill",
    titleEn: "Gas grill",
    bodyDa:
      "**Gasgrill**: gas inkluderet + **ekstra flaske** på stedet. **Gæster rengør efter brug.**",
    bodyEn:
      "**Gas grill**: gas included + **spare bottle** on site. **Guests clean after use.**",
    triggers: ["grill", "gasgrill", "bbq", "barbecue", "weber"],
  },
  {
    id: "play-tower",
    titleDa: "Trampolin & legetårn",
    titleEn: "Trampoline & play tower",
    bodyDa:
      "**Brug på eget ansvar** og **med opsyn**.\n\n" +
      "Trampolin, gynge og legetårn i haven.",
    bodyEn:
      "**Use at your own risk** and **with supervision**.\n\n" +
      "Trampoline, swing and play tower in the garden.",
    triggers: ["trampolin", "gynge", "legetårn", "legeplads", "playground", "swing", "trampoline"],
  },
  {
    id: "no-bikes",
    titleDa: "Cykler",
    titleEn: "Bicycles",
    bodyDa: "**Cykler er ikke til rådighed.**",
    bodyEn: "**Bicycles are not available.**",
    triggers: ["cykel", "cykler", "bikes", "bicycle"],
  },
  {
    id: "outdoor-lights",
    titleDa: "Udendørs lys",
    titleEn: "Outdoor lights",
    bodyDa:
      "**Udelys hele vejen rundt**. Kan tændes ved TV’et (delvist også sensorsstyret).",
    bodyEn:
      "**Outdoor lights all around**. Can be switched near the TV (partly sensor-controlled).",
    triggers: ["lys", "udelys", "belysning", "outdoor light", "light outside"],
  },

  /* =========================
   * TILGÆNGELIGHED & PARKERING
   * ========================= */
  {
    id: "accessibility",
    titleDa: "Tilgængelighed",
    titleEn: "Accessibility",
    bodyDa: "**Handicapvenligt**. Soveværelse/bad i stueplan.",
    bodyEn: "**Accessible friendly**. Bedroom/bath at ground level.",
    triggers: ["handicap", "tilgængelig", "rullestol", "wheelchair", "accessible"],
  },
  {
    id: "parking",
    titleDa: "Parkering",
    titleEn: "Parking",
    bodyDa:
      "**Gratis parkering** på grus **lige ved huset** (ikke på græs). Ca. **6 pladser**.",
    bodyEn:
      "**Free parking** on gravel **right by the house** (no parking on grass). About **6 spaces**.",
    triggers: ["parkering", "parking", "bil", "pladser"],
  },

  /* =========================
   * DISTANCER (fra huset)
   * ========================= */
  {
    id: "distances",
    titleDa: "Afstande fra huset",
    titleEn: "Distances from the house",
    bodyDa:
      "**Fjellerup Strand**: " + L.approxDa + " 0,9 km\n\n" +
      "**Dagli’Brugsen**: " + L.approxDa + " 1,4 km\n\n" +
      "**Vaffelbageri**: " + L.approxDa + " 1,6 km\n\n" +
      "**Djurs Sommerland**: " + L.approxDa + " 12 min i bil\n\n" +
      "**Kattegatcentret (Grenaa)**: " + L.approxDa + " 28–30 min i bil\n\n" +
      "**Randers Regnskov**: " + L.approxDa + " 40 min i bil\n\n" +
      "**Ree Park Safari (Ebeltoft)**: " + L.approxDa + " 45–50 min i bil\n\n" +
      "**Skandinavisk Dyrepark**: " + L.approxDa + " 35–40 min i bil\n\n" +
      "**Kalø Slotsruin / Mols Bjerge**: " + L.approxDa + " 35–40 min i bil\n\n" +
      "**Legeland (Grenaa: Lege-revet / Hermans Hule)**: " + L.approxDa + " 28–30 min i bil",
    bodyEn:
      "**Fjellerup Beach**: " + L.approxEn + " 0.9 km\n\n" +
      "**Dagli’Brugsen supermarket**: " + L.approxEn + " 1.4 km\n\n" +
      "**Waffle bakery**: " + L.approxEn + " 1.6 km\n\n" +
      "**Djurs Sommerland**: " + L.approxEn + " 12 min by car\n\n" +
      "**Kattegat Centre (Grenaa)**: " + L.approxEn + " 28–30 min by car\n\n" +
      "**Randers Rainforest**: " + L.approxEn + " 40 min by car\n\n" +
      "**Ree Park Safari (Ebeltoft)**: " + L.approxEn + " 45–50 min by car\n\n" +
      "**Scandinavian Wildlife Park**: " + L.approxEn + " 35–40 min by car\n\n" +
      "**Kalø Castle ruin / Mols Bjerge**: " + L.approxEn + " 35–40 min by car\n\n" +
      "**Indoor playlands (Grenaa: Lege-revet / Hermans Hule)**: " + L.approxEn + " 28–30 min by car",
    triggers: ["afstande", "distance", "hvor langt", "km", "minutter", "vej", "transport"],
  },

  /* =========================
   * SUPPORT & KONTAKT
   * ========================= */
  {
    id: "support",
    titleDa: "Support under ophold",
    titleEn: "Support during your stay",
    bodyDa:
      "Ved akutte problemer: **skriv på mail, SMS eller via Airbnb** – vi svarer typisk **under 1 time**.",
    bodyEn:
      "For urgent issues: **email, SMS or via Airbnb** – we typically respond **within 1 hour**.",
    triggers: ["akut", "problem", "support", "hjælp", "kontakt", "emergency"],
    links: [
      { labelDa: "Skriv til os", labelEn: "Contact us", to: "/da/kontakt" },
      { labelDa: "Contact us", labelEn: "Contact us", to: "/en/contact" },
    ],
  },

  /* =========================
   * ADRESSE
   * ========================= */
  {
    id: "address",
    titleDa: "Adresse",
    titleEn: "Address",
    bodyDa: "**Fyrrehaven 61, 8585 Glesborg** (Fjellerup Strand).",
    bodyEn: "**Fyrrehaven 61, 8585 Glesborg** (Fjellerup Strand).",
    triggers: ["adresse", "address", "hvor ligger", "location", "addresse"],
  },
];
