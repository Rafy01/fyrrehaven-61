/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/guest/CheckInOut.tsx

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import Head from "../../../lib/Head";
import { useTranslation } from "react-i18next";
import Accordion from "../../../components/Accordion/Accordion";
import Form, { type Field } from "../../../components/Form/Form";
import { guestPathOf } from "../../../lib/routes";
import type { Lang } from "../../../lib/lang";
import { createFormDraftId, saveFormDraft } from "../../../lib/formDraftLog";
import styles from "./CheckInOut.module.css";

const MAX_CHECKIN_UPLOAD_TOTAL_BYTES = 3 * 1024 * 1024;
const TARGET_CHECKIN_UPLOAD_TOTAL_BYTES = 2.6 * 1024 * 1024;
const CHECKIN_IMAGE_TARGET_DIMENSION = 1080;
const CHECKIN_IMAGE_COMPRESSION_STEPS = [
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.78 },
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.66 },
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.56 },
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.48 },
];

type ProgressState = {
  phase: "idle" | "compressing" | "ready" | "uploading";
  percent: number;
  message: string;
  detail?: string;
};

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

function filesTotalSize(files: File[]) {
  return files.reduce((total, file) => total + file.size, 0);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileListSignature(value: unknown) {
  if (!(value instanceof FileList)) return "";
  return Array.from(value)
    .map((file) => [file.name, file.size, file.type, file.lastModified].join(":"))
    .join("|");
}

function canCompressImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image could not be prepared for upload."));
    };
    image.src = objectUrl;
  });
}

