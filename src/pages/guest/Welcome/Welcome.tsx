// src/pages/guest/Welcome.tsx

import Head from "../../../lib/Head";
import styles from "./Welcome.module.css";

type Lang = "da" | "en";

type Props = {
  lang: Lang;
};

export default function GuestWelcome({ lang }: Props) {
  const title =
    lang === "da" ? "Velkomst – Fyrrehaven 61" : "Welcome – Fyrrehaven 61";

  const description =
    lang === "da"
      ? "Velkommen til jeres ophold i Fyrrehaven 61. Her finder I praktiske informationer om huset, pool, sauna, og meget mere."
      : "Welcome to your stay at Fyrrehaven 61. Here you’ll find practical information about the house, pool, sauna, and much more.";

  return (
    <>
      <Head
        lang={lang}
        path={`/guest/${lang}/velkomst`}
        title={title}
        description={description}
        ogImage="/images/guest-welcome.jpg"
        ogImageAlt={lang === "da" ? "Velkomst billede" : "Welcome image"}
        noindex
      />

      <div className={styles.container}>
        <h1 className={styles.heading}>
          {lang === "da"
            ? "Velkommen til Fyrrehaven 61!"
            : "Welcome to Fyrrehaven 61!"}
        </h1>

        <p className={styles.subheading}>
          {lang === "da"
            ? "Vi glæder os til at byde jer velkommen i smukke og afslappende omgivelser – her kommer lidt praktisk info!"
            : "We look forward to welcoming you in beautiful and relaxing surroundings – here’s a bit of practical info!"}
        </p>

        <section className={styles.section}>
          <p>
            {lang === "da"
              ? "Her kommer en guide til jeres ophold hos os. Den kan forhåbentlig hjælpe med at gøre jeres oplevelse helt som den skal være. Finder du ikke dine svar her eller andre steder på hjemmesiden, så hører vi selvfølgelig meget gerne fra jer."
              : "Here is a guide to your stay. Hopefully, it helps make your experience just right. If you can’t find your answers here or on the website, feel free to contact us."}
          </p>

          <div className={styles.links}>
            <a
              href="https://booking.fyrrehaven-61.dk"
              target="_blank"
              rel="noreferrer"
            >
              www.booking.fyrrehaven-61.dk
            </a>
            <a
              href="https://booking.fyrrehaven-61.dk/manual"
              target="_blank"
              rel="noreferrer"
            >
              www.booking.fyrrehaven-61.dk/manual
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <p>
            {lang === "da"
              ? "Når I ankommer til adressen Fyrrehaven 61, 8585 Glesborg, er der plads til 6 biler i indkørslen. I finder også en el-oplader, skulle denne mod forventning være slukket kan I tjekke hjemmesiden for hvordan I tænder."
              : "When you arrive at Fyrrehaven 61, 8585 Glesborg, there is room for 6 cars in the driveway. You’ll also find an EV charger – if it’s unexpectedly turned off, check the website for how to turn it on."}
          </p>

          <p>
            {lang === "da"
              ? "I skal som det første tage ét billede af eltavlen og vandmålerne ved ankomst – og igen ved afrejse – og sende til os for at afregne forbrug."
              : "First, take a photo of the electricity and water meters upon arrival – and again before departure – and send it to us for consumption billing."}
          </p>

          <ul className={styles.bulletList}>
            <li>
              {lang === "da"
                ? "Elmåleren findes til højre for hoveddøren i den overdækkede terrasse."
                : "Electricity meter is located to the right of the front door under the covered terrace."}
            </li>
            <li>
              {lang === "da"
                ? "Vandmålerne: En findes i teknikskabet i entréen (bruges hele året), og en anden ved poolteknikken i aktivitetsrummet (bruges kun i poolsæson)."
                : "Water meters: One is in the technical cabinet in the entrance (used year-round), and another is near the pool system in the activity room (used only in pool season)."}
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <p>
            {lang === "da"
              ? "Nøgleboksen finder I til højre for hoveddøren. Koden sendes 1 time før ankomst via mail."
              : "The key box is to the right of the front door. The code is sent via email 1 hour before arrival."}
          </p>
          <p>
            {lang === "da"
              ? "Vigtigt! Før I bruger pool og vildmarksbad, skal I læse vejledningen:"
              : "Important! Before using the pool and hot tub, please read the guide:"}
          </p>

          <div className={styles.links}>
            <a
              href="https://booking.fyrrehaven-61.dk/pool-vildmarksbad"
              target="_blank"
              rel="noreferrer"
            >
              www.booking.fyrrehaven-61.dk/pool-vildmarksbad
            </a>
          </div>

          <p>
            {lang === "da"
              ? "Husk: I skal selv sørge for brænde til vildmarksbadet."
              : "Note: You must bring your own firewood for the hot tub."}
          </p>
        </section>

        <section className={styles.section}>
          <p>
            {lang === "da"
              ? "Der er rygning forbudt i huset. Hvis du ryger udendørs, så husk at samle skodder op."
              : "Smoking is prohibited indoors. If you smoke outside, please pick up your cigarette butts."}
          </p>
          <p>
            {lang === "da"
              ? "Ingen kæledyr er tilladt. Pas godt på vores ting og giv os besked, hvis noget går i stykker."
              : "No pets allowed. Take care of our things and let us know if anything breaks."}
          </p>
        </section>

        <section className={styles.section}>
          <p>
            {lang === "da"
              ? "Inden afrejse skal I følge tjeklisten på hjemmesiden:"
              : "Before departure, please follow the checklist on the website:"}
          </p>
          <div className={styles.links}>
            <a
              href="https://booking.fyrrehaven-61.dk/manual/#theend"
              target="_blank"
              rel="noreferrer"
            >
              www.booking.fyrrehaven-61.dk/manual/#theend
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <p>
            {lang === "da"
              ? "Vi håber I får en helt unik og vidunderlig oplevelse!"
              : "We hope you have a unique and wonderful experience!"}
          </p>
          <p>
            {lang === "da"
              ? "Del gerne jeres oplevelse med #fyrrehaven61 på sociale medier."
              : "Feel free to share your experience using #fyrrehaven61 on social media."}
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            {lang === "da" ? "Find adressen her:" : "Find the address here:"}
          </h2>

          <img
            src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/kort_fyrrehaven.webp"
            alt="Kort til sommerhuset"
            className={styles.mapImage}
          />

          <div className={styles.links}>
            <a
              href="https://www.google.com/maps/place/Fyrrehaven+61,+8585+Glesborg/@56.5102646,10.5841097,17z"
              target="_blank"
              rel="noreferrer"
            >
              Google Maps
            </a>
            <a
              href="https://maps.apple.com/?address=Fyrrehaven%2061,%208585%20Glesborg,%20Danmark&ll=56.510175,10.585733&q=Fyrrehaven%2061&t=h"
              target="_blank"
              rel="noreferrer"
            >
              Apple Kort
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
