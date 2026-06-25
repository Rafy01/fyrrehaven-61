import { getFirestoreDb, verifyAdminRequest } from "../_lib/firebaseAdmin.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET");

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const adminCheck = await verifyAdminRequest(req);
  if (!adminCheck.ok) {
    sendJson(res, adminCheck.status, {
      ok: false,
      error: adminCheck.error,
      detail: adminCheck.detail || null,
    });
    return;
  }

  const db = getFirestoreDb();
  if (!db) {
    sendJson(res, 503, {
      ok: false,
      error: "FIREBASE_ADMIN_NOT_CONFIGURED",
    });
    return;
  }

  try {
    const snapshot = await db
      .collection("contactSubmissions")
      .orderBy("createdAtMs", "desc")
      .limit(250)
      .get();

    const submissions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });

    sendJson(res, 200, {
      ok: true,
      submissions,
      admin: {
        email: adminCheck.email,
      },
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "FIRESTORE_READ_FAILED",
      detail: String(error?.message || error),
    });
  }
}
