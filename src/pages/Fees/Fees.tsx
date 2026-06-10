import { Container, Box, Heading, Text, Separator } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import Head from "../../lib/Head";
import type { Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import styles from "./Fees.module.css";
import { fees } from "../../data/fees";

export default function Fees({ lang }: { lang: Lang }) {
  const { t } = useTranslation("fees");
  const path = pathOf(lang, "fees");
  const seo = getSeoMeta(lang, "fees");
  const locale =
    lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB";

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: seo.title,
          description: seo.description,
          url: `https://fyrrehaven-61.dk${path}`,
        }}
        robots={seo.robots}
        keywords={seo.keywords}
      />

      <Container size="3">
        <Box py="6" className={styles.page}>
          <Heading as="h1" size="8" mb="3">
            {t("page.title")}
          </Heading>
          <Text className={styles.lead} as="p">
            {t("page.lead")}
          </Text>

          <Separator my="5" size="4" />

          {/* Vigtig information for booking */}
          <section className={styles.section} aria-labelledby="info-h">
            <Heading id="info-h" as="h2" size="5" mb="2">
              {t("page.infoTitle")}
            </Heading>

            <div className={styles.badges} style={{ marginBottom: ".5rem" }}>
              <span className={styles.badge}>
                {t("page.badges.noParties")}
              </span>
              <span className={styles.badge}>
                {t("page.badges.noPets")}
              </span>
              <span className={styles.badge}>
                {t("page.badges.pool")}
              </span>
            </div>

            <div className={styles.hr} />

            <Text as="p" mb="1">
              <strong>
                {t("page.consumptionTitle")}
              </strong>
            </Text>
            <ul className={styles.list}>
              <li>
                {t("page.consumptionElectricity")}
              </li>
              <li>
                {t("page.consumptionExtras")}
              </li>
            </ul>
          </section>

          <Separator my="5" size="4" />

          {/* Gebyrliste */}
          <section className={styles.section} aria-labelledby="fees-h">
            <Heading id="fees-h" as="h2" size="5" mb="2">
              {t("page.listTitle")}
            </Heading>

            <div className={styles.grid} role="list">
              {fees.map((f) => {
                const title = t(`items.${f.id}.title`);
                const unit = t(`items.${f.id}.unit`, { defaultValue: "" });
                const note = t(`items.${f.id}.note`, { defaultValue: "" });
                return (
                  <div className={styles.row} key={f.id} role="listitem">
                    <div className={styles.item}>
                      <div className={styles.title}>{title}</div>
                      {(unit || note) && (
                        <div className={styles.unit}>
                          {unit}
                          {unit && note ? " · " : ""}
                          {note && <span className={styles.note}>{note}</span>}
                        </div>
                      )}
                      <div className={styles.price}>
                        {f.amountDKK.toLocaleString(locale)}{" "}
                        DKK
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Separator my="6" size="4" />

          <Text as="p" color="gray">
            {t("page.footer")}
          </Text>
        </Box>
      </Container>
    </>
  );
}
