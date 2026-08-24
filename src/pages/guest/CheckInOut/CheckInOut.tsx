/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/guest/CheckInOut.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import Head from "../../../lib/Head";
import { useTranslation } from "react-i18next";
import Accordion from "../../../components/Accordion/Accordion";
import Form, { type Field } from "../../../components/Form/Form";
import { guestPathOf } from "../../../lib/routes";
import type { Lang } from "../../../lib/lang";
import { createFormDraftId, saveFormDraft } from "../../../lib/formDraftLog";
import styles from "./CheckInOut.module.css";

const MAX_CHECKIN_UPLOAD_TOTAL_BYTES = 4 * 1024 * 1024;

function isPoolOpen(today = new Date()) {
  const month = today.getMonth() + 1;
  const date = today.getDate();

  return month > 5 && month < 10
    ? true
    : (month === 5 && date >= 1) || (month === 10 && date <= 1);
}

function checkinErrorMessage(
  code: string,
  detail: string,
  tg: (key: string) => string
) {
  switch (code) {
    case "RATE_LIMIT_EXCEEDED":
      return tg("checkInOutPage.errors.rateLimited");
    case "FORM_SUBMITTED_TOO_FAST":
      return tg("checkInOutPage.errors.tooFast");
    case "FORM_EXPIRED":
    case "INVALID_FORM_STATE":
      return tg("checkInOutPage.errors.formExpired");
    case "INVALID_FILE_TYPE":
      return tg("checkInOutPage.errors.invalidFileType");
    case "FILE_TOO_LARGE":
    case "PAYLOAD_TOO_LARGE":
      return tg("checkInOutPage.errors.fileTooLarge");
    case "TOO_MANY_FILES":
      return tg("checkInOutPage.errors.tooManyFiles");
    case "TOO_MANY_FIELDS":
      return tg("checkInOutPage.errors.tooManyFields");
    case "MISSING_FILES":
      return tg("checkInOutPage.errors.missingFiles");
    case "VALIDATION_ERROR":
      return detail || tg("checkInOutPage.errors.validation");
    case "MAIL_AUTH_FAILED":
    case "MAIL_AUTOREPLY_FAILED":
    case "MAIL_ERROR":
    case "ENV_MISSING":
      return tg("checkInOutPage.errors.mail");
    default:
      return detail || tg("checkInOutPage.unknownError");
  }
}

function fileListTotalSize(value: unknown) {
  if (!(value instanceof FileList)) return 0;
  return Array.from(value).reduce((total, file) => total + file.size, 0);
}

