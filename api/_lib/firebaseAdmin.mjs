import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

let firebaseAdminInitError = null;

const stripWrappingQuotes = (value) => {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const readEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" && value.trim()
    ? stripWrappingQuotes(value)
    : "";
};

export function isFirebaseAdminConfigured() {
  return Boolean(
    readEnv("FIREBASE_PROJECT_ID") &&
      readEnv("FIREBASE_CLIENT_EMAIL") &&
      readEnv("FIREBASE_PRIVATE_KEY")
  );
}

function getPrivateKey() {
  return readEnv("FIREBASE_PRIVATE_KEY")
    .replace(/\\n/g, "\n")
    .trim();
}

function getAdminApp() {
  if (!isFirebaseAdminConfigured()) return null;
  if (getApps().length > 0) return getApps()[0];

  try {
    firebaseAdminInitError = null;
    return initializeApp({
      credential: cert({
        projectId: readEnv("FIREBASE_PROJECT_ID"),
        clientEmail: readEnv("FIREBASE_CLIENT_EMAIL"),
        privateKey: getPrivateKey(),
      }),
    });
  } catch (error) {
    firebaseAdminInitError = String(error?.message || error);
    console.error("FIREBASE_ADMIN_INIT_FAILED", error);
    return null;
  }
}

export function getFirestoreDb() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getServerTimestamp() {
  return FieldValue.serverTimestamp();
}

export function getFirebaseAdminInitError() {
  return firebaseAdminInitError;
}

export function getAllowedAdminEmails() {
  return readEnv("FIREBASE_ALLOWED_ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyAdminRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "MISSING_AUTH_TOKEN" };
  }

  const auth = (() => {
    const app = getAdminApp();
    return app ? getAuth(app) : null;
  })();

  if (!auth) {
    return { ok: false, status: 503, error: "FIREBASE_ADMIN_NOT_CONFIGURED" };
  }

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const decoded = await auth.verifyIdToken(token);
    const email = String(decoded.email || "").toLowerCase();
    const allowlist = getAllowedAdminEmails();

    if (!email || !decoded.email_verified) {
      return { ok: false, status: 403, error: "ADMIN_EMAIL_NOT_VERIFIED" };
    }

    if (allowlist.length > 0 && !allowlist.includes(email)) {
      return { ok: false, status: 403, error: "ADMIN_EMAIL_NOT_ALLOWED" };
    }

    return {
      ok: true,
      email,
      uid: decoded.uid,
      decoded,
    };
  } catch (error) {
    return {
      ok: false,
      status: 401,
      error: "INVALID_AUTH_TOKEN",
      detail: String(error?.message || error),
    };
  }
}
