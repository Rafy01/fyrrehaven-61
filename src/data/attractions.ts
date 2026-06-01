import type { Activity } from "../components/ActivitiesGrid/ActivitiesGrid";
import type { TagId } from "../lib/tags";

/** Rå model: pure attraction metadata. Translated copy lives in i18n.ts. */
export type Attraction = {
  id: string;
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
    tags: ["parks", "kids"],
    href: "https://www.djurssommerland.dk/",
    image: "/area/djurs-sommerland.webp",
    driveMin: 12,
  },
  {
    id: "legerevet-grenaa",
    tags: ["indoor", "kids", "parks"],
    href: "https://www.lege-revet.dk/",
    image: "/area/legerevet.webp",
    driveMin: 25,
  },
  {
    id: "hermans-hule-grenaa",
    tags: ["indoor", "kids", "parks"],
    href: "https://hermanshule.dk/grenaa",
    image: "/area/hermans-hule.webp",
    driveMin: 25,
  },
  {
    id: "fjollehaven",
    tags: ["kids", "parks"],
    href: "https://maps.app.goo.gl/xNHVtcys49Ne55qo9",
    image: "/area/fjollehaven.webp",
    distanceKm: 0.8,
  },

  /* ---------- Natur / Strand ---------- */
  {
    id: "fjellerup-strand",
    tags: ["beach", "nature", "kids"],
    image: "/area/fjellerup-strand.webp",
    distanceKm: 0.9,
  },
  {
    id: "mols-bjerge",
    tags: ["nature"],
    href: "https://nationalparkmolsbjerge.dk/",
    image: "/area/mols-bjerge.webp",
    driveMin: 35,
  },

  /* ---------- Kultur ---------- */
  {
    id: "kalo-slotsruin",
    tags: ["culture", "nature"],
    href: "https://maps.app.goo.gl/fqDuc2J1m1hrRwVw7",
    image: "/area/kalo.webp",
    driveMin: 30,
  },

  /* ---------- Indendørs attr. ---------- */
  {
    id: "kattegatcentret",
    tags: ["indoor", "kids"],
    href: "https://www.kattegatcentret.dk/",
    image: "/area/kattegatcentret.webp",
    driveMin: 28,
  },
  {
    id: "randers-regnskov",
    tags: ["indoor", "kids", "culture"],
    href: "https://www.randersregnskov.dk/",
    image: "/area/randers-regnskov.webp",
    driveMin: 40,
  },

  /* ---------- Mad / Indkøb ---------- */
  {
    id: "vaffelbageri",
    tags: ["food", "beach", "kids"],
    image: "/area/vaffelbageriet.webp",
    distanceKm: 1.6,
  },
  {
    id: "vaffelbageri-food",
    tags: ["food"],
    image: "/area/vaffelbageriet.webp",
    distanceKm: 1.6,
  },
  {
    id: "vaffelhuset",
    tags: ["food", "beach", "kids"],
    image: "/area/vaffelhuset.webp",
    distanceKm: 1.6,
  },
  {
    id: "brugsen-fjellerup",
    tags: ["food"],
    image: "/area/brugsen-fjellerup.webp",
    distanceKm: 1.3,
  },
  {
    id: "alt-til-dagen",
    tags: ["food"],
    href: "https://www.alttildagen.dk/?fbclid=IwY2xjawMj-yVleHRuA2FlbQIxMABicmlkETFNWWtSb1dOa1Jla0lGU09OAR7t_pQwhGFnDrT-mkze-g175WTvHcWto6rg67RsivSIu5t8OfKGWvxmbMmP_w_aem_s4ItNxQRkM6rs-VlTuniTg",
    image: "/area/alt-til-dagen.png",
    distanceKm: 1.1,
  },
];

/** Eksporter i ActivitiesGrid-format */
export const ATTRACTIONS: Activity[] = ATTRACTION_DATA.map((a) => ({
  id: a.id,
  tags: a.tags,
  href: a.href,
  image: a.image ?? "/area/placeholder.png",
  distanceKm: a.distanceKm,
  driveMin: a.driveMin,
}));
