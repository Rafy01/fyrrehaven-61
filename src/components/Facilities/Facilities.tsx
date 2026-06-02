import styles from "./Facilities.module.css";
import { useTranslation } from "react-i18next";
import type { Lang } from "../../lib/lang";

const CATEGORY_IDS = ["kitchen", "living", "outdoor", "checkin", "rules"];

export default function Facilities({ lang }: { lang: Lang }) {
  const { t } = useTranslation("facilities");
  const bullets = (id: string) =>
    t(`categories.${id}.bullets`, { returnObjects: true }) as unknown as string[];

  return (
    <section className={styles.wrap} aria-label={t("aria")} lang={lang}>
      <header className={styles.header}>
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.intro}>{t("intro")}</p>
      </header>

      <div className={styles.grid}>
        {CATEGORY_IDS.map((id) => (
          <article className={styles.card} key={id}>
            <h3 className={styles.cardTitle}>
              {t(`categories.${id}.title`)}
            </h3>
            <ul className={styles.list}>
              {bullets(id).map((item) => (
                <li className={styles.item} key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
