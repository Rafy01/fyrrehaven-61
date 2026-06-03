// src/app/App.tsx
import { useEffect, useLayoutEffect } from "react";
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

// 🍪 CookieConsent
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import CookieButton from "../components/CookieButton/CookieButton";
import { cookieData } from "../data/cookies";
import CookieCategoryList from "../components/CookieButton/CookieCategoryList";

export default function App({
  lang,
  guest = false,
}: {
  lang: Lang;
  guest?: boolean;
}) {
  const { i18n } = useTranslation();
  const location = useLocation();

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
    CookieConsent.run({
      revision: 1,
      autoShow: true,
      guiOptions: {
        consentModal: {
          layout: "box ",
          position: "right",
          equalWeightButtons: true,
        },
        preferencesModal: {
          layout: "box",
          position: "center",
        },
      },
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: { enabled: false },
        marketing: { enabled: false },
      },
      language: {
        default: lang,
        translations: {
          da: {
            consentModal: {
              title: "Vi bruger cookies 🍪",
              description:
                "Vi bruger cookies for at forbedre din oplevelse. Du bestemmer selv, hvilke du vil acceptere.",
              acceptAllBtn: "Accepter alle",
              acceptNecessaryBtn: "Afvis",
              showPreferencesBtn: "Indstil cookies",
            },
            preferencesModal: {
              title: "Cookieindstillinger",
              acceptAllBtn: "Accepter alle",
              acceptNecessaryBtn: "Kun nødvendige",
              savePreferencesBtn: "Gem indstillinger",
              closeIconLabel: "Luk",
              sections: [
                {
                  title: "Cookiebrug",
                  description:
                    "Vi bruger cookies for at sikre, at siden fungerer og for at indsamle statistik.",
                },
                {
                  title: "Nødvendige cookies",
                  description:
                    "Disse cookies er nødvendige for at siden fungerer og kan ikke fravælges.",
                  linkedCategory: "necessary",
                  cookieTable: cookieData[lang].necessary,
                },
                {
                  title: "Statistik",
                  description: (
                    <>
                      Disse cookies hjælper os med at forstå, hvordan siden
                      bruges.
                      <CookieCategoryList lang={lang} category="analytics" />
                    </>
                  ),
                  linkedCategory: "analytics",
                },
                {
                  title: "Marketing",
                  description:
                    "Disse cookies bruges til at vise relevante annoncer.",
                  linkedCategory: "marketing",
                  cookieTable: cookieData[lang].marketing,
                },
              ],
            },
          },
          en: {
            consentModal: {
              title: "We use cookies 🍪",
              description:
                "We use cookies to improve your experience. You decide what to accept.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
            },
            preferencesModal: {
              title: "Cookie settings",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Only necessary",
              savePreferencesBtn: "Save settings",
              closeIconLabel: "Close",
              sections: [
                {
                  title: "Use of cookies",
                  description:
                    "We use cookies to make the site work and collect statistics.",
                },
                {
                  title: "Necessary cookies",
                  description:
                    "These cookies are essential for the website to function and can't be turned off.",
                  linkedCategory: "necessary",
                  cookieTable: cookieData[lang].necessary,
                },
                {
                  title: "Analytics",
                  description:
                    "These cookies help us understand how the site is used.",
                  linkedCategory: "analytics",
                  cookieTable: cookieData[lang].analytics,
                },
                {
                  title: "Marketing",
                  description: "These cookies are used to show relevant ads.",
                  linkedCategory: "marketing",
                  cookieTable: cookieData[lang].marketing,
                },
              ],
            },
          },
          de: {
            consentModal: {
              title: "Wir verwenden Cookies 🍪",
              description:
                "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Sie entscheiden, welche Sie akzeptieren.",
              acceptAllBtn: "Alle akzeptieren",
              acceptNecessaryBtn: "Ablehnen",
              showPreferencesBtn: "Cookies einstellen",
            },
            preferencesModal: {
              title: "Cookie-Einstellungen",
              acceptAllBtn: "Alle akzeptieren",
              acceptNecessaryBtn: "Nur notwendige",
              savePreferencesBtn: "Einstellungen speichern",
              closeIconLabel: "Schließen",
              sections: [
                {
                  title: "Verwendung von Cookies",
                  description:
                    "Wir verwenden Cookies, damit die Website funktioniert und um Statistiken zu sammeln.",
                },
                {
                  title: "Notwendige Cookies",
                  description:
                    "Diese Cookies sind für das Funktionieren der Website erforderlich und können nicht deaktiviert werden.",
                  linkedCategory: "necessary",
                  cookieTable: cookieData[lang].necessary,
                },
                {
                  title: "Statistik",
                  description:
                    "Diese Cookies helfen uns zu verstehen, wie die Website genutzt wird.",
                  linkedCategory: "analytics",
                  cookieTable: cookieData[lang].analytics,
                },
                {
                  title: "Marketing",
                  description:
                    "Diese Cookies werden verwendet, um relevante Anzeigen anzuzeigen.",
                  linkedCategory: "marketing",
                  cookieTable: cookieData[lang].marketing,
                },
              ],
            },
          },
        },
      },
    } as never);
  }, [lang]);

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
      <CookieButton />
    </Theme>
  );
}
