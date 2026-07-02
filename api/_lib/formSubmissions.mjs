import { getServerTimestamp } from "./firebaseAdmin.mjs";

export const FORM_SUBMISSIONS_COLLECTION = "formSubmissions";
export const LEGACY_CONTACT_SUBMISSIONS_COLLECTION = "contactSubmissions";
export const FORM_SUBMISSION_FILES_COLLECTION = "formSubmissionFiles";

export async function createFormSubmission(db, record) {
  if (!db) return null;

  const docRef = db.collection(FORM_SUBMISSIONS_COLLECTION).doc();
  await docRef.set({
    ...record,
    id: docRef.id,
    createdAt: getServerTimestamp(),
    updatedAt: getServerTimestamp(),
  });
  return docRef;
}

export async function updateFormSubmission(docRef, patch) {
  if (!docRef) return;
  await docRef.update({
    ...patch,
    updatedAt: getServerTimestamp(),
  });
}

export async function deleteFormSubmission(db, submissionId) {
  if (!db || !submissionId) return false;

  const fileSnapshot = await db
    .collection(FORM_SUBMISSION_FILES_COLLECTION)
    .where("submissionId", "==", submissionId)
    .get()
    .catch(() => ({ docs: [] }));

  await Promise.all(
    fileSnapshot.docs.map(async (fileDoc) => {
      const chunkSnapshot = await fileDoc.ref
        .collection("chunks")
        .get()
        .catch(() => ({ docs: [] }));
      await Promise.all(chunkSnapshot.docs.map((chunkDoc) => chunkDoc.ref.delete()));
      await fileDoc.ref.delete();
    })
  );

  const collections = [
    FORM_SUBMISSIONS_COLLECTION,
    LEGACY_CONTACT_SUBMISSIONS_COLLECTION,
  ];

  for (const collectionName of collections) {
    const docRef = db.collection(collectionName).doc(submissionId);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      await docRef.delete();
      return true;
    }
  }

  return false;
}

export async function listFormSubmissions(db, limit = 250) {
  if (!db) return [];

  const [currentSnapshot, legacySnapshot] = await Promise.all([
    db
      .collection(FORM_SUBMISSIONS_COLLECTION)
      .orderBy("createdAtMs", "desc")
      .limit(limit)
      .get()
      .catch(() => ({ docs: [] })),
    db
      .collection(LEGACY_CONTACT_SUBMISSIONS_COLLECTION)
      .orderBy("createdAtMs", "desc")
      .limit(limit)
      .get()
      .catch(() => ({ docs: [] })),
  ]);

  const submissions = [
    ...currentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    ...legacySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  ];

  submissions.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));

  const seen = new Set();
  return submissions.filter((submission) => {
    if (!submission?.id || seen.has(submission.id)) return false;
    seen.add(submission.id);
    return true;
  });
}
