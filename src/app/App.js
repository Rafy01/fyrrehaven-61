import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/app/App.tsx
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Theme, Container, Box } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import "../theme/tokens.css";
import Footer from "../components/Footer";
import { saveLang } from "../lib/lang";
import CookieBanner from "../components/Cookies/CookieBanner";
import ScrollMemory from "./ScrollMemory";
import HashScroll from "./HashScroll";
import Gtag from "../components/Analytics/Gtag";
// import ChatWidget from "../components/ChatWidget";
import { Analytics } from "@vercel/analytics/react";
export default function App({ lang }) {
    const { i18n } = useTranslation();
    const location = useLocation();
    useEffect(() => {
        i18n.changeLanguage(lang);
        saveLang(lang); // 👈 husk valget
        const html = document.documentElement;
        html.setAttribute("lang", lang);
        html.setAttribute("dir", "ltr");
    }, [lang, i18n, location.pathname]);
    return (_jsxs(Theme, { accentColor: "gray", radius: "large", appearance: "light", children: [_jsx(Gtag, {}), _jsx(Header, { lang: lang }), _jsx(HashScroll, {}), _jsx(Analytics, {}), _jsx("main", { children: _jsx(Container, { size: "3", children: _jsx(Box, { px: "4", py: "6", children: _jsx(Outlet, {}) }) }) }), _jsx(Footer, { lang: lang }), _jsx(ScrollMemory, {}), _jsx(CookieBanner, { lang: lang })] }));
}
