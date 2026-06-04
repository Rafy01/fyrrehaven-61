// Bilinguale reviews (samme review har både dansk og engelsk tekst)
export type ReviewItem = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  author: string;
  date: string; // ISO: "YYYY-MM-DD"
  textDa: string;
  textEn: string;
  textDe: string;
  source?: "airbnb" | "google" | "direct";
  listingUrl?: string;
};

export const reviews: ReviewItem[] = [
  {
    id: "jana-2025-08",
    rating: 5,
    author: "Jana",
    date: "2025-08-31",
    textDa:
      "Vi følte os meget hjemme i det dejlige hus og blev budt varmt velkommen. Poolen var et highlight for hele familien. Tak for gæstfriheden – vi havde en skøn tid!",
    textEn:
      "We felt very comfortable in the lovely house and were warmly welcomed. The pool was a highlight for the whole family. Thank you for the hospitality — we had a great time!",
    textDe:
      "Wir haben uns in dem schönen Haus sehr wohlgefühlt und wurden herzlich willkommen geheißen. Der Pool war ein Highlight für die ganze Familie. Vielen Dank für die Gastfreundschaft - wir hatten eine wunderbare Zeit!",
    source: "airbnb",
  },
  {
    id: "diana-2025-08",
    rating: 5,
    author: "Diana",
    date: "2025-08-24",
    textDa:
      "Vi var 2 voksne og 4 børn i huset. Alt fungerede super. Vi kan kun anbefale huset.",
    textEn:
      "We stayed as 2 adults and 4 children. Everything was great. We can only recommend the house.",
    textDe:
      "Wir waren mit 2 Erwachsenen und 4 Kindern im Haus. Alles hat super funktioniert. Wir können das Haus nur empfehlen.",
    source: "airbnb",
  },
  {
    id: "nicole-2025-08",
    rating: 5,
    author: "Nicole",
    date: "2025-08-15",
    textDa:
      "Vi havde en vidunderlig ferie. Sauna, pool og spabad gjorde det uforglemmeligt for børnene. Værten var meget venlig, hjælpsom og svarede hurtigt. Klart tommel op.",
    textEn:
      "We had a wonderful holiday. The sauna, pool and hot tub made it unforgettable for the kids. The host was very friendly, helpful and responded quickly. Big thumbs up.",
    textDe:
      "Wir hatten einen wunderbaren Urlaub. Sauna, Pool und Whirlpool haben ihn für die Kinder unvergesslich gemacht. Der Gastgeber war sehr freundlich, hilfsbereit und hat schnell geantwortet. Klare Empfehlung.",
    source: "airbnb",
  },
  {
    id: "franziska-2025-08",
    rating: 5,
    author: "Franziska",
    date: "2025-08-05",
    textDa:
      "Vi var to familier på sommerferie i 10 dage og nød tiden. Huset ligger godt og er veludstyret, ind- og udtjekning var fleksibel og spørgsmål blev besvaret hurtigt. Alt var meget rent. Vejret var skønt, og den opvarmede pool gav stor glæde. Vi kommer gerne igen.",
    textEn:
      "We were two families for a 10-day summer holiday and enjoyed our time. The house is well located and well equipped; check-in/out was flexible and questions were answered quickly. Everything was very clean. The heated pool was a joy. We’d love to return.",
    textDe:
      "Wir waren zwei Familien für einen 10-tägigen Sommerurlaub und haben die Zeit genossen. Das Haus liegt gut und ist sehr gut ausgestattet; Check-in und Check-out waren flexibel und Fragen wurden schnell beantwortet. Alles war sehr sauber. Der beheizte Pool hat viel Freude gemacht. Wir kommen gerne wieder.",
    source: "airbnb",
  },
  {
    id: "therese-2025-07",
    rating: 5,
    author: "Therese",
    date: "2025-07-10",
    textDa:
      "Vi var alle meget tilfredse med pladsen, huset og værtskabet. Kommer gerne tilbage.",
    textEn:
      "We were all very satisfied with the space, the house and the hosts. We’d love to come back.",
    textDe:
      "Wir waren alle sehr zufrieden mit dem Platz, dem Haus und den Gastgebern. Wir kommen gerne wieder.",
    source: "airbnb",
  },
  {
    id: "rune-bergh-2025-06",
    rating: 5,
    author: "Rune Bergh",
    date: "2025-06-18",
    textDa:
      "Fint sommerhus. Praktisk med soveværelserne lidt adskilt fra stue/køkken. Vores 2-årige elskede poolen.",
    textEn:
      "Great summer house. Practical layout with the bedrooms slightly separated from the living room/kitchen. Our two-year-old loved the pool.",
    textDe:
      "Tolles Ferienhaus. Praktische Aufteilung, bei der die Schlafzimmer etwas vom Wohn- und Küchenbereich getrennt sind. Unser Zweijähriger liebte den Pool.",
    source: "airbnb",
  },
  {
    id: "tilman-2025-06",
    rating: 5,
    author: "Tilman",
    date: "2025-06-12",
    textDa:
      "Rigtig godt ophold! Nemt check-in og check-out. Alt var som beskrevet, og vi havde ingen klager.",
    textEn:
      "Great stay! Easy check-in and check-out. Everything was as described and we had no complaints whatsoever.",
    textDe:
      "Sehr guter Aufenthalt! Einfacher Check-in und Check-out. Alles war wie beschrieben und wir hatten keinerlei Beschwerden.",
    source: "airbnb",
  },
  {
    id: "philipp-2025-05",
    rating: 5,
    author: "Philipp",
    date: "2025-05-22",
    textDa:
      "Meget dejligt ophold med familien. Skønt hus med en stor pool — børnenes yndlingssted. Godt udstyr og alt var meget rent og pænt.",
    textEn:
      "Very nice stay with the family. Lovely house with a big pool — the kids’ favourite place. Well equipped and everything was very clean and tidy.",
    textDe:
      "Sehr schöner Aufenthalt mit der Familie. Ein tolles Haus mit großem Pool - der Lieblingsort der Kinder. Gut ausgestattet und alles war sehr sauber und ordentlich.",
    source: "airbnb",
  },
  {
    id: "alex-2025-05",
    rating: 5,
    author: "Alex",
    date: "2025-05-15",
    textDa:
      "Vi var en gruppe på 8 personer. Boligen var meget ren og som på billederne. Værten var hjælpsom og svarede hurtigt. Den opvarmede pool var højdepunktet. Vi kan klart anbefale stedet og kommer gerne igen.",
    textEn:
      "We were a group of 8. The accommodation was very clean and just like the photos. The host was helpful and quick to respond. The heated pool was the highlight. We recommend the place and would gladly return.",
    textDe:
      "Wir waren eine Gruppe von 8 Personen. Die Unterkunft war sehr sauber und genau wie auf den Bildern. Der Gastgeber war hilfsbereit und antwortete schnell. Der beheizte Pool war das Highlight. Wir können den Ort klar empfehlen und kommen gerne wieder.",
    source: "airbnb",
  },
  {
    id: "louise-2025-04",
    rating: 5,
    author: "Louise",
    date: "2025-04-20",
    textDa: "Mega fint sted.",
    textEn: "Lovely place.",
    textDe: "Sehr schöner Ort.",
    source: "airbnb",
  },
  {
    id: "tanya-2025-04",
    rating: 5,
    author: "Tanya",
    date: "2025-04-18",
    textDa:
      "Vi havde en skøn påske hos Rimon. Smukke omgivelser og fredelig gåtur til stranden. Vildmarksbadet var sjovt og tog faktisk ikke så lang tid at fylde og varme. Køleskabet er lidt småt til 10 personer, men vi klarede os. Butik ligger tæt på, og blomsterbutikken i Auning kan anbefales. Et par småting opstod, men værten var let at få fat i og løste dem hurtigt.",
    textEn:
      "We had a great Easter at Rimon’s. Gorgeous surroundings and a peaceful walk to the beach. The hot tub was fun and didn’t actually take that long to fill and heat. The fridge is a bit small for 10 people, but we managed. There’s a store nearby and I can recommend the flower shop in Auning. A couple of small issues came up, but the host was easy to reach and solved them quickly.",
    textDe:
      "Wir hatten schöne Ostertage bei Rimon. Wunderschöne Umgebung und ein ruhiger Spaziergang zum Strand. Der Whirlpool hat Spaß gemacht und es dauerte tatsächlich nicht lange, ihn zu füllen und aufzuheizen. Der Kühlschrank ist für 10 Personen etwas klein, aber wir kamen zurecht. Ein Geschäft ist in der Nähe, und den Blumenladen in Auning können wir empfehlen. Es gab ein paar kleine Dinge, aber der Gastgeber war gut erreichbar und hat sie schnell gelöst.",
    source: "airbnb",
  },
  {
    id: "dorte-2025-04",
    rating: 5,
    author: "Dorte",
    date: "2025-04-12",
    textDa:
      "Fantastisk søskende-weekend i sommerhuset, hvor vi var på tur i området, og 8 personer lavede mad sammen i det veludstyrede køkken. Weekenden gik desværre for hurtigt, så vi nåede ikke vildmarksbadet. Vi kommer gerne igen.",
    textEn:
      "Fantastic siblings’ weekend at the summer house. We explored the area and cooked together (8 people) in the well-equipped kitchen. The weekend passed too quickly, so we didn’t get to use the hot tub. We’d love to come again.",
    textDe:
      "Fantastisches Geschwister-Wochenende im Ferienhaus. Wir haben die Umgebung erkundet und mit 8 Personen gemeinsam in der gut ausgestatteten Küche gekocht. Das Wochenende ging leider zu schnell vorbei, sodass wir den Whirlpool nicht nutzen konnten. Wir kommen gerne wieder.",
    source: "airbnb",
  },
  {
    id: "jan-2025-03",
    rating: 5,
    author: "Jan",
    date: "2025-03-08",
    textDa:
      "Alt var i top. Fantastisk ophold for 8 personer. Kommer gerne igen.",
    textEn:
      "Everything was great. Excellent stay for 8 people. Would love to return.",
    textDe:
      "Alles war bestens. Fantastischer Aufenthalt für 8 Personen. Wir kommen gerne wieder.",
    source: "airbnb",
  },
  {
    id: "tina-2025-02",
    rating: 4,
    author: "Tina",
    date: "2025-02-20",
    textDa:
      "Fint hus med masser af plads og gode faciliteter. Dejligt område og flot strand. Værterne svarede hurtigt og positivt på henvendelser.",
    textEn:
      "Nice house with plenty of space and good facilities. Lovely area and beautiful beach. The hosts replied quickly and positively to our questions.",
    textDe:
      "Schönes Haus mit viel Platz und guten Einrichtungen. Schöne Gegend und toller Strand. Die Gastgeber haben schnell und positiv auf unsere Fragen geantwortet.",
    source: "airbnb",
  },
  {
    id: "gokhan-2025-02",
    rating: 5,
    author: "Gökhan",
    date: "2025-02-15",
    textDa:
      "Huset var vidunderligt, smukt indrettet og perfekt udstyret. Check-in og kommunikationen var super, værten var let at få fat i og imødekommende. Der var ikke sengetøj og håndklæder inkluderet, hvilket kunne være lettere fremover.",
    textEn:
      "The house was wonderful, beautifully furnished and perfectly equipped. Check-in and communication were great; the host was easy to reach and accommodating. Bed linen and towels were not included, which could be made easier in the future.",
    textDe:
      "Das Haus war wunderbar, schön eingerichtet und perfekt ausgestattet. Check-in und Kommunikation waren super; der Gastgeber war gut erreichbar und entgegenkommend. Bettwäsche und Handtücher waren nicht inklusive, was in Zukunft einfacher gelöst werden könnte.",
    source: "airbnb",
  },
  {
    id: "andri-2025-02",
    rating: 4,
    author: "Andri",
    date: "2025-02-05",
    textDa:
      "Virkelig dejligt hus i et roligt område. Alt er godt dokumenteret med QR-koder, og huset er nemt at bruge. Værten er fantastisk og meget hurtig til at svare. En ulempe: betalinger uden for Airbnb (rengøring, el, opvarmning og andre faciliteter) fordoblede næsten prisen. Det fremgår af beskrivelsen, men hvis man ikke er vant til det, kan det komme som en overraskelse.",
    textEn:
      "Really nice house in a quiet area. Everything is well documented with QR codes and the house is easy to navigate. The host is great and very responsive. One downside: off-site payments (cleaning, electricity, heating and amenities) almost doubled the price. It’s stated in the description, but if you’re not used to it, it can be a surprise.",
    textDe:
      "Wirklich schönes Haus in einer ruhigen Gegend. Alles ist mit QR-Codes gut dokumentiert und das Haus ist leicht zu nutzen. Der Gastgeber ist großartig und antwortet sehr schnell. Ein Nachteil: Zahlungen außerhalb von Airbnb (Reinigung, Strom, Heizung und weitere Ausstattung) haben den Preis fast verdoppelt. Es steht in der Beschreibung, aber wenn man es nicht gewohnt ist, kann es überraschend sein.",
    source: "airbnb",
  },
];
