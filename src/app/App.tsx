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

import "vanilla-cookieconsent/dist/cookieconsent.css";
import "../components/CookieButton/CookieConsentTheme.css";
import MessengerButton from "../components/MessengerButton";
import { setupCookieConsent } from "../lib/cookieConsent";

export type ResolvedAppearance = "light" | "dark";

const APPEARANCE_STORAGE_KEY = "fyrrehaven-appearance";

function readStoredAppearance(): ResolvedAppearance {
  if (typeof window === "undefined") return "light";
  const value = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : getSystemAppearance();
}

function getSystemAppearance(): ResolvedAppearance {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

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
  const [resolvedAppearance, setResolvedAppearance] =
    useState<ResolvedAppearance>(() => readStoredAppearance());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if (window.localStorage.getItem(APPEARANCE_STORAGE_KEY)) return;
      setResolvedAppearance(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = resolvedAppearance;
    html.dataset.appearancePreference = resolvedAppearance;
    html.style.colorScheme = resolvedAppearance;
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, resolvedAppearance);
  }, [resolvedAppearance]);

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
    <Theme accentColor="gray" radius="large" appearance={resolvedAppearance}>
      <Header
        lang={lang}
        guest={guest}
        resolvedAppearance={resolvedAppearance}
        onAppearanceChange={setResolvedAppearance}
      />
      <HashScroll />
      <main>
        <Container size="3">
          <Box px="4" py="6">
            <Outlet />
          </Box>
        </Container>
      </main>
      <Footer lang={lang} guest={guest} resolvedAppearance={resolvedAppearance} />
      <ScrollMemory />
      {showMessengerButton && (
        <MessengerButton onDismiss={() => setShowMessengerButton(false)} />
      )}
    </Theme>
  );
}
