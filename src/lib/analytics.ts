const GA_MEASUREMENT_ID = (
  import.meta.env.VITE_GA_MEASUREMENT_ID || ""
).trim();

const VISITOR_STORAGE_KEY = "fh61_analytics_visitor";
const SESSION_STORAGE_KEY = "fh61_analytics_session";
const SESSION_STARTED_KEY = "fh61_analytics_session_started";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const HEARTBEAT_MS = 15000;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fh61Consent?: () => {
      necessary: boolean;
      statistics?: boolean;
    };
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

let analyticsBootstrapped = false;
let currentPage:
  | {
      path: string;
      title: string;
      startedAt: number;
    }
  | null = null;
let heartbeatTimer: number | null = null;

function hasDocument() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function analyticsScriptId() {
  return `ga4-loader-${GA_MEASUREMENT_ID}`;
}

function hasStatisticsConsent() {
  return Boolean(window.fh61Consent?.().statistics);
}

function id(prefix: string) {
  const cryptoId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${cryptoId}`;
}

function visitorId() {
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;
  const next = id("v");
  window.localStorage.setItem(VISITOR_STORAGE_KEY, next);
  return next;
}

function sessionId() {
  const now = Date.now();
  const startedAt = Number(window.sessionStorage.getItem(SESSION_STARTED_KEY) || 0);
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing && startedAt && now - startedAt < SESSION_TIMEOUT_MS) {
    return existing;
  }
  const next = id("s");
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  window.sessionStorage.setItem(SESSION_STARTED_KEY, String(now));
  return next;
}

function referrerDomain(referrer: string) {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "Direct";
  } catch {
    return "Unknown";
  }
}

function queryValue(key: string) {
  return new URLSearchParams(window.location.search).get(key) || "";
}

function pageLoadMs() {
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation ? Math.round(navigation.loadEventEnd || navigation.duration) : 0;
}

function eventPayload(
  eventType: "page_view" | "page_engagement" | "page_exit" | "visibility_hidden",
  path: string,
  title: string,
  durationMs = 0
) {
  return {
    eventId: id("e"),
    eventType,
    visitorId: visitorId(),
    sessionId: sessionId(),
    path,
    title,
    lang: document.documentElement.lang || navigator.language,
    referrer: document.referrer,
    referrerDomain: referrerDomain(document.referrer),
    utmSource: queryValue("utm_source"),
    utmMedium: queryValue("utm_medium"),
    utmCampaign: queryValue("utm_campaign"),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    locale: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    durationMs,
    pageLoadMs: eventType === "page_view" ? pageLoadMs() : 0,
  };
}

function sendFirstPartyAnalytics(
  eventType: "page_view" | "page_engagement" | "page_exit" | "visibility_hidden",
  path: string,
  title: string,
  durationMs = 0,
  beacon = false
) {
  if (!hasDocument() || !hasStatisticsConsent()) return;

  const payload = JSON.stringify(eventPayload(eventType, path, title, durationMs));
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics",
      new Blob([payload], { type: "application/json" })
    );
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: beacon,
  }).catch(() => undefined);
}

function bootstrapGoogleAnalytics() {
  if (!hasDocument() || !GA_MEASUREMENT_ID || analyticsBootstrapped) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("js", new Date());
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
  window.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false,
    transport_type: "beacon",
  });

  const script = document.createElement("script");
  script.async = true;
  script.id = analyticsScriptId();
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    GA_MEASUREMENT_ID
  )}`;
  document.head.appendChild(script);

  analyticsBootstrapped = true;
}

function sendGooglePageView(path: string, title?: string) {
  if (!hasDocument() || !GA_MEASUREMENT_ID || !hasStatisticsConsent()) return;

  bootstrapGoogleAnalytics();
  window.gtag?.("event", "page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: title || document.title,
  });
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = window.setInterval(() => {
    if (!currentPage || document.visibilityState !== "visible") return;
    sendFirstPartyAnalytics(
      "page_engagement",
      currentPage.path,
      currentPage.title,
      HEARTBEAT_MS,
      true
    );
  }, HEARTBEAT_MS);
}

function flushCurrentPage(eventType: "page_exit" | "visibility_hidden" = "page_exit") {
  if (!currentPage) return;
  const durationMs = Math.max(0, Date.now() - currentPage.startedAt);
  sendFirstPartyAnalytics(
    eventType,
    currentPage.path,
    currentPage.title,
    durationMs,
    true
  );
}

export function isAnalyticsConfigured() {
  return true;
}

export function syncAnalyticsConsent() {
  if (!hasDocument()) return;

  const granted = hasStatisticsConsent();
  if (GA_MEASUREMENT_ID) {
    bootstrapGoogleAnalytics();
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = !granted;
    window.gtag?.("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: granted ? "granted" : "denied",
    });
  }

  if (granted) {
    startHeartbeat();
  } else {
    stopHeartbeat();
  }
}

export function trackPageView(path: string, title?: string) {
  if (!hasDocument() || !hasStatisticsConsent()) return;

  flushCurrentPage("page_exit");
  currentPage = {
    path,
    title: title || document.title,
    startedAt: Date.now(),
  };

  sendFirstPartyAnalytics("page_view", path, currentPage.title);
  sendGooglePageView(path, currentPage.title);
  startHeartbeat();
}

if (hasDocument()) {
  window.addEventListener("pagehide", () => {
    flushCurrentPage("page_exit");
    stopHeartbeat();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushCurrentPage("visibility_hidden");
      stopHeartbeat();
    } else if (hasStatisticsConsent()) {
      currentPage = currentPage
        ? { ...currentPage, startedAt: Date.now() }
        : currentPage;
      startHeartbeat();
    }
  });
}
