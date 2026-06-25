import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const readEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
};

export function isFirebaseAdminConfigured() {
  return Boolean(
    readEnv("FIREBASE_PROJECT_ID") &&
      readEnv("FIREBASE_CLIENT_EMAIL") &&
      readEnv("FIREBASE_PRIVATE_KEY")
  );
}

function getPrivateKey() {
  return readEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function getAdminApp() {
  if (!isFirebaseAdminConfigured()) return null;
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: readEnv("FIREBASE_PROJECT_ID"),
      clientEmail: readEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getPrivateKey(),
    }),
  });
}

export function getFirestoreDb() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getServerTimestamp() {
  return FieldValue.serverTimestamp();
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
