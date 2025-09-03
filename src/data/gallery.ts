// src/data/gallery.ts


export type GalleryDataItem = {
  src: string;
  full?: string;
  altDa?: string;
  altEn?: string;
};

export const GALLERY_DATA: GalleryDataItem[] = [
  {
    src: "/gallery/area-hero.webp",
    altDa: "Stue med lysindfald",
    altEn: "Living room with daylight",
  },
  {
    src: "/gallery/brugsen-fjellerup.webp",
    altDa: "Køkken-alrum",
    altEn: "Kitchen / dining",
  },
  {
    src: "/gallery/djurs-sommerland.webp",
    altDa: "Opvarmet udendørs pool",
    altEn: "Heated outdoor pool",
  },
  {
    src: "/gallery/djurs-sommerland.webp",
    altDa: "Brændefyret vildmarksbad",
    altEn: "Wood-fired hot tub",
  },
  {
    src: "/gallery/5.webp",
    altDa: "El-sauna – plads til 8",
    altEn: "Electric sauna – seats 8",
  },
  { src: "/gallery/6.webp", altDa: "Soveværelse 1", altEn: "Bedroom 1" },
  { src: "/gallery/7.webp", altDa: "Soveværelse 2", altEn: "Bedroom 2" },
  {
    src: "/gallery/8.webp",
    altDa: "Skovsti mod stranden",
    altEn: "Forest path to the beach",
  },
  // ... tilføj flere efter behov
];

export type GalleryItemInput = {
  src: string;
  full: string;
  altDa?: string;
  altEn?: string;
};

/** Hvis du vil have data i komponentens input-format 1:1 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function galleryItems(_lang: "da" | "en"): GalleryItemInput[] {
  return GALLERY_DATA.map((d) => ({
    src: d.src,
    full: d.full ?? d.src,
    altDa: d.altDa,
    altEn: d.altEn,
    // (komponenten vælger selv korrekt alt via lang)
  }));
}
