import { Container, Box, Heading, Text, Separator } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import Head from "../../lib/Head";
import type { Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import styles from "./Privacy.module.css";

type LabelItem = {
  label: string;
  text: string;
};

const CONTROLLER_NAME = "Fyrrehaven 61";
const CONTROLLER_EMAIL = "kontakt@fyrrehaven-61.dk";
const CONTROLLER_PHONE = "-";

const labelItems = (value: unknown) =>
  Array.isArray(value) ? (value as LabelItem[]) : [];
const strings = (value: unknown) =>
  Array.isArray(value) ? (value as string[]) : [];

export default function Privacy({ lang }: { lang: Lang }) {
  const { t } = useTranslation("privacyPage");
  const path = pathOf(lang, "privacy");
  const seo = getSeoMeta(lang, "privacy");

  const renderBodySection = (key: string) => (
    <section className={styles.section}>
      <Heading as="h2" size="5" mb="2">
        {t(`sections.${key}.title`)}
      </Heading>
      <Text as="p">{t(`sections.${key}.body`)}</Text>
    </section>
  );

  const renderLabelListSection = (key: string) => (
    <section className={styles.section}>
      <Heading as="h2" size="5" mb="2">
        {t(`sections.${key}.title`)}
      </Heading>
      {key === "recipients" ? (
        <Text as="p">{t(`sections.${key}.body`)}</Text>
      ) : null}
      <ul className={styles.list}>
        {labelItems(t(`sections.${key}.items`, { returnObjects: true })).map(
          (item) => (
            <li key={item.label}>
              <strong>{item.label}:</strong> {item.text}
            </li>
          )
        )}
      </ul>
    </section>
  );

  const renderStringListSection = (key: string) => (
    <section className={styles.section}>
      <Heading as="h2" size="5" mb="2">
        {t(`sections.${key}.title`)}
      </Heading>
      <ul className={styles.list}>
        {strings(t(`sections.${key}.items`, { returnObjects: true })).map(
          (item) => (
            <li key={item}>{item}</li>
          )
        )}
      </ul>
      {strings(t(`sections.${key}.paragraphs`, { returnObjects: true })).map(
        (item) => (
          <Text as="p" mt="2" key={item}>
            {item}
          </Text>
        )
      )}
    </section>
  );

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
            {t("title")}
          </Heading>
          <Text className={styles.lead} color="gray">
            {t("lead")}
          </Text>

          <Separator my="5" size="4" />

          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("controller.title")}
            </Heading>
            <Text as="p">
              <strong>{CONTROLLER_NAME}</strong>
              <br />
              {t("controller.address")}
              <br />
              {t("controller.emailLabel")}: {CONTROLLER_EMAIL}
              <br />
              {t("controller.phoneLabel")}: {CONTROLLER_PHONE}
            </Text>
            <Text as="p" mt="2">
              {t("controller.dpo")}
            </Text>
          </section>

          {renderBodySection("scope")}
          {renderLabelListSection("categories")}
          {renderLabelListSection("purposes")}
          {renderBodySection("necessity")}
          {renderLabelListSection("recipients")}

          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("sections.storage.title")}
            </Heading>
            {strings(
              t("sections.storage.paragraphs", { returnObjects: true })
            ).map((item, index) => (
              <Text as="p" mt={index === 0 ? undefined : "2"} key={item}>
                {item}
              </Text>
            ))}
          </section>

          {renderStringListSection("retention")}
          {renderBodySection("cookies")}
          {renderStringListSection("rights")}
          {renderBodySection("automated")}

          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("sections.changes.title")}
            </Heading>
            <Text as="p">{t("sections.changes.body")}</Text>
            <Text as="p" mt="1" color="gray">
              {t("sections.changes.updatedLabel")}:{" "}
              {t("sections.changes.updated")}
            </Text>
          </section>

          <Separator my="6" size="4" />

          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("sections.contact.title")}
            </Heading>
            <Text as="p">{t("sections.contact.body")}</Text>
            <Text as="p" mt="1">
              {CONTROLLER_EMAIL}
            </Text>
          </section>
        </Box>
      </Container>
    </>
  );
}
