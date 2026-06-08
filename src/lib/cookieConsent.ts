import type { i18n as I18n, TFunction } from "i18next";
import * as CookieConsent from "vanilla-cookieconsent";
import { cookieData, type CookieEntry } from "../data/cookies";
import type { Lang } from "./lang";

const LANGS: Lang[] = ["da", "en", "de"];
const CONSENT_REVISION = 2;

declare global {
  interface Window {
    fh61Consent?: () => {
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
    };
  }
}

let initialized = false;

function cookieTable(
  lng: Lang,
  category: keyof (typeof cookieData)[Lang],
  t: TFunction<"cookiesPage">,
) {
  const entries = cookieData[lng][category];
  if (!entries.length) return undefined;

  return {
    caption: t(`categories.${category}.tableCaption`),
    headers: {
      name: t("table.name"),
      provider: t("table.provider"),
      purpose: t("table.purpose"),
      expiration: t("table.expiration"),
      type: t("table.type"),
    },
    body: entries.map((cookie: CookieEntry) => ({
      name: cookie.name,
      provider: cookie.provider,
      purpose: cookie.purpose,
      expiration: cookie.duration,
      type: cookie.type.toUpperCase(),
    })),
  };
}

function updateConsentState() {
  window.fh61Consent = () => ({
    necessary: true,
    analytics: CookieConsent.acceptedCategory("analytics"),
    marketing: CookieConsent.acceptedCategory("marketing"),
  });

  window.dispatchEvent(new CustomEvent("fh61:consentchange"));
}

function translationsFor(lng: Lang, i18n: I18n) {
  const t = i18n.getFixedT(lng, "cookiesPage");

  return {
    consentModal: {
      title: t("consent.title"),
      description: t("consent.description"),
      acceptAllBtn: t("consent.acceptAll"),
      acceptNecessaryBtn: t("consent.rejectAll"),
      showPreferencesBtn: t("consent.preferences"),
      footer: t("consent.footer"),
    },
    preferencesModal: {
      title: t("consent.settingsTitle"),
      acceptAllBtn: t("consent.acceptAll"),
      acceptNecessaryBtn: t("consent.rejectAll"),
      savePreferencesBtn: t("consent.save"),
      closeIconLabel: t("consent.close"),
      sections: [
        {
          title: t("preferences.introTitle"),
          description: t("preferences.introDescription"),
        },
        {
          title: t("categories.necessary.title"),
          description: t("categories.necessary.description"),
          linkedCategory: "necessary",
          cookieTable: cookieTable(lng, "necessary", t),
        },
        {
          title: t("categories.analytics.title"),
          description: t("categories.analytics.description"),
          linkedCategory: "analytics",
          cookieTable: cookieTable(lng, "analytics", t),
        },
        {
          title: t("categories.marketing.title"),
          description: t("categories.marketing.description"),
          linkedCategory: "marketing",
          cookieTable: cookieTable(lng, "marketing", t),
        },
      ],
    },
  };
}

export async function setupCookieConsent(lang: Lang, i18n: I18n) {
  if (initialized) {
    await CookieConsent.setLanguage(lang, true);
    updateConsentState();
    return;
  }

  initialized = true;

  await CookieConsent.run({
    revision: CONSENT_REVISION,
    mode: "opt-in",
    autoShow: true,
    manageScriptTags: true,
    autoClearCookies: true,
    cookie: {
      name: "fh61_cookie_consent",
      expiresAfterDays: 180,
      sameSite: "Lax",
    },
    guiOptions: {
      consentModal: {
        layout: "box wide",
        position: "bottom right",
        equalWeightButtons: true,
      },
      preferencesModal: {
        layout: "box",
        position: "right",
      },
    },
    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      analytics: {
        enabled: false,
        autoClear: {
          cookies: [
            { name: /^_ga/ },
            { name: "_gid" },
            { name: "_gat" },
          ],
        },
      },
      marketing: {
        enabled: false,
        autoClear: {
          cookies: [
            { name: "_fbp" },
            { name: "fr" },
            { name: "IDE" },
          ],
        },
      },
    },
    language: {
      default: lang,
      translations: Object.fromEntries(
        LANGS.map((lng) => [lng, translationsFor(lng, i18n)]),
      ),
    },
    onConsent: updateConsentState,
    onChange: updateConsentState,
  });

  updateConsentState();
}
