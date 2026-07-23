import type { Lang } from "../lib/lang";

export type AlbumId =
  | "plantegning"
  | "indoor"
  | "activity_room"
  | "pool"
  | "spa"
  | "sauna"
  | "outdoor"
  | "outdoor_night"
  | "area";

export type GalleryDataItem = {
  src: string; // vises i grid
  full?: string; // stor version (fallback = src)
  altDa?: string;
  altEn?: string;
  altDe?: string;
};

export type GalleryAlbum = {
  id: AlbumId;
  titleDa: string;
  titleEn: string;
  cover?: string; // valgfri – falder tilbage til items[0].src
  items: GalleryDataItem[];
};

/* -------------------------------------------------------------------------- */
/*  Hjælpere                                                                  */
/* -------------------------------------------------------------------------- */

const BASE = "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09";
const u = (file: string) => `${BASE}/${file}`;

// Replace this with the final media URL when the activity room photo is ready.
export const ACTIVITY_ROOM_IMAGE_URL = "/activity-room-image-needed.webp";

/** Få et album efter id */
export function getAlbum(id: AlbumId): GalleryAlbum | undefined {
  return GALLERY_ALBUMS.find((a) => a.id === id);
}

/** Vælg cover (album.cover eller første billede) */
export function albumCover(a: GalleryAlbum): string | undefined {
  return a.cover || a.items[0]?.src;
}

/** Liste til “mappetiles”: titel + cover + antal billeder */
export function albumSummaries(lang: Lang) {
  return GALLERY_ALBUMS.map((a) => ({
    id: a.id,
    title: lang === "da" ? a.titleDa : a.titleEn,
    cover: albumCover(a),
    count: a.items.length,
  }));
}

