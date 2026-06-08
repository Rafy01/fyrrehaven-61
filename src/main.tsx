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
import House from "./pages/House";
import Area from "./pages/Area";
import Gallery from "./pages/Gallery";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";
import ChatDebug from "./pages/ChatDebug";
import Book from "./pages/Book";
import Privacy from "./pages/Privacy";
import Fees from "./pages/Fees";
import ExtraServices from "./pages/ExtraServices";

// Gæstesider
import GuestWelcome from "./pages/guest/Welcome";
import GuestManual from "./pages/guest/Manual";
import Pool from "./pages/guest/Pool";
import Sauna from "./pages/guest/Sauna";
import Spa from "./pages/guest/Spa";
import PracticalInfo from "./pages/guest/Practical-Info";
import CheckInOut from "./pages/guest/CheckInOut";

// Routing helpers
import { pickInitialLang, type Lang } from "./lib/lang";
import { SLUGS, GUEST_PAGES } from "./lib/routes";

const langRoutes = (lang: Lang) => [
  { index: true, element: <Home lang={lang} /> },
  { path: SLUGS.house[lang], element: <House lang={lang} /> },
  { path: SLUGS.area[lang], element: <Area lang={lang} /> },
  { path: SLUGS.gallery[lang], element: <Gallery lang={lang} /> },
  { path: SLUGS.faq[lang], element: <Faq lang={lang} /> },
  { path: SLUGS.contact[lang], element: <Contact lang={lang} /> },
  { path: SLUGS.book[lang], element: <Book lang={lang} /> },
  { path: SLUGS.privacy[lang], element: <Privacy lang={lang} /> },
  { path: SLUGS.fees[lang], element: <Fees lang={lang} /> },
];

const guestRoutes = (lang: Lang) => [
  { path: GUEST_PAGES.welcome[lang], element: <GuestWelcome lang={lang} /> },
  { path: GUEST_PAGES.manual[lang], element: <GuestManual lang={lang} /> },
  { path: GUEST_PAGES.pool[lang], element: <Pool lang={lang} /> },
  { path: GUEST_PAGES.sauna[lang], element: <Sauna lang={lang} /> },
  { path: GUEST_PAGES.spa[lang], element: <Spa lang={lang} /> },
  {
    path: GUEST_PAGES.practicalInfo[lang],
    element: <PracticalInfo lang={lang} />,
  },
  { path: GUEST_PAGES.checkInOut[lang], element: <CheckInOut /> },
  { path: GUEST_PAGES.extraServices[lang], element: <ExtraServices lang={lang} /> },
];

const router = createBrowserRouter([
  { path: "/", loader: () => redirect(`/${pickInitialLang()}`) },

  { path: "/da", element: <App lang="da" />, children: langRoutes("da") },
  { path: "/en", element: <App lang="en" />, children: langRoutes("en") },
  { path: "/de", element: <App lang="de" />, children: langRoutes("de") },

  {
    path: "/guest/da",
    element: <App lang="da" guest />,
    children: guestRoutes("da"),
  },
  {
    path: "/guest/en",
    element: <App lang="en" guest />,
    children: guestRoutes("en"),
  },
  {
    path: "/guest/de",
    element: <App lang="de" guest />,
    children: guestRoutes("de"),
  },

  { path: "/debug/chat", element: <ChatDebug /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>
);
