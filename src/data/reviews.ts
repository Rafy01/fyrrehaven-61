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
    id: "timo-2026-05",
    rating: 5,
    author: "Timo",
    date: "2026-05-28",
    textDa:
      "Vi havde et virkelig dejligt ophold og kan varmt anbefale indkvarteringen. Huset var meget godt udstyret, rent og velholdt, så vi følte os godt tilpas fra starten. Især poolen, spabadet og saunaen var virkelige højdepunkter. Spørgsmål blev altid besvaret hurtigt og venligt. Samlet set et fantastisk sted, hvor vi med glæde ville holde ferie igen når som helst.",
    textEn:
      "We had a really lovely stay and can warmly recommend the accommodation. The house was very well equipped, clean and well maintained, so we felt comfortable from the start. The pool, hot tub and sauna were particular highlights. Questions were always answered quickly and kindly. Overall, a fantastic place where we would happily spend a holiday again at any time.",
    textDe:
      "Wir hatten einen wirklich schönen Aufenthalt und können die Unterkunft wärmstens empfehlen. Das Haus war sehr gut ausgestattet, sauber und gepflegt, sodass wir uns von Anfang an wohlgefühlt haben. Besonders der Pool, der Whirlpool und die Sauna waren echte Highlights. Fragen wurden immer schnell und freundlich beantwortet. Insgesamt ein fantastischer Ort, an dem wir jederzeit gerne wieder Urlaub machen würden.",
    source: "airbnb",
  },
  {
    id: "emil-2026-05",
    rating: 5,
    author: "Emil",
    date: "2026-05-01",
    textDa: ".",
    textEn: ".",
    textDe: ".",
    source: "airbnb",
  },
  {
    id: "peter-mossin-2026-04",
    rating: 5,
    author: "Peter Mossin",
    date: "2026-04-01",
    textDa:
      "Dejligt sommerhus med gode værelser og gode faciliteter. Alt fungerede perfekt.",
    textEn:
      "Lovely summer house with good rooms and good facilities. Everything worked perfectly.",
    textDe:
      "Schönes Ferienhaus mit guten Zimmern und guten Einrichtungen. Alles hat perfekt funktioniert.",
    source: "airbnb",
  },
  {
    id: "julian-armin-2026-04",
    rating: 5,
    author: "Julian Armin",
    date: "2026-04-01",
    textDa:
      "Meget tilfreds med boligen. Det er et fantastisk sted at have det skønt :)",
    textEn:
      "Very satisfied with the home. It is a fantastic place to have a great time :)",
    textDe:
      "Sehr zufrieden mit der Unterkunft. Es ist ein fantastischer Ort, um eine schöne Zeit zu haben :)",
    source: "airbnb",
  },
  {
    id: "jonas-2026-04",
    rating: 5,
    author: "Jonas",
    date: "2026-04-01",
    textDa: "Dejligt sted.",
    textEn: "Lovely place.",
    textDe: "Schöner Ort.",
    source: "airbnb",
  },
  {
    id: "lars-2026-03",
    rating: 5,
    author: "Lars",
    date: "2026-03-01",
    textDa:
      "Vi var en familie på 6 voksne og fire børn i alderen 8 til 1 år, og huset er perfekt med soveafdeling, store køkken alrum hvor vi alle kunne opholde os. Hems hvor børnene kunne lege indendørs. Udenfor er der hot top og sauna, gynger, trampolin, perfekt for hele familien. Kan helt klart anbefales.",
    textEn:
      "We were a family of 6 adults and four children aged 8 to 1, and the house is perfect with a sleeping area and a large kitchen-dining space where we could all spend time together. The loft gave the children a place to play indoors. Outside there is a hot tub and sauna, swings and a trampoline, perfect for the whole family. Highly recommended.",
    textDe:
      "Wir waren eine Familie mit 6 Erwachsenen und vier Kindern im Alter von 8 bis 1 Jahr, und das Haus ist perfekt mit Schlafbereich und einem großen Küchen- und Wohnraum, in dem wir alle zusammen sein konnten. Auf dem Dachboden konnten die Kinder drinnen spielen. Draußen gibt es Whirlpool und Sauna, Schaukeln und ein Trampolin - perfekt für die ganze Familie. Absolut empfehlenswert.",
    source: "airbnb",
  },
  {
    id: "morten-2026-02",
    rating: 4,
    author: "Morten",
    date: "2026-02-01",
    textDa:
      "Stedet var som på billederne, indgangen var fint ryddet for sne, alt var rent og i orden. Så alt i alt en god oplevelse.",
    textEn:
      "The place was just like the photos, the entrance had been nicely cleared of snow, and everything was clean and in order. All in all, a good experience.",
    textDe:
      "Der Ort war wie auf den Bildern, der Eingang war ordentlich vom Schnee befreit, alles war sauber und in Ordnung. Alles in allem eine gute Erfahrung.",
    source: "airbnb",
  },
  {
    id: "artur-2026-01",
    rating: 5,
    author: "Artur",
    date: "2026-01-01",
    textDa:
      "Kommunikationsstrømmen bør fremhæves. Eventuelle spørgsmål vil blive besvaret straks eller uden forsinkelse. Fremragende faciliteter. God beliggenhed. Danmark!",
    textEn:
      "The communication flow deserves to be highlighted. Any questions are answered immediately or without delay. Excellent facilities. Good location. Denmark!",
    textDe:
      "Die Kommunikation verdient besondere Erwähnung. Alle Fragen werden sofort oder ohne Verzögerung beantwortet. Hervorragende Ausstattung. Gute Lage. Dänemark!",
    source: "airbnb",
  },
  {
    id: "mona-2025-12",
    rating: 5,
    author: "Mona",
    date: "2025-12-01",
    textDa:
      "Vi har været i dette sommerhus før og det er virkelig hyggeligt og rent. Kommunikationen med værten var rigtig fin og han svarede hurtigt. Huset er godt indrettet og der er alle nødvendige faciliteter. Vi kommer helt sikkert igen.",
    textEn:
      "We have stayed in this summer house before, and it is really cosy and clean. Communication with the host was very good and he replied quickly. The house is well arranged and has all the necessary facilities. We will definitely come again.",
    textDe:
      "Wir waren schon früher in diesem Ferienhaus, und es ist wirklich gemütlich und sauber. Die Kommunikation mit dem Gastgeber war sehr gut und er antwortete schnell. Das Haus ist gut eingerichtet und verfügt über alle notwendigen Einrichtungen. Wir kommen ganz sicher wieder.",
    source: "airbnb",
  },
  {
    id: "jannik-2025-11",
    rating: 5,
    author: "Jannik",
    date: "2025-11-01",
    textDa:
      "Vi havde en rigtig dejlig weekend i Rimons sommerhus. Vi kom til at ødelægge nogle ting, men her var Rimon både fair og super professionel igennem forløbet efter opholdet. Vi kunne bestemt finde på at komme igen!",
    textEn:
      "We had a really lovely weekend in Rimon's summer house. We accidentally damaged a few things, but Rimon was both fair and very professional throughout the process after the stay. We could definitely see ourselves coming back!",
    textDe:
      "Wir hatten ein wirklich schönes Wochenende in Rimons Ferienhaus. Wir haben versehentlich ein paar Dinge beschädigt, aber Rimon war während des gesamten Ablaufs nach dem Aufenthalt sowohl fair als auch sehr professionell. Wir könnten uns definitiv vorstellen, wiederzukommen!",
    source: "airbnb",
  },
  {
    id: "piravinth-2025-10",
    rating: 5,
    author: "Piravinth",
    date: "2025-10-01",
    textDa:
      "Vi var der med forældre, bedsteforældre og børn - bare perfekt! Værterne var supervenlige, hjælpsomme og altid tilgængelige, hvis du havde brug for noget. Stedet er stort, meget veludstyret, og der er alt, hvad du har brug for - især kaffemaskinen og de moderne apparater imponerede os. Beliggenheden er ideel til et par afslappende dage, rart og roligt, men alligevel tæt nok på til at tage på udflugter. Poolen var det absolutte højdepunkt - opvarmet og vidunderligt ren! Den nye sauna er også et rigtigt plus. Vi følte os helt trygge og ville helt sikkert elske at komme tilbage.",
    textEn:
      "We stayed there with parents, grandparents and children - simply perfect! The hosts were super friendly, helpful and always available if you needed anything. The place is spacious, very well equipped, and has everything you need - the coffee machine and modern appliances impressed us especially. The location is ideal for a few relaxing days, nice and quiet, yet still close enough for outings. The pool was the absolute highlight - heated and wonderfully clean! The new sauna is also a real plus. We felt completely safe and would definitely love to come back.",
    textDe:
      "Wir waren dort mit Eltern, Großeltern und Kindern - einfach perfekt! Die Gastgeber waren superfreundlich, hilfsbereit und immer erreichbar, wenn man etwas brauchte. Der Ort ist groß, sehr gut ausgestattet und es gibt alles, was man braucht - besonders die Kaffeemaschine und die modernen Geräte haben uns beeindruckt. Die Lage ist ideal für ein paar entspannte Tage, schön ruhig und dennoch nah genug für Ausflüge. Der Pool war das absolute Highlight - beheizt und wunderbar sauber! Die neue Sauna ist ebenfalls ein echtes Plus. Wir haben uns vollkommen sicher gefühlt und würden sehr gerne wiederkommen.",
    source: "airbnb",
  },
  {
    id: "virginia-2025-10",
    rating: 5,
    author: "Virginia",
    date: "2025-10-01",
    textDa:
      "Hytten var som beskrevet. Hvis du har spørgsmål eller problemer (f.eks. koldt vand) fik vi hurtig og venlig feedback, selv med teknikere på stedet. Vi havde det rigtig godt sammen der.",
    textEn:
      "The cabin was as described. If you have questions or problems, such as cold water, we received quick and friendly feedback, even with technicians on site. We had a really good time together there.",
    textDe:
      "Das Ferienhaus war wie beschrieben. Wenn man Fragen oder Probleme hatte, zum Beispiel kaltes Wasser, bekamen wir schnelle und freundliche Rückmeldung, sogar mit Technikern vor Ort. Wir hatten dort eine wirklich schöne gemeinsame Zeit.",
    source: "airbnb",
  },
  {
    id: "stephen-2025-09",
    rating: 5,
    author: "Stephen",
    date: "2025-09-01",
    textDa:
      "Meget god vært! Hurtig kommunikation, hjælpsom og lejligheden er også meget fin!",
    textEn:
      "Very good host! Quick communication, helpful, and the place is also very nice!",
    textDe:
      "Sehr guter Gastgeber! Schnelle Kommunikation, hilfsbereit, und die Unterkunft ist auch sehr schön!",
    source: "airbnb",
  },
];
