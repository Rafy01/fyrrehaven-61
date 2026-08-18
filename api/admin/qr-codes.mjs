import {
  getFirestoreDb,
  getFirebaseAdminInitError,
  verifyAdminRequest,
} from "../_lib/firebaseAdmin.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";
import { QR_SCAN_EVENTS_COLLECTION } from "../qr.mjs";

const DASHBOARD_AUTH_DISABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.DASHBOARD_AUTH_DISABLED === "true";
const QR_CODES_COLLECTION = "qrCodes";
const MAX_QR_EVENTS = 15000;
const DEFAULT_RANGE_DAYS = 180;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfWeek(date) {
  const day = date.getDay() || 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - day + 1);
  return start.getTime();
}

function dateFilterRange(value) {
  const now = new Date();
  const today = startOfDay(now);
  const currentWeek = startOfWeek(now);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  switch (value) {
    case "today":
      return { from: today, to: Date.now() + 1 };
    case "current-week":
      return { from: currentWeek, to: Date.now() + 1 };
    case "last-week": {
      const from = new Date(currentWeek);
      from.setDate(from.getDate() - 7);
      return { from: from.getTime(), to: currentWeek };
    }
    case "last-month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      return { from, to: currentMonth };
    }
    case "last-3-months": {
      const from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return { from: from.getTime(), to: Date.now() + 1 };
    }
    case "last-6-months": {
      const from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { from: from.getTime(), to: Date.now() + 1 };
    }
    case "year":
      return {
        from: new Date(now.getFullYear(), 0, 1).getTime(),
        to: Date.now() + 1,
      };
    case "all": {
      const from = new Date(now);
      from.setDate(from.getDate() - DEFAULT_RANGE_DAYS);
      return { from: from.getTime(), to: Date.now() + 1, capped: true };
    }
    default:
      return { from: today, to: Date.now() + 1 };
  }
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function label(value, fallback = "Unknown") {
  const text = String(value || "").trim();
  return text || fallback;
}

function cleanString(value, maxLength = 500) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function cleanBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function cleanNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
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

function cleanQrCodeConfig(value) {
  const qr = value && typeof value === "object" ? value : {};
  const id = cleanString(qr.id, 140);
  if (!id) return null;
  return {
    id,
    label: cleanString(qr.label, 180) || "Untitled QR code",
    destination: cleanString(qr.destination, 1200),
    tracked: cleanBoolean(qr.tracked, true),
    foreground: cleanString(qr.foreground, 24) || "#9f9418",
    background: cleanString(qr.background, 24) || "#ffffff",
    size: cleanNumber(qr.size, 720, 240, 1800),
    margin: cleanNumber(qr.margin, 3, 0, 8),
    errorCorrection: ["L", "M", "Q", "H"].includes(qr.errorCorrection)
      ? qr.errorCorrection
      : "H",
    overlayMode: ["logo", "text", "image", "none"].includes(qr.overlayMode)
      ? qr.overlayMode
      : "logo",
    overlayText: cleanString(qr.overlayText, 24) || "61",
    overlayScale: cleanNumber(qr.overlayScale, 22, 8, 32),
    overlayBackground: cleanString(qr.overlayBackground, 24) || "#000000",
    frameEnabled: cleanBoolean(qr.frameEnabled, true),
    frameText1: cleanString(qr.frameText1, 80) || "Text 1",
    frameText2: cleanString(qr.frameText2, 80) || "Text 2",
    frameLinkText: cleanString(qr.frameLinkText, 220) || cleanString(qr.destination, 220),
    frameLinkAuto: cleanBoolean(qr.frameLinkAuto, true),
  };
}

function increment(map, key, amount = 1) {
  const cleanKey = label(key);
  map.set(cleanKey, (map.get(cleanKey) || 0) + amount);
}

