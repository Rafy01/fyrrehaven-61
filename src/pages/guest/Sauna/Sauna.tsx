import { useTranslation } from "react-i18next";
import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import type { Lang } from "../../../lib/lang";
import styles from "./Sauna.module.css";

export default function GuestSaunaPage({ lang }: { lang: Lang }) {
  const { t: tg } = useTranslation("guest");
  const t = (da: string, en: string, de = en) =>
    lang === "da" ? da : lang === "de" ? de : en;

  const title = t(
    "Sauna regler og sikkerhed",
    "Sauna rules and safety",
    "Sauna-Regeln und Sicherheit"
  );
  const description = t(
    "Læs hvordan du bruger saunaen korrekt og sikkert under opholdet.",
    "How to use the sauna safely during your stay.",
    "Lesen Sie, wie Sie die Sauna während Ihres Aufenthalts sicher benutzen."
  );

  const rulesContent = (
    <div>
      <ul>
        <li>
          <strong>{tg("accordion.sauna.rules.lightTitle")}</strong>
          <br />
          {tg("accordion.sauna.rules.light")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.rules.heaterTitle")}</strong>
          <br />
          {tg("accordion.sauna.rules.heater")}
          <ul>
            <li>
              <strong>{tg("accordion.sauna.rules.leftTitle")}</strong>
              <br />
              {tg("accordion.sauna.rules.left")}
            </li>
            <li>
              <strong>{tg("accordion.sauna.rules.rightTitle")}</strong>
              <br />
              {tg("accordion.sauna.rules.right")}
            </li>
          </ul>
        </li>
        <li>
          <strong>{tg("accordion.sauna.rules.waitTitle")}</strong>
          <br />
          {tg("accordion.sauna.rules.wait")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.rules.showerTitle")}</strong>
          <br />
          {tg("accordion.sauna.rules.shower")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.rules.towelTitle")}</strong>
          <br />
          {tg("accordion.sauna.rules.towel")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.rules.durationTitle")}</strong>
          <br />
          {tg("accordion.sauna.rules.duration")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.rules.coolTitle")}</strong>
          <br />
          {tg("accordion.sauna.rules.cool")}
        </li>
      </ul>
    </div>
  );

  const dontsContent = (
    <div>
      <ol>
        <li>
          <strong>{tg("accordion.sauna.donts.waterTitle")}</strong>
          <br />
          {tg("accordion.sauna.donts.water")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.donts.alcoholTitle")}</strong>
          <br />
          {tg("accordion.sauna.donts.alcohol")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.donts.foodTitle")}</strong>
        </li>
        <li>
          <strong>{tg("accordion.sauna.donts.childrenTitle")}</strong>
          <br />
          {tg("accordion.sauna.donts.children")}
        </li>
        <li>
          <strong>{tg("accordion.sauna.donts.oilsTitle")}</strong>
          <br />
          {tg("accordion.sauna.donts.oils")}
        </li>
      </ol>
    </div>
  );

  const safetyContent = (
    <div>
      <ol>
        <li>{tg("accordion.sauna.safety.off")}</li>
        <li>{tg("accordion.sauna.safety.health")}</li>
        <li>{tg("accordion.sauna.safety.storage")}</li>
        <li>{tg("accordion.sauna.safety.air")}</li>
        <li>{tg("accordion.sauna.safety.leave")}</li>
        <li>{tg("accordion.sauna.safety.water")}</li>
      </ol>
    </div>
  );

  const items = [
    {
      id: "rules",
      titleKey: "accordion.sauna.rules.title",
      content: rulesContent,
    },
    {
      id: "donts",
      titleKey: "accordion.sauna.donts.title",
      content: dontsContent,
    },
    {
      id: "safety",
      titleKey: "accordion.sauna.safety.title",
      content: safetyContent,
    },
  ];

  const imageUrl =
    lang === "da"
      ? "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/sauna_da.png"
      : "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/sauna_en.png";

  return (
    <>
      <Head
        title={title}
        description={description}
        lang={lang}
        path={""}
        noindex
      />

      <div className={styles.wrapper}>
        <h1>{title}</h1>
        <p className={styles.subtext}>{description}</p>

        <img
          src={imageUrl}
          alt={t(
            "Sådan bruger du saunaen",
            "How to use the sauna",
            "So benutzen Sie die Sauna"
          )}
          className={styles.image}
        />

        <Accordion items={items} i18nNs="guest" />
      </div>
    </>
  );
}
