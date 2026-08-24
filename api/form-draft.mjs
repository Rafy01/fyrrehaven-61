import { getFirestoreDb } from "./_lib/firebaseAdmin.mjs";
import { upsertFormSubmission } from "./_lib/formSubmissions.mjs";
import {
  getRequesterIp,
  normalizeEmail,
  validateContactHeaders,
} from "./_lib/contactSecurity.mjs";
import { applySecurityHeaders, sendJson } from "./_lib/httpSecurity.mjs";
import { normalizeLang } from "./_lib/i18n.mjs";

function cleanString(value, maxLength = 1000) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function requestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function cleanObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value));
}

function hasMeaningfulData(body) {
  return Boolean(
    cleanString(body.name) ||
      cleanString(body.email) ||
      cleanString(body.phone) ||
      cleanString(body.message) ||
      cleanString(body.stayPurpose) ||
      cleanString(body.extras?.stayDate) ||
      cleanString(body.checkin?.type) ||
      cleanString(body.selection?.start)
  );
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const headerValidation = validateContactHeaders(req);
  if (!headerValidation.ok) {
    sendJson(res, headerValidation.status, {
      ok: false,
      error: headerValidation.error,
      detail: headerValidation.detail,
    });
    return;
  }

  const body = requestBody(req);
  const clientDraftId = cleanString(body.clientDraftId, 120);
  if (!clientDraftId || !hasMeaningfulData(body)) {
    sendJson(res, 200, { ok: true, skipped: true });
    return;
  }

  const db = await getFirestoreDb();
  if (!db) {
    sendJson(res, 200, { ok: true, stored: false });
    return;
  }

  const requestIp = getRequesterIp(req);
  const intent = cleanString(body.intent || body.purpose || body.context || "contact", 80);
  const now = Date.now();
  const record = {
    intent,
    bookingNumber: cleanString(body.bookingNumber, 40) || null,
    lang: normalizeLang(body.lang),
    name: cleanString(body.name, 180),
    email: normalizeEmail(body.email),
    phone: cleanString(body.phone, 80),
    country: cleanString(body.country, 120) || null,
    countryIso: cleanString(body.countryIso, 4) || null,
    message: cleanString(body.message, 4000),
    consent: body.consent === true,
    feesAccepted: body.feesAccepted === true,
    stayPurpose: cleanString(body.stayPurpose, 600) || null,
    guests: cleanObject(body.guests),
    selection: cleanObject(body.selection),
    extras: cleanObject(body.extras),
    checkin: cleanObject(body.checkin),
    source: "website-draft",
    status: cleanString(body.status, 40) || "draft",
    mailStatus: "pending",
    formErrorCode: cleanString(body.formErrorCode, 120) || null,
    formErrorMessage: cleanString(body.formErrorMessage, 1000) || null,
    formLastAction: cleanString(body.formLastAction, 120) || "draft_autosave",
    draftUpdatedAtMs: now,
    createdAtMs: Number(body.createdAtMs) || now,
    updatedAtMs: now,
    requestMeta: {
      ip: requestIp || null,
      origin: req.headers.origin || null,
      referer: req.headers.referer || null,
      userAgent: req.headers["user-agent"] || null,
    },
  };

  try {
    const docRef = await upsertFormSubmission(db, clientDraftId, record);
    sendJson(res, 200, {
      ok: true,
      stored: Boolean(docRef),
      submissionId: docRef?.id || clientDraftId,
    });
  } catch (error) {
    console.error("FORM_DRAFT_WRITE_FAILED", error);
    sendJson(res, 200, { ok: true, stored: false });
  }
}
