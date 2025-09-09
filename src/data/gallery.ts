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
  cover?: string; // hvis ikke sat, bruges items[0].src
  items: GalleryDataItem[];
};

/** Albums (mapper) */
export const GALLERY_ALBUMS: GalleryAlbum[] = [
  /* ——— Plantegning ——— */
  {
    id: "plantegning",
    titleDa: "Plantegning",
    titleEn: "Floor plan",
    // Ret stien her, hvis din floorplan ligger et andet sted
    cover: "/gallery/plantegning.webp",
    items: [
      {
        src: "/gallery/plantegning.webp",
        altDa: "Plantegning over feriehusets indretning",
        altEn: "Floor plan of the holiday home",
      },
    ],
  },

  /* ——— Indoor (dine faktiske filer) ——— */
  {
    id: "indoor",
    titleDa: "Indendørs",
    titleEn: "Indoor",
    cover: "/gallery/indoor/IMG_3665.webp", // dit ønskede cover
    items: [
      {
        src: "/gallery/indoor/IMG_3664.webp",
        altDa: "Indendørs – lys stue med hyggelig indretning",
        altEn: "Indoor – bright living room with cozy decor",
      },
      {
        src: "/gallery/indoor/IMG_3665.webp",
        altDa: "Indendørs – stue og siddeområde",
        altEn: "Indoor – living room seating area",
      },
      {
        src: "/gallery/indoor/IMG_3666.webp",
        altDa: "Indendørs – spiseplads ved køkken",
        altEn: "Indoor – dining setup by the kitchen",
      },
      {
        src: "/gallery/indoor/IMG_3667.webp",
        altDa: "Indendørs – hyggelig krogeniche",
        altEn: "Indoor – comfy nook",
      },
      {
        src: "/gallery/indoor/IMG_3668.webp",
        altDa: "Indendørs – funktionelt køkken",
        altEn: "Indoor – functional kitchen",
      },
      {
        src: "/gallery/indoor/IMG_3669.webp",
        altDa: "Indendørs – roligt soveområde",
        altEn: "Indoor – calm sleeping area",
      },
      {
        src: "/gallery/indoor/IMG_3670.webp",
        altDa: "Indendørs – rummelig opholdsafdeling",
        altEn: "Indoor – spacious common room",
      },
      {
        src: "/gallery/indoor/IMG_3671.webp",
        altDa: "Indendørs – dagslys og udsigt",
        altEn: "Indoor – daylight and view",
      },
      {
        src: "/gallery/indoor/IMG_3672.webp",
        altDa: "Indendørs – interiørdetalje",
        altEn: "Indoor – interior detail",
      },
      {
        src: "/gallery/indoor/IMG_3673.webp",
        altDa: "Indendørs – plads til samvær",
        altEn: "Indoor – space for togetherness",
      },
      {
        src: "/gallery/indoor/IMG_3674.webp",
        altDa: "Indendørs – stue med afslapningshjørne",
        altEn: "Indoor – living room relaxation corner",
      },
      {
        src: "/gallery/indoor/IMG_3675.webp",
        altDa: "Indendørs – spisebord og lamper",
        altEn: "Indoor – dining table and lighting",
      },
      {
        src: "/gallery/indoor/IMG_3676.webp",
        altDa: "Indendørs – hyggelig sofaopstilling",
        altEn: "Indoor – cozy sofa setup",
      },
      {
        src: "/gallery/indoor/IMG_3677.webp",
        altDa: "Indendørs – køkken med gode arbejdsflader",
        altEn: "Indoor – kitchen with practical worktops",
      },
      {
        src: "/gallery/indoor/IMG_3678.webp",
        altDa: "Indendørs – soveværelse med opbevaring",
        altEn: "Indoor – bedroom with storage",
      },
      {
        src: "/gallery/indoor/IMG_3679.webp",
        altDa: "Indendørs – entre og gennemgang",
        altEn: "Indoor – entrance and corridor",
      },
      {
        src: "/gallery/indoor/IMG_3680.webp",
        altDa: "Indendørs – stue med naturlys",
        altEn: "Indoor – living room with natural light",
      },
      {
        src: "/gallery/indoor/IMG_3681.webp",
        altDa: "Indendørs – detalje i indretningen",
        altEn: "Indoor – decorative interior detail",
      },
      {
        src: "/gallery/indoor/IMG_3682.webp",
        altDa: "Indendørs – familievenligt opholdsrum",
        altEn: "Indoor – family-friendly living space",
      },
      {
        src: "/gallery/indoor/IMG_3683.webp",
        altDa: "Indendørs – siddepladser og udsyn",
        altEn: "Indoor – seating with outlook",
      },
      {
        src: "/gallery/indoor/IMG_3684.webp",
        altDa: "Indendørs – moderne køkkenfaciliteter",
        altEn: "Indoor – modern kitchen facilities",
      },
      {
        src: "/gallery/indoor/IMG_3685.webp",
        altDa: "Indendørs – hyggelig stemning i stuen",
        altEn: "Indoor – cozy living ambience",
      },
      {
        src: "/gallery/indoor/IMG_3686.webp",
        altDa: "Indendørs – velindrettet boligmiljø",
        altEn: "Indoor – well-designed interior",
      },
    ],
  },

  /* ——— De øvrige albums (ret stier/indhold efter dine filer) ——— */
  {
    id: "pool",
    titleDa: "Pool",
    titleEn: "Pool",
    cover: "/gallery/pool/cover.webp",
    items: [
      {
        src: "/gallery/pool/1.webp",
        altDa: "Opvarmet udendørs pool ved huset",
        altEn: "Heated outdoor pool by the house",
      },
    ],
  },
  {
    id: "spa",
    titleDa: "Spa / Hot tub",
    titleEn: "Spa / Hot tub",
    cover: "/gallery/spa/cover.webp",
    items: [
      {
        src: "/gallery/spa/1.webp",
        altDa: "Vildmarksbad til afslapning",
        altEn: "Wood-fired hot tub for relaxation",
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
        altDa: "Sauna – lyst træinteriør",
        altEn: "Sauna – light wooden interior",
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
        altDa: "Aktivitetsrum med spil og hygge",
        altEn: "Activity room for games and fun",
      },
    ],
  },
] as const;

/** Hjælpere – brugbare til UI’et */

// Få et album efter id
export function getAlbum(id: AlbumId): GalleryAlbum | undefined {
  return GALLERY_ALBUMS.find((a) => a.id === id);
}

// Vælg cover (album.cover eller første billede)
export function albumCover(a: GalleryAlbum): string | undefined {
  return a.cover || a.items[0]?.src;
}

// Liste til “mappetiles”: titel + cover + antal billeder
export function albumSummaries(lang: Lang) {
  return GALLERY_ALBUMS.map((a) => ({
    id: a.id,
    title: lang === "da" ? a.titleDa : a.titleEn,
    cover: albumCover(a),
    count: a.items.length,
  }));
}

// Konverter et album til input til <Gallery/>
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
