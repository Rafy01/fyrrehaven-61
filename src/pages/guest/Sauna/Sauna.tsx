import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import type { Lang } from "../../../lib/lang";
import styles from "./Sauna.module.css";

export default function GuestSaunaPage({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const title = t("Sauna regler og sikkerhed", "Sauna rules and safety");
  const description = t(
    "Læs hvordan du bruger saunaen korrekt og sikkert under opholdet.",
    "How to use the sauna safely during your stay."
  );

  const rulesContent = (
    <div>
      <ul>
        <li>
          <strong>{t("Tænd lyset", "Turn on the light")}</strong>
          <br />
          {t(
            "Udenfor saunaen er der en kontakt til både indendørs og udendørs lys.",
            "Outside the sauna, there’s a switch for both indoor and outdoor lights."
          )}
        </li>
        <li>
          <strong>{t("Indstil varmeapparatet", "Set the heater")}</strong>
          <br />
          {t(
            "Inde i saunaen finder du to drejeknapper nederst:",
            "Inside the sauna, at the bottom of the heater – you’ll find two control knobs:"
          )}
          <ul>
            <li>
              <strong>
                {t("Venstre knap: Temperatur", "Left knob: Temperature")}
              </strong>
              <br />
              {t(
                "Indstil ønsket temperatur (70–80°C anbefales).",
                "Set your preferred heat (recommended 70–80°C)."
              )}
            </li>
            <li>
              <strong>{t("Højre knap: Tid", "Right knob: Time")}</strong>
              <br />
              {t(
                "Drej for at starte saunaen. Ved '0' starter den straks. Drejer du forbi '0', aktiveres timer-funktion.",
                "Turn to start the sauna. Past '0' activates delayed timer; within first section starts immediately."
              )}
            </li>
          </ul>
        </li>
        <li>
          <strong>{t("Vent på opvarmning", "Wait for heating")}</strong>
          <br />
          {t(
            "Saunaen er klar efter ca. 30–45 minutter.",
            "The sauna will be ready after about 30–45 minutes."
          )}
        </li>
        <li>
          <strong>
            {t("Tag et brusebad før brug", "Shower before entering")}
          </strong>
          <br />
          {t(
            "Vask kroppen og tør dig – det forbedrer hygiejne og varmeoptag.",
            "Wash and dry off – improves hygiene and heat absorption."
          )}
        </li>
        <li>
          <strong>{t("Brug et håndklæde", "Use a towel")}</strong>
          <br />
          {t(
            "Sæt dig altid på et håndklæde – også fødderne.",
            "Always sit on a towel – including under your feet."
          )}
        </li>
        <li>
          <strong>
            {t(
              "Saunér i 10–15 minutter ad gangen",
              "Enjoy the sauna for 10–15 minutes at a time"
            )}
          </strong>
          <br />
          {t(
            "Lyt til kroppen og drik rigeligt med vand.",
            "Listen to your body. Take breaks and drink plenty of water."
          )}
        </li>
        <li>
          <strong>{t("Køl ned bagefter", "Cool down afterwards")}</strong>
          <br />
          {t(
            "Tag et bad eller gå udendørs – det styrker velvære.",
            "Take a shower or go outside – boosts your well-being."
          )}
        </li>
      </ul>
    </div>
  );

  const dontsContent = (
    <div>
      <ol>
        <li>
          <strong>
            {t(
              "Hæld ikke store mængder vand på ovnen",
              "Do not pour large amounts of water on the heater"
            )}
          </strong>
          <br />
          {t(
            "En lille smule ad gangen er okay. For meget kan skade ovnen eller udløse sikkerhedssystemet.",
            "A small amount is fine. Too much may damage the heater or trip the safety system."
          )}
        </li>
        <li>
          <strong>
            {t(
              "Ingen alkohol før eller under brug",
              "Do not drink alcohol before or during use"
            )}
          </strong>
          <br />
          {t(
            "Alkohol er forbudt – det kan være livsfarligt i varme omgivelser.",
            "Alcohol is strictly prohibited – it can be life-threatening in high heat."
          )}
        </li>
        <li>
          <strong>
            {t("Ingen mad eller drikke", "Do not bring food or drinks")}
          </strong>
        </li>
        <li>
          <strong>
            {t("Ingen børn uden opsyn", "No unsupervised children")}
          </strong>
          <br />
          {t(
            "Kun kort brug og altid under opsyn.",
            "Only short use and always under adult supervision."
          )}
        </li>
        <li>
          <strong>
            {t(
              "Ingen olier eller duftsten",
              "Do not use essential oils or similar products"
            )}
          </strong>
          <br />
          {t(
            "Kan beskadige ovnen og give allergiske reaktioner.",
            "They can damage the heater and cause allergic reactions."
          )}
        </li>
      </ol>
    </div>
  );

  const safetyContent = (
    <div>
      <ol>
        <li>
          {t(
            "Sluk altid for ovnen efter brug – drej højre knap til '0'.",
            "Always turn off the sauna after use – set the right knob (time) to '0'."
          )}
        </li>
        <li>
          {t(
            "Brug ikke saunaen hvis du er syg, gravid eller har pacemaker.",
            "Do not use the sauna if you are ill, pregnant, or have a pacemaker."
          )}
        </li>
        <li>
          {t(
            "Brug ikke saunaen til opbevaring.",
            "Never use the sauna as storage."
          )}
        </li>
        <li>
          {t(
            "Hold luftindtag ved ovnen fri.",
            "Keep air inlets and outlets around the heater clear."
          )}
        </li>
        <li>
          {t(
            "Forlad saunaen hvis du føler ubehag.",
            "Leave immediately if you feel dizzy or unwell."
          )}
        </li>
        <li>
          {t(
            "Drik vand før og efter brug for at undgå dehydrering.",
            "Drink water before and after to prevent dehydration."
          )}
        </li>
      </ol>
    </div>
  );

  const items = [
    {
      id: "rules",
      title: t("Regler og brug", "Rules and usage"),
      content: rulesContent,
    },
    {
      id: "donts",
      title: t("Hvad du ikke må gøre", "What You Must Not Do"),
      content: dontsContent,
    },
    {
      id: "safety",
      title: t("Vigtige sikkerhedsregler", "Important Safety"),
      content: safetyContent,
    },
  ];

  const imageUrl =
    lang === "da"
      ? "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/sauna_da.png"
      : "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/sauna_en.png";

  return (
    <>
      <Head title={title} description={description} lang={"da"} path={""} />

      <div className={styles.wrapper}>
        <h1>{title}</h1>
        <p className={styles.subtext}>{description}</p>

        <img
          src={imageUrl}
          alt={t("Sådan bruger du saunaen", "How to use the sauna")}
          className={styles.image}
        />

        <Accordion items={items} />
      </div>
    </>
  );
}
