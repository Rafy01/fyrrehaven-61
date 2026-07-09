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
import "./index.css";

import App from "./app/App";
import RouteFallback from "./app/RouteFallback";
import Home from "./pages/Home";

// Routing helpers
import { pickInitialLang, type Lang } from "./lib/lang";
import { SLUGS, GUEST_PAGES } from "./lib/routes";

const House = React.lazy(() => import("./pages/House"));
const Area = React.lazy(() => import("./pages/Area"));
const Gallery = React.lazy(() => import("./pages/Gallery"));
const Faq = React.lazy(() => import("./pages/Faq"));
const Contact = React.lazy(() => import("./pages/Contact"));
const ChatDebug = React.lazy(() => import("./pages/ChatDebug"));
const Book = React.lazy(() => import("./pages/Book"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Fees = React.lazy(() => import("./pages/Fees"));
const ExtraServices = React.lazy(() => import("./pages/ExtraServices"));
const AdminForms = React.lazy(() => import("./pages/AdminForms/AdminForms"));

const GuestWelcome = React.lazy(() => import("./pages/guest/Welcome"));
const GuestManual = React.lazy(() => import("./pages/guest/Manual"));
const Pool = React.lazy(() => import("./pages/guest/Pool"));
const Sauna = React.lazy(() => import("./pages/guest/Sauna"));
const Spa = React.lazy(() => import("./pages/guest/Spa"));
const PracticalInfo = React.lazy(() => import("./pages/guest/Practical-Info"));
const CheckInOut = React.lazy(() => import("./pages/guest/CheckInOut"));

function lazyElement(
  element: React.ReactNode,
  key?: string
): React.ReactElement {
  return (
    <React.Suspense fallback={<RouteFallback />} key={key}>
      {element}
    </React.Suspense>
  );
}

const langRoutes = (lang: Lang) => [
  { index: true, element: <Home lang={lang} /> },
  {
    path: SLUGS.house[lang],
    element: lazyElement(<House lang={lang} />, `house-${lang}`),
  },
  {
    path: SLUGS.area[lang],
    element: lazyElement(<Area lang={lang} />, `area-${lang}`),
  },
  {
    path: SLUGS.gallery[lang],
    element: lazyElement(<Gallery lang={lang} />, `gallery-${lang}`),
  },
  {
    path: SLUGS.faq[lang],
    element: lazyElement(<Faq lang={lang} />, `faq-${lang}`),
  },
  {
    path: SLUGS.contact[lang],
    element: lazyElement(<Contact lang={lang} />, `contact-${lang}`),
  },
  {
    path: SLUGS.book[lang],
    element: lazyElement(<Book lang={lang} />, `book-${lang}`),
  },
  {
    path: SLUGS.privacy[lang],
    element: lazyElement(<Privacy lang={lang} />, `privacy-${lang}`),
  },
  {
    path: SLUGS.fees[lang],
    element: lazyElement(<Fees lang={lang} />, `fees-${lang}`),
  },
];

const guestRoutes = (lang: Lang) => [
  {
    path: GUEST_PAGES.welcome[lang],
    element: lazyElement(<GuestWelcome lang={lang} />, `guest-welcome-${lang}`),
  },
  {
    path: GUEST_PAGES.manual[lang],
    element: lazyElement(<GuestManual lang={lang} />, `guest-manual-${lang}`),
  },
  {
    path: GUEST_PAGES.pool[lang],
    element: lazyElement(<Pool lang={lang} />, `guest-pool-${lang}`),
  },
  {
    path: GUEST_PAGES.sauna[lang],
    element: lazyElement(<Sauna lang={lang} />, `guest-sauna-${lang}`),
  },
  {
    path: GUEST_PAGES.spa[lang],
    element: lazyElement(<Spa lang={lang} />, `guest-spa-${lang}`),
  },
  {
    path: GUEST_PAGES.practicalInfo[lang],
    element: lazyElement(
      <PracticalInfo lang={lang} />,
      `guest-practical-${lang}`
    ),
  },
  {
    path: GUEST_PAGES.checkInOut[lang],
    element: lazyElement(<CheckInOut />, `guest-checkin-${lang}`),
  },
  {
    path: GUEST_PAGES.extraServices[lang],
    element: lazyElement(
      <ExtraServices lang={lang} />,
      `guest-extra-services-${lang}`
    ),
  },
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

  { path: "/debug/chat", element: lazyElement(<ChatDebug />, "chat-debug") },
  { path: "/admin", element: lazyElement(<AdminForms />, "admin") },
  { path: "/admin/forms", element: lazyElement(<AdminForms />, "admin-forms") },
  {
    path: "/admin/:submissionId",
    element: lazyElement(<AdminForms />, "admin-submission"),
  },
  {
    path: "/admin/:submissionId/:adminDetail",
    element: lazyElement(<AdminForms />, "admin-submission-detail"),
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>
);
