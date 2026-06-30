import React from "react";
import { Helmet } from "react-helmet-async";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
  FiLogOut,
  FiMail,
  FiMoon,
  FiPhone,
  FiSun,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { Theme } from "@radix-ui/themes";

import styles from "./AdminForms.module.css";
import { localTestSubmissions } from "./localTestSubmissions";
import {
  createAdminAuthProvider,
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "../../lib/firebase";

type SubmissionStatus = "pending" | "sent" | "mail_failed";

type Submission = {
  id: string;
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
    keycode?: string | null;
    meterReadings?: {
      electricity?: string | null;
      waterHouse?: string | null;
      waterPool?: string | null;
    } | null;
    attachments?: Array<{
      fieldname?: string;
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
      storagePath?: string;
      viewUrl?: string;
      dataUrl?: string;
    }> | null;
  } | null;
  status?: SubmissionStatus;
  mailStatus?: "pending" | "sent" | "failed";
  mailError?: string | null;
  mailErrorCode?: string | null;
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
  admin?: { email?: string };
  deleted?: boolean;
  id?: string;
};

type Appearance = "light" | "dark";
type SubmissionFilter = "all" | "booking" | "contact" | "extra-services" | "guest-checkin";
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
};

const APPEARANCE_STORAGE_KEY = "fyrrehaven-appearance";
const DASHBOARD_AUTH_DISABLED = import.meta.env.DEV;
const CHECKIN_GROUP_DETAIL = "guest-checkin";
const LOCAL_DASHBOARD_FALLBACK =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

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

        return (
          <div className={styles.priceBreakdownRow} key={`${item.id || "extra-total"}-${index}`}>
            <span>{item.label?.en || item.label?.da || item.id || "Extra"}</span>
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
    submission.selection?.start?.trim() || submission.extras?.stayDate?.trim();
  return value ? value : null;
}

function findOverviewStayDate(group: SubmissionGroup | null, fallback?: Submission | null) {
  const submissions = group?.items?.length ? group.items : fallback ? [fallback] : [];
  const bookingStart = submissions.find((submission) => submission.selection?.start)
    ?.selection?.start;
  const extraStayDate = submissions.find((submission) => submission.extras?.stayDate)
    ?.extras?.stayDate;
  return bookingStart || extraStayDate || null;
}

function findSubmissionWithValue(
  submissions: Submission[],
  getValue: (submission: Submission) => React.ReactNode
) {
  return submissions.find((submission) => hasDisplayValue(getValue(submission))) || null;
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

function findOverviewExtraSubmission(submissions: Submission[]) {
  return (
    submissions.find(
      (submission) => submission.intent === "extra-services" && submission.extras
    ) ||
    submissions.find((submission) => submission.extras) ||
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

      return {
        id: sorted[0].id,
        primary: sorted[0],
        items: sorted,
        labels: Array.from(
          new Set(sorted.map((submission) => submissionLabel(submission)))
        ),
      };
    })
    .sort((a, b) => (b.primary.createdAtMs || 0) - (a.primary.createdAtMs || 0));
}

