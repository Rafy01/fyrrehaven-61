import crypto from "node:crypto";
import {
  getFirestoreDb,
  getFirebaseAdminInitError,
} from "./_lib/firebaseAdmin.mjs";
import { applySecurityHeaders, sendJson } from "./_lib/httpSecurity.mjs";
import { QR_SCAN_EVENTS_COLLECTION } from "./_lib/qrAnalytics.mjs";

export const ANALYTICS_EVENTS_COLLECTION = "analyticsEvents";

const MAX_STRING_LENGTH = 500;
const FALLBACK_URL = "https://fyrrehaven-61.dk/en";
const VALID_EVENTS = new Set([
  "page_view",
  "page_engagement",
  "page_exit",
  "visibility_hidden",
]);

function cleanString(value, maxLength = MAX_STRING_LENGTH) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function cleanNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function header(req, key) {
  return cleanString(req.headers[key.toLowerCase()]);
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

function osFromUserAgent(userAgent) {
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os|macintosh/i.test(userAgent)) return "macOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
}

function referrerDomain(referrer) {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "Direct";
  } catch {
    return "Unknown";
  }
}

function siteArea(path) {
  if (path.startsWith("/admin")) return "Admin";
  if (path.startsWith("/guest")) return "Guest/private";
  return "Public";
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
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString("utf8"));
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET, POST");

  if (req.method === "GET") {
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
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const db = await getFirestoreDb();
  if (!db) {
    console.error("ANALYTICS_FIREBASE_NOT_CONFIGURED", getFirebaseAdminInitError());
    sendJson(res, 202, { ok: true, skipped: true });
    return;
  }

  const body = requestBody(req);
  const eventType = cleanString(body.eventType, 40);
  if (!VALID_EVENTS.has(eventType)) {
    sendJson(res, 400, { ok: false, error: "INVALID_ANALYTICS_EVENT" });
    return;
  }

  const path = cleanString(body.path || "/", 300) || "/";
  const userAgent = header(req, "user-agent");
  const deviceType = deviceFromUserAgent(userAgent);
  const now = Date.now();
  const eventId = cleanString(body.eventId, 80);
  const docRef = eventId
    ? db.collection(ANALYTICS_EVENTS_COLLECTION).doc(eventId)
    : db.collection(ANALYTICS_EVENTS_COLLECTION).doc();

  try {
    await docRef.set(
      {
        eventId: docRef.id,
        eventType,
        visitorId: cleanString(body.visitorId, 120),
        sessionId: cleanString(body.sessionId, 120),
        path,
        title: cleanString(body.title, 180),
        lang: cleanString(body.lang, 10),
        siteArea: siteArea(path),
        referrerDomain: cleanString(body.referrerDomain, 160),
        utmSource: cleanString(body.utmSource, 120),
        utmMedium: cleanString(body.utmMedium, 120),
        utmCampaign: cleanString(body.utmCampaign, 160),
        timezone: cleanString(body.timezone, 80),
        locale: cleanString(body.locale, 40),
        screenWidth: cleanNumber(body.screenWidth),
        screenHeight: cleanNumber(body.screenHeight),
        viewportWidth: cleanNumber(body.viewportWidth),
        viewportHeight: cleanNumber(body.viewportHeight),
        durationMs: Math.max(0, cleanNumber(body.durationMs)),
        pageLoadMs: Math.max(0, cleanNumber(body.pageLoadMs)),
        deviceType,
        browser: browserFromUserAgent(userAgent),
        os: osFromUserAgent(userAgent),
        isBot: deviceType === "Bot",
        country:
          header(req, "x-vercel-ip-country") ||
          header(req, "cf-ipcountry") ||
          cleanString(body.country, 8),
        region: header(req, "x-vercel-ip-country-region"),
        city: header(req, "x-vercel-ip-city"),
        ipHash: hashIp(clientIp(req)),
        createdAtMs: now,
        createdAtIso: new Date(now).toISOString(),
      },
      { merge: true }
    );

    sendJson(res, 202, { ok: true });
  } catch (error) {
    console.error("ANALYTICS_EVENT_WRITE_FAILED", error);
    sendJson(res, 202, { ok: true, skipped: true });
  }
}
