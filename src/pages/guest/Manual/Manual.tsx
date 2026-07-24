// src/pages/guest/Manual.tsx

import Head from "../../../lib/Head";
import Accordion from "../../../components/Accordion/Accordion";
import type { Lang } from "../../../lib/lang";
import styles from "./Manual.module.css";
import Buttons from "../../../components/Buttons";
import Hero from "../../../components/Hero";
import { guestPathOf } from "../../../lib/routes";
import { useTranslation } from "react-i18next";

type Props = { lang: Lang };

export default function Manual({ lang }: Props) {
  const { t: tg } = useTranslation("guest");
  const title = tg("manualPage.title");
  const description = tg("manualPage.description");

  const saunaUrl = guestPathOf(lang, "sauna");
  const hottubUrl = guestPathOf(lang, "spa");
  const poolUrl = guestPathOf(lang, "pool");
  const meterReadingUrl = guestPathOf(lang, "checkInOut");

  const duringStayItems = [
    {
      id: "wifi",
      titleKey: "accordion.manual.during.wifi.title",
      content: (
        <p>
          {tg("accordion.manual.during.wifi.name")}
          <br />
          {tg("accordion.manual.during.wifi.password")}
          <br />
          {tg("accordion.manual.during.wifi.speed")}
          <br />
          {tg("accordion.manual.during.wifi.coverage")}
        </p>
      ),
    },
    {
      id: "espresso",
      titleKey: "accordion.manual.during.espresso.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.during.espresso.beans")}</li>
          <li>{tg("accordion.manual.during.espresso.clean")}</li>
          <li>{tg("accordion.manual.during.espresso.empty")}</li>
        </ul>
      ),
    },
    {
      id: "foldedoer",
      titleKey: "accordion.manual.during.foldingDoor.title",
      content: <p>{tg("accordion.manual.during.foldingDoor.body")}</p>,
    },
    {
      id: "adgang",
      titleKey: "accordion.manual.during.access.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.during.access.shed")}</li>
          <li>{tg("accordion.manual.during.access.annex")}</li>
        </ul>
      ),
    },
    {
      id: "roeg",
      titleKey: "accordion.manual.during.smoking.title",
      content: <p>{tg("accordion.manual.during.smoking.body")}</p>,
    },
    {
      id: "pool",
      titleKey: "accordion.manual.during.pool.title",
      content: <p>{tg("accordion.manual.during.pool.body")}</p>,
    },
    {
      id: "tv",
      titleKey: "accordion.manual.during.tv.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.during.tv.streaming")}</li>
          <li>{tg("accordion.manual.during.tv.cast")}</li>
        </ul>
      ),
    },
    {
      id: "vaske",
      titleKey: "accordion.manual.during.washer.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.during.washer.free")}</li>
          <li>{tg("accordion.manual.during.washer.program")}</li>
          <li>{tg("accordion.manual.during.washer.water")}</li>
        </ul>
      ),
    },
    {
      id: "elbil",
      titleKey: "accordion.manual.during.ev.title",
      content: <p>{tg("accordion.manual.during.ev.body")}</p>,
    },
    {
      id: "sensor",
      titleKey: "accordion.manual.during.safety.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.during.safety.sensors")}</li>
          <li>{tg("accordion.manual.during.safety.temp")}</li>
          <li>{tg("accordion.manual.during.safety.video")}</li>
        </ul>
      ),
    },
  ];

  const afterStayItems = [
    {
      id: "oprydning",
      titleKey: "accordion.manual.after.tidying.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.after.tidying.house")}</li>
          <li>{tg("accordion.manual.after.tidying.packed")}</li>
        </ul>
      ),
    },
    {
      id: "opvasker",
      titleKey: "accordion.manual.after.dishwasher.title",
      content: <p>{tg("accordion.manual.after.dishwasher.body")}</p>,
    },
    {
      id: "kaffemaskine",
      titleKey: "accordion.manual.after.espresso.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.after.espresso.waste")}</li>
          <li>{tg("accordion.manual.after.espresso.water")}</li>
          <li>{tg("accordion.manual.after.espresso.tray")}</li>
        </ul>
      ),
    },
    {
      id: "affald",
      titleKey: "accordion.manual.after.trash.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.after.trash.sort")}</li>
          <li>{tg("accordion.manual.after.trash.bottles")}</li>
        </ul>
      ),
    },
    {
      id: "lys",
      titleKey: "accordion.manual.after.lights.title",
      content: <p>{tg("accordion.manual.after.lights.body")}</p>,
    },
    {
      id: "udendoers",
      titleKey: "accordion.manual.after.outdoor.title",
      content: <p>{tg("accordion.manual.after.outdoor.body")}</p>,
    },
    {
      id: "grill",
      titleKey: "accordion.manual.after.grill.title",
      content: <p>{tg("accordion.manual.after.grill.body")}</p>,
    },
    {
      id: "aktivitetsrum",
      titleKey: "accordion.manual.after.activityRoom.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.after.activityRoom.accessories")}</li>
          <li>{tg("accordion.manual.after.activityRoom.tabletop")}</li>
          <li>{tg("accordion.manual.after.activityRoom.chairs")}</li>
          <li>{tg("accordion.manual.after.activityRoom.fridge")}</li>
          <li>{tg("accordion.manual.after.activityRoom.power")}</li>
        </ul>
      ),
    },
    {
      id: "laas",
      titleKey: "accordion.manual.after.lock.title",
      content: (
        <ul>
          <li>{tg("accordion.manual.after.lock.windows")}</li>
          <li>{tg("accordion.manual.after.lock.key")}</li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <Head
        lang={lang}
        path={guestPathOf(lang, "manual")}
        title={title}
        description={description}
        ogImage="/images/guest-welcome.jpg"
        ogImageAlt={tg("manualPage.imageAlt")}
        noindex
      />

      <Hero
        title={tg("manualPage.hero.title")}
        subtitle={tg("manualPage.hero.subtitle")}
      />
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.quickLinks}>
            <Buttons
              to={poolUrl}
              label={tg("manualPage.quickLinks.pool")}
              variant="secondary"
            />
            <Buttons
              to={hottubUrl}
              label={tg("manualPage.quickLinks.hotTub")}
              variant="secondary"
            />
            <Buttons
              to={saunaUrl}
              label={tg("manualPage.quickLinks.sauna")}
              variant="secondary"
            />
          </div>
        </div>

        <div className={styles.noticeBox}>
          <p>
            <strong>{tg("manualPage.notice.label")}</strong>{" "}
            {tg("manualPage.notice.body")}
          </p>

          <p>
            {tg("manualPage.notice.meterLinkIntro")}
            <a className={styles.textLink} href={meterReadingUrl}>
              {tg("manualPage.notice.meterLink")}
            </a>
            .
          </p>

          <ol>
            <li>{tg("manualPage.notice.electricity")}</li>
            <li>{tg("manualPage.notice.houseWater")}</li>
            <li>{tg("manualPage.notice.poolWater")}</li>
          </ol>
        </div>
      </div>
      <div className={styles.manualContainer}>
        <h1>{tg("manualPage.stayTitle")}</h1>
        <Accordion items={duringStayItems} defaultOpenId="wifi" i18nNs="guest" />
        <h2 id="theend">{tg("manualPage.afterTitle")}</h2>
        <Accordion items={afterStayItems} i18nNs="guest" />
      </div>
    </>
  );
}
