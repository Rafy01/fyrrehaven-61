import {
  getFirestoreDb,
  getFirebaseAdminInitError,
  verifyAdminRequest,
} from "../_lib/firebaseAdmin.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";
import { ANALYTICS_EVENTS_COLLECTION } from "../analytics.mjs";

const DASHBOARD_AUTH_DISABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.DASHBOARD_AUTH_DISABLED === "true";
const MAX_ANALYTICS_EVENTS = 15000;
const LIVE_WINDOW_MS = 5 * 60 * 1000;
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

function increment(map, key, amount = 1) {
  const cleanKey = label(key);
  map.set(cleanKey, (map.get(cleanKey) || 0) + amount);
}

function topRows(map, limit = 8) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function avg(total, count) {
  return count > 0 ? Math.round(total / count) : 0;
}

function formatPath(path) {
  return String(path || "/").split("?")[0] || "/";
}

function siteAreaFromPath(path) {
  if (path.startsWith("/admin")) return "Admin";
  if (path.startsWith("/guest")) return "Guest/private";
  return "Public";
}

function buildAnalytics(events) {
  const now = Date.now();
  const visitors = new Set();
  const sessions = new Map();
  const liveVisitors = new Set();
  const countries = new Map();
  const devices = new Map();
  const browsers = new Map();
  const os = new Map();
  const referrers = new Map();
  const siteAreas = new Map();
  const languages = new Map();
  const campaigns = new Map();
  const pageMap = new Map();
  const hourlyMap = new Map();
  const dailyMap = new Map();
  const exitPages = new Map();
  const entryPages = new Map();

  let pageViews = 0;
  let engagementEvents = 0;
  let totalEngagementMs = 0;
  let totalLoadMs = 0;
  let loadSamples = 0;

  const sortedAsc = [...events].sort(
    (a, b) => number(a.createdAtMs) - number(b.createdAtMs)
  );

  for (const event of sortedAsc) {
    if (event.isBot) continue;

    const visitorId = label(event.visitorId || event.ipHash, "Anonymous");
    const sessionId = label(event.sessionId || `${visitorId}:unknown`, "Unknown");
    const path = formatPath(event.path);
    const siteArea = label(event.siteArea || siteAreaFromPath(path));
    const createdAtMs = number(event.createdAtMs);
    const durationMs = Math.min(number(event.durationMs), 30 * 60 * 1000);

    visitors.add(visitorId);
    if (createdAtMs >= now - LIVE_WINDOW_MS) liveVisitors.add(visitorId);

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        visitorId,
        startedAtMs: createdAtMs,
        lastAtMs: createdAtMs,
        pageViews: 0,
        durationMs: 0,
        entryPath: path,
        exitPath: path,
      });
    }

    const session = sessions.get(sessionId);
    session.startedAtMs = Math.min(session.startedAtMs, createdAtMs);
    session.lastAtMs = Math.max(session.lastAtMs, createdAtMs);
    session.durationMs += durationMs;
    session.exitPath = path;

    if (event.eventType === "page_view") {
      pageViews += 1;
      session.pageViews += 1;
      increment(countries, event.country);
      increment(devices, event.deviceType);
      increment(browsers, event.browser);
      increment(os, event.os);
      increment(referrers, event.referrerDomain || "Direct");
      increment(siteAreas, siteArea);
      increment(languages, event.lang || event.locale);
      if (event.utmSource || event.utmCampaign) {
        increment(
          campaigns,
          [event.utmSource, event.utmMedium, event.utmCampaign]
            .filter(Boolean)
            .join(" / ")
        );
      }

      const page =
        pageMap.get(path) ||
        {
          path,
          siteArea,
          views: 0,
          visitors: new Set(),
          durationMs: 0,
          durationSamples: 0,
          exits: 0,
          entries: 0,
        };
      page.views += 1;
      page.siteArea = page.siteArea || siteArea;
      page.visitors.add(visitorId);
      pageMap.set(path, page);

      const hour = new Date(createdAtMs).toISOString().slice(0, 13) + ":00";
      const day = new Date(createdAtMs).toISOString().slice(0, 10);
      increment(hourlyMap, hour);
      increment(dailyMap, day);

      const pageLoadMs = number(event.pageLoadMs);
      if (pageLoadMs > 0) {
        totalLoadMs += Math.min(pageLoadMs, 60000);
        loadSamples += 1;
      }
    } else if (durationMs > 0) {
      engagementEvents += 1;
      totalEngagementMs += durationMs;
      const page = pageMap.get(path);
      if (page) {
        page.durationMs += durationMs;
        page.durationSamples += 1;
      }
    }
  }

  for (const session of sessions.values()) {
    increment(entryPages, session.entryPath);
    increment(exitPages, session.exitPath);
    const page = pageMap.get(session.entryPath);
    if (page) page.entries += 1;
    const exitPage = pageMap.get(session.exitPath);
    if (exitPage) exitPage.exits += 1;
  }

  const sessionList = [...sessions.values()];
  const bouncedSessions = sessionList.filter((session) => session.pageViews <= 1).length;
  const averageSessionMs = avg(
    sessionList.reduce((sum, session) => sum + session.durationMs, 0),
    sessionList.length
  );

  const pages = [...pageMap.values()]
    .map((page) => ({
      path: page.path,
      siteArea: page.siteArea || siteAreaFromPath(page.path),
      views: page.views,
      visitors: page.visitors.size,
      averageTimeMs: avg(page.durationMs, page.durationSamples),
      exits: page.exits,
      entries: page.entries,
      exitRate: page.views > 0 ? page.exits / page.views : 0,
    }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, 14);

  return {
    totals: {
      events: events.length,
      pageViews,
      visitors: visitors.size,
      sessions: sessionList.length,
      liveVisitors: liveVisitors.size,
      bounceRate: sessionList.length > 0 ? bouncedSessions / sessionList.length : 0,
      averageSessionMs,
      averagePageTimeMs: avg(totalEngagementMs, engagementEvents),
      averageLoadMs: avg(totalLoadMs, loadSamples),
    },
    pages,
    countries: topRows(countries, 12),
    devices: topRows(devices, 8),
    browsers: topRows(browsers, 8),
    os: topRows(os, 8),
    referrers: topRows(referrers, 10),
    siteAreas: topRows(siteAreas, 8),
    languages: topRows(languages, 8),
    campaigns: topRows(campaigns, 8),
    entryPages: topRows(entryPages, 8),
    exitPages: topRows(exitPages, 8),
    hourly: topRows(hourlyMap, 48).sort((a, b) => a.label.localeCompare(b.label)),
    daily: topRows(dailyMap, 60).sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET");

  if (req.method !== "GET") {
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

  const range = dateFilterRange(String(req.query?.range || "all"));

  try {
    const snapshot = await db
      .collection(ANALYTICS_EVENTS_COLLECTION)
      .where("createdAtMs", ">=", range.from)
      .where("createdAtMs", "<", range.to)
      .orderBy("createdAtMs", "desc")
      .limit(MAX_ANALYTICS_EVENTS)
      .get();

    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    sendJson(res, 200, {
      ok: true,
      range,
      capped: snapshot.size >= MAX_ANALYTICS_EVENTS || Boolean(range.capped),
      analytics: buildAnalytics(events),
    });
  } catch (error) {
    console.error("ADMIN_ANALYTICS_READ_FAILED", error);
    sendJson(res, 500, {
      ok: false,
      error: "ADMIN_ANALYTICS_READ_FAILED",
      detail: String(error?.message || error),
    });
  }
}
