import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Helmet } from "react-helmet-async";
import { SLUGS } from "../../lib/routes";
const labels = {
    da: {
        title: "Sitemap",
        home: "Forside",
        house: "Sommerhuset",
        area: "Området",
        gallery: "Galleri",
        faq: "FAQ",
        contact: "Kontakt",
        book: "Booking",
        cookies: "Cookies",
        fees: "Gebyrer",
        privacy: "Privatlivspolitik",
        xml: "XML sitemap",
    },
    en: {
        title: "Sitemap",
        home: "Home",
        house: "The house",
        area: "Area",
        gallery: "Gallery",
        faq: "FAQ",
        contact: "Contact",
        book: "Book",
        cookies: "Cookies",
        fees: "Fees",
        privacy: "Privacy policy",
        xml: "XML sitemap",
    },
};
const Sitemap = ({ lang }) => {
    const L = labels[lang];
    // Hjælper til at bygge absolut sti pr. side
    const href = (key) => `/${lang}${SLUGS[key][lang] ? `/${SLUGS[key][lang]}` : ""}`;
    return (_jsxs(_Fragment, { children: [_jsxs(Helmet, { children: [_jsx("title", { children: L.title }), _jsx("meta", { name: "robots", content: "noindex,follow" }), _jsx("link", { rel: "canonical", href: `https://fyrrehaven-61.dk/${lang}` }), _jsx("link", { rel: "alternate", href: "https://fyrrehaven-61.dk/da", hrefLang: "da" }), _jsx("link", { rel: "alternate", href: "https://fyrrehaven-61.dk/en", hrefLang: "en" }), _jsx("link", { rel: "alternate", href: `https://fyrrehaven-61.dk/${lang}`, hrefLang: "x-default" })] }), _jsxs("main", { className: "container mx-auto px-4 py-10", children: [_jsx("h1", { className: "text-3xl font-semibold mb-6", children: L.title }), _jsxs("ul", { className: "list-disc pl-6 space-y-2", children: [_jsx("li", { children: _jsx("a", { href: href("home"), children: L.home }) }), _jsx("li", { children: _jsx("a", { href: href("house"), children: L.house }) }), _jsx("li", { children: _jsx("a", { href: href("area"), children: L.area }) }), _jsx("li", { children: _jsx("a", { href: href("gallery"), children: L.gallery }) }), _jsx("li", { children: _jsx("a", { href: href("faq"), children: L.faq }) }), _jsx("li", { children: _jsx("a", { href: href("contact"), children: L.contact }) }), _jsx("li", { children: _jsx("a", { href: href("book"), children: L.book }) }), _jsx("li", { children: _jsx("a", { href: href("fees"), children: L.fees }) }), _jsx("li", { children: _jsx("a", { href: href("privacy"), children: L.privacy }) }), _jsx("li", { children: _jsx("a", { href: href("cookies"), children: L.cookies }) }), _jsx("li", { children: _jsx("a", { href: "/sitemap.xml", children: L.xml }) })] })] })] }));
};
// 🔧 Default export for at matche importen i main.tsx
export default Sitemap;
