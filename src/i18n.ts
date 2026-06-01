import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  da: {
    common: {
      brand: "Fyrrehaven 61",
      bookNow: "Book via Airbnb",
      sleepsX: "Plads til {{count}} personer",
    },
    home: {
      heroTitle: "Familievenligt sommerhus i skoven – tæt på stranden",
      heroSubtitle: "Indendørs pool, vildmarksbad og plads til hele familien.",
      ctaSeeHouse_da: "Se huset",
      ctaSeeHouse_en: "See the house",

      badgePool: "Indendørs pool",
      badgeHotTub: "Vildmarksbad",
      badgeBeach: "Tæt på strand",

      altKitchen: "Lyst køkken-alrum",
      altPool: "Indendørs pool",
      altHotTub: "Vildmarksbad i haven",
      altBeach: "Stranden ved Fjellerup",

      whyFamiliesTitle: "Hvorfor familier elsker Fyrrehaven 61",
      whyFamiliesSub:
        "Alt hvad I har brug for til en hyggelig ferie – med naturen lige udenfor.",
      featSleeps:
        "Plads til {{count}} personer (sengefordeling og børneudstyr)",
      featPool: "Badeland året rundt: opvarmet indendørs pool",
      featHotTub: "Afslapning i vildmarksbadet under trætoppene",
      featBeach: "Kort gåtur til strand og iskiosk",
      featForest: "Skovområde med legepladser og stier",
      featKids: "Højstol, weekendseng og familiespil",
      featWifi: "Hurtigt Wi-Fi til streaming og arbejde",
      featParking: "Gratis parkering ved huset",

      reviewsTitle: "Gæsteanmeldelser",
      reviewsSub: "Vi linker til Airbnb for alle anmeldelser.",
      quote1: "Perfekt til børnefamilier – poolen var et hit!",
      quote2: "Roligt område, tæt på strand og skov.",
      quote3: "Rent, lyst og nemt at booke.",
      seeMoreOnAirbnb: "Se flere på Airbnb",

      mapTitle: "Fyrrehaven 61 på kortet",
      readyTitle: "Klar til at booke?",
      readySub: "Tjek ledige datoer og priser på Airbnb.",
    },
  },
  en: {
    common: {
      brand: "Fyrrehaven 61",
      bookNow: "Book on Airbnb",
      sleepsX: "Sleeps {{count}} guests",
    },
    home: {
      heroTitle: "Family-friendly holiday home in the woods – near the beach",
      heroSubtitle: "Indoor pool, hot tub, and room for everyone.",
      ctaSeeHouse_da: "Se huset",
      ctaSeeHouse_en: "See the house",

      badgePool: "Indoor pool",
      badgeHotTub: "Hot tub",
      badgeBeach: "Near the beach",

      altKitchen: "Bright kitchen-living area",
      altPool: "Indoor pool",
      altHotTub: "Outdoor hot tub",
      altBeach: "Fjellerup beach",

      whyFamiliesTitle: "Why families love Fyrrehaven 61",
      whyFamiliesSub:
        "Everything you need for a cosy getaway — nature right outside.",
      featSleeps: "Sleeps {{count}} (bed layout & family gear)",
      featPool: "Year-round fun: heated indoor pool",
      featHotTub: "Relaxing hot tub under the pines",
      featBeach: "Short walk to the beach & ice cream shop",
      featForest: "Woodland area with playgrounds and trails",
      featKids: "High chair, travel cot and family games",
      featWifi: "Fast Wi-Fi for streaming and work",
      featParking: "Free parking at the house",

      reviewsTitle: "Guest reviews",
      reviewsSub: "We link to Airbnb for all reviews.",
      quote1: "Perfect for kids — they loved the pool!",
      quote2: "Quiet area close to beach and forest.",
      quote3: "Bright, clean and easy to book.",
      seeMoreOnAirbnb: "See more on Airbnb",

      mapTitle: "Fyrrehaven 61 on the map",
      readyTitle: "Ready to book?",
      readySub: "Check availability and pricing on Airbnb.",
    },
  },
  de: {
    common: {
      brand: "Fyrrehaven 61",
      bookNow: "Auf Airbnb buchen",
      sleepsX: "Platz für {{count}} Gäste",
    },
    home: {
      heroTitle: "Familienfreundliches Ferienhaus im Wald – in der Nähe des Strandes",
      heroSubtitle: "Hallenbad, Whirlpool und Platz für die ganze Familie.",
      ctaSeeHouse_da: "Se huset",
      ctaSeeHouse_en: "See the house",

      badgePool: "Hallenbad",
      badgeHotTub: "Whirlpool",
      badgeBeach: "In Strandnähe",

      altKitchen: "Helle Wohnküche",
      altPool: "Hallenbad",
      altHotTub: "Whirlpool im Garten",
      altBeach: "Strand bei Fjellerup",

      whyFamiliesTitle: "Warum Familien Fyrrehaven 61 lieben",
      whyFamiliesSub:
        "Alles was Sie für einen gemütlichen Urlaub brauchen – mit der Natur direkt vor der Tür.",
      featSleeps:
        "Platz für {{count}} Gäste (Bettaufteilung und Familienausstattung)",
      featPool: "Wasserspaß das ganze Jahr: beheiztes Hallenbad",
      featHotTub: "Entspannung im Whirlpool unter den Kiefern",
      featBeach: "Kurzer Spaziergang zum Strand und zur Eisdiele",
      featForest: "Waldgebiet mit Spielplätzen und Wanderwegen",
      featKids: "Hochstuhl, Reisebett und Familienbrettspiele",
      featWifi: "Schnelles Wi-Fi zum Streaming und Arbeiten",
      featParking: "Kostenlose Parkplätze am Haus",

      reviewsTitle: "Bewertungen von Gästen",
      reviewsSub: "Wir verlinken auf Airbnb für alle Bewertungen.",
      quote1: "Perfekt für Kinder – sie liebten das Pool!",
      quote2: "Ruhige Gegend nah an Strand und Wald.",
      quote3: "Sauber, hell und leicht zu buchen.",
      seeMoreOnAirbnb: "Mehr auf Airbnb sehen",

      mapTitle: "Fyrrehaven 61 auf der Karte",
      readyTitle: "Bereit zu buchen?",
      readySub: "Verfügbarkeit und Preise auf Airbnb ansehen.",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "da",
  fallbackLng: "da",
  ns: ["common", "home"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