export default function AdminForms() {
  const [appearance, setAppearance] = React.useState<Appearance>(() =>
    readAppearance()
  );
  const [user, setUser] = React.useState<User | null>(
    DASHBOARD_AUTH_DISABLED ? ({} as User) : null
  );
  const [authReady, setAuthReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adminEmail, setAdminEmail] = React.useState<string>("");
  const [submissionFilter, setSubmissionFilter] =
    React.useState<SubmissionFilter>("all");
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Submission | null>(null);
  const [activeGroupDetail, setActiveGroupDetail] =
    React.useState<GroupDetailSelection>("overview");
  const [activeCheckinDetail, setActiveCheckinDetail] =
    React.useState<CheckinDetailSelection>("checkin");
  const [isMobileLayout, setIsMobileLayout] = React.useState(false);
  const [mobileDetailDragOffset, setMobileDetailDragOffset] = React.useState(0);
  const [isDraggingMobileDetail, setIsDraggingMobileDetail] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<ImagePreview | null>(null);
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
      setSelectedId((current) => {
        if (isMobileLayout) return null;

        if (current && nextSubmissions.some((submission) => submission.id === current)) {
          return current;
        }

        return nextSubmissions[0]?.id ?? null;
      });
      setAdminEmail(
        data.admin?.email ||
          auth?.currentUser?.email ||
          (DASHBOARD_AUTH_DISABLED ? "local@fyrrehaven-61.dk" : "")
      );
    } catch (nextError) {
      if (LOCAL_DASHBOARD_FALLBACK) {
        setSubmissions([...(localTestSubmissions as unknown as Submission[])]);
        setError(null);
      } else {
        setError(String(nextError instanceof Error ? nextError.message : nextError));
      }
    }
  }, [isMobileLayout]);

  React.useEffect(() => {
    setDeleteConfirmation("");
    setDeleteError(null);
    setActiveGroupDetail("overview");
  }, [selectedId]);

  React.useEffect(() => {
    if (!user && !DASHBOARD_AUTH_DISABLED) return;
    void fetchSubmissions();
  }, [user, fetchSubmissions]);

  const visibleGroups = React.useMemo(() => {
    const filtered = submissions.filter((submission) => {
      if (submissionFilter === "all") return true;
      if (submissionFilter === "booking") return submission.intent === "booking";
      if (submissionFilter === "extra-services") {
        return submission.intent === "extra-services";
      }
      if (submissionFilter === "guest-checkin") {
        return submission.intent === "guest-checkin";
      }
      return !submission.intent || submission.intent === "inquiry";
    });

    return buildSubmissionGroups(filtered);
  }, [submissionFilter, submissions]);

  const selectedGroup =
    visibleGroups.find((group) => group.id === selectedId) || null;
  const selectedSubmission = selectedGroup?.primary || null;
  const checkinSubmissions = React.useMemo(
    () => selectedGroup?.items.filter(isCheckinSubmission) || [],
    [selectedGroup]
  );
  const detailSubmission =
    activeGroupDetail === "overview"
      ? selectedSubmission
      : activeGroupDetail === CHECKIN_GROUP_DETAIL
      ? checkinSubmissions.find(
          (submission) => submission.checkin?.type === activeCheckinDetail
        ) ||
        checkinSubmissions[0] ||
        selectedSubmission
      : selectedGroup?.items.find((submission) => submission.id === activeGroupDetail) ||
        selectedSubmission;

  React.useEffect(() => {
    if (!selectedGroup) return;
    if (activeGroupDetail === "overview") return;
    if (
      activeGroupDetail === CHECKIN_GROUP_DETAIL &&
      selectedGroup.items.some(isCheckinSubmission)
    ) {
      return;
    }
    if (selectedGroup.items.some((submission) => submission.id === activeGroupDetail)) return;
    setActiveGroupDetail("overview");
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
    setActiveCheckinDetail(nextType);
  }, [activeCheckinDetail, activeGroupDetail, checkinSubmissions, selectedGroup]);

  React.useEffect(() => {
    if (visibleGroups.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((current) => {
      if (isMobileLayout) return null;

      if (current && visibleGroups.some((group) => group.id === current)) {
        return current;
      }

      return visibleGroups[0].id;
    });
  }, [isMobileLayout, visibleGroups]);

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

  const sentCount = submissions.filter((submission) => submission.status === "sent").length;
  const failedCount = submissions.filter(
    (submission) => submission.status === "mail_failed"
  ).length;

  function closeMobileDetail() {
    mobileDetailDrag.current.active = false;
    mobileDetailDrag.current.pointerId = -1;
    mobileDetailDrag.current.offset = 0;
    mobileDetailDrag.current.velocity = 0;
    setIsDraggingMobileDetail(false);
    setMobileDetailDragOffset(0);
    setSelectedId(null);
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
  }

  function toggleAppearance() {
    setAppearance((current) => (current === "dark" ? "light" : "dark"));
  }

  function renderLoggedMeta(submission?: Submission | null) {
    return <p className={styles.detailMeta}>{loggedLabel(submission)}</p>;
  }

  function renderDetailItem(
    label: string,
    value: React.ReactNode,
    submission: Submission,
    options?: { wide?: boolean; message?: boolean; after?: React.ReactNode }
  ) {
    if (!hasDisplayValue(value) && !options?.after) return null;
    const textValue = typeof value === "string" ? value.trim().replace(/[\r\n]/g, "") : "";
    const emailHref =
      label.toLowerCase() === "email" && textValue ? `mailto:${textValue}` : null;
    const phoneDigits = textValue.replace(/[^\d+]/g, "");
    const normalizedPhone = phoneDigits.startsWith("+")
      ? phoneDigits
      : phoneDigits
        ? `+${phoneDigits}`
        : "";
    const phoneAction =
      label.toLowerCase() === "phone" && normalizedPhone
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

    return (
      <div className={`${styles.detailItem} ${options?.wide ? styles.detailItemWide : ""}`}>
        <span className={styles.detailLabel}>{label}</span>
        {options?.message ? (
          <p className={styles.detailMessage}>{value}</p>
        ) : (
          <div className={styles.detailValueRow}>
            <div className={styles.detailValue}>{value}</div>
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
          </div>
        )}
        {options?.after}
        {renderLoggedMeta(submission)}
      </div>
    );
  }

  function renderGroupDetailSwitcher(group: SubmissionGroup) {
    const regularSubmissions = group.items.filter(
      (submission) => !isCheckinSubmission(submission)
    );
    const hasCheckinSubmissions = group.items.some(isCheckinSubmission);

    return (
      <div className={styles.linkedTabs}>
        <div className={styles.linkedTabList} role="tablist" aria-label="Submission views">
          <button
            type="button"
            className={styles.linkedTab}
            role="tab"
            aria-selected={activeGroupDetail === "overview"}
            onClick={() => setActiveGroupDetail("overview")}
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
              onClick={() => setActiveGroupDetail(submission.id)}
            >
              <span>{submissionTabLabel(submission)}</span>
            </button>
          ))}
          {hasCheckinSubmissions ? (
            <button
              type="button"
              className={styles.linkedTab}
              role="tab"
              aria-selected={activeGroupDetail === CHECKIN_GROUP_DETAIL}
              onClick={() => setActiveGroupDetail(CHECKIN_GROUP_DETAIL)}
            >
              <span>Check-in/out</span>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  function imageSource(
    attachment: ImagePreview["attachment"] | null | undefined
  ) {
    return attachment?.viewUrl || attachment?.dataUrl || null;
  }

  function renderMeterReadingSummary(submission: Submission) {
    const readings = submission.checkin?.meterReadings;
    const items = [
      ["Electricity", readings?.electricity],
      ["Water (house)", readings?.waterHouse],
      ["Water (pool)", readings?.waterPool],
    ].filter(([, value]) => hasDisplayValue(value));

    if (!items.length) return null;

    return (
      <div className={styles.meterVerifyBox}>
        <span>Compare image with submitted readings</span>
        <div>
          {items.map(([label, value]) => (
            <strong key={label}>
              {label}: {value}
            </strong>
          ))}
        </div>
      </div>
    );
  }

  function renderCheckinAttachments(submission: Submission) {
    const attachments = submission.checkin?.attachments || [];
    if (!attachments.length) return null;

    return (
      <div className={styles.attachmentSection}>
        {renderMeterReadingSummary(submission)}
        <div className={styles.attachmentGrid}>
          {attachments.map((file, index) => {
            const src = imageSource(file);
            const label = file.filename || `Meter image ${index + 1}`;

            return (
              <button
                type="button"
                className={styles.attachmentCard}
                key={`${label}-${index}`}
                onClick={() =>
                  src
                    ? setImagePreview({ submission, attachment: file, index })
                    : undefined
                }
                disabled={!src}
              >
                {src ? (
                  <img src={src} alt={label} loading="lazy" />
                ) : (
                  <span className={styles.attachmentPlaceholder}>No preview</span>
                )}
                <span className={styles.attachmentName}>{label}</span>
                {file.sizeBytes ? (
                  <span className={styles.attachmentMeta}>
                    {Math.round(file.sizeBytes / 1024)} KB
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderOverviewContent(group: SubmissionGroup | null, fallback: Submission) {
    const groupItems = group?.items?.length ? group.items : [fallback];
    const emailSource = findOverviewContactSubmission(groupItems, "email");
    const phoneSource = findOverviewContactSubmission(groupItems, "phone");
    const bookingSource = findOverviewBookingSubmission(groupItems);
    const extraSource = findOverviewExtraSubmission(groupItems);
    const staySource =
      bookingSource ||
      findSubmissionWithValue(groupItems, (submission) => submission.extras?.stayDate) ||
      fallback;
    const overviewStayDate = findOverviewStayDate(group, fallback);
    const selectionTotal =
      bookingSource?.selection?.totalAfterAirbnbDiscountDKK ??
      bookingSource?.selection?.totalWithCleaningDKK;

    const contactItems = [
      emailSource ? renderDetailItem("Email", emailSource.email, emailSource) : null,
      phoneSource ? renderDetailItem("Phone", phoneSource.phone, phoneSource) : null,
    ].filter(Boolean);
    const stayDateItems = [
      bookingSource
        ? renderDetailItem(
            "Check-in",
            formatPlainDate(bookingSource.selection?.start),
            bookingSource
          )
        : null,
      bookingSource
        ? renderDetailItem(
            "Check-out",
            formatPlainDate(bookingSource.selection?.endExclusive),
            bookingSource
          )
        : null,
      !bookingSource
        ? renderDetailItem("Stay date", formatPlainDate(overviewStayDate), staySource)
        : null,
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
    const extraTotalItem =
      !bookingSource && extraSource?.extras?.totalDKK != null
        ? renderDetailItem(
            "Extra services total",
            formatMoney(extraSource.extras.totalDKK),
            extraSource,
            {
              wide: true,
              after: renderExtrasPriceBreakdown(extraSource.extras),
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
        bookingTotalItem ||
        extraTotalItem ? (
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
            {bookingTotalItem || extraTotalItem ? (
              <div className={`${styles.detailGrid} ${styles.detailTotalGrid}`}>
                {bookingTotalItem || extraTotalItem}
              </div>
            ) : null}
          </section>
        ) : null}
      </>
    );
  }

  function renderSubmissionDetailContent(submission: Submission) {
    const isOverview =
      activeGroupDetail === "overview" && (selectedGroup?.items.length || 0) > 1;
    if (isOverview) {
      return renderOverviewContent(selectedGroup, submission);
    }

    const overviewStayDate = isOverview
      ? findOverviewStayDate(selectedGroup, submission)
      : null;
    const hasBookingDates = Boolean(
      submission.selection?.start || submission.selection?.endExclusive
    );
    const contactItems = isOverview
      ? [
          renderDetailItem("Email", submission.email, submission),
          renderDetailItem("Phone", submission.phone, submission),
        ].filter(Boolean)
      : [];
    const stayDateItems = [
      renderDetailItem(
        "Check-in",
        formatPlainDate(submission.selection?.start),
        submission
      ),
      renderDetailItem(
        "Check-out",
        formatPlainDate(submission.selection?.endExclusive),
        submission
      ),
      isOverview && !hasBookingDates
        ? renderDetailItem("Stay date", formatPlainDate(overviewStayDate), submission)
        : null,
    ].filter(Boolean);
    const stayCountItems = [
      renderDetailItem("Nights", submission.selection?.nights, submission),
      renderDetailItem(
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
      ),
    ].filter(Boolean);
    const selectionTotal =
      submission.selection?.totalAfterAirbnbDiscountDKK ??
      submission.selection?.totalWithCleaningDKK;
    const stayTotalItem = renderDetailItem(
      "Total",
      selectionTotal != null ? formatMoney(selectionTotal) : null,
      submission,
      {
        wide: true,
        after: renderSelectionPriceBreakdown(submission.selection),
      }
    );
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
      renderDetailItem(
        "Electricity",
        submission.checkin?.meterReadings?.electricity,
        submission
      ),
      renderDetailItem(
        "Water (house)",
        submission.checkin?.meterReadings?.waterHouse,
        submission
      ),
      renderDetailItem(
        "Water (pool)",
        submission.checkin?.meterReadings?.waterPool,
        submission
      ),
    ].filter(Boolean);
    const hasCheckinSection =
      checkinItems.length > 0 || Boolean(submission.checkin?.attachments?.length);
    const checkinTypeOptions = Array.from(
      new Set(
        checkinSubmissions
          .map((item) => item.checkin?.type)
          .filter((type): type is CheckinDetailSelection =>
            type === "checkin" || type === "checkout"
          )
      )
    );

    return (
      <>
        {contactItems.length > 0 ? (
          <section className={styles.detailSection}>
            <h3>Contact</h3>
            <div className={styles.detailGrid}>{contactItems}</div>
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
                        {item.label?.en || item.label?.da || item.id || "Extra"}
                      </span>
                      {typeof item.unitPriceDKK === "number" ? (
                        <span className={styles.servicePrice}>
                          {formatMoney(item.unitPriceDKK)} each
                        </span>
                      ) : null}
                    </div>
                    {typeof item.qty === "number" ? (
                      <span className={styles.serviceQty}>x {item.qty}</span>
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
            {activeGroupDetail === CHECKIN_GROUP_DETAIL &&
            checkinTypeOptions.length > 1 ? (
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
                    onClick={() => setActiveCheckinDetail(type)}
                  >
                    <span>{type === "checkout" ? "Check-out" : "Check-in"}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {checkinItems.length > 0 ? (
              <div className={styles.detailGrid}>{checkinItems}</div>
            ) : null}
            {renderCheckinAttachments(submission)}
          </section>
        ) : null}

        {submission.message ? (
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

      const res = await fetch(`/api/admin/forms?id=${encodeURIComponent(target.id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: target.id,
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
        const next = current.filter(
          (submission) => submission.id !== target.id
        );
        setSelectedId((current) =>
          current === target.id ? next[0]?.id ?? null : current
        );
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

  return (
    <Theme appearance={appearance} accentColor="gray" radius="large">
      <Helmet>
        <title>Admin dashboard | Fyrrehaven 61</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.hero}>
            <div className={styles.heroTop}>
              <div>
                <p className={styles.eyebrow}>Fyrrehaven 61 admin</p>
                <h1>Forms dashboard</h1>
              </div>
              <div className={styles.heroActions}>
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
                    appearance === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                  title={
                    appearance === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                >
                  {appearance === "dark" ? (
                    <FiSun aria-hidden="true" />
                  ) : (
                    <FiMoon aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardLabelRow}>
                <FiInbox
                  aria-hidden="true"
                  className={`${styles.cardIcon} ${styles.cardIconTotal}`}
                />
                <p className={styles.cardLabel}>Total submissions</p>
              </div>
              <p className={styles.cardValue}>{submissions.length}</p>
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
                {formatDateTime(submissions[0]?.createdAtMs)}
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
                  </div>
                </div>
                <div className={styles.list}>
                  {visibleGroups.length === 0 ? (
                    <div className={styles.emptyState}>
                      <h2>No submissions found</h2>
                      <p>
                        Try a different filter, or wait for the next form submission.
                      </p>
                    </div>
                  ) : (
                    visibleGroups.map((group) => {
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
                        data-active={group.id === selectedId}
                      >
                        <div className={styles.rowCardHeader}>
                          <div
                            className={styles.rowButton}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(group.id)}
                            onKeyDown={(event) => {
                              if (!isActivationKey(event)) return;
                              event.preventDefault();
                              setSelectedId(group.id);
                            }}
                          >
                            <div className={styles.rowTop}>
                              <div>
                                <p className={styles.rowName}>
                                  {displayNameWithCountry(submission) || "Unknown name"}
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
                            aria-label={`Delete submission from ${submission.name || submission.email || "unknown sender"}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteError(null);
                              setDeleteConfirmation("");
                              setDeleteTarget(submission);
                            }}
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                      );
                    })
                  )}
                </div>
              </section>

              {!isMobileLayout ? (
                <aside className={styles.detailCard}>
                  {selectedSubmission && detailSubmission ? (
                    <div className={styles.detailScroll}>
                      {selectedGroup && selectedGroup.items.length > 1 ? (
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
              {selectedGroup && selectedGroup.items.length > 1 ? (
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

      {imagePreview ? (
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
                  <img
                    className={styles.imagePreviewImage}
                    src={imageSource(imagePreview.attachment) || ""}
                    alt={imagePreview.attachment.filename || "Meter image"}
                  />
                </div>
              ) : null}
              <div className={styles.imagePreviewMeta}>
                {renderMeterReadingSummary(imagePreview.submission)}
                {imagePreview.attachment.sizeBytes ? (
                  <span>
                    File size: {Math.round(imagePreview.attachment.sizeBytes / 1024)} KB
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => {
            if (deleting) return;
            setDeleteTarget(null);
            setDeleteConfirmation("");
            setDeleteError(null);
          }}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-submission-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.eyebrow}>Delete submission</p>
            <h2 id="delete-submission-title">Remove this submission?</h2>
            <p className={styles.detailMuted}>
              This will delete the submission from both the dashboard and Firestore.
              Type <strong>delete</strong> to confirm.
            </p>
            <div className={styles.modalSummary}>
              <strong>{deleteTarget.name || "Unknown name"}</strong>
              <span>{deleteTarget.email || "—"}</span>
              <span>{submissionLabel(deleteTarget)}</span>
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
              autoFocus
            />
            {deleteError ? (
              <p className={styles.deleteError}>{deleteError}</p>
            ) : null}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => {
                  if (deleting) return;
                  setDeleteTarget(null);
                  setDeleteConfirmation("");
                  setDeleteError(null);
                }}
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
                {deleting ? "Deleting..." : "Delete submission"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Theme>
  );
}
