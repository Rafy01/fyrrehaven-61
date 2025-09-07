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
    // cover kan være samme som eneste billede
    cover: "/gallery/plantegning/floorplan.webp",
    items: [
      {
        src: "/gallery/plantegning/floorplan.webp",
        altDa: "Plantegning",
        altEn: "Floor plan",
      },
    ],
  },
  {
    id: "indoor",
    titleDa: "Indendørs",
    titleEn: "Indoor",
    cover: "/gallery/indoor/cover.webp",
    items: [
      {
        src: "/gallery/indoor/1.webp",
        altDa: "Stue med lysindfald",
        altEn: "Living room with daylight",
      },
      {
        src: "/gallery/indoor/2.webp",
        altDa: "Køkken-alrum",
        altEn: "Kitchen / dining",
      },
      { src: "/gallery/indoor/3.webp", altDa: "Soveværelse", altEn: "Bedroom" },
      // ... tilføj flere
    ],
  },
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
      // ...
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
      // ...
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
      // ...
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
      // ...
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

// Konverter et album til input til din eksisterende <Gallery/>
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
