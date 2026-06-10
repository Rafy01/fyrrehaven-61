// src/pages/guest/Welcome.tsx
import { useTranslation } from "react-i18next";
import Buttons from "../../../components/Buttons";
import Hero from "../../../components/Hero";
import Head from "../../../lib/Head";
import Typography from "../../../components/Typography";
import styles from "./Welcome.module.css";
import type { Lang } from "../../../lib/lang";
import { guestPathOf } from "../../../lib/routes";

type Props = {
  lang: Lang;
};

export default function GuestWelcome({ lang }: Props) {
  const { t } = useTranslation("guest");

  const manualUrl = guestPathOf(lang, "manual");
  const poolUrl = guestPathOf(lang, "pool");
  const saunaUrl = guestPathOf(lang, "sauna");
  const hotTubUrl = guestPathOf(lang, "spa");
  const endUrl = guestPathOf(lang, "manual", "theend");
  const practicalInfoUrl = guestPathOf(lang, "practicalInfo");

  return (
    <>
      <Head
        lang={lang}
        path={guestPathOf(lang, "welcome")}
        title={t("welcome.title")}
        description={t("welcome.description")}
        ogImage="/images/guest-welcome.jpg"
        ogImageAlt={t("welcome.imageAlt")}
        noindex
      />

      <div>
        <Hero
          title={t("welcome.hero.title")}
          subtitle={t("welcome.hero.subtitle")}
        />

        <Typography>{t("welcome.intro")}</Typography>

        <div className={styles.linkCenter}>
          <Buttons to={manualUrl} label={t("welcome.manualCta")} />
          <Buttons
            to={practicalInfoUrl}
            label={t("welcome.practicalInfoCta")}
            variant="secondary"
          />
        </div>

        <Typography>{t("welcome.arrival")}</Typography>

        <Typography>{t("welcome.meterIntro")}</Typography>

        <Typography as="ul">
          <Typography as="li">{t("welcome.electricityMeter")}</Typography>
          <Typography as="li">{t("welcome.waterMeters")}</Typography>
        </Typography>

        <Typography>{t("welcome.keyBox")}</Typography>

        <Typography>{t("welcome.guideIntro")}</Typography>
        <div className={styles.linkCenter}>
          <Typography as="p">
            <a className={styles.textLink} href={poolUrl}>
              {t("welcome.pool")}
            </a>
          </Typography>
          <Typography as="p">
            <a className={styles.textLink} href={saunaUrl}>
              {t("welcome.sauna")}
            </a>
          </Typography>
          <Typography as="p">
            <a className={styles.textLink} href={hotTubUrl}>
              {t("welcome.hotTub")}
            </a>
          </Typography>
        </div>

        <Typography>{t("welcome.hotTubNote")}</Typography>
        <Typography>{t("welcome.smoking")}</Typography>
        <Typography>{t("welcome.pets")}</Typography>
        <Typography>{t("welcome.departureIntro")}</Typography>

        <div className={styles.linkCenter}>
          <Buttons
            to={endUrl}
            label={t("welcome.departureCta")}
            variant="secondary"
          />
        </div>

        <Typography>{t("welcome.hope")}</Typography>
        <Typography>{t("welcome.share")}</Typography>

        <Typography variant="h2">{t("welcome.addressTitle")}</Typography>

        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/kort_fyrrehaven.webp"
          alt={t("welcome.mapAlt")}
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
            label={t("welcome.googleMaps")}
            buttonType="button"
          />
          <Buttons
            to="https://maps.apple.com/?address=Fyrrehaven%2061,%208585%20Glesborg,%20Danmark&ll=56.510175,10.585733&q=Fyrrehaven%2061&t=h"
            variant="secondary"
            label={t("welcome.appleMaps")}
            buttonType="button"
          />
        </div>
      </div>
    </>
  );
}
