import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/Contact/index.tsx (eller ContactPage.tsx afhængigt af din struktur)
import { Container, Box, Heading } from "@radix-ui/themes";
import Head from "../../lib/Head";
import Hero from "../../components/Hero";
import ContactForm from "../../components/ContactForm";
import HostsSection from "../../components/HostsSection";
import { pathOf } from "../../lib/routes";
import { AIRBNB_URL } from "../../lib/links";
export default function ContactPage({ lang }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const path = pathOf(lang, "contact");
    const seoTitle = t("Kontakt Fyrrehaven 61 – spørgsmål om booking og ophold", "Contact Fyrrehaven 61 – questions about booking and stays");
    const seoDescription = t("Har du spørgsmål til datoer, priser, faciliteter eller særlige ønsker? Send os en besked via formularen — vi svarer typisk samme dag. Al kommunikation foregår via e-mail, og dine oplysninger behandles efter vores privatlivspolitik.", "Got questions about dates, pricing, amenities or special requests? Send us a message — we usually reply the same day. All communication is handled by email and your data is processed under our privacy policy.");
    const seoKeywords = lang === "da"
        ? [
            "kontakt",
            "Fyrrehaven 61",
            "sommerhus Fjellerup",
            "spørgsmål booking",
            "udlejning sommerhus",
            "familievenligt sommerhus",
            "pool vildmarksbad sauna",
            "Djursland ferie",
            "book direkte",
            "Airbnb kontakt",
        ]
        : [
            "contact",
            "Fyrrehaven 61",
            "holiday home Fjellerup",
            "booking questions",
            "holiday rental",
            "family friendly cottage",
            "pool hot tub sauna",
            "Djursland Denmark",
            "book direct",
            "Airbnb contact",
        ];
    return (_jsxs(_Fragment, { children: [_jsx(Head, { lang: lang, path: path, title: seoTitle, description: seoDescription, ogImage: "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg", jsonLd: {
                    "@context": "https://schema.org",
                    "@type": "ContactPage",
                    name: t("Kontakt os", "Contact us"),
                    description: t("Spørgsmål eller forespørgsler? Skriv til os her.", "Questions or requests? Send us a message here."),
                    url: `https://fyrrehaven-61.dk${path}`,
                }, robots: { index: true, follow: true, noarchive: true }, keywords: seoKeywords }), _jsx(Hero, { title: t("Kontakt os", "Contact us"), subtitle: t("Vi svarer normalt hurtigt – ofte inden for få timer.", "We usually reply quickly — often within a few hours."), badges: [
                    t("Familievenligt", "Family-friendly"),
                    t("Tæt på strand", "Near the beach"),
                ], media: {
                    type: "image",
                    src: "/hosts/familien.webp",
                    alt: t("Familien bag huset", "The family behind the house"),
                }, align: "left", primaryCta: {
                    label: t("Book direkte", "Book directly"),
                    to: pathOf(lang, "book"),
                }, secondaryCta: {
                    label: t("Booking Airbnb", "Booking Airbnb"),
                    href: AIRBNB_URL,
                    external: true,
                } }), _jsx(HostsSection, { lang: lang, ctaAnchor: "#contact", titleDa: "M\u00F8d v\u00E6rterne", titleEn: "Meet your hosts", subtitleDa: "Personlig hj\u00E6lp og hurtige svar \u2013 vi er kun en besked v\u00E6k.", subtitleEn: "Personal help and quick replies \u2014 we\u2019re just a message away." }), _jsx(Container, { size: "3", id: "contact", children: _jsxs(Box, { py: "6", children: [_jsx(Heading, { size: "6", mb: "2", children: t("Skriv til os", "Send us a message") }), _jsx(Box, { mt: "4", children: _jsx(ContactForm, { lang: lang, submitUrl: "/api/contact", variant: "contact" }) })] }) })] }));
}
