import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import type { Lang } from "../../../lib/lang";
import styles from "./Practical-Info.module.css";

type Props = {
  lang: Lang;
};

export default function PracticalInfo({ lang }: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const items = [
    {
      id: "coffee",
      title: t("Kaffemaskine", "Coffee machine"),
      content: (
        <div className={styles.section}>
          <p>
            {t(
              "Kaffemaskinen skal tømmes for spildevand og kaffegrums jævnligt efter brug og fyldes på med rent vand i vandbeholderen. Kaffebønner er inkluderet – hvis I har brug for flere, er det for egen regning.",
              "The coffee machine must be emptied of wastewater and coffee grounds regularly after use. Fill the tank with clean water. Coffee beans are included – refills are at your own expense."
            )}
          </p>
          <p>
            <a
              href="https://www.documents.philips.com/assets/20231219/cfd7daded45743e98583b0dd0073c3a2.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Se manual her", "View manual here")}
            </a>
          </p>
          <img
            src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/bg1.png"
            alt={t("Kaffemaskine", "Coffee machine")}
            width={300}
          />
        </div>
      ),
    },
    {
      id: "sofa",
      title: t("Sovesofa", "Sofa bed"),
      content: (
        <div className={styles.section}>
          <p>
            {t(
              "Sådan bruger du sovesofaen – se videoen nedenfor:",
              "How to use the sofa bed – watch the video below:"
            )}
          </p>
          <video width="100%" controls>
            <source
              src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/fyrrehaven61-sovesofa-sleepingbeauty-yderstkomfortabel-cozyhome-cozyvibes-fjellerupstrand.mp4"
              type="video/mp4"
            />
            {t(
              "Din browser understøtter ikke video.",
              "Your browser does not support the video."
            )}
          </video>
        </div>
      ),
    },
    {
      id: "security",
      title: t("Overvågning og alarmer", "Surveillance and alarms"),
      content: (
        <ul className={styles.section}>
          <li>
            {t(
              "Overvågning ved pool teknik, anneks og skur",
              "Cameras monitor pool tech room, annex and shed"
            )}
          </li>
          <li>
            {t(
              "Skalsikring på alle vinduer og døre, inkl. udendørsdøre",
              "Perimeter alarm covers all windows and doors, including external ones"
            )}
          </li>
          <li>
            {t(
              "Røg- og kuliltealarm sender besked til værterne ved udløsning",
              "Smoke and CO alarm notifies hosts if triggered"
            )}
          </li>
          <li>
            {t(
              "Pool, vildmarksbad, sauna og udetemperatur overvåges – kan ses på skærmen ved tv’et",
              "Pool, hot tub, sauna and outdoor temperatures are monitored – visible on the screen by the TV"
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "sonos",
      title: t("Sonos-højtaler", "Sonos speaker"),
      content: (
        <ul className={styles.section}>
          <li>
            {t(
              "iPhone: Brug AirPlay og vælg Sonos i højttalerlisten.",
              "iPhone: Use AirPlay and choose Sonos from speaker list."
            )}
          </li>
          <li>
            {t(
              "Android: Brug Sonos-appen eller Bluetooth hvis muligt.",
              "Android: Use the Sonos app or Bluetooth if supported."
            )}
          </li>
        </ul>
      ),
    },
    {
      id: "stove",
      title: t("Kogeplade fejl", "Cooktop error"),
      content: (
        <p className={styles.section}>
          {t(
            'Bemærk: Når komfuret viser “LO” betyder det "låst". Hold startknappen nede i 3 sekunder for at låse op.',
            'Note: If the cooktop displays “LO”, it means "locked". Hold the start button for 3 seconds to unlock.'
          )}
        </p>
      ),
    },
    {
      id: "games",
      title: t("Brætspil & Playstation", "Board games & Playstation"),
      content: (
        <ul className={styles.section}>
          <li>
            {t(
              "Brætspil findes i skabet over køleskabet.",
              "Board games are in the cupboard above the fridge."
            )}
          </li>
          <li>
            {t(
              "I må gerne bruge vores spil eller downloade jeres egne – men vi dækker ikke udgifter til køb.",
              "You’re welcome to play our games or download your own – but we don’t cover costs for guest purchases."
            )}
          </li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <Head
        title={t("Praktisk info", "Practical Info")}
        description={t(
          "Praktisk information om udstyr og funktioner i huset.",
          "Practical information about equipment and usage in the house."
        )}
        lang={lang}
        path=""
      />
      <div className={styles.wrapper}>
        <h1>{t("Praktisk info", "Practical Info")}</h1>
        <Accordion items={items} />
      </div>
    </>
  );
}
