import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/Book/Book.tsx
import { Container, Box, Heading, Text } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import { pathOf } from "../../lib/routes";
import styles from "./Book.module.css";
import { AIRBNB_URL } from "../../lib/links";
// Hvis du har en index-barrel for AvailabilityCalendar, kan du bruge
//  import AvailabilityCalendar from "../../components/AvailabilityCalendar";
// men denne direkte sti virker altid:
import ContactForm from "../../components/ContactForm";
export default function Book({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const path = pathOf(lang, "book");
    /** ——— SEO ——— */
    // Title 30–65 tegn
    const seoTitle = t("Booking hos Fyrrehaven 61 – direkte forespørgsel eller Airbnb", "Book Fyrrehaven 61 – direct request or Airbnb");
    // Description 120–320 tegn
    const seoDescription = t("Book direkte hos værterne eller via Airbnb. Udendørs opvarmet pool (1. maj–1. okt.), plads til 10 og familievenligt nær skov og strand. Vi svarer typisk inden for 1 time. El 4 kr./kWh og vand 80 kr./m³ afregnes efter opholdet.", "Book directly with the hosts or via Airbnb. Heated outdo or pool (May 1–Oct 1), sleeps 10 and family-friendly near forest and beach. We usually reply within 1 hour. Electricity 4 DKK/kWh and water 80 DKK/m³ are settled after your stay.");
    const seoKeywords = lang === "da"
        ? [
            "booking sommerhus",
            "Fyrrehaven 61 booking",
            "sommerhus Fjellerup",
            "udendørs opvarmet pool",
            "vildmarksbad",
            "sauna",
            "familievenligt sommerhus",
            "book direkte",
            "Airbnb Fjellerup",
            "Djursland feriehus",
        ]
        : [
            "holiday home booking",
            "Fyrrehaven 61 booking",
            "Fjellerup cottage",
            "heated outdoor pool",
            "hot tub",
            "sauna",
            "family friendly rental",
            "book direct",
            "Airbnb Fjellerup",
            "Djursland holiday home",
        ];
    // Struktureret data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        name: "Fyrrehaven 61",
        url: `https://fyrrehaven-61.dk${path}`,
        description: seoDescription,
        address: {
            "@type": "PostalAddress",
            streetAddress: "Fyrrehaven 61",
            postalCode: "8585",
            addressLocality: "Glesborg",
            addressCountry: "DK",
        },
        potentialAction: {
            "@type": "ReserveAction",
            target: `https://fyrrehaven-61.dk${path}`,
        },
    };
    /** ——— Hero ——— */
    const heroTitle = t("Booking", "Booking");
    const heroSubtitle = t("Forespørg direkte hos os – eller book via Airbnb, hvis du foretrækker det.", "Send a direct request – or book via Airbnb if you prefer.");
    // Aktuel måned til kalenderen
    return (_jsxs(_Fragment, { children: [_jsx(Head, { lang: lang, path: path, title: seoTitle, description: seoDescription, ogImage: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg", jsonLd: jsonLd, robots: { index: true, follow: true, noarchive: true }, keywords: seoKeywords }), _jsx(Hero, { title: heroTitle, subtitle: heroSubtitle, badges: [
                    t("Opvarmet udendørs pool (1/5–1/10)", "Heated outdoor pool (May–Oct)"),
                    t("Plads til 10 gæster", "Sleeps 10 guests"),
                    t("Familievenligt", "Family friendly"),
                ], 
                // primaryCta={{
                //   label: t("Anmod om booking", "Request booking"),
                //   to: pathOf(lang, "book") + "#booking",
                // }}
                // Brug ekstern href til Airbnb for at undgå router-redirects
                secondaryCta: AIRBNB_URL
                    ? {
                        label: t("Booking Airbnb", "Booking Airbnb"),
                        href: AIRBNB_URL,
                        external: true,
                    }
                    : undefined, media: {
                    type: "image",
                    src: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3807.webp",
                    alt: t("Booking af feriehus ved Fjellerup", "Book the holiday home in Fjellerup"),
                }, align: "left", layout: "media-right" }), _jsx(Container, { size: "3", children: _jsxs(Box, { py: "6", children: [_jsx(Heading, { as: "h2", size: "4", mb: "2", children: t("Hvordan vil du booke?", "How would you like to book?") }), _jsx(Text, { size: "2", mb: "4", color: "gray", children: t("Du kan enten sende os en direkte forespørgsel via formularen nedenfor, eller du kan booke via Airbnb, hvis du foretrækker det. Vi svarer normalt inden for 1 time", "You can either send us a direct request using the form below, or you can book via Airbnb if you prefer. We usually respond within 1 hour.") }), _jsxs("div", { className: styles.note, children: [_jsx(Heading, { as: "h3", size: "3", mb: "1", children: t("Praktisk", "Good to know") }), _jsx(Text, { children: t("Udendørs pool er opvarmet ca. 29 °C og åben 1. maj – 1. oktober. Maks. 10 personer. Ingen fester.", "Outdoor pool heated to ~29 °C and open May 1 – Oct 1. Max 10 guests. No parties.") }), _jsx("br", {}), _jsx(Text, { children: t("El: 4 kr./kWh, vand: 80 kr./m³ (afregnes efter opholdet).", "Electricity: 4 DKK/kWh, water: 80 DKK/m³ (settled after your stay).") })] })] }) }), _jsx(ContactForm, { lang: lang, submitUrl: "/api/contact", variant: "booking", ctaAnchor: "#booking" })] }));
}
