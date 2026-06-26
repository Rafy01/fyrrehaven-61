import React from "react";
import { Helmet } from "react-helmet-async";
import { FiMoon, FiSun, FiTrash2 } from "react-icons/fi";
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

const APPEARANCE_STORAGE_KEY = "fyrrehaven-appearance";
const DASHBOARD_AUTH_DISABLED = true;

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

function isActivationKey(event: React.KeyboardEvent) {
  return event.key === "Enter" || event.key === " ";
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
      const nextSubmissions = [...(data.submissions || [])].sort(
        (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
      );
      setSubmissions(nextSubmissions);
      setSelectedId((current) => current ?? nextSubmissions[0]?.id ?? null);
      setAdminEmail(
        data.admin?.email ||
          auth?.currentUser?.email ||
          (DASHBOARD_AUTH_DISABLED ? "dashboard@fyrrehaven-61.dk" : "")
      );
    } catch (nextError) {
      setError(String(nextError instanceof Error ? nextError.message : nextError));
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

  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedId) || null;

  const visibleSubmissions = React.useMemo(() => {
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

    return filtered.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  }, [submissionFilter, submissions]);

  const sentCount = submissions.filter((submission) => submission.status === "sent").length;
  const failedCount = submissions.filter(
    (submission) => submission.status === "mail_failed"
  ).length;

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
              <p className={styles.cardLabel}>Total submissions</p>
              <p className={styles.cardValue}>{submissions.length}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Email sent</p>
              <p className={styles.cardValue}>{sentCount}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Email failed</p>
              <p className={styles.cardValue}>{failedCount}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Latest submission</p>
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
                  {visibleSubmissions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <h2>No submissions found</h2>
                      <p>
                        Try a different filter, or wait for the next form submission.
                      </p>
                    </div>
                  ) : (
                    visibleSubmissions.map((submission) => (
                      <article
                        key={submission.id}
                        className={styles.rowCard}
                        data-active={submission.id === selectedId}
                      >
                        <div className={styles.rowCardHeader}>
                          <div
                            className={styles.rowButton}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(submission.id)}
                            onKeyDown={(event) => {
                              if (!isActivationKey(event)) return;
                              event.preventDefault();
                              setSelectedId(submission.id);
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
                              <span>{submissionLabel(submission)}</span>
                              <span>{formatDateTime(submission.createdAtMs)}</span>
                            </div>
                            {submissionContextTag(submission) ||
                            submissionValue(submission) ? (
                              <div className={styles.badgeRow}>
                                {submissionContextTag(submission) ? (
                                  <span className={styles.badge}>
                                    {submissionContextTag(submission)}
                                  </span>
                                ) : null}
                                {submissionValue(submission) ? (
                                  <span className={styles.badge}>
                                    {submissionValue(submission)}
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
                    ))
                  )}
                </div>
              </section>

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
                      </div>
                    </section>

                    <section className={styles.detailSection}>
                      <h3>Contact</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Email</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.email || "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Phone</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.phone || "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Country</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.country ||
                              selectedSubmission.countryIso ||
                              "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Submitted</span>
                          <div className={styles.detailValue}>
                            {formatDateTime(selectedSubmission.createdAtMs)}
                          </div>
                        </div>
                      </div>
                    </section>

                    {selectedSubmission.selection || selectedSubmission.guests || selectedSubmission.stayPurpose ? (
                      <section className={styles.detailSection}>
                        <h3>Stay</h3>
                        <div className={styles.detailGrid}>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Check-in</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.selection?.start || "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Check-out</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.selection?.endExclusive || "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Nights</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.selection?.nights ?? "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Total</span>
                            <div className={styles.detailValue}>
                              {formatMoney(
                                selectedSubmission.selection?.totalAfterAirbnbDiscountDKK ??
                                  selectedSubmission.selection?.totalWithCleaningDKK
                              )}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Guests</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.guests?.total ?? "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Purpose</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.stayPurpose || "—"}
                            </div>
                          </div>
                        </div>
                      </section>
                    ) : null}

                    {selectedSubmission.extras ? (
                      <section className={styles.detailSection}>
                        <h3>Extra services</h3>
                        <div className={styles.detailGrid}>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Stay date</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.extras.stayDate || "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Total</span>
                            <div className={styles.detailValue}>
                              {formatMoney(selectedSubmission.extras.totalDKK)}
                            </div>
                          </div>
                        </div>
                        {selectedSubmission.extras.items?.length ? (
                          <div className={styles.detailList}>
                            {selectedSubmission.extras.items.map((item, index) => (
                              <div className={styles.detailListRow} key={`${item.id || "extra"}-${index}`}>
                                <span>{item.label?.en || item.label?.da || item.id || "Extra"}</span>
                                <span>
                                  {item.qty || 0} × {formatMoney(item.unitPriceDKK ?? null)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </section>
                    ) : null}

                    {selectedSubmission.checkin ? (
                      <section className={styles.detailSection}>
                        <h3>{selectedSubmission.checkin.type === "checkout" ? "Check-out" : "Check-in"}</h3>
                        <div className={styles.detailGrid}>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Type</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.checkin.typeLabel || "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Key code</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.checkin.keycode || "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Electricity</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.checkin.meterReadings?.electricity || "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Water (house)</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.checkin.meterReadings?.waterHouse || "—"}
                            </div>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Water (pool)</span>
                            <div className={styles.detailValue}>
                              {selectedSubmission.checkin.meterReadings?.waterPool || "—"}
                            </div>
                          </div>
                        </div>
                        {selectedSubmission.checkin.attachments?.length ? (
                          <div className={styles.detailList}>
                            {selectedSubmission.checkin.attachments.map((file, index) => (
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
                      <p className={styles.detailMessage}>
                        {selectedSubmission.message || "No message"}
                      </p>
                    </section>

                    {selectedSubmission.mailError ? (
                      <section className={styles.detailSection}>
                        <h3>Email error</h3>
                        <p className={styles.detailMessage}>
                          {selectedSubmission.mailError}
                        </p>
                      </section>
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <h2>Select a submission</h2>
                    <p>Details will appear here as soon as you choose a row from the list.</p>
                  </div>
                )}
              </aside>
            </div>
          ) : null}
        </div>
      </div>

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
