import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedCheckin, verifyIntegrationMeters } from '../api/_lib/submissionMeterVerification.mjs';
import { publicSubmissionPayload } from '../api/_lib/submissionIntegration.mjs';

const stored = () => ({ id: 's1', intent: 'guest-checkin', status: 'sent', updatedAtMs: 123,
  checkin: { type: 'checkout', bookingStartDate: '2026-10-01', bookingEndDate: '2026-10-04',
    meterReadings: { electricity: '101', waterHouse: '22', waterPool: '10' },
    attachments: [{ filename: 'a.jpg', firestoreFileId: 'a' }, { filename: 'b.jpg', storagePath: 'b.jpg' }] } });
const input = () => ({ ids: ['s1'], expectedVersion: 123, actor: { uid: 'owner', email: 'owner@example.com' },
  meters: { electricity: '105', waterHouse: '22', waterPool: '10' } });

test('pending submissions require explicit opt-in and expose stable references for every image', () => {
  assert.equal(publicSubmissionPayload(stored()), null);
  const payload = publicSubmissionPayload(stored(), { includePending: true });
  assert.equal(payload.verificationStatus, 'pending');
  assert.equal(payload.type, 'checkout');
  assert.equal(payload.version, 123);
  assert.deepEqual(payload.images, ['website-attachment:s1:0', 'website-attachment:s1:1']);
  assert.equal(JSON.stringify(payload).includes('firestoreFileId'), false);
});

test('verification preserves original readings, records corrections and identifies the verifier', () => {
  const checked = verifiedCheckin(stored(), input(), 200);
  assert.equal(checked.meterReadings.electricity, '105');
  assert.deepEqual(checked.meterCorrections.electricity, { meter: 'electricity', originalValue: '101', previousValue: '101', correctedValue: '105', difference: 4, updatedAtMs: 200, updatedBy: 'owner@example.com' });
  assert.equal(checked.meterApproval.approvedBy, 'owner@example.com');
  assert.equal(checked.meterApproval.source, 'stayflow');
  assert.equal(checked.attachments.length, 2);
  const payload = publicSubmissionPayload({ ...stored(), checkin: checked });
  assert.equal(payload.verificationStatus, 'verified');
  assert.equal(payload.submittedMeters.electricity, '101');
});

test('subsequent corrections preserve the guest original and support decimal readings and zero', () => {
  const original = stored();
  original.checkin.meterCorrections = { electricity: { originalValue: '99' } };
  const next = verifiedCheckin(original, { ...input(), meters: { electricity: '0', waterHouse: '1.234,56', waterPool: '' } }, 200);
  assert.equal(next.meterCorrections.electricity.originalValue, '99');
  assert.equal(next.meterReadings.electricity, '0');
  assert.equal(next.meterReadings.waterHouse, '1234,56');
});

test('rejects stale versions, drafts, missing actors and invalid readings', () => {
  assert.throws(() => verifiedCheckin(stored(), { ...input(), expectedVersion: 122 }, 200), { status: 409 });
  assert.throws(() => verifiedCheckin({ ...stored(), status: 'draft' }, input(), 200), { status: 400 });
  assert.throws(() => verifiedCheckin(stored(), { ...input(), actor: {} }, 200), { status: 400 });
  for (const electricity of ['', '-1', '123abc', 'Infinity']) {
    assert.throws(() => verifiedCheckin(stored(), { ...input(), meters: { electricity, waterHouse: '22' } }, 200), { status: 400 });
  }
});

test('transaction re-reads the current record and never writes a stale review', async () => {
  let writes = 0;
  const initial = { exists: true, id: 's1', data: stored };
  const ref = { get: async () => initial };
  const db = { collection: () => ({ doc: () => ref }), runTransaction: async (operation) => operation({
    get: async () => ({ ...initial, data: () => ({ ...stored(), updatedAtMs: 124 }) }),
    update: () => { writes++; },
  }) };
  const result = await verifyIntegrationMeters(db, input());
  assert.equal(result.status, 409);
  assert.equal(writes, 0);
});


test('keeps the selected meter for each photo and rejects invalid assignments', () => {
  const checked = verifiedCheckin(stored(), { ...input(), imageMeters: ['waterHouse', 'electricity'] }, 200);
  assert.deepEqual(checked.attachments.map((image) => image.meter), ['waterHouse', 'electricity']);
  assert.deepEqual(publicSubmissionPayload({ ...stored(), checkin: checked }).imageMeters, ['waterHouse', 'electricity']);
  assert.throws(() => verifiedCheckin(stored(), { ...input(), imageMeters: ['invalid', ''] }, 200), { status: 400 });
});
