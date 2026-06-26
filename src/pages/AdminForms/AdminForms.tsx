import React from "react";
import { Helmet } from "react-helmet-async";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
  FiMoon,
  FiSun,
  FiTrash2,
} from "react-icons/fi";
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
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
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
type SubmissionGroup = {
  id: string;
  primary: Submission;
  items: Submission[];
  labels: string[];
};

const APPEARANCE_STORAGE_KEY = "fyrrehaven-appearance";
const DASHBOARD_AUTH_DISABLED = true;
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

function formatMoney(value?: number | null) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
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
      return submission.checkin?.type === "checkout" ? "Check-out" : "Check-in";
    case "extra-services":
      return "Extra services";
    case "other":
      return "Other";
    default:
      return "Contact";
  }
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
    return `Stay: ${submission.extras.stayDate}`;
  }

  if (submission.checkin?.typeLabel) {
    return submission.checkin.typeLabel;
  }

  return null;
}

function renderSelectionPriceBreakdown(selection?: Submission["selection"] | null) {
  if (!selection) return null;

  const hasBreakdown =
    selection.baseNightsTotalDKK != null ||
    selection.cleaningFeeDKK != null ||
    selection.airbnbServiceFeeSavingsDKK != null;

  if (!hasBreakdown) return null;

  return (
    <div className={styles.priceBreakdown}>
      <div className={styles.priceBreakdownRow}>
        <span>Price (nights)</span>
        <span>{formatMoney(selection.baseNightsTotalDKK ?? null)}</span>
      </div>
      <div className={styles.priceBreakdownRow}>
        <span>Cleaning</span>
        <span>{formatMoney(selection.cleaningFeeDKK ?? null)}</span>
      </div>
      {selection.airbnbServiceFeeSavingsDKK != null ? (
        <div className={styles.priceBreakdownRow}>
          <span>Direct booking discount</span>
          <span>- {formatMoney(selection.airbnbServiceFeeSavingsDKK)}</span>
        </div>
      ) : null}
      <div className={`${styles.priceBreakdownRow} ${styles.priceBreakdownTotal}`}>
        <span>Final total</span>
        <span>
          {formatMoney(
            selection.totalAfterAirbnbDiscountDKK ??
              selection.totalWithCleaningDKK ??
              null
          )}
        </span>
      </div>
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
            <span>{total != null ? formatMoney(total) : "—"}</span>
          </div>
        );
      })}
      <div className={`${styles.priceBreakdownRow} ${styles.priceBreakdownTotal}`}>
        <span>Final total</span>
        <span>{formatMoney(extras.totalDKK ?? null)}</span>
      </div>
    </div>
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
  const value = submission.selection?.start?.trim();
  return value ? value : null;
}

