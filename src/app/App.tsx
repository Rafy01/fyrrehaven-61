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
import ScrollMemory from "./ScrollMemory";
import HashScroll from "./HashScroll";
import Gtag from "../components/Analytics/Gtag";
import { Analytics } from "@vercel/analytics/react";

// 🍪 CookieConsent
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import CookieButton from "../components/CookieButton/CookieButton";

export default function App({
  lang,
  guest = false,
}: {
  lang: Lang;
  guest?: boolean;
}) {
  const { i18n } = useTranslation();
  const location = useLocation();

  // 🌐 Skift sprog og sæt HTML-attributter
  useEffect(() => {
    i18n.changeLanguage(lang);
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
               },
               {
                 title: "Statistik",
                 description:
                   "Disse cookies hjælper os med at forstå, hvordan siden bruges.",
                 linkedCategory: "analytics",
               },
               {
                 title: "Marketing",
                 description:
                   "Disse cookies bruges til at vise relevante annoncer.",
                 linkedCategory: "marketing",
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
               },
               {
                 title: "Analytics",
                 description:
                   "These cookies help us understand how the site is used.",
                 linkedCategory: "analytics",
               },
               {
                 title: "Marketing",
                 description: "These cookies are used to show relevant ads.",
                 linkedCategory: "marketing",
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
      <Footer lang={lang} />
      <ScrollMemory />
      <CookieButton />
    </Theme>
  );
}
