import { test, expect } from '@playwright/test';
import nodemailer from 'nodemailer';

const validBookingPayload = {
  lang: 'en',
  name: 'Playwright Booker',
  email: 'test+api@example.com',
  phone: '+45 12345678',
  country: 'Denmark',
  countryIso: 'DK',
  purpose: 'booking',
  context: 'booking',
  consent: true,
  feesAccepted: true,
  stayPurpose: 'Family holiday test',
  guests: { adults: 2, children: 2, babies: 1 },
  selection: {
    start: '2026-06-10',
    endExclusive: '2026-06-13',
    nights: 3,
    baseNightsTotalDKK: 9000,
    cleaningFeeDKK: 1500,
    totalWithCleaningDKK: 10500,
    breakdown: [
      { date: '2026-06-10', price: 3000 },
      { date: '2026-06-11', price: 3000 },
      { date: '2026-06-12', price: 3000 },
    ],
  },
};

test('api/contact handles submission and sends both user and admin mail', async () => {
  const contactModule = await import('../api/contact.mjs');
  const sentMessages: any[] = [];
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (options: any): Promise<any> => {
      sentMessages.push(options);
      return {
        messageId: `mock-${sentMessages.length}`,
        accepted: [options.to],
        rejected: [],
        response: '250 OK',
        envelope: { from: options.from, to: [options.to] },
        envelopeTime: Date.now(),
        messageTime: Date.now(),
        messageSize: 0,
      };
    },
  })) as any;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  const result: { status?: number; body?: any } = {};
  const req = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://127.0.0.1:5173',
      'user-agent': 'Playwright Test Agent',
    },
    body: validBookingPayload,
    socket: { remoteAddress: '127.0.0.1' },
  } as any;

  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    setHeader() {
      return this;
    },
    json(payload: any) {
      result.body = payload;
      return this;
    },
  } as any;

  await contactModule.default(req, res);

  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ ok: true });
  expect(sentMessages).toHaveLength(2);
  expect(sentMessages[0]).toMatchObject({
    to: 'test+api@example.com',
    subject: expect.stringContaining('Fyrrehaven 61'),
  });
  expect(sentMessages[1]).toMatchObject({
    to: 'host@fyrrehaven-61.dk',
    subject: expect.stringContaining('Playwright Booker'),
  });

  nodemailer.createTransport = originalCreateTransport;
});
