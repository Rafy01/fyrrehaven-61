// src/pages/guest/[lang]/Spa.tsx

import { useTranslation } from "react-i18next";
import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import styles from "./Spa.module.css";
import type { Lang } from "../../../lib/lang";

type Props = {
  lang: Lang;
};

export default function Spa({ lang }: Props) {
  const { t: tg } = useTranslation("guest");
  const t = (da: string, en: string, de = en) =>
    lang === "da" ? da : lang === "de" ? de : en;

  const items = [
    {
      id: "rules",
      titleKey: "accordion.spa.rules.title",
      content: (
        <div className={styles.content}>
          <div className={styles.text}>
            <p>
              <strong>{tg("accordion.spa.rules.note")}</strong>{" "}
              {tg("accordion.spa.rules.intro")}
            </p>

            <ul>
              <li>{tg("accordion.spa.rules.maxTemp")}</li>
              <li>
                {tg("accordion.spa.rules.buttons")}
                <ul>
                  <li>{tg("accordion.spa.rules.button1")}</li>
                  <li>{tg("accordion.spa.rules.button2")}</li>
                  <li>{tg("accordion.spa.rules.dial")}</li>
                </ul>
              </li>
              <li>{tg("accordion.spa.rules.waterLevel")}</li>
              <li>{tg("accordion.spa.rules.massageTemp")}</li>
              <li>{tg("accordion.spa.rules.firewood")}</li>
              <li>{tg("accordion.spa.rules.chlorine")}</li>
              <li>{tg("accordion.spa.rules.drain")}</li>
            </ul>
          </div>

          <div className={styles.image}>
            <img
              src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3696.webp"
              alt={tg("accordion.spa.rules.imageAlt")}
              width={600}
              height={400}
            />
            <p className={styles.caption}>
              {tg("accordion.spa.rules.caption")}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "fire",
      titleKey: "accordion.spa.fire.title",
      content: (
        <ol className={styles.list}>
          <li>{tg("accordion.spa.fire.fill")}</li>
          <li>{tg("accordion.spa.fire.heater")}</li>
          <li>{tg("accordion.spa.fire.smoke")}</li>
          <li>{tg("accordion.spa.fire.wood")}</li>
          <li>{tg("accordion.spa.fire.cover")}</li>
          <li>{tg("accordion.spa.fire.stopWood")}</li>
          <li>{tg("accordion.spa.fire.temp")}</li>
          <li>{tg("accordion.spa.fire.close")}</li>
        </ol>
      ),
    },
  ];

  return (
    <>
      <Head
        title={t("Vildmarksbad", "Hot Tub", "Whirlpool")}
        description={t(
          "Information om brug og optænding af vildmarksbadet.",
          "Instructions for using and heating the hot tub.",
          "Informationen zur Nutzung und zum Aufheizen des Whirlpools."
        )}
        lang={lang}
        path=""
        noindex
      />

      <div className={styles.wrapper}>
        <h1>{t("Vildmarksbad", "Hot Tub", "Whirlpool")}</h1>
        <Accordion items={items} defaultOpenId="rules" i18nNs="guest" />
      </div>
    </>
  );
}
