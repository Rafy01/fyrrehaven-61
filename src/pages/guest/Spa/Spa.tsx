// src/pages/guest/[lang]/Spa.tsx

import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import styles from "./Spa.module.css";
import type { Lang } from "../../../lib/lang";

type Props = {
  lang: Lang;
};

export default function Spa({ lang }: Props) {
  const t = (da: string, en: string, de = en) =>
    lang === "da" ? da : lang === "de" ? de : en;

  const items = [
    {
      id: "rules",
      title: t("Regler og brug", "Rules and usage", "Regeln und Nutzung"),
      content: (
        <div className={styles.content}>
          <div className={styles.text}>
            <p>
              <strong>{t("Bemærk!", "Note!", "Hinweis!")}</strong>{" "}
              {t(
                "I skal ikke selv have brænde med til vildmarksbad med da det varmes elektrisk. Karret er rent og klar ved ankomst.",
                "You must not bring your own firewood for the hot tub as it is heated electrically. The tub is clean and ready at arrival."
              )}
            </p>

            <ul>
              <li>
                {t(
                  "Maks temperatur 40°, bliver det for varmt tages brænde ud af ovnen.",
                  "Max temperature is 40°C. If the water gets too hot, remove firewood from the heater."
                )}
              </li>
              <li>
                {t(
                  "På siden af vildmarksbadet er der to knapper",
                  "There are two buttons on the side of the hot tub"
                )}
                <ul>
                  <li>{t("Knap 1 — Lys", "Button 1 — Light")}</li>
                  <li>
                    {t("Knap 2 — Massage/bobler", "Button 2 — Massage/bubbles")}
                  </li>
                  <li>
                    {t(
                      "Skru op og ned for styrken",
                      "Adjust intensity with the dial"
                    )}
                  </li>
                </ul>
              </li>
              <li>
                {t(
                  "Vand niveau må ikke overstige de øverste massage dyser",
                  "Water level must not exceed the top nozzles"
                )}
              </li>
              <li>
                {t(
                  "Massage funktionen må ikke tændes før vandet er +20°",
                  "Do not activate massage before water is above 20°C"
                )}
              </li>
              <li>
                {t("Brug kun rent og tørt træ", "Only use clean, dry firewood")}
              </li>
              <li>
                {t(
                  "Der gøres brug af klor tabs for at holde vandet rent",
                  "Chlorine tablets are used to keep the water clean"
                )}
              </li>
              <li>
                {t(
                  "Tøm vandet efter endt ophold eller brug",
                  "Drain the water after your stay or when done using"
                )}
              </li>
            </ul>
          </div>

          <div className={styles.image}>
            <img
              src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3696.webp"
              alt={t("Vildmarksbad", "Hot tub", "Whirlpool")}
              width={600}
              height={400}
            />
            <p className={styles.caption}>
              {t(
                "Alt brug af vildmarksbad er på eget ansvar.",
                "Use of the hot tub is at your own risk."
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "fire",
      title: t("Optænding af vildmarksbad", "How to heat the hot tub", "Whirlpool aufheizen"),
      content: (
        <ol className={styles.list}>
          <li>
            {t(
              "Hæld vand i karret med vandslangen, det vil tage ca. 2 timer.",
              "Fill the tub with the garden hose – this takes about 2 hours."
            )}
          </li>
          <li>
            {t(
              "Når vandet er 10 cm over det øverste hul i ovnen, kan man tænde op og smide 2 klor tabs i.",
              "When water is 10 cm above the heater hole, you can light the fire and add 2 chlorine tabs."
            )}
          </li>
          <li>
            {t(
              "Lav optændingen med tørt brænde og sørg for at få en god flamme i ovnen for at undgå “doven” røg op ad skorstenen.",
              "Use dry firewood and get a proper flame to avoid heavy smoke from chimney."
            )}
          </li>
          <li>
            {t(
              "Fyld gerne ca. 2/3 af ovnen med brænde",
              "Fill approx. 2/3 of the heater with wood"
            )}
          </li>
          <li>
            {t(
              "Placér termocover på toppen og hav tålmodighed",
              "Place the thermal cover and be patient"
            )}
          </li>
          <li>
            {t(
              "Når temperaturen på badevandet er ca. 36°, fyldes der ikke mere brænde på.",
              "Once water reaches ~36°C, stop adding firewood."
            )}
          </li>
          <li>
            {t(
              "Tjek badevandstermometer inden badet benyttes. Ideelt imellem 36°–40°",
              "Check water temperature before use – ideal range is 36–40°C"
            )}
          </li>
          <li>
            {t(
              "Efter brug lukkes termocover og når man er færdig bedes man tømme vandet",
              "After use, close the cover and drain the tub."
            )}
          </li>
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
        <Accordion items={items} defaultOpenId="rules" />
      </div>
    </>
  );
}
