import {
  getFirestoreDb,
  getFirebaseAdminInitError,
  getStorageBucket,
  verifyAdminRequest,
} from "../_lib/firebaseAdmin.mjs";
import {
  FORM_SUBMISSION_FILES_COLLECTION,
  FORM_SUBMISSIONS_COLLECTION,
  LEGACY_CONTACT_SUBMISSIONS_COLLECTION,
  createFormSubmission,
  deleteFormSubmission,
  listFormSubmissions,
  updateFormSubmission,
} from "../_lib/formSubmissions.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";

const DASHBOARD_AUTH_DISABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.DASHBOARD_AUTH_DISABLED === "true";
const METER_FIELDS = new Set(["electricity", "waterHouse", "waterPool"]);
const TEST_SUBMISSION_TYPES = new Set([
  "booking",
  "contact",
  "extra-services",
  "checkin",
  "checkout",
  "all",
]);

const randomBookingNumber = (hasBookingInfo) =>
  `${hasBookingInfo ? "9" : "7"}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

function attachmentStoragePath(attachment) {
  const rawPath =
    attachment?.storagePath ||
    attachment?.fullPath ||
    attachment?.filePath ||
    attachment?.path ||
    attachment?.storageRef ||
    "";
  const path = String(rawPath || "").trim();
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return "";
  return path.replace(/^\/+/, "");
}

function attachmentHasViewSource(attachment) {
  return Boolean(
    attachment?.viewUrl ||
      attachment?.dataUrl ||
      attachment?.downloadUrl ||
      attachment?.publicUrl ||
      attachment?.url ||
      attachment?.src
  );
}

async function attachmentFirestoreDataUrl(db, attachment) {
  const fileId = String(attachment?.firestoreFileId || "").trim();
  if (!db || !fileId) return null;

  const fileRef = db.collection(FORM_SUBMISSION_FILES_COLLECTION).doc(fileId);
  const [fileSnapshot, chunksSnapshot] = await Promise.all([
    fileRef.get(),
    fileRef.collection("chunks").orderBy("index", "asc").get(),
  ]);

  if (!fileSnapshot.exists || chunksSnapshot.empty) {
    return null;
  }

  const contentType =
    attachment?.contentType ||
    fileSnapshot.data()?.contentType ||
    "application/octet-stream";
  const base64 = chunksSnapshot.docs
    .map((doc) => String(doc.data()?.data || ""))
    .join("");

  if (!base64) return null;
  return `data:${contentType};base64,${base64}`;
}

async function addAttachmentViewUrls(submissions, db) {
  const bucket = await getStorageBucket();
  if (!bucket) {
    return Promise.all(
      submissions.map(async (submission) => {
        const attachments = submission?.checkin?.attachments;
        if (!Array.isArray(attachments) || attachments.length === 0) {
          return submission;
        }

        const nextAttachments = await Promise.all(
          attachments.map(async (attachment) => {
            if (attachmentHasViewSource(attachment)) return attachment;

            try {
              const dataUrl = await attachmentFirestoreDataUrl(db, attachment);
              if (dataUrl) {
                return {
                  ...attachment,
                  dataUrl,
                };
              }
            } catch (error) {
              console.error("CHECKIN_IMAGE_FIRESTORE_FALLBACK_FAILED", {
                submissionId: submission.id,
                firestoreFileId: attachment?.firestoreFileId || null,
                error: String(error?.message || error),
              });
            }

            return {
              ...attachment,
              viewError:
                attachment?.viewError ||
                attachment?.uploadError ||
                "Firebase Storage is not configured for the admin API.",
            };
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

  const expiresAt = Date.now() + 15 * 60 * 1000;

  return Promise.all(
    submissions.map(async (submission) => {
      const attachments = submission?.checkin?.attachments;
      if (!Array.isArray(attachments) || attachments.length === 0) {
        return submission;
      }

      const nextAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          if (attachmentHasViewSource(attachment)) return attachment;

          try {
            const dataUrl = await attachmentFirestoreDataUrl(db, attachment);
            if (dataUrl) {
              return {
                ...attachment,
                dataUrl,
              };
            }
          } catch (error) {
            console.error("CHECKIN_IMAGE_FIRESTORE_FALLBACK_FAILED", {
              submissionId: submission.id,
              firestoreFileId: attachment?.firestoreFileId || null,
              error: String(error?.message || error),
            });
          }

          const storagePath = attachmentStoragePath(attachment);
          if (!storagePath) {
            return {
              ...attachment,
              viewError:
                attachment?.viewError ||
                attachment?.uploadError ||
                "This submission has file metadata, but no stored Firebase Storage path.",
            };
          }

          try {
            const [viewUrl] = await bucket.file(storagePath).getSignedUrl({
              action: "read",
              expires: expiresAt,
            });

            return {
              ...attachment,
              storagePath,
              viewUrl,
            };
          } catch (error) {
            console.error("CHECKIN_IMAGE_SIGNED_URL_FAILED", {
              submissionId: submission.id,
              storagePath,
              error: String(error?.message || error),
            });

            try {
              const [buffer] = await bucket.file(storagePath).download();
              const contentType = attachment.contentType || "application/octet-stream";

              return {
                ...attachment,
                storagePath,
                dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
              };
            } catch (downloadError) {
              console.error("CHECKIN_IMAGE_DOWNLOAD_FALLBACK_FAILED", {
                submissionId: submission.id,
                storagePath,
                error: String(downloadError?.message || downloadError),
              });
              return {
                ...attachment,
                storagePath,
                viewError:
                  "The stored image could not be loaded from Firebase Storage.",
              };
            }
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

function parseNumber(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function testSubmissionBase({ bookingNumber, adminEmail, now, offsetMs = 0 }) {
  return {
    lang: "en",
    name: "Rafy Marbin Test Guest",
    email: "rafy@marbin.dk",
    phone: "+45 22 33 44 55",
    country: "DK",
    countryIso: "DK",
    consent: true,
    feesAccepted: true,
    bookingNumber,
    source: "admin-test",
    status: "sent",
    mailStatus: "sent",
    createdAtMs: now - offsetMs,
    updatedAtMs: now - offsetMs,
    requestMeta: {
      createdBy: adminEmail,
      origin: "admin-dashboard",
      testSubmission: true,
    },
  };
}

function buildTestSubmissionRecords(type, adminEmail) {
  const now = Date.now();
  const bookingNumber = randomBookingNumber(true);
  const looseNumber = randomBookingNumber(false);
  const stayStart = "2026-08-12";
  const stayEnd = "2026-08-19";
  const submittedStayDate = stayStart;
  const records = {
    booking: {
      ...testSubmissionBase({ bookingNumber, adminEmail, now, offsetMs: 0 }),
      intent: "booking",
      stayPurpose:
        "Admin test booking with every field filled for manual dashboard QA.",
      guests: { adults: 3, children: 2, babies: 1, total: 6 },
      selection: {
        start: stayStart,
        endExclusive: stayEnd,
        nights: 7,
        baseNightsTotalDKK: 23054,
        cleaningFeeDKK: 1250,
        totalWithCleaningDKK: 24304,
        airbnbServiceFeeSavingsDKK: 2554,
        totalAfterAirbnbDiscountDKK: 21750,
        breakdown: [
          { date: "2026-08-12", price: 3293 },
          { date: "2026-08-13", price: 3293 },
          { date: "2026-08-14", price: 3443 },
          { date: "2026-08-15", price: 3443 },
          { date: "2026-08-16", price: 3293 },
          { date: "2026-08-17", price: 3143 },
          { date: "2026-08-18", price: 3146 },
        ],
      },
      message:
        "Admin test: booking message filled with linen, arrival, and family details.",
    },
    contact: {
      ...testSubmissionBase({ bookingNumber, adminEmail, now, offsetMs: 60_000 }),
      intent: "contact",
      message:
        "Admin test: contact form message filled for manual dashboard QA.",
    },
    "extra-services": {
      ...testSubmissionBase({
        bookingNumber,
        adminEmail,
        now,
        offsetMs: 120_000,
      }),
      intent: "extra-services",
      purpose: "extra-services",
      context: "extra-services",
      message: "Admin test: selected extras should be ready before arrival.",
      extras: {
        stayDate: stayStart,
        totalDKK: 1495,
        items: [
          {
            id: "linen-pack",
            qty: 5,
            unitPriceDKK: 199,
            label: { da: "Linnedpakke", en: "Linen package" },
          },
          {
            id: "crib",
            qty: 1,
            unitPriceDKK: 500,
            label: { da: "Babyseng", en: "Baby crib" },
          },
        ],
      },
    },
    checkin: {
      ...testSubmissionBase({ bookingNumber, adminEmail, now, offsetMs: 180_000 }),
      intent: "guest-checkin",
      message: "Admin test: check-in completed and meters photographed.",
      checkin: {
        type: "checkin",
        typeLabel: "Check-in",
        stayDate: submittedStayDate,
        submittedStayDate,
        keycode: "6142",
        meterReadings: {
          electricity: "055540",
          waterHouse: "0002142",
          waterPool: "00516263",
        },
        attachments: [
          {
            fieldname: "electricity",
            filename: "electricity-meter.jpeg",
            contentType: "image/jpeg",
            sizeBytes: 281000,
            viewUrl: "/admin-test/electricity-meter.jpeg",
          },
          {
            fieldname: "waterHouse",
            filename: "water-house-meter.jpeg",
            contentType: "image/jpeg",
            sizeBytes: 236000,
            viewUrl: "/admin-test/water-house-meter.jpeg",
          },
          {
            fieldname: "waterPool",
            filename: "water-pool-meter.jpeg",
            contentType: "image/jpeg",
            sizeBytes: 249000,
            viewUrl: "/admin-test/water-pool-meter.jpeg",
          },
        ],
      },
    },
    checkout: {
      ...testSubmissionBase({ bookingNumber, adminEmail, now, offsetMs: 240_000 }),
      intent: "guest-checkin",
      message: "Admin test: check-out completed and key returned.",
      checkin: {
        type: "checkout",
        typeLabel: "Check-out",
        stayDate: submittedStayDate,
        submittedStayDate,
        keycode: "6142",
        meterReadings: {
          electricity: "058120",
          waterHouse: "0002199",
          waterPool: "00516430",
        },
        attachments: [
          {
            fieldname: "electricity",
            filename: "electricity-meter.jpeg",
            contentType: "image/jpeg",
            sizeBytes: 281000,
            viewUrl: "/admin-test/electricity-meter.jpeg",
          },
        ],
      },
    },
  };

  if (type === "all") {
    return [
      records.booking,
      records.contact,
      records["extra-services"],
      records.checkin,
      records.checkout,
    ];
  }

  const record = records[type];
  if (!record) return [];
  if (type === "contact") {
    return [{ ...record, bookingNumber: looseNumber }];
  }
  return [record];
}

async function findSubmissionDoc(db, submissionId) {
  const collections = [
    FORM_SUBMISSIONS_COLLECTION,
    LEGACY_CONTACT_SUBMISSIONS_COLLECTION,
  ];

  for (const collectionName of collections) {
    const docRef = db.collection(collectionName).doc(submissionId);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      return { docRef, snapshot };
    }
  }

  return null;
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "GET, POST, PATCH, DELETE");

  if (
    req.method !== "GET" &&
    req.method !== "POST" &&
    req.method !== "PATCH" &&
    req.method !== "DELETE"
  ) {
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
    if (req.method === "POST") {
      const action = String(req.body?.action || "").trim();
      const type = String(req.body?.type || "").trim();

      if (action !== "create-test-submission") {
        sendJson(res, 400, {
          ok: false,
          error: "UNKNOWN_POST_ACTION",
          detail: "Unsupported admin post action.",
        });
        return;
      }

      if (!TEST_SUBMISSION_TYPES.has(type)) {
        sendJson(res, 400, {
          ok: false,
          error: "INVALID_TEST_SUBMISSION_TYPE",
          detail: "Choose a valid test submission type.",
        });
        return;
      }

      const records = buildTestSubmissionRecords(type, adminEmail);
      const createdRefs = await Promise.all(
        records.map((record) => createFormSubmission(db, record))
      );
      const createdSubmissions = createdRefs
        .map((docRef, index) =>
          docRef
            ? {
                id: docRef.id,
                ...records[index],
              }
            : null
        )
        .filter(Boolean);
      const submissionsWithUrls = await addAttachmentViewUrls(createdSubmissions, db);

      sendJson(res, 200, {
        ok: true,
        submissions: submissionsWithUrls,
      });
      return;
    }

    if (req.method === "PATCH") {
      const submissionId = String(req.body?.id || "").trim();
      const action = String(req.body?.action || "").trim();
      const meter = String(req.body?.meter || "").trim();
      const correctedValue = String(req.body?.correctedValue || "").trim();

      if (action !== "correct-meter") {
        sendJson(res, 400, {
          ok: false,
          error: "UNKNOWN_PATCH_ACTION",
          detail: "Unsupported admin patch action.",
        });
        return;
      }

      if (!submissionId) {
        sendJson(res, 400, {
          ok: false,
          error: "SUBMISSION_ID_REQUIRED",
          detail: "Missing submission id.",
        });
        return;
      }

      if (!METER_FIELDS.has(meter)) {
        sendJson(res, 400, {
          ok: false,
          error: "INVALID_METER_FIELD",
          detail: "Choose a valid meter field.",
        });
        return;
      }

      if (!correctedValue) {
        sendJson(res, 400, {
          ok: false,
          error: "CORRECTED_VALUE_REQUIRED",
          detail: "Enter the correct meter value.",
        });
        return;
      }

      const found = await findSubmissionDoc(db, submissionId);
      if (!found) {
        sendJson(res, 404, {
          ok: false,
          error: "SUBMISSION_NOT_FOUND",
          detail: "No stored submission matched that id.",
        });
        return;
      }

      const existing = { id: found.snapshot.id, ...found.snapshot.data() };
      const checkin = existing.checkin || {};
      const readings = checkin.meterReadings || {};
      const corrections = checkin.meterCorrections || {};
      const previousCorrection = corrections[meter] || null;
      const originalValue =
        previousCorrection?.originalValue != null
          ? String(previousCorrection.originalValue)
          : readings[meter] != null
          ? String(readings[meter])
          : "";
      const previousValue =
        readings[meter] != null ? String(readings[meter]) : originalValue;
      const originalNumber = parseNumber(originalValue);
      const correctedNumber = parseNumber(correctedValue);
      const difference =
        originalNumber != null && correctedNumber != null
          ? correctedNumber - originalNumber
          : null;
      const updatedAtMs = Date.now();

      await updateFormSubmission(found.docRef, {
        checkin: {
          ...checkin,
          meterReadings: {
            ...readings,
            [meter]: correctedValue,
          },
          meterCorrections: {
            ...corrections,
            [meter]: {
              meter,
              originalValue,
              previousValue,
              correctedValue,
              difference,
              updatedAtMs,
              updatedBy: adminEmail,
            },
          },
        },
        updatedAtMs,
      });

      const updatedSubmission = {
        ...existing,
        checkin: {
          ...checkin,
          meterReadings: {
            ...readings,
            [meter]: correctedValue,
          },
          meterCorrections: {
            ...corrections,
            [meter]: {
              meter,
              originalValue,
              previousValue,
              correctedValue,
              difference,
              updatedAtMs,
              updatedBy: adminEmail,
            },
          },
        },
        updatedAtMs,
      };

      const [submissionWithUrls] = await addAttachmentViewUrls([updatedSubmission], db);

      sendJson(res, 200, {
        ok: true,
        submission: submissionWithUrls,
      });
      return;
    }

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
      await listFormSubmissions(db, 250),
      db
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
