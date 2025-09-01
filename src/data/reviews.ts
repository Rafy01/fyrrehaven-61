// Bilinguale reviews (samme review har både dansk og engelsk tekst)
export type ReviewItem = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  author: string;
  date: string; // ISO: "YYYY-MM-DD"
  textDa: string;
  textEn: string;
  source?: "airbnb" | "google" | "direct";
  listingUrl?: string;
};

export const reviews: ReviewItem[] = [
  {
    id: "r1",
    rating: 5,
    author: "Lise",
    date: "2025-07-28",
    textDa:
      "Super skønt sommerhus! Poolen var et hit for børnene, og vildmarksbadet var perfekt om aftenen. Kort tur til stranden – vi kommer gerne igen.",
    textEn:
      "Lovely holiday home! The pool was a hit with the kids and the hot tub was perfect in the evening. Short trip to the beach — we’d love to come back.",
    source: "airbnb",
  },
  {
    id: "r2",
    rating: 5,
    author: "Michael",
    date: "2025-06-10",
    textDa:
      "Fantastisk ophold – rent, hyggeligt og masser af plads til familien. Indendørs pool og vildmarksbad gjorde selv regnvejrsdage sjove. Kan varmt anbefales.",
    textEn:
      "Great stay — clean, cozy and plenty of space for the family. Indoor pool and hot tub made even rainy days fun. Highly recommended.",
    source: "airbnb",
  },
  {
    id: "r3",
    rating: 4,
    author: "Thomas",
    date: "2025-05-18",
    textDa:
      "Rolig beliggenhed tæt på skovstier. Godt udstyret køkken og gode senge. Hurtig, tydelig kommunikation fra værten.",
    textEn:
      "Quiet location close to forest trails. Well-equipped kitchen and comfy beds. Quick and clear communication from the host.",
    source: "airbnb",
  },
  {
    id: "r4",
    rating: 4,
    author: "Thomas",
    date: "2025-05-18",
    textDa:
      "Rolig beliggenhed tæt på skovstier. Godt udstyret køkken og gode senge. Hurtig, tydelig kommunikation fra værten.",
    textEn:
      "Quiet location close to forest trails. Well-equipped kitchen and comfy beds. Quick and clear communication from the host.",
    source: "airbnb",
  },
  {
    id: "r5",
    rating: 4,
    author: "Thomas",
    date: "2025-05-18",
    textDa:
      "Rolig beliggenhed tæt på skovstier. Godt udstyret køkken og gode senge. Hurtig, tydelig kommunikation fra værten.",
    textEn:
      "Quiet location close to forest trails. Well-equipped kitchen and comfy beds. Quick and clear communication from the host.",
    source: "airbnb",
  },
  {
    id: "r6",
    rating: 4,
    author: "Thomas",
    date: "2025-05-18",
    textDa:
      "Rolig beliggenhed tæt på skovstier. Godt udstyret køkken og gode senge. Hurtig, tydelig kommunikation fra værten.",
    textEn:
      "Quiet location close to forest trails. Well-equipped kitchen and comfy beds. Quick and clear communication from the host.",
    source: "airbnb",
  },
  {
    id: "r7",
    rating: 4,
    author: "Thomas",
    date: "2025-05-18",
    textDa:
      "Rolig beliggenhed tæt på skovstier. Godt udstyret køkken og gode senge. Hurtig, tydelig kommunikation fra værten.",
    textEn:
      "Quiet location close to forest trails. Well-equipped kitchen and comfy beds. Quick and clear communication from the host.",
    source: "airbnb",
  },
];
