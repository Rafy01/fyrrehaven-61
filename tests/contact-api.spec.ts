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

const makeRequest = (
  body: any,
  origin = 'http://127.0.0.1:5173',
  userAgent = 'Playwright Test Agent',
  remoteAddress = `127.0.0.${Math.floor(Math.random() * 200) + 1}`
) =>
  ({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      'user-agent': userAgent,
    },
    body,
    socket: { remoteAddress },
  } as any);

const makeResponse = () => {
  const result: { status?: number; body?: any } = {};
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
  return { result, res };
};

const loadContactModule = async () =>
  await import(new URL(`../api/contact.mjs?cache=${Date.now()}`, import.meta.url).href);

test('api/contact handles submission and sends both user and admin mail', async () => {
  const contactModule = await loadContactModule();
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

test('api/contact rejects invalid email addresses', async () => {
  const contactModule = await loadContactModule();
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  const { result, res } = makeResponse();
  const req = makeRequest({ ...validBookingPayload, email: 'invalid-email' });

  await contactModule.default(req, res);

  expect(result.status).toBe(400);
  expect(result.body).toMatchObject({
    ok: false,
    error: 'INVALID_EMAIL',
  });
});

test('api/contact rejects missing consent', async () => {
  const contactModule = await loadContactModule();
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  const { result, res } = makeResponse();
  const req = makeRequest({ ...validBookingPayload, consent: false });

  await contactModule.default(req, res);

  expect(result.status).toBe(400);
  expect(result.body).toMatchObject({
    ok: false,
    error: 'MISSING_CONSENT',
  });
});

test('api/contact rejects booking requests with missing fee acceptance', async () => {
  const contactModule = await loadContactModule();
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  const { result, res } = makeResponse();
  const req = makeRequest({ ...validBookingPayload, feesAccepted: false });

  await contactModule.default(req, res);

  expect(result.status).toBe(400);
  expect(result.body).toMatchObject({
    ok: false,
    error: 'MISSING_FEES_ACCEPTANCE',
  });
});

test('api/contact rejects requests from bot user agents', async () => {
  const contactModule = await loadContactModule();
  const originalTransport = nodemailer.createTransport;
  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (): Promise<any> => ({
      messageId: 'mock',
      accepted: ['mock'],
      rejected: [],
      response: '250 OK',
      envelope: { from: 'mock', to: ['mock'] },
      envelopeTime: Date.now(),
      messageTime: Date.now(),
      messageSize: 0,
    }),
  })) as any;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  try {
    const { result, res } = makeResponse();
    const req = makeRequest(validBookingPayload, 'http://127.0.0.1:5173', 'Googlebot/2.1');

    await contactModule.default(req, res);

    expect(result.status).toBe(403);
    expect(result.body).toMatchObject({
      ok: false,
      error: 'FORBIDDEN_USER_AGENT',
    });
  } finally {
    nodemailer.createTransport = originalTransport;
  }
});

test('api/contact enforces rate limits for repeated submissions', async () => {
  process.env.CONTACT_RATE_LIMIT = '1';
  process.env.CONTACT_RATE_WINDOW_MS = '60000';
  const contactModule = await loadContactModule();
  const originalTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (): Promise<any> => ({
      messageId: 'mock',
      accepted: ['mock'],
      rejected: [],
      response: '250 OK',
      envelope: { from: 'mock', to: ['mock'] },
      envelopeTime: Date.now(),
      messageTime: Date.now(),
      messageSize: 0,
    }),
  })) as any;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';
  process.env.CONTACT_RATE_LIMIT = '1';
  process.env.CONTACT_RATE_WINDOW_MS = '60000';

  try {
    const remoteAddress = `127.0.0.${Math.floor(Math.random() * 100) + 1}`;
    const first = makeResponse();
    const req1 = makeRequest(validBookingPayload, 'http://127.0.0.1:5173', 'Playwright Test Agent', remoteAddress);
    await contactModule.default(req1, first.res);
    expect(first.result.status).toBe(200);

    const second = makeResponse();
    const req2 = makeRequest(validBookingPayload, 'http://127.0.0.1:5173', 'Playwright Test Agent', remoteAddress);
    await contactModule.default(req2, second.res);
    expect(second.result.status).toBe(429);
    expect(second.result.body).toMatchObject({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
    });
  } finally {
    nodemailer.createTransport = originalTransport;
  }
});

test('api/contact reports mail failure when transport rejects', async () => {
  const contactModule = await loadContactModule();
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async () => {
      throw new Error('ECONNREFUSED: Connection refused');
    },
  })) as any;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  const { result, res } = makeResponse();
  const req = makeRequest(validBookingPayload);
  await contactModule.default(req, res);

  expect(result.status).toBe(502);
  expect(result.body).toMatchObject({
    ok: false,
    error: 'MAIL_AUTOREPLY_FAILED',
  });

  nodemailer.createTransport = originalCreateTransport;
});
