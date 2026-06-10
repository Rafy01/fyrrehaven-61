// src/components/BookingProcess/BookingProcess.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import type { Lang } from "../../lib/lang";
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
  const { t } = useTranslation("book");
  const values = { minAge, maxGuests, responseHours };

  const steps: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: t("process.steps.request.title"),
      body: t("process.steps.request.body"),
    },
    {
      title: t("process.steps.review.title"),
      body: (
        <>
          {t("process.steps.review.bodyIntro")}{" "}
          {t("process.steps.review.bodyRules", values)}
        </>
      ),
    },
    {
      title: t("process.steps.reply.title", values),
      body: (
        <>
          {t("process.steps.reply.bodyIntro", values)}{" "}
          {t("process.steps.reply.bodyDetails")}
        </>
      ),
    },
    {
      title: t("process.steps.confirm.title"),
      body: (
        <>
          {t("process.steps.confirm.bodyIntro")}{" "}
          {t("process.steps.confirm.bodyDetails")}
        </>
      ),
    },
  ];

  return (
    <section className={styles.wrap} aria-labelledby="bp-title">
      <h2 id="bp-title" className={styles.title}>
        {t("process.title")}
      </h2>

      <p className={styles.lead}>
        {t("process.lead")}
      </p>

      <ol
        className={styles.list}
        aria-label={t("process.aria")}
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
        <strong>{t("process.note.label")}</strong>{" "}
        {t("process.note.text", values)} {t("process.note.readMore")}{" "}
        <a
          className={styles.textLink}
          href={pathOf(lang, "fees")}
          target="_blank"
          rel="noreferrer"
        >
          {t("process.note.fees")}
        </a>{" "}
        ·{" "}
        <a
          className={styles.textLink}
          href={pathOf(lang, "privacy")}
          target="_blank"
          rel="noreferrer"
        >
          {t("process.note.privacy")}
        </a>
        .
      </div>
    </section>
  );
}
