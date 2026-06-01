// src/pages/guest/Manual.tsx

import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import type { Lang } from "../../../lib/lang";
import styles from "./Manual.module.css";
import Buttons from "../../../components/Buttons";
import Hero from "../../../components/Hero";
import { guestPathOf } from "../../../lib/routes";

type Props = { lang: Lang };

export default function Manual({ lang }: Props) {
  const title =
    lang === "da" ? "Manual 🧭 Fyrrehaven 61" : "Manual 🧭 Fyrrehaven 61";
  const description =
    lang === "da"
      ? "Se vigtig info til dit ophold: el-måler, vandmåler, adgang, regler og mere."
      : "Important info for your stay: meter readings, access, house rules and more.";

  const t = (da: string, en: string) => (lang === "da" ? da : en);

    const heroTitle = t(
      "Tak for I har valgt vores sommerhus!",
      "Thank you for choosing our summer house!"
    );
    const heroSubtitle = t(
      "Her er lidt info omkring hvordan I behandler huset – I må meget gerne følge os på sociale medier og dele jeres oplevelse med #fyrrehaven61",
      "We look forward to welcoming you in beautiful and relaxing surroundings – here’s a bit of practical info!"
    );

  const saunaUrl = guestPathOf(lang, "sauna");
  const hottubUrl = guestPathOf(lang, "spa");
  const poolUrl = guestPathOf(lang, "pool");

  const duringStayItems = [
    {
      id: "wifi",
      title: t("Wi-Fi", "Wi-Fi"),
      content: (
        <p>
          {t("Navn: HabibiHytten", "Name: HabibiHytten")}
          <br />
          {t("Kode: Dolma3000", "Password: Dolma3000")}
          <br />
          {t("Hastighed: optil 1000/1000 Mbit", "Speed: up to 1000/1000 Mbit")}
          <br />
          {t(
            "Dækning i hele huset også udenfor",
            "Coverage throughout the house and outside"
          )}
        </p>
      ),
    },
    {
      id: "espresso",
      title: t("Espressomaskine", "Espresso machine"),
      content: (
        <ul>
          <li>{t("Kaffebønner inkl.", "Coffee beans included.")}</li>
          <li>
            {t(
              "Efter hver kaffe kop, trykkes der på start for at rense.",
              "Press start after each coffee to clean."
            )}
          </li>
          <li>
            {t(
              "Skal tømmes for spildevand og kaffegums jævnligt og fyldes op med rent vand i vandbeholderen",
              "Empty wastewater and refill with clean water regularly."
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "foldedoer",
      title: t("Foldedør", "Folding door"),
      content: (
        <p>
          {t(
            "Den store foldedør ud til poolen kan åbnes i 5 dele. Åbn det stille og roligt. Går den i stykker er det jeres ansvar.",
            "The large door to the pool can be opened in 5 parts. Open slowly and carefully. You're responsible if it breaks."
          )}
        </p>
      ),
    },
    {
      id: "adgang",
      title: t("Adgang forbudt", "No access"),
      content: (
        <ul>
          <li>{t("Skur", "Tool shed")}</li>
          <li>{t("Anneks", "Annex")}</li>
        </ul>
      ),
    },
    {
      id: "roeg",
      title: t("Rygning", "Smoking"),
      content: (
        <p>
          {t(
            "Alt rygning er forbudt indendørs eller i den overdækkede terrasse. Vi henviser til at ryge udenfor.",
            "No smoking indoors or on the covered terrace. Please smoke outside."
          )}
        </p>
      ),
    },
    {
      id: "pool",
      title: t("Pool", "Pool"),
      content: <p>{t("Åben i sommerperiode", "Open during summer period")}</p>,
    },
    {
      id: "tv",
      title: t("Smart TV", "Smart TV"),
      content: (
        <ul>
          <li>
            {t(
              "Download og login på din favorit streaming tjenester",
              "Download and log into your favorite streaming services"
            )}
          </li>
          <li>
            {t(
              "Cast fra din telefon via Chromecast",
              "Cast from your phone via Chromecast"
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "vaske",
      title: t("Vaskemaskine og tørretumbler", "Washer and dryer"),
      content: (
        <ul>
          <li>{t("Kan frit bruges", "Free to use")}</li>
          <li>
            {t(
              "Indstil til ønskede program og læn dig tilbage",
              "Select desired program and relax"
            )}
          </li>
          <li>
            {t(
              "Husk at tømme tørretumbleren for vand",
              "Remember to empty water container"
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "elbil",
      title: t("El bil", "Electric car"),
      content: (
        <p>
          {t(
            "I kan frit tilslutte jeres El bil. Bemærk dog at den kan være slukket når I kommer.",
            "You can freely plug in your electric car. It might be turned off upon arrival."
          )}
        </p>
      ),
    },
    {
      id: "sensor",
      title: t("Sikkerhed", "Safety"),
      content: (
        <ul>
          <li>
            {t(
              "Vinduer og udvendige døre har sensor for at vi kan se om der er åbent.",
              "Sensors monitor open windows and doors."
            )}
          </li>
          <li>
            {t(
              "Temperatur overvågning, indendørs, udendørs, saune, pool og vildmarksbad",
              "Temperature monitoring indoor, outdoor, sauna, pool and hot tub"
            )}
          </li>
          <li>
            {t(
              "Skur og anneks er videoovervåget",
              "Shed and annex are video monitored"
            )}
          </li>
        </ul>
      ),
    },
  ];

  const afterStayItems = [
    {
      id: "oprydning",
      title: t("Oprydning", "Tidying up"),
      content: (
        <ul>
          <li>
            {t("Opryd hele huset og have", "Tidy the entire house and garden")}
          </li>
          <li>
            {t(
              "Dobbelt tjek I har det hele med",
              "Double-check that you’ve packed everything"
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "opvasker",
      title: t("Opvaskemaskine", "Dishwasher"),
      content: (
        <p>
          {t(
            "Vask alt op og tøm opvaskemaskinen",
            "Wash and empty the dishwasher"
          )}
        </p>
      ),
    },
    {
      id: "kaffemaskine",
      title: t("Espressomaskine", "Espresso machine"),
      content: (
        <ul>
          <li>
            {t("Tøm beholderen med kaffegums", "Empty coffee waste container")}
          </li>
          <li>{t("Tøm vandbeholderen", "Empty water tank")}</li>
          <li>{t("Tøm drypbakken", "Empty drip tray")}</li>
        </ul>
      ),
    },
    {
      id: "affald",
      title: t("Affald", "Trash"),
      content: (
        <ul>
          <li>
            {t(
              "Affald samles og smides sorteret i affaldsbeholderne udenfor",
              "Sort and dispose of trash in outdoor bins"
            )}
          </li>
          <li>
            {t(
              "Tomme vin og spiritus flasker smides ud i affaldskontaineren",
              "Dispose of empty wine/spirit bottles in the waste container"
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "lys",
      title: t("Lys", "Lights"),
      content: (
        <p>
          {t(
            "Sluk alt belysning, også udendørs",
            "Turn off all lighting, also outdoors"
          )}
        </p>
      ),
    },
    {
      id: "udendoers",
      title: t("Udendørs møbler", "Outdoor furniture"),
      content: (
        <p>
          {t(
            "Sæt udemøblerne som da I ankom",
            "Return outdoor furniture as found"
          )}
        </p>
      ),
    },
    {
      id: "grill",
      title: t("Grill", "Grill"),
      content: (
        <p>
          {t(
            "Efterlad grillen rengjort og dækket til",
            "Clean and cover grill after use"
          )}
        </p>
      ),
    },
    {
      id: "vildmarksbad",
      title: t("Vildmarksbad", "Hot tub"),
      content: (
        <ul>
          <li>
            {t(
              "Tøm brændovnen for aske og efterlad den ren",
              "Empty ashes and clean stove"
            )}
          </li>
          <li>
            {t(
              "Tøm for vandet og lad afløbshanen stå åben",
              "Drain water and leave valve open"
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "laas",
      title: t("Lås af", "Lock up"),
      content: (
        <ul>
          <li>{t("Luk alle vinduer", "Close all windows")}</li>
          <li>
            {t(
              "Lås døren og læg nøgle i nøgleboksen",
              "Lock the door and leave the key in the key box"
            )}
          </li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <Head
        lang={lang}
        path={guestPathOf(lang, "manual")}
        title={title}
        description={description}
        ogImage="/images/guest-welcome.jpg"
        ogImageAlt={t("Manual billede", "Manual image")}
        noindex
      />

      <Hero title={heroTitle} subtitle={heroSubtitle} />
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.quickLinks}>
            <Buttons
              to={poolUrl}
              labelDa="Pool"
              labelEn="Pool"
              variant="secondary"
            />
            <Buttons
              to={hottubUrl}
              labelDa="Vildmarksbad"
              labelEn="Hot Tub"
              variant="secondary"
            />
            <Buttons
              to={saunaUrl}
              labelDa="Sauna"
              labelEn="Sauna"
              variant="secondary"
            />
          </div>
        </div>

        <div className={styles.noticeBox}>
          <p>
            <strong>{lang === "da" ? "HUSK!" : "NOTE!"}</strong>{" "}
            {lang === "da"
              ? "Det er jeres ansvar at få aflæst el og vand måler. Glemmer I dette kan I komme til at betale mere end jeres forbrug."
              : "It is your responsibility to read the electricity and water meters. If you forget this, you may be charged for more than your actual usage."}
          </p>

          <p>
            {lang === "da"
              ? "Aflæsning skal ske ved tjekind og tjekud via vores hjemmeside. I finder QR-koden ved indgangen eller "
              : "Meter reading must be done at check-in and check-out via our website. You’ll find the QR code by the entrance or "}
            <a
              href={
                lang === "da"
                  ? "https://booking.fyrrehaven-61.dk/manual"
                  : "https://booking.fyrrehaven-61.dk/en/manual"
              }
            >
              {lang === "da" ? "her" : "here"}
            </a>
            .
          </p>

          <ol>
            <li>
              {lang === "da" ? "Aflæs EL tavlen" : "Read the electricity meter"}
            </li>
            <li>
              {lang === "da"
                ? "Aflæs Vand i huset"
                : "Read water meter inside house"}
            </li>
            <li>
              {lang === "da"
                ? "Aflæs vand til pool i skuret"
                : "Read pool water meter in shed"}
            </li>
          </ol>
        </div>
      </div>
      <div className={styles.manualContainer}>
        <h1>{t("Manual til jeres ophold", "Manual for your stay")}</h1>
        <Accordion items={duringStayItems} defaultOpenId="wifi" />
        <h2 id="theend">{t("Efter endt ophold", "After your stay")}</h2>
        <Accordion items={afterStayItems} />
      </div>
    </>
  );
}
