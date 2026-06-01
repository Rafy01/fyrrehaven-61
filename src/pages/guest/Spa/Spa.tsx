import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import styles from "./Spa.module.css";
import type { Lang } from "../../../lib/lang";

type Props = {
  lang: Lang;
};

export default function Spa({ lang }: Props) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const items = [
    {
      id: "important",
      title: t("VIGTIGT – læs før opstart", "IMPORTANT – read before start-up"),
      content: (
        <div className={styles.content}>
          <div className={styles.text}>
            <p>
              <strong>{t("Bemærk:", "Note:")}</strong>{" "}
              {t(
                "Vildmarksbadet må aldrig tændes uden vand. Hvis varmeelementet aktiveres uden vand i karret kan det blive permanent beskadet.",
                "The hot tub must NEVER be turned on without water. Activating the heating element without water may cause permanent damage."
              )}
            </p>

            <p>
              {t(
                "Fyld vand i karret som det allerførste trin.",
                "Fill the tub with water as the very first step."
              )}
            </p>

            <ul>
              <li>
                {t(
                  "Vandniveauet skal være ca. 5–10 cm under kanten eller ca. 5–10 cm over de øverste dyser.",
                  "The water level should be approx. 5–10 cm below the rim or 5–10 cm above the upper jets."
                )}
              </li>
              <li>
                {t(
                  "Der er separate funktioner for massage, cirkulation og lys på kontrolpanelet.",
                  "Controls include massage (adjustable intensity), circulation and light on the control panel."
                )}
              </li>
              <li>{t("Al brug er på eget ansvar.", "All use is at your own risk.")}</li>
            </ul>
          </div>

          <div className={styles.image}>
            <img
              src="https://booking.fyrrehaven-61.dk/wp-content/uploads/2025/12/IMG_4594-980x735.jpeg"
              alt={t("Vildmarksbad", "Hot tub")}
              width={600}
              height={400}
            />
          </div>
        </div>
      ),
    },
    {
      id: "startup",
      title: t("Trin-for-trin opstart", "Step-by-step start up"),
      content: (
        <ol className={styles.list}>
          <li>{t("Fyld vand i karret som første trin.", "Fill with water as the very first step.")}</li>
          <li>
            {t(
              "Tænd spa-kredsløbet (sikring) i teknikrummet.",
              "Turn on the ‘Spa’ circuit breaker located in the technical room."
            )}
          </li>
          <li>
            {t(
              "Start vandcirkulation: tryk på knap 2 (midterste) på panelet og vent ca. 1 minut.",
              "Turn on water circulation by pressing button 2 (middle button) and wait approx. 1 minute."
            )}
          </li>
          <li>
            {t(
              "Åbn lågen på siden af karret og tænd sikkerhedsbryderen (gul drejekontakt).",
              "Open the hatch on the side of the tub and turn on the safety switch (yellow rotary switch)."
            )}
          </li>
          <li>{t("Vent ca. 1 minut for initialisering.", "Wait approx. 1 minute for the system to initialise.")}</li>
          <li>
            {t(
              "Indstil termostaten til 35°C. Systemets tolerance er ca. +2°C (opvarmning stopper ved ca. 37°C).",
              "Set the thermostat to 35°C. The system has a tolerance of approx. +2°C (heating will stop at approx. 37°C)."
            )}
          </li>
          <li>
            {t(
              "Læg termocover på for at reducere varmetab og forkorte opvarmningstiden.",
              "Place the thermal cover on to reduce heat loss and shorten heating time."
            )}
          </li>
        </ol>
      ),
    },
    {
      id: "heating",
      title: t("Opvarmning og brug", "Heating and use"),
      content: (
        <div className={styles.text}>
          <ul>
            <li>{t("Opvarmning tager ca. 6 timer.", "Heating takes approx. 6 hours.")}</li>
            <li>
              {t(
                "Hvis vandet køler under brug startes opvarmning automatisk igen. Sørg for altid at slukke korrekt efter brug.",
                "If the water cools during use, heating will start automatically again. Always shut down correctly after use."
              )}
            </li>
            <li>
              {t(
                "Tjek vandtemperatur før bad – ideelt 35–37°C.",
                "Check water temperature before use – ideally 35–37°C."
              )}
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "shutdown",
      title: t("Sluk korrekt efter brug", "How to shut down correctly after use"),
      content: (
        <ol className={styles.list}>
          <li>{t("Sluk for vandcirkulation først (knap 2).", "Turn off water circulation first (button 2).")}</li>
          <li>{t("Sluk for sikkerhedsbryderen (gul drejekontakt).", "Then turn off the safety switch (yellow rotary switch).")}</li>
          <li>{t("Sluk for spa-kredsløbet i teknikrummet til sidst.", "Finally, turn off the ‘Spa’ circuit breaker in the technical room.")}</li>
        </ol>
      ),
    },
    {
      id: "drain",
      title: t("Tømning efter ophold", "Draining the hot tub after your stay"),
      content: (
        <div className={styles.text}>
          <p>
            {t(
              "Tømning må kun ske når sikkerhedsbryderen og spa-kredsløbet er slukket.",
              "Draining may only be done when the safety switch and the circuit breaker are turned off."
            )}
          </p>
          <p>
            {t(
              "Hvis noget går i stykker eller holder op med at fungere, giv os besked hurtigst muligt.",
              "If anything breaks or stops working, please inform us as soon as possible."
            )}
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head
        title={t("Vildmarksbad", "Hot Tub")}
        description={t(
          "Information om brug af det elektriske vildmarksbad.",
          "Information for using the electric hot tub."
        )}
        lang={lang}
        path=""
        noindex
      />

      <div className={styles.wrapper}>
        <h1>{t("Vildmarksbad", "Hot Tub")}</h1>
        <Accordion items={items} defaultOpenId="important" />
      </div>
    </>
  );
}
