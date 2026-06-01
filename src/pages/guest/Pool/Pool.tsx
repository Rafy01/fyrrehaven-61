// src/pages/guest/[lang]/Pool.tsx

import Head from "../../../lib/Head";
import type { Lang } from "../../../lib/lang";
import { useCallback } from "react";
import styles from "./Pool.module.css";
import Accordion from "../../../components/Accordion/Accordion";
import { guestPathOf } from "../../../lib/routes";

export default function PoolPage({ lang }: { lang: Lang }) {
  const t = useCallback(
    (da: string, en: string) => (lang === "da" ? da : en),
    [lang]
  );

  const items = [
    {
      id: "duckkey",
      title: t("Pool tag nøgle", "Pool cover key"),
      content: (
        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/pool_nogle.webp"
          alt={t("Pool tag nøgle", "Pool cover key")}
          className={styles.image}
        />
      ),
    },
    {
      id: "keyhole",
      title: t("Nøglehul til pooltag", "Keyhole for pool cover"),
      content: (
        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/pool_noglehuk.webp"
          alt={t("Nøglehul til pooltag", "Keyhole for pool cover")}
          className={styles.image}
        />
      ),
    },
  ];

  return (
    <>
      <Head
        lang={lang}
        path={guestPathOf(lang, "pool")}
        title={t("Pool – Maj 2026", "Pool – May 2026")}
        description={t(
          "Sådan bruger og åbner I poolen ved sommerhuset.",
          "How to use and open the pool at the holiday home."
        )}
        noindex
      />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>{t("POOL", "POOL")}</h1>
        <p className={styles.subtitle}>{t("– Maj 2026", "– May 2026")}</p>

        <div className={styles.warningBox}>
          <strong>
            ⚠️{" "}
            {t(
              "For at spare strøm og varme anbefales det at bade med pooltaget lukket på kolde dage",
              "Swimming takes place with the pool cover closed on cold days to save electricity and heating"
            )}
          </strong>
          <br />
          <span>
            {t(
              "I bedes venligst ikke have hele pool taget åbent i længere tid. Poolen kan tilgås via den indbyggede dør.",
              "Please avoid leaving the entire pool cover open for a long time. The pool is accessible via the built-in door."
            )}
          </span>
        </div>

        <section className={styles.section}>
          <h2>{t("Regler og brug", "Rules and use")}</h2>
          <ul>
            <li>
              {t(
                "Temperaturen i pool er ca. mellem 24–28 grader",
                "Pool temperature is approx. 24–28 degrees Celsius"
              )}
            </li>
            <li>{t("1,5 meter dyb", "1.5 meter deep")}</li>
            <li>
              {t(
                "Pool bliver automatisk fyldt med vand og kemikalier",
                "Pool is automatically filled with water and chemicals"
              )}
            </li>
            <li>{t("Ingen hovedspring", "No diving")}</li>
            <li>
              <em>
                {t(
                  "Alt teknik står i skuret og kan styres via app, I bedes derfor kontakt os ved problemer!",
                  "All equipment is in the shed and can be controlled via app, please contact us if you have any issues!"
                )}
              </em>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t("Klargøring", "Preparation")}</h2>
          <ol>
            <li>
              {t(
                "Brug “ande” nøglen til at låse poolen op (se billeder)",
                'Use the "duck" key to unlock the pool (see photos)'
              )}
            </li>
            <li>
              {t(
                "Pool taget kan nu skubbes ud eller døren åbnes",
                "The pool cover can now be slid open or the door opened"
              )}
            </li>
            <li>
              {t(
                "Fjern pool cover og læg det i skuret (foldes eller rulles sammen)",
                "Remove pool cover and place it in the shed (can be folded or rolled up)"
              )}
            </li>
          </ol>
        </section>

        <Accordion items={items} defaultOpenId="duckkey" />
      </div>
    </>
  );
}
