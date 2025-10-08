/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/guest/CheckInOut.tsx

import { useEffect, useState } from "react";
import Head from "../../../lib/Head";
import { useTranslation } from "react-i18next";
import Accordion from "../../../components/Accordion/Accordion";
import Form, { type Field } from "../../../components/Form/Form";


const POOL_SEASON = {
  start: new Date("2025-05-01"),
  end: new Date("2025-10-01"),
};

function isPoolOpen(today = new Date()) {
  return today >= POOL_SEASON.start && today <= POOL_SEASON.end;
}

export default function CheckInOut() {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("da") ? "da" : "en";
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  const [poolOpen, setPoolOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // default true for SSR

  useEffect(() => {
    setPoolOpen(isPoolOpen());

    // Check device width (client-side only)
    if (typeof window !== "undefined") {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    }
  }, []);

  if (!isMobile) {
    return (
      <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <h2>{t("Tjek-ind og Tjek-ud", "Check-in and Check-out")}</h2>
        <p>
          {t(
            "– Denne side er kun tilgænglig via en mobil telefon",
            "– This page is only accessible via a mobile device"
          )}
        </p>
      </div>
    );
  }

  const handleSubmit = (
    values: Record<string, string | FileList | boolean>
  ) => {
    console.log("Form submitted:", values);
    // TODO: Send to backend/email
  };

  const fields: Field[] = [
    {
      type: "text",
      name: "name",
      label: t("Navn", "Name"),
      required: true,
      placeholder: t("Lejer navn", "Renter name"),
    },
    {
      type: "text",
      name: "keycode",
      label: t("Nøgleboks kode", "Keybox code"),
      required: true,
      placeholder: t("Indtast kode", "Enter code"),
    },
    {
      type: "email",
      name: "email",
      label: "Email",
      required: true,
      placeholder: "john@doe.dk",
    },
    {
      type: "select",
      name: "checkType",
      label: t("Tjek-ind eller Tjek-ud", "Check-in or Check-out"),
      required: true,
      options: [
        { label: t("Tjek-ind", "Check-in"), value: "checkin" },
        { label: t("Tjek-ud", "Check-out"), value: "checkout" },
      ],
    },
    {
      type: "number",
      name: "elReading",
      label: t("EL måler aflæsning", "Electricity meter reading"),
      required: true,
      placeholder: "12345",
    },
    {
      type: "number",
      name: "waterHouse",
      label: t("Vand (huset)", "Water (house)"),
      required: true,
      placeholder: "6789",
    },
    ...(poolOpen
      ? [
          {
            type: "number" as const,
            name: "waterPool",
            label: t("Vand (pool)", "Water (pool)"),
            required: true,
            placeholder: "1122",
          },
        ]
      : []),
    {
      type: "file",
      name: "meterImages",
      label: t("Billede af aflæsning", "Reading photo"),
      required: true,
      multiple: true,
      description: t(
        "Verificer med billeder af jeres aflæsning og brug blitz på el-måleren.",
        "Verify with photos of your reading. Use flash on the electricity meter."
      ),
    },
    {
      type: "textarea",
      name: "comment",
      label: t("Kommentar", "Comment"),
      placeholder: t("Skriv din kommentar her", "Write your comment here"),
    },
    {
      type: "checkbox",
      name: "consent",
      label: t(
        "Jeg giver samtykke til, at mine oplysninger må bruges til at behandle min henvendelse.",
        "I consent to my information being used to process my request."
      ),
      required: true,
    },
  ];

  const accordionItems = [
    {
      id: "el",
      title: t("Placering af EL-måler", "Location of electricity meter"),
      content: (
        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/el-maaler.webp"
          alt={t("EL-måler placering", "Electricity meter location")}
        />
      ),
    },
    {
      id: "water",
      title: t("Placering af vandmåler (hus)", "Water meter location (house)"),
      content: (
        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/vand-hus.webp"
          alt={t("Vandmåler i huset", "Water meter in house")}
        />
      ),
    },
    poolOpen && {
      id: "poolwater",
      title: t("Placering af vandmåler (pool)", "Water meter location (pool)"),
      content: (
        <img
          src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/vand-pool.webp"
          alt={t("Vandmåler ved pool", "Water meter at pool")}
        />
      ),
    },
  ].filter(Boolean);

  return (
    <>
      <Head
        title={t("Tjek-ind og ud", "Check-in and out")}
        description={t(
          "Mobilside til aflæsning af el og vandmåler",
          "Mobile page for reading electricity and water meters"
        )}
        lang={lang}
        path={`/guest/${lang}/check-in-out`}
      />
      <div style={{ margin: "0 auto", padding: "1rem" }}>
        <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
          {t("Tjek-ind og ud", "Check-in and out")}
        </h1>
        <Form
          fields={fields}
          onSubmit={handleSubmit}
          submitLabel={t("Send aflæsning", "Submit reading")}
        />
        <Accordion items={accordionItems as any} />
      </div>
    </>
  );
}
