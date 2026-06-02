// src/pages/guest/[lang]/Pool.tsx

import Head from "../../../lib/Head";
import type { Lang } from "../../../lib/lang";
import { useTranslation } from "react-i18next";
import styles from "./Pool.module.css";
import Accordion from "../../../components/Accordion/Accordion";
import { guestPathOf } from "../../../lib/routes";

export default function PoolPage({ lang }: { lang: Lang }) {
  const { t: tg } = useTranslation("guest");

  const items = [
    {
      id: "duckkey",
      titleKey: "accordion.pool.duckkey",
      content: (
        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/pool_nogle.webp"
          alt={tg("accordion.pool.duckkey")}
          className={styles.image}
        />
      ),
    },
    {
      id: "keyhole",
      titleKey: "accordion.pool.keyhole",
      content: (
        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/pool_noglehuk.webp"
          alt={tg("accordion.pool.keyhole")}
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
        title={tg("poolPage.seo.title")}
        description={tg("poolPage.seo.description")}
        noindex
      />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>{tg("poolPage.title")}</h1>
        <p className={styles.subtitle}>{tg("poolPage.subtitle")}</p>

        <div className={styles.warningBox}>
          <strong>
            ⚠️ {tg("poolPage.warning.title")}
          </strong>
          <br />
          <span>{tg("poolPage.warning.body")}</span>
        </div>

        <section className={styles.section}>
          <h2>{tg("poolPage.rules.title")}</h2>
          <ul>
            <li>{tg("poolPage.rules.temperature")}</li>
            <li>{tg("poolPage.rules.depth")}</li>
            <li>{tg("poolPage.rules.automatic")}</li>
            <li>{tg("poolPage.rules.noDiving")}</li>
            <li>
              <em>{tg("poolPage.rules.tech")}</em>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{tg("poolPage.preparation.title")}</h2>
          <ol>
            <li>{tg("poolPage.preparation.unlock")}</li>
            <li>{tg("poolPage.preparation.open")}</li>
            <li>{tg("poolPage.preparation.cover")}</li>
          </ol>
        </section>

        <Accordion items={items} defaultOpenId="duckkey" i18nNs="guest" />
      </div>
    </>
  );
}
