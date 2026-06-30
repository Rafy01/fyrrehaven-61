const GA_MEASUREMENT_ID = (
  import.meta.env.VITE_GA_MEASUREMENT_ID || ""
).trim();

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

function hasDocument() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function analyticsScriptId() {
  return `ga4-loader-${GA_MEASUREMENT_ID}`;
}

function hasStatisticsConsent() {
  return Boolean(window.fh61Consent?.().statistics);
}

function bootstrapAnalytics() {
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
    GA_MEASUREMENT_ID,
  )}`;
  document.head.appendChild(script);

  analyticsBootstrapped = true;
}

export function isAnalyticsConfigured() {
  return Boolean(GA_MEASUREMENT_ID);
}

export function syncAnalyticsConsent() {
  if (!hasDocument() || !GA_MEASUREMENT_ID) return;

  bootstrapAnalytics();

  const granted = hasStatisticsConsent();
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = !granted;
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: granted ? "granted" : "denied",
  });
}

export function trackPageView(path: string, title?: string) {
  if (!hasDocument() || !GA_MEASUREMENT_ID || !hasStatisticsConsent()) return;

  bootstrapAnalytics();
  window.gtag?.("event", "page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: title || document.title,
  });
}
