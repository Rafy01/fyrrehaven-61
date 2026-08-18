import React from "react";
import { Helmet } from "react-helmet-async";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiDownload,
  FiDroplet,
  FiEdit3,
  FiEye,
  FiGlobe,
  FiGrid,
  FiInbox,
  FiLink,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiMoon,
  FiPhone,
  FiPieChart,
  FiRepeat,
  FiSmartphone,
  FiSun,
  FiTrendingUp,
  FiTrash2,
  FiUser,
  FiZap,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import QRCode from "qrcode";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { Theme } from "@radix-ui/themes";
import { useNavigate, useParams } from "react-router-dom";

import styles from "./AdminForms.module.css";
import { localTestSubmissions } from "./localTestSubmissions";
import ContactForm from "../../components/ContactForm";
import ExtraServices from "../ExtraServices/ExtraServices";
import CheckInOut from "../guest/CheckInOut/CheckInOut";
import {
  createAdminAuthProvider,
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "../../lib/firebase";

type SubmissionStatus = "pending" | "sent" | "mail_failed";
type MeterKey = "electricity" | "waterHouse" | "waterPool";
type MeterDraftKey = MeterKey | "";

type MeterCorrection = {
  meter?: MeterKey;
  originalValue?: string | null;
  previousValue?: string | null;
  correctedValue?: string | null;
  difference?: number | null;
  updatedAtMs?: number;
  updatedBy?: string | null;
};

type MeterApproval = {
  status?: "approved" | string;
  approvedAtMs?: number | null;
  approvedBy?: string | null;
};

type ExtraItem = NonNullable<NonNullable<Submission["extras"]>["items"]>[number];

type Submission = {
  id: string;
  bookingNumber?: string | number | null;
  bookingNo?: string | number | null;
  reservationNumber?: string | number | null;
  adminNumber?: string | number | null;
  intent?: string;
  lang?: string;
  name?: string;
  email?: string;
  phone?: string;
  country?: string | null;
  countryIso?: string | null;
  message?: string;
  consent?: boolean;
  feesAccepted?: boolean;
  stayPurpose?: string | null;
  guests?: {
    adults?: number;
    children?: number;
    babies?: number;
    total?: number;
  } | null;
  selection?: {
    start?: string | null;
    endExclusive?: string | null;
    nights?: number | null;
    baseNightsTotalDKK?: number | null;
    cleaningFeeDKK?: number | null;
    totalWithCleaningDKK?: number | null;
    airbnbServiceFeeSavingsDKK?: number | null;
    totalAfterAirbnbDiscountDKK?: number | null;
    breakdown?: Array<{
      date?: string | null;
      price?: number | null;
    }>;
  } | null;
  extras?: {
    stayDate?: string | null;
    totalDKK?: number | null;
    items?: Array<{
      id?: string;
      qty?: number;
      unitPriceDKK?: number | null;
      label?: { da?: string; en?: string; de?: string } | null;
    }>;
  } | null;
  checkin?: {
    type?: string;
    typeLabel?: string;
    stayDate?: string | null;
    submittedStayDate?: string | null;
    keycode?: string | null;
    meterReadings?: {
      electricity?: string | null;
      waterHouse?: string | null;
      waterPool?: string | null;
    } | null;
    meterCorrections?: Partial<Record<MeterKey, MeterCorrection>> | null;
    meterApproval?: MeterApproval | null;
    attachments?: Array<{
      fieldname?: string;
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
      storagePath?: string;
      firestoreFileId?: string;
      firestoreChunkCount?: number;
      storageFallback?: string;
      storageUploadError?: string;
      fullPath?: string;
      filePath?: string;
      path?: string;
      storageRef?: string;
      viewUrl?: string;
      dataUrl?: string;
      url?: string;
      downloadUrl?: string;
      publicUrl?: string;
      src?: string;
      viewError?: string;
      uploadError?: string;
    }> | null;
    imageUploadStatus?: "stored" | "failed" | "not-configured" | "none";
    imageUploadError?: string | null;
  } | null;
  status?: SubmissionStatus;
  mailStatus?: "pending" | "sent" | "failed";
  mailError?: string | null;
  mailErrorCode?: string | null;
  adminMailSkipped?: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
  source?: string;
  requestMeta?: {
    ip?: string | null;
    userAgent?: string | null;
    origin?: string | null;
    referer?: string | null;
  } | null;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  detail?: string | null;
  submissions?: Submission[];
  submission?: Submission;
  admin?: { email?: string };
  deleted?: boolean;
  id?: string;
  deletedIds?: string[];
  missingIds?: string[];
  submissionId?: string | null;
  stored?: boolean;
  mailStatus?: "sent" | "failed" | "pending";
};

type Appearance = "light" | "dark";
type SubmissionFilter = "all" | "booking" | "contact" | "extra-services" | "guest-checkin";
type SubmissionDateFilter =
  | "all"
  | "today"
  | "current-week"
  | "last-week"
  | "last-month"
  | "last-3-months"
  | "last-6-months"
  | "year";
type TestSubmissionType =
  | "all"
  | "booking"
  | "contact"
  | "extra-services"
  | "checkin"
  | "checkout";
type TestRunResult = {
  type: Exclude<TestSubmissionType, "all">;
  label: string;
  status: "sent" | "failed" | "error";
  submissionId?: string | null;
  deleted?: boolean;
  detail?: string;
};
type GroupDetailSelection = "overview" | string;
type CheckinDetailSelection = "checkin" | "checkout";
type ImagePreview = {
  submission: Submission;
  attachment: NonNullable<NonNullable<Submission["checkin"]>["attachments"]>[number];
  index: number;
};
type SubmissionGroup = {
  id: string;
  primary: Submission;
  items: Submission[];
  labels: string[];
  bookingNumber: string;
};
type DeleteTarget = {
  groupId: string;
  bookingNumber: string;
  primary: Submission;
  items: Submission[];
  labels: string[];
};
type DashboardStats = {
  total: number;
  sent: number;
  failed: number;
  latestAtMs?: number;
};
type AdminPageKey = "statistics" | "submissions" | "manual" | "test" | "qr";
type StatisticsBreakdownRow = {
  label: string;
  count: number;
  sent: number;
  failed: number;
  valueDKK: number;
};
type AdminStatistics = {
  total: number;
  publicCount: number;
  privateCount: number;
  sent: number;
  failed: number;
  pending: number;
  uniqueGuests: number;
  bookingCount: number;
  bookingNights: number;
  bookingRevenueDKK: number;
  extraRevenueDKK: number;
  totalKnownRevenueDKK: number;
  averageBookingDKK: number | null;
  checkinCount: number;
  checkoutCount: number;
  approvedCheckins: number;
  pendingCheckinApproval: number;
  latestAtMs?: number;
  firstAtMs?: number;
  formRows: StatisticsBreakdownRow[];
  sourceRows: StatisticsBreakdownRow[];
  countryRows: Array<{ label: string; count: number }>;
  recentRows: Submission[];
};
type AnalyticsRow = {
  label: string;
  count: number;
};
type AnalyticsPageRow = {
  path: string;
  views: number;
  visitors: number;
  averageTimeMs: number;
  entries: number;
  exits: number;
  exitRate: number;
};
type AdminAnalyticsSummary = {
  totals: {
    events: number;
    pageViews: number;
    visitors: number;
    sessions: number;
    liveVisitors: number;
    bounceRate: number;
    averageSessionMs: number;
    averagePageTimeMs: number;
    averageLoadMs: number;
  };
  pages: AnalyticsPageRow[];
  countries: AnalyticsRow[];
  devices: AnalyticsRow[];
  browsers: AnalyticsRow[];
  os: AnalyticsRow[];
  referrers: AnalyticsRow[];
  siteAreas: AnalyticsRow[];
  languages: AnalyticsRow[];
  campaigns: AnalyticsRow[];
  entryPages: AnalyticsRow[];
  exitPages: AnalyticsRow[];
  hourly: AnalyticsRow[];
  daily: AnalyticsRow[];
};
type QrOverlayMode = "logo" | "text" | "image" | "none";
type QrStatsRow = {
  id: string;
  label: string;
  destination: string;
  scans: number;
  lastScanMs: number;
};
type SavedQrCode = {
  id: string;
  label: string;
  destination: string;
  tracked: boolean;
  foreground: string;
  background: string;
  size: number;
  margin: number;
  errorCorrection: QrErrorCorrectionLevel;
  overlayMode: QrOverlayMode;
  overlayText: string;
  overlayScale: number;
  overlayBackground: string;
  frameEnabled: boolean;
  frameText1: string;
  frameText2: string;
  frameLinkText: string;
  frameLinkAuto: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
};
type AdminQrStats = {
  totals: {
    scans: number;
    uniqueVisitors: number;
    qrCodes: number;
    lastScanMs: number;
  };
  qrCodes: QrStatsRow[];
  daily: AnalyticsRow[];
  hourly: AnalyticsRow[];
  devices: AnalyticsRow[];
  countries: AnalyticsRow[];
  referrers: AnalyticsRow[];
  recent: Array<{
    id: string;
    label: string;
    destination: string;
    createdAtMs: number;
    deviceType: string;
    country: string;
  }>;
  saved: SavedQrCode[];
};

function emptyAnalyticsSummary(): AdminAnalyticsSummary {
  return {
    totals: {
      events: 0,
      pageViews: 0,
      visitors: 0,
      sessions: 0,
      liveVisitors: 0,
      bounceRate: 0,
      averageSessionMs: 0,
      averagePageTimeMs: 0,
      averageLoadMs: 0,
    },
    pages: [],
    countries: [],
    devices: [],
    browsers: [],
    os: [],
    referrers: [],
    siteAreas: [],
    languages: [],
    campaigns: [],
    entryPages: [],
    exitPages: [],
    hourly: [],
    daily: [],
  };
}

const APPEARANCE_STORAGE_KEY = "fyrrehaven-appearance";
const PUBLIC_SITE_URL = "https://fyrrehaven-61.dk";
const DEFAULT_QR_LOGO_SRC = "/logo_trans.png";
const QR_TRACKING_PATH = "/api/qr";
const DEFAULT_QR_GOLD = "#9f9418";
const SUBMISSION_BATCH_SIZE = 18;
const DASHBOARD_AUTH_DISABLED = import.meta.env.DEV;
const CHECKIN_GROUP_DETAIL = "guest-checkin";
const CONTACT_GROUP_DETAIL = "contact";
const ADMIN_DETAIL_SLUGS = new Set([
  "overview",
  "booking",
  "contact",
  "extra-services",
  "checkin",
  "checkout",
]);
const ADMIN_RESERVED_ROUTES = new Set([
  "forms",
  "statistics",
  "test-submissions",
  "manual-submission",
  "qr-codes",
]);
const QR_ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;
type QrErrorCorrectionLevel = (typeof QR_ERROR_CORRECTION_LEVELS)[number];
const QR_GUEST_LINK_PRESETS = [
  {
    key: "check-inout",
    label: "Check-in/out",
    destination: `${PUBLIC_SITE_URL}/guest/en/check-inout`,
    text1: "Check-in",
    text2: "Check-out",
  },
  {
    key: "pool",
    label: "Pool",
    destination: `${PUBLIC_SITE_URL}/guest/en/pool`,
    text1: "Pool",
    text2: "Guide",
  },
  {
    key: "sauna",
    label: "Sauna",
    destination: `${PUBLIC_SITE_URL}/guest/en/sauna`,
    text1: "Sauna",
    text2: "Guide",
  },
  {
    key: "activity-room",
    label: "Activity room",
    destination: `${PUBLIC_SITE_URL}/guest/en/activity-room`,
    text1: "Activity room",
    text2: "Guide",
  },
  {
    key: "website-home",
    label: "Website homepage",
    destination: `${PUBLIC_SITE_URL}/en`,
    text1: "Fyrrehaven 61",
    text2: "Website",
  },
  {
    key: "espresso",
    label: "Espresso machine",
    destination: `${PUBLIC_SITE_URL}/guest/en/practical-info#coffee`,
    text1: "Espresso",
    text2: "Machine",
  },
  {
    key: "spa",
    label: "Spa",
    destination: `${PUBLIC_SITE_URL}/guest/en/hot-tub`,
    text1: "Spa",
    text2: "Guide",
  },
  {
    key: "sofa-bed",
    label: "Sofa bed",
    destination: `${PUBLIC_SITE_URL}/guest/en/practical-info#sofa`,
    text1: "Sofa bed",
    text2: "Guide",
  },
  {
    key: "fees",
    label: "Fees",
    destination: `${PUBLIC_SITE_URL}/en/fees`,
    text1: "Fees",
    text2: "Overview",
  },
  {
    key: "wifi",
    label: "Wifi",
    destination: "WIFI:T:WPA;S:HabibiHytten;P:Dolma3000;;",
    text1: "Wi-Fi",
    text2: "Connect",
    linkText: "WiFi: HabibiHytten",
    tracked: false,
  },
  {
    key: "house-manual",
    label: "House manual",
    destination: `${PUBLIC_SITE_URL}/guest/en/manual`,
    text1: "House",
    text2: "Manual",
  },
] as const;
const LOCAL_DASHBOARD_FALLBACK =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
const METER_OPTIONS: Array<{
  key: MeterKey;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: "electricity", label: "Electricity", icon: <FiZap aria-hidden="true" /> },
  { key: "waterHouse", label: "Water (house)", icon: <FiDroplet aria-hidden="true" /> },
  { key: "waterPool", label: "Water (pool)", icon: <FiDroplet aria-hidden="true" /> },
];
const ADMIN_DATE_FILTER_OPTIONS: Array<{
  value: SubmissionDateFilter;
  label: string;
}> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "current-week", label: "Current week" },
  { value: "last-week", label: "Last week" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "year", label: "This year" },
];

function readAppearance(): Appearance {
  if (typeof window === "undefined") return "light";
  const value = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (value === "light" || value === "dark") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function formatDateTime(value?: number) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addLocalMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function dateFilterRange(filter: SubmissionDateFilter) {
  const today = startOfLocalDay();
  const tomorrow = addLocalDays(today, 1);
  const currentWeekStart = addLocalDays(today, -((today.getDay() + 6) % 7));

  switch (filter) {
    case "today":
      return { from: today.getTime(), to: tomorrow.getTime() };
    case "current-week":
      return {
        from: currentWeekStart.getTime(),
        to: addLocalDays(currentWeekStart, 7).getTime(),
      };
    case "last-week": {
      const lastWeekStart = addLocalDays(currentWeekStart, -7);
      return {
        from: lastWeekStart.getTime(),
        to: currentWeekStart.getTime(),
      };
    }
    case "last-month":
      return { from: addLocalMonths(today, -1).getTime(), to: tomorrow.getTime() };
    case "last-3-months":
      return { from: addLocalMonths(today, -3).getTime(), to: tomorrow.getTime() };
    case "last-6-months":
      return { from: addLocalMonths(today, -6).getTime(), to: tomorrow.getTime() };
    case "year":
      return {
        from: new Date(today.getFullYear(), 0, 1).getTime(),
        to: new Date(today.getFullYear() + 1, 0, 1).getTime(),
      };
    default:
      return null;
  }
}

function submissionMatchesTypeFilter(
  submission: Submission,
  filter: SubmissionFilter
) {
  if (filter === "all") return true;
  if (filter === "booking") return submission.intent === "booking";
  if (filter === "extra-services") return submission.intent === "extra-services";
  if (filter === "guest-checkin") return submission.intent === "guest-checkin";
  return isContactSubmission(submission);
}

function bookingNumberPrefix(hasBookingInfo: boolean) {
  return hasBookingInfo ? "9" : "7";
}

function bookingNumberFallback(value: number | undefined, hasBookingInfo: boolean) {
  if (!value) return null;
  const suffix = String(Math.abs(value) % 10000).padStart(4, "0");
  return `${bookingNumberPrefix(hasBookingInfo)}${suffix}`;
}

function stringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function fiveDigitNumber(value: string | null, hasBookingInfo?: boolean) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 5) {
    if (hasBookingInfo == null || digits.startsWith(bookingNumberPrefix(hasBookingInfo))) {
      return digits;
    }
    return `${bookingNumberPrefix(hasBookingInfo)}${digits.slice(1)}`;
  }
  if (digits.length > 5) {
    const suffix = digits.slice(-4);
    return `${bookingNumberPrefix(Boolean(hasBookingInfo))}${suffix}`;
  }
  return null;
}

function formatPlainDate(value?: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value;
  return `${match[3]}. ${match[2]}. ${match[1]}`;
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number, total: number) {
  if (!total) return "0%";
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / total);
}

