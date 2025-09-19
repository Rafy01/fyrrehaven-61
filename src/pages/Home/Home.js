import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Separator, Container } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import Highlights from "../../components/Highlights"; // ← NYT
import { pathOf } from "../../lib/routes";
// import { AIRBNB_URL } from "../../lib/links";
import UspStrip from "../../components/UspStrip";
import { ClockIcon, LightningBoltIcon, LockClosedIcon, StarFilledIcon, } from "@radix-ui/react-icons";
import GalleryTeaser from "../../components/GalleryTeaser";
import Reviews from "../../components/Reviews";
import LocationAndDistances from "../../components/LocationAndDistances";
import PracticalInfo from "../../components/PracticalInfo";
import { getPageMeta } from "../../lib/meta";
export default function Home({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    /** ---------- SEO TEKSTER (kun til meta) ---------- */
    const meta = getPageMeta(lang, "house");
    // Keywords (lav vægt i SEO, men kan bruges i metatag)
    const seoKeywords = lang === "da"
        ? [
            "sommerhus fjellerup",
            "sommerhus med pool",
            "opvarmet pool sommerhus",
            "vildmarksbad sommerhus",
            "sauna sommerhus",
            "familievenligt sommerhus",
            "djursland feriehus",
            "Fyrrehaven 61",
            "udlejning privat",
            "sommerhus tæt på strand",
        ]
        : [
            "holiday home fjellerup",
            "holiday home with pool",
            "heated pool holiday home",
            "wood-fired hot tub",
            "sauna holiday home",
            "family friendly cottage",
            "djursland vacation rental",
            "Fyrrehaven 61",
            "private booking",
            "near beach Denmark",
        ];
    /** ---------- HERO TEKSTER (visuelt indhold) ---------- */
    const heroTitle = t("Familievenligt sommerhus i skoven – tæt på stranden", "Family-friendly holiday home in the forest – near the beach");
    const heroSubtitle = t("Indendørs pool, vildmarksbad og god plads til hele familien.", "Indoor pool, hot tub and plenty of space for the whole family.");
    // Structured data for SEO (kan bruge seoDescription uden at påvirke Hero)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VacationRental",
        name: "Fyrrehaven 61",
        description: meta.description,
        url: "https://fyrrehaven-61.dk",
        maximumAttendeeCapacity: 10,
        amenityFeature: [
            {
                "@type": "LocationFeatureSpecification",
                name: t("Indendørs pool", "Indoor pool"),
                value: true,
            },
            {
                "@type": "LocationFeatureSpecification",
                name: t("Vildmarksbad", "Hot tub"),
                value: true,
            },
            {
                "@type": "LocationFeatureSpecification",
                name: t("Tæt på strand", "Near beach"),
                value: true,
            },
        ],
        address: { "@type": "PostalAddress", addressCountry: "DK" },
    };
    return (_jsxs(_Fragment, { children: [_jsx(Head, { lang: lang, path: pathOf(lang, "home"), title: meta.title, description: meta.description, ogImage: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg", jsonLd: jsonLd, robots: { index: true, follow: true, noarchive: true }, keywords: seoKeywords }), _jsx(UspStrip, { ariaLabel: t("Hurtige fakta", "Quick facts"), items: [
                    {
                        icon: _jsx(LightningBoltIcon, {}),
                        text: t("Lynhurtigt svar på henvendelser", "Lightning-fast replies"),
                        ariaLabel: t("Vi svarer hurtigt på alle henvendelser", "We reply quickly to all inquiries"),
                    },
                    {
                        icon: _jsx(LockClosedIcon, {}),
                        text: t("Nem indtjekning (nøgleboks)", "Easy self check-in (key box)"),
                        ariaLabel: t("Gæster modtager kode til nøgleboks og kan tjekke ind uden vært til stede", "Guests receive a key box code and can check in without the host present"),
                    },
                    {
                        icon: _jsx(StarFilledIcon, {}),
                        text: t("4,8+ stjerner på Airbnb", "4.8+ stars on Airbnb"),
                        ariaLabel: t("Gæsterne giver os over 4,8 stjerner på Airbnb", "Guests rate us 4.8+ stars on Airbnb"),
                    },
                    {
                        icon: _jsx(ClockIcon, {}),
                        text: t("+3 års værts erfaring", "+3 years hosting experience"),
                        ariaLabel: t("Mere end tre års erfaring som værter", "More than three years of hosting experience"),
                    },
                ] }), _jsx(Hero, { title: heroTitle, subtitle: heroSubtitle, badges: [
                    t("10 gæster", "10 guests"),
                    t("4 soveværelser", "4 bedrooms"),
                    t("2 badværelser", "2 bathrooms"),
                    t("Pool-Vildmarksbad-Sauna", "Pool-Hottub-Sauna"),
                ], primaryCta: {
                    label: t("Book nu", "Book now"),
                    href: pathOf(lang, "book"),
                }, secondaryCta: {
                    label: t("Se huset", "See the house"),
                    to: pathOf(lang, "house"),
                }, media: {
                    type: "image",
                    src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3736.webp",
                    title: t("Fyrrehaven 61 – feriehus ved Fjellerup Strand", "Fyrrehaven 61 – holiday home by Fjellerup Beach"),
                    alt: t("Skov og strand ved sommerhuset", "Forest and beach near the house"),
                }, align: "left" }), _jsx(Separator, { size: "4" }), _jsx(Container, { size: "3", children: _jsx(Highlights, { title: t("Højdepunkter", "Highlights"), items: [
                        {
                            title: t("Opvarmet udendørs pool", "Heated outdoor pool"),
                            body: t("Åben 1. maj – 1. oktober. Perfekt efter strandturen.", "Open May 1 – Oct 1. Perfect after a beach day."),
                            media: {
                                kind: "image",
                                src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3720.webp",
                                alt: t("Opvarmet udendørs pool – åben 1. maj til 1. oktober", "Heated outdoor pool – open May 1 to Oct 1"),
                                aspect: "4 / 3",
                            },
                        },
                        {
                            title: t("Brændefyret vildmarksbad", "Wood-fired hot tub"),
                            body: t("Autentisk spa-oplevelse med brænde – afslapning under stjernehimlen.", "Authentic wood-fired soak — unwind under the stars."),
                            media: {
                                kind: "image",
                                src: "/highlights/hot-tub-wood.webp",
                                alt: t("Brændefyret vildmarksbad ved Fjellerup Strand", "Wood-fired hot tub at Fjellerup Strand"),
                                aspect: "4 / 3",
                            },
                        },
                        {
                            title: t("Sauna på el", "Electric sauna"),
                            body: t("Hurtig opvarmning og nem betjening – perfekt efter pool eller hav.", "Heats quickly and easy to use — perfect after pool or sea."),
                            media: {
                                kind: "image",
                                src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3731.webp",
                                alt: t("El-sauna i sommerhuset", "Electric sauna in the holiday home"),
                                aspect: "4 / 3",
                            },
                        },
                        {
                            title: t("Fantastisk område", "Fantastic surroundings"),
                            body: t("Skov og strand tæt på – stier, natur og ro i kort afstand.", "Forest and beach nearby — trails, nature and calm close by."),
                            media: {
                                kind: "image",
                                src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3663.webp",
                                alt: t("Skov og strand tæt på sommerhuset", "Forest and beach close to the holiday home"),
                                aspect: "4 / 3",
                            },
                        },
                    ] }) }), _jsx(Separator, { size: "4" }), _jsx(GalleryTeaser, { title: t("Billeder", "Photos"), subtitle: t("Få et hurtigt indtryk – se stue, pool, vildmarksbad og omgivelser.", "Get a quick feel—see the living room, pool, hot tub and surroundings."), items: [
                    {
                        src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3669.webp",
                        alt: t("Stue med lysindfald", "Living room with daylight"),
                    },
                    {
                        src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3668.webp",
                        alt: t("Køkken-alrum", "Kitchen-living area"),
                    },
                    {
                        src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3692.webp",
                        alt: t("Opvarmet udendørs pool", "Heated outdoor pool"),
                    },
                    {
                        src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3696.webp",
                        alt: t("Brændefyret vildmarksbad", "Wood-fired hot tub"),
                    },
                    {
                        src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3709.webp",
                        alt: t("El-sauna", "Electric sauna"),
                    },
                    {
                        src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/2c0c5a11-59f7-4ddf-9fda-10068650f7a1.webp",
                        alt: t("Skovsti mod stranden", "Forest path to the beach"),
                    },
                    // du kan have flere – +N overlay vises automatisk hvis items.length > max
                ], cta: {
                    label: t("Åbn galleri", "Open gallery"),
                    to: pathOf(lang, "gallery"),
                }, align: "center" }), _jsx(Separator, { size: "4" }), _jsx(Reviews, { lang: lang, title: lang === "da" ? "Gæsterne siger" : "What our guests say", average: 4.8 }), _jsx(PracticalInfo, { lang: lang, variant: "teaser", maxItems: 6, ctaHref: pathOf(lang, "house"), ctaLabelDa: "L\u00E6s mere om huset", ctaLabelEn: "Read more about the house" }), _jsx(LocationAndDistances, { lang: lang, mapEmbedUrl: "https://www.google.com/maps/d/embed?mid=144jHAnieVKibH7nlt3mRpmImcWVoKic&ehbc=2E312F", mapLinkUrl: "https://www.google.com/maps/d/viewer?mid=144jHAnieVKibH7nlt3mRpmImcWVoKic", directionsTo: "Fyrrehaven 61, 8500", title: lang === "da" ? "Beliggenhed & afstande" : "Location & distances", subtitle: lang === "da"
                    ? "Skovområde med stier – kort tur til stranden."
                    : "Forest area with trails — a short walk to the beach." })] }));
}
