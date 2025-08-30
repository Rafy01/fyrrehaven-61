// src/app/App.tsx
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Theme, Container, Box } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import "../theme/tokens.css";
import Footer from "../components/Footer";
import { saveLang, type Lang } from "../lib/lang";

export default function App({ lang }: { lang: Lang }) {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    i18n.changeLanguage(lang);
    saveLang(lang); // 👈 husk valget
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", "ltr");
  }, [lang, i18n, location.pathname]);

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
      <Footer lang={lang} />
    </Theme>
  );
}
