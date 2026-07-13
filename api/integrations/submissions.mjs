import { getFirestoreDb, getFirebaseAdminInitError } from "../_lib/firebaseAdmin.mjs";
import {
  findFormSubmissionDoc,
  listFormSubmissions,
  updateFormSubmission,
} from "../_lib/formSubmissions.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";
import {
  publicSubmissionPayload,
  verifySubmissionApiRequest,
} from "../_lib/submissionIntegration.mjs";

const MAX_LIMIT = 500;

function numberQuery(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringQuery(value) {
  return String(value || "").trim();
}

function filterSubmissions(submissions, query) {
  const sinceMs = numberQuery(query.sinceMs, null);
  const status = stringQuery(query.status);
  const intent = stringQuery(query.intent);
  const mailStatus = stringQuery(query.mailStatus);

  return submissions.filter((submission) => {
    if (sinceMs != null && Number(submission.createdAtMs || 0) < sinceMs) {
      return false;
    }
    if (status && submission.status !== status) return false;
    if (mailStatus && submission.mailStatus !== mailStatus) return false;
    if (intent && submission.intent !== intent) return false;
    return true;
  });
}

function uniqueIds(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [values])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

function consumerKey(value) {
  return (
    stringQuery(value)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80) || "default"
  );
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET, PATCH");

  if (req.method !== "GET" && req.method !== "PATCH") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const auth = verifySubmissionApiRequest(req);
  if (!auth.ok) {
    sendJson(res, auth.status, {
      ok: false,
      error: auth.error,
      detail: auth.detail || null,
    });
    return;
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
    if (req.method === "PATCH") {
      const ids = uniqueIds(req.body?.ids || req.body?.id);
      const consumer = consumerKey(req.body?.consumer);
      const externalId = stringQuery(req.body?.externalId) || null;

      if (ids.length === 0) {
        sendJson(res, 400, {
          ok: false,
          error: "SUBMISSION_ID_REQUIRED",
          detail: "Send id or ids to mark submissions as synced.",
        });
        return;
      }

      const syncedAtMs = Date.now();
      const results = await Promise.all(
        ids.map(async (id) => {
          const found = await findFormSubmissionDoc(db, id);
          if (!found) return { id, synced: false, missing: true };

          await updateFormSubmission(found.docRef, {
            [`integrationSync.${consumer}`]: {
              syncedAtMs,
              externalId,
            },
          });
          return { id, synced: true, missing: false };
        })
      );

      sendJson(res, 200, {
        ok: true,
        results,
      });
      return;
    }

    const id = stringQuery(req.query?.id);
    if (id) {
      const found = await findFormSubmissionDoc(db, id);
      if (!found) {
        sendJson(res, 404, {
          ok: false,
          error: "SUBMISSION_NOT_FOUND",
          detail: "No stored submission matched that id.",
        });
        return;
      }

      const submission = publicSubmissionPayload({
        id: found.snapshot.id,
        ...found.snapshot.data(),
      });
      if (!submission) {
        sendJson(res, 404, {
          ok: false,
          error: "SUBMISSION_NOT_SHAREABLE",
          detail:
            "This submission is not available to the integration API or has not been approved yet.",
        });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        submission,
      });
      return;
    }

    const limit = Math.min(
      Math.max(1, numberQuery(req.query?.limit, 250)),
      MAX_LIMIT
    );
    const submissions = filterSubmissions(
      await listFormSubmissions(db, limit),
      req.query || {}
    )
      .map(publicSubmissionPayload)
      .filter(Boolean);

    sendJson(res, 200, {
      ok: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "SUBMISSION_INTEGRATION_FAILED",
      detail: String(error?.message || error),
    });
  }
}
