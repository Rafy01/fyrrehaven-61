/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/guest/CheckInOut.tsx

import { useEffect, useState } from "react";
import Head from "../../../lib/Head";
import { useTranslation } from "react-i18next";
import Accordion from "../../../components/Accordion/Accordion";
import Form, { type Field } from "../../../components/Form/Form";
import { guestPathOf } from "../../../lib/routes";
import type { Lang } from "../../../lib/lang";
import styles from "./CheckInOut.module.css";

function isPoolOpen(today = new Date()) {
  const month = today.getMonth() + 1;
  const date = today.getDate();

  return month > 5 && month < 10
    ? true
    : (month === 5 && date >= 1) || (month === 10 && date <= 1);
}

export default function CheckInOut() {
  const { i18n, t: tg } = useTranslation("guest");
  const lang: Lang = i18n.language.startsWith("da")
    ? "da"
    : i18n.language.startsWith("de")
    ? "de"
    : "en";

  const [poolOpen, setPoolOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // 🔁 Brugt til at nulstille formen

  useEffect(() => {
    setPoolOpen(isPoolOpen());

    if (typeof window !== "undefined") {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    }
  }, []);

  if (isMobile === null) {
    return null;
  }

  if (!isMobile) {
    return (
      <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <h2>{tg("checkInOutPage.desktopTitle")}</h2>
        <p>{tg("checkInOutPage.mobileOnly")}</p>
      </div>
    );
  }

  const handleSubmit = async (
    values: Record<string, string | FileList | boolean>
  ) => {
    setIsSending(true);
    setSuccess(false);
    setError(null);

    try {
      const formData = new FormData();

      for (const key in values) {
        const value = values[key];
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else {
          formData.append(key, String(value));
        }
      }

      const res = await fetch("/api/checkin", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = tg("checkInOutPage.unknownError");
        try {
          const data = await res.json();
          errorMessage = data?.detail || errorMessage;
        } catch {
          // Ingen JSON body – behold standardbesked
        }
        setError(errorMessage);
        return;
      }

      setSuccess(true);
      setFormKey((k) => k + 1); // 🧼 Nulstil formularen
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err?.message || tg("checkInOutPage.fallbackError"));
    } finally {
      setIsSending(false);
    }
  };

  const fields: Field[] = [
    {
      type: "text",
      name: "name",
      label: tg("checkInOutPage.fields.name.label"),
      required: true,
      placeholder: tg("checkInOutPage.fields.name.placeholder"),
    },
    {
      type: "text",
      name: "keycode",
      label: tg("checkInOutPage.fields.keycode.label"),
      required: true,
      placeholder: tg("checkInOutPage.fields.keycode.placeholder"),
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
      label: tg("checkInOutPage.fields.checkType.label"),
      required: true,
      options: [
        { label: tg("checkInOutPage.fields.checkType.checkin"), value: "checkin" },
        { label: tg("checkInOutPage.fields.checkType.checkout"), value: "checkout" },
      ],
    },
    {
      type: "number",
      name: "elReading",
      label: tg("checkInOutPage.fields.elReading"),
      required: true,
      placeholder: "12345",
    },
    {
      type: "number",
      name: "waterHouse",
      label: tg("checkInOutPage.fields.waterHouse"),
      required: true,
      placeholder: "6789",
    },
    ...(poolOpen
      ? [
          {
            type: "number" as const,
            name: "waterPool",
            label: tg("checkInOutPage.fields.waterPool"),
            required: true,
            placeholder: "1122",
          },
        ]
      : []),
    {
      type: "file",
      name: "meterImages",
      label: tg("checkInOutPage.fields.meterImages.label"),
      required: true,
      multiple: true,
      description: tg("checkInOutPage.fields.meterImages.description"),
    },
    {
      type: "textarea",
      name: "comment",
      label: tg("checkInOutPage.fields.comment.label"),
      placeholder: tg("checkInOutPage.fields.comment.placeholder"),
    },
    {
      type: "checkbox",
      name: "consent",
      label: tg("checkInOutPage.fields.consent"),
      required: true,
    },
  ];

  const accordionItems = [
    {
      id: "el",
      titleKey: "accordion.checkInOut.el",
      content: (
        <div className={styles.meterGuide}>
          <img
            src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/IMG_3418.webp"
            alt={tg("accordion.checkInOut.elAlt")}
            className={styles.image}
          />
          <p>{tg("accordion.checkInOut.elLocation")}</p>
        </div>
      ),
    },
    {
      id: "water",
      titleKey: "accordion.checkInOut.water",
      content: (
        <div className={styles.meterGuide}>
          <img
            src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/IMG_3411.webp"
            alt={tg("accordion.checkInOut.waterAlt")}
            className={styles.image}
          />
          <p>{tg("accordion.checkInOut.waterLocation")}</p>
        </div>
      ),
    },
    poolOpen && {
      id: "poolwater",
      titleKey: "accordion.checkInOut.poolWater",
      content: (
        <div className={styles.meterGuide}>
          <img
            src="https://media.fyrrehaven-61.dk/wp-content/uploads/2026/06/pool_aflaesning.webp"
            alt={tg("accordion.checkInOut.poolWaterReadingAlt")}
            className={styles.image}
          />
          <p>{tg("accordion.checkInOut.poolWaterLocation")}</p>
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <>
      <Head
        title={tg("checkInOutPage.title")}
        description={tg("checkInOutPage.description")}
        lang={lang}
        path={guestPathOf(lang, "checkInOut")}
      />
      <div style={{ margin: "0 auto", padding: "1rem" }}>
        <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
          {tg("checkInOutPage.title")}
        </h1>
        <Form
          key={formKey} // 🧼 Force reset
          fields={fields}
          onSubmit={handleSubmit}
          submitLabel={tg("checkInOutPage.submit")}
        />

        {isSending && (
          <p style={{ textAlign: "center", color: "#888", marginTop: "1rem" }}>
            {tg("checkInOutPage.sending")}
          </p>
        )}

        {success && (
          <p style={{ textAlign: "center", color: "green", marginTop: "1rem" }}>
            ✅ {tg("checkInOutPage.success")}
          </p>
        )}

        {error && (
          <p style={{ textAlign: "center", color: "red", marginTop: "1rem" }}>
            ❌ {tg("checkInOutPage.errorLabel")} {error}
          </p>
        )}

        <Accordion items={accordionItems as any} i18nNs="guest" />
      </div>
    </>
  );
}
