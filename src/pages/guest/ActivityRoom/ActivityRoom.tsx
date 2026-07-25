import { useTranslation } from "react-i18next";
import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import type { Lang } from "../../../lib/lang";
import { guestPathOf } from "../../../lib/routes";
import { ACTIVITY_ROOM_IMAGES } from "../../../data/gallery";
import styles from "./ActivityRoom.module.css";

type Props = {
  lang: Lang;
};

export default function ActivityRoom({ lang }: Props) {
  const { i18n } = useTranslation("guest");
  const tg = i18n.getFixedT(lang, "guest");
  const tableSteps = tg("activityRoomPage.table.steps", {
    returnObjects: true,
  }) as string[];
  const tableSafety = tg("activityRoomPage.table.safety", {
    returnObjects: true,
  }) as string[];
  const airHockeySteps = tg("activityRoomPage.airHockey.steps", {
    returnObjects: true,
  }) as string[];
  const dartSteps = tg("activityRoomPage.dart.steps", {
    returnObjects: true,
  }) as string[];
  const projectorSteps = tg("activityRoomPage.projector.steps", {
    returnObjects: true,
  }) as string[];
  const leavingSteps = tg("activityRoomPage.leaving.steps", {
    returnObjects: true,
  }) as string[];
  const images = [
    {
      src: ACTIVITY_ROOM_IMAGES.billiards,
      alt: tg("activityRoomPage.images.billiards"),
    },
    {
      src: ACTIVITY_ROOM_IMAGES.tableTennis,
      alt: tg("activityRoomPage.images.tableTennis"),
    },
    {
      src: ACTIVITY_ROOM_IMAGES.airHockey,
      alt: tg("activityRoomPage.images.airHockey"),
    },
    {
      src: ACTIVITY_ROOM_IMAGES.fridge,
      alt: tg("activityRoomPage.images.fridge"),
    },
  ];

  const items = [
    {
      id: "table",
      titleKey: "activityRoomPage.table.title",
      content: (
        <div className={styles.section}>
          <p>{tg("activityRoomPage.table.intro")}</p>
          <h3>{tg("activityRoomPage.table.howToTitle")}</h3>
          <ol>
            {tableSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <h3>{tg("activityRoomPage.table.safetyTitle")}</h3>
          <ul>
            {tableSafety.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "air-hockey",
      titleKey: "activityRoomPage.airHockey.title",
      content: (
        <ol className={styles.section}>
          {airHockeySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ),
    },
    {
      id: "dart",
      titleKey: "activityRoomPage.dart.title",
      content: (
        <ul className={styles.section}>
          {dartSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "projector",
      titleKey: "activityRoomPage.projector.title",
      content: (
        <ol className={styles.section}>
          {projectorSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ),
    },
    {
      id: "closed-area",
      titleKey: "activityRoomPage.closedArea.title",
      content: (
        <p className={styles.section}>{tg("activityRoomPage.closedArea.body")}</p>
      ),
    },
    {
      id: "leaving",
      titleKey: "activityRoomPage.leaving.title",
      content: (
        <ul className={styles.section}>
          {leavingSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <>
      <Head
        lang={lang}
        path={guestPathOf(lang, "activityRoom")}
        title={tg("activityRoomPage.seo.title")}
        description={tg("activityRoomPage.seo.description")}
        noindex
      />

      <div className={styles.wrapper}>
        <header className={styles.hero}>
          <h1 className={styles.title}>{tg("activityRoomPage.title")}</h1>
          <p className={styles.subtitle}>{tg("activityRoomPage.subtitle")}</p>
        </header>

        <div className={styles.imageGrid} aria-label={tg("activityRoomPage.images.label")}>
          {images.map((image) => (
            <img
              key={image.src}
              className={styles.roomImage}
              src={image.src}
              alt={image.alt}
              loading="lazy"
            />
          ))}
        </div>

        <div className={styles.warningBox}>
          <strong>{tg("activityRoomPage.fridge.title")}</strong>
          <p>{tg("activityRoomPage.fridge.body")}</p>
        </div>

        <Accordion
          items={items}
          defaultOpenId="table"
          i18nNs="guest"
          lang={lang}
        />
      </div>
    </>
  );
}
