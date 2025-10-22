// src/pages/guest/Welcome.tsx
import Buttons from "../../../components/Buttons";
import Hero from "../../../components/Hero";
import Head from "../../../lib/Head";
import Typography from "../../../components/Typography";
import styles from "./Welcome.module.css";

type Lang = "da" | "en";

type Props = {
  lang: Lang;
};

export default function GuestWelcome({ lang }: Props) {
  const title =
    lang === "da" ? "Velkomst – Fyrrehaven 61" : "Welcome – Fyrrehaven 61";
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const heroTitle = t(
    "Velkommen til Fyrrehaven 61!",
    "Welcome to Fyrrehaven 61!"
  );
  const heroSubtitle = t(
    "Vi glæder os til at byde jer velkommen i smukke og afslappende omgivelser – her kommer lidt praktisk info!",
    "We look forward to welcoming you in beautiful and relaxing surroundings – here’s a bit of practical info!"
  );

const description = t(
  "Velkommen til jeres ophold i Fyrrehaven 61. Her finder I praktiske informationer om huset, pool, sauna, og meget mere.",
  "Welcome to your stay at Fyrrehaven 61. Here you’ll find practical information about the house, pool, sauna, and much more."
);

const domain =
  (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL) || "";

const manualUrl =
  `${domain}/guest/${lang}/${lang === "da" ? "manual" : "manual"}`;
const poolUrl =
  `${domain}/guest/${lang}/${lang === "da" ? "pool" : "pool"}`;
const saunaUrl =
  `${domain}/guest/${lang}/${lang === "da" ? "sauna" : "sauna"}`;
const hotTubUrl =
  `${domain}/guest/${lang}/${lang === "da" ? "vildmarksbad" : "hot-tub"}`;
const endUrl = `${domain}/guest/${lang}/${
  lang === "da" ? "manual#theend" : "manual#theend"
  }`;
const practicalInfoUrl =
  `${domain}/guest/${lang}/${
    lang === "da" ? "praktisk-info" : "practical-info"
  }`;

  return (
    <>
      <Head
        lang={lang}
        path={`/guest/${lang}/velkomst`}
        title={title}
        description={description}
        ogImage="/images/guest-welcome.jpg"
        ogImageAlt={t("Velkomst billede", "Welcome image")}
        noindex
      />

      <div>
        <Hero title={heroTitle} subtitle={heroSubtitle} />

        <Typography>
          {t(
            "Her kommer en guide til jeres ophold hos os. Den kan forhåbentlig hjælpe med at gøre jeres oplevelse helt som den skal være. Finder du ikke dine svar her eller andre steder på hjemmesiden, så hører vi selvfølgelig meget gerne fra jer.",
            "Here is a guide to your stay. Hopefully, it helps make your experience just right. If you can’t find your answers here or on the website, feel free to contact us."
          )}
        </Typography>

        <div className={styles.linkCenter}>
          <Buttons to={manualUrl} label={t("Manualen", "Go to the manual")} />
          <Buttons
            to={practicalInfoUrl}
            label={t("Praktisk information", "Practical information")}
            variant="secondary"
          />
        </div>

        <Typography>
          {t(
            "Når I ankommer til adressen Fyrrehaven 61, 8585 Glesborg, er der plads til 6 biler i indkørslen. I finder også en el-oplader, skulle denne mod forventning være slukket kan I tjekke hjemmesiden for hvordan I tænder.",
            "When you arrive at Fyrrehaven 61, 8585 Glesborg, there is room for 6 cars in the driveway. You’ll also find an EV charger – if it’s unexpectedly turned off, check the website for how to turn it on."
          )}
        </Typography>

        <Typography>
          {t(
            "I skal som det første tage ét billede af eltavlen og vandmålerne ved ankomst – og igen ved afrejse – og sende til os for at afregne forbrug.",
            "First, take a photo of the electricity and water meters upon arrival – and again before departure – and send it to us for consumption billing."
          )}
        </Typography>

        <Typography as="ul">
          <Typography as="li">
            {t(
              "Elmåleren findes til højre for hoveddøren i den overdækkede terrasse.",
              "Electricity meter is located to the right of the front door under the covered terrace."
            )}
          </Typography>
          <Typography as="li">
            {t(
              "Vandmålerne: En findes i teknikskabet i entréen (bruges hele året), og en anden ved poolteknikken i aktivitetsrummet (bruges kun i poolsæson).",
              "Water meters: One is in the technical cabinet in the entrance (used year-round), and another is near the pool system in the activity room (used only in pool season)."
            )}
          </Typography>
        </Typography>

        <Typography>
          {t(
            "Nøgleboksen finder I til højre for hoveddøren. Koden sendes 1 time før ankomst via mail.",
            "The key box is to the right of the front door. The code is sent via email 1 hour before arrival."
          )}
        </Typography>

        <Typography>
          {t(
            "Vigtigt! Før I bruger pool, sauna og vildmarksbad, skal I læse vejledningen:",
            "Important! Before using the pool, sauna, and hot tub, please read the guide:"
          )}
        </Typography>
        <div className={styles.linkCenter}>
          <Typography as="p">
            <a href={poolUrl}>{t("Pool", "Pool")}</a>
          </Typography>
          <Typography as="p">
            <a href={saunaUrl}>{t("Sauna", "Sauna")}</a>
          </Typography>
          <Typography as="p">
            <a href={hotTubUrl}>{t("Vildmarksbad", "Hot Tub")}</a>
          </Typography>
        </div>

        <Typography>
          {t(
            "Husk: I skal selv sørge for brænde til vildmarksbadet.",
            "Note: You must bring your own firewood for the hot tub."
          )}
        </Typography>

        <Typography>
          {t(
            "Der er rygning forbudt i huset. Hvis du ryger udendørs, så husk at samle skodder op.",
            "Smoking is prohibited indoors. If you smoke outside, please pick up your cigarette butts."
          )}
        </Typography>

        <Typography>
          {t(
            "Ingen kæledyr er tilladt. Pas godt på vores ting og giv os besked, hvis noget går i stykker.",
            "No pets allowed. Take care of our things and let us know if anything breaks."
          )}
        </Typography>

        <Typography>
          {t(
            "Inden afrejse skal I følge tjeklisten på hjemmesiden:",
            "Before departure, please follow the checklist on the website:"
          )}
        </Typography>

        <div className={styles.linkCenter}>
          <Buttons
            to={endUrl}
            label={t("Tjekliste for afrejse", "Departure checklist")}
            variant="secondary"
          />
        </div>

        <Typography>
          {t(
            "Vi håber I får en helt unik og vidunderlig oplevelse!",
            "We hope you have a unique and wonderful experience!"
          )}
        </Typography>

        <Typography>
          {t(
            "Del gerne jeres oplevelse med #fyrrehaven61 på sociale medier.",
            "Feel free to share your experience using #fyrrehaven61 on social media."
          )}
        </Typography>

        <Typography variant="h2">
          {t("Find adressen her:", "Find the address here:")}
        </Typography>

        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/kort_fyrrehaven.webp"
          alt="Kort til sommerhuset"
          style={{
            maxWidth: "100%",
            borderRadius: 12,
            marginBottom: "1rem",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Buttons
            to="https://maps.app.goo.gl/11hQhhRAvyVfEpNA8"
            variant="secondary"
            label={t("Google Kort", "Google Maps")}
            buttonType="button"
          />
          <Buttons
            to="https://maps.apple.com/?address=Fyrrehaven%2061,%208585%20Glesborg,%20Danmark&ll=56.510175,10.585733&q=Fyrrehaven%2061&t=h"
            variant="secondary"
            label={t("Apple Kort", "Apple Maps")}
            buttonType="button"
          />
        </div>
      </div>
    </>
  );
}
