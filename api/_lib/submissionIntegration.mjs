import crypto from "node:crypto";
import { updateFormSubmission } from "./formSubmissions.mjs";

const DELIVERY_TIMEOUT_MS = Number(
  process.env.SUBMISSION_WEBHOOK_TIMEOUT_MS || 10000
);

function configuredApiKeys() {
  return String(
    process.env.SUBMISSION_SYNC_API_KEYS ||
      process.env.SUBMISSION_SYNC_API_KEY ||
      process.env.SUBMISSION_API_KEY ||
      ""
  )
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function verifySubmissionApiRequest(req) {
  const keys = configuredApiKeys();
  if (keys.length === 0) {
    return {
      ok: false,
      status: 503,
      error: "SUBMISSION_API_KEY_NOT_CONFIGURED",
      detail: "Set SUBMISSION_SYNC_API_KEY or SUBMISSION_SYNC_API_KEYS.",
    };
  }

  const auth = String(req.headers.authorization || "");
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const apiKey = String(req.headers["x-api-key"] || "").trim();
  const provided = bearer || apiKey;

  if (!provided || !keys.some((key) => timingSafeEqualString(provided, key))) {
    return {
      ok: false,
      status: 401,
      error: "UNAUTHORIZED",
      detail: "A valid integration API key is required.",
    };
  }

  return { ok: true };
}

function cleanString(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function cleanNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function englishLabel(label, fallback) {
  if (typeof label === "string") return cleanString(label) || fallback;
  if (!label || typeof label !== "object") return fallback;
  return cleanString(label.en) || cleanString(label.da) || cleanString(label.de) || fallback;
}

function guestPayload(submission, options = {}) {
  return {
    name: cleanString(submission.name),
    email: cleanString(submission.email),
    ...(options.phone ? { phone: cleanString(submission.phone) } : {}),
    ...(options.country
      ? {
          country: cleanString(submission.country),
          countryIso: cleanString(submission.countryIso),
        }
      : {}),
  };
}

function bookingPayload(submission, selection) {
  return {
    id: cleanString(submission.id),
    type: "booking",
    status: cleanString(submission.status),
    bookingNumber: cleanString(submission.bookingNumber),
    guest: guestPayload(submission, { phone: true, country: true }),
    dates: {
      checkIn: cleanString(selection.start),
      checkOut: cleanString(selection.endExclusive),
      nights: cleanNumber(selection.nights),
    },
    price: {
      totalDKK:
        cleanNumber(selection.totalAfterAirbnbDiscountDKK) ??
        cleanNumber(selection.totalWithCleaningDKK),
    },
    guests: {
      adults: cleanNumber(submission.guests?.adults),
      children: cleanNumber(submission.guests?.children),
      babies: cleanNumber(submission.guests?.babies),
    },
    approvals: {
      feeListAccepted: Boolean(submission.feesAccepted),
      policyAccepted: Boolean(submission.consent),
    },
  };
}

function extraServicesPayload(submission, extras) {
  const items = Array.isArray(extras.items)
    ? extras.items.map((item) => ({
        id: cleanString(item?.id),
        name: englishLabel(item?.label, cleanString(item?.id) || "Extra service"),
        quantity: cleanNumber(item?.qty),
        unitPriceDKK: cleanNumber(item?.unitPriceDKK),
        totalDKK:
          cleanNumber(item?.totalDKK) ??
          (cleanNumber(item?.qty) != null && cleanNumber(item?.unitPriceDKK) != null
            ? cleanNumber(item.qty) * cleanNumber(item.unitPriceDKK)
            : null),
      }))
    : [];

  return {
    id: cleanString(submission.id),
    type: "extra-services",
    status: cleanString(submission.status),
    bookingNumber: cleanString(submission.bookingNumber),
    date: cleanString(extras.stayDate),
    totalDKK: cleanNumber(extras.totalDKK),
    items,
  };
}

function meterValue(readings, meter) {
  const value = readings?.[meter];
  return value == null ? null : cleanString(value);
}

function checkinPayload(submission, checkin) {
  const approval = checkin.meterApproval || null;
  if (!approval?.approvedAtMs) return null;

  return {
    id: cleanString(submission.id),
    type: checkin.type === "checkout" ? "checkout" : "checkin",
    status: cleanString(submission.status),
    bookingNumber: cleanString(submission.bookingNumber),
    dates: {
      checkIn: cleanString(checkin.bookingStartDate),
      checkOut: cleanString(checkin.bookingEndDate),
      checkInOrOut: cleanString(checkin.stayDate || checkin.submittedStayDate),
      approvedAtMs: cleanNumber(approval.approvedAtMs),
    },
    meters: {
      electricity: meterValue(checkin.meterReadings, "electricity"),
      waterHouse: meterValue(checkin.meterReadings, "waterHouse"),
      waterPool: meterValue(checkin.meterReadings, "waterPool"),
    },
  };
}

function draftPayload(submission, intent) {
  return {
    id: cleanString(submission.id),
    type: "draft",
    status: cleanString(submission.status) || "draft",
    intent,
    source: cleanString(submission.source),
    bookingNumber: cleanString(submission.bookingNumber),
    guest: guestPayload(submission, { phone: true, country: true }),
    message: cleanString(submission.message),
    dates: {
      checkIn: cleanString(submission.selection?.start),
      checkOut: cleanString(submission.selection?.endExclusive),
      nights: cleanNumber(submission.selection?.nights),
      stayDate: cleanString(submission.extras?.stayDate),
      bookingStartDate: cleanString(submission.checkin?.bookingStartDate),
      bookingEndDate: cleanString(submission.checkin?.bookingEndDate),
      checkInOrOut: cleanString(
        submission.checkin?.stayDate || submission.checkin?.submittedStayDate
      ),
    },
    price: {
      totalDKK:
        cleanNumber(submission.selection?.totalAfterAirbnbDiscountDKK) ??
        cleanNumber(submission.selection?.totalWithCleaningDKK) ??
        cleanNumber(submission.extras?.totalDKK),
    },
    checkin: submission.checkin
      ? {
          type: cleanString(submission.checkin.type),
          keycode: cleanString(submission.checkin.keycode),
          meters: {
            electricity: meterValue(submission.checkin.meterReadings, "electricity"),
            waterHouse: meterValue(submission.checkin.meterReadings, "waterHouse"),
            waterPool: meterValue(submission.checkin.meterReadings, "waterPool"),
          },
          attachmentCount: Array.isArray(submission.checkin.attachments)
            ? submission.checkin.attachments.length
            : 0,
        }
      : null,
    formError: {
      code: cleanString(submission.formErrorCode),
      message: cleanString(submission.formErrorMessage),
      lastAction: cleanString(submission.formLastAction),
    },
    timestamps: {
      createdAtMs: cleanNumber(submission.createdAtMs),
      updatedAtMs: cleanNumber(submission.updatedAtMs),
      draftUpdatedAtMs: cleanNumber(submission.draftUpdatedAtMs),
    },
  };
}

export function publicSubmissionPayload(submission) {
  if (!submission || typeof submission !== "object") return null;

  const checkin = submission.checkin || null;
  const selection = submission.selection || null;
  const extras = submission.extras || null;
  const intent = cleanString(submission.intent) || "contact";
  const status = cleanString(submission.status);

  if (status === "draft") return draftPayload(submission, intent);

  if (intent === "booking" && selection) return bookingPayload(submission, selection);
  if (intent === "extra-services" && extras) return extraServicesPayload(submission, extras);
  if (intent === "guest-checkin" && checkin) return checkinPayload(submission, checkin);
  return null;
}

export function submissionEventPayload(event, submission) {
  return {
    event,
    version: 1,
    occurredAtMs: Date.now(),
    submission: publicSubmissionPayload(submission),
  };
}

function webhookSignature(secret, timestamp, body) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

async function postWebhook(payload) {
  const url = String(process.env.SUBMISSION_WEBHOOK_URL || "").trim();
  if (!url) {
    return { skipped: true, reason: "SUBMISSION_WEBHOOK_URL_NOT_CONFIGURED" };
  }

  const secret = String(process.env.SUBMISSION_WEBHOOK_SECRET || "").trim();
  const body = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Fyrrehaven-Event": payload.event,
        "X-Fyrrehaven-Timestamp": timestamp,
        "X-Fyrrehaven-Delivery": `${payload.event}:${payload.submission?.id || "unknown"}:${timestamp}`,
        ...(secret
          ? {
              "X-Fyrrehaven-Signature": `sha256=${webhookSignature(
                secret,
                timestamp,
                body
              )}`,
            }
          : {}),
      },
      body,
      signal: controller.signal,
    });

    const responseText = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(
        `Webhook HTTP ${res.status}${responseText ? `: ${responseText.slice(0, 300)}` : ""}`
      );
    }

    return {
      skipped: false,
      ok: true,
      status: res.status,
      response: responseText.slice(0, 300) || null,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function deliverSubmissionEvent(db, docRef, event, submission) {
  const payload = submissionEventPayload(event, submission);
  const deliveredAtMs = Date.now();
  if (!payload.submission) {
    return { skipped: true, reason: "SUBMISSION_NOT_SHAREABLE" };
  }

  try {
    const result = await postWebhook(payload);
    if (docRef && !result.skipped) {
      await updateFormSubmission(docRef, {
        integrationDelivery: {
          status: "delivered",
          event,
          deliveredAtMs,
          httpStatus: result.status || null,
        },
      });
    }
    return result;
  } catch (error) {
    const message = String(error?.message || error);
    console.error("SUBMISSION_WEBHOOK_DELIVERY_FAILED", {
      event,
      submissionId: submission?.id || docRef?.id || null,
      error: message,
    });

    if (docRef) {
      await updateFormSubmission(docRef, {
        integrationDelivery: {
          status: "failed",
          event,
          attemptedAtMs: deliveredAtMs,
          error: message.slice(0, 500),
        },
      }).catch(() => {});
    }

    return { ok: false, skipped: false, error: message };
  }
}
