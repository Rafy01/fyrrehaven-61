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
    book: {
      seo: {
        title: "Booking hos Fyrrehaven 61 – direkte forespørgsel",
        description:
          "Book direkte hos værterne eller via Airbnb. Udendørs opvarmet pool (1. maj–1. okt.), plads til 10 og familievenligt nær skov og strand. Vi svarer typisk inden for 1 time. El 4 kr./kWh og vand 80 kr./m³ afregnes efter opholdet.",
        keywords: [
          "booking sommerhus",
          "Fyrrehaven 61 booking",
          "sommerhus Fjellerup",
          "udendørs opvarmet pool",
          "vildmarksbad",
          "sauna",
          "familievenligt sommerhus",
          "book direkte",
          "Airbnb Fjellerup",
          "Djursland feriehus",
        ],
      },
      hero: {
        title: "Booking",
        subtitle:
          "Forespørg direkte hos os – eller book via Airbnb, hvis du foretrækker det.",
        badges: {
          pool: "Opvarmet udendørs pool (1/5–1/10)",
          guests: "Plads til 10 gæster",
          family: "Familievenligt",
        },
        airbnbCta: "Booking Airbnb",
        imageAlt: "Booking af feriehus ved Fjellerup",
      },
      intro: {
        title: "Hvordan vil du booke?",
        body:
          "Du kan enten sende os en direkte forespørgsel via formularen nedenfor, eller du kan booke via Airbnb, hvis du foretrækker det. Vi svarer normalt inden for 1 time.",
        noteTitle: "Praktisk",
        notePool:
          "Udendørs pool er opvarmet ca. 29 °C og åben 1. maj – 1. oktober. Maks. 10 personer. Ingen fester.",
        noteUtilities:
          "El: 4 kr./kWh, vand: 80 kr./m³ (afregnes efter opholdet).",
      },
      process: {
        title: "Sådan foregår en booking",
        lead:
          "Det er en forespørgsel – ikke en øjeblikkelig reservation. Vi vender hurtigt tilbage med enten lejekontrakt eller et venligt afslag.",
        aria: "Bookingproces",
        steps: {
          request: {
            title: "Send forespørgsel",
            body: "Vælg ønskede datoer i kalenderen og udfyld formularen nedenfor.",
          },
          review: {
            title: "Vi gennemgår din forespørgsel",
            bodyIntro:
              "Vi tjekker tilgængelighed, antal gæster og formål med opholdet.",
            bodyRules:
              "Husregler: ingen fester og ingen rene ungdomsgrupper under {{minAge}} år. Max {{maxGuests}} personer.",
          },
          reply: {
            title: "Svar fra os (typisk inden for {{responseHours}} timer)",
            bodyIntro:
              "Du modtager svar fra os (typisk inden for {{responseHours}} timer).",
            bodyDetails:
              "Er alt i orden, sender vi en lejekontrakt med pris og praktisk info. Passer datoerne ikke – eller bryder forespørgslen husreglerne – foreslår vi alternativer eller afviser venligt.",
          },
          confirm: {
            title: "Du underskriver – vi bekræfter",
            bodyIntro:
              "Bookingen er først endeligt bekræftet, når lejekontrakten er underskrevet og de aftalte betalinger er modtaget.",
            bodyDetails:
              "Herefter får du velkomstmail med nøgleinfo, adresse og ankomstvejledning.",
          },
        },
        note: {
          label: "Husregler kort:",
          text:
            "ingen fester, ingen rene ungdomsgrupper under {{minAge}} år, og vis hensyn til naboerne. Max {{maxGuests}} gæster.",
          readMore: "Læs mere her:",
          fees: "gebyroversigt",
          privacy: "privatlivspolitik",
        },
      },
    },
    area: {
      attractions: {
        "djurs-sommerland": {
          title: "Djurs Sommerland",
          description:
            "Nordens største sommerland med 60+ forlystelser og vandland.",
        },
        "legerevet-grenaa": {
          title: "Lege-revet (Grenaa) – legeland",
          description:
            "Indendørs legeland: klatrebaner, rutsjebaner og boldbassin.",
        },
        "hermans-hule-grenaa": {
          title: "Hermans Hule (Grenaa) – legeland",
          description:
            "Stort indendørs legeland med rutsjebaner og trampoliner.",
        },
        fjollehaven: {
          title: "Fjollehaven",
          description: "Udendørs legeplads",
        },
        "fjellerup-strand": {
          title: "Fjellerup Strand",
          description: "Bred, børnevenlig sandstrand i cykelafstand.",
        },
        "mols-bjerge": {
          title: "Mols Bjerge Nationalpark",
          description:
            "Kuperet landskab, flotte udsigter og gode vandreruter.",
        },
        "kalo-slotsruin": {
          title: "Kalø Slotsruin",
          description:
            "Ikonisk borgruin i Kalø Vig – tur ad den gamle stenvej.",
        },
        kattegatcentret: {
          title: "Kattegatcentret (Grenaa)",
          description:
            "Akvarium med hajer og sæler – perfekt til blæsende/kolde dage.",
        },
        "randers-regnskov": {
          title: "Randers Regnskov",
          description: "Tropiske kupler med dyr og planter – året rundt.",
        },
        vaffelbageri: {
          title: "Fjellerup Vaffelbageri",
          description: "Berømte vafler ved stranden – sæsonåbent.",
        },
        "vaffelbageri-food": {
          title: "Vaffelbageri - fastfood",
          description: "Is og Fastfood – sæsonåbent.",
        },
        vaffelhuset: {
          title: "Vaffelhuset",
          description: "Hjemmelavet is – sæsonåbent.",
        },
        "brugsen-fjellerup": {
          title: "Brugsen Fjellerup Strand",
          description: "Lokal dagligvarebutik til alt det praktiske.",
        },
        "alt-til-dagen": {
          title: "Alt Til Dagen",
          description: "Lokal dagligvarebutik til alt det praktiske.",
        },
      },
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
    book: {
      seo: {
        title: "Book Fyrrehaven 61 – direct request",
        description:
          "Book directly with the hosts or via Airbnb. Heated outdoor pool (May 1–Oct 1), sleeps 10 and family-friendly near forest and beach. We usually reply within 1 hour. Electricity 4 DKK/kWh and water 80 DKK/m³ are settled after your stay.",
        keywords: [
          "holiday home booking",
          "Fyrrehaven 61 booking",
          "Fjellerup cottage",
          "heated outdoor pool",
          "hot tub",
          "sauna",
          "family friendly rental",
          "book direct",
          "Airbnb Fjellerup",
          "Djursland holiday home",
        ],
      },
      hero: {
        title: "Booking",
        subtitle: "Send a direct request – or book via Airbnb if you prefer.",
        badges: {
          pool: "Heated outdoor pool (May–Oct)",
          guests: "Sleeps 10 guests",
          family: "Family friendly",
        },
        airbnbCta: "Booking Airbnb",
        imageAlt: "Book the holiday home in Fjellerup",
      },
      intro: {
        title: "How would you like to book?",
        body:
          "You can either send us a direct request using the form below, or you can book via Airbnb if you prefer. We usually respond within 1 hour.",
        noteTitle: "Good to know",
        notePool:
          "Outdoor pool heated to ~29 °C and open May 1 – Oct 1. Max 10 guests. No parties.",
        noteUtilities:
          "Electricity: 4 DKK/kWh, water: 80 DKK/m³ (settled after your stay).",
      },
      process: {
        title: "How the booking works",
        lead:
          "It's a request, not an instant reservation. We'll quickly reply with either a rental agreement or a polite decline.",
        aria: "Booking process",
        steps: {
          request: {
            title: "Send a request",
            body: "Pick your dates in the calendar and fill in the form below.",
          },
          review: {
            title: "We review your request",
            bodyIntro:
              "We check availability, party size and the purpose of your stay.",
            bodyRules:
              "House rules: no parties and no youth-only groups under {{minAge}}. Max {{maxGuests}} guests.",
          },
          reply: {
            title: "Our reply (usually within {{responseHours}} hours)",
            bodyIntro:
              "You'll hear back from us (usually within {{responseHours}} hours).",
            bodyDetails:
              "If everything checks out, we send a rental agreement with price and practical info. If the dates don't work—or the request breaks our house rules—we'll suggest alternatives or politely decline.",
          },
          confirm: {
            title: "You sign – we confirm",
            bodyIntro:
              "Your booking is confirmed once the rental agreement is signed and payments are received.",
            bodyDetails:
              "After that you'll receive a welcome email with key info, address and arrival instructions.",
          },
        },
        note: {
          label: "House rules, short:",
          text:
            "no parties, no youth-only groups under {{minAge}}, and please respect the neighbours. Max {{maxGuests}} guests.",
          readMore: "Read more here:",
          fees: "fee list",
          privacy: "privacy policy",
        },
      },
    },
    area: {
      attractions: {
        "djurs-sommerland": {
          title: "Djurs Sommerland",
          description:
            "Scandinavia’s largest amusement park with 60+ rides and water park.",
        },
        "legerevet-grenaa": {
          title: "Lege-revet (Grenaa) – indoor playland",
          description: "Indoor playland: climbing frames, slides and ball pit.",
        },
        "hermans-hule-grenaa": {
          title: "Hermans Hule (Grenaa) – indoor playland",
          description: "Large indoor playland with slides and trampolines.",
        },
        fjollehaven: {
          title: "Fjollehaven",
          description: "Large outdoor playland",
        },
        "fjellerup-strand": {
          title: "Fjellerup Beach",
          description:
            "Wide, family-friendly sandy beach within biking distance.",
        },
        "mols-bjerge": {
          title: "Mols Bjerge National Park",
          description: "Hilly landscapes, great viewpoints and hiking trails.",
        },
        "kalo-slotsruin": {
          title: "Kalø Castle Ruin",
          description:
            "Iconic castle ruin in Kalø Bay – scenic walk on the old stone road.",
        },
        kattegatcentret: {
          title: "Kattegat Centre (Grenaa)",
          description:
            "Aquarium with sharks and seals – perfect for windy/chilly days.",
        },
        "randers-regnskov": {
          title: "Randers Rainforest",
          description: "Tropical domes with animals and plants – year-round.",
        },
        vaffelbageri: {
          title: "Fjellerup Waffle Bakery",
          description: "Famous waffles by the beach – seasonal opening.",
        },
        "vaffelbageri-food": {
          title: "Fjellerup Waffle Bakery - fast food",
          description: "Ice cream and fast food – seasonal opening.",
        },
        vaffelhuset: {
          title: "Vaffelhuset",
          description: "Homemade ice cream – seasonal opening.",
        },
        "brugsen-fjellerup": {
          title: "Brugsen Fjellerup Strand",
          description: "Local grocery store for everyday shopping.",
        },
        "alt-til-dagen": {
          title: "Alt Til Dagen",
          description: "Local grocery store for everyday shopping.",
        },
      },
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
    book: {
      seo: {
        title: "Buchung bei Fyrrehaven 61 – direkte Anfrage",
        description:
          "Buchen Sie direkt bei den Gastgebern oder über Airbnb. Beheizter Außenpool (1. Mai–1. Okt.), Platz für 10 Gäste und familienfreundlich nahe Wald und Strand. Wir antworten normalerweise innerhalb von 1 Stunde. Strom 4 DKK/kWh und Wasser 80 DKK/m³ werden nach dem Aufenthalt abgerechnet.",
        keywords: [
          "Ferienhaus Buchung",
          "Fyrrehaven 61 Buchung",
          "Ferienhaus Fjellerup",
          "beheizter Außenpool",
          "Whirlpool",
          "Sauna",
          "familienfreundliche Unterkunft",
          "direkt buchen",
          "Airbnb Fjellerup",
          "Djursland Ferienhaus",
        ],
      },
      hero: {
        title: "Buchung",
        subtitle:
          "Senden Sie eine direkte Anfrage – oder buchen Sie über Airbnb, wenn Sie das bevorzugen.",
        badges: {
          pool: "Beheizter Außenpool (1.5.–1.10.)",
          guests: "Platz für 10 Gäste",
          family: "Familienfreundlich",
        },
        airbnbCta: "Booking Airbnb",
        imageAlt: "Buchung des Ferienhauses bei Fjellerup",
      },
      intro: {
        title: "Wie möchten Sie buchen?",
        body:
          "Sie können uns entweder eine direkte Anfrage über das Formular unten senden oder über Airbnb buchen, wenn Sie es bevorzugen. Wir antworten normalerweise innerhalb einer Stunde.",
        noteTitle: "Gut zu wissen",
        notePool:
          "Der Außenpool ist auf ca. 29 °C beheizt und vom 1. Mai bis 1. Oktober geöffnet. Max. 10 Gäste. Keine Partys.",
        noteUtilities:
          "Strom: 4 DKK/kWh, Wasser: 80 DKK/m³ (Abrechnung nach dem Aufenthalt).",
      },
      process: {
        title: "So funktioniert die Buchung",
        lead:
          "Es ist eine Anfrage – keine sofortige Reservierung. Wir melden uns schnell mit einem Mietvertrag oder einer freundlichen Absage.",
        aria: "Buchungsprozess",
        steps: {
          request: {
            title: "Anfrage senden",
            body: "Wählen Sie Ihre gewünschten Daten im Kalender und füllen Sie das Formular unten aus.",
          },
          review: {
            title: "Wir prüfen Ihre Anfrage",
            bodyIntro:
              "Wir prüfen Verfügbarkeit, Gästeanzahl und Zweck des Aufenthalts.",
            bodyRules:
              "Hausregeln: keine Partys und keine reinen Jugendgruppen unter {{minAge}} Jahren. Max. {{maxGuests}} Gäste.",
          },
          reply: {
            title: "Antwort von uns (normalerweise innerhalb von {{responseHours}} Stunden)",
            bodyIntro:
              "Sie erhalten eine Antwort von uns (normalerweise innerhalb von {{responseHours}} Stunden).",
            bodyDetails:
              "Wenn alles passt, senden wir einen Mietvertrag mit Preis und praktischen Informationen. Falls die Daten nicht passen oder die Anfrage gegen die Hausregeln verstößt, schlagen wir Alternativen vor oder lehnen freundlich ab.",
          },
          confirm: {
            title: "Sie unterschreiben – wir bestätigen",
            bodyIntro:
              "Die Buchung ist erst endgültig bestätigt, wenn der Mietvertrag unterschrieben ist und die vereinbarten Zahlungen eingegangen sind.",
            bodyDetails:
              "Danach erhalten Sie eine Willkommensmail mit Schlüsselinfos, Adresse und Anreisehinweisen.",
          },
        },
        note: {
          label: "Hausregeln kurz:",
          text:
            "keine Partys, keine reinen Jugendgruppen unter {{minAge}} Jahren und bitte Rücksicht auf die Nachbarn nehmen. Max. {{maxGuests}} Gäste.",
          readMore: "Mehr hier lesen:",
          fees: "Gebührenübersicht",
          privacy: "Datenschutzerklärung",
        },
      },
    },
    area: {
      attractions: {
        "djurs-sommerland": {
          title: "Djurs Sommerland",
          description:
            "Skandinaviens größter Freizeitpark mit über 60 Attraktionen und Wasserpark.",
        },
        "legerevet-grenaa": {
          title: "Lege-revet (Grenaa) – Indoor-Spielparadies",
          description:
            "Indoor-Spielparadies mit Klettergerüsten, Rutschen und Bällebad.",
        },
        "hermans-hule-grenaa": {
          title: "Hermans Hule (Grenaa) – Indoor-Spielparadies",
          description:
            "Großes Indoor-Spielparadies mit Rutschen und Trampolinen.",
        },
        fjollehaven: {
          title: "Fjollehaven",
          description: "Großer Outdoor-Spielplatz",
        },
        "fjellerup-strand": {
          title: "Fjellerup Strand",
          description:
            "Breiter, familienfreundlicher Sandstrand in Fahrradentfernung.",
        },
        "mols-bjerge": {
          title: "Nationalpark Mols Bjerge",
          description:
            "Hügelige Landschaften, schöne Aussichtspunkte und gute Wanderwege.",
        },
        "kalo-slotsruin": {
          title: "Kalø Schlossruine",
          description:
            "Ikonische Burgruine an der Kalø Vig – schöner Spaziergang auf dem alten Steinweg.",
        },
        kattegatcentret: {
          title: "Kattegatcentret (Grenaa)",
          description:
            "Aquarium mit Haien und Robben – perfekt für windige oder kühle Tage.",
        },
        "randers-regnskov": {
          title: "Randers Regnskov",
          description:
            "Tropische Kuppeln mit Tieren und Pflanzen – das ganze Jahr über.",
        },
        vaffelbageri: {
          title: "Fjellerup Vaffelbageri",
          description: "Berühmte Waffeln am Strand – saisonal geöffnet.",
        },
        "vaffelbageri-food": {
          title: "Fjellerup Vaffelbageri - Fastfood",
          description: "Eis und Fastfood – saisonal geöffnet.",
        },
        vaffelhuset: {
          title: "Vaffelhuset",
          description: "Hausgemachtes Eis – saisonal geöffnet.",
        },
        "brugsen-fjellerup": {
          title: "Brugsen Fjellerup Strand",
          description: "Lokaler Lebensmittelmarkt für alles Praktische.",
        },
        "alt-til-dagen": {
          title: "Alt Til Dagen",
          description: "Lokaler Lebensmittelmarkt für alles Praktische.",
        },
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "da",
  fallbackLng: "da",
  ns: ["common", "home", "book", "area"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
