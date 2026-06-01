import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import Head from "../../lib/Head";
import { chooseLang } from "../../lib/lang";
import type { Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";

export default function NotFound({ lang }: { lang: Lang }) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const seo = getSeoMeta(lang, "notFound");

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "home")}
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        robots={seo.robots}
      />
      <Container size="3">
        <Flex direction="column" gap="4" py="9" align="center">
          <Heading size="8">404</Heading>
          <Text size="5" color="gray" align="center">
            {t(
              "Beklager – den side findes ikke.",
              "Sorry – that page does not exist."
            )}
          </Text>
          <Link to={pathOf(lang, "home")}>
            {t("Til forsiden", "Back to home")}
          </Link>
        </Flex>
      </Container>
    </>
  );
}
