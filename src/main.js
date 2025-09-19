import { jsx as _jsx } from "react/jsx-runtime";
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate, redirect, } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "@radix-ui/themes/styles.css";
import "./theme/tokens.css";
import "./i18n";
import App from "./app/App";
import Home from "./pages/Home";
import CookiesPage from "./pages/Cookies";
import House from "./pages/House";
import Area from "./pages/Area";
import Gallery from "./pages/Gallery";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";
import ChatDebug from "./pages/ChatDebug";
import Book from "./pages/Book";
import Privacy from "./pages/Privacy";
import Fees from "./pages/Fees";
import Sitemap from "./pages/Sitemap/Sitemap";
import { pickInitialLang } from "./lib/lang";
import { SLUGS } from "./lib/routes";
// Hjælper til at lave child routes pr. sprog
const langRoutes = (lang) => [
    { index: true, element: _jsx(Home, { lang: lang }) },
    { path: SLUGS.house[lang], element: _jsx(House, { lang: lang }) },
    { path: SLUGS.area[lang], element: _jsx(Area, { lang: lang }) },
    { path: SLUGS.gallery[lang], element: _jsx(Gallery, { lang: lang }) },
    { path: SLUGS.faq[lang], element: _jsx(Faq, { lang: lang }) },
    { path: SLUGS.contact[lang], element: _jsx(Contact, { lang: lang }) },
    { path: SLUGS.book[lang], element: _jsx(Book, { lang: lang }) },
    { path: SLUGS.cookies[lang], element: _jsx(CookiesPage, { lang: lang }) },
    { path: SLUGS.privacy[lang], element: _jsx(Privacy, { lang: lang }) },
    { path: SLUGS.fees[lang], element: _jsx(Fees, { lang: lang }) },
    { path: SLUGS.sitemap[lang], element: _jsx(Sitemap, { lang: lang }) },
];
const router = createBrowserRouter([
    // Root redirect til /{da|en}
    { path: "/", loader: () => redirect(`/${pickInitialLang()}`) },
    // Sprog-rodsider med children
    { path: "/da", element: _jsx(App, { lang: "da" }), children: langRoutes("da") },
    { path: "/en", element: _jsx(App, { lang: "en" }), children: langRoutes("en") },
    // Debug
    { path: "/debug/chat", element: _jsx(ChatDebug, {}) },
    // Catch-all
    { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) },
]);
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(HelmetProvider, { children: _jsx(RouterProvider, { router: router }) }) }));
