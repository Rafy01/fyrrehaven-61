import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import Head from "../../lib/Head";
import type { Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";

export default function NotFound({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  return (
    <>
      <Head
        lang={lang}
        path={pathOf(lang, "home")}
        title={t("Side ikke fundet | Fyrrehaven 61", "Page not found | Fyrrehaven 61")}
        description={t(
          "Den ønskede side findes ikke.",
          "The page you requested could not be found."
        )}
        noindex
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
