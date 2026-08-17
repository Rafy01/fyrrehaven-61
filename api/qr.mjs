import crypto from "node:crypto";
import {
  getFirestoreDb,
  getFirebaseAdminInitError,
} from "./_lib/firebaseAdmin.mjs";
import { applySecurityHeaders, sendJson } from "./_lib/httpSecurity.mjs";

export const QR_SCAN_EVENTS_COLLECTION = "qrScanEvents";

const MAX_STRING_LENGTH = 500;
const FALLBACK_URL = "https://fyrrehaven-61.dk/en";

function cleanString(value, maxLength = MAX_STRING_LENGTH) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function header(req, key) {
  return cleanString(req.headers[key.toLowerCase()]);
}

function clientIp(req) {
  const forwarded = cleanString(req.headers["x-forwarded-for"]);
  return (
    cleanString(req.headers["x-real-ip"]) ||
    forwarded.split(",")[0]?.trim() ||
    cleanString(req.socket?.remoteAddress)
  );
}

function hashIp(ip) {
  if (!ip) return "";
  const salt = cleanString(process.env.ANALYTICS_IP_SALT) || "fyrrehaven-61";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function safeDestination(value) {
  try {
    const url = new URL(cleanString(value, 1200));
    if (url.protocol !== "http:" && url.protocol !== "https:") return FALLBACK_URL;
    return url.toString();
  } catch {
    return FALLBACK_URL;
  }
}

function deviceFromUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();
  if (/bot|crawler|spider|preview|facebookexternalhit|slurp|bingpreview/.test(ua)) {
    return "Bot";
  }
  if (/ipad|tablet|kindle/.test(ua)) return "Tablet";
  if (/mobi|iphone|android/.test(ua)) return "Mobile";
  return "Desktop";
}

function browserFromUserAgent(userAgent) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent)) {
    return "Safari";
  }
  return "Other";
}

function referrerDomain(referrer) {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "Direct";
  } catch {
    return "Unknown";
  }
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET");

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const destination = safeDestination(req.query?.to);
  const userAgent = header(req, "user-agent");
  const deviceType = deviceFromUserAgent(userAgent);
  const now = Date.now();
  const id = cleanString(req.query?.id, 120) || "unknown";
  const label = cleanString(req.query?.label, 180) || id;

  try {
    const db = await getFirestoreDb();
    if (db) {
      await db.collection(QR_SCAN_EVENTS_COLLECTION).add({
        qrId: id,
        label,
        destination,
        deviceType,
        browser: browserFromUserAgent(userAgent),
        isBot: deviceType === "Bot",
        referrerDomain: referrerDomain(header(req, "referer")),
        country:
          header(req, "x-vercel-ip-country") ||
          header(req, "cf-ipcountry") ||
          "Unknown",
        region: header(req, "x-vercel-ip-country-region"),
        city: header(req, "x-vercel-ip-city"),
        ipHash: hashIp(clientIp(req)),
        createdAtMs: now,
        createdAtIso: new Date(now).toISOString(),
      });
    } else {
      console.error("QR_FIREBASE_NOT_CONFIGURED", getFirebaseAdminInitError());
    }
  } catch (error) {
    console.error("QR_SCAN_WRITE_FAILED", error);
  }

  res.writeHead(302, {
    Location: destination,
    "Cache-Control": "no-store, max-age=0, must-revalidate",
    "X-Robots-Tag": "noindex, nofollow",
  });
  res.end();
}