function topRows(map, limit = 10) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function buildQrStats(events) {
  const visitors = new Set();
  const qrMap = new Map();
  const daily = new Map();
  const hourly = new Map();
  const devices = new Map();
  const countries = new Map();
  const referrers = new Map();
  let lastScanMs = 0;

  for (const event of events) {
    if (event.isBot) continue;

    const createdAtMs = number(event.createdAtMs);
    const id = label(event.qrId || "unknown");
    const visitor = label(event.ipHash || `${id}:${createdAtMs}`, "Anonymous");
    visitors.add(visitor);
    lastScanMs = Math.max(lastScanMs, createdAtMs);

    const existing =
      qrMap.get(id) ||
      {
        id,
        label: label(event.label, id),
        destination: label(event.destination, "Unknown"),
        scans: 0,
        lastScanMs: 0,
      };
    existing.scans += 1;
    existing.lastScanMs = Math.max(existing.lastScanMs, createdAtMs);
    qrMap.set(id, existing);

    increment(devices, event.deviceType);
    increment(countries, event.country);
    increment(referrers, event.referrerDomain || "Direct");
    increment(hourly, new Date(createdAtMs).toISOString().slice(0, 13) + ":00");
    increment(daily, new Date(createdAtMs).toISOString().slice(0, 10));
  }

  const filteredEvents = events
    .filter((event) => !event.isBot)
    .sort((a, b) => number(b.createdAtMs) - number(a.createdAtMs));

  return {
    totals: {
      scans: filteredEvents.length,
      uniqueVisitors: visitors.size,
      qrCodes: qrMap.size,
      lastScanMs,
    },
    qrCodes: [...qrMap.values()]
      .sort((a, b) => b.scans - a.scans || b.lastScanMs - a.lastScanMs)
      .slice(0, 20),
    daily: topRows(daily, 60).sort((a, b) => a.label.localeCompare(b.label)),
    hourly: topRows(hourly, 48).sort((a, b) => a.label.localeCompare(b.label)),
    devices: topRows(devices, 8),
    countries: topRows(countries, 12),
    referrers: topRows(referrers, 10),
    recent: filteredEvents.slice(0, 12).map((event, index) => ({
      id: `${event.id || event.qrId || "scan"}:${index}`,
      label: label(event.label, event.qrId || "Unknown"),
      destination: label(event.destination, "Unknown"),
      createdAtMs: number(event.createdAtMs),
      deviceType: label(event.deviceType),
      country: label(event.country),
    })),
  };
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET, POST, DELETE");

  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (!DASHBOARD_AUTH_DISABLED) {
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

  const db = await getFirestoreDb();
  if (!db) {
    sendJson(res, 503, {
      ok: false,
      error: "FIREBASE_ADMIN_NOT_CONFIGURED",
      detail:
        getFirebaseAdminInitError() ||
        "Firebase server credentials are missing or invalid.",
    });
    return;
  }

  if (req.method === "POST") {
    const qrCode = cleanQrCodeConfig(requestBody(req).qrCode);
    if (!qrCode || !qrCode.destination) {
      sendJson(res, 400, { ok: false, error: "INVALID_QR_CODE" });
      return;
    }

    const now = Date.now();
    const docRef = db.collection(QR_CODES_COLLECTION).doc(qrCode.id);
    const existing = await docRef.get();
    await docRef.set(
      {
        ...qrCode,
        createdAtMs: existing.exists ? existing.data()?.createdAtMs || now : now,
        updatedAtMs: now,
        updatedAtIso: new Date(now).toISOString(),
      },
      { merge: true }
    );
    sendJson(res, 200, { ok: true, qrCode: { ...qrCode, updatedAtMs: now } });
    return;
  }

  if (req.method === "DELETE") {
    const id = cleanString(req.query?.id, 140);
    if (!id) {
      sendJson(res, 400, { ok: false, error: "MISSING_QR_CODE_ID" });
      return;
    }
    await db.collection(QR_CODES_COLLECTION).doc(id).delete();
    sendJson(res, 200, { ok: true, deleted: id });
    return;
  }

  const range = dateFilterRange(String(req.query?.range || "all"));

  try {
    const [snapshot, savedSnapshot] = await Promise.all([
      db
      .collection(QR_SCAN_EVENTS_COLLECTION)
      .where("createdAtMs", ">=", range.from)
      .where("createdAtMs", "<", range.to)
      .orderBy("createdAtMs", "desc")
      .limit(MAX_QR_EVENTS)
        .get(),
      db.collection(QR_CODES_COLLECTION).orderBy("updatedAtMs", "desc").limit(100).get(),
    ]);

    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const saved = savedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    sendJson(res, 200, {
      ok: true,
      range,
      capped: snapshot.size >= MAX_QR_EVENTS || Boolean(range.capped),
      stats: { ...buildQrStats(events), saved },
    });
  } catch (error) {
    console.error("ADMIN_QR_STATS_READ_FAILED", error);
    sendJson(res, 500, {
      ok: false,
      error: "ADMIN_QR_STATS_READ_FAILED",
      detail: String(error?.message || error),
    });
  }
}