/** Konverter et album til input til din eksisterende <Gallery/> */
export type GalleryItemInput = {
  src: string;
  full: string;
  altDa?: string;
  altEn?: string;
  altDe?: string;
};
export function galleryItemsFromAlbum(id: AlbumId): GalleryItemInput[] {
  const a = getAlbum(id);
  if (!a) return [];
  return a.items.map((it) => ({
    src: it.src,
    full: it.full ?? it.src,
    altDa: it.altDa,
    altEn: it.altEn,
    altDe: it.altDe,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Albums (mapper)                                                           */
/* -------------------------------------------------------------------------- */

export const GALLERY_ALBUMS: GalleryAlbum[] = [
  /* -------------------------------- Plantegning ------------------------------- */
  {
    id: "plantegning",
    titleDa: "Plantegning",
    titleEn: "Floor plan",
    cover: u("plantegning-scaled.webp"),
    items: [
      {
        src: u("plantegning-scaled.webp"),
        altDa: "Plantegning – Fyrrehaven 61 ved Fjellerup Strand",
        altEn: "Floor plan – Fyrrehaven 61 by Fjellerup Beach",
      },
    ],
  },

  /* --------------------------------- Indoor ---------------------------------- */
  {
    id: "indoor",
    titleDa: "Indendørs",
    titleEn: "Indoor",
    cover: u("IMG_3665.webp"), // dit valgte cover
    items: [
      {
        src: u("IMG_3664.webp"),
        altDa: "Kaffe- og morgenmadsstation i køkkenet – Fyrrehaven 61",
        altEn: "Coffee and breakfast counter in the kitchen – Fyrrehaven 61",
      },
      {
        src: u("IMG_3665.webp"),
        altDa: "Lyst køkken-alrum med udsigt til terrassen – Fjellerup",
        altEn: "Bright kitchen-dining space with terrace view – Fjellerup",
      },
      {
        src: u("IMG_3666.webp"),
        altDa: "Badeværelse med vaskesøjle og god opbevaring",
        altEn: "Bathroom with washer–dryer and generous storage",
      },
      {
        src: u("IMG_3667.webp"),
        altDa: "Badeværelse – bruseområde i modern skandinavisk stil",
        altEn: "Bathroom – shower area in modern Nordic style",
      },
      {
        src: u("IMG_3668.webp"),
        altDa: "Entre og gangzone med adgang til værelser",
        altEn: "Hallway area with access to bedrooms",
      },
      {
        src: u("IMG_3669.webp"),
        altDa: "Soveværelse med dobbeltseng – rolig stemning",
        altEn: "Bedroom with double bed – calm ambience",
      },
      {
        src: u("IMG_3670.webp"),
        altDa: "Soveværelse – dobbeltseng og lysindfald",
        altEn: "Bedroom – double bed and natural light",
      },
      {
        src: u("IMG_3671.webp"),
        altDa: "Soveværelse med udgang til terrasse, skriveplads og monitor",
        altEn:
          "Bedroom with terrace access, fold-down desk and external monitor",
      },
      {
        src: u("IMG_3672.webp"),
        altDa: "Køkken-alrum – kogeø og spiseplads",
        altEn: "Kitchen-dining – island and family table",
      },
      {
        src: u("IMG_3673.webp"),
        altDa: "Opholdsrum med store vinduer og lys",
        altEn: "Living space with large windows and daylight",
      },
      {
        src: u("IMG_3674.webp"),
        altDa: "Gang med kig mod terrassen og haven",
        altEn: "Corridor with view towards terrace and garden",
      },
      {
        src: u("IMG_3675.webp"),
        altDa: "Badeværelse med stor håndvask og bruseområde",
        altEn: "Bathroom with large sink and walk-in shower",
      },
      {
        src: u("IMG_3676.webp"),
        altDa: "Badeværelse – bruser og toilet",
        altEn: "Bathroom – shower and toilet",
      },
      {
        src: u("IMG_3677.webp"),
        altDa: "Soveværelse med dobbeltseng – hyggelig indretning",
        altEn: "Bedroom with double bed – cosy interior",
      },
      {
        src: u("IMG_3678.webp"),
        altDa: "Soveværelse – dobbeltseng og vindueskarnap",
        altEn: "Bedroom – double bed and window nook",
      },
      {
        src: u("IMG_3679.webp"),
        altDa: "Soveværelse med udgangsdør til terrasseområdet",
        altEn: "Bedroom with door opening to the terrace area",
      },
      {
        src: u("IMG_3680.webp"),
        altDa: "Soveværelse – rolig placering og god opbevaring",
        altEn: "Bedroom – quiet location with good storage",
      },
      {
        src: u("IMG_3681.webp"),
        altDa: "Gangforløb med adgang til værelser og bad",
        altEn: "Hallway leading to bedrooms and bathroom",
      },
      {
        src: u("IMG_3682.webp"),
        altDa: "Badeværelse – bruser og vask i lyse materialer",
        altEn: "Bathroom – shower and sink in light materials",
      },
      {
        src: u("IMG_3683.webp"),
        altDa: "Bryggers/teknik med vaskesøjle og skabe",
        altEn: "Utility room with washer–dryer and cabinets",
      },
      {
        src: u("IMG_3684.webp"),
        altDa: "Badeværelse med vaskesøjle – praktisk til familier",
        altEn: "Bathroom with washer-dryer – practical for families",
      },
      {
        src: u("IMG_3685.webp"),
        altDa: "Køkken-alrum – udsigt mod stue og terrasse",
        altEn: "Kitchen-dining – sightline to living room and terrace",
      },
      {
        src: u("IMG_3686.webp"),
        altDa: "Kaffestation tæt ved køkken – klar til slow mornings",
        altEn: "Coffee nook by the kitchen – perfect for slow mornings",
      },
    ],
  },

  /* ------------------------------- Activity room ----------------------------- */
  {
    id: "activity_room",
    titleDa: "Aktivitetsrum",
    titleEn: "Activity room",
    cover: ACTIVITY_ROOM_IMAGE_URL,
    items: [
      {
        src: ACTIVITY_ROOM_IMAGE_URL,
        altDa:
          "Aktivitetsrum med billard, bordtennis, airhockey, dart og projektor",
        altEn:
          "Activity room with billiards, table tennis, air hockey, darts and projector",
        altDe:
          "Aktivitätsraum mit Billard, Tischtennis, Airhockey, Darts und Projektor",
      },
    ],
  },

  /* ----------------------------------- Pool ---------------------------------- */
  {
    id: "pool",
    titleDa: "Pool",
    titleEn: "Pool",
    cover: u("IMG_3721.webp"),
    items: [
      {
        src: u("IMG_3692.webp"),
        altDa: "Poolhus og overdækning – Fyrrehaven 61",
        altEn: "Pool enclosure and terrace – Fyrrehaven 61",
        altDe: "Poolüberdachung und Terrasse – Fyrrehaven 61",
      },
      {
        src: u("IMG_3693.webp"),
        altDa: "Skydetag over den opvarmede udendørs pool",
        altEn: "Sliding cover over the heated outdoor pool",
        altDe: "Schiebeüberdachung über dem beheizten Außenpool",
      },
      {
        src: u("IMG_3697.webp"),
        altDa: "Poolområde på flisebelagt terrasse – familievenligt",
        altEn: "Pool area on tiled terrace – family friendly",
        altDe: "Poolbereich auf gefliester Terrasse – familienfreundlich",
      },
      {
        src: u("IMG_3708.webp"),
        altDa: "Pool med transparent overdækning – udsigt til huset",
        altEn: "Pool with clear enclosure – view towards the house",
        altDe: "Pool mit transparenter Überdachung – Blick zum Haus",
      },
      {
        src: u("IMG_3716.webp"),
        altDa: "Pool og stor terrasse – god plads til liggestole",
        altEn: "Pool and large terrace – room for sun loungers",
        altDe: "Pool und große Terrasse – viel Platz für Sonnenliegen",
      },
      {
        src: u("IMG_3718.webp"),
        altDa: "Pool med skydetag delvist åben – læ for vinden",
        altEn: "Pool with sliding roof partly open – sheltered from wind",
        altDe: "Pool mit teilweise geöffneter Schiebeüberdachung – windgeschützt",
      },
      {
        src: u("IMG_3719.webp"),
        altDa: "Pooloverdækning trukket frem – bad i alt slags vejr",
        altEn: "Pool cover pulled forward – swim in any weather",
        altDe: "Poolüberdachung vorgezogen – Baden bei jedem Wetter",
      },
      {
        src: u("IMG_3720.webp"),
        altDa: "Pool og terrasse med plankeværk – privat uderum",
        altEn: "Pool and terrace with fence – private outdoor space",
        altDe: "Pool und Terrasse mit Zaun – privater Außenbereich",
      },
      {
        src: u("IMG_3721.webp"),
        altDa: "Opvarmet pool ved Fyrrehaven 61 – sommerstemning",
        altEn: "Heated pool at Fyrrehaven 61 – summer vibes",
        altDe: "Beheizter Pool bei Fyrrehaven 61 – Sommerstimmung",
      },
      {
        src: u("IMG_3722.webp"),
        altDa: "Poolhjørne med trin og sikker kant",
        altEn: "Pool corner with steps and safe edging",
        altDe: "Poolecke mit Stufen und sicherem Rand",
      },
    ],
  },

  /* ------------------------------------ Spa ---------------------------------- */
  {
    id: "spa",
    titleDa: "Spa / Hot tub",
    titleEn: "Spa / Hot tub",
    cover: u("IMG_3713.webp"),
    items: [
      {
        src: u("IMG_3696.webp"),
        altDa: "Udendørs vildmarksbad på terrassen – Fyrrehaven 61",
        altEn: "Outdoor hot tub on the terrace – Fyrrehaven 61",
      },
      {
        src: u("IMG_3710.webp"),
        altDa: "Vildmarksbad med udsigt til haven",
        altEn: "Hot tub with garden outlook",
      },
      {
        src: u("IMG_3712.webp"),
        altDa: "Spa – tæt på poolen og opholdszonen",
        altEn: "Hot tub – near the pool and lounge area",
      },
      {
        src: u("IMG_3713.webp"),
        altDa: "Vildmarksbad – afslapning efter en dag på stranden",
        altEn: "Hot tub – unwind after a day at the beach",
      },
      {
        src: u("IMG_3714.webp"),
        altDa: "Spa i aftensolen – stemningsfuld belysning",
        altEn: "Hot tub in the evening sun – atmospheric lighting",
      },
      {
        src: u("IMG_3715.webp"),
        altDa: "Vildmarksbad – hyggeligt uderum hele året",
        altEn: "Hot tub – cosy outdoor wellness all year",
      },
    ],
  },

  /* ----------------------------------- Sauna --------------------------------- */
  {
    id: "sauna",
    titleDa: "Sauna",
    titleEn: "Sauna",
    cover: u("IMG_3731.webp"),
    items: [
      {
        src: u("IMG_3731.webp"),
        altDa: "Sauna – afslapning og varme efter strandtur",
        altEn: "Sauna – warm up and relax after the beach",
      },
      {
        src: u("IMG_3732.webp"),
        altDa: "Sauna med glasdør – lys og indbydende",
        altEn: "Sauna with glass door – bright and inviting",
      },
      {
        src: u("IMG_3711.webp"),
        altDa: "Saunaområde tæt ved bad og bruser",
        altEn: "Sauna area close to shower and bath",
      },
      {
        src: u("IMG_3709.webp"),
        altDa: "Detalje fra sauna/udebad – naturlige materialer",
        altEn: "Detail from sauna/outdoor bath – natural materials",
      },
    ],
  },

  /* --------------------------------- Outdoor --------------------------------- */
  {
    id: "outdoor",
    titleDa: "Udendørs",
    titleEn: "Outdoor",
    cover: u("IMG_3730.webp"),
    items: [
      {
        src: u("IMG_3730.webp"),
        altDa: "Sti og terrasse ved Fyrrehaven 61 – vedligeholdt uderum",
        altEn: "Path and terrace at Fyrrehaven 61 – well-kept outdoors",
      },
      {
        src: u("IMG_3731.webp"),
        altDa: "Facade og uderum – moderne sort træhus",
        altEn: "Facade and outdoor area – modern black timber house",
      },
      {
        src: u("IMG_3733.webp"),
        altDa: "Have og terrasse med god plads til leg",
        altEn: "Garden and terrace with room to play",
      },
      {
        src: u("IMG_3734.webp"),
        altDa: "Flisegang og opholdszone i solen",
        altEn: "Paved walkway and sunny seating spot",
      },
      {
        src: u("IMG_3735.webp"),
        altDa: "Husets indkørsel og belægning – nem parkering",
        altEn: "Driveway and paving – easy parking",
      },
      {
        src: u("IMG_3736.webp"),
        altDa: "Sti mod huset omgivet af natur",
        altEn: "Path towards the house surrounded by nature",
      },
      {
        src: u("IMG_3737.webp"),
        altDa: "Terrassemiljø – læ og aftensol",
        altEn: "Terrace setting – shelter and evening sun",
      },
      {
        src: u("IMG_3738.webp"),
        altDa: "Udeareal med bord/bænke – hyggelige måltider",
        altEn: "Outdoor area with bench/table – cosy meals outside",
      },
      {
        src: u("IMG_3728.webp"),
        altDa: "Flisebelagt sti rundt om huset – nem adgang",
        altEn: "Paved path around the house – easy access",
      },
      {
        src: u("IMG_3727.webp"),
        altDa: "Have og fliser – lav vedligeholdelse",
        altEn: "Garden and paving – low maintenance",
      },
      {
        src: u("IMG_3726.webp"),
        altDa: "Overdækning og læ – komfort udendørs",
        altEn: "Covered outdoor section – comfortable in any weather",
      },
      {
        src: u("IMG_3725.webp"),
        altDa: "Facadedetalje ved indgangsparti",
        altEn: "Facade detail by the entrance",
      },
      {
        src: u("IMG_3724.webp"),
        altDa: "Sti og grønt område ved huset",
        altEn: "Path and green area by the house",
      },
      {
        src: u("IMG_3723.webp"),
        altDa: "Havens hjørne – grønt og indbydende",
        altEn: "Garden corner – green and inviting",
      },
      {
        src: u("IMG_3707.webp"),
        altDa: "Overblik over tag og overdækning",
        altEn: "Overview of roof and enclosure",
      },
      {
        src: u("IMG_3706.webp"),
        altDa: "Sti i haven med grøn beplantning",
        altEn: "Garden path with lush planting",
      },
      {
        src: u("IMG_3705.webp"),
        altDa: "Terrasse med kig til naturen",
        altEn: "Terrace with a view to nature",
      },
      {
        src: u("IMG_3704.webp"),
        altDa: "Græs og beplantning langs stien",
        altEn: "Grass and planting along the path",
      },
      {
        src: u("IMG_3703.webp"),
        altDa: "Hus og have – pæn og funktionel belægning",
        altEn: "House and garden – neat, functional paving",
      },
      {
        src: u("IMG_3702.webp"),
        altDa: "Sti omkring huset – praktisk adgang",
        altEn: "Path around the house – practical access",
      },
      {
        src: u("IMG_3701.webp"),
        altDa: "Udeareal med udsigt til trætoppe",
        altEn: "Outdoor area with treetop views",
      },
    ],
  },

  /* ---------------------------- Outdoor (night) ------------------------------- */
  {
    id: "outdoor_night",
    titleDa: "Udendørs – aften",
    titleEn: "Outdoor – night",
    cover: u("IMG_3806.webp"),
    items: [
      {
        src: u("IMG_3799.webp"),
        altDa: "Aftenstemning ved poolen – hyggelig belysning, Fyrrehaven 61",
        altEn: "Evening ambience by the pool – cosy lighting, Fyrrehaven 61",
      },
      {
        src: u("IMG_3802.webp"),
        altDa: "Poolen oplyst i skumringen – Fjellerup Strand",
        altEn: "Pool lit at dusk – Fjellerup Beach",
      },
      {
        src: u("IMG_3803.webp"),
        altDa: "Aftenbad i opvarmet pool – ferie ved Djursland",
        altEn: "Night swim in the heated pool – holiday in Djursland",
      },
      {
        src: u("IMG_3804.webp"),
        altDa: "Pooldæk med lys langs kanten – sikker og stemningsfuld",
        altEn: "Pool deck with edge lights – safe and atmospheric",
      },
      {
        src: u("IMG_3805.webp"),
        altDa: "Poolområde om aftenen – klar til aften-dukkert",
        altEn: "Pool area at night – ready for an evening dip",
      },
      {
        src: u("IMG_3806.webp"),
        altDa: "Pool med blå glød – sommeraften ved Fyrrehaven 61",
        altEn: "Pool with blue glow – summer night at Fyrrehaven 61",
      },
      {
        src: u("IMG_3807.webp"),
        altDa: "Udeområde i tusmørke – rolig feriestemning",
        altEn: "Outdoor area at twilight – relaxed holiday mood",
      },
      {
        src: u("IMG_3808.webp"),
        altDa: "Aftensol over pool og terrasse – Djursland",
        altEn: "Evening sun over pool and terrace – Djursland",
      },
      {
        src: u("IMG_3810.webp"),
        altDa: "Indgang og overdækning oplyst – velkomst i aftenlys",
        altEn: "Entrance and canopy lit up – welcoming evening light",
      },
      {
        src: u("IMG_3811.webp"),
        altDa: "Detalje af belysning og udezone – nattehimmel",
        altEn: "Lighting detail and outdoor zone – night sky",
      },
      {
        src: u("IMG_3812.webp"),
        altDa: "Overdækket område med lys – komfort udendørs",
        altEn: "Covered outdoor section with lights – comfort outdoors",
      },
      {
        src: u("IMG_3813.webp"),
        altDa: "Indgangsparti i aftenskær – Fyrrehaven 61",
        altEn: "Entrance at dusk – Fyrrehaven 61",
      },
      {
        src: u("IMG_3814.webp"),
        altDa: "Oplyst gennemgang – sikkert og indbydende",
        altEn: "Lit walkway – safe and inviting",
      },
      {
        src: u("IMG_3815.webp"),
        altDa: "Udeplads i skumringen – stemningsfuld belysning",
        altEn: "Patio at dusk – atmospheric lighting",
      },
      {
        src: u("IMG_3816.webp"),
        altDa: "Sti og terrasse oplyst om aftenen",
        altEn: "Path and terrace illuminated at night",
      },
      {
        src: u("IMG_3818.webp"),
        altDa: "Pool og terrasse efter solnedgang – Fjellerup",
        altEn: "Pool and terrace after sunset – Fjellerup",
      },
      {
        src: u("IMG_3819.webp"),
        altDa: "Nattestemning ved feriehus – Fyrrehaven 61",
        altEn: "Night ambience at the holiday home – Fyrrehaven 61",
      },
      {
        src: u("IMG_3820.webp"),
        altDa: "Aftenlys over udeområdet – hyggelig afslutning på dagen",
        altEn: "Evening lights across the outdoor area – cosy end to the day",
      },
    ],
  },

  /* ----------------------------------- Area ---------------------------------- */
  {
    id: "area",
    titleDa: "Området (gåafstand)",
    titleEn: "Area (walking distance)",
    cover: u("IMG_3660.webp"),
    items: [
      {
        src: u("IMG_3771.webp"),
        altDa: "Solnedgang ved Fjellerup Strand – gyldent lys over Kattegat",
        altEn: "Sunset at Fjellerup Beach – golden light over the Kattegat",
      },
      {
        src: u("IMG_3772.webp"),
        altDa: "Aftensol ved kysten – klitter og strand i gåafstand",
        altEn:
          "Evening sun by the coast – dunes and beach within walking distance",
      },
      {
        src: u("IMG_3773.webp"),
        altDa: "Bred sandstrand ved Fjellerup – familievenlig kyst",
        altEn: "Wide sandy beach at Fjellerup – family-friendly coast",
      },
      {
        src: u("IMG_3770.webp"),
        altDa: "Kystlinje og blide bølger – Djursland",
        altEn: "Coastline and gentle waves – Djursland",
      },

      {
        src: u("2c0c5a11-59f7-4ddf-9fda-10068650f7a1.webp"),
        altDa: "Skovsti i gåafstand fra Fyrrehaven 61 – Fjellerup",
        altEn:
          "Forest path within walking distance of Fyrrehaven 61 – Fjellerup",
      },
      {
        src: u("IMG_3663.webp"),
        altDa: "Kyst ved Fjellerup Strand – natur tæt på sommerhuset",
        altEn: "Coastline by Fjellerup Beach – nature close to the house",
      },
      {
        src: u("IMG_3662.webp"),
        altDa: "Kystlandskab ved Fjellerup – perfekt til aftenture",
        altEn: "Fjellerup coastal landscape – perfect for evening strolls",
      },
      {
        src: u("IMG_3660.webp"),
        altDa: "Bred sandstrand ved Fjellerup – kort gåtur fra huset",
        altEn: "Wide sandy beach at Fjellerup – a short walk from the house",
      },
      {
        src: u("IMG_3661.webp"),
        altDa: "Havudsigt og horisont – Fjellerup Strand",
        altEn: "Sea view and horizon – Fjellerup Beach",
      },
      {
        src: u("IMG_3659.webp"),
        altDa: "Kyst og sand – familievenlig badestrand",
        altEn: "Coast and sand – family-friendly beach",
      },
      {
        src: u("IMG_3658.webp"),
        altDa: "Rolig sandstrand i gåafstand – Fyrrehaven 61",
        altEn: "Calm sandy beach within walking distance – Fyrrehaven 61",
      },
    ],
  },
];
