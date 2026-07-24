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
              <li>{tg("accordion.spa.rules.chlorine")}</li>
            </ul>
          </div>

          <div className={styles.image}>
            <img
              src="https://booking.fyrrehaven-61.dk/wp-content/uploads/2025/12/IMG_4594-980x735.jpeg"
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
      id: "startup",
      title: t(
        "Trin-for-trin opstart",
        "Step-by-step start up",
        "Schrittweiser Start"
      ),
      content: (
        <ol className={styles.list}>
          <li>
            {t(
              "Fyld vand i karret som første trin.",
              "Fill with water as the very first step.",
              "Füllen Sie zuerst Wasser in den Whirlpool."
            )}
          </li>
          <li>
            {t(
              "Tænd spa-kredsløbet (sikring) i teknikrummet.",
              "Turn on the 'Spa' circuit breaker located in the technical room.",
              "Schalten Sie im Technikraum die Sicherung 'Spa' ein."
            )}
          </li>
          <li>
            {t(
              "Start vandcirkulation: tryk på knap 2 (midterste) på panelet og vent ca. 1 minut.",
              "Turn on water circulation by pressing button 2 (middle button) and wait approx. 1 minute.",
              "Starten Sie die Wasserzirkulation mit Taste 2 (mittlere Taste) und warten Sie ca. 1 Minute."
            )}
          </li>
          <li>
            {t(
              "Åbn lågen på siden af karret og tænd sikkerhedsbryderen (gul drejekontakt).",
              "Open the hatch on the side of the tub and turn on the safety switch (yellow rotary switch).",
              "Öffnen Sie die Klappe an der Seite und schalten Sie den Sicherheitsschalter ein (gelber Drehschalter)."
            )}
          </li>
          <li>
            {t(
              "Vent ca. 1 minut for initialisering.",
              "Wait approx. 1 minute for the system to initialise.",
              "Warten Sie ca. 1 Minute, bis das System initialisiert ist."
            )}
          </li>
          <li>
            {t(
              "Indstil termostaten til 35°C. Systemets tolerance er ca. +2°C (opvarmning stopper ved ca. 37°C).",
              "Set the thermostat to 35°C. The system has a tolerance of approx. +2°C (heating will stop at approx. 37°C).",
              "Stellen Sie den Thermostat auf 35°C. Das System hat eine Toleranz von ca. +2°C (die Heizung stoppt bei ca. 37°C)."
            )}
          </li>
          <li>
            {t(
              "Læg termocover på for at reducere varmetab og forkorte opvarmningstiden.",
              "Place the thermal cover on to reduce heat loss and shorten heating time.",
              "Legen Sie die Thermoabdeckung auf, um Wärmeverlust zu reduzieren und die Aufheizzeit zu verkürzen."
            )}
          </li>
        </ol>
      ),
    },
    {
      id: "heating",
      title: t("Opvarmning og brug", "Heating and use", "Aufheizen und Nutzung"),
      content: (
        <div className={styles.text}>
          <ul>
            <li>
              {t(
                "Hvis vandet køler under brug startes opvarmning automatisk igen. Sørg for altid at slukke korrekt efter brug.",
                "If the water cools during use, heating will start automatically again. Always shut down correctly after use.",
                "Wenn das Wasser während der Nutzung abkühlt, startet die Heizung automatisch erneut. Schalten Sie nach der Nutzung immer korrekt aus."
              )}
            </li>
            <li>
              {t(
                "Tjek vandtemperatur før bad – ideelt 35–37°C.",
                "Check water temperature before use – ideally 35–37°C.",
                "Prüfen Sie die Wassertemperatur vor der Nutzung – ideal sind 35–37°C."
              )}
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "shutdown",
      title: t(
        "Sluk korrekt efter brug",
        "How to shut down correctly after use",
        "Nach der Nutzung korrekt ausschalten"
      ),
      content: (
        <ol className={styles.list}>
          <li>
            {t(
              "Sluk for vandcirkulation først (knap 2).",
              "Turn off water circulation first (button 2).",
              "Schalten Sie zuerst die Wasserzirkulation aus (Taste 2)."
            )}
          </li>
          <li>
            {t(
              "Sluk for sikkerhedsbryderen (gul drejekontakt).",
              "Then turn off the safety switch (yellow rotary switch).",
              "Schalten Sie danach den Sicherheitsschalter aus (gelber Drehschalter)."
            )}
          </li>
          <li>
            {t(
              "Sluk for spa-kredsløbet i teknikrummet til sidst.",
              "Finally, turn off the 'Spa' circuit breaker in the technical room.",
              "Schalten Sie zum Schluss im Technikraum die Sicherung 'Spa' aus."
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
          "Information om brug af det elektriske vildmarksbad.",
          "Information for using the electric hot tub.",
          "Informationen zur Nutzung des elektrisch beheizten Whirlpools."
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
