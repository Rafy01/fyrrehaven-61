// src/pages/Sitemap/Sitemap.tsx
import { Container, Box, Heading, Text, Separator } from "@radix-ui/themes";
import Head from "../../lib/Head";
import { pathOf } from "../../lib/routes";

type Lang = "da" | "en";

type LinkItem = {
  href: string;
  labelDa: string;
  labelEn: string;
  descDa?: string;
  descEn?: string;
};

export default function Sitemap({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const path = pathOf(lang, "sitemap");
  const seoTitle = t(
    "Sitemap – alle sider | Fyrrehaven 61",
    "Sitemap – all pages | Fyrrehaven 61"
  );
  const seoDescription = t(
    "Overblik over alle sider: sommerhuset, booking, priser og gebyrer, privatliv, cookies m.m. Se også FAQ, beliggenhed på Djursland og praktisk info.",
    "Overview of all pages: the house, booking, prices and fees, privacy, cookies and more. Also see FAQ, location on Djursland and practical info."
  );

  // Primære links (hold i sync med navigationen)
  const primary: LinkItem[] = [
    { href: pathOf(lang, "home"), labelDa: "Forside", labelEn: "Home" },
    {
      href: pathOf(lang, "house"),
      labelDa: "Sommerhuset",
      labelEn: "The House",
      descDa: "Pool, vildmarksbad, sauna, sovepladser & planløsning",
      descEn: "Pool, hot tub, sauna, sleeping arrangements & layout",
    },
    {
      href: pathOf(lang, "book"),
      labelDa: "Book privat",
      labelEn: "Book privately",
      descDa: "Kalender, priser og forespørgsel",
      descEn: "Calendar, prices and request",
    },
    {
      href: pathOf(lang, "fees"),
      labelDa: "Gebyroversigt",
      labelEn: "Fees",
      descDa: "Rengøring, nøgler, skader m.m.",
      descEn: "Cleaning, keys, damages, etc.",
    },
  ];

  const policies: LinkItem[] = [
    {
      href: pathOf(lang, "privacy"),
      labelDa: "Privatlivspolitik",
      labelEn: "Privacy Policy",
    },
    { href: pathOf(lang, "cookies"), labelDa: "Cookies", labelEn: "Cookies" },
  ];

  const external: LinkItem[] = [
    {
      href: "https://www.airbnb.dk/rooms/1206844672332248112",
      labelDa: "Airbnb-annonce",
      labelEn: "Airbnb listing",
      descDa: "Se kalender, anmeldelser og book via Airbnb",
      descEn: "See calendar, reviews and book via Airbnb",
    },
  ];

  // FAQ-indhold (bruges både i UI og i JSON-LD)
  const faq = [
    {
      qDa: "Hvornår er udendørs pool åben?",
      aDa: "Poolen er typisk åben ca. 1. maj til 1. oktober og opvarmes til omkring 29 °C, afhængigt af vejr og sæson. Tag/overdækning kan lukkes på kølige eller blæsende dage.",
      qEn: "When is the outdoor pool open?",
      aEn: "The pool is typically open around May 1 to Oct 1 and heated to approx. 29 °C, depending on weather and season. The cover/roof can be closed on cooler or windy days.",
    },
    {
      qDa: "Hvor mange gæster kan huset rumme?",
      aDa: "Sommerhuset har plads til op til 10 gæster fordelt på 4 soveværelser + hems. Se detaljer om sengetyper og planløsning på siden “Sommerhuset”.",
      qEn: "How many guests can stay?",
      aEn: "The house accommodates up to 10 guests across 4 bedrooms + loft. See bed types and layout on the “The House” page.",
    },
    {
      qDa: "Hvordan booker jeg?",
      aDa: "Du kan sende en privat bookingforespørgsel via vores kalender eller booke gennem Airbnb. Priserne følger vores offentlige kalender – svar afhænger af sæson og efterspørgsel.",
      qEn: "How do I book?",
      aEn: "You can send a private booking request via our calendar or book through Airbnb. Prices follow our public calendar and vary by season and demand.",
    },
    {
      qDa: "Er rengøring obligatorisk?",
      aDa: "Ja, slutrengøring er obligatorisk. Det sikrer ens standard for alle gæster. Se aktuel sats i gebyroversigten.",
      qEn: "Is cleaning mandatory?",
      aEn: "Yes, end-of-stay cleaning is mandatory to ensure a consistent standard. See the current rate on the fees page.",
    },
    {
      qDa: "Er der vildmarksbad og sauna?",
      aDa: "Ja, huset har brændefyret vildmarksbad samt el-sauna. Læs praktiske råd og sikkerhedstips på “Sommerhuset”.",
      qEn: "Is there a hot tub and sauna?",
      aEn: "Yes, the house offers a wood-fired hot tub and an electric sauna. See practical guidance and safety tips on “The House”.",
    },
    {
      qDa: "Hvor ligger huset – og hvad kan man opleve?",
      aDa: "Huset ligger ved Fjellerup Strand på Djursland, tæt på skov og strand. Korte køreture til bl.a. Djurs Sommerland, Ree Park, Kattegatcentret og Mols Bjerge.",
      qEn: "Where is the house – and what to do nearby?",
      aEn: "The house is in Fjellerup Beach, Djursland, close to forest and beach. Short drives to e.g. Djurs Sommerland, Ree Park, Kattegatcentret and Mols Bjerge.",
    },
  ];

  // JSON-LD: SiteNavigation + Breadcrumb + FAQPage
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SiteNavigationElement",
      name: primary.map((l) => (lang === "da" ? l.labelDa : l.labelEn)),
      url: primary.map((l) => `https://fyrrehaven-61.dk${l.href}`),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("Forside", "Home"),
          item: `https://fyrrehaven-61.dk${pathOf(lang, "home")}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("Sitemap", "Sitemap"),
          item: `https://fyrrehaven-61.dk${path}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: t(f.qDa, f.qEn),
        acceptedAnswer: { "@type": "Answer", text: t(f.aDa, f.aEn) },
      })),
    },
  ];

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seoTitle}
        description={seoDescription}
        ogImage="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage.jpg"
        jsonLd={jsonLd}
      />

      <Container size="3" px="4" py="6">
        <Box mb="4">
          <Heading as="h1" size="8" mb="2">
            {t("Sitemap", "Sitemap")}
          </Heading>
          <Text color="gray">
            {t(
              "Hurtigt overblik over siderne på fyrrehaven-61.dk.",
              "Quick overview of pages on fyrrehaven-61.dk."
            )}
          </Text>
        </Box>

        <Separator my="4" size="4" />

        {/* Primære sider */}
        <nav aria-labelledby="nav-primary">
          <Heading id="nav-primary" as="h2" size="5" mb="2">
            {t("Primære sider", "Primary pages")}
          </Heading>
          <ul className="siteList">
            {primary.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{t(l.labelDa, l.labelEn)}</a>
                {l.descDa && (
                  <small className="muted"> – {t(l.descDa!, l.descEn!)}</small>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <Separator my="4" size="3" />

        {/* Politikker */}
        <nav aria-labelledby="nav-policies">
          <Heading id="nav-policies" as="h2" size="5" mb="2">
            {t("Politikker", "Policies")}
          </Heading>
          <ul className="siteList">
            {policies.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{t(l.labelDa, l.labelEn)}</a>
              </li>
            ))}
          </ul>
        </nav>

        <Separator my="4" size="3" />

        {/* Eksterne links */}
        <nav aria-labelledby="nav-external">
          <Heading id="nav-external" as="h2" size="5" mb="2">
            {t("Eksterne links", "External links")}
          </Heading>
          <ul className="siteList">
            {external.map((l) => (
              <li key={l.href}>
                <a href={l.href} rel="noopener" target="_blank">
                  {t(l.labelDa, l.labelEn)}
                </a>
                {l.descDa && (
                  <small className="muted"> – {t(l.descDa!, l.descEn!)}</small>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* ---------- SEO-TEKST: RIGTIG COPY ---------- */}
        <Separator my="5" size="4" />

        <section aria-labelledby="seo-about">
          <Heading id="seo-about" as="h2" size="6" mb="2">
            {t(
              "Sommerhus ved Fjellerup Strand – poolhus med wellness på Djursland",
              "Holiday home in Fjellerup Beach – pool house with wellness in Djursland"
            )}
          </Heading>
          <Text as="p" mb="3" color="gray">
            {t(
              "Fyrrehaven 61 er et rummeligt sommerhus med udendørs opvarmet pool, brændefyret vildmarksbad og el-sauna – ideelt til familieferie, weekendophold og afslappede uger nær kysten. Huset rummer op til 10 gæster fordelt på 4 soveværelser + hems, og den lyse stue med stort spisebord samler alle til måltider og hygge. Beliggenheden ved Fjellerup Strand på Djursland giver kort afstand til skovstier, strandliv og populære udflugtsmål.",
              "Fyrrehaven 61 is a spacious holiday home featuring an outdoor heated pool, a wood-fired hot tub and an electric sauna – ideal for family breaks, long weekends and relaxed weeks by the coast. Sleeping up to 10 guests across 4 bedrooms + loft, the bright living area with a large dining table brings everyone together. Located in Fjellerup Beach, Djursland, you’re close to forest trails, the shoreline and popular attractions."
            )}
          </Text>
          <ul className="bullets">
            <li>
              <a href={pathOf(lang, "house")}>
                {t("Se hele huset", "Explore the house")}
              </a>{" "}
              ·{" "}
              <a href={`${pathOf(lang, "house")}#wellness`}>
                {t("Pool & wellness", "Pool & wellness")}
              </a>{" "}
              ·{" "}
              <a href={`${pathOf(lang, "house")}#soverum`}>
                {t("Sovepladser", "Sleeping arrangements")}
              </a>
            </li>
            <li>
              <a href={pathOf(lang, "book")}>
                {t(
                  "Book privat – kalender & pris",
                  "Book privately – calendar & price"
                )}
              </a>
            </li>
          </ul>
        </section>

        <Separator my="5" size="4" />

        <section aria-labelledby="seo-booking">
          <Heading id="seo-booking" as="h2" size="6" mb="2">
            {t("Booking, priser og gebyrer", "Booking, prices and fees")}
          </Heading>
          <Text as="p" mb="3" color="gray">
            {t(
              "Du kan enten sende en privat bookingforespørgsel via vores kalender eller booke gennem Airbnb. Priserne tilpasses sæson og efterspørgsel. Slutrengøring er obligatorisk for at sikre en ensartet og høj standard. Se den fulde gebyroversigt, så du har alle informationer samlet før booking.",
              "You can either send a private booking request via our calendar or book through Airbnb. Pricing varies by season and demand. End-of-stay cleaning is mandatory to ensure a consistent, high standard. See the full fee list so you have all information before booking."
            )}
          </Text>
          <ul className="bullets">
            <li>
              <a href={pathOf(lang, "book")}>
                {t(
                  "Kalender & pris (privat booking)",
                  "Calendar & price (private booking)"
                )}
              </a>
            </li>
            <li>
              <a href={pathOf(lang, "fees")}>
                {t("Gebyroversigt", "Fee list")}
              </a>
            </li>
            <li>
              <a
                href="https://www.airbnb.dk/rooms/1206844672332248112"
                target="_blank"
                rel="noopener"
              >
                {t("Airbnb-annonce", "Airbnb listing")}
              </a>
            </li>
          </ul>
        </section>

        <Separator my="5" size="4" />

        <section aria-labelledby="seo-location">
          <Heading id="seo-location" as="h2" size="6" mb="2">
            {t(
              "Beliggenhed & oplevelser på Djursland",
              "Location & things to do in Djursland"
            )}
          </Heading>
          <Text as="p" mb="3" color="gray">
            {t(
              "Fjellerup Strand er kendt for brede sandstrande, skovklædte områder og afslappet feriestemning. Fra huset er der korte køreture til familievenlige attraktioner som Djurs Sommerland, Ree Park, Kattegatcentret og vandreruter i Mols Bjerge. I nærområdet finder du isvafler, cykelstier, fiskeri og hyggelige kystbyer – perfekt til både aktive dage og rolig afslapning.",
              "Fjellerup Beach is known for wide sandy beaches, wooded areas and a relaxed holiday vibe. From the house it’s a short drive to family-friendly attractions such as Djurs Sommerland, Ree Park, the Kattegat Centre and hiking routes in Mols Bjerge. Nearby you’ll find ice-cream spots, cycling paths, fishing and cosy coastal towns – ideal for both active days and laid-back downtime."
            )}
          </Text>
          <ul className="bullets">
            <li>
              <a href={`${pathOf(lang, "house")}#wellness`}>
                {t(
                  "Wellnessområder og udendørsfaciliteter",
                  "Wellness areas & outdoor facilities"
                )}
              </a>
            </li>
            <li>
              <a href={`${pathOf(lang, "house")}#koekken`}>
                {t("Køkken & ophold", "Kitchen & living")}
              </a>
            </li>
          </ul>
        </section>

        <Separator my="5" size="4" />

        {/* FAQ i UI (matcher JSON-LD ovenfor) */}
        <section aria-labelledby="seo-faq">
          <Heading id="seo-faq" as="h2" size="6" mb="2">
            {t("Ofte stillede spørgsmål", "Frequently asked questions")}
          </Heading>
          <div className="faq">
            {faq.map((f, i) => (
              <details key={i}>
                <summary>{t(f.qDa, f.qEn)}</summary>
                <p>{t(f.aDa, f.aEn)}</p>
              </details>
            ))}
          </div>
        </section>
      </Container>

      {/* Lokal stil til sitemap */}
      <style>{`
        .siteList {
          margin: 0 0 1rem;
          padding-left: 1.25rem;
          display: grid;
          gap: 0.4rem;
        }
        .siteList a {
          font-weight: 650;
          text-underline-offset: 2px;
        }
        .muted {
          color: var(--gray-700, #666);
          font-weight: 400;
        }
        .bullets {
          margin: 0.25rem 0 0.5rem;
          padding-left: 1.25rem;
          display: grid;
          gap: 0.25rem;
        }
        .faq details {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          padding: 0.65rem 0.8rem;
          background: #fff;
        }
        .faq details + details {
          margin-top: 0.5rem;
        }
        .faq summary {
          font-weight: 700;
          cursor: pointer;
          outline: none;
        }
        .faq p {
          margin: 0.5rem 0 0;
          color: #333;
        }
      `}</style>
    </>
  );
}
