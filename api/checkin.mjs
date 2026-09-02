import nodemailer from "nodemailer";
import Busboy from "busboy";
import {
  getFirestoreDb,
  getStorageBucket,
  verifyAdminRequest,
} from "./_lib/firebaseAdmin.mjs";
import {
  FORM_SUBMISSION_FILES_COLLECTION,
  createFormSubmission,
  upsertFormSubmission,
  updateFormSubmission,
} from "./_lib/formSubmissions.mjs";
import {
  checkRateLimit,
  getRequesterIp,
  normalizeEmail,
  validateHumanSignals,
  validateMultipartHeaders,
} from "./_lib/contactSecurity.mjs";
import { applySecurityHeaders, sendJson } from "./_lib/httpSecurity.mjs";
import { normalizeLang, t, yesNo } from "./_lib/i18n.mjs";

const reqEnv = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`ENV_MISSING:${k}`);
  return v;
};

const reqEnvAny = (...keys) => {
  for (const k of keys) {
    const v = process.env[k];
    if (v) return v;
  }
  throw new Error(`ENV_MISSING:${keys.join("|")}`);
};

const normalizeSmtpUser = (user, from) => {
  const normalized = String(user || "").trim();
  if (!normalized || normalized.includes("@")) return normalized;
  const domain = String(from || "").split("@")[1];
  return domain ? `${normalized}@${domain}` : normalized;
};

