import {
  getFirestoreDb,
  getFirebaseAdminInitError,
  verifyAdminRequest,
} from "../_lib/firebaseAdmin.mjs";
import {
  deleteFormSubmission,
  listFormSubmissions,
} from "../_lib/formSubmissions.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";

const DASHBOARD_AUTH_DISABLED = true;

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET, DELETE");

  if (req.method !== "GET" && req.method !== "DELETE") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  let adminEmail = "dashboard@fyrrehaven-61.dk";
  if (!DASHBOARD_AUTH_DISABLED) {
    const adminCheck = await verifyAdminRequest(req);
    if (!adminCheck.ok) {
      sendJson(res, adminCheck.status, {
        ok: false,
        error: adminCheck.error,
        detail: adminCheck.detail || null,
      });
      return;
    }
    adminEmail = adminCheck.email;
  }

  const db = await getFirestoreDb();
  if (!db) {
    sendJson(res, 503, {
      ok: false,
      error: "FIREBASE_ADMIN_NOT_CONFIGURED",
      detail:
        getFirebaseAdminInitError() ||
        "Firebase server credentials are missing or invalid.",
    });
    return;
  }

  try {
    if (req.method === "DELETE") {
      const submissionId =
        String(req.query?.id || req.body?.id || "").trim();
      const confirmation =
        String(req.body?.confirmation || "").trim().toLowerCase();

      if (!submissionId) {
        sendJson(res, 400, {
          ok: false,
          error: "SUBMISSION_ID_REQUIRED",
          detail: "Missing submission id.",
        });
        return;
      }

      if (confirmation !== "delete") {
        sendJson(res, 400, {
          ok: false,
          error: "DELETE_CONFIRMATION_REQUIRED",
          detail: 'Type "delete" to confirm removal.',
        });
        return;
      }

      const deleted = await deleteFormSubmission(db, submissionId);
      if (!deleted) {
        sendJson(res, 404, {
          ok: false,
          error: "SUBMISSION_NOT_FOUND",
          detail: "No stored submission matched that id.",
        });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        deleted: true,
        id: submissionId,
      });
      return;
    }

    const submissions = await listFormSubmissions(db, 250);

    sendJson(res, 200, {
      ok: true,
      submissions,
      admin: {
        email: adminEmail,
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
