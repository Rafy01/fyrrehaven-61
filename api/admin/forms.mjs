import {
  getFirestoreDb,
  getFirebaseAdminInitError,
  getStorageBucket,
  verifyAdminRequest,
} from "../_lib/firebaseAdmin.mjs";
import {
  deleteFormSubmission,
  listFormSubmissions,
} from "../_lib/formSubmissions.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";

const DASHBOARD_AUTH_DISABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.DASHBOARD_AUTH_DISABLED === "true";

async function addAttachmentViewUrls(submissions) {
  const bucket = await getStorageBucket();
  if (!bucket) return submissions;

  const expiresAt = Date.now() + 15 * 60 * 1000;

  return Promise.all(
    submissions.map(async (submission) => {
      const attachments = submission?.checkin?.attachments;
      if (!Array.isArray(attachments) || attachments.length === 0) {
        return submission;
      }

      const nextAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          if (!attachment?.storagePath) return attachment;

          try {
            const [viewUrl] = await bucket.file(attachment.storagePath).getSignedUrl({
              action: "read",
              expires: expiresAt,
            });

            return {
              ...attachment,
              viewUrl,
            };
          } catch (error) {
            console.error("CHECKIN_IMAGE_SIGNED_URL_FAILED", {
              submissionId: submission.id,
              storagePath: attachment.storagePath,
              error: String(error?.message || error),
            });
            return attachment;
          }
        })
      );

      return {
        ...submission,
        checkin: {
          ...submission.checkin,
          attachments: nextAttachments,
        },
      };
    })
  );
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET, DELETE");

  if (req.method !== "GET" && req.method !== "DELETE") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  let adminEmail = "local@fyrrehaven-61.dk";
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

    const submissions = await addAttachmentViewUrls(
      await listFormSubmissions(db, 250)
    );

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
