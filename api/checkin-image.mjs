import Busboy from "busboy";
import { getStorageBucket } from "./_lib/firebaseAdmin.mjs";
import {
  checkRateLimit,
  getRequesterIp,
  validateHumanSignals,
  validateMultipartHeaders,
} from "./_lib/contactSecurity.mjs";
import { applySecurityHeaders, sendJson } from "./_lib/httpSecurity.mjs";

const MAX_UPLOAD_FILE_SIZE =
  Number(process.env.CHECKIN_MAX_UPLOAD_FILE_SIZE_MB || 8) * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const ALLOWED_UPLOAD_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;

const cleanDraftId = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);

const sanitizeStorageSegment = (value) =>
  String(value || "file")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

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
  const rateLimit = checkRateLimit(requestIp, "checkin-image");
  if (!rateLimit.ok) {
    res.setHeader("Retry-After", String(rateLimit.retryAfter || 60));
    sendJson(res, 429, {
      ok: false,
      error: "RATE_LIMIT_EXCEEDED",
      detail: `Too many uploads from this IP. Try again in ${rateLimit.retryAfter || 60} seconds.`,
    });
    return;
  }

  const fields = {};
  let uploadError = null;
  let uploadedFile = null;

  try {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_UPLOAD_FILE_SIZE,
        fields: 12,
      },
    });

    busboy.on("file", (name, file, info) => {
      if (uploadError || uploadedFile) {
        file.resume();
        return;
      }

      const filename = String(info.filename || "").trim();
      const contentType = String(info.mimeType || "").toLowerCase();
      if (
        name !== "meterImage" ||
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
      file.on("data", (data) => buffers.push(data));
      file.on("limit", () => {
        uploadError = {
          status: 413,
          error: "FILE_TOO_LARGE",
          detail: "The selected image is too large.",
        };
      });
      file.on("end", () => {
        if (uploadError) return;
        uploadedFile = {
          fieldname: "meterImages",
          filename,
          contentType,
          content: Buffer.concat(buffers),
        };
      });
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("filesLimit", () => {
      uploadError = {
        status: 413,
        error: "TOO_MANY_FILES",
        detail: "Upload one image at a time.",
      };
    });

    busboy.on("fieldsLimit", () => {
      uploadError = {
        status: 413,
        error: "TOO_MANY_FIELDS",
        detail: "Too much upload metadata was submitted.",
      };
    });

    busboy.on("finish", async () => {
      if (uploadError) {
        sendJson(res, uploadError.status, {
          ok: false,
          error: uploadError.error,
          detail: uploadError.detail,
        });
        return;
      }

      const humanValidation = validateHumanSignals(fields);
      if (!humanValidation.ok) {
        sendJson(res, humanValidation.status, {
          ok: false,
          error: humanValidation.error,
          detail: humanValidation.detail,
        });
        return;
      }

      const clientDraftId = cleanDraftId(fields.clientDraftId);
      if (!clientDraftId || !uploadedFile) {
        sendJson(res, 400, {
          ok: false,
          error: "VALIDATION_ERROR",
          detail: "Image upload metadata is missing.",
        });
        return;
      }

      const bucket = await getStorageBucket();
      if (!bucket) {
        sendJson(res, 500, {
          ok: false,
          error: "STORAGE_NOT_CONFIGURED",
          detail: "Image storage is not configured.",
        });
        return;
      }

      const fileIndex = String(fields.fileIndex || "1").padStart(2, "0");
      const storagePath = [
        "form-submissions",
        "preuploads",
        sanitizeStorageSegment(clientDraftId),
        "checkin-images",
        `${fileIndex}-${sanitizeStorageSegment(uploadedFile.filename)}`,
      ].join("/");

      await bucket.file(storagePath).save(uploadedFile.content, {
        resumable: false,
        metadata: {
          contentType: uploadedFile.contentType,
          metadata: {
            originalFilename: uploadedFile.filename,
            formField: uploadedFile.fieldname,
            clientDraftId,
          },
        },
      });

      sendJson(res, 200, {
        ok: true,
        attachment: {
          fieldname: uploadedFile.fieldname,
          filename: uploadedFile.filename,
          contentType: uploadedFile.contentType,
          sizeBytes: uploadedFile.content.length,
          storagePath,
        },
      });
    });

    busboy.on("error", (error) => {
      console.error("CHECKIN_IMAGE_UPLOAD_BUSBOY_ERROR", error);
      sendJson(res, 400, {
        ok: false,
        error: "INVALID_MULTIPART_PAYLOAD",
        detail: "The image upload could not be processed.",
      });
    });

    req.pipe(busboy);
  } catch (error) {
    console.error("CHECKIN_IMAGE_UPLOAD_ERROR", error);
    sendJson(res, 500, {
      ok: false,
      error: "IMAGE_UPLOAD_FAILED",
      detail: "The image could not be uploaded right now.",
    });
  }
}
