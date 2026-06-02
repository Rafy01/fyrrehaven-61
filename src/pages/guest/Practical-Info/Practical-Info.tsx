import { useTranslation } from "react-i18next";
import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import type { Lang } from "../../../lib/lang";
import styles from "./Practical-Info.module.css";

type Props = {
  lang: Lang;
};

export default function PracticalInfo({ lang }: Props) {
  const { t: tg } = useTranslation("guest");
  const t = (da: string, en: string, de = en) =>
    lang === "da" ? da : lang === "de" ? de : en;

  const items = [
    {
      id: "coffee",
      titleKey: "accordion.practical.coffee.title",
      content: (
        <div className={styles.section}>
          <p>{tg("accordion.practical.coffee.body")}</p>
          <p>
            <a
              href="https://www.documents.philips.com/assets/20231219/cfd7daded45743e98583b0dd0073c3a2.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              {tg("accordion.practical.coffee.manual")}
            </a>
          </p>
          <img
            src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/bg1.png"
            alt={tg("accordion.practical.coffee.title")}
            width={300}
          />
        </div>
      ),
    },
    {
      id: "sofa",
      titleKey: "accordion.practical.sofa.title",
      content: (
        <div className={styles.section}>
          <p>{tg("accordion.practical.sofa.body")}</p>
          <video width="100%" controls>
            <source
              src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/fyrrehaven61-sovesofa-sleepingbeauty-yderstkomfortabel-cozyhome-cozyvibes-fjellerupstrand.mp4"
              type="video/mp4"
            />
            {tg("accordion.practical.sofa.fallback")}
          </video>
        </div>
      ),
    },
    {
      id: "security",
      titleKey: "accordion.practical.security.title",
      content: (
        <ul className={styles.section}>
          <li>{tg("accordion.practical.security.cameras")}</li>
          <li>{tg("accordion.practical.security.shell")}</li>
          <li>{tg("accordion.practical.security.smoke")}</li>
          <li>{tg("accordion.practical.security.temp")}</li>
        </ul>
      ),
    },
    {
      id: "sonos",
      titleKey: "accordion.practical.sonos.title",
      content: (
        <ul className={styles.section}>
          <li>{tg("accordion.practical.sonos.iphone")}</li>
          <li>{tg("accordion.practical.sonos.android")}</li>
        </ul>
      ),
    },
    {
      id: "stove",
      titleKey: "accordion.practical.stove.title",
      content: (
        <p className={styles.section}>
          {tg("accordion.practical.stove.body")}
        </p>
      ),
    },
    {
      id: "games",
      titleKey: "accordion.practical.games.title",
      content: (
        <ul className={styles.section}>
          <li>{tg("accordion.practical.games.cupboard")}</li>
          <li>{tg("accordion.practical.games.purchases")}</li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <Head
        title={t("Praktisk info", "Practical Info", "Praktische Infos")}
        description={t(
          "Praktisk information om udstyr og funktioner i huset.",
          "Practical information about equipment and usage in the house.",
          "Praktische Informationen zu Ausstattung und Nutzung im Haus."
        )}
        lang={lang}
        path=""
        noindex
      />
      <div className={styles.wrapper}>
        <h1>{t("Praktisk info", "Practical Info", "Praktische Infos")}</h1>
        <Accordion items={items} i18nNs="guest" />
      </div>
    </>
  );
}