function buildSubmissionGroups(submissions: Submission[]): SubmissionGroup[] {
  if (submissions.length === 0) return [];

  const parent = submissions.map((_, index) => index);

  function find(index: number): number {
    if (parent[index] !== index) {
      parent[index] = find(parent[index]);
    }
    return parent[index];
  }

  function union(a: number, b: number) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  }

  const emailMap = new Map<string, number>();
  const arrivalMap = new Map<string, number>();

  submissions.forEach((submission, index) => {
    const email = normalizeEmail(submission.email);
    const arrival = normalizeArrivalDate(submission);

    if (email) {
      const existing = emailMap.get(email);
      if (existing != null) union(index, existing);
      emailMap.set(email, index);
    }

    if (arrival) {
      const existing = arrivalMap.get(arrival);
      if (existing != null) union(index, existing);
      arrivalMap.set(arrival, index);
    }
  });

  const groups = new Map<number, Submission[]>();

  submissions.forEach((submission, index) => {
    const root = find(index);
    const current = groups.get(root);
    if (current) {
      current.push(submission);
    } else {
      groups.set(root, [submission]);
    }
  });

  return Array.from(groups.values())
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
  const [loading, setLoading] = React.useState(false);
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
  const [linkedPreviewSubmission, setLinkedPreviewSubmission] =
    React.useState<Submission | null>(null);
  const [isMobileLayout, setIsMobileLayout] = React.useState(false);

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
      setAdminEmail("dashboard@fyrrehaven-61.dk");
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
    setLoading(true);
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
      setSelectedId((current) => current ?? nextSubmissions[0]?.id ?? null);
      setAdminEmail(
        data.admin?.email ||
          auth?.currentUser?.email ||
          (DASHBOARD_AUTH_DISABLED ? "dashboard@fyrrehaven-61.dk" : "")
      );
    } catch (nextError) {
      if (LOCAL_DASHBOARD_FALLBACK) {
        setSubmissions([...(localTestSubmissions as unknown as Submission[])]);
        setError(null);
      } else {
        setError(String(nextError instanceof Error ? nextError.message : nextError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setDeleteConfirmation("");
    setDeleteError(null);
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

  React.useEffect(() => {
    if (visibleGroups.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((current) =>
      current && visibleGroups.some((group) => group.id === current)
        ? current
        : visibleGroups[0].id
    );
  }, [visibleGroups]);

  React.useEffect(() => {
    if (
      !isMobileLayout ||
      (!selectedGroup && !linkedPreviewSubmission) ||
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
  }, [deleteTarget, isMobileLayout, linkedPreviewSubmission, selectedGroup]);

  const sentCount = submissions.filter((submission) => submission.status === "sent").length;
  const failedCount = submissions.filter(
    (submission) => submission.status === "mail_failed"
  ).length;

  function closeMobileDetail() {
    setSelectedId(null);
  }

  function closeLinkedPreview() {
    setLinkedPreviewSubmission(null);
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
        code === "auth/internal-error"
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

  function renderLinkedSubmissionRows(items: Submission[]) {
    return (
      <div className={styles.detailList}>
        {items.map((submission) => (
          <button
            type="button"
            className={styles.detailListButton}
            key={submission.id}
            onClick={() => setLinkedPreviewSubmission(submission)}
          >
            <div className={styles.detailListRow}>
              <span>
                {submissionLabel(submission)}
                {submission.name ? ` • ${submission.name}` : ""}
              </span>
              <span>{formatDateTime(submission.createdAtMs)}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  function renderSubmissionDetailContent(submission: Submission) {
    return (
      <>
        <section className={styles.detailSection}>
          <h3>Contact</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email</span>
              <div className={styles.detailValue}>{submission.email || "—"}</div>
              {renderLoggedMeta(submission)}
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone</span>
              <div className={styles.detailValue}>{submission.phone || "—"}</div>
              {renderLoggedMeta(submission)}
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Country</span>
              <div className={styles.detailValue}>
                {submission.country || submission.countryIso || "—"}
              </div>
              {renderLoggedMeta(submission)}
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Submitted</span>
              <div className={styles.detailValue}>{formatDateTime(submission.createdAtMs)}</div>
              {renderLoggedMeta(submission)}
            </div>
          </div>
        </section>

        {submission.selection || submission.guests || submission.stayPurpose ? (
          <section className={styles.detailSection}>
            <h3>Stay</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check-in</span>
                <div className={styles.detailValue}>{submission.selection?.start || "—"}</div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check-out</span>
                <div className={styles.detailValue}>
                  {submission.selection?.endExclusive || "—"}
                </div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nights</span>
                <div className={styles.detailValue}>{submission.selection?.nights ?? "—"}</div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total</span>
                <div className={styles.detailValue}>
                  {formatMoney(
                    submission.selection?.totalAfterAirbnbDiscountDKK ??
                      submission.selection?.totalWithCleaningDKK
                  )}
                </div>
                {renderLoggedMeta(submission)}
                {renderSelectionPriceBreakdown(submission.selection)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Guests</span>
                <div className={styles.detailValue}>{submission.guests?.total ?? "—"}</div>
                {renderLoggedMeta(submission)}
              </div>
            </div>
            {submission.stayPurpose ? (
              <div className={styles.detailList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Purpose</span>
                  <p className={styles.detailMessage}>{submission.stayPurpose}</p>
                  {renderLoggedMeta(submission)}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {submission.extras ? (
          <section className={styles.detailSection}>
            <h3>Extra services</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Stay date</span>
                <div className={styles.detailValue}>{submission.extras.stayDate || "—"}</div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total</span>
                <div className={styles.detailValue}>{formatMoney(submission.extras.totalDKK)}</div>
                {renderLoggedMeta(submission)}
                {renderExtrasPriceBreakdown(submission.extras)}
              </div>
            </div>
            {submission.extras.items?.length ? (
              <div className={styles.detailList}>
                {submission.extras.items.map((item, index) => (
                  <div className={styles.detailListRow} key={`${item.id || "extra"}-${index}`}>
                    <span>{item.label?.en || item.label?.da || item.id || "Extra"}</span>
                    <span>{item.qty || 0} × {formatMoney(item.unitPriceDKK ?? null)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {submission.checkin ? (
          <section className={styles.detailSection}>
            <h3>{submission.checkin.type === "checkout" ? "Check-out" : "Check-in"}</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Type</span>
                <div className={styles.detailValue}>{submission.checkin.typeLabel || "—"}</div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Key code</span>
                <div className={styles.detailValue}>{submission.checkin.keycode || "—"}</div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Electricity</span>
                <div className={styles.detailValue}>
                  {submission.checkin.meterReadings?.electricity || "—"}
                </div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Water (house)</span>
                <div className={styles.detailValue}>
                  {submission.checkin.meterReadings?.waterHouse || "—"}
                </div>
                {renderLoggedMeta(submission)}
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Water (pool)</span>
                <div className={styles.detailValue}>
                  {submission.checkin.meterReadings?.waterPool || "—"}
                </div>
                {renderLoggedMeta(submission)}
              </div>
            </div>
            {submission.checkin.attachments?.length ? (
              <div className={styles.detailList}>
                {submission.checkin.attachments.map((file, index) => (
                  <div className={styles.detailListRow} key={`${file.filename || "file"}-${index}`}>
                    <span>{file.filename || "Attachment"}</span>
                    <span>{file.sizeBytes ? `${Math.round(file.sizeBytes / 1024)} KB` : "—"}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className={styles.detailSection}>
          <h3>Message</h3>
          <p className={styles.detailMessage}>{submission.message || "No message"}</p>
          {renderLoggedMeta(submission)}
        </section>

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
            <div>
              <p className={styles.eyebrow}>Fyrrehaven 61 admin</p>
              <h1>Forms dashboard</h1>
              <p>
                Review every submission here, including the ones where email
                did not make it through. This is our reliable fallback inbox.
              </p>
            </div>
            <div className={styles.heroActions}>
              <div className={styles.detailMuted}>
                {adminEmail || user?.email || "dashboard@fyrrehaven-61.dk"}
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
              <button
                className={styles.ghostButton}
                onClick={() => void fetchSubmissions()}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              {!DASHBOARD_AUTH_DISABLED ? (
                <button className={styles.button} onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              ) : null}
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
            <div className={styles.card}>
              <div className={styles.cardLabelRow}>
                <FiInbox
                  aria-hidden="true"
                  className={`${styles.cardIcon} ${styles.cardIconLatest}`}
                />
                <p className={styles.cardLabel}>Latest submission</p>
              </div>
              <p className={styles.cardValue}>
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
                                  {submission.name || "Unknown name"}
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
                                {group.items.length > 1 ? (
                                  <span className={styles.badge}>
                                    {group.items.length} linked submissions
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
                  {selectedSubmission ? (
                    <div className={styles.detailScroll}>
                      <section className={styles.detailSection}>
                        <h3>{selectedSubmission.name || "Submission"}</h3>
                        <div className={styles.badgeRow}>
                          <span
                            className={`${styles.badge} ${statusClassName(
                              selectedSubmission.status
                            )}`}
                          >
                            {statusLabel(selectedSubmission.status)}
                          </span>
                          <span className={styles.badge}>
                            {submissionLabel(selectedSubmission)}
                          </span>
                          {selectedGroup && selectedGroup.items.length > 1 ? (
                            <span className={styles.badge}>
                              {selectedGroup.items.length} linked submissions
                            </span>
                          ) : null}
                        </div>
                      </section>

                      {selectedGroup && selectedGroup.items.length > 1 ? (
                        <section className={styles.detailSection}>
                          <h3>Linked submissions</h3>
                          {renderLinkedSubmissionRows(selectedGroup.items)}
                        </section>
                      ) : null}
                      {renderSubmissionDetailContent(selectedSubmission)}
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

      {isMobileLayout && selectedSubmission && !deleteTarget ? (
        <div
          className={styles.mobileDetailOverlay}
          role="presentation"
          onClick={closeMobileDetail}
        >
          <div
            className={styles.mobileDetailCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-submission-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.mobileDetailHeader}>
              <div>
                <p className={styles.eyebrow}>Submission details</p>
                <h2 id="mobile-submission-title">
                  {selectedSubmission.name || "Submission"}
                </h2>
              </div>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={closeMobileDetail}
              >
                Close
              </button>
            </div>
            <div className={styles.mobileDetailScroll}>
              <section className={styles.detailSection}>
                <div className={styles.badgeRow}>
                  <span
                    className={`${styles.badge} ${statusClassName(
                      selectedSubmission.status
                    )}`}
                  >
                    {statusLabel(selectedSubmission.status)}
                  </span>
                  <span className={styles.badge}>
                    {submissionLabel(selectedSubmission)}
                  </span>
                  {selectedGroup && selectedGroup.items.length > 1 ? (
                    <span className={styles.badge}>
                      {selectedGroup.items.length} linked submissions
                    </span>
                  ) : null}
                </div>
              </section>

              {selectedGroup && selectedGroup.items.length > 1 ? (
                <section className={styles.detailSection}>
                  <h3>Linked submissions</h3>
                  {renderLinkedSubmissionRows(selectedGroup.items)}
                </section>
              ) : null}
              {renderSubmissionDetailContent(selectedSubmission)}
            </div>
          </div>
        </div>
      ) : null}

      {linkedPreviewSubmission ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={closeLinkedPreview}
        >
          <div
            className={`${styles.modalCard} ${styles.linkedModalCard}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="linked-submission-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.mobileDetailHeader}>
              <div>
                <p className={styles.eyebrow}>Linked submission</p>
                <h2 id="linked-submission-title">
                  {linkedPreviewSubmission.name ||
                    submissionLabel(linkedPreviewSubmission)}
                </h2>
              </div>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={closeLinkedPreview}
              >
                Close
              </button>
            </div>
            <div className={styles.linkedModalScroll}>
              <section className={styles.detailSection}>
                <div className={styles.badgeRow}>
                  <span
                    className={`${styles.badge} ${statusClassName(
                      linkedPreviewSubmission.status
                    )}`}
                  >
                    {statusLabel(linkedPreviewSubmission.status)}
                  </span>
                  <span className={styles.badge}>
                    {submissionLabel(linkedPreviewSubmission)}
                  </span>
                </div>
              </section>
              {renderSubmissionDetailContent(linkedPreviewSubmission)}
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
