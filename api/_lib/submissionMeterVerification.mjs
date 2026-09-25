import { findFormSubmissionDoc } from './formSubmissions.mjs';
import { publicSubmissionPayload, deliverSubmissionEvent } from './submissionIntegration.mjs';

const METERS = ['electricity', 'waterHouse', 'waterPool'];
export function meterNumber(value) {
  const text = String(value ?? '').trim().replace(/\s/g, '');
  if (!/^(?:\d+(?:[.,]\d+)?|\d{1,3}(?:\.\d{3})+(?:,\d+)?)$/.test(text)) return null;
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function verifiedCheckin(existing, input, now) {
  const checkin = existing.checkin;
  if (existing.intent !== 'guest-checkin' || !checkin || existing.status === 'draft') {
    throw Object.assign(new Error('Only submitted meter readings can be verified.'), { status: 400 });
  }
  if (!Number.isFinite(input.expectedVersion) || input.expectedVersion !== Number(existing.updatedAtMs || existing.createdAtMs || 0)) {
    throw Object.assign(new Error('This submission changed on the website. Refresh the readings before verifying.'), { status: 409 });
  }
  const readings = { ...checkin.meterReadings };
  const corrections = { ...checkin.meterCorrections };
  const actor = String(input.actor?.email || input.actor?.uid || '').trim().slice(0, 256);
  if (!actor) throw Object.assign(new Error('Verifier identity is required.'), { status: 400 });
  for (const meter of METERS) {
    const raw = input.meters?.[meter];
    if (meter === 'waterPool' && (raw == null || raw === '')) continue;
    const corrected = meterNumber(raw);
    if (corrected == null) throw Object.assign(new Error(`Invalid ${meter} reading.`), { status: 400 });
    const original = corrections[meter]?.originalValue ?? readings[meter] ?? '';
    const value = String(corrected).replace('.', ',');
    if (String(readings[meter] ?? '') !== value) {
      corrections[meter] = {
        meter, originalValue: String(original), previousValue: String(readings[meter] ?? ''),
        correctedValue: value, difference: meterNumber(original) == null ? null : corrected - meterNumber(original),
        updatedAtMs: now, updatedBy: actor,
      };
    }
    readings[meter] = value;
  }
  if (input.imageMeters != null && (!Array.isArray(input.imageMeters) || input.imageMeters.length !== (checkin.attachments || []).length || input.imageMeters.some((meter) => meter !== '' && !METERS.includes(meter)))) {
    throw Object.assign(new Error('Invalid image meter assignments.'), { status: 400 });
  }
  const attachments = (checkin.attachments || []).map((attachment, index) => input.imageMeters?.[index]
    ? { ...attachment, meter: input.imageMeters[index] } : attachment);
  return { ...checkin, attachments, meterReadings: readings, meterCorrections: corrections,
    meterApproval: { status: 'approved', approvedAtMs: now, approvedBy: actor, source: 'stayflow' } };
}

export async function verifyIntegrationMeters(db, input) {
  if (!Array.isArray(input.ids) || input.ids.length !== 1 || typeof input.ids[0] !== 'string') {
    return { status: 400, body: { ok: false, error: 'Exactly one submission ID is required.' } };
  }
  const found = await findFormSubmissionDoc(db, input.ids[0]);
  if (!found) return { status: 404, body: { ok: false, error: 'Submission not found.' } };
  try {
    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(found.docRef);
      if (!snapshot.exists) throw Object.assign(new Error('Submission not found.'), { status: 404 });
      const existing = { id: snapshot.id, ...snapshot.data() };
      const now = Date.now();
      const checkin = verifiedCheckin(existing, input, now);
      transaction.update(found.docRef, { checkin, updatedAtMs: now });
      return { ...existing, checkin, updatedAtMs: now };
    });
    // Verification is committed even if a downstream webhook cannot be delivered.
    await deliverSubmissionEvent(db, found.docRef, 'submission.approved', updated).catch(() => undefined);
    return { status: 200, body: { ok: true, submission: publicSubmissionPayload(updated) } };
  } catch (error) {
    if (!error.status) throw error;
    return { status: error.status, body: { ok: false, error: error.message } };
  }
}
