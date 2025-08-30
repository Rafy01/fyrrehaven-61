import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Theme, Container, Box } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";

type Lang = "da" | "en";

export default function App({ lang }: { lang: Lang }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  return (
    <Theme accentColor="gray" radius="large" appearance="light">
      <Header lang={lang} />
      <main>
        <Container size="3">
          <Box px="4" py="6">
            <Outlet />
          </Box>
        </Container>
      </main>
    </Theme>
  );
}
