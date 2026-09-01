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
import { UI_ICONS } from "../../../lib/icons";
import imageCompression from "browser-image-compression";
import styles from "./CheckInOut.module.css";

// Keep the client-side target aligned with the server defaults so a normal
// 3-photo guest upload is allowed without being aggressively compressed away.
const TARGET_CHECKIN_UPLOAD_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_CLIENT_IMAGE_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_CHECKIN_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

const CHECKIN_IMAGE_TARGET_DIMENSION = 1080;
const CHECKIN_UPLOAD_TIMEOUT_MS = 45000;
const CHECKIN_IMAGE_COMPRESSION_STEPS = [
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.78 },
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.66 },
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.56 },
  { maxDimension: CHECKIN_IMAGE_TARGET_DIMENSION, quality: 0.48 },
];

type PreparedImageEntry = {
  sourceSignature: string;
  sourceFile: File;
  preparedFile: File;
  label: string;
  status?: "success" | "error";
  message?: string;
};

const METER_IMAGE_FIELD_NAMES = [
  "meterImagesElectricity",
  "meterImagesWaterHouse",
  "meterImagesWaterPool",
] as const;

function collectMeterImageFiles(
  values: Record<string, string | FileList | boolean>
): File[] {
  const files: File[] = [];
  for (const fieldName of METER_IMAGE_FIELD_NAMES) {
    const value = values[fieldName];
    if (value instanceof FileList) {
      files.push(...Array.from(value));
    }
  }
  return files;
}

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

function fileDisplayLabel(file: File) {
  return `${file.name} (${formatFileSize(file.size)})`;
}

function fileUploadStatus(file: File): "success" | "error" {
  return file.size <= MAX_CHECKIN_IMAGE_UPLOAD_BYTES ? "success" : "error";
}

function fileUploadMessage(file: File, message: string) {
  return file.size <= MAX_CHECKIN_IMAGE_UPLOAD_BYTES ? undefined : message;
}

function fileItemSignature(file: File) {
  return [file.name, file.size, file.type, file.lastModified].join(":");
}

function fileListSignature(value: unknown) {
  if (!(value instanceof FileList)) return "";
  return Array.from(value)
    .map(fileItemSignature)
    .join("|");
}

function canCompressImage(file: File) {
  return (
    file.size <= MAX_CLIENT_IMAGE_SOURCE_BYTES &&
    ["image/jpeg", "image/png", "image/webp"].includes(file.type)
  );
}

