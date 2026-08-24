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

const TARGET_CHECKIN_UPLOAD_TOTAL_BYTES = 2.6 * 1024 * 1024;
const MAX_CLIENT_IMAGE_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_CHECKIN_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_CHECKIN_IMAGE_FILES = 6;
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

type PreuploadedAttachment = {
  fieldname: "meterImages";
  filename: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
};

const MIN_FAST_PROGRESS_DURATION_MS = 1200;

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

function fileDisplayLabel(file: File) {
  return `${file.name} (${formatBytes(file.size)})`;
}

function fileUploadStatus(file: File): "success" | "error" {
  return file.size <= MAX_CHECKIN_IMAGE_UPLOAD_BYTES ? "success" : "error";
}

function fileUploadMessage(file: File, message: string) {
  return file.size <= MAX_CHECKIN_IMAGE_UPLOAD_BYTES ? undefined : message;
}

function fileListSignature(value: unknown) {
  if (!(value instanceof FileList)) return "";
  return Array.from(value)
    .map((file) => [file.name, file.size, file.type, file.lastModified].join(":"))
    .join("|");
}

function canCompressImage(file: File) {
  return (
    file.size <= MAX_CLIENT_IMAGE_SOURCE_BYTES &&
    ["image/jpeg", "image/png", "image/webp"].includes(file.type)
  );
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

async function prepareImageFiles(
  originalFiles: File[],
  onProgress?: (fileIndex: number, percent: number) => void
) {
  if (!originalFiles.length) return [];

  let currentFiles = originalFiles;
  for (const step of CHECKIN_IMAGE_COMPRESSION_STEPS) {
    const stepIndex = CHECKIN_IMAGE_COMPRESSION_STEPS.indexOf(step);
    const nextFiles: File[] = [];

    for (const [fileIndex, file] of currentFiles.entries()) {
      nextFiles.push(
        await compressImageFile(file, step.maxDimension, step.quality)
      );
      onProgress?.(
        fileIndex,
        Math.min(
          95,
          Math.round(
            ((stepIndex + 1) / CHECKIN_IMAGE_COMPRESSION_STEPS.length) * 95
          )
        )
      );
    }

    currentFiles = nextFiles;
    if (filesTotalSize(currentFiles) <= TARGET_CHECKIN_UPLOAD_TOTAL_BYTES) {
      currentFiles.forEach((_, fileIndex) => onProgress?.(fileIndex, 100));
      return currentFiles;
    }
  }

  currentFiles.forEach((_, fileIndex) => onProgress?.(fileIndex, 100));
  return currentFiles;
}

async function prepareCheckinImages(
  value: unknown,
  onProgress?: (fileIndex: number, percent: number) => void
) {
  if (!(value instanceof FileList)) return [];
  return prepareImageFiles(Array.from(value), onProgress);
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

async function preuploadCheckinImages(
  files: File[],
  values: Record<string, string | FileList | boolean>,
  clientDraftId: string,
  headers: Record<string, string>,
  onProgress: (fileIndex: number, percent: number) => void
) {
  const attachments: PreuploadedAttachment[] = [];

  for (const [index, file] of files.entries()) {
    const formData = new FormData();
    formData.set("website", String(values.website || ""));
    formData.set("company", String(values.company || ""));
    formData.set("faxNumber", String(values.faxNumber || ""));
    formData.set("clientDraftId", clientDraftId);
    formData.set("formStartedAt", String(values.formStartedAt || ""));
    formData.set("fileIndex", String(index + 1));
    formData.append("meterImage", file);

    const res = await postFormDataWithProgress(
      "/api/checkin-image",
      formData,
      headers,
      (filePercent) => {
        onProgress(index, Math.max(1, Math.min(99, filePercent)));
      }
    );

    const data = await res.json();
    if (!res.ok || !data?.attachment) {
      throw new Error(String(data?.detail || data?.error || "IMAGE_UPLOAD_FAILED"));
    }

    attachments.push(data.attachment);
    onProgress(index, 100);
  }

  return attachments;
}

function ProgressMeter({ item }: { item: ProgressState }) {
  const [displayPercent, setDisplayPercent] = useState(0);
  const displayPercentRef = useRef(0);

  const setAnimatedPercent = (nextPercent: number) => {
    displayPercentRef.current = nextPercent;
    setDisplayPercent(nextPercent);
  };

  useEffect(() => {
    let frameId = 0;
    const from = displayPercentRef.current;
    const to = Math.max(0, Math.min(100, item.percent));
    const distance = Math.abs(to - from);
    const duration =
      to === 100 && from < 30
        ? MIN_FAST_PROGRESS_DURATION_MS
        : Math.max(360, Math.min(MIN_FAST_PROGRESS_DURATION_MS, distance * 16));
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercent(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [item.percent]);

  return (
    <div className={styles.progressItem}>
      <div className={styles.progressLine}>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label={item.message}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayPercent}
        >
          <span
            className={styles.progressBar}
            style={
              {
                "--progress": `${displayPercent}%`,
              } as CSSProperties
            }
          />
        </div>
        <span className={styles.progressPercent}>{displayPercent}%</span>
      </div>
    </div>
  );
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
  const [preparedImageLabels, setPreparedImageLabels] = useState<string[]>([]);
  const [preparedImageStatuses, setPreparedImageStatuses] = useState<
    ("success" | "error")[]
  >([]);
  const [preparedImageMessages, setPreparedImageMessages] = useState<
    (string | undefined)[]
  >([]);
  const [fileUploadProgresses, setFileUploadProgresses] = useState<
    (number | undefined)[]
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
      setPreparedImageLabels([]);
      setPreparedImageStatuses([]);
      setPreparedImageMessages([]);
      setFileUploadProgresses([]);

      if (!signature) {
        setImageProgress({ phase: "idle", percent: 0, message: "" });
        setError(null);
        return;
      }

      const originalFiles = value instanceof FileList ? Array.from(value) : [];
      setPreparedImageLabels(originalFiles.map(fileDisplayLabel));
      setPreparedImageStatuses([]);
      setPreparedImageMessages([]);
      setFileUploadProgresses(originalFiles.map(() => 1));

      const oversizedFileIndexes = originalFiles.reduce<number[]>(
        (indexes, file, index) =>
          file.size > MAX_CLIENT_IMAGE_SOURCE_BYTES
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
        const safeEntries = originalFiles
          .map((file, index) => ({ file, index }))
          .filter(({ index }) => !oversizedFileIndexes.includes(index));
        setFileUploadProgresses(
          originalFiles.map((_, index) =>
            oversizedFileIndexes.includes(index) ? undefined : 1
          )
        );
        const preparedSafeFiles = await prepareImageFiles(
          safeEntries.map(({ file }) => file),
          (safeFileIndex, percent) => {
            if (imagePreparationJobRef.current !== jobId) return;
            const originalIndex = safeEntries[safeFileIndex]?.index;
            if (typeof originalIndex !== "number") return;
            setFileUploadProgresses((prev) => {
              const next = [...prev];
              next[originalIndex] = percent;
              return next;
            });
          }
        );
        if (imagePreparationJobRef.current !== jobId) return;

        let safeIndex = 0;
        const displayFiles = originalFiles.map((file, index) =>
          oversizedFileIndexes.includes(index)
            ? file
            : preparedSafeFiles[safeIndex++] || file
        );
        preparedMeterImagesRef.current = { signature, files: displayFiles };
        setPreparedImageLabels(displayFiles.map(fileDisplayLabel));
        setPreparedImageStatuses(
          displayFiles.map((file, index) =>
            oversizedFileIndexes.includes(index)
              ? "error"
              : fileUploadStatus(file)
          )
        );
        setPreparedImageMessages(
          displayFiles.map((file, index) =>
            oversizedFileIndexes.includes(index)
              ? inlineErrorMessage
              : fileUploadMessage(file, stillTooLargeMessage)
          )
        );
        setImageProgress({ phase: "idle", percent: 0, message: "" });
        setError(errorMessage);
        return;
      }

      setError(null);

      try {
        const files = await prepareCheckinImages(value, (fileIndex, percent) => {
          if (imagePreparationJobRef.current !== jobId) return;
          setFileUploadProgresses((prev) => {
            const next = [...prev];
            next[fileIndex] = percent;
            return next;
          });
        });
        if (imagePreparationJobRef.current !== jobId) return;

        const stillTooLargeMessage = tg(
          "checkInOutPage.errors.fileStillTooLargeInline"
        );
        preparedMeterImagesRef.current = { signature, files };
        setPreparedImageLabels(files.map(fileDisplayLabel));
        setPreparedImageStatuses(files.map(fileUploadStatus));
        setPreparedImageMessages(
          files.map((file) => fileUploadMessage(file, stillTooLargeMessage))
        );
        if (files.some((file) => file.size > MAX_CHECKIN_IMAGE_UPLOAD_BYTES)) {
          setError(tg("checkInOutPage.errors.totalUploadTooLarge"));
        }
        setImageProgress({ phase: "idle", percent: 0, message: "" });
      } catch (prepareError) {
        console.error("Image preparation failed:", prepareError);
        if (imagePreparationJobRef.current !== jobId) return;
        setImageProgress({ phase: "idle", percent: 0, message: "" });
        preparedMeterImagesRef.current = { signature, files: originalFiles };
        setPreparedImageLabels(originalFiles.map(fileDisplayLabel));
        setPreparedImageStatuses(originalFiles.map(fileUploadStatus));
        setPreparedImageMessages(
          originalFiles.map((file) =>
            fileUploadMessage(
              file,
              tg("checkInOutPage.errors.fileStillTooLargeInline")
            )
          )
        );
        if (
          originalFiles.some((file) => file.size > MAX_CHECKIN_IMAGE_UPLOAD_BYTES)
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
      const nextSignature = fileListSignature(values.meterImages);
      if (nextSignature === preparedMeterImagesRef.current?.signature) return;
      const preparation = prepareSelectedImages(values.meterImages);
      imagePreparationPromiseRef.current = preparation;
      void preparation.finally(() => {
        if (imagePreparationPromiseRef.current === preparation) {
          imagePreparationPromiseRef.current = null;
        }
      });
    },
    [prepareSelectedImages]
  );

  const progressPanel =
    imageProgress.phase !== "idle" ? (
      <div className={styles.progressPanel} aria-live="polite">
        {[imageProgress]
          .filter((item) => item.phase !== "idle")
          .map((item) => (
            <ProgressMeter item={item} key={item.phase} />
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
      if (imagePreparationPromiseRef.current) {
        await imagePreparationPromiseRef.current;
      }

      const meterImagesSignature = fileListSignature(values.meterImages);
      const preparedMeterImages =
        preparedMeterImagesRef.current?.signature === meterImagesSignature
          ? preparedMeterImagesRef.current.files
          : await prepareCheckinImages(values.meterImages, (fileIndex, percent) => {
              setFileUploadProgresses((prev) => {
                const next = [...prev];
                next[fileIndex] = percent;
                return next;
              });
            });
      if (
        !preparedMeterImages.length ||
        preparedMeterImages.some(
          (file) => file.size > MAX_CHECKIN_IMAGE_UPLOAD_BYTES
        )
      ) {
        const errorMessage = tg("checkInOutPage.errors.totalUploadTooLarge");
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

      setFileUploadProgresses(preparedMeterImages.map(() => 1));

      const preuploadedAttachments = await preuploadCheckinImages(
        preparedMeterImages,
        values,
        draftIdRef.current,
        requestHeaders,
        (fileIndex, percent) =>
          setFileUploadProgresses((prev) => {
            const next = [...prev];
            next[fileIndex] = percent;
            return next;
          })
      );

      const formData = new FormData();

      for (const key in values) {
        if (key === "confirmEmail") continue;

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
      formData.set(
        "preuploadedMeterImages",
        JSON.stringify(preuploadedAttachments)
      );

      const res = await postFormDataWithProgress(
        "/api/checkin",
        formData,
        requestHeaders,
        () => undefined
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
      setFileUploadProgresses([]);
      setImageProgress({
        phase: "idle",
        percent: 0,
        message: "",
      });
      setPreparedImageLabels([]);
      setPreparedImageStatuses([]);
      setPreparedImageMessages([]);
      setFileUploadProgresses([]);
      setFormKey((k) => k + 1);
      setFormStartedAt(String(Date.now()));
      draftIdRef.current = createFormDraftId("guest-checkin");
      preparedMeterImagesRef.current = null;
    } catch (err: any) {
      console.error("Submit error:", err);
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
      maxFiles: MAX_CHECKIN_IMAGE_FILES,
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
          fileUploadProgresses={
            fileUploadProgresses.length
              ? { meterImages: fileUploadProgresses }
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

        <Accordion items={accordionItems as any} i18nNs="guest" lang={lang} />
      </div>
    </>
  );
}
