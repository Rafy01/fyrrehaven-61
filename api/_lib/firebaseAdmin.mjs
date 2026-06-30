let firebaseAdminInitError = null;
let firebaseAdminModulesPromise = null;
let firebaseAdminAppPromise = null;

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

async function loadFirebaseAdminModules() {
  if (!firebaseAdminModulesPromise) {
    firebaseAdminModulesPromise = Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
      import("firebase-admin/firestore"),
      import("firebase-admin/storage"),
    ]);
  }

  const [appModule, authModule, firestoreModule, storageModule] =
    await firebaseAdminModulesPromise;

  return {
    cert: appModule.cert,
    getApps: appModule.getApps,
    initializeApp: appModule.initializeApp,
    getAuth: authModule.getAuth,
    getFirestore: firestoreModule.getFirestore,
    getStorage: storageModule.getStorage,
  };
}

async function getAdminApp() {
  if (!isFirebaseAdminConfigured()) return null;

  if (!firebaseAdminAppPromise) {
    firebaseAdminAppPromise = (async () => {
      try {
        const { cert, getApps, initializeApp } =
          await loadFirebaseAdminModules();
        const existingApps = getApps();
        if (existingApps.length > 0) {
          firebaseAdminInitError = null;
          return existingApps[0];
        }

        firebaseAdminInitError = null;
        return initializeApp({
          credential: cert({
            projectId: readEnv("FIREBASE_PROJECT_ID"),
            clientEmail: readEnv("FIREBASE_CLIENT_EMAIL"),
            privateKey: getPrivateKey(),
          }),
          storageBucket:
            readEnv("FIREBASE_STORAGE_BUCKET") ||
            readEnv("VITE_FIREBASE_STORAGE_BUCKET") ||
            undefined,
        });
      } catch (error) {
        firebaseAdminInitError = String(error?.message || error);
        firebaseAdminAppPromise = null;
        console.error("FIREBASE_ADMIN_INIT_FAILED", error);
        return null;
      }
    })();
  }

  return firebaseAdminAppPromise;
}

export async function getFirestoreDb() {
  const app = await getAdminApp();
  if (!app) return null;

  const { getFirestore } = await loadFirebaseAdminModules();
  return getFirestore(app);
}

export async function getStorageBucket() {
  const app = await getAdminApp();
  if (!app) return null;

  const bucketName =
    readEnv("FIREBASE_STORAGE_BUCKET") ||
    readEnv("VITE_FIREBASE_STORAGE_BUCKET");
  if (!bucketName) return null;

  const { getStorage } = await loadFirebaseAdminModules();
  return getStorage(app).bucket(bucketName);
}

export function getServerTimestamp() {
  return new Date();
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

  const app = await getAdminApp();
  if (!app) {
    return {
      ok: false,
      status: 503,
      error: "FIREBASE_ADMIN_NOT_CONFIGURED",
      detail: firebaseAdminInitError,
    };
  }

  try {
    const { getAuth } = await loadFirebaseAdminModules();
    const auth = getAuth(app);
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