function calculateTotalSize(files: File[]) {
  return files.reduce((total, file) => total + file.size, 0);
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function compressImageFile(
  file: File,
  maxDimension: number,
  quality: number
) {
  if (typeof document === "undefined" || !canCompressImage(file)) {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: MAX_CHECKIN_IMAGE_UPLOAD_BYTES / 1024 / 1024,
      maxWidthOrHeight: maxDimension,
      initialQuality: quality,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
    if (compressedFile.size >= file.size) return file;

    console.log(
      `[Compress] ${file.name}: ${formatFileSize(file.size)} -> ${formatFileSize(compressedFile.size)} at quality ${quality}`
    );
    return new File(
      [compressedFile],
      file.name.replace(/\.(jpe?g|png|webp)$/i, ".jpg"),
      { type: "image/jpeg", lastModified: file.lastModified }
    );
  } catch (error) {
    console.warn(`[Compress Error] ${file.name}:`, error);
    return file;
  }
}

async function prepareImageFiles(originalFiles: File[]) {
  let currentFiles = originalFiles;
  for (const step of CHECKIN_IMAGE_COMPRESSION_STEPS) {
    currentFiles = await Promise.all(
      currentFiles.map((file) =>
        compressImageFile(file, step.maxDimension, step.quality)
      )
    );
    if (calculateTotalSize(currentFiles) <= TARGET_CHECKIN_UPLOAD_TOTAL_BYTES) {
      return currentFiles;
    }
  }

  return currentFiles;
}

async function prepareCheckinImages(value: FileList | File[]) {
  return prepareImageFiles(Array.from(value));
}

function postFormData(
  url: string,
  body: FormData,
  headers: Record<string, string>
) {
  return new Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<any>;
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = CHECKIN_UPLOAD_TIMEOUT_MS;

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.onerror = () => reject(new Error("UPLOAD_NETWORK_ERROR"));
    xhr.ontimeout = () => reject(new Error("UPLOAD_TIMEOUT"));
    xhr.onload = () => {
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => {
          if (!xhr.responseText) return {};
          try {
            return JSON.parse(xhr.responseText);
          } catch {
            return {
              ok: false,
              error: "UNREADABLE_SERVER_RESPONSE",
              detail: `The upload server returned an unreadable response${
                xhr.status ? ` (HTTP ${xhr.status})` : ""
              }. Please try again with screenshots of the meter photos.`,
            };
          }
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
  const [preparedImageLabels, setPreparedImageLabels] = useState<string[]>([]);
  const [preparedImageStatuses, setPreparedImageStatuses] = useState<
    ("success" | "error" | undefined)[]
  >([]);
  const [preparedImageMessages, setPreparedImageMessages] = useState<
    (string | undefined)[]
  >([]);
  const [draftValues, setDraftValues] = useState<
    Record<string, string | FileList | boolean>
  >({});
  const draftIdRef = useRef(createFormDraftId("guest-checkin"));
  const imagePreparationJobRef = useRef(0);
  const imagePreparationPromiseRef = useRef<Promise<void> | null>(null);
  const preparedMeterImagesRef = useRef<{
    signature: string;
    files: File[];
    entries: PreparedImageEntry[];
  } | null>(null);
  const meterGuideRef = useRef<HTMLDivElement | null>(null);

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
      const files = collectMeterImageFiles(values).map((file) => ({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }));

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

      if (!signature) {
        preparedMeterImagesRef.current = null;
        setPreparedImageLabels([]);
        setPreparedImageStatuses([]);
        setPreparedImageMessages([]);
        setError(null);
        return;
      }

      const originalFiles = value instanceof FileList ? Array.from(value) : [];
      const previousEntries = new Map(
        (preparedMeterImagesRef.current?.entries || []).map((entry) => [
          entry.sourceSignature,
          entry,
        ])
      );
      let entries: PreparedImageEntry[] = originalFiles.map((file) => {
        const sourceSignature = fileItemSignature(file);
        const previous = previousEntries.get(sourceSignature);
        if (previous) return { ...previous, sourceFile: file };
        return {
          sourceSignature,
          sourceFile: file,
          preparedFile: file,
          label: fileDisplayLabel(file),
        };
      });

      const publishEntries = (nextEntries: PreparedImageEntry[]) => {
        setPreparedImageLabels(nextEntries.map((entry) => entry.label));
        setPreparedImageStatuses(nextEntries.map((entry) => entry.status));
        setPreparedImageMessages(nextEntries.map((entry) => entry.message));
      };

      const oversizedFileIndexes = entries.reduce<number[]>(
        (indexes, entry, index) =>
          entry.sourceFile.size > MAX_CLIENT_IMAGE_SOURCE_BYTES
            ? [...indexes, index]
            : indexes,
        []
      );

      if (oversizedFileIndexes.length) {
        const errorMessage = tg("checkInOutPage.errors.fileTooLarge");
        const inlineErrorMessage = tg("checkInOutPage.errors.fileTooLargeInline");
        const stillTooLargeMessage = tg(
          "checkInOutPage.errors.fileStillTooLargeInline"
        );
        entries = entries.map((entry, index) =>
          oversizedFileIndexes.includes(index)
            ? {
                ...entry,
                preparedFile: entry.sourceFile,
                label: fileDisplayLabel(entry.sourceFile),
                status: "error",
                message: inlineErrorMessage,
              }
            : previousEntries.has(entry.sourceSignature)
              ? entry
              : {
                  ...entry,
                  preparedFile: entry.sourceFile,
                  label: fileDisplayLabel(entry.sourceFile),
                  status: fileUploadStatus(entry.sourceFile),
                  message: fileUploadMessage(
                    entry.sourceFile,
                    stillTooLargeMessage
                  ),
                }
        );
        preparedMeterImagesRef.current = {
          signature,
          files: entries.map((entry) => entry.preparedFile),
          entries,
        };
        publishEntries(entries);
        setError(errorMessage);
        return;
      }

      setError(null);
      publishEntries(entries);

      try {
        const newEntries = entries
          .map((entry, index) => ({ entry, index }))
          .filter(({ entry }) => !previousEntries.has(entry.sourceSignature));
        const files = await prepareImageFiles(
          newEntries.map(({ entry }) => entry.sourceFile)
        );
        if (imagePreparationJobRef.current !== jobId) return;

        let preparedIndex = 0;
        entries = entries.map((entry) => {
          if (previousEntries.has(entry.sourceSignature)) return entry;
          const preparedFile = files[preparedIndex++] || entry.sourceFile;
          return {
            ...entry,
            preparedFile,
            label: fileDisplayLabel(preparedFile),
            status: fileUploadStatus(preparedFile),
            message: fileUploadMessage(
              preparedFile,
              tg("checkInOutPage.errors.fileStillTooLargeInline")
            ),
          };
        });

        preparedMeterImagesRef.current = {
          signature,
          files: entries.map((entry) => entry.preparedFile),
          entries,
        };
        publishEntries(entries);
        if (
          entries.some(
            (entry) => entry.preparedFile.size > MAX_CHECKIN_IMAGE_UPLOAD_BYTES
          )
        ) {
          setError(tg("checkInOutPage.errors.totalUploadTooLarge"));
        }
      } catch (prepareError) {
        console.error("Image preparation failed:", prepareError);
        if (imagePreparationJobRef.current !== jobId) return;
        entries = entries.map((entry) => {
          if (previousEntries.has(entry.sourceSignature)) return entry;
          return {
            ...entry,
            preparedFile: entry.sourceFile,
            label: fileDisplayLabel(entry.sourceFile),
            status: fileUploadStatus(entry.sourceFile),
            message: fileUploadMessage(
              entry.sourceFile,
              tg("checkInOutPage.errors.fileStillTooLargeInline")
            ),
          };
        });
        preparedMeterImagesRef.current = {
          signature,
          files: entries.map((entry) => entry.preparedFile),
          entries,
        };
        publishEntries(entries);
        if (
          entries.some(
            (entry) => entry.preparedFile.size > MAX_CHECKIN_IMAGE_UPLOAD_BYTES
          )
        ) {
          setError(tg("checkInOutPage.errors.totalUploadTooLarge"));
        }
      }
    },
    [tg]
  );

  const handleValuesChange = useCallback(
    (values: Record<string, string | FileList | boolean>) => {
      setDraftValues(values);
      const meterImages = collectMeterImageFiles(values);
      const nextSignature = meterImages
        .map(fileItemSignature)
        .join("|");
      if (nextSignature === preparedMeterImagesRef.current?.signature) return;
      const preparation = prepareSelectedImages(meterImages);
      imagePreparationPromiseRef.current = preparation;
      void preparation.finally(() => {
        if (imagePreparationPromiseRef.current === preparation) {
          imagePreparationPromiseRef.current = null;
        }
      });
    },
    [prepareSelectedImages]
  );

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
      console.log("[Submit] Starting form submission...");

      if (imagePreparationPromiseRef.current) {
        console.log("[Submit] Waiting for image preparation...");
        await imagePreparationPromiseRef.current;
      }

      const meterFiles = collectMeterImageFiles(values);
      console.log(
        `[Submit] Meter images collected: ${meterFiles.length} files, ${formatFileSize(calculateTotalSize(meterFiles))}`
      );

      const meterImagesSignature = meterFiles
        .map(fileItemSignature)
        .join("|");
      const preparedMeterImages =
        preparedMeterImagesRef.current?.signature === meterImagesSignature
          ? preparedMeterImagesRef.current.files
          : await prepareCheckinImages(meterFiles);

      console.log(
        `[Submit] After compression: ${preparedMeterImages.length} files, ${formatFileSize(calculateTotalSize(preparedMeterImages))}`
      );

      if (
        !preparedMeterImages.length ||
        preparedMeterImages.some(
          (file) => file.size > MAX_CHECKIN_IMAGE_UPLOAD_BYTES
        )
      ) {
        const errorMessage = tg("checkInOutPage.errors.totalUploadTooLarge");
        console.error("[Submit] Validation failed: files too large");
        void saveFormDraft(
          buildDraftPayload(
            values,
            "validation_failed",
            errorMessage,
            "CLIENT_UPLOAD_FILE_TOO_LARGE"
          )
        );
        setError(errorMessage);
        return;
      }

      const requestHeaders = getRequestHeaders ? await getRequestHeaders() : {};
      const formData = new FormData();

      for (const key in values) {
        if (key === "confirmEmail") continue;
        if (METER_IMAGE_FIELD_NAMES.includes(key as any)) continue;

        const value = values[key];
        if (value instanceof FileList) {
          if (key !== "meterImages") {
            Array.from(value).forEach((file) => formData.append(key, file));
          }
        } else {
          formData.append(key, String(value));
        }
      }
      formData.set("clientDraftId", draftIdRef.current);
      preparedMeterImages.forEach((file) => formData.append("meterImages", file));

      console.log("[Submit] Submitting form and images to /api/checkin...");
      const res = await postFormData(
        "/api/checkin",
        formData,
        requestHeaders
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
          console.error("[Submit] Server error:", { errorCode, detail: data?.detail });
        } catch {
          errorMessage = tg("checkInOutPage.errors.serverResponse");
        }
        void saveFormDraft(
          buildDraftPayload(values, "send_failed", errorMessage, errorCode)
        );
        setError(errorMessage);
        return;
      }

      console.log("[Submit] ✓ Form submitted successfully!");
      setSuccess(true);
      setPreparedImageLabels([]);
      setPreparedImageStatuses([]);
      setPreparedImageMessages([]);
      setFormKey((k) => k + 1);
      setFormStartedAt(String(Date.now()));
      draftIdRef.current = createFormDraftId("guest-checkin");
      preparedMeterImagesRef.current = null;
    } catch (err: any) {
      console.error("[Submit] Catch error:", err);
      const rawErrorMessage = String(err?.message || "").trim();
      const errorMessage =
        rawErrorMessage &&
        !["UPLOAD_NETWORK_ERROR", "UPLOAD_TIMEOUT"].includes(rawErrorMessage)
          ? rawErrorMessage
          : tg("checkInOutPage.errors.network");
      void saveFormDraft(
        buildDraftPayload(values, "send_failed", errorMessage, "NETWORK_ERROR")
      );
      setError(errorMessage || err?.message || tg("checkInOutPage.fallbackError"));
    } finally {
      setIsSending(false);
    }
  };

  const scrollToMeterGuide = () => {
    meterGuideRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
      description: tg("checkInOutPage.fields.elReadingDescription"),
      required: true,
      placeholder: "12345",
      fileUpload: {
        name: "meterImagesElectricity",
        accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
        maxFiles: 3,
        multiple: true,
        buttonLabel: "Upload photo",
      },
    },
    {
      type: "text",
      name: "waterHouse",
      label: tg("checkInOutPage.fields.waterHouse"),
      after: (
        <p className={styles.meterReadingHint}>
          {tg("checkInOutPage.fields.waterHouseExamplePrefix")}{" "}
          <span className={styles.meterWhiteDigits}>123</span>
          <span aria-hidden="true">,</span>
          <span className={styles.meterRedDigits}>456</span>
          {tg("checkInOutPage.fields.waterHouseExampleSuffix")}
        </p>
      ),
      inputMode: "decimal",
      required: true,
      placeholder: "123,456",
      fileUpload: {
        name: "meterImagesWaterHouse",
        accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
        maxFiles: 3,
        multiple: true,
        buttonLabel: "Upload photo",
      },
    },
    ...(poolOpen
      ? [
          {
            type: "text" as const,
            name: "waterPool",
            label: tg("checkInOutPage.fields.waterPool"),
            inputMode: "decimal" as const,
            required: true,
            placeholder: "1234",
            fileUpload: {
              name: "meterImagesWaterPool",
              accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
              maxFiles: 3,
              multiple: true,
              buttonLabel: "Upload photo",
            },
          },
        ]
      : []),
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
        <div className={styles.meterLocationPrompt}>
          <div>
            <p className={styles.meterLocationEyebrow}>
              {tg("checkInOutPage.meterLocationPrompt.eyebrow")}
            </p>
            <p className={styles.meterLocationText}>
              {tg("checkInOutPage.meterLocationPrompt.text")}
            </p>
          </div>
          <button
            type="button"
            className={styles.meterGuideButton}
            onClick={scrollToMeterGuide}
          >
            <span>{tg("checkInOutPage.meterLocationPrompt.button")}</span>
            <UI_ICONS.ChevronForward aria-hidden />
          </button>
        </div>
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
          fileDisplayLabels={
            preparedImageLabels.length
              ? { meterImages: preparedImageLabels }
              : undefined
          }
          fileDisplayStatuses={
            preparedImageStatuses.length
              ? { meterImages: preparedImageStatuses }
              : undefined
          }
          fileDisplayMessages={
            preparedImageMessages.length
              ? { meterImages: preparedImageMessages }
              : undefined
          }
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

        <div
          id="meter-location-guide"
          ref={meterGuideRef}
          className={styles.accordionBlock}
        >
          <Accordion items={accordionItems as any} i18nNs="guest" lang={lang} />
        </div>
      </div>
    </>
  );
}
