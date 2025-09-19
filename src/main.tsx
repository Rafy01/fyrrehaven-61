// src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  redirect,
} from "react-router-dom";
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
const langRoutes = (lang: "da" | "en") => [
  { index: true, element: <Home lang={lang} /> },

  { path: SLUGS.house[lang], element: <House lang={lang} /> },
  { path: SLUGS.area[lang], element: <Area lang={lang} /> },
  { path: SLUGS.gallery[lang], element: <Gallery lang={lang} /> },
  { path: SLUGS.faq[lang], element: <Faq lang={lang} /> },
  { path: SLUGS.contact[lang], element: <Contact lang={lang} /> },
  { path: SLUGS.book[lang], element: <Book lang={lang} /> },
  { path: SLUGS.cookies[lang], element: <CookiesPage lang={lang} /> },
  { path: SLUGS.privacy[lang], element: <Privacy lang={lang} /> },
  { path: SLUGS.fees[lang], element: <Fees lang={lang} /> },
  { path: SLUGS.sitemap[lang], element: <Sitemap lang={lang} /> },
];

const router = createBrowserRouter([
  // Root redirect til /{da|en}
  { path: "/", loader: () => redirect(`/${pickInitialLang()}`) },

  // Sprog-rodsider med children
  { path: "/da", element: <App lang="da" />, children: langRoutes("da") },
  { path: "/en", element: <App lang="en" />, children: langRoutes("en") },

  // Debug
  { path: "/debug/chat", element: <ChatDebug /> },

  // Catch-all
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>
);
