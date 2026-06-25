import React from "react";
import { Helmet } from "react-helmet-async";
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
};

type Appearance = "light" | "dark";

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
  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status?: SubmissionStatus) {
  switch (status) {
    case "sent":
      return "Mail sendt";
    case "mail_failed":
      return "Mail fejlede";
    default:
      return "Afventer";
  }
}

function submissionLabel(submission: Submission) {
  switch (submission.intent) {
    case "booking":
      return "Booking";
    case "extra-services":
      return "Ekstra services";
    case "other":
      return "Andet";
    default:
      return "Kontakt";
  }
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

export default function AdminForms() {
  const [appearance] = React.useState<Appearance>(() => readAppearance());
  const [user, setUser] = React.useState<User | null>(
    DASHBOARD_AUTH_DISABLED ? ({} as User) : null
  );
  const [authReady, setAuthReady] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adminEmail, setAdminEmail] = React.useState<string>("");

  React.useLayoutEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = appearance;
    html.dataset.appearancePreference = appearance;
    html.style.colorScheme = appearance;
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
      const nextSubmissions = data.submissions || [];
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
    if (!user && !DASHBOARD_AUTH_DISABLED) return;
    void fetchSubmissions();
  }, [user, fetchSubmissions]);

  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedId) || null;

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
          : "Log ind mislykkedes. Proev igen.";
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
              <h1>Firebase mangler stadig i frontenden</h1>
              <p>
                Vi er klar i koden, men dashboardet kan ikke starte, før de
                offentlige Firebase-oplysninger ligger i miljøvariablerne.
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
              <h1>Starter dashboard...</h1>
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
              <h1>Log ind for at se formularerne</h1>
              <p>
                Vi bruger Firebase-login til at beskytte dashboardet. Kun
                godkendte admin-adresser får adgang til de gemte formularer.
              </p>
              <button className={styles.button} onClick={handleSignIn}>
                Log ind med Google
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
              <h1>Formular-dashboard</h1>
              <p>
                Her kan vi følge alle indsendelser, også dem hvor mailen ikke
                kom igennem. Det bliver vores rolige fallback-indbakke.
              </p>
            </div>
            <div className={styles.heroActions}>
              <div className={styles.detailMuted}>
                {adminEmail || user?.email || "dashboard@fyrrehaven-61.dk"}
              </div>
              <button
                className={styles.ghostButton}
                onClick={() => void fetchSubmissions()}
                disabled={loading}
              >
                {loading ? "Opdaterer..." : "Opdater"}
              </button>
              {!DASHBOARD_AUTH_DISABLED ? (
                <button className={styles.button} onClick={() => void handleSignOut()}>
                  Log ud
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.cards}>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Samlet antal</p>
              <p className={styles.cardValue}>{submissions.length}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Mail sendt</p>
              <p className={styles.cardValue}>{sentCount}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Mail fejlet</p>
              <p className={styles.cardValue}>{failedCount}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Seneste indsendelse</p>
              <p className={styles.cardValue}>
                {formatDateTime(submissions[0]?.createdAtMs)}
              </p>
            </div>
          </div>

          {error ? (
            <div className={styles.emptyState}>
              <h2>Dashboardet kunne ikke hente data</h2>
              <p>{error}</p>
            </div>
          ) : null}

          {!error ? (
            <div className={styles.layout}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Indsendelser</h2>
                  <p>Booking, kontakt og direkte foresporgsler gemt fra websitet.</p>
                </div>
                <div className={styles.list}>
                  {submissions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <h2>Ingen indsendelser endnu</h2>
                      <p>
                        Saa snart den forste formular bliver sendt, lander den her.
                      </p>
                    </div>
                  ) : (
                    submissions.map((submission) => (
                      <button
                        key={submission.id}
                        className={styles.rowButton}
                        data-active={submission.id === selectedId}
                        onClick={() => setSelectedId(submission.id)}
                      >
                        <div className={styles.rowTop}>
                          <div>
                            <p className={styles.rowName}>
                              {submission.name || "Ukendt navn"}
                            </p>
                            <div className={styles.rowEmail}>
                              {submission.email || "—"}
                            </div>
                          </div>
                          <span className={`${styles.badge} ${statusClassName(submission.status)}`}>
                            {statusLabel(submission.status)}
                          </span>
                        </div>
                        <div className={styles.rowMeta}>
                          <span>{submissionLabel(submission)}</span>
                          <span>{formatDateTime(submission.createdAtMs)}</span>
                        </div>
                        <div className={styles.badgeRow}>
                          <span className={styles.badge}>
                            {submission.selection?.nights
                              ? `${submission.selection.nights} natter`
                              : "Ingen opholdsdata"}
                          </span>
                          {submission.selection?.totalAfterAirbnbDiscountDKK != null ? (
                            <span className={styles.badge}>
                              {formatMoney(
                                submission.selection.totalAfterAirbnbDiscountDKK
                              )}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <aside className={styles.detailCard}>
                {selectedSubmission ? (
                  <>
                    <section className={styles.detailSection}>
                      <h3>{selectedSubmission.name || "Indsendelse"}</h3>
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
                      <h3>Kontakt</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Email</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.email || "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Telefon</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.phone || "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Land</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.country ||
                              selectedSubmission.countryIso ||
                              "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Indsendt</span>
                          <div className={styles.detailValue}>
                            {formatDateTime(selectedSubmission.createdAtMs)}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className={styles.detailSection}>
                      <h3>Ophold</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Ankomst</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.selection?.start || "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Afrejse</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.selection?.endExclusive || "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Natter</span>
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
                          <span className={styles.detailLabel}>Gaester</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.guests?.total ?? "—"}
                          </div>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Formael</span>
                          <div className={styles.detailValue}>
                            {selectedSubmission.stayPurpose || "—"}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className={styles.detailSection}>
                      <h3>Besked</h3>
                      <p className={styles.detailMessage}>
                        {selectedSubmission.message || "Ingen besked"}
                      </p>
                    </section>

                    {selectedSubmission.mailError ? (
                      <section className={styles.detailSection}>
                        <h3>Mailfejl</h3>
                        <p className={styles.detailMessage}>
                          {selectedSubmission.mailError}
                        </p>
                      </section>
                    ) : null}
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <h2>Vaelg en indsendelse</h2>
                    <p>Vi viser detaljerne her, sa snart du klikker paa en raekke.</p>
                  </div>
                )}
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </Theme>
  );
}
