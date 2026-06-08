// src/app/App.tsx
import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Theme, Container, Box } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import "../theme/tokens.css";
import Footer from "../components/Footer";
import { saveLang, type Lang } from "../lib/lang";
import ScrollMemory from "./ScrollMemory";
import HashScroll from "./HashScroll";
import Gtag from "../components/Analytics/Gtag";
import { Analytics } from "@vercel/analytics/react";

import "vanilla-cookieconsent/dist/cookieconsent.css";
import "../components/CookieButton/CookieConsentTheme.css";
import CookieButton from "../components/CookieButton/CookieButton";
import MessengerButton from "../components/MessengerButton";
import { setupCookieConsent } from "../lib/cookieConsent";

export default function App({
  lang,
  guest = false,
}: {
  lang: Lang;
  guest?: boolean;
}) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const [showMessengerButton, setShowMessengerButton] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.inputModality = "pointer";

    function onPointerDown() {
      html.dataset.inputModality = "pointer";
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Tab" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        html.dataset.inputModality = "keyboard";
      }
    }

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  // 🌐 Skift sprog og sæt HTML-attributter
  useLayoutEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    saveLang(lang);
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", "ltr");
  }, [lang, i18n, location.pathname]);

  // 🍪 Initier CookieConsent
  useEffect(() => {
    void setupCookieConsent(lang, i18n);
  }, [lang, i18n]);

  return (
    <Theme accentColor="gray" radius="large" appearance="light">
      <Gtag />
      <Header lang={lang} guest={guest} />
      <HashScroll />
      <Analytics />
      <main>
        <Container size="3">
          <Box px="4" py="6">
            <Outlet />
          </Box>
        </Container>
      </main>
      <Footer lang={lang} guest={guest} />
      <ScrollMemory />
      {showMessengerButton && (
        <MessengerButton onDismiss={() => setShowMessengerButton(false)} />
      )}
      <CookieButton lang={lang} />
    </Theme>
  );
}