export default function CheckInOut({
  adminManual = false,
  getRequestHeaders,
  forceMobile = false,
  langOverride,
}: {
  adminManual?: boolean;
  getRequestHeaders?: () => Promise<Record<string, string>>;
  forceMobile?: boolean;
  langOverride?: Lang;
}) {
  const { i18n } = useTranslation("guest");
  const lang: Lang =
    langOverride ||
    (i18n.language.startsWith("da")
      ? "da"
      : i18n.language.startsWith("de")
        ? "de"
        : "en");
  const tg = i18n.getFixedT(lang, "guest");

  const [poolOpen, setPoolOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formStartedAt, setFormStartedAt] = useState(() => String(Date.now()));
  const [draftValues, setDraftValues] = useState<
    Record<string, string | FileList | boolean>
  >({});
  const draftIdRef = useRef(createFormDraftId("guest-checkin"));

  useEffect(() => {
    setPoolOpen(isPoolOpen());

    if (typeof window !== "undefined") {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    }
  }, []);

  const buildDraftPayload = useCallback(
    (
      values: Record<string, string | FileList | boolean>,
      status: "draft" | "validation_failed" | "send_failed" = "draft",
      formErrorMessage = "",
      formErrorCode = ""
    ) => {
      const files =
        values.meterImages instanceof FileList
          ? Array.from(values.meterImages).map((file) => ({
              filename: file.name,
              contentType: file.type,
              sizeBytes: file.size,
            }))
          : [];

      return {
        clientDraftId: draftIdRef.current,
        intent: "guest-checkin",
        lang,
        status,
        formErrorCode,
        formErrorMessage,
        formLastAction: status === "draft" ? "autosave" : status,
        name: String(values.name || "").trim(),
        email: String(values.email || "").trim(),
        message: String(values.comment || "").trim(),
        consent: values.consent === true,
        checkin: {
          type: String(values.checkType || "").trim(),
          keycode: String(values.keycode || "").trim(),
          meterReadings: {
            electricity: String(values.elReading || "").trim(),
            waterHouse: String(values.waterHouse || "").trim(),
            waterPool: String(values.waterPool || "").trim() || null,
          },
          attachments: files,
        },
        createdAtMs: Number(formStartedAt) || Date.now(),
      };
    },
    [formStartedAt, lang]
  );

  useEffect(() => {
    if (adminManual || success) return;
    const hasDraftData =
      String(draftValues.name || "").trim() ||
      String(draftValues.email || "").trim() ||
      String(draftValues.keycode || "").trim() ||
      String(draftValues.elReading || "").trim() ||
      String(draftValues.waterHouse || "").trim() ||
      draftValues.meterImages instanceof FileList;
    if (!hasDraftData) return;

    const timer = window.setTimeout(() => {
      void saveFormDraft(buildDraftPayload(draftValues));
    }, 900);

    return () => window.clearTimeout(timer);
  }, [adminManual, buildDraftPayload, draftValues, success]);

  if (isMobile === null) {
    return null;
  }

  if (!isMobile && !forceMobile) {
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
      const totalUploadSize = fileListTotalSize(values.meterImages);
      if (totalUploadSize > MAX_CHECKIN_UPLOAD_TOTAL_BYTES) {
        const errorMessage = tg("checkInOutPage.errors.totalUploadTooLarge");
        void saveFormDraft(
          buildDraftPayload(
            values,
            "validation_failed",
            errorMessage,
            "CLIENT_UPLOAD_TOTAL_TOO_LARGE"
          )
        );
        setError(errorMessage);
        return;
      }

      const formData = new FormData();

      for (const key in values) {
        if (key === "confirmEmail") continue;

        const value = values[key];
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else {
          formData.append(key, String(value));
        }
      }
      formData.set("clientDraftId", draftIdRef.current);

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          ...(getRequestHeaders ? await getRequestHeaders() : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = tg("checkInOutPage.unknownError");
        let errorCode = "UNREADABLE_SERVER_RESPONSE";
        try {
          const data = await res.json();
          errorCode = String(data?.error || "");
          errorMessage = checkinErrorMessage(
            errorCode,
            String(data?.detail || ""),
            tg
          );
        } catch {
          errorMessage = tg("checkInOutPage.errors.serverResponse");
        }
        void saveFormDraft(
          buildDraftPayload(values, "send_failed", errorMessage, errorCode)
        );
        setError(errorMessage);
        return;
      }

      setSuccess(true);
      setFormKey((k) => k + 1);
      setFormStartedAt(String(Date.now()));
      draftIdRef.current = createFormDraftId("guest-checkin");
    } catch (err: any) {
      console.error("Submit error:", err);
      const errorMessage = tg("checkInOutPage.errors.network");
      void saveFormDraft(
        buildDraftPayload(values, "send_failed", errorMessage, "NETWORK_ERROR")
      );
      setError(errorMessage || err?.message || tg("checkInOutPage.fallbackError"));
    } finally {
      setIsSending(false);
    }
  };

  const fields: Field[] = [
    {
      type: "hidden",
      name: "website",
      value: "",
    },
    {
      type: "hidden",
      name: "company",
      value: "",
    },
    {
      type: "hidden",
      name: "faxNumber",
      value: "",
    },
    {
      type: "hidden",
      name: "formStartedAt",
      value: formStartedAt,
    },
    {
      type: "hidden",
      name: "lang",
      value: lang,
    },
    {
      type: "hidden",
      name: "adminManualGuestOnly",
      value: adminManual ? "true" : "",
    },
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
      type: "email",
      name: "confirmEmail",
      label: tg("checkInOutPage.fields.confirmEmail"),
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
      accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
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
            src="https://media.fyrrehaven-61.dk/wp-content/uploads/2026/07/pool_watter_meter.webp"
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
          key={formKey}
          fields={fields}
          onSubmit={handleSubmit}
          onValuesChange={setDraftValues}
          onValidationError={(validationErrors) => {
            const firstError = Object.values(validationErrors)[0];
            if (!firstError) return;
            void saveFormDraft(
              buildDraftPayload(
                draftValues,
                "validation_failed",
                firstError,
                "CLIENT_VALIDATION_ERROR"
              )
            );
          }}
          submitLabel={tg("checkInOutPage.submit")}
          lang={lang}
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

        <Accordion items={accordionItems as any} i18nNs="guest" lang={lang} />
      </div>
    </>
  );
}
