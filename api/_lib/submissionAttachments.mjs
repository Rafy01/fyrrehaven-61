import { getStorageBucket } from "./firebaseAdmin.mjs";
import { FORM_SUBMISSION_FILES_COLLECTION } from "./formSubmissions.mjs";

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

export async function addAttachmentViewUrls(submissions, db) {
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
