// src/components/BookingProcess/BookingProcess.tsx
import * as React from "react";
import { chooseLang, type Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";
import styles from "./BookingProcess.module.css";

type Props = {
  lang: Lang;
  /** Svar-tid i timer (visning) */
  responseHours?: number;
  /** Alderskrav for primær booker/grupper */
  minAge?: number;
  /** Max antal gæster */
  maxGuests?: number;
};

export default function BookingProcess({
  lang,
  responseHours = 24,
  minAge = 25,
  maxGuests = 10,
}: Props) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);

  const steps: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: t("Send forespørgsel", "Send a request"),
      body: t(
        "Vælg ønskede datoer i kalenderen og udfyld formularen nedenfor.",
        "Pick your dates in the calendar and fill in the form below."
      ),
    },
    {
      title: t("Vi gennemgår din forespørgsel", "We review your request"),
      body: (
        <>
          {t(
            "Vi tjekker tilgængelighed, antal gæster og formål med opholdet.",
            "We check availability, party size and the purpose of your stay."
          )}{" "}
          {t(
            `Husregler: ingen fester og ingen rene ungdomsgrupper under ${minAge} år. Max ${maxGuests} personer.`,
            `House rules: no parties and no youth-only groups under ${minAge}. Max ${maxGuests} guests.`
          )}
        </>
      ),
    },
    {
      title: t(
        "Svar fra os (typisk inden for 24 timer)",
        "Our reply (usually within 24 hours)"
      ),
      body: (
        <>
          {t(
            `Du modtager svar fra os (typisk inden for ${responseHours} timer).`,
            `You'll hear back from us (usually within ${responseHours} hours).`
          )}{" "}
          {t(
            "Er alt i orden, sender vi en lejekontrakt med pris og praktisk info. Passer datoerne ikke – eller bryder forespørgslen husreglerne – foreslår vi alternativer eller afviser venligt.",
            "If everything checks out, we send a rental agreement with price and practical info. If the dates don't work—or the request breaks our house rules—we'll suggest alternatives or politely decline."
          )}
        </>
      ),
    },
    {
      title: t("Du underskriver – vi bekræfter", "You sign – we confirm"),
      body: (
        <>
          {t(
            "Bookingen er først endeligt bekræftet, når lejekontrakten er underskrevet og de aftalte betalinger er modtaget.",
            "Your booking is confirmed once the rental agreement is signed and payments are received."
          )}{" "}
          {t(
            "Herefter får du velkomstmail med nøgleinfo, adresse og ankomstvejledning.",
            "After that you'll receive a welcome email with key info, address and arrival instructions."
          )}
        </>
      ),
    },
  ];

  return (
    <section className={styles.wrap} aria-labelledby="bp-title">
      <h2 id="bp-title" className={styles.title}>
        {t("Sådan foregår en booking", "How the booking works")}
      </h2>

      <p className={styles.lead}>
        {t(
          "Det er en forespørgsel – ikke en øjeblikkelig reservation. Vi vender hurtigt tilbage med enten lejekontrakt eller et venligt afslag.",
          "It's a request, not an instant reservation. We'll quickly reply with either a rental agreement or a polite decline."
        )}
      </p>

      <ol
        className={styles.list}
        aria-label={t("Bookingproces", "Booking process")}
      >
        {steps.map((s, i) => (
          <li key={i} className={styles.item}>
            <div className={styles.badge} aria-hidden>
              {i + 1}
            </div>
            <div>
              <div className={styles.itemTitle}>{s.title}</div>
              <div className={styles.itemBody}>{s.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.note} role="note">
        <strong>{t("Husregler kort:", "House rules, short:")}</strong>{" "}
        {t(
          `ingen fester, ingen rene ungdomsgrupper under ${minAge} år, og vis hensyn til naboerne. Max ${maxGuests} gæster.`,
          `no parties, no youth-only groups under ${minAge}, and please respect the neighbours. Max ${maxGuests} guests.`
        )}{" "}
        {t("Læs mere her:", "Read more here:")}{" "}
        <a href={pathOf(lang, "fees")} target="_blank" rel="noreferrer">
          {t("gebyroversigt", "fee list")}
        </a>{" "}
        ·{" "}
        <a href={pathOf(lang, "privacy")} target="_blank" rel="noreferrer">
          {t("privatlivspolitik", "privacy policy")}
        </a>
        .
      </div>
    </section>
  );
}
