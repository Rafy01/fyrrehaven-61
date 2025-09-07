// src/data/gallery.ts
export type Lang = "da" | "en";
export type AlbumId =
  | "plantegning"
  | "indoor"
  | "pool"
  | "spa"
  | "sauna"
  | "aktivitetsrum";

export type GalleryDataItem = {
  src: string; // thumbnail/standard
  full?: string; // stor version (fallback = src)
  altDa?: string;
  altEn?: string;
};

export type GalleryAlbum = {
  id: AlbumId;
  titleDa: string;
  titleEn: string;
  cover?: string; // valgfri – hvis ikke sat bruger vi items[0].src
  items: GalleryDataItem[];
};

/** Albums (mapper) */
export const GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    id: "plantegning",
    titleDa: "Plantegning",
    titleEn: "Floor plan",
    cover: "/gallery/plantegning/floorplan.webp",
    items: [
      {
        src: "/gallery/plantegning/floorplan.webp",
        altDa: "Plantegning",
        altEn: "Floor plan",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // INDOOR – BRUGER DINE FAKTISKE FILNAVNE + COVER = IMG_3665.webp
  // ─────────────────────────────────────────────────────────
  {
    id: "indoor",
    titleDa: "Indendørs",
    titleEn: "Indoor",
    cover: "/gallery/indoor/IMG_3665.webp",
    items: [
      {
        src: "/gallery/indoor/IMG_3664.webp",
        altDa: "Fyrrehaven 61 – indendørs opholdsrum ved Fjellerup Strand",
        altEn: "Fyrrehaven 61 – indoor living area near Fjellerup Beach",
      },
      {
        src: "/gallery/indoor/IMG_3665.webp",
        altDa: "Lys stue med sofa – Fyrrehaven 61",
        altEn: "Bright living room with sofa – Fyrrehaven 61",
      },
      {
        src: "/gallery/indoor/IMG_3666.webp",
        altDa: "Køkken-alrum med spiseplads i sommerhus ved Fjellerup Strand",
        altEn:
          "Kitchen–dining space with table in holiday home near Fjellerup Beach",
      },
      {
        src: "/gallery/indoor/IMG_3667.webp",
        altDa: "Stuehjørne med sofa og vinduer",
        altEn: "Lounge corner with sofa and windows",
      },
      {
        src: "/gallery/indoor/IMG_3668.webp",
        altDa: "Detalje fra køkkenet – moderne hvide elementer",
        altEn: "Kitchen detail – modern white cabinetry",
      },
      {
        src: "/gallery/indoor/IMG_3669.webp",
        altDa: "Gang med adgang til værelser – Fyrrehaven 61",
        altEn: "Hallway with access to bedrooms – Fyrrehaven 61",
      },
      {
        src: "/gallery/indoor/IMG_3670.webp",
        altDa: "Badeværelse med bruser",
        altEn: "Bathroom with shower",
      },
      {
        src: "/gallery/indoor/IMG_3671.webp",
        altDa: "Hyggekrog med lænestol og lampe",
        altEn: "Cozy nook with armchair and lamp",
      },
      {
        src: "/gallery/indoor/IMG_3672.webp",
        altDa: "Brændeovn i stuen – feriehus ved Fjellerup Strand",
        altEn: "Wood stove in living room – holiday home near Fjellerup Beach",
      },
      {
        src: "/gallery/indoor/IMG_3673.webp",
        altDa: "Udsigt mod terrasse fra stuen",
        altEn: "View towards terrace from living room",
      },
      {
        src: "/gallery/indoor/IMG_3674.webp",
        altDa: "Soveværelse med dobbeltseng – Fyrrehaven 61",
        altEn: "Bedroom with double bed – Fyrrehaven 61",
      },
      {
        src: "/gallery/indoor/IMG_3675.webp",
        altDa: "Soveværelse med to enkeltsenge",
        altEn: "Bedroom with twin single beds",
      },
      {
        src: "/gallery/indoor/IMG_3676.webp",
        altDa: "Skrive- eller arbejdsplads i opholdszonen",
        altEn: "Desk/work corner in living zone",
      },
      {
        src: "/gallery/indoor/IMG_3677.webp",
        altDa: "Entré med opbevaring",
        altEn: "Entrance with storage",
      },
      {
        src: "/gallery/indoor/IMG_3678.webp",
        altDa: "Bryggers med vask og maskiner",
        altEn: "Utility room with sink and appliances",
      },
      {
        src: "/gallery/indoor/IMG_3679.webp",
        altDa: "Indretningsdetalje – kunst og belysning",
        altEn: "Interior detail – art and lighting",
      },
      {
        src: "/gallery/indoor/IMG_3680.webp",
        altDa: "Loft, træ og belysning i stuen",
        altEn: "Ceiling, wood and lighting in living room",
      },
      {
        src: "/gallery/indoor/IMG_3681.webp",
        altDa: "Opholdsrum – overblik over sofa og spiseplads",
        altEn: "Living area – overview of sofa and dining",
      },
      {
        src: "/gallery/indoor/IMG_3682.webp",
        altDa: "Spisebord med plads til familien",
        altEn: "Dining table with seating for the family",
      },
      {
        src: "/gallery/indoor/IMG_3683.webp",
        altDa: "Sofagruppe til afslapning",
        altEn: "Sofa group for relaxing",
      },
      {
        src: "/gallery/indoor/IMG_3684.webp",
        altDa: "Morgenlys i stue og køkken – Fyrrehaven 61",
        altEn: "Morning light in living room and kitchen – Fyrrehaven 61",
      },
      {
        src: "/gallery/indoor/IMG_3685.webp",
        altDa: "Aftenstemning indendørs ved Fjellerup Strand",
        altEn: "Evening ambience indoors near Fjellerup Beach",
      },
      {
        src: "/gallery/indoor/IMG_3686.webp",
        altDa: "Indendørs detalje – naturlige materialer",
        altEn: "Indoor detail – natural materials",
      },
    ],
  },

  // RESTEN UÆNDRET
  {
    id: "pool",
    titleDa: "Pool",
    titleEn: "Pool",
    cover: "/gallery/pool/cover.webp",
    items: [
      {
        src: "/gallery/pool/1.webp",
        altDa: "Udendørs pool",
        altEn: "Outdoor pool",
      },
      {
        src: "/gallery/pool/2.webp",
        altDa: "Pool og terrasse",
        altEn: "Pool and terrace",
      },
      {
        src: "/gallery/pool/3.webp",
        altDa: "Pool – detalje",
        altEn: "Pool detail",
      },
    ],
  },
  {
    id: "spa",
    titleDa: "Spa / Hot tub",
    titleEn: "Spa / Hot tub",
    cover: "/gallery/spa/cover.webp",
    items: [
      { src: "/gallery/spa/1.webp", altDa: "Vildmarksbad", altEn: "Hot tub" },
      {
        src: "/gallery/spa/2.webp",
        altDa: "Spa i aftenskumring",
        altEn: "Spa at dusk",
      },
    ],
  },
  {
    id: "sauna",
    titleDa: "Sauna",
    titleEn: "Sauna",
    cover: "/gallery/sauna/cover.webp",
    items: [
      {
        src: "/gallery/sauna/1.webp",
        altDa: "Sauna – interiør",
        altEn: "Sauna interior",
      },
      {
        src: "/gallery/sauna/2.webp",
        altDa: "Sauna – detalje",
        altEn: "Sauna detail",
      },
    ],
  },
  {
    id: "aktivitetsrum",
    titleDa: "Aktivitetsrum",
    titleEn: "Activity room",
    cover: "/gallery/aktivitetsrum/cover.webp",
    items: [
      {
        src: "/gallery/aktivitetsrum/1.webp",
        altDa: "Aktivitetsrum",
        altEn: "Activity room",
      },
      {
        src: "/gallery/aktivitetsrum/2.webp",
        altDa: "Spil og hygge",
        altEn: "Games & fun",
      },
    ],
  },
] as const;

/** Hjælpere – brugbare til UI’et */
export function getAlbum(id: AlbumId): GalleryAlbum | undefined {
  return GALLERY_ALBUMS.find((a) => a.id === id);
}

export function albumCover(a: GalleryAlbum): string | undefined {
  return a.cover || a.items[0]?.src;
}

export function albumSummaries(lang: Lang) {
  return GALLERY_ALBUMS.map((a) => ({
    id: a.id,
    title: lang === "da" ? a.titleDa : a.titleEn,
    cover: albumCover(a),
    count: a.items.length,
  }));
}

export type GalleryItemInput = {
  src: string;
  full: string;
  altDa?: string;
  altEn?: string;
};

export function galleryItemsFromAlbum(id: AlbumId): GalleryItemInput[] {
  const a = getAlbum(id);
  if (!a) return [];
  return a.items.map((it) => ({
    src: it.src,
    full: it.full ?? it.src,
    altDa: it.altDa,
    altEn: it.altEn,
  }));
}
