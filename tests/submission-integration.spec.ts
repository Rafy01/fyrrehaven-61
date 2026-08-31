import { test, expect } from '@playwright/test';
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
