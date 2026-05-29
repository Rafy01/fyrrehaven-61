import type { Activity } from "../components/ActivitiesGrid/ActivitiesGrid";
import type { TagId } from "../lib/tags";

/** Rå model (hvis du vil udvide senere) */
export type Attraction = {
  id: string;
  titleDa: string;
  titleEn: string;
  descDa: string;
  descEn: string;
  tags: TagId[];
  href?: string;
  image?: string;
  distanceKm?: number;
  driveMin?: number;
};

/** Central liste (redigér frit) */
const ATTRACTION_DATA: Attraction[] = [
  /* ---------- Forlystelser / Parks ---------- */
  {
    id: "djurs-sommerland",
    titleDa: "Djurs Sommerland",
    titleEn: "Djurs Sommerland",
    descDa: "Nordens største sommerland med 60+ forlystelser og vandland.",
    descEn:
      "Scandinavia’s largest amusement park with 60+ rides and water park.",
    tags: ["parks", "kids"],
    href: "https://www.djurssommerland.dk/",
    image: "/area/djurs-sommerland.webp",
    driveMin: 12,
  },
  {
    id: "legerevet-grenaa",
    titleDa: "Lege-revet (Grenaa) – legeland",
    titleEn: "Lege-revet (Grenaa) – indoor playland",
    descDa: "Indendørs legeland: klatrebaner, rutsjebaner og boldbassin.",
    descEn: "Indoor playland: climbing frames, slides and ball pit.",
    tags: ["indoor", "kids", "parks"],
    href: "https://www.lege-revet.dk/",
    image: "/area/legerevet.webp",
    driveMin: 25,
  },
  {
    id: "hermans-hule-grenaa",
    titleDa: "Hermans Hule (Grenaa) – legeland",
    titleEn: "Hermans Hule (Grenaa) – indoor playland",
    descDa: "Stort indendørs legeland med rutsjebaner og trampoliner.",
    descEn: "Large indoor playland with slides and trampolines.",
    tags: ["indoor", "kids", "parks"],
    href: "https://hermanshule.dk/grenaa",
    image: "/area/hermans-hule.webp",
    driveMin: 25,
  },
  {
    id: "Fjollehaven",
    titleDa: "Fjollehaven",
    titleEn: "Fjollehaven",
    descDa: "Udendørs legeplads",
    descEn: "Large outdoor playland",
    tags: ["kids", "parks"],
    href: "https://maps.app.goo.gl/xNHVtcys49Ne55qo9",
    image: "/area/fjollehaven.webp",
    distanceKm: 0.8,
  },

  /* ---------- Natur / Strand ---------- */
  {
    id: "fjellerup-strand",
    titleDa: "Fjellerup Strand",
    titleEn: "Fjellerup Beach",
    descDa: "Bred, børnevenlig sandstrand i cykelafstand.",
    descEn: "Wide, family-friendly sandy beach within biking distance.",
    tags: ["beach", "nature", "kids"],
    image: "/area/fjellerup-strand.webp",
    distanceKm: 0.9,
  },
  {
    id: "mols-bjerge",
    titleDa: "Mols Bjerge Nationalpark",
    titleEn: "Mols Bjerge National Park",
    descDa: "Kuperet landskab, flotte udsigter og gode vandreruter.",
    descEn: "Hilly landscapes, great viewpoints and hiking trails.",
    tags: ["nature"],
    href: "https://nationalparkmolsbjerge.dk/",
    image: "/area/mols-bjerge.webp",
    driveMin: 35,
  },

  /* ---------- Kultur ---------- */
  {
    id: "kalo-slotsruin",
    titleDa: "Kalø Slotsruin",
    titleEn: "Kalø Castle Ruin",
    descDa: "Ikonisk borgruin i Kalø Vig – tur ad den gamle stenvej.",
    descEn:
      "Iconic castle ruin in Kalø Bay – scenic walk on the old stone road.",
    tags: ["culture", "nature"],
    href: "https://maps.app.goo.gl/fqDuc2J1m1hrRwVw7",
    image: "/area/kalo.webp",
    driveMin: 30,
  },

  /* ---------- Indendørs attr. ---------- */
  {
    id: "kattegatcentret",
    titleDa: "Kattegatcentret (Grenaa)",
    titleEn: "Kattegat Centre (Grenaa)",
    descDa: "Akvarium med hajer og sæler – perfekt til blæsende/kolde dage.",
    descEn: "Aquarium with sharks and seals – perfect for windy/chilly days.",
    tags: ["indoor", "kids"],
    href: "https://www.kattegatcentret.dk/",
    image: "/area/kattegatcentret.webp",
    driveMin: 28,
  },
  {
    id: "randers-regnskov",
    titleDa: "Randers Regnskov",
    titleEn: "Randers Rainforest",
    descDa: "Tropiske kupler med dyr og planter – året rundt.",
    descEn: "Tropical domes with animals and plants – year-round.",
    tags: ["indoor", "kids", "culture"],
    href: "https://www.randersregnskov.dk/",
    image: "/area/randers-regnskov.webp",
    driveMin: 40,
  },

  /* ---------- Mad / Indkøb ---------- */
  {
    id: "vaffelbageri",
    titleDa: "Fjellerup Vaffelbageri",
    titleEn: "Fjellerup Waffle Bakery",
    descDa: "Berømte vafler ved stranden – sæsonåbent.",
    descEn: "Famous waffles by the beach – seasonal opening.",
    tags: ["food", "beach", "kids"],
    image: "/area/vaffelbageriet.webp",
    distanceKm: 1.6,
  },
  {
    id: "vaffelbageri-food",
    titleDa: "Vaffelbageri - fastfood",
    titleEn: "Fjellerup Waffle Bakery - fast food",
    descDa: "Is og Fastfood – sæsonåbent.",
    descEn: "Ice cream and fast food – seasonal opening.",
    tags: ["food"],
    image: "/area/vaffelbageriet.webp",
    distanceKm: 1.6,
  },
  {
    id: "vaffelhuset",
    titleDa: "Vaffelhuset",
    titleEn: "Vaffelhuset",
    descDa: "Hjemmelavet is – sæsonåbent.",
    descEn: "Homemade ice cream – seasonal opening.",
    tags: ["food", "beach", "kids"],
    image: "/area/vaffelhuset.webp",
    distanceKm: 1.6,
  },
  {
    id: "brugsen-fjellerup",
    titleDa: "Brugsen Fjellerup Strand",
    titleEn: "Brugsen Fjellerup Strand",
    descDa: "Lokal dagligvarebutik til alt det praktiske.",
    descEn: "Local grocery store for everyday shopping.",
    tags: ["food"],
    image: "/area/brugsen-fjellerup.webp",
    distanceKm: 1.3,
  },
  {
    id: "Alt-Til-Dagen ",
    titleDa: "Alt Til Dagen",
    titleEn: "Alt Til Dagen",
    descDa: "Lokal dagligvarebutik til alt det praktiske.",
    descEn: "Local grocery store for everyday shopping.",
    tags: ["food"],
    href: "https://www.alttildagen.dk/?fbclid=IwY2xjawMj-yVleHRuA2FlbQIxMABicmlkETFNWWtSb1dOa1Jla0lGU09OAR7t_pQwhGFnDrT-mkze-g175WTvHcWto6rg67RsivSIu5t8OfKGWvxmbMmP_w_aem_s4ItNxQRkM6rs-VlTuniTg",
    image: "/area/alt-til-dagen.png",
    distanceKm: 1.1,
  },
];

/** Eksporter i ActivitiesGrid-format */
export const ATTRACTIONS: Activity[] = ATTRACTION_DATA.map((a) => ({
  id: a.id,
  titleDa: a.titleDa,
  titleEn: a.titleEn,
  descDa: a.descDa,
  descEn: a.descEn,
  tags: a.tags,
  href: a.href,
  image: a.image ?? "/area/placeholder.png",
  distanceKm: a.distanceKm,
  driveMin: a.driveMin,
}));
