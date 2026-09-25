import { test, expect } from '@playwright/test';
import { normalizeEmail } from '../api/_lib/contactSecurity.mjs';
import { publicSubmissionPayload } from '../api/_lib/submissionIntegration.mjs';

test.describe('submission integration payloads', () => {
  test('shares draft submissions with partial check-in data', () => {
    const payload = publicSubmissionPayload({
      id: 'guest-checkin-draft',
      status: 'draft',
      source: 'website-draft',
      intent: 'guest-checkin',
      name: 'Draft Guest',
      email: 'draft@example.com',
      checkin: {
        type: 'checkin',
        bookingStartDate: '2026-09-01',
        meterReadings: {
          electricity: '055540',
          waterHouse: '123,456',
          waterPool: '1234',
        },
        attachments: [{ filename: 'meter.jpg' }],
      },
      createdAtMs: 1788210000000,
    });

    expect(payload).toMatchObject({
      id: 'guest-checkin-draft',
      type: 'draft',
      status: 'draft',
      intent: 'guest-checkin',
      guest: {
        name: 'Draft Guest',
        email: 'draft@example.com',
      },
      dates: {
        bookingStartDate: '2026-09-01',
        bookingEndDate: null,
      },
      checkin: {
        type: 'checkin',
        meters: {
          electricity: '055540',
          waterHouse: '123,456',
          waterPool: '1234',
        },
        attachmentCount: 1,
      },
    });
  });

  test('maps approved check-in and check-out dates for external matching', () => {
    const checkin = publicSubmissionPayload({
      id: 'checkin-approved',
      status: 'sent',
      intent: 'guest-checkin',
      bookingNumber: '71234',
      checkin: {
        type: 'checkin',
        bookingStartDate: '2026-09-01',
        submittedStayDate: '2026-09-01',
        meterApproval: { approvedAtMs: 1788210000000 },
        meterReadings: { electricity: '055540', waterHouse: '123,456' },
      },
    });
    const checkout = publicSubmissionPayload({
      id: 'checkout-approved',
      status: 'sent',
      intent: 'guest-checkin',
      bookingNumber: '71234',
      checkin: {
        type: 'checkout',
        bookingEndDate: '2026-09-07',
        submittedStayDate: '2026-09-07',
        meterApproval: { approvedAtMs: 1788210000000 },
        meterReadings: { electricity: '058120', waterHouse: '124,111' },
      },
    });

    expect(checkin?.dates).toMatchObject({
      checkIn: '2026-09-01',
      checkOut: null,
    });
    expect(checkout?.dates).toMatchObject({
      checkIn: null,
      checkOut: '2026-09-07',
    });
  });
});


test('normalizes email casing without merging distinct guest addresses', () => {
  expect(normalizeEmail('  Guest@Example.COM\u200B ')).toBe('guest@example.com');
  const addresses = ['Guest@Example.COM', 'guest@example.com', 'Other@Example.com'];
  for (const type of ['checkin', 'checkout']) {
    const payloads = addresses.map((email, index) => publicSubmissionPayload({
      id: `${type}-${index}`,
      status: 'sent',
      intent: 'guest-checkin',
      bookingNumber: '71234',
      email,
      checkin: { type, meterApproval: { approvedAtMs: 1788210000000 } },
    }));
    expect(payloads.map((payload) => payload?.guest.email)).toEqual([
      'guest@example.com', 'guest@example.com', 'other@example.com',
    ]);
  }
  for (const submission of [
    { status: 'draft', intent: 'guest-checkin' },
    { status: 'sent', intent: 'booking', selection: {} },
    { status: 'sent', intent: 'extra-services', extras: {} },
  ]) {
    expect(publicSubmissionPayload({ ...submission, email: ' Guest@Example.COM ' })?.guest.email)
      .toBe('guest@example.com');
  }
});

test('shares all unique guest emails on public submission payloads', () => {
  const payload = publicSubmissionPayload({
    id: 'extra-emails',
    status: 'sent',
    intent: 'extra-services',
    email: ' Guest@Example.COM ',
    emails: ['guest@example.com', 'Second@Example.com', 'SECOND@example.com'],
    extras: {
      stayDate: '2026-09-01',
      totalDKK: 100,
      items: [],
    },
  });

  expect(payload?.guest.email).toBe('guest@example.com');
  expect(payload?.guest.emails).toEqual(['guest@example.com', 'second@example.com']);
});