async function compressImageFile(
  file: File,
  maxDimension: number,
  quality: number
) {
  if (
    typeof document === "undefined" ||
    !canCompressImage(file)
  ) {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob || blob.size >= file.size) return file;

  const filename = file.name.replace(/\.(heic|heif|jpe?g|png|webp)$/i, ".jpg");
  return new File([blob], filename, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

async function prepareCheckinImages(
  value: unknown,
  onProgress?: (percent: number) => void
) {
  if (!(value instanceof FileList)) return [];
  const originalFiles = Array.from(value);
  if (!originalFiles.length) return [];

  let currentFiles = originalFiles;
  for (const step of CHECKIN_IMAGE_COMPRESSION_STEPS) {
    const stepIndex = CHECKIN_IMAGE_COMPRESSION_STEPS.indexOf(step);
    const nextFiles: File[] = [];

    for (const [fileIndex, file] of currentFiles.entries()) {
      nextFiles.push(
        await compressImageFile(file, step.maxDimension, step.quality)
      );
      const completed = stepIndex * currentFiles.length + fileIndex + 1;
      const total = CHECKIN_IMAGE_COMPRESSION_STEPS.length * currentFiles.length;
      onProgress?.(Math.min(95, Math.round((completed / total) * 95)));
    }

    currentFiles = nextFiles;
    if (filesTotalSize(currentFiles) <= TARGET_CHECKIN_UPLOAD_TOTAL_BYTES) {
      onProgress?.(100);
      return currentFiles;
    }
  }

  onProgress?.(100);
  return currentFiles;
}

function postFormDataWithProgress(
  url: string,
  body: FormData,
  headers: Record<string, string>,
  onProgress: (percent: number) => void
) {
  return new Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<any>;
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
    };
    xhr.onerror = () => reject(new Error("UPLOAD_NETWORK_ERROR"));
    xhr.ontimeout = () => reject(new Error("UPLOAD_TIMEOUT"));
    xhr.onload = () => {
      onProgress(100);
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => {
          if (!xhr.responseText) return {};
          return JSON.parse(xhr.responseText);
        },
      });
    };

    xhr.send(body);
  });
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
  const [imageProgress, setImageProgress] = useState<ProgressState>({
    phase: "idle",
    percent: 0,
    message: "",
  });
  const [uploadProgress, setUploadProgress] = useState<ProgressState>({
    phase: "idle",
    percent: 0,
    message: "",
  });
  const [draftValues, setDraftValues] = useState<
    Record<string, string | FileList | boolean>
  >({});
  const draftIdRef = useRef(createFormDraftId("guest-checkin"));
  const imagePreparationJobRef = useRef(0);
  const preparedMeterImagesRef = useRef<{
    signature: string;
    files: File[];
  } | null>(null);

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

  const prepareSelectedImages = useCallback(
    async (value: unknown) => {
      const signature = fileListSignature(value);
      imagePreparationJobRef.current += 1;
      const jobId = imagePreparationJobRef.current;
      preparedMeterImagesRef.current = null;

      if (!signature) {
        setImageProgress({ phase: "idle", percent: 0, message: "" });
        return;
      }

      const originalFiles = value instanceof FileList ? Array.from(value) : [];
      const originalBytes = filesTotalSize(originalFiles);
      setImageProgress({
        phase: "compressing",
        percent: 1,
        message: tg("checkInOutPage.progress.compressing"),
        detail: tg("checkInOutPage.progress.originalSize").replace(
          "{{size}}",
          formatBytes(originalBytes)
        ),
      });

      try {
        const files = await prepareCheckinImages(value, (percent) => {
          if (imagePreparationJobRef.current !== jobId) return;
          setImageProgress((prev) => ({
            ...prev,
            phase: "compressing",
            percent,
          }));
        });
        if (imagePreparationJobRef.current !== jobId) return;

        const preparedBytes = filesTotalSize(files);
        preparedMeterImagesRef.current = { signature, files };
        setImageProgress({
          phase: "ready",
          percent: 100,
          message: tg("checkInOutPage.progress.ready"),
          detail: `${formatBytes(originalBytes)} → ${formatBytes(preparedBytes)}`,
        });
      } catch (prepareError) {
        console.error("Image preparation failed:", prepareError);
        if (imagePreparationJobRef.current !== jobId) return;
        setImageProgress({
          phase: "ready",
          percent: 100,
          message: tg("checkInOutPage.progress.readyOriginal"),
          detail: tg("checkInOutPage.progress.originalSize").replace(
            "{{size}}",
            formatBytes(originalBytes)
          ),
        });
        preparedMeterImagesRef.current = { signature, files: originalFiles };
      }
    },
    [tg]
  );

  const handleValuesChange = useCallback(
    (values: Record<string, string | FileList | boolean>) => {
      setDraftValues(values);
      const nextSignature = fileListSignature(values.meterImages);
      if (nextSignature === preparedMeterImagesRef.current?.signature) return;
      void prepareSelectedImages(values.meterImages);
    },
    [prepareSelectedImages]
  );

  const progressPanel =
    imageProgress.phase !== "idle" || uploadProgress.phase !== "idle" ? (
      <div className={styles.progressPanel} aria-live="polite">
        {[imageProgress, uploadProgress]
          .filter((item) => item.phase !== "idle")
          .map((item) => (
            <div className={styles.progressItem} key={item.phase}>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label={item.message}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.percent}
              >
                <span
                  className={styles.progressBar}
                  style={
                    {
                      "--progress": `${item.percent}%`,
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          ))}
      </div>
    ) : null;

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
      const meterImagesSignature = fileListSignature(values.meterImages);
      const preparedMeterImages =
        preparedMeterImagesRef.current?.signature === meterImagesSignature
          ? preparedMeterImagesRef.current.files
          : await prepareCheckinImages(values.meterImages, (percent) => {
              setImageProgress({
                phase: "compressing",
                percent,
                message: tg("checkInOutPage.progress.compressing"),
              });
            });
      const totalUploadSize = filesTotalSize(preparedMeterImages);
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
          const files =
            key === "meterImages" ? preparedMeterImages : Array.from(value);
          files.forEach((file) => formData.append(key, file));
        } else {
          formData.append(key, String(value));
        }
      }
      formData.set("clientDraftId", draftIdRef.current);

      setUploadProgress({
        phase: "uploading",
        percent: 1,
        message: tg("checkInOutPage.progress.uploading"),
        detail: tg("checkInOutPage.progress.uploadSize").replace(
          "{{size}}",
          formatBytes(totalUploadSize)
        ),
      });

      const res = await postFormDataWithProgress(
        "/api/checkin",
        formData,
        getRequestHeaders ? await getRequestHeaders() : {},
        (percent) =>
          setUploadProgress((prev) => ({
            ...prev,
            phase: "uploading",
            percent,
          }))
      );

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
      setUploadProgress({
        phase: "idle",
        percent: 0,
        message: "",
      });
      setImageProgress({
        phase: "idle",
        percent: 0,
        message: "",
      });
      setFormKey((k) => k + 1);
      setFormStartedAt(String(Date.now()));
      draftIdRef.current = createFormDraftId("guest-checkin");
      preparedMeterImagesRef.current = null;
    } catch (err: any) {
      console.error("Submit error:", err);
      const errorMessage = tg("checkInOutPage.errors.network");
      void saveFormDraft(
        buildDraftPayload(values, "send_failed", errorMessage, "NETWORK_ERROR")
      );
      setError(errorMessage || err?.message || tg("checkInOutPage.fallbackError"));
    } finally {
      setIsSending(false);
      setUploadProgress((prev) =>
        prev.phase === "uploading"
          ? { phase: "idle", percent: 0, message: "" }
          : prev
      );
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
      after: progressPanel,
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
          onValuesChange={handleValuesChange}
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
          <div className={styles.errorNotice} role="alert" aria-live="assertive">
            <div className={styles.errorIcon} aria-hidden="true">
              !
            </div>
            <div>
              <strong>{tg("checkInOutPage.errorTitle")}</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <Accordion items={accordionItems as any} i18nNs="guest" lang={lang} />
      </div>
    </>
  );
}
