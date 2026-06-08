import { Button, Container, Heading, Separator, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import type { Lang } from "../../lib/lang";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import * as CookieConsent from "vanilla-cookieconsent";
import { cookieData } from "../../data/cookies";
import styles from "./Cookies.module.css";

const COOKIE_CATEGORIES = ["necessary", "analytics", "marketing"] as const;

export default function Cookies({ lang }: { lang: Lang }) {
  const { t } = useTranslation("cookiesPage");
  const seo = getSeoMeta(lang, "cookies");

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "cookies")}
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        robots={seo.robots}
        keywords={seo.keywords}
      />

      <Container size="3" px="4" py="6">
        <header>
          <Heading as="h1" size="8" mb="2">
            {t("page.title")}
          </Heading>
          <Text size="3" color="gray">
            {t("page.intro")}
          </Text>
          <Button mt="4" onClick={() => CookieConsent.showPreferences()}>
            {t("consent.manageButton")}
          </Button>
        </header>

        <Separator my="5" size="4" />

        <section>
          <Heading as="h2" size="5" mb="2">
            {t("page.typesTitle")}
          </Heading>
          {COOKIE_CATEGORIES.map((category) => (
            <section key={category} className={styles.category}>
              <Heading as="h3" size="4" mb="1">
                {t(`categories.${category}.title`)}
              </Heading>
              <Text as="p" size="3" color="gray">
                {t(`categories.${category}.description`)}
              </Text>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th align="left">{t("table.name")}</th>
                      <th align="left">{t("table.provider")}</th>
                      <th align="left">{t("table.purpose")}</th>
                      <th align="left">{t("table.expiration")}</th>
                      <th align="left">{t("table.type")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookieData[lang][category].map((cookie) => (
                      <tr key={`${category}-${cookie.name}`}>
                        <td>{cookie.name}</td>
                        <td>{cookie.provider}</td>
                        <td>{cookie.purpose}</td>
                        <td>{cookie.duration}</td>
                        <td>{cookie.type.toUpperCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </section>
      </Container>
    </>
  );
}