function formatRatio(value?: number | null) {
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatDuration(ms?: number | null) {
  const seconds = Math.max(0, Math.round((ms || 0) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function renderPriceAmount(value?: number | null, options?: { negative?: boolean }) {
  if (typeof value !== "number") return "—";
  const amount = new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return (
    <span className={styles.priceAmount}>
      <span className={styles.priceCurrency}>DKK</span>
      <span className={styles.priceNumber}>
        {options?.negative ? `-${amount}` : amount}
      </span>
    </span>
  );
}

function isMeterKey(value?: string | null): value is MeterKey {
  return value === "electricity" || value === "waterHouse" || value === "waterPool";
}

function meterIcon(value: MeterKey) {
  return METER_OPTIONS.find((option) => option.key === value)?.icon || null;
}

function meterKeyFromAttachment(
  attachment?: ImagePreview["attachment"] | null
): MeterDraftKey {
  return isMeterKey(attachment?.fieldname) ? attachment.fieldname : "";
}

function imagePreviewKey(preview: ImagePreview | null) {
  if (!preview) return "";
  const attachment = preview.attachment;
  return [
    preview.submission.id,
    attachment.storagePath ||
      attachment.firestoreFileId ||
      attachment.fullPath ||
      attachment.filePath ||
      attachment.path ||
      attachment.storageRef ||
      attachment.filename ||
      "image",
    preview.index,
  ].join(":");
}

function parseMeterNumber(value?: string | number | null) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMeterNumber(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 3,
  }).format(value);
}

function formatMeterDifference(value?: number | null) {
  const formatted = formatMeterNumber(Math.abs(value ?? 0));
  if (!formatted || value == null) return "—";
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "-"}${formatted}`;
}

function statusLabel(status?: SubmissionStatus) {
  switch (status) {
    case "sent":
      return "Email sent";
    case "mail_failed":
      return "Email failed";
    default:
      return "Pending";
  }
}

function submissionLabel(submission: Submission) {
  switch (submission.intent) {
    case "booking":
      return "Booking";
    case "guest-checkin":
      return "Check-in/out";
    case "extra-services":
      return "Extra services";
    case "other":
      return "Other";
    default:
      return "Contact";
  }
}

function submissionTabLabel(submission: Submission) {
  if (submission.intent === "guest-checkin") {
    return "Check-in/out";
  }

  return submissionLabel(submission);
}

function isCheckinSubmission(submission: Submission) {
  return submission.intent === "guest-checkin" && Boolean(submission.checkin);
}

function isCheckoutSubmission(submission: Submission) {
  return isCheckinSubmission(submission) && submission.checkin?.type === "checkout";
}

function isContactSubmission(submission: Submission) {
  return (
    !submission.intent ||
    submission.intent === "inquiry" ||
    submission.intent === "contact"
  );
}

function submissionBookingNumber(
  submission: Submission,
  hasBookingInfo?: boolean
) {
  const selection = submission.selection as
    | (Submission["selection"] & {
        bookingNumber?: unknown;
        bookingNo?: unknown;
        reservationNumber?: unknown;
      })
    | null
    | undefined;

  return (
    fiveDigitNumber(stringValue(submission.bookingNumber), hasBookingInfo) ||
    fiveDigitNumber(stringValue(submission.bookingNo), hasBookingInfo) ||
    fiveDigitNumber(stringValue(submission.reservationNumber), hasBookingInfo) ||
    fiveDigitNumber(stringValue(submission.adminNumber), hasBookingInfo) ||
    fiveDigitNumber(stringValue(selection?.bookingNumber), hasBookingInfo) ||
    fiveDigitNumber(stringValue(selection?.bookingNo), hasBookingInfo) ||
    fiveDigitNumber(stringValue(selection?.reservationNumber), hasBookingInfo) ||
    null
  );
}

function groupBookingNumber(items: Submission[]) {
  const hasBookingInfo = items.some(
    (submission) => submission.intent === "booking" || Boolean(submission.selection)
  );
  const bookingSource =
    items.find((submission) => submission.intent === "booking") ||
    items.find((submission) => Boolean(submission.selection)) ||
    items[0];

  return (
    (bookingSource && submissionBookingNumber(bookingSource, hasBookingInfo)) ||
    bookingNumberFallback(bookingSource?.createdAtMs, hasBookingInfo) ||
    bookingSource?.id ||
    "unknown"
  );
}

function detailSlugForSubmission(submission: Submission) {
  if (submission.intent === "booking") return "booking";
  if (submission.intent === "extra-services") return "extra-services";
  if (isContactSubmission(submission)) return "contact";
  if (isCheckinSubmission(submission)) return submission.checkin?.type || "checkin";
  return submission.id;
}

function checkinDetailFromValue(value?: string | null): CheckinDetailSelection {
  return value === "checkout" ? "checkout" : "checkin";
}

function adminSubmissionPath(submissionId: string, detailSlug?: string | null) {
  const encodedId = encodeURIComponent(submissionId);
  const normalizedDetail =
    detailSlug && detailSlug !== "overview" ? `/${encodeURIComponent(detailSlug)}` : "";
  return `/admin/${encodedId}${normalizedDetail}`;
}

function routeDetailSlug(value?: string) {
  if (!value) return "overview";
  const decoded = decodeURIComponent(value).trim();
  return ADMIN_DETAIL_SLUGS.has(decoded) ? decoded : decoded || "overview";
}

function submissionFailed(submission?: Submission | null) {
  return submission?.status === "mail_failed" || submission?.mailStatus === "failed";
}

function submissionOk(submission?: Submission | null) {
  return submission?.status === "sent" || submission?.mailStatus === "sent";
}

function submissionStatusIcon(submission?: Submission | null) {
  if (submissionFailed(submission)) {
    return (
      <FiAlertCircle
        aria-hidden="true"
        className={`${styles.tabStatusIcon} ${styles.tabStatusError}`}
      />
    );
  }
  if (submissionOk(submission)) {
    return (
      <FiCheckCircle
        aria-hidden="true"
        className={`${styles.tabStatusIcon} ${styles.tabStatusOk}`}
      />
    );
  }
  return null;
}

function submissionGroupStatusIcon(submissions: Submission[]) {
  return submissionStatusIcon(
    submissions.find(submissionFailed) || submissions.find(submissionOk)
  );
}

function submissionValue(submission: Submission) {
  if (submission.selection?.totalAfterAirbnbDiscountDKK != null) {
    return formatMoney(submission.selection.totalAfterAirbnbDiscountDKK);
  }
  if (submission.selection?.totalWithCleaningDKK != null) {
    return formatMoney(submission.selection.totalWithCleaningDKK);
  }
  if (submission.extras?.totalDKK != null) {
    return formatMoney(submission.extras.totalDKK);
  }
  return null;
}

function submissionValueDKK(submission: Submission) {
  if (submission.selection?.totalAfterAirbnbDiscountDKK != null) {
    return submission.selection.totalAfterAirbnbDiscountDKK;
  }
  if (submission.selection?.totalWithCleaningDKK != null) {
    return submission.selection.totalWithCleaningDKK;
  }
  if (submission.extras?.totalDKK != null) {
    return submission.extras.totalDKK;
  }
  return 0;
}

function statisticsTypeKey(submission: Submission) {
  if (submission.intent === "booking") return "Booking";
  if (submission.intent === "extra-services") return "Extra services";
  if (isCheckinSubmission(submission)) {
    return submission.checkin?.type === "checkout" ? "Check-out" : "Check-in";
  }
  if (isContactSubmission(submission)) return "Contact";
  return submissionLabel(submission);
}

function statisticsSourceKey(submission: Submission) {
  if (submission.adminMailSkipped) return "Admin/manual";
  if (submission.source === "guest-form") return "Guest/private";
  if (submission.source === "website") return "Public website";
  return submission.source || "Unknown";
}

function incrementStatisticsRow(
  map: Map<string, StatisticsBreakdownRow>,
  key: string,
  submission: Submission
) {
  const existing =
    map.get(key) ||
    {
      label: key,
      count: 0,
      sent: 0,
      failed: 0,
      valueDKK: 0,
    };

  existing.count += 1;
  if (submissionOk(submission)) existing.sent += 1;
  if (submissionFailed(submission)) existing.failed += 1;
  existing.valueDKK += submissionValueDKK(submission);
  map.set(key, existing);
}

function sortedStatisticsRows(map: Map<string, StatisticsBreakdownRow>) {
  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

function buildAdminStatistics(submissions: Submission[]): AdminStatistics {
  const formRows = new Map<string, StatisticsBreakdownRow>();
  const sourceRows = new Map<string, StatisticsBreakdownRow>();
  const countries = new Map<string, number>();
  const emails = new Set<string>();
  const sorted = [...submissions].sort(
    (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
  );

  let publicCount = 0;
  let privateCount = 0;
  let sent = 0;
  let failed = 0;
  let pending = 0;
  let bookingCount = 0;
  let bookingNights = 0;
  let bookingRevenueDKK = 0;
  let extraRevenueDKK = 0;
  let checkinCount = 0;
  let checkoutCount = 0;
  let approvedCheckins = 0;

  for (const submission of sorted) {
    const sourceKey = statisticsSourceKey(submission);
    if (sourceKey === "Public website") {
      publicCount += 1;
    } else {
      privateCount += 1;
    }

    if (submissionOk(submission)) sent += 1;
    else if (submissionFailed(submission)) failed += 1;
    else pending += 1;

    const email = submission.email?.trim().toLowerCase();
    if (email) emails.add(email);

    const country = countryCode(submission);
    if (country) {
      countries.set(country, (countries.get(country) || 0) + 1);
    }

    if (submission.intent === "booking") {
      bookingCount += 1;
      bookingNights += submission.selection?.nights || 0;
      bookingRevenueDKK +=
        submission.selection?.totalAfterAirbnbDiscountDKK ||
        submission.selection?.totalWithCleaningDKK ||
        0;
    }

    if (submission.intent === "extra-services") {
      extraRevenueDKK += submission.extras?.totalDKK || 0;
    }

    if (isCheckinSubmission(submission)) {
      if (submission.checkin?.type === "checkout") checkoutCount += 1;
      else checkinCount += 1;

      if (submission.checkin?.meterApproval?.status === "approved") {
        approvedCheckins += 1;
      }
    }

    incrementStatisticsRow(formRows, statisticsTypeKey(submission), submission);
    incrementStatisticsRow(sourceRows, sourceKey, submission);
  }

  const totalCheckForms = checkinCount + checkoutCount;
  const countryRows = [...countries.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 6);

  return {
    total: sorted.length,
    publicCount,
    privateCount,
    sent,
    failed,
    pending,
    uniqueGuests: emails.size,
    bookingCount,
    bookingNights,
    bookingRevenueDKK,
    extraRevenueDKK,
    totalKnownRevenueDKK: bookingRevenueDKK + extraRevenueDKK,
    averageBookingDKK: bookingCount > 0 ? bookingRevenueDKK / bookingCount : null,
    checkinCount,
    checkoutCount,
    approvedCheckins,
    pendingCheckinApproval: Math.max(0, totalCheckForms - approvedCheckins),
    latestAtMs: sorted[0]?.createdAtMs,
    firstAtMs: sorted[sorted.length - 1]?.createdAtMs,
    formRows: sortedStatisticsRows(formRows),
    sourceRows: sortedStatisticsRows(sourceRows),
    countryRows,
    recentRows: sorted.slice(0, 6),
  };
}

function statusClassName(status?: SubmissionStatus) {
  switch (status) {
    case "sent":
      return styles.statusSent;
    case "mail_failed":
      return styles.statusFailed;
    default:
      return styles.statusPending;
  }
}

function submissionContextTag(submission: Submission) {
  if (submission.selection?.nights) {
    return `${submission.selection.nights} night${
      submission.selection.nights === 1 ? "" : "s"
    }`;
  }

  if (submission.extras?.stayDate) {
    return `Stay: ${formatPlainDate(submission.extras.stayDate)}`;
  }

  if (submission.checkin?.typeLabel) {
    return submission.checkin.typeLabel;
  }

  return null;
}

function hasDisplayValue(value: React.ReactNode) {
  if (value == null || value === false) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== "—";
  }
  return true;
}

function countryCode(submission?: Submission | null) {
  return submission?.countryIso || submission?.country || null;
}

function displayNameWithCountry(submission?: Submission | null) {
  const name = submission?.name || "Submission";
  const country = countryCode(submission);
  return country ? `${name} (${country})` : name;
}

function renderSelectionPriceBreakdown(selection?: Submission["selection"] | null) {
  if (!selection) return null;

  const nightlyBreakdown = Array.isArray(selection.breakdown)
    ? selection.breakdown.filter(
        (night) => night?.date && typeof night.price === "number"
      )
    : [];
  const hasBreakdown =
    selection.baseNightsTotalDKK != null ||
    selection.cleaningFeeDKK != null ||
    selection.airbnbServiceFeeSavingsDKK != null ||
    nightlyBreakdown.length > 0;

  if (!hasBreakdown) return null;

  return (
    <div className={styles.priceBreakdown}>
      {nightlyBreakdown.length > 0 && selection.baseNightsTotalDKK != null ? (
        <details className={styles.nightlyBreakdownDetails}>
          <summary className={styles.nightlyBreakdownSummary}>
            <span>
              Price ({nightlyBreakdown.length} night
              {nightlyBreakdown.length === 1 ? "" : "s"})
            </span>
            <span>{renderPriceAmount(selection.baseNightsTotalDKK)}</span>
          </summary>
          <div className={styles.nightlyBreakdown} aria-label="Nightly price breakdown">
            {nightlyBreakdown.map((night) => (
              <div className={styles.priceBreakdownRow} key={night.date}>
                <span>{formatPlainDate(night.date)}</span>
                <span>{renderPriceAmount(night.price)}</span>
              </div>
            ))}
          </div>
        </details>
      ) : selection.baseNightsTotalDKK != null ? (
        <div className={styles.priceBreakdownRow}>
          <span>Price (nights)</span>
          <span>{renderPriceAmount(selection.baseNightsTotalDKK)}</span>
        </div>
      ) : nightlyBreakdown.length > 0 ? (
        <details className={styles.nightlyBreakdownDetails}>
          <summary className={styles.nightlyBreakdownSummary}>
            <span>
              Price ({nightlyBreakdown.length} night
              {nightlyBreakdown.length === 1 ? "" : "s"})
            </span>
            <span>
              {nightlyBreakdown.length} night
              {nightlyBreakdown.length === 1 ? "" : "s"}
            </span>
          </summary>
          <div className={styles.nightlyBreakdown} aria-label="Nightly price breakdown">
            {nightlyBreakdown.map((night) => (
              <div className={styles.priceBreakdownRow} key={night.date}>
                <span>{formatPlainDate(night.date)}</span>
                <span>{renderPriceAmount(night.price)}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
      {selection.cleaningFeeDKK != null ? (
        <div className={styles.priceBreakdownRow}>
          <span>Cleaning</span>
          <span>{renderPriceAmount(selection.cleaningFeeDKK)}</span>
        </div>
      ) : null}
      {selection.airbnbServiceFeeSavingsDKK != null ? (
        <div className={styles.priceBreakdownRow}>
          <span>Direct booking discount</span>
          <span>
            {renderPriceAmount(selection.airbnbServiceFeeSavingsDKK, {
              negative: true,
            })}
          </span>
        </div>
      ) : null}
      {selection.totalAfterAirbnbDiscountDKK != null ||
      selection.totalWithCleaningDKK != null ? (
        <div className={`${styles.priceBreakdownRow} ${styles.priceBreakdownTotal}`}>
          <span>Final total</span>
          <span>
            {renderPriceAmount(
              selection.totalAfterAirbnbDiscountDKK ??
                selection.totalWithCleaningDKK ??
                null
            )}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function renderExtrasPriceBreakdown(extras?: Submission["extras"] | null) {
  if (!extras?.items?.length) return null;

  return (
    <div className={styles.priceBreakdown}>
      {extras.items.map((item, index) => {
        const total =
          typeof item.qty === "number" && typeof item.unitPriceDKK === "number"
            ? item.qty * item.unitPriceDKK
            : null;
        const quantity =
          typeof item.qty === "number"
            ? isYesNoExtraItem(item)
              ? "Yes"
              : `x ${item.qty}`
            : null;

        return (
          <div className={styles.priceBreakdownRow} key={`${item.id || "extra-total"}-${index}`}>
            <span>
              {item.label?.en || item.label?.da || item.id || "Extra"}
              {quantity ? (
                <small className={styles.priceBreakdownMeta}>{quantity}</small>
              ) : null}
            </span>
            <span>{total != null ? renderPriceAmount(total) : "—"}</span>
          </div>
        );
      })}
      {extras.totalDKK != null ? (
        <div className={`${styles.priceBreakdownRow} ${styles.priceBreakdownTotal}`}>
          <span>Final total</span>
          <span>{renderPriceAmount(extras.totalDKK)}</span>
        </div>
      ) : null}
    </div>
  );
}

function extraItemLabel(item: ExtraItem) {
  return item.label?.en || item.label?.da || item.label?.de || item.id || "Extra";
}

function isYesNoExtraItem(item: ExtraItem) {
  const value = `${item.id || ""} ${extraItemLabel(item)}`.toLowerCase();
  return (
    value.includes("high chair") ||
    value.includes("high-chair") ||
    value.includes("baby cot") ||
    value.includes("baby-cot") ||
    value.includes("baby crib") ||
    value.includes("crib") ||
    value.includes("hot tub fill") ||
    value.includes("hot-tub-fill") ||
    value.includes("vildmarksbad")
  );
}

function hasGuestBreakdown(guests?: Submission["guests"] | null) {
  return Boolean(
    guests &&
      (typeof guests.adults === "number" ||
        typeof guests.children === "number" ||
        typeof guests.babies === "number")
  );
}

function loggedLabel(submission?: Submission | null) {
  if (!submission?.createdAtMs) return "Logged date unavailable";
  return `Logged ${formatDateTime(submission.createdAtMs)}`;
}

function isActivationKey(event: React.KeyboardEvent) {
  return event.key === "Enter" || event.key === " ";
}

function normalizeEmail(email?: string | null) {
  const value = email?.trim().toLowerCase();
  return value ? value : null;
}

function normalizeArrivalDate(submission: Submission) {
  const value =
    submission.selection?.start?.trim() ||
    submission.extras?.stayDate?.trim() ||
    checkinSubmittedStayDate(submission);
  return value ? value : null;
}

function submissionCreatedPlainDate(submission?: Submission | null) {
  if (!submission?.createdAtMs) return null;
  return new Date(submission.createdAtMs).toISOString().slice(0, 10);
}

function checkinSubmittedStayDate(submission?: Submission | null) {
  const value =
    submission?.checkin?.stayDate?.trim() ||
    submission?.checkin?.submittedStayDate?.trim() ||
    submissionCreatedPlainDate(submission);
  return value || null;
}

function findOverviewStayDate(group: SubmissionGroup | null, fallback?: Submission | null) {
  const submissions = group?.items?.length ? group.items : fallback ? [fallback] : [];
  const bookingStart = submissions.find((submission) => submission.selection?.start)
    ?.selection?.start;
  const extraStayDate = submissions.find((submission) => submission.extras?.stayDate)
    ?.extras?.stayDate;
  const checkinDate = checkinSubmittedStayDate(
    submissions.find((submission) => submission.checkin?.type === "checkin")
  );
  const anyCheckinDate = checkinSubmittedStayDate(
    submissions.find((submission) => isCheckinSubmission(submission))
  );
  return bookingStart || extraStayDate || checkinDate || anyCheckinDate || null;
}

function findOverviewCheckoutDate(group: SubmissionGroup | null, fallback?: Submission | null) {
  const submissions = group?.items?.length ? group.items : fallback ? [fallback] : [];
  return (
    submissions.find((submission) => submission.selection?.endExclusive)?.selection
      ?.endExclusive ||
    checkinSubmittedStayDate(
      submissions.find((submission) => submission.checkin?.type === "checkout")
    ) ||
    null
  );
}

function findSubmissionWithValue(
  submissions: Submission[],
  getValue: (submission: Submission) => React.ReactNode
) {
  return submissions.find((submission) => hasDisplayValue(getValue(submission))) || null;
}

function uniqueSubmissionValues(
  submissions: Submission[],
  getValue: (submission: Submission) => string | null | undefined
) {
  return Array.from(
    new Set(
      submissions
        .map((submission) => getValue(submission)?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
}

function getSubmissionTypePriority(submission: Submission) {
  if (submission.intent === "booking") return 0;
  if (!submission.intent || submission.intent === "inquiry") return 1;
  if (submission.intent === "extra-services") return 2;
  if (submission.intent === "guest-checkin") return 3;
  return 4;
}

function findOverviewContactSubmission(
  submissions: Submission[],
  key: "email" | "phone"
) {
  return [...submissions]
    .sort(
      (a, b) =>
        getSubmissionTypePriority(a) - getSubmissionTypePriority(b) ||
        (b.createdAtMs || 0) - (a.createdAtMs || 0)
    )
    .find((submission) => hasDisplayValue(submission[key])) || null;
}

function findOverviewBookingSubmission(submissions: Submission[]) {
  return (
    submissions.find((submission) => submission.intent === "booking" && submission.selection) ||
    submissions.find((submission) => submission.selection) ||
    null
  );
}

function buildSubmissionGroups(submissions: Submission[]): SubmissionGroup[] {
  if (submissions.length === 0) return [];

  const groups: Submission[][] = [];
  const chronological = [...submissions].sort(
    (a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0)
  );

  function groupHasMatchingKey(group: Submission[], submission: Submission) {
    const email = normalizeEmail(submission.email);
    const arrival = normalizeArrivalDate(submission);

    return group.some((item) => {
      const itemEmail = normalizeEmail(item.email);
      const itemArrival = normalizeArrivalDate(item);
      return Boolean(
        (email && itemEmail === email) || (arrival && itemArrival === arrival)
      );
    });
  }

  function groupClosedBefore(group: Submission[], submission: Submission) {
    const submittedAt = submission.createdAtMs || 0;
    return group.some(
      (item) => isCheckoutSubmission(item) && (item.createdAtMs || 0) < submittedAt
    );
  }

  chronological.forEach((submission) => {
    const matchingIndexes = groups
      .map((group, index) =>
        groupHasMatchingKey(group, submission) && !groupClosedBefore(group, submission)
          ? index
          : -1
      )
      .filter((index) => index >= 0);

    if (matchingIndexes.length === 0) {
      groups.push([submission]);
      return;
    }

    const targetIndex = matchingIndexes[0];
    groups[targetIndex].push(submission);

    for (const index of matchingIndexes.slice(1).sort((a, b) => b - a)) {
      groups[targetIndex].push(...groups[index]);
      groups.splice(index, 1);
    }
  });

  return groups
    .map((items) => {
      const sorted = [...items].sort(
        (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
      );
      const bookingNumber = groupBookingNumber(sorted);

      return {
        id: bookingNumber,
        primary: sorted[0],
        items: sorted,
        labels: Array.from(
          new Set(sorted.map((submission) => submissionLabel(submission)))
        ),
        bookingNumber,
      };
    })
    .sort((a, b) => (b.primary.createdAtMs || 0) - (a.primary.createdAtMs || 0));
}

function qrSlug(value: string) {
  return (value || "qr-code")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

function qrHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function qrCodeId(label: string, destination: string) {
  return `${qrSlug(label)}-${qrHash(`${label}:${destination}`)}`;
}

function qrTrackingUrl(id: string, label: string, destination: string) {
  const params = new URLSearchParams({
    id,
    label: label.trim() || "Untitled QR code",
    to: destination,
  });
  return `${PUBLIC_SITE_URL}${QR_TRACKING_PATH}?${params.toString()}`;
}

function displayQrLink(value: string) {
  const text = value.trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    return `${url.hostname}${url.pathname}${url.hash}`.replace(/\/$/, "");
  } catch {
    return text;
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The center image could not be loaded."));
    image.src = src;
  });
}

export default function AdminForms() {
  const navigate = useNavigate();
  const { "*": adminPath = "" } = useParams<{ "*": string }>();
  const [routeSubmissionId, routeAdminDetail] = adminPath.split("/");
  const isStatisticsPage = routeSubmissionId === "statistics";
  const isTestSubmissionsPage = routeSubmissionId === "test-submissions";
  const isManualSubmissionPage = routeSubmissionId === "manual-submission";
  const isQrCodesPage = routeSubmissionId === "qr-codes";
  const routeSelectedId =
    routeSubmissionId && !ADMIN_RESERVED_ROUTES.has(routeSubmissionId)
      ? decodeURIComponent(routeSubmissionId)
      : null;
  const activeRouteDetail = routeDetailSlug(routeAdminDetail);
  const [appearance, setAppearance] = React.useState<Appearance>(() =>
    readAppearance()
  );
  const [user, setUser] = React.useState<User | null>(
    DASHBOARD_AUTH_DISABLED ? ({} as User) : null
  );
  const [authReady, setAuthReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = React.useState(false);
  const [hasLoadedSubmissions, setHasLoadedSubmissions] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adminEmail, setAdminEmail] = React.useState<string>("");
  const [submissionFilter, setSubmissionFilter] =
    React.useState<SubmissionFilter>("all");
  const [dateFilter, setDateFilter] = React.useState<SubmissionDateFilter>("all");
  const [statisticsDateFilter, setStatisticsDateFilter] =
    React.useState<SubmissionDateFilter>("all");
  const [qrStatsDateFilter, setQrStatsDateFilter] =
    React.useState<SubmissionDateFilter>("all");
  const [analytics, setAnalytics] = React.useState<AdminAnalyticsSummary | null>(
    null
  );
  const [isLoadingAnalytics, setIsLoadingAnalytics] = React.useState(false);
  const [analyticsError, setAnalyticsError] = React.useState<string | null>(null);
  const [renderedGroupCount, setRenderedGroupCount] =
    React.useState(SUBMISSION_BATCH_SIZE);
  const [testSubmissionType, setTestSubmissionType] =
    React.useState<TestSubmissionType>("all");
  const [qrValue, setQrValue] = React.useState(`${PUBLIC_SITE_URL}/en/check-in-out`);
  const [qrLabel, setQrLabel] = React.useState("Check-in and check-out");
  const [qrForeground, setQrForeground] = React.useState(DEFAULT_QR_GOLD);
  const [qrBackground, setQrBackground] = React.useState("#ffffff");
  const [qrSize, setQrSize] = React.useState(720);
  const [qrMargin, setQrMargin] = React.useState(3);
  const [qrErrorCorrection, setQrErrorCorrection] =
    React.useState<QrErrorCorrectionLevel>("H");
  const [qrTracked, setQrTracked] = React.useState(true);
  const [qrOverlayMode, setQrOverlayMode] = React.useState<QrOverlayMode>("logo");
  const [qrOverlayText, setQrOverlayText] = React.useState("61");
  const [qrOverlayImage, setQrOverlayImage] = React.useState("");
  const [qrOverlayScale, setQrOverlayScale] = React.useState(22);
  const [qrOverlayBackground, setQrOverlayBackground] = React.useState("#000000");
  const [qrFrameEnabled, setQrFrameEnabled] = React.useState(true);
  const [qrFrameText1, setQrFrameText1] = React.useState("Check-in");
  const [qrFrameText2, setQrFrameText2] = React.useState("Check-out");
  const [qrFrameLinkAuto, setQrFrameLinkAuto] = React.useState(true);
  const [qrFrameLinkText, setQrFrameLinkText] = React.useState("");
  const [qrPng, setQrPng] = React.useState("");
  const [qrSvg, setQrSvg] = React.useState("");
  const [qrError, setQrError] = React.useState<string | null>(null);
  const [qrCopyStatus, setQrCopyStatus] = React.useState("");
  const [qrStats, setQrStats] = React.useState<AdminQrStats | null>(null);
  const [isLoadingQrStats, setIsLoadingQrStats] = React.useState(false);
  const [qrStatsError, setQrStatsError] = React.useState<string | null>(null);
  const [qrSaveStatus, setQrSaveStatus] = React.useState("");
  const [qrDeleteStatus, setQrDeleteStatus] = React.useState("");
  const qrDestination = qrValue.trim();
  const qrId = React.useMemo(
    () => qrCodeId(qrLabel, qrDestination || `${PUBLIC_SITE_URL}/en`),
    [qrDestination, qrLabel]
  );
  const qrEncodedValue = React.useMemo(() => {
    if (!qrDestination || !qrTracked) return qrDestination;
    return qrTrackingUrl(qrId, qrLabel, qrDestination);
  }, [qrDestination, qrId, qrLabel, qrTracked]);
  const qrFrameDisplayLink = qrFrameLinkAuto
    ? displayQrLink(qrDestination)
    : qrFrameLinkText;
  const [creatingTestSubmission, setCreatingTestSubmission] = React.useState(false);
  const [testSubmissionMessage, setTestSubmissionMessage] =
    React.useState<string | null>(null);
  const [testSubmissionError, setTestSubmissionError] =
    React.useState<string | null>(null);
  const [testRunResults, setTestRunResults] = React.useState<TestRunResult[]>([]);
  const [manualSubmissionType, setManualSubmissionType] =
    React.useState<Exclude<TestSubmissionType, "all">>("booking");
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);
  const [activeGroupDetail, setActiveGroupDetail] =
    React.useState<GroupDetailSelection>("overview");
  const [activeCheckinDetail, setActiveCheckinDetail] =
    React.useState<CheckinDetailSelection>("checkin");
  const [isMobileLayout, setIsMobileLayout] = React.useState(false);
  const [mobileDetailDragOffset, setMobileDetailDragOffset] = React.useState(0);
  const [isDraggingMobileDetail, setIsDraggingMobileDetail] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<ImagePreview | null>(null);
  const [meterDraftByImage, setMeterDraftByImage] = React.useState<
    Record<string, MeterKey>
  >({});
  const [meterDraftKey, setMeterDraftKey] = React.useState<MeterDraftKey>("");
  const [meterDraftValue, setMeterDraftValue] = React.useState("");
  const [meterSaveState, setMeterSaveState] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [meterSaveError, setMeterSaveError] = React.useState<string | null>(null);
  const [approvingCheckinId, setApprovingCheckinId] = React.useState<string | null>(
    null
  );
  const [checkinApprovalError, setCheckinApprovalError] =
    React.useState<string | null>(null);
  const meterAutosaveTimer = React.useRef<number | null>(null);
  const lastMeterSaveSignature = React.useRef("");
  const activeImagePreviewKey = React.useRef("");
  const mobileDetailDrag = React.useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    offset: 0,
  });

  React.useLayoutEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = appearance;
    html.dataset.appearancePreference = appearance;
    html.style.colorScheme = appearance;
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  }, [appearance]);

  React.useEffect(() => {
    if (DASHBOARD_AUTH_DISABLED) {
      setAuthReady(true);
      setAdminEmail("local@fyrrehaven-61.dk");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthReady(true);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 980px)");
    const apply = () => setIsMobileLayout(mediaQuery.matches);

    apply();
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, []);

  const fetchSubmissions = React.useCallback(async () => {
    setError(null);
    setIsLoadingSubmissions(true);

    try {
      const auth = getFirebaseAuth();
      const token =
        DASHBOARD_AUTH_DISABLED || !auth?.currentUser
          ? null
          : await auth.currentUser.getIdToken(true);
      const res = await fetch("/api/admin/forms", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }
      const apiSubmissions = [...(data.submissions || [])].sort(
        (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
      );
      const nextSubmissions =
        LOCAL_DASHBOARD_FALLBACK && apiSubmissions.length === 0
          ? [...(localTestSubmissions as unknown as Submission[])]
          : apiSubmissions;

      setSubmissions(nextSubmissions);
      setAdminEmail(
        data.admin?.email ||
          auth?.currentUser?.email ||
          (DASHBOARD_AUTH_DISABLED ? "local@fyrrehaven-61.dk" : "")
      );
    } catch (nextError) {
      if (LOCAL_DASHBOARD_FALLBACK) {
        const fallbackSubmissions = [
          ...(localTestSubmissions as unknown as Submission[]),
        ];
        setSubmissions(fallbackSubmissions);
        setError(null);
      } else {
        setError(String(nextError instanceof Error ? nextError.message : nextError));
      }
    } finally {
      setHasLoadedSubmissions(true);
      setIsLoadingSubmissions(false);
    }
  }, []);

  const fetchAnalytics = React.useCallback(async () => {
    setAnalyticsError(null);
    setIsLoadingAnalytics(true);

    try {
      const auth = getFirebaseAuth();
      const token =
        DASHBOARD_AUTH_DISABLED || !auth?.currentUser
          ? null
          : await auth.currentUser.getIdToken(true);
      const res = await fetch(
        `/api/admin/analytics?range=${encodeURIComponent(statisticsDateFilter)}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        if (LOCAL_DASHBOARD_FALLBACK) {
          setAnalytics(emptyAnalyticsSummary());
          return;
        }
        throw new Error("Admin analytics API did not return JSON.");
      }
      const data = (await res.json()) as {
        ok?: boolean;
        analytics?: AdminAnalyticsSummary;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }
      setAnalytics(data.analytics || null);
    } catch (nextError) {
      setAnalytics(null);
      setAnalyticsError(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [statisticsDateFilter]);

  const fetchQrStats = React.useCallback(async () => {
    setQrStatsError(null);
    setIsLoadingQrStats(true);

    try {
      const auth = getFirebaseAuth();
      const token =
        DASHBOARD_AUTH_DISABLED || !auth?.currentUser
          ? null
          : await auth.currentUser.getIdToken(true);
      const res = await fetch(
        `/api/admin/qr-codes?range=${encodeURIComponent(qrStatsDateFilter)}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        if (LOCAL_DASHBOARD_FALLBACK) {
          setQrStats(null);
          return;
        }
        throw new Error("QR statistics API did not return JSON.");
      }
      const data = (await res.json()) as {
        ok?: boolean;
        stats?: AdminQrStats;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }
      setQrStats(data.stats || null);
    } catch (nextError) {
      setQrStats(null);
      setQrStatsError(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    } finally {
      setIsLoadingQrStats(false);
    }
  }, [qrStatsDateFilter]);

  React.useEffect(() => {
    setDeleteConfirmation("");
    setDeleteError(null);
    setActiveGroupDetail("overview");
  }, [selectedId]);

  React.useEffect(() => {
    if (!routeSelectedId) return;
    setSelectedId(routeSelectedId);
  }, [routeSelectedId]);

  React.useEffect(() => {
    if (isTestSubmissionsPage || isManualSubmissionPage) return;
    if (!user && !DASHBOARD_AUTH_DISABLED) return;
    void fetchSubmissions();
  }, [user, fetchSubmissions, isManualSubmissionPage, isTestSubmissionsPage]);

  React.useEffect(() => {
    if (!isStatisticsPage) return;
    if (!user && !DASHBOARD_AUTH_DISABLED) return;
    void fetchAnalytics();
  }, [user, fetchAnalytics, isStatisticsPage]);

  React.useEffect(() => {
    if (!isQrCodesPage) return;
    if (!user && !DASHBOARD_AUTH_DISABLED) return;
    void fetchQrStats();
  }, [user, fetchQrStats, isQrCodesPage]);

  React.useEffect(() => {
    let cancelled = false;
    const value = qrEncodedValue.trim();

    async function generateQrCode() {
      if (!value) {
        setQrPng("");
        setQrSvg("");
        setQrError("Enter a URL or text value to generate a QR code.");
        return;
      }

      try {
        const options = {
          errorCorrectionLevel: qrErrorCorrection,
          margin: qrMargin,
          width: qrSize,
          color: {
            dark: qrForeground,
            light: qrBackground,
          },
        } as const;
        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, value, options);
        const context = qrCanvas.getContext("2d");
        if (!context) throw new Error("The QR canvas could not be created.");

        const overlaySize = Math.round(
          qrCanvas.width * Math.min(0.32, Math.max(0.08, qrOverlayScale / 100))
        );
        const overlayX = Math.round((qrCanvas.width - overlaySize) / 2);
        const overlayY = Math.round((qrCanvas.height - overlaySize) / 2);
        const badgePadding = Math.max(10, Math.round(overlaySize * 0.16));
        const badgeX = overlayX - badgePadding;
        const badgeY = overlayY - badgePadding;
        const badgeSize = overlaySize + badgePadding * 2;
        const radius = Math.round(badgeSize * 0.22);

        if (qrOverlayMode !== "none") {
          context.fillStyle = qrOverlayBackground;
          context.beginPath();
          context.roundRect(badgeX, badgeY, badgeSize, badgeSize, radius);
          context.fill();
        }

        if (qrOverlayMode === "logo" || qrOverlayMode === "image") {
          const src =
            qrOverlayMode === "image" && qrOverlayImage
              ? qrOverlayImage
              : DEFAULT_QR_LOGO_SRC;
          const image = await loadImage(src);
          const ratio = Math.min(
            overlaySize / image.naturalWidth,
            overlaySize / image.naturalHeight
          );
          const drawWidth = Math.round(image.naturalWidth * ratio);
          const drawHeight = Math.round(image.naturalHeight * ratio);
          context.drawImage(
            image,
            Math.round((qrCanvas.width - drawWidth) / 2),
            Math.round((qrCanvas.height - drawHeight) / 2),
            drawWidth,
            drawHeight
          );
        } else if (qrOverlayMode === "text") {
          context.fillStyle = qrForeground;
          context.font = `900 ${Math.round(overlaySize * 0.42)}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(
            qrOverlayText.slice(0, 8) || "61",
            qrCanvas.width / 2,
            qrCanvas.height / 2
          );
        }

        let exportCanvas = qrCanvas;
        if (qrFrameEnabled) {
          const frameCanvas = document.createElement("canvas");
          const frameWidth = qrSize;
          const frameHeight = Math.round(qrSize * 1.36);
          frameCanvas.width = frameWidth;
          frameCanvas.height = frameHeight;
          const frame = frameCanvas.getContext("2d");
          if (!frame) throw new Error("The QR frame could not be created.");

          const cut = Math.round(frameWidth * 0.06);
          const border = Math.round(frameWidth * 0.035);
          const bottomHeight = Math.round(frameHeight * 0.18);
          const qrPadding = Math.round(frameWidth * 0.055);
          const qrAreaHeight = frameHeight - bottomHeight - border * 2;
          const qrDrawSize = Math.min(
            frameWidth - qrPadding * 2,
            qrAreaHeight - qrPadding
          );
          const qrX = Math.round((frameWidth - qrDrawSize) / 2);
          const qrY = border + Math.round((qrAreaHeight - qrDrawSize) / 2);

          frame.fillStyle = "#000000";
          frame.beginPath();
          frame.moveTo(cut, 0);
          frame.lineTo(frameWidth - cut, 0);
          frame.lineTo(frameWidth, cut);
          frame.lineTo(frameWidth, frameHeight - cut);
          frame.lineTo(frameWidth - cut, frameHeight);
          frame.lineTo(cut, frameHeight);
          frame.lineTo(0, frameHeight - cut);
          frame.lineTo(0, cut);
          frame.closePath();
          frame.fill();

          frame.fillStyle = qrBackground;
          frame.fillRect(border, border, frameWidth - border * 2, qrAreaHeight);
          frame.drawImage(qrCanvas, qrX, qrY, qrDrawSize, qrDrawSize);

          const bottomTop = frameHeight - bottomHeight;
          frame.fillStyle = "#000000";
          frame.fillRect(border, bottomTop, frameWidth - border * 2, bottomHeight - border);
          frame.textAlign = "center";
          frame.textBaseline = "middle";
          frame.font = `500 ${Math.round(frameWidth * 0.07)}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          const text1 = qrFrameText1.trim() || "Text 1";
          const text2 = qrFrameText2.trim() || "Text 2";
          const titleY = bottomTop + Math.round(bottomHeight * 0.42);
          const gap = Math.round(frameWidth * 0.018);
          const text1Width = frame.measureText(text1).width;
          const text2Width = frame.measureText(text2).width;
          const separatorWidth = frame.measureText("|").width;
          const titleWidth = text1Width + text2Width + separatorWidth + gap * 2;
          const titleStart = (frameWidth - titleWidth) / 2;
          frame.fillStyle = DEFAULT_QR_GOLD;
          frame.fillText("|", titleStart + text1Width + gap + separatorWidth / 2, titleY);
          frame.fillStyle = "#ffffff";
          frame.textAlign = "left";
          frame.fillText(text1, titleStart, titleY);
          frame.fillText(text2, titleStart + text1Width + separatorWidth + gap * 2, titleY);
          frame.textAlign = "center";
          frame.font = `700 ${Math.round(frameWidth * 0.035)}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          const link = qrFrameDisplayLink.trim() || qrDestination || qrEncodedValue;
          frame.fillText(link, frameWidth / 2, bottomTop + Math.round(bottomHeight * 0.72));
          exportCanvas = frameCanvas;
        }

        const png = exportCanvas.toDataURL("image/png");
        const baseSvg = await QRCode.toString(value, { ...options, type: "svg" });
        const overlaySvg =
          qrOverlayMode === "none"
            ? ""
            : qrOverlayMode === "text"
              ? `<rect x="${badgeX}" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" rx="${radius}" fill="${qrOverlayBackground}"/><text x="${qrSize / 2}" y="${qrSize / 2}" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${Math.round(
                  overlaySize * 0.42
                )}" font-weight="900" fill="${qrForeground}">${(qrOverlayText.slice(0, 8) || "61")
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")}</text>`
              : `<rect x="${badgeX}" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" rx="${radius}" fill="${qrOverlayBackground}"/><image href="${
                  qrOverlayMode === "image" && qrOverlayImage
                    ? qrOverlayImage
                    : `${PUBLIC_SITE_URL}${DEFAULT_QR_LOGO_SRC}`
                }" x="${overlayX}" y="${overlayY}" width="${overlaySize}" height="${overlaySize}" preserveAspectRatio="xMidYMid meet"/>`;
        const bareSvg = overlaySvg
          ? baseSvg.replace("</svg>", `${overlaySvg}</svg>`)
          : baseSvg;
        const escapeSvgText = (text: string) =>
          text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        const svg = qrFrameEnabled
          ? (() => {
              const frameWidth = qrSize;
              const frameHeight = Math.round(qrSize * 1.36);
              const cut = Math.round(frameWidth * 0.06);
              const border = Math.round(frameWidth * 0.035);
              const bottomHeight = Math.round(frameHeight * 0.18);
              const qrPadding = Math.round(frameWidth * 0.055);
              const qrAreaHeight = frameHeight - bottomHeight - border * 2;
              const qrDrawSize = Math.min(
                frameWidth - qrPadding * 2,
                qrAreaHeight - qrPadding
              );
              const qrX = Math.round((frameWidth - qrDrawSize) / 2);
              const qrY = border + Math.round((qrAreaHeight - qrDrawSize) / 2);
              const bottomTop = frameHeight - bottomHeight;
              const encodedQr = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                bareSvg
              )}`;
              const text1 = qrFrameText1.trim() || "Text 1";
              const text2 = qrFrameText2.trim() || "Text 2";
              const titleY = bottomTop + Math.round(bottomHeight * 0.42);
              const gap = Math.round(frameWidth * 0.018);
              const link = qrFrameDisplayLink.trim() || qrDestination || qrEncodedValue;
              return `<svg xmlns="http://www.w3.org/2000/svg" width="${frameWidth}" height="${frameHeight}" viewBox="0 0 ${frameWidth} ${frameHeight}">
<path d="M ${cut} 0 H ${frameWidth - cut} L ${frameWidth} ${cut} V ${frameHeight - cut} L ${frameWidth - cut} ${frameHeight} H ${cut} L 0 ${frameHeight - cut} V ${cut} Z" fill="#000"/>
<rect x="${border}" y="${border}" width="${frameWidth - border * 2}" height="${qrAreaHeight}" fill="${qrBackground}"/>
<image href="${encodedQr}" x="${qrX}" y="${qrY}" width="${qrDrawSize}" height="${qrDrawSize}" preserveAspectRatio="xMidYMid meet"/>
<rect x="${border}" y="${bottomTop}" width="${frameWidth - border * 2}" height="${bottomHeight - border}" fill="#000"/>
<text x="${frameWidth / 2}" y="${titleY}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${Math.round(frameWidth * 0.07)}" font-weight="500" fill="#fff"><tspan>${escapeSvgText(text1)}</tspan><tspan dx="${gap}" fill="${DEFAULT_QR_GOLD}">|</tspan><tspan dx="${gap}" fill="#fff">${escapeSvgText(text2)}</tspan></text>
<text x="${frameWidth / 2}" y="${bottomTop + Math.round(bottomHeight * 0.72)}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${Math.round(frameWidth * 0.035)}" font-weight="700" fill="${DEFAULT_QR_GOLD}">${escapeSvgText(link)}</text>
</svg>`;
            })()
          : bareSvg;
        if (cancelled) return;
        setQrPng(png);
        setQrSvg(svg);
        setQrError(null);
      } catch (nextError) {
        if (cancelled) return;
        setQrPng("");
        setQrSvg("");
        setQrError(
          String(nextError instanceof Error ? nextError.message : nextError)
        );
      }
    }

    void generateQrCode();
    return () => {
      cancelled = true;
    };
  }, [
    qrBackground,
    qrDestination,
    qrEncodedValue,
    qrErrorCorrection,
    qrForeground,
    qrFrameEnabled,
    qrFrameDisplayLink,
    qrFrameText1,
    qrFrameText2,
    qrMargin,
    qrOverlayBackground,
    qrOverlayImage,
    qrOverlayMode,
    qrOverlayScale,
    qrOverlayText,
    qrSize,
  ]);

  React.useEffect(() => {
    if (!qrCopyStatus) return;
    const timer = window.setTimeout(() => setQrCopyStatus(""), 1800);
    return () => window.clearTimeout(timer);
  }, [qrCopyStatus]);

  React.useEffect(() => {
    if (!imagePreview) {
      activeImagePreviewKey.current = "";
      return;
    }
    const previewKey = imagePreviewKey(imagePreview);
    const activePreviewKey = `${imagePreview.submission.id}:${previewKey || imagePreview.index}`;
    const isNewPreview = activeImagePreviewKey.current !== activePreviewKey;
    activeImagePreviewKey.current = activePreviewKey;
    const nextMeter =
      (previewKey && meterDraftByImage[previewKey]) ||
      meterKeyFromAttachment(imagePreview.attachment);
    const nextValue = nextMeter
      ? imagePreview.submission.checkin?.meterReadings?.[nextMeter] || ""
      : "";
    setMeterDraftKey(nextMeter);
    setMeterDraftValue(nextValue);
    lastMeterSaveSignature.current =
      imagePreview && nextMeter
        ? `${imagePreview.submission.id}:${previewKey || imagePreview.index}:${nextMeter}:${nextValue.trim()}`
        : "";
    if (isNewPreview) {
      setMeterSaveState("idle");
      setMeterSaveError(null);
    }
  }, [imagePreview]);

  const dateFilteredSubmissions = React.useMemo(() => {
    const range = dateFilterRange(dateFilter);
    return submissions.filter((submission) => {
      if (range) {
        const createdAt = submission.createdAtMs || 0;
        if (createdAt < range.from || createdAt >= range.to) return false;
      }
      return true;
    });
  }, [dateFilter, submissions]);

  const visibleGroups = React.useMemo(() => {
    const groups = buildSubmissionGroups(dateFilteredSubmissions);
    if (submissionFilter === "all") return groups;
    return groups.filter((group) =>
      group.items.some((submission) =>
        submissionMatchesTypeFilter(submission, submissionFilter)
      )
    );
  }, [dateFilteredSubmissions, submissionFilter]);

  const filteredSubmissions = React.useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups]
  );

  const filteredDashboardStats = React.useMemo<DashboardStats>(() => {
    return {
      total: filteredSubmissions.length,
      sent: filteredSubmissions.filter(
        (submission) => submission.status === "sent"
      ).length,
      failed: filteredSubmissions.filter(
        (submission) => submission.status === "mail_failed"
      ).length,
      latestAtMs: filteredSubmissions[0]?.createdAtMs,
    };
  }, [filteredSubmissions]);

  const statisticsSubmissions = React.useMemo(() => {
    const range = dateFilterRange(statisticsDateFilter);
    if (!range) return submissions;
    return submissions.filter((submission) => {
      const createdAt = submission.createdAtMs || 0;
      return createdAt >= range.from && createdAt < range.to;
    });
  }, [statisticsDateFilter, submissions]);

  const adminStatistics = React.useMemo(
    () => buildAdminStatistics(statisticsSubmissions),
    [statisticsSubmissions]
  );

  React.useEffect(() => {
    setRenderedGroupCount(SUBMISSION_BATCH_SIZE);
  }, [dateFilter, submissionFilter]);

  const renderedGroups = React.useMemo(
    () => visibleGroups.slice(0, renderedGroupCount),
    [renderedGroupCount, visibleGroups]
  );
  const hasMoreVisibleGroups = renderedGroupCount < visibleGroups.length;

  const selectedGroup =
    visibleGroups.find(
      (group) =>
        group.id === selectedId ||
        group.items.some((submission) => submission.id === selectedId)
    ) || null;
  const selectedSubmission = selectedGroup?.primary || null;
  const checkinSubmissions = React.useMemo(
    () => selectedGroup?.items.filter(isCheckinSubmission) || [],
    [selectedGroup]
  );
  const contactSubmissions = React.useMemo(
    () => selectedGroup?.items.filter(isContactSubmission) || [],
    [selectedGroup]
  );
  const detailSubmission =
    activeGroupDetail === "overview"
      ? selectedSubmission
      : activeGroupDetail === CONTACT_GROUP_DETAIL
      ? contactSubmissions[0] || selectedSubmission
      : activeGroupDetail === CHECKIN_GROUP_DETAIL
      ? checkinSubmissions.find(
          (submission) => submission.checkin?.type === activeCheckinDetail
        ) ||
        checkinSubmissions[0] ||
        selectedSubmission
      : selectedGroup?.items.find((submission) => submission.id === activeGroupDetail) ||
        selectedSubmission;

  function detailSelectionForSlug(
    group: SubmissionGroup,
    slug: string
  ): {
    groupDetail: GroupDetailSelection;
    checkinDetail: CheckinDetailSelection | null;
  } {
    if (slug === "overview") {
      return { groupDetail: "overview", checkinDetail: null };
    }

    if (slug === "contact" && group.items.some(isContactSubmission)) {
      return { groupDetail: CONTACT_GROUP_DETAIL, checkinDetail: null };
    }

    if (slug === "checkin" || slug === "checkout") {
      const checkinDetail = slug as CheckinDetailSelection;
      if (
        group.items.some(
          (submission) => submission.checkin?.type === checkinDetail
        )
      ) {
        return {
          groupDetail: CHECKIN_GROUP_DETAIL,
          checkinDetail,
        };
      }
    }

    const matchingSubmission = group.items.find(
      (submission) =>
        submission.id === slug || detailSlugForSubmission(submission) === slug
    );

    if (matchingSubmission) {
      if (isCheckinSubmission(matchingSubmission)) {
        return {
          groupDetail: CHECKIN_GROUP_DETAIL,
          checkinDetail: checkinDetailFromValue(matchingSubmission.checkin?.type),
        };
      }

      if (isContactSubmission(matchingSubmission)) {
        return { groupDetail: CONTACT_GROUP_DETAIL, checkinDetail: null };
      }

      return { groupDetail: matchingSubmission.id, checkinDetail: null };
    }

    return { groupDetail: "overview", checkinDetail: null };
  }

  React.useEffect(() => {
    if (!routeSelectedId || !selectedGroup) return;

    const requestedDetail = routeAdminDetail ? activeRouteDetail : "overview";
    const nextSelection = detailSelectionForSlug(selectedGroup, requestedDetail);

    setActiveGroupDetail((current) =>
      current === nextSelection.groupDetail ? current : nextSelection.groupDetail
    );
    if (nextSelection.checkinDetail) {
      const nextCheckinDetail = nextSelection.checkinDetail;
      setActiveCheckinDetail((current) =>
        current === nextCheckinDetail
          ? current
          : nextCheckinDetail
      );
    }
  }, [
    activeRouteDetail,
    routeAdminDetail,
    routeSelectedId,
    selectedGroup,
  ]);

  React.useEffect(() => {
    if (!selectedGroup) return;
    if (activeGroupDetail === "overview") return;
    if (
      activeGroupDetail === CHECKIN_GROUP_DETAIL &&
      selectedGroup.items.some(isCheckinSubmission)
    ) {
      return;
    }
    if (
      activeGroupDetail === CONTACT_GROUP_DETAIL &&
      selectedGroup.items.some(isContactSubmission)
    ) {
      return;
    }
    if (
      selectedGroup.items.some(
        (submission) =>
          submission.id === activeGroupDetail && !isContactSubmission(submission)
      )
    ) {
      return;
    }
    openGroupDetail(selectedGroup, "overview", { replace: true });
  }, [activeGroupDetail, selectedGroup]);

  React.useEffect(() => {
    if (!selectedGroup) return;
    if (activeGroupDetail !== CHECKIN_GROUP_DETAIL) return;
    if (
      checkinSubmissions.some(
        (submission) => submission.checkin?.type === activeCheckinDetail
      )
    ) {
      return;
    }
    const nextType = checkinSubmissions.find(
      (submission) => submission.checkin?.type === "checkin"
    )
      ? "checkin"
      : "checkout";
    openCheckinDetail(nextType);
  }, [activeCheckinDetail, activeGroupDetail, checkinSubmissions, selectedGroup]);

  React.useEffect(() => {
    if (visibleGroups.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((current) => {
      if (routeSelectedId) return routeSelectedId;
      if (isMobileLayout) return null;

      if (current && visibleGroups.some((group) => group.id === current)) {
        return current;
      }

      return visibleGroups[0].id;
    });
  }, [isMobileLayout, routeSelectedId, visibleGroups]);

  React.useEffect(() => {
    if (
      !isMobileLayout ||
      !selectedGroup ||
      deleteTarget
    )
      return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [deleteTarget, isMobileLayout, selectedGroup]);

  React.useEffect(() => {
    if (!isDraggingMobileDetail) return;

    const onPointerMove = (event: PointerEvent) => {
      const drag = mobileDetailDrag.current;
      if (!drag.active) return;

      const now = performance.now();
      const elapsed = Math.max(1, now - drag.lastTime);
      const deltaFromLast = event.clientY - drag.lastY;
      drag.velocity = deltaFromLast / elapsed;
      drag.lastY = event.clientY;
      drag.lastTime = now;

      const nextOffset = Math.max(0, event.clientY - drag.startY);
      drag.offset = nextOffset;
      setMobileDetailDragOffset(nextOffset);
    };

    const endDrag = () => {
      const drag = mobileDetailDrag.current;
      if (!drag.active) return;

      const shouldClose =
        drag.offset >= 120 || (drag.velocity >= 0.85 && drag.offset > 56);

      drag.active = false;
      drag.pointerId = -1;
      drag.offset = 0;
      drag.velocity = 0;
      setIsDraggingMobileDetail(false);
      setMobileDetailDragOffset(0);

      if (shouldClose) {
        closeMobileDetail();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [isDraggingMobileDetail]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (imagePreview) {
        setImagePreview(null);
        return;
      }

      if (deleteTarget && !deleting) {
        setDeleteTarget(null);
        setDeleteConfirmation("");
        setDeleteError(null);
        return;
      }

      if (activeGroupDetail !== "overview") {
        if (selectedGroup) {
          openGroupDetail(selectedGroup, "overview");
        } else {
          setActiveGroupDetail("overview");
        }
        return;
      }

      if (isMobileLayout && selectedGroup) {
        closeMobileDetail();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeGroupDetail,
    deleteTarget,
    deleting,
    imagePreview,
    isMobileLayout,
    selectedGroup,
  ]);

  const sentCount = filteredDashboardStats.sent;
  const failedCount = filteredDashboardStats.failed;

  function showNextSubmissionBatch() {
    setRenderedGroupCount((current) =>
      Math.min(current + SUBMISSION_BATCH_SIZE, visibleGroups.length)
    );
  }

  function handleSubmissionListScroll(event: React.UIEvent<HTMLDivElement>) {
    if (!hasMoreVisibleGroups) return;
    const element = event.currentTarget;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceFromBottom > 360) return;
    showNextSubmissionBatch();
  }

  function openSubmissionDetail(
    submissionId: string,
    detailSlug?: string | null,
    options?: { replace?: boolean }
  ) {
    if (!detailSlug || detailSlug === "overview") {
      setActiveGroupDetail("overview");
      setActiveCheckinDetail("checkin");
    }
    setSelectedId(submissionId);
    navigate(adminSubmissionPath(submissionId, detailSlug), {
      replace: options?.replace,
    });
  }

  function openGroupDetail(
    group: SubmissionGroup,
    detail: GroupDetailSelection,
    options?: { replace?: boolean }
  ) {
    if (detail === "overview") {
      setActiveGroupDetail("overview");
      openSubmissionDetail(group.id, "overview", options);
      return;
    }

    if (detail === CONTACT_GROUP_DETAIL) {
      setActiveGroupDetail(CONTACT_GROUP_DETAIL);
      openSubmissionDetail(group.id, "contact", options);
      return;
    }

    if (detail === CHECKIN_GROUP_DETAIL) {
      const checkinSubmission =
        group.items.find(
          (submission) => submission.checkin?.type === activeCheckinDetail
        ) || group.items.find(isCheckinSubmission);
      const checkinDetail = checkinSubmission?.checkin?.type || activeCheckinDetail;
      setActiveGroupDetail(CHECKIN_GROUP_DETAIL);
      if (checkinDetail === "checkin" || checkinDetail === "checkout") {
        setActiveCheckinDetail(checkinDetail);
      }
      openSubmissionDetail(
        group.id,
        checkinDetail || "checkin",
        options
      );
      return;
    }

    const submission = group.items.find((item) => item.id === detail);
    setActiveGroupDetail(detail);
    openSubmissionDetail(
      group.id,
      submission ? detailSlugForSubmission(submission) : detail,
      options
    );
  }

  function openCheckinDetail(type: CheckinDetailSelection) {
    if (!selectedGroup) {
      setActiveCheckinDetail(type);
      return;
    }

    setActiveGroupDetail(CHECKIN_GROUP_DETAIL);
    setActiveCheckinDetail(type);
    openSubmissionDetail(selectedGroup.id, type);
  }

  async function adminAuthHeaders() {
    const auth = getFirebaseAuth();
    const token =
      DASHBOARD_AUTH_DISABLED || !auth?.currentUser
        ? null
        : await auth.currentUser.getIdToken(true);
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  function baseTestContactPayload() {
    return {
      lang: "en",
      website: "",
      company: "",
      faxNumber: "",
      formStartedAt: Date.now() - 5000,
      name: "Rafy Marbin Test Guest",
      email: "rafy@marbin.dk",
      phone: "+45 22 33 44 55",
      country: "Denmark",
      countryIso: "DK",
      consent: true,
      feesAccepted: true,
    };
  }

  function testContactPayload(type: Exclude<TestSubmissionType, "all" | "checkin" | "checkout">) {
    const selection = {
      start: "2026-08-12",
      endExclusive: "2026-08-19",
      nights: 7,
      baseNightsTotalDKK: 23054,
      cleaningFeeDKK: 1250,
      totalWithCleaningDKK: 24304,
      airbnbServiceFeeSavingsDKK: 2554,
      totalAfterAirbnbDiscountDKK: 21750,
      breakdown: [
        { date: "2026-08-12", price: 3293 },
        { date: "2026-08-13", price: 3293 },
        { date: "2026-08-14", price: 3443 },
        { date: "2026-08-15", price: 3443 },
        { date: "2026-08-16", price: 3293 },
        { date: "2026-08-17", price: 3143 },
        { date: "2026-08-18", price: 3146 },
      ],
    };
    const extras = {
      stayDate: "2026-08-12",
      totalDKK: 1495,
      items: [
        {
          id: "linen-pack",
          qty: 5,
          unitPriceDKK: 199,
          label: { da: "Linnedpakke", en: "Linen package" },
        },
        {
          id: "crib",
          qty: 1,
          unitPriceDKK: 500,
          label: { da: "Babyseng", en: "Baby crib" },
        },
      ],
    };

    if (type === "booking") {
      return {
        ...baseTestContactPayload(),
        purpose: "booking",
        context: "booking",
        stayPurpose:
          "Admin mail test booking with every required booking field filled.",
        guests: { adults: 3, children: 2, babies: 1, total: 6 },
        selection,
        message:
          "Admin mail test: booking form payload with guest details, dates, prices, and approvals.",
      };
    }

    if (type === "extra-services") {
      return {
        ...baseTestContactPayload(),
        purpose: "extra-services",
        context: "extra-services",
        message:
          "Admin mail test: extra services form with selected linen package and baby crib.",
        extras,
      };
    }

    return {
      ...baseTestContactPayload(),
      purpose: "inquiry",
      context: "contact",
      message:
        "Admin mail test: contact form message with phone, country, consent, and guest email filled.",
    };
  }

  async function testImageFile(path: string, filename: string) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Could not load ${filename}`);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  }

  async function testCheckinPayload(type: "checkin" | "checkout") {
    const formData = new FormData();
    formData.set("website", "");
    formData.set("company", "");
    formData.set("faxNumber", "");
    formData.set("formStartedAt", String(Date.now() - 5000));
    formData.set("lang", "en");
    formData.set("name", "Rafy Marbin Test Guest");
    formData.set("email", "rafy@marbin.dk");
    formData.set("keycode", "6142");
    formData.set("checkType", type);
    formData.set("elReading", type === "checkin" ? "055540" : "058120");
    formData.set("waterHouse", type === "checkin" ? "0002142" : "0002199");
    formData.set("waterPool", type === "checkin" ? "00516263" : "00516430");
    formData.set(
      "comment",
      type === "checkin"
        ? "Admin mail test: check-in form with all meter values and images."
        : "Admin mail test: check-out form with all meter values and images."
    );
    formData.set("consent", "true");
    formData.append(
      "electricity",
      await testImageFile("/admin-test/electricity-meter.jpeg", "electricity-meter.jpeg")
    );
    formData.append(
      "waterHouse",
      await testImageFile("/admin-test/water-house-meter.jpeg", "water-house-meter.jpeg")
    );
    formData.append(
      "waterPool",
      await testImageFile("/admin-test/water-pool-meter.jpeg", "water-pool-meter.jpeg")
    );
    return formData;
  }

  async function deleteTemporarySubmission(submissionId?: string | null) {
    if (!submissionId) return false;
    const res = await fetch(`/api/admin/forms?id=${encodeURIComponent(submissionId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(await adminAuthHeaders()),
      },
      body: JSON.stringify({
        id: submissionId,
        confirmation: "delete",
      }),
    });
    const data = (await res.json()) as ApiResponse;
    if (!res.ok || !data.ok) {
      throw new Error(data.detail || data.error || `Cleanup failed: HTTP ${res.status}`);
    }
    return Boolean(data.deleted);
  }

  async function runSingleMailTest(type: Exclude<TestSubmissionType, "all">) {
    const label =
      type === "extra-services"
        ? "Extra services"
        : type === "checkin"
          ? "Check-in"
          : type === "checkout"
            ? "Check-out"
            : type === "booking"
              ? "Booking"
              : "Contact";
    let submissionId: string | null | undefined = null;
    let mailStatus: TestRunResult["status"] = "error";
    let detail = "";

    try {
      const res =
        type === "checkin" || type === "checkout"
          ? await fetch("/api/checkin", {
              method: "POST",
              body: await testCheckinPayload(type),
            })
          : await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(testContactPayload(type)),
            });
      const data = (await res.json()) as ApiResponse;
      submissionId = data.submissionId;

      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }

      mailStatus = data.mailStatus === "sent" ? "sent" : "failed";
      detail =
        data.mailStatus === "sent"
          ? "Mail sent successfully."
          : "Mail failed. Temporary submission was still cleaned up.";
    } catch (error) {
      detail = String(error instanceof Error ? error.message : error);
      mailStatus = "error";
    }

    let deleted = false;
    try {
      deleted = await deleteTemporarySubmission(submissionId);
    } catch (cleanupError) {
      detail = `${detail} Cleanup error: ${String(
        cleanupError instanceof Error ? cleanupError.message : cleanupError
      )}`;
    }

    return {
      type,
      label,
      status: mailStatus,
      submissionId,
      deleted,
      detail,
    };
  }

  async function createTestSubmission(type: TestSubmissionType = testSubmissionType) {
    if (creatingTestSubmission) return;
    setCreatingTestSubmission(true);
    setTestSubmissionError(null);
    setTestSubmissionMessage(null);
    setTestRunResults([]);

    try {
      const tests: Array<Exclude<TestSubmissionType, "all">> =
        type === "all"
          ? ["booking", "contact", "extra-services", "checkin", "checkout"]
          : [type];
      const results: TestRunResult[] = [];

      for (const testType of tests) {
        const result = await runSingleMailTest(testType);
        results.push(result);
        setTestRunResults([...results]);
      }

      const failures = results.filter((result) => result.status !== "sent");
      const cleanupFailures = results.filter(
        (result) => result.submissionId && !result.deleted
      );

      if (failures.length || cleanupFailures.length) {
        setTestSubmissionError(
          [
            failures.length
              ? `${failures.length} mail test${failures.length === 1 ? "" : "s"} failed.`
              : "",
            cleanupFailures.length
              ? `${cleanupFailures.length} temporary submission${
                  cleanupFailures.length === 1 ? "" : "s"
                } could not be deleted.`
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        );
      } else {
        setTestSubmissionMessage(
          `${results.length} mail test${
            results.length === 1 ? "" : "s"
          } sent successfully and cleaned up.`
        );
      }
    } catch (nextError) {
      setTestSubmissionError(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    } finally {
      setCreatingTestSubmission(false);
    }
  }

  function closeMobileDetail() {
    mobileDetailDrag.current.active = false;
    mobileDetailDrag.current.pointerId = -1;
    mobileDetailDrag.current.offset = 0;
    mobileDetailDrag.current.velocity = 0;
    setIsDraggingMobileDetail(false);
    setMobileDetailDragOffset(0);
    setSelectedId(null);
    navigate("/admin/forms");
  }

  function startMobileDetailDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = mobileDetailDrag.current;
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.startY = event.clientY;
    drag.lastY = event.clientY;
    drag.lastTime = performance.now();
    drag.velocity = 0;
    drag.offset = 0;
    setIsDraggingMobileDetail(true);
    setMobileDetailDragOffset(0);
  }

  function openDeleteDialog(group: SubmissionGroup) {
    setDeleteError(null);
    setDeleteConfirmation("");
    setDeleteTarget({
      groupId: group.id,
      bookingNumber: group.bookingNumber,
      primary: group.primary,
      items: group.items,
      labels: group.labels,
    });
  }

  function closeDeleteDialog() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteConfirmation("");
    setDeleteError(null);
  }

  async function handleSignIn() {
    const auth = getFirebaseAuth();
    if (!auth) return;

    setError(null);
    const provider: GoogleAuthProvider = createAdminAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (popupError) {
      console.error("Firebase admin sign-in failed", popupError);
      const code = String((popupError as { code?: string })?.code || "");
      if (code.includes("popup")) {
        await signInWithRedirect(auth, provider);
        return;
      }
      const authMessage =
        code === "auth/unauthorized-domain"
          ? `This domain is not allowed in Firebase Auth. Add ${window.location.hostname} in Firebase console > Authentication > Settings > Authorized domains.`
          : code === "auth/internal-error"
          ? "Firebase login could not start. Check Google sign-in, authorized domains, and CSP for Firebase Auth."
          : popupError instanceof Error
          ? popupError.message
          : "Sign-in failed. Please try again.";
      setError(
        `Firebase: ${authMessage}${code ? ` (${code})` : ""}`
      );
    }
  }

  async function handleSignOut() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setSubmissions([]);
    setSelectedId(null);
    setAdminEmail("");
    navigate("/admin/forms");
  }

  function toggleAppearance() {
    setAppearance((current) => (current === "dark" ? "light" : "dark"));
  }

  function renderAccountTools() {
    return (
      <>
        <div className={styles.accountPill}>
          <FiUser aria-hidden="true" className={styles.accountIcon} />
          <div className={styles.accountText}>
            <span>Logged in</span>
            <strong>
              {adminEmail || user?.email || "local@fyrrehaven-61.dk"}
            </strong>
          </div>
          {!DASHBOARD_AUTH_DISABLED ? (
            <button
              type="button"
              className={styles.accountLogout}
              onClick={() => void handleSignOut()}
            >
              <FiLogOut aria-hidden="true" />
              <span>Log out</span>
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.themeButton}
          onClick={toggleAppearance}
          aria-label={
            appearance === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={
            appearance === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {appearance === "dark" ? (
            <FiSun aria-hidden="true" />
          ) : (
            <FiMoon aria-hidden="true" />
          )}
        </button>
      </>
    );
  }

  function renderAdminNav(active: AdminPageKey) {
    const items: Array<{
      key: AdminPageKey;
      label: string;
      to: string;
      icon: React.ReactNode;
    }> = [
      {
        key: "statistics",
        label: "Statistics",
        to: "/admin/statistics",
        icon: <FiBarChart2 aria-hidden="true" />,
      },
      {
        key: "submissions",
        label: "Submissions",
        to: "/admin/forms",
        icon: <FiInbox aria-hidden="true" />,
      },
      {
        key: "manual",
        label: "Manual submission",
        to: "/admin/manual-submission",
        icon: <FiEdit3 aria-hidden="true" />,
      },
      {
        key: "qr",
        label: "QR codes",
        to: "/admin/qr-codes",
        icon: <FiGrid aria-hidden="true" />,
      },
      {
        key: "test",
        label: "Test submissions",
        to: "/admin/test-submissions",
        icon: <FiCheckCircle aria-hidden="true" />,
      },
    ];

    return (
      <nav className={styles.adminNav} aria-label="Admin sections">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={styles.adminNavButton}
            data-active={active === item.key ? "true" : undefined}
            onClick={() => navigate(item.to)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  function renderAdminHeader(
    title: string,
    active: AdminPageKey,
    subtitle?: string
  ) {
    return (
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>Fyrrehaven 61 admin</p>
            <h1>{title}</h1>
            {subtitle ? <p className={styles.heroSubtitle}>{subtitle}</p> : null}
          </div>
          <div className={styles.heroActions}>{renderAccountTools()}</div>
        </div>
        {renderAdminNav(active)}
      </div>
    );
  }

  async function copyText(value: string) {
    const text = value.trim();
    if (!text || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
  }

  function qrFileName(extension: "png" | "svg") {
    const base = (qrLabel || "fyrrehaven-61-qr")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return `${base || "fyrrehaven-61-qr"}.${extension}`;
  }

  function downloadQrPng() {
    if (!qrPng) return;
    const link = document.createElement("a");
    link.href = qrPng;
    link.download = qrFileName("png");
    link.click();
  }

  function downloadQrSvg() {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = qrFileName("svg");
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyQrValue() {
    await copyText(qrEncodedValue);
    setQrCopyStatus("Copied");
  }

  function applyQrGuestPreset(key: string) {
    const preset = QR_GUEST_LINK_PRESETS.find((item) => item.key === key);
    if (!preset) return;
    setQrValue(preset.destination);
    setQrLabel(preset.label);
    setQrFrameText1(preset.text1);
    setQrFrameText2(preset.text2);
    setQrFrameLinkText("linkText" in preset ? preset.linkText || "" : "");
    setQrFrameLinkAuto(!("linkText" in preset && preset.linkText));
    setQrTracked("tracked" in preset ? preset.tracked !== false : true);
  }

  function handleQrOverlayUpload(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setQrError("Choose an image file for the center artwork.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrOverlayImage(String(reader.result || ""));
      setQrOverlayMode("image");
    };
    reader.onerror = () => setQrError("The center image could not be read.");
    reader.readAsDataURL(file);
  }

  function currentQrConfig(): SavedQrCode {
    return {
      id: qrId,
      label: qrLabel.trim() || "Untitled QR code",
      destination: qrDestination,
      tracked: qrTracked,
      foreground: qrForeground,
      background: qrBackground,
      size: qrSize,
      margin: qrMargin,
      errorCorrection: qrErrorCorrection,
      overlayMode: qrOverlayMode,
      overlayText: qrOverlayText,
      overlayScale: qrOverlayScale,
      overlayBackground: qrOverlayBackground,
      frameEnabled: qrFrameEnabled,
      frameText1: qrFrameText1,
      frameText2: qrFrameText2,
      frameLinkText: qrFrameDisplayLink,
      frameLinkAuto: qrFrameLinkAuto,
    };
  }

  async function saveQrCode() {
    if (!qrDestination) return;
    setQrSaveStatus("Saving...");
    try {
      const auth = getFirebaseAuth();
      const token =
        DASHBOARD_AUTH_DISABLED || !auth?.currentUser
          ? null
          : await auth.currentUser.getIdToken(true);
      const res = await fetch("/api/admin/qr-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ qrCode: currentQrConfig() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; detail?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }
      setQrSaveStatus("Saved");
      void fetchQrStats();
    } catch (nextError) {
      setQrSaveStatus(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    }
  }

  async function deleteSavedQrCode(id: string) {
    setQrDeleteStatus("Deleting...");
    try {
      const auth = getFirebaseAuth();
      const token =
        DASHBOARD_AUTH_DISABLED || !auth?.currentUser
          ? null
          : await auth.currentUser.getIdToken(true);
      const res = await fetch(`/api/admin/qr-codes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; detail?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }
      setQrDeleteStatus("Deleted");
      void fetchQrStats();
    } catch (nextError) {
      setQrDeleteStatus(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    }
  }

  function loadSavedQrCode(saved: SavedQrCode) {
    setQrValue(saved.destination);
    setQrLabel(saved.label);
    setQrTracked(saved.tracked);
    setQrForeground(saved.foreground || DEFAULT_QR_GOLD);
    setQrBackground(saved.background || "#ffffff");
    setQrSize(saved.size || 720);
    setQrMargin(saved.margin ?? 3);
    setQrErrorCorrection(saved.errorCorrection || "H");
    setQrOverlayMode(saved.overlayMode || "logo");
    setQrOverlayText(saved.overlayText || "61");
    setQrOverlayScale(saved.overlayScale || 22);
    setQrOverlayBackground(saved.overlayBackground || "#000000");
    setQrFrameEnabled(saved.frameEnabled ?? true);
    setQrFrameText1(saved.frameText1 || "Text 1");
    setQrFrameText2(saved.frameText2 || "Text 2");
    setQrFrameLinkAuto(saved.frameLinkAuto ?? true);
    setQrFrameLinkText(saved.frameLinkText || saved.destination);
  }

  function renderLoggedMeta(submission?: Submission | null) {
    return <p className={styles.detailMeta}>{loggedLabel(submission)}</p>;
  }

  function renderDetailItem(
    label: string,
    value: React.ReactNode,
    submission: Submission,
    options?: {
      wide?: boolean;
      message?: boolean;
      after?: React.ReactNode;
      valueAction?: React.ReactNode;
      disableAutoAction?: boolean;
    }
  ) {
    if (!hasDisplayValue(value) && !options?.after) return null;
    const textValue = typeof value === "string" ? value.trim().replace(/[\r\n]/g, "") : "";
    const emailHref =
      !options?.disableAutoAction && label.toLowerCase() === "email" && textValue
        ? `mailto:${textValue}`
        : null;
    const phoneDigits = textValue.replace(/[^\d+]/g, "");
    const normalizedPhone = phoneDigits.startsWith("+")
      ? phoneDigits
      : phoneDigits
        ? `+${phoneDigits}`
        : "";
    const phoneAction =
      !options?.disableAutoAction && label.toLowerCase() === "phone" && normalizedPhone
        ? {
            href: normalizedPhone.startsWith("+45")
              ? `tel:${normalizedPhone}`
              : `https://wa.me/${normalizedPhone.replace("+", "")}`,
            label: normalizedPhone.startsWith("+45")
              ? `Call ${textValue}`
              : `Message ${textValue} on WhatsApp`,
            icon: normalizedPhone.startsWith("+45") ? (
              <FiPhone aria-hidden="true" />
            ) : (
              <FaWhatsapp aria-hidden="true" />
            ),
          }
        : null;
    const canCopyContact =
      Boolean(textValue) &&
      !options?.disableAutoAction &&
      (label.toLowerCase() === "email" || label.toLowerCase() === "phone");

    return (
      <div className={`${styles.detailItem} ${options?.wide ? styles.detailItemWide : ""}`}>
        <span className={styles.detailLabel}>{label}</span>
        {options?.message ? (
          <p className={styles.detailMessage}>{value}</p>
        ) : (
          <div className={styles.detailValueRow}>
            <div className={styles.detailValue}>{value}</div>
            {options?.valueAction}
            {emailHref ? (
              <a
                className={styles.detailMailButton}
                href={emailHref}
                aria-label={`Email ${value}`}
                title={`Email ${value}`}
              >
                <FiMail aria-hidden="true" />
              </a>
            ) : null}
            {phoneAction ? (
              <a
                className={styles.detailMailButton}
                href={phoneAction.href}
                aria-label={phoneAction.label}
                title={phoneAction.label}
                target={phoneAction.href.startsWith("https://") ? "_blank" : undefined}
                rel={phoneAction.href.startsWith("https://") ? "noreferrer" : undefined}
              >
                {phoneAction.icon}
              </a>
            ) : null}
            {canCopyContact ? (
              <button
                type="button"
                className={`${styles.detailMailButton} ${styles.contactCopyButton}`}
                aria-label={`Copy ${label.toLowerCase()}`}
                title={`Copy ${label.toLowerCase()}`}
                onClick={() => copyText(textValue)}
              >
                <FiCopy aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}
        {options?.after}
        {renderLoggedMeta(submission)}
      </div>
    );
  }

  function renderContactValueList(
    label: "Email" | "Phone",
    values: string[],
    submission: Submission
  ) {
    if (!values.length) return null;
    const isEmail = label === "Email";

    return (
      <div className={styles.detailItem}>
        <span className={styles.detailLabel}>{label}</span>
        <div className={styles.contactValueList}>
          {values.map((value) => {
            const trimmed = value.trim();
            const phoneDigits = trimmed.replace(/[^\d+]/g, "");
            const normalizedPhone = phoneDigits.startsWith("+")
              ? phoneDigits
              : phoneDigits
                ? `+${phoneDigits}`
                : "";
            const href = isEmail
              ? `mailto:${trimmed}`
              : normalizedPhone.startsWith("+45")
                ? `tel:${normalizedPhone}`
                : `https://wa.me/${normalizedPhone.replace("+", "")}`;
            const actionLabel = isEmail
              ? `Email ${trimmed}`
              : normalizedPhone.startsWith("+45")
                ? `Call ${trimmed}`
                : `Message ${trimmed} on WhatsApp`;
            const icon = isEmail ? (
              <FiMail aria-hidden="true" />
            ) : normalizedPhone.startsWith("+45") ? (
              <FiPhone aria-hidden="true" />
            ) : (
              <FaWhatsapp aria-hidden="true" />
            );

            return (
              <div className={styles.contactValueRow} key={trimmed}>
                <span className={styles.contactValueText} title={trimmed}>
                  {trimmed}
                </span>
                <a
                  className={styles.detailMailButton}
                  href={href}
                  aria-label={actionLabel}
                  title={actionLabel}
                  target={href.startsWith("https://") ? "_blank" : undefined}
                  rel={href.startsWith("https://") ? "noreferrer" : undefined}
                >
                  {icon}
                </a>
                <button
                  type="button"
                  className={`${styles.detailMailButton} ${styles.contactCopyButton}`}
                  aria-label={`Copy ${label.toLowerCase()}`}
                  title={`Copy ${label.toLowerCase()}`}
                  onClick={() => copyText(trimmed)}
                >
                  <FiCopy aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        {renderLoggedMeta(submission)}
      </div>
    );
  }

  function renderMeterDetailItem(label: string, meter: MeterKey, submission: Submission) {
    const activeValue = currentMeterReading(submission, meter);
    const correction = meterCorrection(submission, meter);
    const originalValue = correction?.originalValue?.trim() || "";
    const correctedValue = correction?.correctedValue?.trim() || activeValue;
    const originalNumber = parseMeterNumber(originalValue);
    const correctedNumber = parseMeterNumber(correctedValue);
    const difference =
      correction?.difference ??
      (originalNumber != null && correctedNumber != null
        ? correctedNumber - originalNumber
        : null);
    const hasCorrectionDifference =
      Boolean(correction) &&
      originalValue &&
      correctedValue &&
      difference != null &&
      difference !== 0;

    if (!hasCorrectionDifference) {
      return renderDetailItem(label, correctedValue, submission);
    }

    return (
      <div className={styles.detailItem}>
        <span className={styles.detailLabel}>{label}</span>
        <details className={styles.meterValueDetails}>
          <summary className={styles.meterValueSummary}>
            <span className={styles.detailValue}>{correctedValue}</span>
          </summary>
          <div className={styles.meterCorrectionRows}>
            <div className={styles.meterCorrectionRow}>
              <span>Guest input</span>
              <strong>{originalValue}</strong>
            </div>
            <div className={styles.meterCorrectionRow}>
              <span>Admin saved</span>
              <strong>{correctedValue}</strong>
            </div>
            <div className={styles.meterCorrectionRow}>
              <span>Difference</span>
              <strong>{formatMeterDifference(difference)}</strong>
            </div>
          </div>
        </details>
        {renderLoggedMeta(submission)}
      </div>
    );
  }

  function renderGroupDetailSwitcher(group: SubmissionGroup) {
    const groupContactSubmissions = group.items.filter(isContactSubmission);
    const groupCheckinSubmissions = group.items.filter(isCheckinSubmission);
    const regularSubmissions = group.items.filter(
      (submission) =>
        !isCheckinSubmission(submission) && !isContactSubmission(submission)
    );
    const hasCheckinSubmissions = groupCheckinSubmissions.length > 0;

    return (
      <div className={styles.linkedTabs}>
        <div className={styles.linkedTabList} role="tablist" aria-label="Submission views">
          <button
            type="button"
            className={styles.linkedTab}
            role="tab"
            aria-selected={activeGroupDetail === "overview"}
            onClick={() => openGroupDetail(group, "overview")}
          >
            <span>Overview</span>
          </button>
          {regularSubmissions.map((submission) => (
            <button
              type="button"
              key={submission.id}
              className={styles.linkedTab}
              role="tab"
              aria-selected={activeGroupDetail === submission.id}
              onClick={() => openGroupDetail(group, submission.id)}
            >
              <span>{submissionTabLabel(submission)}</span>
              {submissionStatusIcon(submission)}
            </button>
          ))}
          {groupContactSubmissions.length > 0 ? (
            <button
              type="button"
              className={styles.linkedTab}
              role="tab"
              aria-selected={activeGroupDetail === CONTACT_GROUP_DETAIL}
              onClick={() => openGroupDetail(group, CONTACT_GROUP_DETAIL)}
            >
              <span>Contact</span>
              {submissionGroupStatusIcon(groupContactSubmissions)}
            </button>
          ) : null}
          {hasCheckinSubmissions ? (
            <button
              type="button"
              className={styles.linkedTab}
              role="tab"
              aria-selected={activeGroupDetail === CHECKIN_GROUP_DETAIL}
              onClick={() => openGroupDetail(group, CHECKIN_GROUP_DETAIL)}
            >
              <span>Check-in/out</span>
              {submissionGroupStatusIcon(groupCheckinSubmissions)}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  function imageSource(
    attachment: ImagePreview["attachment"] | null | undefined
  ) {
    return (
      attachment?.viewUrl ||
      attachment?.dataUrl ||
      attachment?.downloadUrl ||
      attachment?.publicUrl ||
      attachment?.url ||
      attachment?.src ||
      null
    );
  }

  function imagePreviewAttachments(preview: ImagePreview | null) {
    return preview?.submission.checkin?.attachments || [];
  }

  function switchPreviewImage(direction: -1 | 1) {
    setImagePreview((current) => {
      if (!current) return current;
      const attachments = imagePreviewAttachments(current);
      if (attachments.length <= 1) return current;

      const nextIndex =
        (current.index + direction + attachments.length) % attachments.length;
      return {
        submission: current.submission,
        attachment: attachments[nextIndex],
        index: nextIndex,
      };
    });
  }

  function currentMeterReading(submission: Submission, meter: MeterKey) {
    return submission.checkin?.meterReadings?.[meter] || "";
  }

  function meterCorrection(submission: Submission, meter: MeterKey) {
    return submission.checkin?.meterCorrections?.[meter] || null;
  }

  function buildCorrectedSubmission(
    submission: Submission,
    meter: MeterKey,
    correctedValue: string,
    updatedBy: string | null
  ): Submission {
    const checkin = submission.checkin || {};
    const readings = checkin.meterReadings || {};
    const corrections = checkin.meterCorrections || {};
    const previousCorrection = corrections[meter] || null;
    const originalValue =
      previousCorrection?.originalValue != null
        ? String(previousCorrection.originalValue)
        : readings[meter] != null
          ? String(readings[meter])
          : "";
    const previousValue =
      readings[meter] != null ? String(readings[meter]) : originalValue;
    const originalNumber = parseMeterNumber(originalValue);
    const correctedNumber = parseMeterNumber(correctedValue);
    const difference =
      originalNumber != null && correctedNumber != null
        ? correctedNumber - originalNumber
        : null;
    const updatedAtMs = Date.now();

    return {
      ...submission,
      checkin: {
        ...checkin,
        meterReadings: {
          ...readings,
          [meter]: correctedValue,
        },
        meterCorrections: {
          ...corrections,
          [meter]: {
            meter,
            originalValue,
            previousValue,
            correctedValue,
            difference,
            updatedAtMs,
            updatedBy,
          },
        },
      },
      updatedAtMs,
    };
  }

  function buildApprovedCheckinSubmission(
    submission: Submission,
    approvedBy: string | null
  ): Submission {
    const checkin = submission.checkin || {};
    const updatedAtMs = Date.now();

    return {
      ...submission,
      checkin: {
        ...checkin,
        meterApproval: {
          status: "approved",
          approvedAtMs: updatedAtMs,
          approvedBy,
        },
      },
      updatedAtMs,
    };
  }

  function replaceSubmission(nextSubmission: Submission) {
    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === nextSubmission.id ? nextSubmission : submission
      )
    );
    setImagePreview((current) => {
      if (!current || current.submission.id !== nextSubmission.id) return current;
      const attachments = nextSubmission.checkin?.attachments || [];
      return {
        submission: nextSubmission,
        attachment: attachments[current.index] || current.attachment,
        index: current.index,
      };
    });
  }

  async function saveMeterCorrection(options?: {
    meter?: MeterDraftKey;
    value?: string;
    signature?: string;
  }) {
    if (!imagePreview || meterSaveState === "saving") return;
    const selectedMeter = options?.meter ?? meterDraftKey;
    const correctedValue = (options?.value ?? meterDraftValue).trim();

    if (!selectedMeter) {
      setMeterSaveState("error");
      setMeterSaveError("Select which meter this image belongs to.");
      return;
    }

    if (!correctedValue) {
      setMeterSaveState("error");
      setMeterSaveError("Enter the correct meter amount.");
      return;
    }

    if (parseMeterNumber(correctedValue) == null) {
      setMeterSaveState("error");
      setMeterSaveError("Use a number, for example 055540 or 1.234,5.");
      return;
    }

    setMeterSaveState("saving");
    setMeterSaveError(null);

    try {
      if (DASHBOARD_AUTH_DISABLED) {
        const updatedSubmission = buildCorrectedSubmission(
          imagePreview.submission,
          selectedMeter,
          correctedValue,
          adminEmail || "local@fyrrehaven-61.dk"
        );
        replaceSubmission(updatedSubmission);
        lastMeterSaveSignature.current =
          options?.signature ||
          `${imagePreview.submission.id}:${imagePreviewKey(imagePreview) || imagePreview.index}:${selectedMeter}:${correctedValue}`;
        setMeterSaveState("saved");
        return;
      }

      const auth = getFirebaseAuth();
      const token = auth?.currentUser ? await auth.currentUser.getIdToken(true) : null;
      const res = await fetch("/api/admin/forms", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "correct-meter",
          id: imagePreview.submission.id,
          meter: selectedMeter,
          correctedValue,
        }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok || !data.submission) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }

      replaceSubmission(data.submission);
      lastMeterSaveSignature.current =
        options?.signature ||
        `${imagePreview.submission.id}:${imagePreviewKey(imagePreview) || imagePreview.index}:${selectedMeter}:${correctedValue}`;
      setMeterSaveState("saved");
    } catch (nextError) {
      setMeterSaveState("error");
      setMeterSaveError(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    }
  }

  async function approveCheckinMeters(submission: Submission) {
    if (!submission.checkin || approvingCheckinId) return;

    setApprovingCheckinId(submission.id);
    setCheckinApprovalError(null);

    try {
      if (DASHBOARD_AUTH_DISABLED) {
        replaceSubmission(
          buildApprovedCheckinSubmission(
            submission,
            adminEmail || "local@fyrrehaven-61.dk"
          )
        );
        return;
      }

      const auth = getFirebaseAuth();
      const token = auth?.currentUser ? await auth.currentUser.getIdToken(true) : null;
      const res = await fetch("/api/admin/forms", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "approve-checkin-meters",
          id: submission.id,
        }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok || !data.submission) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }

      replaceSubmission(data.submission);
    } catch (nextError) {
      setCheckinApprovalError(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    } finally {
      setApprovingCheckinId(null);
    }
  }

  React.useEffect(() => {
    if (meterAutosaveTimer.current) {
      window.clearTimeout(meterAutosaveTimer.current);
      meterAutosaveTimer.current = null;
    }

    if (!imagePreview || !meterDraftKey) return;

    const correctedValue = meterDraftValue.trim();
    if (!correctedValue) {
      setMeterSaveState("idle");
      return;
    }

    const previewKey = imagePreviewKey(imagePreview) || String(imagePreview.index);
    const signature = `${imagePreview.submission.id}:${previewKey}:${meterDraftKey}:${correctedValue}`;
    if (lastMeterSaveSignature.current === signature) return;

    meterAutosaveTimer.current = window.setTimeout(() => {
      if (parseMeterNumber(correctedValue) == null) {
        setMeterSaveState("error");
        setMeterSaveError("Use a number, for example 055540 or 1.234,5.");
        return;
      }

      void saveMeterCorrection({
        meter: meterDraftKey,
        value: correctedValue,
        signature,
      });
    }, 750);

    return () => {
      if (meterAutosaveTimer.current) {
        window.clearTimeout(meterAutosaveTimer.current);
        meterAutosaveTimer.current = null;
      }
    };
  }, [imagePreview, meterDraftKey, meterDraftValue]);

  React.useEffect(() => {
    if (meterSaveState !== "saved") return;
    const timeout = window.setTimeout(() => {
      setMeterSaveState("idle");
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [meterSaveState]);

  function renderCheckinApproval(submission: Submission) {
    const approval = submission.checkin?.meterApproval || null;
    const isApproved = approval?.status === "approved" && approval.approvedAtMs;
    const isApproving = approvingCheckinId === submission.id;

    return (
      <div className={styles.checkinApprovalPanel}>
        <div>
          <strong>
            {isApproved ? "Meter readings approved" : "Approve meter readings"}
          </strong>
          <span>
            {isApproved
              ? `Approved ${formatDateTime(approval.approvedAtMs || undefined)}`
              : "Sends check-in/out numbers to the integration API after review."}
          </span>
        </div>
        <button
          type="button"
          className={styles.checkinApprovalButton}
          disabled={Boolean(isApproved) || isApproving}
          onClick={() => void approveCheckinMeters(submission)}
        >
          <FiCheckCircle aria-hidden="true" />
          {isApproving ? "Approving..." : isApproved ? "Approved" : "Approve"}
        </button>
        {checkinApprovalError ? (
          <p className={styles.checkinApprovalError}>{checkinApprovalError}</p>
        ) : null}
      </div>
    );
  }

  function renderCheckinAttachments(submission: Submission) {
    const attachments = submission.checkin?.attachments || [];
    if (!attachments.length) return null;
    const firstPreviewIndex = attachments.findIndex((file) => imageSource(file));
    const firstPreview =
      firstPreviewIndex >= 0 ? attachments[firstPreviewIndex] : attachments[0];
    const previewIndex = firstPreviewIndex >= 0 ? firstPreviewIndex : 0;

    return (
      <div className={styles.attachmentSection}>
        <button
          type="button"
          className={styles.attachmentOpenButton}
          onClick={() =>
            setImagePreview({
              submission,
              attachment: firstPreview,
              index: previewIndex,
            })
          }
        >
          <span>
            <strong>Check-in/out images</strong>
            <small>
              {attachments.length} image{attachments.length === 1 ? "" : "s"}
            </small>
          </span>
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    );
  }

  function renderOverviewContent(group: SubmissionGroup | null, fallback: Submission) {
    const groupItems = group?.items?.length ? group.items : [fallback];
    const emailSource = findOverviewContactSubmission(groupItems, "email") || fallback;
    const phoneSource = findOverviewContactSubmission(groupItems, "phone") || fallback;
    const bookingSource = findOverviewBookingSubmission(groupItems);
    const staySource =
      bookingSource ||
      findSubmissionWithValue(groupItems, (submission) => submission.extras?.stayDate) ||
      fallback;
    const overviewStayDate = findOverviewStayDate(group, fallback);
    const overviewCheckoutDate = findOverviewCheckoutDate(group, fallback);
    const selectionTotal =
      bookingSource?.selection?.totalAfterAirbnbDiscountDKK ??
      bookingSource?.selection?.totalWithCleaningDKK;
    const emails = uniqueSubmissionValues(groupItems, (submission) => submission.email);
    const phones = uniqueSubmissionValues(groupItems, (submission) => submission.phone);

    const contactItems = [
      emails.length ? renderContactValueList("Email", emails, emailSource) : null,
      phones.length ? renderContactValueList("Phone", phones, phoneSource) : null,
    ].filter(Boolean);
    const stayDateItems = [
      renderDetailItem("Check-in", formatPlainDate(overviewStayDate), staySource),
      renderDetailItem("Check-out", formatPlainDate(overviewCheckoutDate), bookingSource || staySource),
    ].filter(Boolean);
    const stayCountItems = [
      bookingSource
        ? renderDetailItem("Nights", bookingSource.selection?.nights, bookingSource)
        : null,
      bookingSource
        ? renderDetailItem(
            "Guests",
            bookingSource.guests?.total,
            bookingSource,
            hasGuestBreakdown(bookingSource.guests)
              ? {
                  after: (
                    <div className={styles.detailSubValues}>
                      {typeof bookingSource.guests?.adults === "number" ? (
                        <span>Adults: {bookingSource.guests.adults}</span>
                      ) : null}
                      {typeof bookingSource.guests?.children === "number" ? (
                        <span>Kids: {bookingSource.guests.children}</span>
                      ) : null}
                      {typeof bookingSource.guests?.babies === "number" ? (
                        <span>Babies: {bookingSource.guests.babies}</span>
                      ) : null}
                    </div>
                  ),
                }
              : undefined
          )
        : null,
    ].filter(Boolean);
    const bookingTotalItem = bookingSource
      ? renderDetailItem(
          "Booking price",
          selectionTotal != null ? formatMoney(selectionTotal) : null,
          bookingSource,
          {
            wide: true,
            after: renderSelectionPriceBreakdown(bookingSource.selection),
          }
        )
      : null;

    return (
      <>
        {contactItems.length > 0 ? (
          <section className={styles.detailSection}>
            <h3>Contact</h3>
            <div className={styles.detailGrid}>{contactItems}</div>
          </section>
        ) : null}

        {stayDateItems.length > 0 ||
        stayCountItems.length > 0 ||
        bookingTotalItem ? (
          <section className={styles.detailSection}>
            <h3>Stay</h3>
            {stayDateItems.length > 0 ? (
              <div className={styles.detailGrid}>{stayDateItems}</div>
            ) : null}
            {stayCountItems.length > 0 ? (
              <div className={`${styles.detailGrid} ${styles.detailGridCompact}`}>
                {stayCountItems}
              </div>
            ) : null}
            {bookingTotalItem ? (
              <div className={`${styles.detailGrid} ${styles.detailTotalGrid}`}>
                {bookingTotalItem}
              </div>
            ) : null}
          </section>
        ) : null}
      </>
    );
  }

  function renderCombinedContactContent(submissions: Submission[], fallback: Submission) {
    const contactItems = submissions.length ? submissions : [fallback];
    const messages = contactItems.filter((submission) =>
      hasDisplayValue(submission.message)
    );
    const mailErrors = contactItems.filter((submission) =>
      hasDisplayValue(submission.mailError)
    );

    return (
      <>
        {messages.length > 0 ? (
          <section className={styles.detailSection}>
            <h3>{messages.length === 1 ? "Message" : "Messages"}</h3>
            <div className={styles.contactMessageList}>
              {messages.map((messageSubmission) => (
                <article
                  className={styles.contactMessageCard}
                  key={messageSubmission.id}
                >
                  <div className={styles.contactMessageHeader}>
                    <div>
                      <strong>{displayNameWithCountry(messageSubmission)}</strong>
                      <span>{formatDateTime(messageSubmission.createdAtMs)}</span>
                    </div>
                    <span
                      className={`${styles.badge} ${statusClassName(
                        messageSubmission.status
                      )}`}
                    >
                      {statusLabel(messageSubmission.status)}
                    </span>
                  </div>
                  <p className={styles.detailMessage}>{messageSubmission.message}</p>
                  {renderLoggedMeta(messageSubmission)}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {mailErrors.length > 0 ? (
          <section className={styles.detailSection}>
            <h3>Email errors</h3>
            <div className={styles.contactMessageList}>
              {mailErrors.map((errorSubmission) => (
                <article
                  className={styles.contactMessageCard}
                  key={`${errorSubmission.id}-mail-error`}
                >
                  <div className={styles.contactMessageHeader}>
                    <div>
                      <strong>{displayNameWithCountry(errorSubmission)}</strong>
                      <span>{formatDateTime(errorSubmission.createdAtMs)}</span>
                    </div>
                    {submissionStatusIcon(errorSubmission)}
                  </div>
                  <p className={styles.detailMessage}>{errorSubmission.mailError}</p>
                  {renderLoggedMeta(errorSubmission)}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </>
    );
  }

  function renderSubmissionDetailContent(submission: Submission) {
    const isOverview = activeGroupDetail === "overview";
    if (isOverview) {
      return renderOverviewContent(selectedGroup, submission);
    }
    if (activeGroupDetail === CONTACT_GROUP_DETAIL) {
      return renderCombinedContactContent(contactSubmissions, submission);
    }

    const isBookingSubmission = submission.intent === "booking";
    const isContact = isContactSubmission(submission);
    const stayDateItems = [
      isBookingSubmission
        ? renderDetailItem(
            "Check-in",
            formatPlainDate(submission.selection?.start),
            submission
          )
        : null,
      isBookingSubmission
        ? renderDetailItem(
            "Check-out",
            formatPlainDate(submission.selection?.endExclusive),
            submission
          )
        : null,
    ].filter(Boolean);
    const stayCountItems = [
      isBookingSubmission
        ? renderDetailItem("Nights", submission.selection?.nights, submission)
        : null,
      isBookingSubmission
        ? renderDetailItem(
            "Guests",
            submission.guests?.total,
            submission,
            hasGuestBreakdown(submission.guests)
              ? {
                  after: (
                    <div className={styles.detailSubValues}>
                      {typeof submission.guests?.adults === "number" ? (
                        <span>Adults: {submission.guests.adults}</span>
                      ) : null}
                      {typeof submission.guests?.children === "number" ? (
                        <span>Kids: {submission.guests.children}</span>
                      ) : null}
                      {typeof submission.guests?.babies === "number" ? (
                        <span>Babies: {submission.guests.babies}</span>
                      ) : null}
                    </div>
                  ),
                }
              : undefined
          )
        : null,
    ].filter(Boolean);
    const selectionTotal =
      submission.selection?.totalAfterAirbnbDiscountDKK ??
      submission.selection?.totalWithCleaningDKK;
    const stayTotalItem = isBookingSubmission
      ? renderDetailItem(
          "Total",
          selectionTotal != null ? formatMoney(selectionTotal) : null,
          submission,
          {
            wide: true,
            after: renderSelectionPriceBreakdown(submission.selection),
          }
        )
      : null;
    const stayPurposeItem = renderDetailItem(
      "Purpose",
      submission.stayPurpose,
      submission,
      { message: true }
    );
    const hasStaySection =
      stayDateItems.length > 0 ||
      stayCountItems.length > 0 ||
      stayTotalItem ||
      stayPurposeItem;

    const extraTotalItem = renderDetailItem(
      "Total",
      submission.extras?.totalDKK != null
        ? formatMoney(submission.extras.totalDKK)
        : null,
      submission,
      {
        wide: true,
        after: renderExtrasPriceBreakdown(submission.extras),
      }
    );

    const checkinItems = [
      renderDetailItem("Key code", submission.checkin?.keycode, submission),
      renderMeterDetailItem("Electricity", "electricity", submission),
      renderMeterDetailItem("Water (house)", "waterHouse", submission),
      renderMeterDetailItem("Water (pool)", "waterPool", submission),
    ].filter(Boolean);
    const hasCheckinSection =
      checkinItems.length > 0 || Boolean(submission.checkin?.attachments?.length);
    const checkinTypeOptions: CheckinDetailSelection[] = ["checkin", "checkout"];
    const availableCheckinTypes = new Set(
      checkinSubmissions
        .map((item) => item.checkin?.type)
        .filter((type): type is CheckinDetailSelection =>
          type === "checkin" || type === "checkout"
        )
    );

    return (
      <>
        {isContact && submission.message ? (
          <section className={styles.detailSection}>
            <h3>Message</h3>
            <div className={styles.detailList}>
              {renderDetailItem("Message", submission.message, submission, {
                message: true,
              })}
            </div>
          </section>
        ) : null}

        {hasStaySection ? (
          <section className={styles.detailSection}>
            <h3>Stay</h3>
            {stayDateItems.length > 0 ? (
              <div className={styles.detailGrid}>{stayDateItems}</div>
            ) : null}
            {stayCountItems.length > 0 ? (
              <div className={`${styles.detailGrid} ${styles.detailGridCompact}`}>
                {stayCountItems}
              </div>
            ) : null}
            {stayTotalItem ? (
              <div className={`${styles.detailGrid} ${styles.detailTotalGrid}`}>
                {stayTotalItem}
              </div>
            ) : null}
            {stayPurposeItem ? (
              <div className={styles.detailList}>{stayPurposeItem}</div>
            ) : null}
          </section>
        ) : null}

        {submission.extras && (extraTotalItem || submission.extras.items?.length) ? (
          <section className={styles.detailSection}>
            <h3>Extra services</h3>
            {submission.extras.items?.length ? (
              <div className={styles.serviceList}>
                {submission.extras.items.map((item, index) => (
                  <div className={styles.serviceItem} key={`${item.id || "extra"}-${index}`}>
                    <div>
                      <span className={styles.serviceName}>
                        {extraItemLabel(item)}
                      </span>
                    </div>
                    {typeof item.qty === "number" ? (
                      <span className={styles.serviceQty}>
                        {isYesNoExtraItem(item) ? "Yes" : `x ${item.qty}`}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {extraTotalItem ? (
              <div className={`${styles.detailGrid} ${styles.detailTotalGrid}`}>
                {extraTotalItem}
              </div>
            ) : null}
          </section>
        ) : null}

        {submission.checkin && hasCheckinSection ? (
          <section className={styles.detailSection}>
            <h3>{submission.checkin.type === "checkout" ? "Check-out" : "Check-in"}</h3>
            {isCheckinSubmission(submission) ? (
              <div
                className={`${styles.linkedTabList} ${styles.inlineTabList}`}
                role="tablist"
                aria-label="Check-in and check-out views"
              >
                {checkinTypeOptions.map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={styles.linkedTab}
                    role="tab"
                    aria-selected={activeCheckinDetail === type}
                    aria-disabled={!availableCheckinTypes.has(type)}
                    disabled={!availableCheckinTypes.has(type)}
                    onClick={() => openCheckinDetail(type)}
                  >
                    <span>{type === "checkout" ? "Check-out" : "Check-in"}</span>
                    {submissionStatusIcon(
                      checkinSubmissions.find(
                        (submission) => submission.checkin?.type === type
                      )
                    )}
                  </button>
                ))}
              </div>
            ) : null}
            {checkinItems.length > 0 ? (
              <div className={styles.detailGrid}>{checkinItems}</div>
            ) : null}
            {renderCheckinApproval(submission)}
            {renderCheckinAttachments(submission)}
          </section>
        ) : null}

        {!isContact && submission.message ? (
          <section className={styles.detailSection}>
            <h3>Message</h3>
            <p className={styles.detailMessage}>{submission.message}</p>
            {renderLoggedMeta(submission)}
          </section>
        ) : null}

        {submission.mailError ? (
          <section className={styles.detailSection}>
            <h3>Email error</h3>
            <p className={styles.detailMessage}>{submission.mailError}</p>
            {renderLoggedMeta(submission)}
          </section>
        ) : null}
      </>
    );
  }

  async function handleDeleteSubmission() {
    const target = deleteTarget;
    if (!target || deleting) return;
    const targetIds = target.items.map((submission) => submission.id).filter(Boolean);

    setDeleteError(null);

    if (deleteConfirmation.trim().toLowerCase() !== "delete") {
      setDeleteError('Type "delete" to confirm removal.');
      return;
    }

    setDeleting(true);
    try {
      const auth = getFirebaseAuth();
      const token =
        DASHBOARD_AUTH_DISABLED || !auth?.currentUser
          ? null
          : await auth.currentUser.getIdToken(true);

      const res = await fetch("/api/admin/forms", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ids: targetIds,
          confirmation: deleteConfirmation.trim(),
        }),
      });

      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        throw new Error(
          data.detail || data.error || `HTTP ${res.status}`
        );
      }

      setSubmissions((current) => {
        const deletedIds = new Set(data.deletedIds?.length ? data.deletedIds : targetIds);
        const next = current.filter((submission) => !deletedIds.has(submission.id));
        setSelectedId((current) => {
          if (current !== target.groupId) return current;
          const nextGroup = buildSubmissionGroups(next)[0] ?? null;
          const nextId = nextGroup?.id ?? null;
          navigate(nextId ? adminSubmissionPath(nextId) : "/admin/forms");
          return nextId;
        });
        return next;
      });
      setDeleteConfirmation("");
      setDeleteTarget(null);
    } catch (nextError) {
      setDeleteError(
        String(nextError instanceof Error ? nextError.message : nextError)
      );
    } finally {
      setDeleting(false);
    }
  }

  function renderStatisticsKpi(
    label: string,
    value: React.ReactNode,
    meta: string,
    icon: React.ReactNode,
    tone: "neutral" | "success" | "warning" | "danger" = "neutral"
  ) {
    return (
      <div className={styles.statKpi} data-tone={tone}>
        <div className={styles.statKpiHeader}>
          <span className={styles.statKpiIcon}>{icon}</span>
          <span>{label}</span>
        </div>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
    );
  }

  function renderStatisticsTable(
    title: string,
    rows: StatisticsBreakdownRow[],
    options?: { showValue?: boolean }
  ) {
    return (
      <section className={styles.statsPanel}>
        <div className={styles.statsPanelHeader}>
          <h2>{title}</h2>
          <span>
            {rows.length} row{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className={styles.statsTableWrap}>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Segment</th>
                <th>Count</th>
                <th>Email sent</th>
                <th>Email failed</th>
                {options?.showValue ? <th>Known value</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.count}</td>
                    <td>{row.sent}</td>
                    <td>{row.failed}</td>
                    {options?.showValue ? <td>{formatMoney(row.valueDKK)}</td> : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={options?.showValue ? 5 : 4}>No data in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderAnalyticsRows(
    title: string,
    rows: AnalyticsRow[] = [],
    options?: { valueLabel?: string }
  ) {
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return (
      <section className={styles.statsPanel}>
        <div className={styles.statsPanelHeader}>
          <h2>{title}</h2>
          <span>{total ? `${total} total` : "No data"}</span>
        </div>
        <div className={styles.analyticsList}>
          {rows.length ? (
            rows.map((row) => (
              <div className={styles.analyticsRow} key={row.label}>
                <div>
                  <strong>{row.label}</strong>
                  <small>{formatPercent(row.count, total)}</small>
                </div>
                <span>{row.count}</span>
                <i
                  aria-hidden="true"
                  style={{ inlineSize: `${Math.max(6, (row.count / total) * 100)}%` }}
                />
              </div>
            ))
          ) : (
            <p className={styles.detailMuted}>
              {options?.valueLabel || "No analytics data in this period yet."}
            </p>
          )}
        </div>
      </section>
    );
  }

  function renderTopPagesTable(pages: AnalyticsPageRow[] = []) {
    return (
      <section className={styles.statsPanel}>
        <div className={styles.statsPanelHeader}>
          <h2>Top visited pages</h2>
          <span>{pages.length} shown</span>
        </div>
        <div className={styles.statsTableWrap}>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
                <th>Visitors</th>
                <th>Avg. time</th>
                <th>Entries</th>
                <th>Exit rate</th>
              </tr>
            </thead>
            <tbody>
              {pages.length ? (
                pages.map((page) => (
                  <tr key={page.path}>
                    <td>{page.path}</td>
                    <td>{page.views}</td>
                    <td>{page.visitors}</td>
                    <td>{formatDuration(page.averageTimeMs)}</td>
                    <td>{page.entries}</td>
                    <td>{formatRatio(page.exitRate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No page visits in this period yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderTrafficTrend(
    rows: AnalyticsRow[] = [],
    options?: { title?: string; emptyLabel?: string }
  ) {
    const max = Math.max(...rows.map((row) => row.count), 1);
    return (
      <section className={styles.statsPanel}>
        <div className={styles.statsPanelHeader}>
          <h2>{options?.title || "Traffic trend"}</h2>
          <span>{rows.length ? "Recent periods" : "No data"}</span>
        </div>
        <div className={styles.trendBars}>
          {rows.length ? (
            rows.slice(-24).map((row) => (
              <div className={styles.trendBar} key={row.label}>
                <span style={{ blockSize: `${Math.max(5, (row.count / max) * 100)}%` }} />
                <small>{row.count}</small>
              </div>
            ))
          ) : (
            <p className={styles.detailMuted}>
              {options?.emptyLabel || "Traffic will appear here after visits are tracked."}
            </p>
          )}
        </div>
      </section>
    );
  }

  function renderStatisticsPage() {
    const stats = adminStatistics;
    const traffic = analytics?.totals;
    const emailTotal = stats.sent + stats.failed + stats.pending;
    const knownRevenueMeta =
      stats.bookingCount > 0
        ? `Average booking ${formatMoney(stats.averageBookingDKK)}`
        : "No booking value yet";
    const conversionRate =
      traffic && traffic.visitors > 0 ? stats.bookingCount / traffic.visitors : 0;

    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <Helmet>
          <title>Statistics | Fyrrehaven 61 admin</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div className={styles.page}>
          <div className={styles.shell}>
            {renderAdminHeader(
              "Statistics",
              "statistics",
              "Internal overview of website activity, submissions and booking performance."
            )}

            <section className={styles.statsToolbar}>
              <div>
                <p className={styles.eyebrow}>Website insights</p>
                <h2>Private traffic and booking overview</h2>
                <p>
                  Consent-based first-party reporting for page visits, active visitors,
                  devices, locations, referrer domains and booking conversions. The
                  overview is for internal planning and does not store personal profiles.
                </p>
              </div>
              <label className={styles.filterLabel} htmlFor="admin-statistics-date-filter">
                <span>Date range</span>
                <select
                  id="admin-statistics-date-filter"
                  className={styles.filterSelect}
                  value={statisticsDateFilter}
                  onChange={(event) =>
                    setStatisticsDateFilter(
                      event.target.value as SubmissionDateFilter
                    )
                  }
                >
                  {ADMIN_DATE_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {error ? (
              <div className={styles.emptyState}>
                <h2>The submission statistics could not load data</h2>
                <p>{error}</p>
              </div>
            ) : (
              <>
                {analyticsError ? (
                  <div className={styles.emptyState}>
                    <h2>Website analytics could not load</h2>
                    <p>{analyticsError}</p>
                  </div>
                ) : null}

                <section className={styles.statsKpiGrid}>
                  {renderStatisticsKpi(
                    "Live visitors",
                    isLoadingAnalytics ? "..." : traffic?.liveVisitors || 0,
                    "Active in the last 5 minutes",
                    <FiEye aria-hidden="true" />,
                    traffic?.liveVisitors ? "success" : "neutral"
                  )}
                  {renderStatisticsKpi(
                    "Page views",
                    isLoadingAnalytics ? "..." : traffic?.pageViews || 0,
                    `${traffic?.visitors || 0} visitors · ${
                      traffic?.sessions || 0
                    } sessions`,
                    <FiGlobe aria-hidden="true" />
                  )}
                  {renderStatisticsKpi(
                    "Bounce rate",
                    isLoadingAnalytics ? "..." : formatRatio(traffic?.bounceRate),
                    "Single-page sessions",
                    <FiRepeat aria-hidden="true" />,
                    (traffic?.bounceRate || 0) > 0.65 ? "warning" : "success"
                  )}
                  {renderStatisticsKpi(
                    "Avg. page time",
                    isLoadingAnalytics
                      ? "..."
                      : formatDuration(traffic?.averagePageTimeMs),
                    `Session avg. ${formatDuration(traffic?.averageSessionMs)}`,
                    <FiClock aria-hidden="true" />
                  )}
                </section>

                <section className={styles.statsKpiGridSecondary}>
                  {renderStatisticsKpi(
                    "Conversion rate",
                    formatRatio(conversionRate),
                    `${stats.bookingCount} bookings from ${
                      traffic?.visitors || 0
                    } visitors`,
                    <FiTrendingUp aria-hidden="true" />,
                    conversionRate > 0 ? "success" : "neutral"
                  )}
                  {renderStatisticsKpi(
                    "Avg. load time",
                    formatDuration(traffic?.averageLoadMs),
                    "Browser page load sample",
                    <FiMonitor aria-hidden="true" />
                  )}
                  {renderStatisticsKpi(
                    "Site area mix",
                    `${analytics?.siteAreas?.[0]?.label || "No data"}`,
                    analytics?.siteAreas
                      ?.map((row) => `${row.label}: ${row.count}`)
                      .join(" · ") || "No tracked visits yet",
                    <FiPieChart aria-hidden="true" />
                  )}
                  {renderStatisticsKpi(
                    "Mobile share",
                    formatRatio(
                      (analytics?.devices || []).find((row) => row.label === "Mobile")
                        ?.count && traffic?.pageViews
                        ? ((analytics?.devices || []).find(
                            (row) => row.label === "Mobile"
                          )?.count || 0) / traffic.pageViews
                        : 0
                    ),
                    "Useful for booking experience decisions",
                    <FiSmartphone aria-hidden="true" />
                  )}
                </section>

                {renderTopPagesTable(analytics?.pages)}

                <div className={styles.statsGrid}>
                  {renderAnalyticsRows("Countries", analytics?.countries)}
                  {renderAnalyticsRows("Devices", analytics?.devices)}
                </div>

                <div className={styles.statsGrid}>
                  {renderAnalyticsRows("Referrers", analytics?.referrers)}
                  {renderAnalyticsRows("Browsers", analytics?.browsers)}
                </div>

                <div className={styles.statsGrid}>
                  {renderAnalyticsRows("Site areas", analytics?.siteAreas)}
                  {renderAnalyticsRows("Languages", analytics?.languages)}
                </div>

                <div className={styles.statsGrid}>
                  {renderAnalyticsRows("Entry pages", analytics?.entryPages)}
                  {renderAnalyticsRows("Exit pages", analytics?.exitPages)}
                </div>

                <div className={styles.statsGrid}>
                  {renderTrafficTrend(analytics?.daily?.length ? analytics.daily : analytics?.hourly)}
                  {renderAnalyticsRows("Campaigns", analytics?.campaigns, {
                    valueLabel: "Campaigns appear here when visitors arrive with UTM links.",
                  })}
                </div>

                <section className={styles.statsKpiGrid}>
                  {renderStatisticsKpi(
                    "Total submissions",
                    stats.total,
                    `${stats.publicCount} public · ${stats.privateCount} internal/private`,
                    <FiInbox aria-hidden="true" />
                  )}
                  {renderStatisticsKpi(
                    "Known revenue",
                    formatMoney(stats.totalKnownRevenueDKK),
                    knownRevenueMeta,
                    <FiBarChart2 aria-hidden="true" />,
                    "success"
                  )}
                  {renderStatisticsKpi(
                    "Email success",
                    formatPercent(stats.sent, emailTotal),
                    `${stats.sent} sent · ${stats.failed} failed · ${stats.pending} pending`,
                    <FiMail aria-hidden="true" />,
                    stats.failed ? "warning" : "success"
                  )}
                  {renderStatisticsKpi(
                    "Unique guests",
                    stats.uniqueGuests,
                    `Latest: ${formatDateTime(stats.latestAtMs)}`,
                    <FiUser aria-hidden="true" />
                  )}
                </section>

                <section className={styles.statsKpiGridSecondary}>
                  {renderStatisticsKpi(
                    "Bookings",
                    stats.bookingCount,
                    `${stats.bookingNights} booked night${
                      stats.bookingNights === 1 ? "" : "s"
                    }`,
                    <FiCheckCircle aria-hidden="true" />,
                    "success"
                  )}
                  {renderStatisticsKpi(
                    "Extra services",
                    formatMoney(stats.extraRevenueDKK),
                    "Known extra-service value",
                    <FiPieChart aria-hidden="true" />
                  )}
                  {renderStatisticsKpi(
                    "Check-in/out",
                    stats.checkinCount + stats.checkoutCount,
                    `${stats.checkinCount} check-in · ${stats.checkoutCount} check-out`,
                    <FiZap aria-hidden="true" />
                  )}
                  {renderStatisticsKpi(
                    "Meter approvals",
                    stats.approvedCheckins,
                    `${stats.pendingCheckinApproval} waiting for approval`,
                    <FiCheck aria-hidden="true" />,
                    stats.pendingCheckinApproval ? "warning" : "success"
                  )}
                </section>

                <div className={styles.statsGrid}>
                  {renderStatisticsTable("Forms", stats.formRows, {
                    showValue: true,
                  })}
                  {renderStatisticsTable("Traffic source", stats.sourceRows, {
                    showValue: true,
                  })}
                </div>

                <div className={styles.statsGrid}>
                  <section className={styles.statsPanel}>
                    <div className={styles.statsPanelHeader}>
                      <h2>Top countries</h2>
                      <span>{stats.countryRows.length} shown</span>
                    </div>
                    <div className={styles.countryList}>
                      {stats.countryRows.length ? (
                        stats.countryRows.map((row) => (
                          <div className={styles.countryRow} key={row.label}>
                            <span>{row.label}</span>
                            <strong>{row.count}</strong>
                          </div>
                        ))
                      ) : (
                        <p className={styles.detailMuted}>No country data in this period.</p>
                      )}
                    </div>
                  </section>

                  <section className={styles.statsPanel}>
                    <div className={styles.statsPanelHeader}>
                      <h2>Latest activity</h2>
                      <span>{formatDateTime(stats.latestAtMs)}</span>
                    </div>
                    <div className={styles.recentActivityList}>
                      {stats.recentRows.length ? (
                        stats.recentRows.map((submission) => (
                          <button
                            type="button"
                            className={styles.recentActivityRow}
                            key={submission.id}
                            onClick={() =>
                              navigate(adminSubmissionPath(submission.id, "overview"))
                            }
                          >
                            <span>
                              <strong>
                                {displayNameWithCountry(submission) || "Unknown name"}
                              </strong>
                              <small>{submissionLabel(submission)}</small>
                            </span>
                            <span>{formatDateTime(submission.createdAtMs)}</span>
                          </button>
                        ))
                      ) : (
                        <p className={styles.detailMuted}>No recent activity in this period.</p>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </Theme>
    );
  }

  const testSubmissionTool = (
    <section className={styles.testPanel} aria-label="Manual test submissions">
      <div>
        <p className={styles.eyebrow}>Manual testing</p>
        <h2>Send test form emails</h2>
        <p>
          Sends real form emails using prefilled test values for guest{" "}
          <strong>rafy@marbin.dk</strong>, then deletes the temporary submission
          data whether the email succeeds or fails.
        </p>
        <details className={styles.testDetails}>
          <summary>Show test values</summary>
          <div className={styles.testValueGrid}>
            <span>Name</span>
            <strong>Rafy Marbin Test Guest</strong>
            <span>Email</span>
            <strong>rafy@marbin.dk</strong>
            <span>Phone</span>
            <strong>+45 22 33 44 55</strong>
            <span>Country</span>
            <strong>Denmark (DK)</strong>
            <span>Stay</span>
            <strong>12. 08. 2026 - 19. 08. 2026</strong>
            <span>Guests</span>
            <strong>3 adults, 2 kids, 1 baby</strong>
            <span>Extras</span>
            <strong>5 linen packages and 1 baby crib</strong>
            <span>Meters</span>
            <strong>Electricity 055540, house water 0002142, pool 00516263</strong>
            <span>Images</span>
            <strong>
              electricity-meter.jpeg, water-house-meter.jpeg, water-pool-meter.jpeg
            </strong>
          </div>
        </details>
      </div>
      <div className={styles.testControls}>
        <label className={styles.filterLabel} htmlFor="admin-test-submission-type">
          <span>Test form</span>
          <select
            id="admin-test-submission-type"
            className={styles.filterSelect}
            value={testSubmissionType}
            onChange={(event) =>
              setTestSubmissionType(event.target.value as TestSubmissionType)
            }
          >
            <option value="all">Full guest journey</option>
            <option value="booking">Booking</option>
            <option value="contact">Contact</option>
            <option value="extra-services">Extra services</option>
            <option value="checkin">Check-in</option>
            <option value="checkout">Check-out</option>
          </select>
        </label>
        <button
          type="button"
          className={styles.button}
          disabled={creatingTestSubmission}
          onClick={() => void createTestSubmission()}
        >
          {creatingTestSubmission ? "Creating..." : "Create test"}
        </button>
        <button
          type="button"
          className={styles.ghostButton}
          disabled={creatingTestSubmission}
          onClick={() => void createTestSubmission("all")}
        >
          Create full group
        </button>
        {testRunResults.length > 0 ? (
          <div className={styles.testResults}>
            {testRunResults.map((result) => (
              <div
                key={result.type}
                className={styles.testResult}
                data-state={result.status === "sent" && result.deleted ? "success" : "error"}
              >
                <strong>{result.label}</strong>
                <span>
                  {result.status === "sent"
                    ? "Mail sent"
                    : result.status === "failed"
                      ? "Mail failed"
                      : "Error"}
                  {result.submissionId
                    ? result.deleted
                      ? " · data deleted"
                      : " · cleanup failed"
                    : ""}
                </span>
                {result.detail ? <small>{result.detail}</small> : null}
              </div>
            ))}
          </div>
        ) : null}
        {testSubmissionMessage ? (
          <p className={styles.testStatus} data-state="success">
            {testSubmissionMessage}
          </p>
        ) : null}
        {testSubmissionError ? (
          <p className={styles.testStatus} data-state="error">
            {testSubmissionError}
          </p>
        ) : null}
      </div>
    </section>
  );

  const manualSubmissionForm = (
    <section className={styles.manualPanel} aria-label="Create manual submission">
      <div className={styles.manualHeader}>
        <div>
          <p className={styles.eyebrow}>Manual entry</p>
          <h2>Create a submission with the real forms</h2>
          <p>
            Use the existing guest forms. Manual admin submissions send the guest
            email and skip the admin notification.
          </p>
        </div>
      </div>
      <label className={styles.manualField}>
        <span>Submission form</span>
        <select
          className={styles.filterSelect}
          value={manualSubmissionType}
          onChange={(event) =>
            setManualSubmissionType(
              event.target.value as Exclude<TestSubmissionType, "all">
            )
          }
        >
          <option value="booking">Booking</option>
          <option value="contact">Contact</option>
          <option value="extra-services">Extra services</option>
          <option value="checkin">Check-in / check-out</option>
        </select>
      </label>
      <div className={styles.manualEmbeddedForm}>
        {manualSubmissionType === "booking" ? (
          <ContactForm
            key="manual-booking"
            lang="en"
            variant="booking"
            adminManual
            getRequestHeaders={adminAuthHeaders}
          />
        ) : null}
        {manualSubmissionType === "contact" ? (
          <ContactForm
            key="manual-contact"
            lang="en"
            variant="contact"
            adminManual
            getRequestHeaders={adminAuthHeaders}
          />
        ) : null}
        {manualSubmissionType === "extra-services" ? (
          <ExtraServices
            key="manual-extra-services"
            lang="en"
            adminManual
            getRequestHeaders={adminAuthHeaders}
          />
        ) : null}
        {manualSubmissionType === "checkin" || manualSubmissionType === "checkout" ? (
          <CheckInOut
            key="manual-checkin"
            adminManual
            getRequestHeaders={adminAuthHeaders}
            forceMobile
            langOverride="en"
          />
        ) : null}
      </div>
    </section>
  );

  if (!DASHBOARD_AUTH_DISABLED && !isFirebaseClientConfigured()) {
    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <Helmet>
          <title>Admin dashboard | Fyrrehaven 61</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div className={styles.page}>
          <div className={styles.shell}>
            <div className={styles.configCard}>
              <p className={styles.eyebrow}>Admin dashboard</p>
              <h1>Firebase is still missing in the frontend</h1>
              <p>
                The code is ready, but the dashboard cannot start until the
                public Firebase values are present in the environment variables.
              </p>
              <ul className={styles.hintList}>
                <li>VITE_FIREBASE_API_KEY</li>
                <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                <li>VITE_FIREBASE_PROJECT_ID</li>
                <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                <li>VITE_FIREBASE_APP_ID</li>
              </ul>
            </div>
          </div>
        </div>
      </Theme>
    );
  }

  if (!authReady) {
    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <div className={styles.page}>
          <div className={styles.shell}>
            <div className={styles.emptyState}>
              <p className={styles.eyebrow}>Admin dashboard</p>
              <h1>Starting dashboard...</h1>
            </div>
          </div>
        </div>
      </Theme>
    );
  }

  if (!DASHBOARD_AUTH_DISABLED && !user) {
    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <Helmet>
          <title>Admin dashboard | Fyrrehaven 61</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div className={styles.page}>
          <div className={styles.shell}>
            <div className={styles.authCard}>
              <p className={styles.eyebrow}>Admin dashboard</p>
              <h1>Sign in to view submissions</h1>
              <p>
                We use Firebase login to protect the dashboard. Only approved
                admin emails can access stored submissions.
              </p>
              <button className={styles.button} onClick={handleSignIn}>
                Sign in with Google
              </button>
              {error ? <p className={styles.detailMuted}>{error}</p> : null}
            </div>
          </div>
        </div>
      </Theme>
    );
  }

  if (isTestSubmissionsPage) {
    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <Helmet>
          <title>Test submissions | Fyrrehaven 61 admin</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div className={styles.page}>
          <div className={styles.shell}>
            {renderAdminHeader("Test submissions", "test")}

            {testSubmissionTool}
          </div>
        </div>
      </Theme>
    );
  }

  if (isQrCodesPage) {
    const isProbablyUrl = /^https?:\/\//i.test(qrEncodedValue.trim());
    const qrTotals = qrStats?.totals;

    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <Helmet>
          <title>QR codes | Fyrrehaven 61 admin</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div className={styles.page}>
          <div className={styles.shell}>
            {renderAdminHeader(
              "QR codes",
              "qr",
              "Create print-ready QR codes for guest links, house information and internal materials."
            )}

            <section className={styles.qrPanel} aria-label="Create QR code">
              <div className={styles.qrEditor}>
                <div className={styles.manualHeader}>
                  <h2>Create QR code</h2>
                  <p>
                    Generate a private QR asset in the browser. Tracked codes use
                    Fyrrehaven's own redirect endpoint so scans can be counted.
                  </p>
                </div>

                <div className={styles.qrFormGrid}>
                  <label className={`${styles.manualField} ${styles.manualFull}`}>
                    <span>English guest link</span>
                    <select
                      value={
                        QR_GUEST_LINK_PRESETS.find(
                          (preset) => preset.destination === qrDestination
                        )?.key || ""
                      }
                      onChange={(event) => applyQrGuestPreset(event.target.value)}
                    >
                      <option value="">Custom destination</option>
                      {QR_GUEST_LINK_PRESETS.map((preset) => (
                        <option key={preset.key} value={preset.key}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={`${styles.manualField} ${styles.manualFull}`}>
                    <span>Destination URL or text</span>
                    <textarea
                      value={qrValue}
                      onChange={(event) => {
                        setQrValue(event.target.value);
                        if (qrFrameLinkAuto) setQrFrameLinkText("");
                      }}
                      placeholder="https://fyrrehaven-61.dk/en"
                    />
                  </label>

                  <label className={`${styles.qrToggleField} ${styles.manualFull}`}>
                    <input
                      type="checkbox"
                      checked={qrTracked}
                      onChange={(event) => setQrTracked(event.target.checked)}
                    />
                    <span>
                      Track scans through Fyrrehaven before opening the destination.
                    </span>
                  </label>

                  <label className={`${styles.qrToggleField} ${styles.manualFull}`}>
                    <input
                      type="checkbox"
                      checked={qrFrameEnabled}
                      onChange={(event) => setQrFrameEnabled(event.target.checked)}
                    />
                    <span>Use print frame with bottom text and full link.</span>
                  </label>

                  <label className={styles.manualField}>
                    <span>File label</span>
                    <input
                      value={qrLabel}
                      onChange={(event) => setQrLabel(event.target.value)}
                      placeholder="Fyrrehaven 61"
                    />
                  </label>

                  <label className={styles.manualField}>
                    <span>Size</span>
                    <input
                      type="number"
                      min={240}
                      max={1800}
                      step={40}
                      value={qrSize}
                      onChange={(event) =>
                        setQrSize(
                          Math.min(1800, Math.max(240, Number(event.target.value) || 720))
                        )
                      }
                    />
                  </label>

                  <label className={styles.manualField}>
                    <span>Quiet zone</span>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={qrMargin}
                      onChange={(event) =>
                        setQrMargin(
                          Math.min(8, Math.max(0, Number(event.target.value) || 0))
                        )
                      }
                    />
                  </label>

                  <label className={styles.manualField}>
                    <span>Error correction</span>
                    <select
                      value={qrErrorCorrection}
                      onChange={(event) =>
                        setQrErrorCorrection(
                          event.target.value as QrErrorCorrectionLevel
                        )
                      }
                    >
                      {QR_ERROR_CORRECTION_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.manualField}>
                    <span>Center content</span>
                    <select
                      value={qrOverlayMode}
                      onChange={(event) =>
                        setQrOverlayMode(event.target.value as QrOverlayMode)
                      }
                    >
                      <option value="logo">Fyrrehaven logo</option>
                      <option value="text">Text</option>
                      <option value="image">Custom image</option>
                      <option value="none">None</option>
                    </select>
                  </label>

                  <label className={styles.manualField}>
                    <span>Center background</span>
                    <input
                      type="color"
                      value={qrOverlayBackground}
                      onChange={(event) => setQrOverlayBackground(event.target.value)}
                    />
                  </label>

                  <label className={styles.manualField}>
                    <span>Foreground</span>
                    <input
                      type="color"
                      value={qrForeground}
                      onChange={(event) => setQrForeground(event.target.value)}
                    />
                  </label>

                  <label className={styles.manualField}>
                    <span>Background</span>
                    <input
                      type="color"
                      value={qrBackground}
                      onChange={(event) => setQrBackground(event.target.value)}
                    />
                  </label>

                  <label className={styles.manualField}>
                    <span>Center size</span>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={qrOverlayScale}
                      onChange={(event) =>
                        setQrOverlayScale(Number(event.target.value) || 22)
                      }
                    />
                  </label>

                  {qrOverlayMode === "text" ? (
                    <label className={styles.manualField}>
                      <span>Center text</span>
                      <input
                        value={qrOverlayText}
                        maxLength={8}
                        onChange={(event) => setQrOverlayText(event.target.value)}
                        placeholder="61"
                      />
                    </label>
                  ) : null}

                  {qrOverlayMode === "image" ? (
                    <label className={styles.manualField}>
                      <span>Center image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleQrOverlayUpload(event.target.files?.[0])
                        }
                      />
                    </label>
                  ) : null}

                  {qrFrameEnabled ? (
                    <>
                      <label className={styles.manualField}>
                        <span>Text 1</span>
                        <input
                          value={qrFrameText1}
                          onChange={(event) => setQrFrameText1(event.target.value)}
                          placeholder="Text 1"
                        />
                      </label>
                      <label className={styles.manualField}>
                        <span>Text 2</span>
                        <input
                          value={qrFrameText2}
                          onChange={(event) => setQrFrameText2(event.target.value)}
                          placeholder="Text 2"
                        />
                      </label>
                      <label className={`${styles.manualField} ${styles.manualFull}`}>
                        <span>Full link text</span>
                        <input
                          value={qrFrameDisplayLink}
                          onChange={(event) => {
                            setQrFrameLinkAuto(false);
                            setQrFrameLinkText(event.target.value);
                          }}
                          placeholder="www.booking.fyrrehaven-61.dk/en/check-in-out"
                        />
                      </label>
                      <label className={`${styles.qrToggleField} ${styles.manualFull}`}>
                        <input
                          type="checkbox"
                          checked={qrFrameLinkAuto}
                          onChange={(event) => {
                            setQrFrameLinkAuto(event.target.checked);
                            if (event.target.checked) setQrFrameLinkText("");
                          }}
                        />
                        <span>Update the bottom link automatically from the destination.</span>
                      </label>
                    </>
                  ) : null}
                </div>

                <div className={styles.manualActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={copyQrValue}
                    disabled={!qrValue.trim()}
                  >
                    <FiCopy aria-hidden="true" />
                    {qrCopyStatus || "Copy value"}
                  </button>
                  {isProbablyUrl ? (
                    <a
                      className={styles.ghostButton}
                      href={qrEncodedValue.trim()}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FiLink aria-hidden="true" />
                      Open link
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className={styles.button}
                    onClick={saveQrCode}
                    disabled={!qrDestination}
                  >
                    <FiCheck aria-hidden="true" />
                    {qrSaveStatus || "Save forever"}
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={downloadQrPng}
                    disabled={!qrPng}
                  >
                    <FiDownload aria-hidden="true" />
                    PNG
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={downloadQrSvg}
                    disabled={!qrSvg}
                  >
                    <FiDownload aria-hidden="true" />
                    SVG
                  </button>
                </div>
              </div>

              <aside className={styles.qrPreviewPanel} aria-label="QR preview">
                <div className={styles.qrPreview}>
                  {qrPng ? (
                    <img src={qrPng} alt={`QR code for ${qrLabel || "value"}`} />
                  ) : (
                    <span>{qrError || "QR preview"}</span>
                  )}
                </div>
                <div className={styles.qrPreviewMeta}>
                  <strong>{qrLabel || "Untitled QR code"}</strong>
                  <span>{qrValue.trim() || "No destination entered"}</span>
                  {qrTracked ? <span>Scan URL: {qrEncodedValue}</span> : null}
                  <span>ID: {qrId}</span>
                  {qrError ? <small>{qrError}</small> : null}
                </div>
              </aside>
            </section>

            <section className={styles.statsPanel}>
              <div className={styles.statsPanelHeader}>
                <h2>Saved QR codes</h2>
                <span>{qrStats?.saved.length || 0} saved</span>
              </div>
              <div className={styles.statsTableWrap}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Destination</th>
                      <th>Tracking</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrStats?.saved.length ? (
                      qrStats.saved.map((saved) => (
                        <tr key={saved.id}>
                          <td>{saved.label}</td>
                          <td>{saved.destination}</td>
                          <td>{saved.tracked ? "Enabled" : "Disabled"}</td>
                          <td>
                            {saved.updatedAtMs
                              ? formatDateTime(saved.updatedAtMs)
                              : "Not recorded"}
                          </td>
                          <td>
                            <div className={styles.qrTableActions}>
                              <button
                                type="button"
                                className={styles.ghostButton}
                                onClick={() => loadSavedQrCode(saved)}
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() => deleteSavedQrCode(saved.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>No saved QR codes yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {qrDeleteStatus ? (
                <p className={styles.detailMuted}>{qrDeleteStatus}</p>
              ) : null}
            </section>

            <section className={styles.qrStatsSection} aria-label="QR code statistics">
              <div className={styles.statsToolbar}>
                <div>
                  <p className={styles.eyebrow}>QR scan statistics</p>
                  <h2>Usage by code and time</h2>
                  <p>
                    Counts are based on scans of tracked QR codes. Untracked codes
                    open directly and will not appear in these statistics.
                  </p>
                </div>
                <label className={styles.filterLabel} htmlFor="admin-qr-date-filter">
                  <span>Date range</span>
                  <select
                    id="admin-qr-date-filter"
                    className={styles.filterSelect}
                    value={qrStatsDateFilter}
                    onChange={(event) =>
                      setQrStatsDateFilter(
                        event.target.value as SubmissionDateFilter
                      )
                    }
                  >
                    {ADMIN_DATE_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {qrStatsError ? (
                <div className={styles.emptyState}>
                  <h2>QR statistics could not load</h2>
                  <p>{qrStatsError}</p>
                </div>
              ) : null}

              <section className={styles.statsKpiGrid}>
                {renderStatisticsKpi(
                  "Total scans",
                  isLoadingQrStats ? "..." : qrTotals?.scans || 0,
                  `${qrTotals?.qrCodes || 0} tracked codes used`,
                  <FiGrid aria-hidden="true" />
                )}
                {renderStatisticsKpi(
                  "Unique visitors",
                  isLoadingQrStats ? "..." : qrTotals?.uniqueVisitors || 0,
                  "Based on anonymous visitor hashes",
                  <FiUser aria-hidden="true" />
                )}
                {renderStatisticsKpi(
                  "Last scan",
                  qrTotals?.lastScanMs ? formatDateTime(qrTotals.lastScanMs) : "No scans",
                  "Most recent tracked QR use",
                  <FiClock aria-hidden="true" />
                )}
                {renderStatisticsKpi(
                  "Current code",
                  qrId,
                  qrTracked ? "Tracking enabled" : "Tracking disabled",
                  <FiLink aria-hidden="true" />,
                  qrTracked ? "success" : "neutral"
                )}
              </section>

              <section className={styles.statsPanel}>
                <div className={styles.statsPanelHeader}>
                  <h2>Tracked QR codes</h2>
                  <span>{qrStats?.qrCodes.length || 0} shown</span>
                </div>
                <div className={styles.statsTableWrap}>
                  <table className={styles.statsTable}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Scans</th>
                        <th>Last scan</th>
                        <th>Destination</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qrStats?.qrCodes.length ? (
                        qrStats.qrCodes.map((row) => (
                          <tr key={row.id}>
                            <td>{row.label}</td>
                            <td>{row.scans}</td>
                            <td>{formatDateTime(row.lastScanMs)}</td>
                            <td>{row.destination}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4}>No tracked QR scans in this period yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className={styles.statsGrid}>
                {renderTrafficTrend(
                  qrStats?.daily?.length ? qrStats.daily : qrStats?.hourly,
                  {
                    title: "Scan trend",
                    emptyLabel: "QR scans will appear here after tracked codes are used.",
                  }
                )}
                {renderAnalyticsRows("Devices", qrStats?.devices)}
              </div>

              <div className={styles.statsGrid}>
                {renderAnalyticsRows("Countries", qrStats?.countries)}
                {renderAnalyticsRows("Referrers", qrStats?.referrers)}
              </div>

              <section className={styles.statsPanel}>
                <div className={styles.statsPanelHeader}>
                  <h2>Recent scans</h2>
                  <span>{qrStats?.recent.length || 0} shown</span>
                </div>
                <div className={styles.recentActivity}>
                  {qrStats?.recent.length ? (
                    qrStats.recent.map((scan) => (
                      <div className={styles.recentActivityRow} key={scan.id}>
                        <div>
                          <strong>{scan.label}</strong>
                          <span>
                            {scan.deviceType || "Unknown"} · {scan.country || "Unknown"}
                          </span>
                        </div>
                        <time>{formatDateTime(scan.createdAtMs)}</time>
                      </div>
                    ))
                  ) : (
                    <p className={styles.detailMuted}>Recent scans will appear here.</p>
                  )}
                </div>
              </section>
            </section>
          </div>
        </div>
      </Theme>
    );
  }

  if (isManualSubmissionPage) {
    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <Helmet>
          <title>Manual submission | Fyrrehaven 61 admin</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div className={styles.page}>
          <div className={styles.shell}>
            {renderAdminHeader("Manual submission", "manual")}

            {manualSubmissionForm}
          </div>
        </div>
      </Theme>
    );
  }

  if (isStatisticsPage) {
    if (isLoadingSubmissions && !hasLoadedSubmissions) {
      return (
        <Theme appearance={appearance} accentColor="gray" radius="large">
          <div className={styles.page}>
            <div className={styles.shell}>
              <div className={styles.loadingState}>
                <span className={styles.loader} aria-hidden="true" />
                <div>
                  <p className={styles.eyebrow}>Statistics</p>
                  <h1>Loading statistics...</h1>
                  <p>Fetching submissions once so the overview can be calculated.</p>
                </div>
              </div>
            </div>
          </div>
        </Theme>
      );
    }

    return renderStatisticsPage();
  }

  if (isLoadingSubmissions && !hasLoadedSubmissions) {
    return (
      <Theme appearance={appearance} accentColor="gray" radius="large">
        <Helmet>
          <title>Admin dashboard | Fyrrehaven 61</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div className={styles.page}>
          <div className={styles.shell}>
            <div className={styles.loadingState}>
              <span className={styles.loader} aria-hidden="true" />
              <div>
                <p className={styles.eyebrow}>Admin dashboard</p>
                <h1>Loading submissions...</h1>
                <p>Fetching all submissions once so filtering and navigation stay fast.</p>
              </div>
            </div>
          </div>
        </div>
      </Theme>
    );
  }

  return (
    <Theme appearance={appearance} accentColor="gray" radius="large">
      <Helmet>
        <title>Admin dashboard | Fyrrehaven 61</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <div className={styles.page}>
        <div className={styles.shell}>
          {renderAdminHeader("Forms dashboard", "submissions")}

          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardLabelRow}>
                <FiInbox
                  aria-hidden="true"
                  className={`${styles.cardIcon} ${styles.cardIconTotal}`}
                />
                <p className={styles.cardLabel}>Total submissions</p>
              </div>
              <p className={styles.cardValue}>{filteredDashboardStats.total}</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabelRow}>
                <FiCheckCircle
                  aria-hidden="true"
                  className={`${styles.cardIcon} ${styles.cardIconSent}`}
                />
                <p className={styles.cardLabel}>Email sent</p>
              </div>
              <p className={styles.cardValue}>{sentCount}</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabelRow}>
                <FiAlertCircle
                  aria-hidden="true"
                  className={`${styles.cardIcon} ${styles.cardIconFailed}`}
                />
                <p className={styles.cardLabel}>Email failed</p>
              </div>
              <p className={styles.cardValue}>{failedCount}</p>
            </div>
            <div className={`${styles.card} ${styles.cardLatest}`}>
              <div className={styles.cardLabelRow}>
                <FiInbox
                  aria-hidden="true"
                  className={`${styles.cardIcon} ${styles.cardIconLatest}`}
                />
                <p className={styles.cardLabel}>Latest submission</p>
              </div>
              <p className={`${styles.cardValue} ${styles.cardValueLatest}`}>
                {formatDateTime(filteredDashboardStats.latestAtMs)}
              </p>
            </div>
          </div>

          {error ? (
            <div className={styles.emptyState}>
              <h2>The dashboard could not load data</h2>
              <p>{error}</p>
            </div>
          ) : null}

          {!error ? (
            <div className={styles.layout}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderTop}>
                    <div>
                      <h2>Submissions</h2>
                      <p>All website forms, sorted by newest first.</p>
                    </div>
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel} htmlFor="admin-submission-filter">
                        <span>Filter</span>
                        <select
                          id="admin-submission-filter"
                          className={styles.filterSelect}
                          value={submissionFilter}
                          onChange={(event) =>
                            setSubmissionFilter(event.target.value as SubmissionFilter)
                          }
                        >
                          <option value="all">All</option>
                          <option value="booking">Bookings</option>
                          <option value="contact">Contacts</option>
                          <option value="extra-services">Extra services</option>
                          <option value="guest-checkin">Check-in / check-out</option>
                        </select>
                      </label>
                      <label className={styles.filterLabel} htmlFor="admin-date-filter">
                        <span>Date</span>
                        <select
                          id="admin-date-filter"
                          className={styles.filterSelect}
                          value={dateFilter}
                          onChange={(event) =>
                            setDateFilter(event.target.value as SubmissionDateFilter)
                          }
                        >
                          {ADMIN_DATE_FILTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
                <div className={styles.list} onScroll={handleSubmissionListScroll}>
                  {visibleGroups.length === 0 ? (
                    <div className={styles.emptyState}>
                      <h2>No submissions found</h2>
                      <p>
                        Try a different filter, or wait for the next form submission.
                      </p>
                    </div>
                  ) : (
                    <>
                    {renderedGroups.map((group) => {
                      const submission = group.primary;
                      const groupContextTag = submissionContextTag(submission);
                      const groupValue = submissionValue(submission);
                      const groupTypeLabel =
                        group.labels.length > 1
                          ? group.labels.join(" • ")
                          : group.labels[0] || submissionLabel(submission);

                      return (
                      <article
                        key={group.id}
                        className={styles.rowCard}
                        data-active={selectedGroup?.id === group.id}
                      >
                        <div className={styles.rowCardHeader}>
                          <div
                            className={styles.rowButton}
                            role="button"
                            tabIndex={0}
                            onClick={() => openSubmissionDetail(group.id, "overview")}
                            onKeyDown={(event) => {
                              if (!isActivationKey(event)) return;
                              event.preventDefault();
                              openSubmissionDetail(group.id, "overview");
                            }}
                          >
                            <div className={styles.rowTop}>
                              <div>
                                <p className={styles.rowName}>
                                  <span>
                                    {displayNameWithCountry(submission) ||
                                      "Unknown name"}
                                  </span>
                                  <span className={styles.rowBookingNumber}>
                                    #{group.bookingNumber}
                                  </span>
                                </p>
                                <div className={styles.rowEmail}>
                                  {submission.email || "—"}
                                </div>
                              </div>
                              <div className={styles.rowTopActions}>
                                <span className={`${styles.badge} ${statusClassName(submission.status)}`}>
                                  {statusLabel(submission.status)}
                                </span>
                              </div>
                            </div>
                            <div className={styles.rowMeta}>
                              <span>{groupTypeLabel}</span>
                              <span>{formatDateTime(submission.createdAtMs)}</span>
                            </div>
                            {groupContextTag || groupValue || group.items.length > 1 ? (
                              <div className={styles.badgeRow}>
                                {groupContextTag ? (
                                  <span className={styles.badge}>
                                    {groupContextTag}
                                  </span>
                                ) : null}
                                {groupValue ? (
                                  <span className={styles.badge}>
                                    {groupValue}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={`Delete ${group.items.length} submission${
                              group.items.length === 1 ? "" : "s"
                            } from ${submission.name || submission.email || "unknown sender"}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteDialog(group);
                            }}
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                      );
                    })}
                    {hasMoreVisibleGroups ? (
                      <div className={styles.listLoading}>
                        <span className={styles.loaderSmall} aria-hidden="true" />
                        <span>
                          Loading more submissions in the background...
                        </span>
                      </div>
                    ) : null}
                    </>
                  )}
                </div>
              </section>

              {!isMobileLayout ? (
                <aside className={styles.detailCard}>
                  {selectedSubmission && detailSubmission ? (
                    <div className={styles.detailScroll}>
                      {selectedGroup ? (
                        <section className={styles.detailSection}>
                          <h3>Submission views</h3>
                          {renderGroupDetailSwitcher(selectedGroup)}
                        </section>
                      ) : null}
                      {renderSubmissionDetailContent(detailSubmission)}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <h2>Select a submission</h2>
                      <p>Details will appear here as soon as you choose a row from the list.</p>
                    </div>
                  )}
                </aside>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isMobileLayout && selectedSubmission && detailSubmission && !deleteTarget ? (
        <div
          className={styles.mobileDetailOverlay}
          role="presentation"
          onClick={closeMobileDetail}
        >
          <div
            className={styles.mobileDetailCard}
            role="dialog"
            aria-modal="true"
            aria-label={`Submission details for ${displayNameWithCountry(selectedSubmission)}`}
            onClick={(event) => event.stopPropagation()}
            data-dragging={isDraggingMobileDetail ? "true" : undefined}
            style={
              {
                "--mobile-detail-drag-y": `${mobileDetailDragOffset}px`,
              } as React.CSSProperties
            }
          >
            <button
              type="button"
              className={styles.modalSheetHandle}
              aria-label="Drag down to close"
              onPointerDown={startMobileDetailDrag}
            >
              <span />
            </button>
            <div className={styles.mobileDetailScroll}>
              {selectedGroup ? (
                <section className={styles.detailSection}>
                  <h3>Submission views</h3>
                  {renderGroupDetailSwitcher(selectedGroup)}
                </section>
              ) : null}
              {renderSubmissionDetailContent(detailSubmission)}
            </div>
          </div>
        </div>
      ) : null}

      {imagePreview
        ? (() => {
            const attachments = imagePreviewAttachments(imagePreview);
            const hasMultipleImages = attachments.length > 1;
            const selectedMeter = meterDraftKey || null;
            const currentReading = selectedMeter
              ? currentMeterReading(imagePreview.submission, selectedMeter)
              : "";
            const correction = selectedMeter
              ? meterCorrection(imagePreview.submission, selectedMeter)
              : null;
            const originalValue = correction?.originalValue || currentReading || "";
            const originalNumber = parseMeterNumber(originalValue);
            const draftNumber = parseMeterNumber(meterDraftValue);
            const difference =
              originalNumber != null && draftNumber != null
                ? draftNumber - originalNumber
                : correction?.difference ?? null;
            const differenceClass =
              difference == null || difference === 0
                ? styles.meterDifferenceNeutral
                : difference > 0
                  ? styles.meterDifferencePositive
                  : styles.meterDifferenceNegative;

            return (
              <div
                className={styles.imagePreviewOverlay}
                role="presentation"
                onClick={() => setImagePreview(null)}
              >
                <div
                  className={styles.imagePreviewCard}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Meter image ${imagePreview.index + 1}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.imagePreviewHeader}>
                    <div>
                      <p className={styles.eyebrow}>Check-in/out image</p>
                      <h2>{imagePreview.attachment.filename || "Meter image"}</h2>
                    </div>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => setImagePreview(null)}
                    >
                      Close
                    </button>
                  </div>
                  <div className={styles.imagePreviewBody}>
                    {imageSource(imagePreview.attachment) ? (
                      <div className={styles.imagePreviewImageWrap}>
                        {hasMultipleImages ? (
                          <button
                            type="button"
                            className={`${styles.imagePreviewArrow} ${styles.imagePreviewArrowLeft}`}
                            aria-label="Previous image"
                            onClick={() => switchPreviewImage(-1)}
                          >
                            <FiChevronLeft aria-hidden="true" />
                          </button>
                        ) : null}
                        <img
                          className={styles.imagePreviewImage}
                          src={imageSource(imagePreview.attachment) || ""}
                          alt={imagePreview.attachment.filename || "Meter image"}
                        />
                        {hasMultipleImages ? (
                          <button
                            type="button"
                            className={`${styles.imagePreviewArrow} ${styles.imagePreviewArrowRight}`}
                            aria-label="Next image"
                            onClick={() => switchPreviewImage(1)}
                          >
                            <FiChevronRight aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className={styles.imagePreviewMissing}>
                        <FiAlertCircle aria-hidden="true" />
                        <div>
                          <h3>Image source missing</h3>
                          <p>
                            {imagePreview.attachment.viewError ||
                              "This submission has the filename and file size, but no stored image URL or Firebase Storage path."}
                          </p>
                          <p>
                            Older submissions may need to be submitted again so the
                            uploaded image can be stored with a retrievable path.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className={styles.imagePreviewMeta}>
                      <div className={styles.imageCounter}>
                        <span>
                          Image {imagePreview.index + 1} of {attachments.length || 1}
                        </span>
                        {imagePreview.attachment.sizeBytes ? (
                          <span>
                            {Math.round(imagePreview.attachment.sizeBytes / 1024)} KB
                          </span>
                        ) : null}
                      </div>

                      <div className={styles.meterCorrectionPanel}>
                        <div className={styles.meterCorrectionTitle}>
                          <FiEdit3 aria-hidden="true" />
                          <div>
                            <h3>Verify meter reading</h3>
                            <p>Keep the guest value and save your corrected value.</p>
                          </div>
                        </div>

                        <label className={styles.meterField}>
                          <span>Meter</span>
                          <select
                            value={meterDraftKey}
                            onChange={(event) => {
                              const nextMeter = event.target.value;
                              if (!isMeterKey(nextMeter)) return;
                              const previewKey = imagePreviewKey(imagePreview);
                              if (previewKey) {
                                setMeterDraftByImage((current) => ({
                                  ...current,
                                  [previewKey]: nextMeter,
                                }));
                              }
                              setMeterDraftKey(nextMeter);
                              setMeterDraftValue(
                                currentMeterReading(imagePreview.submission, nextMeter)
                              );
                              setMeterSaveState("idle");
                              setMeterSaveError(null);
                            }}
                          >
                            <option value="" disabled>
                              Select meter
                            </option>
                            {METER_OPTIONS.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className={styles.meterReadingCard}>
                          <span className={styles.meterReadingIcon}>
                            {selectedMeter ? (
                              meterIcon(selectedMeter)
                            ) : (
                              <FiEdit3 aria-hidden="true" />
                            )}
                          </span>
                          <div>
                            <span>Guest input</span>
                            <strong>{originalValue || "No guest value"}</strong>
                          </div>
                        </div>

                        <label className={styles.meterField}>
                          <span>Correct amount</span>
                          <input
                            value={meterDraftValue}
                            inputMode="decimal"
                            placeholder="Enter corrected reading"
                            onChange={(event) => {
                              setMeterDraftValue(event.target.value);
                              setMeterSaveState("idle");
                              setMeterSaveError(null);
                            }}
                          />
                        </label>

                        <div className={`${styles.meterDifference} ${differenceClass}`}>
                          <span>Difference</span>
                          <strong>{formatMeterDifference(difference)}</strong>
                        </div>

                        {meterSaveError ? (
                          <div className={styles.meterCorrectionError}>
                            <FiAlertCircle aria-hidden="true" />
                            <span>{meterSaveError}</span>
                          </div>
                        ) : null}

                        <div
                          className={styles.meterAutosaveStatus}
                          data-state={meterSaveState}
                          aria-live="polite"
                        >
                          {meterSaveState === "saved" ? (
                            <FiCheck aria-hidden="true" />
                          ) : meterSaveState === "error" ? (
                            <FiAlertCircle aria-hidden="true" />
                          ) : (
                            <FiEdit3 aria-hidden="true" />
                          )}
                          <span>
                            {meterSaveState === "saving"
                              ? "Saving..."
                              : meterSaveState === "saved"
                                ? "Updated"
                                : meterSaveState === "error"
                                  ? "Not saved"
                                  : "Saves automatically"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        : null}

      {deleteTarget ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => {
            closeDeleteDialog();
          }}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-submission-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.eyebrow}>Delete submissions</p>
            <h2 id="delete-submission-title">
              Remove this dataset?
            </h2>
            <p className={styles.detailMuted}>
              This will delete all {deleteTarget.items.length} related submission
              {deleteTarget.items.length === 1 ? "" : "s"} in this dataset from
              both the dashboard and Firestore.
              Type <strong>delete</strong> to confirm.
            </p>
            <div className={styles.modalSummary}>
              <strong>{deleteTarget.primary.name || "Unknown name"}</strong>
              <span>{deleteTarget.primary.email || "—"}</span>
              <span>#{deleteTarget.bookingNumber}</span>
              <span>
                {deleteTarget.labels.length > 1
                  ? deleteTarget.labels.join(" • ")
                  : deleteTarget.labels[0] || submissionLabel(deleteTarget.primary)}
              </span>
            </div>
            <label
              className={styles.detailLabel}
              htmlFor="admin-delete-confirmation"
            >
              Confirmation
            </label>
            <input
              id="admin-delete-confirmation"
              className={styles.deleteInput}
              type="text"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder='Type "delete"'
              autoComplete="off"
              spellCheck={false}
            />
            {deleteError ? (
              <p className={styles.deleteError}>{deleteError}</p>
            ) : null}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={closeDeleteDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => void handleDeleteSubmission()}
                disabled={
                  deleting ||
                  deleteConfirmation.trim().toLowerCase() !== "delete"
                }
              >
                {deleting
                  ? "Deleting..."
                  : `Delete ${deleteTarget.items.length} submission${
                      deleteTarget.items.length === 1 ? "" : "s"
                    }`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Theme>
  );
}