const randomBookingNumber = (hasBookingInfo) =>
  `${hasBookingInfo ? "9" : "7"}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

const cleanDraftId = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);

const checkinBookingDates = (checkType, submittedDate) => ({
  bookingStartDate: checkType === "checkin" ? submittedDate : null,
  bookingEndDate: checkType === "checkout" ? submittedDate : null,
});

const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const SHOULD_EXPOSE_INTERNAL_ERRORS =
  String(process.env.EXPOSE_INTERNAL_API_ERRORS || "").toLowerCase() ===
  "true";
// Default limits are intentionally higher than the old 4 MB cap so a normal
// 3-photo guest submission will not be rejected before upload validation.
const MAX_UPLOAD_FILES = Number(process.env.CHECKIN_MAX_UPLOAD_FILES || 6);
const MAX_UPLOAD_FILE_SIZE =
  Number(process.env.CHECKIN_MAX_UPLOAD_FILE_SIZE_MB || 8) * 1024 * 1024;
const MAX_TOTAL_UPLOAD_SIZE =
  Number(process.env.CHECKIN_MAX_TOTAL_UPLOAD_SIZE_MB || 20) * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const ALLOWED_UPLOAD_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;
const METER_IMAGE_FIELDS = new Set([
  "meterImages",
  "electricity",
  "waterHouse",
  "waterPool",
]);
const READING_RE = /^\d{1,10}(?:[.,]\d{1,3})?$/;

const sanitizeStorageSegment = (value) =>
  String(value || "file")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

const FIRESTORE_FILE_CHUNK_SIZE = 400_000;

async function storeCheckinFilesInFirestore(db, submissionId, files, fallbackReason = "") {
  if (!db || !submissionId || !files.length) {
    return files.map((file) => ({
      fieldname: file.fieldname,
      filename: file.filename,
      contentType: file.contentType,
      sizeBytes: file.content.length,
      viewError: fallbackReason || "Image storage is not configured.",
    }));
  }

  return Promise.all(
    files.map(async (file, index) => {
      try {
        const fileId = [
          sanitizeStorageSegment(submissionId),
          String(index + 1).padStart(2, "0"),
          sanitizeStorageSegment(file.filename),
        ].join("-");
        const fileRef = db.collection(FORM_SUBMISSION_FILES_COLLECTION).doc(fileId);
        const base64 = file.content.toString("base64");
        const chunks = [];

        for (let offset = 0; offset < base64.length; offset += FIRESTORE_FILE_CHUNK_SIZE) {
          chunks.push(base64.slice(offset, offset + FIRESTORE_FILE_CHUNK_SIZE));
        }

        await fileRef.set({
          submissionId,
          index,
          fieldname: file.fieldname,
          filename: file.filename,
          contentType: file.contentType,
          sizeBytes: file.content.length,
          encoding: "base64",
          chunkCount: chunks.length,
          storageFallback: "firestore",
          fallbackReason: fallbackReason || null,
          createdAtMs: Date.now(),
        });

        for (const [chunkIndex, chunk] of chunks.entries()) {
          await fileRef
            .collection("chunks")
            .doc(String(chunkIndex).padStart(4, "0"))
            .set({
              index: chunkIndex,
              data: chunk,
            });
        }

        return {
          fieldname: file.fieldname,
          filename: file.filename,
          contentType: file.contentType,
          sizeBytes: file.content.length,
          firestoreFileId: fileRef.id,
          firestoreChunkCount: chunks.length,
          storageFallback: "firestore",
          storageUploadError: fallbackReason || undefined,
        };
      } catch (firestoreError) {
        const fallbackError = String(firestoreError?.message || firestoreError);
        console.error("CHECKIN_IMAGE_FIRESTORE_FALLBACK_SAVE_FAILED", {
          submissionId,
          filename: file.filename,
          sizeBytes: file.content.length,
          error: fallbackError,
        });

        return {
          fieldname: file.fieldname,
          filename: file.filename,
          contentType: file.contentType,
          sizeBytes: file.content.length,
          viewError: [
            fallbackReason || "Firebase Storage could not store this image.",
            `Firestore fallback failed: ${fallbackError}`,
          ].join(" "),
        };
      }
    })
  );
}

async function uploadFilesToStorage(bucket, submissionId, files) {
  return Promise.all(
    files.map(async (file, index) => {
      const storagePath = [
        "form-submissions",
        sanitizeStorageSegment(submissionId),
        "checkin-images",
        `${String(index + 1).padStart(2, "0")}-${sanitizeStorageSegment(file.filename)}`,
      ].join("/");
      const bucketFile = bucket.file(storagePath);

      await bucketFile.save(file.content, {
        resumable: false,
        metadata: {
          contentType: file.contentType,
          metadata: {
            originalFilename: file.filename,
            formField: file.fieldname,
          },
        },
      });

      return {
        fieldname: file.fieldname,
        filename: file.filename,
        contentType: file.contentType,
        sizeBytes: file.content.length,
        storagePath,
      };
    })
  );
}

async function uploadCheckinFiles(db, submissionId, files) {
  const bucket = await getStorageBucket();
  if (!files.length) {
    return [];
  }

  if (!bucket || !submissionId) {
    return storeCheckinFilesInFirestore(
      db,
      submissionId,
      files,
      !bucket
        ? "Firebase Storage is not configured for this deployment."
        : "Submission id is missing for image storage."
    );
  }

  try {
    return await uploadFilesToStorage(bucket, submissionId, files);
  } catch (storageError) {
    const uploadError = String(storageError?.message || storageError);
    console.error("CHECKIN_IMAGE_STORAGE_UPLOAD_FAILED_USING_FIRESTORE", {
      submissionId,
      error: uploadError,
    });
    return storeCheckinFilesInFirestore(
      db,
      submissionId,
      files,
      `Firebase Storage upload failed: ${uploadError}`
    );
  }
}

function checkinImageUploadStatus(files, attachments) {
  if (!files.length && !attachments.length) return "none";
  if (attachments.some((attachment) => attachment.storagePath || attachment.firestoreFileId)) {
    return "stored";
  }
  if (attachments.some((attachment) => attachment.viewError)) {
    return "failed";
  }
  return "not-configured";
}

function parsePreuploadedMeterImages(fields) {
  const raw = String(fields.preuploadedMeterImages || "").trim();
  if (!raw) return [];

  let parsed = [];
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length > MAX_UPLOAD_FILES) return null;

  const clientDraftId = cleanDraftId(fields.clientDraftId);
  const allowedPrefix = [
    "form-submissions",
    "preuploads",
    sanitizeStorageSegment(clientDraftId),
    "checkin-images",
  ].join("/");

  return parsed.map((attachment) => {
    const filename = String(attachment?.filename || "").trim();
    const contentType = String(attachment?.contentType || "").toLowerCase();
    const storagePath = String(attachment?.storagePath || "").trim();
    const sizeBytes = Number(attachment?.sizeBytes || 0);

    if (
      !clientDraftId ||
      !filename ||
      !ALLOWED_UPLOAD_EXTENSIONS.test(filename) ||
      !ALLOWED_UPLOAD_MIME_TYPES.has(contentType) ||
      !storagePath.startsWith(`${allowedPrefix}/`) ||
      !Number.isFinite(sizeBytes) ||
      sizeBytes <= 0 ||
      sizeBytes > MAX_UPLOAD_FILE_SIZE
    ) {
      return null;
    }

    return {
      fieldname: "meterImages",
      filename,
      contentType,
      sizeBytes,
      storagePath,
    };
  });
}

async function logCheckinSubmitError(db, fields, req, error, detail) {
  const clientDraftId = cleanDraftId(fields.clientDraftId);
  if (!db || !clientDraftId) return null;

  const submittedStayDate = new Date().toISOString().slice(0, 10);
  const type = String(fields.checkType || "").trim();

  return upsertFormSubmission(db, clientDraftId, {
    intent: "guest-checkin",
    lang: normalizeLang(fields.lang),
    name: String(fields.name || "").trim().slice(0, 180),
    email: normalizeEmail(fields.email),
    message: String(fields.comment || "").trim().slice(0, 4000),
    consent:
      fields.consent === true ||
      String(fields.consent || "").toLowerCase() === "true",
    checkin: {
      type,
      stayDate: submittedStayDate,
      submittedStayDate,
      ...checkinBookingDates(type, submittedStayDate),
      keycode: String(fields.keycode || "").trim(),
      meterReadings: {
        electricity: String(fields.elReading || "").trim(),
        waterHouse: String(fields.waterHouse || "").trim(),
        waterPool: String(fields.waterPool || "").trim() || null,
      },
    },
    source: "guest-form",
    status: "validation_failed",
    mailStatus: "pending",
    formErrorCode: String(error || "CHECKIN_FORM_ERROR"),
    formErrorMessage: String(
      detail || "The check-in/out form could not be submitted."
    ),
    formLastAction: "checkin_validation_failed",
    createdAtMs: Number(fields.formStartedAt) || Date.now(),
    updatedAtMs: Date.now(),
    requestMeta: {
      ip: getRequesterIp(req) || null,
      origin: req.headers.origin || null,
      referer: req.headers.referer || null,
      userAgent: req.headers["user-agent"] || null,
    },
  });
}

// Vercel handler
export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const fields = {};
    const files = [];
    let uploadError = null;
    let totalUploadSize = 0;

    const headerValidation = validateMultipartHeaders(req);
    if (!headerValidation.ok) {
      sendJson(res, headerValidation.status, {
        ok: false,
        error: headerValidation.error,
        detail: headerValidation.detail,
      });
      return;
    }

    const requestIp = getRequesterIp(req);
    const rateLimit = checkRateLimit(requestIp, "checkin");
    if (!rateLimit.ok) {
      res.setHeader("Retry-After", String(rateLimit.retryAfter || 60));
      sendJson(res, 429, {
        ok: false,
        error: "RATE_LIMIT_EXCEEDED",
        detail: `Too many submissions from this IP. Try again in ${rateLimit.retryAfter || 60} seconds.`,
      });
      return;
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: MAX_UPLOAD_FILES,
        fileSize: MAX_UPLOAD_FILE_SIZE,
        fields: 30,
      },
    });

    busboy.on("file", (name, file, info) => {
      if (uploadError) {
        file.resume();
        return;
      }

      const filename = String(info.filename || "").trim();
      const contentType = String(info.mimeType || "").toLowerCase();
      if (
        !METER_IMAGE_FIELDS.has(name) ||
        !filename ||
        !ALLOWED_UPLOAD_EXTENSIONS.test(filename) ||
        !ALLOWED_UPLOAD_MIME_TYPES.has(contentType)
      ) {
        uploadError = {
          status: 400,
          error: "INVALID_FILE_TYPE",
          detail: "Only image uploads are allowed for meter readings.",
        };
        file.resume();
        return;
      }

      const buffers = [];
      file.on("data", (data) => {
        totalUploadSize += data.length;
        if (totalUploadSize > MAX_TOTAL_UPLOAD_SIZE && !uploadError) {
          uploadError = {
            status: 413,
            error: "PAYLOAD_TOO_LARGE",
            detail: "The uploaded files are too large.",
          };
          file.resume();
          return;
        }
        buffers.push(data);
      });
      file.on("limit", () => {
        uploadError = {
          status: 413,
          error: "FILE_TOO_LARGE",
          detail: "One of the uploaded files is too large.",
        };
      });
      file.on("end", () => {
        if (uploadError) return;
        files.push({
          fieldname: name,
          filename,
          contentType,
          content: Buffer.concat(buffers),
        });
      });
    });

    busboy.on("field", (name, val) => {
      fields[name] = val;
    });

    busboy.on("filesLimit", () => {
      uploadError = {
        status: 413,
        error: "TOO_MANY_FILES",
        detail: "Too many files were uploaded.",
      };
    });

    busboy.on("fieldsLimit", () => {
      uploadError = {
        status: 413,
        error: "TOO_MANY_FIELDS",
        detail: "Too many form fields were submitted.",
      };
    });

    busboy.on("finish", async () => {
      let submissionRef = null;

      try {
        const db = await getFirestoreDb();
        if (uploadError) {
          await logCheckinSubmitError(
            db,
            fields,
            req,
            uploadError.error,
            uploadError.detail
          );
          sendJson(res, uploadError.status, {
            ok: false,
            error: uploadError.error,
            detail: uploadError.detail,
          });
          return;
        }

        const humanValidation = validateHumanSignals(fields);
        if (!humanValidation.ok) {
          await logCheckinSubmitError(
            db,
            fields,
            req,
            humanValidation.error,
            humanValidation.detail
          );
          sendJson(res, humanValidation.status, {
            ok: false,
            error: humanValidation.error,
            detail: humanValidation.detail,
          });
          return;
        }

        const {
          name,
          keycode,
          email,
          checkType,
          elReading,
          waterHouse,
          waterPool,
          comment,
          consent,
          lang = "da",
          adminManualGuestOnly,
        } = fields;
        const uiLang = normalizeLang(lang);
        const manualGuestOnly =
          adminManualGuestOnly === true ||
          String(adminManualGuestOnly || "").toLowerCase() === "true";
        if (manualGuestOnly) {
          const adminCheck = await verifyAdminRequest(req);
          if (!adminCheck.ok) {
            sendJson(res, adminCheck.status, {
              ok: false,
              error: adminCheck.error,
              detail: adminCheck.detail || null,
            });
            return;
          }
        }
        const emailNormalized = normalizeEmail(email);
        const consentAccepted =
          consent === true || String(consent || "").toLowerCase() === "true";

        if (
          !name ||
          !email ||
          !checkType ||
          !elReading ||
          !waterHouse ||
          !consent
        ) {
          await logCheckinSubmitError(
            db,
            fields,
            req,
            "VALIDATION_ERROR",
            "Missing required fields"
          );
          sendJson(res, 400, {
            ok: false,
            error: "VALIDATION_ERROR",
            detail: "Missing required fields",
          });
          return;
        }

        if (
          String(name).trim().length < 2 ||
          String(name).trim().length > 120 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized) ||
          String(keycode || "").trim().length > 50 ||
          !["checkin", "checkout"].includes(String(checkType || "")) ||
          !READING_RE.test(String(elReading || "").trim()) ||
          !READING_RE.test(String(waterHouse || "").trim()) ||
          (typeof waterPool !== "undefined" &&
            String(waterPool).trim() !== "" &&
            !READING_RE.test(String(waterPool).trim())) ||
          String(comment || "").trim().length > 2000 ||
          !consentAccepted
        ) {
          await logCheckinSubmitError(
            db,
            fields,
            req,
            "VALIDATION_ERROR",
            "One or more fields are invalid."
          );
          sendJson(res, 400, {
            ok: false,
            error: "VALIDATION_ERROR",
            detail: "One or more fields are invalid.",
          });
          return;
        }

        const preuploadedAttachments = parsePreuploadedMeterImages(fields);
        if (
          preuploadedAttachments === null ||
          preuploadedAttachments.some((attachment) => attachment === null)
        ) {
          await logCheckinSubmitError(
            db,
            fields,
            req,
            "INVALID_FILE_REFERENCE",
            "One or more saved image references are invalid."
          );
          sendJson(res, 400, {
            ok: false,
            error: "INVALID_FILE_REFERENCE",
            detail: "One or more saved image references are invalid.",
          });
          return;
        }

        if (!files.length && !preuploadedAttachments.length) {
          await logCheckinSubmitError(
            db,
            fields,
            req,
            "MISSING_FILES",
            "At least one meter image is required."
          );
          sendJson(res, 400, {
            ok: false,
            error: "MISSING_FILES",
            detail: "At least one meter image is required.",
          });
          return;
        }

        // SMTP setup
        const host = reqEnv("SMTP_HOST");
        const port = Number(process.env.SMTP_PORT || 587);
        const from = reqEnv("MAIL_FROM");
        const user = normalizeSmtpUser(process.env.SMTP_USER || from, from);
        const pass = reqEnvAny("SMTP_PASS", "SMTP_PASSWORD");
        const to = reqEnv("MAIL_TO");

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

        const typeKey = checkType === "checkin" ? "checkin" : "checkout";
        const subject = t(uiLang, "checkin.subject", {
          type: t(uiLang, `checkin.type.${typeKey}`),
          name,
        });
        const typeLabel = t(uiLang, `checkin.type.${typeKey}Label`);
        const submittedStayDate = new Date().toISOString().slice(0, 10);
        const bookingDates = checkinBookingDates(
          String(checkType || ""),
          submittedStayDate
        );
        let storedAttachments = preuploadedAttachments.length
          ? preuploadedAttachments
          : files.map((file) => ({
              fieldname: file.fieldname,
              filename: file.filename,
              contentType: file.contentType,
              sizeBytes: file.content.length,
            }));
        const submissionRecord = {
          intent: "guest-checkin",
          bookingNumber: randomBookingNumber(false),
          lang: uiLang,
          name: String(name).trim(),
          email: emailNormalized,
          message: String(comment || "").trim(),
          consent: consentAccepted,
          checkin: {
            type: String(checkType || ""),
            typeLabel,
            stayDate: submittedStayDate,
            submittedStayDate,
            ...bookingDates,
            keycode: String(keycode || "").trim(),
            meterReadings: {
              electricity: String(elReading || "").trim(),
              waterHouse: String(waterHouse || "").trim(),
              waterPool:
                typeof waterPool !== "undefined" && String(waterPool).trim() !== ""
                  ? String(waterPool).trim()
                  : null,
            },
            attachments: storedAttachments,
          },
          source: "guest-form",
          status: "pending",
          mailStatus: "pending",
          createdAtMs: Date.now(),
          updatedAtMs: Date.now(),
          requestMeta: {
            ip: requestIp || null,
            origin: req.headers.origin || null,
            referer: req.headers.referer || null,
            userAgent: req.headers["user-agent"] || null,
          },
        };

        if (db) {
          try {
            submissionRef = cleanDraftId(fields.clientDraftId)
              ? await upsertFormSubmission(db, fields.clientDraftId, submissionRecord)
              : await createFormSubmission(db, submissionRecord);
          } catch (firestoreError) {
            console.error("FIRESTORE_WRITE_FAILED", firestoreError);
          }
        }

        if (db && submissionRef && files.length) {
          try {
            storedAttachments = await uploadCheckinFiles(db, submissionRef.id, files);
            await updateFormSubmission(submissionRef, {
              checkin: {
                ...submissionRecord.checkin,
                attachments: storedAttachments,
                imageUploadStatus: checkinImageUploadStatus(files, storedAttachments),
              },
              updatedAtMs: Date.now(),
            });
          } catch (storageError) {
            const uploadError = String(storageError?.message || storageError);
            console.error("CHECKIN_IMAGE_UPLOAD_FAILED", {
              submissionId: submissionRef.id,
              error: uploadError,
            });

            storedAttachments = files.map((file) => ({
              fieldname: file.fieldname,
              filename: file.filename,
              contentType: file.contentType,
              sizeBytes: file.content.length,
              viewError: `Firebase Storage upload failed: ${uploadError}`,
            }));

            try {
              await updateFormSubmission(submissionRef, {
                checkin: {
                  ...submissionRecord.checkin,
                  attachments: storedAttachments,
                  imageUploadStatus: "failed",
                  imageUploadError: uploadError,
                },
                updatedAtMs: Date.now(),
              });
            } catch (updateError) {
              console.error("CHECKIN_IMAGE_UPLOAD_ERROR_SAVE_FAILED", {
                submissionId: submissionRef.id,
                error: String(updateError?.message || updateError),
              });
            }
          }
        } else if (db && submissionRef && preuploadedAttachments.length) {
          try {
            await updateFormSubmission(submissionRef, {
              checkin: {
                ...submissionRecord.checkin,
                attachments: storedAttachments,
                imageUploadStatus: checkinImageUploadStatus(files, storedAttachments),
              },
              updatedAtMs: Date.now(),
            });
          } catch (updateError) {
            console.error("CHECKIN_PREUPLOADED_IMAGE_SAVE_FAILED", {
              submissionId: submissionRef.id,
              error: String(updateError?.message || updateError),
            });
          }
        }

        const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>${esc(subject)}</h2>
          <p><b>${esc(t(uiLang, "checkin.fields.name"))}:</b> ${esc(name)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.email"))}:</b> ${esc(email)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.keycode"))}:</b> ${esc(keycode)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.type"))}:</b> ${esc(typeLabel)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.electricity"))}:</b> ${esc(elReading)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.waterHouse"))}:</b> ${esc(waterHouse)}</p>
          ${
            typeof waterPool !== "undefined"
              ? `<p><b>${esc(t(uiLang, "checkin.fields.waterPool"))}:</b> ${esc(waterPool)}</p>`
              : ""
          }
          <p><b>${esc(t(uiLang, "checkin.fields.consent"))}:</b> ${esc(yesNo(Boolean(consent), uiLang))}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.comment"))}:</b></p>
          <pre style="background:#f6f6f6;padding:1em;border-radius:5px">${esc(
            comment || "—"
          )}</pre>
        </div>
      `;

        const text = `
${t(uiLang, "checkin.fields.name")}: ${name}
${t(uiLang, "checkin.fields.email")}: ${email}
${t(uiLang, "checkin.fields.keycode")}: ${keycode}
${t(uiLang, "checkin.fields.type")}: ${typeLabel}
${t(uiLang, "checkin.fields.electricity")}: ${elReading}
${t(uiLang, "checkin.fields.waterHouse")}: ${waterHouse}
${
  typeof waterPool !== "undefined"
    ? `${t(uiLang, "checkin.fields.waterPool")}: ${waterPool}\n`
    : ""
}
${t(uiLang, "checkin.fields.consent")}: ${yesNo(Boolean(consent), uiLang)}
${t(uiLang, "checkin.fields.comment")}: ${comment || "—"}
      `;

        await transporter.sendMail({
          from,
          to: manualGuestOnly ? emailNormalized : to,
          subject,
          html,
          text,
          replyTo: manualGuestOnly ? to : undefined,
          attachments: files.map((file) => ({
            filename: file.filename,
            content: file.content,
            contentType: file.contentType,
          })),
        });

        if (submissionRef) {
          const sentPatch = {
            status: "sent",
            mailStatus: "sent",
            updatedAtMs: Date.now(),
          };
          await updateFormSubmission(submissionRef, sentPatch);
        }

        sendJson(res, 200, {
          ok: true,
          stored: Boolean(submissionRef),
          submissionId: submissionRef?.id || null,
          mailStatus: "sent",
        });
      } catch (err) {
        console.error("MAIL_ERROR", err?.response || err);
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : String(err);

        if (typeof submissionRef !== "undefined" && submissionRef) {
          const failedPatch = {
            status: "mail_failed",
            mailStatus: "failed",
            mailError: msg,
            mailErrorCode:
              typeof err === "object" && err !== null && "code" in err
                ? String(err.code || "")
                : null,
            updatedAtMs: Date.now(),
          };
          await updateFormSubmission(submissionRef, failedPatch);

          sendJson(res, 200, {
            ok: true,
            stored: true,
            submissionId: submissionRef.id,
            mailStatus: "failed",
          });
          return;
        }

        if (msg.startsWith("ENV_MISSING:")) {
          sendJson(res, 500, {
            ok: false,
            error: "ENV_MISSING",
            detail: SHOULD_EXPOSE_INTERNAL_ERRORS
              ? msg.replace("ENV_MISSING:", "Missing env: ")
              : "The email service is not configured correctly.",
          });
          return;
        }

        sendJson(res, 500, {
          ok: false,
          error: "MAIL_ERROR",
          detail: SHOULD_EXPOSE_INTERNAL_ERRORS
            ? msg
            : "The message could not be sent right now.",
        });
      }
    });

    busboy.on("error", (err) => {
      console.error("BUSBOY_ERROR", err);
      sendJson(res, 400, {
        ok: false,
        error: "INVALID_MULTIPART_PAYLOAD",
        detail: "The upload could not be processed.",
      });
    });

    req.pipe(busboy);
  } catch (err) {
    console.error("CHECKIN_HANDLER_ERROR", err?.response || err);
    const msg =
      typeof err === "object" && err !== null && "message" in err
        ? String(err.message)
        : String(err);

    if (msg.startsWith("ENV_MISSING:")) {
      sendJson(res, 500, {
        ok: false,
        error: "ENV_MISSING",
        detail: SHOULD_EXPOSE_INTERNAL_ERRORS
          ? msg.replace("ENV_MISSING:", "Missing env: ")
          : "The email service is not configured correctly.",
      });
      return;
    }

    sendJson(res, 500, {
      ok: false,
      error: "MAIL_ERROR",
      detail: SHOULD_EXPOSE_INTERNAL_ERRORS
        ? msg
        : "The message could not be sent right now.",
    });
  }
}
