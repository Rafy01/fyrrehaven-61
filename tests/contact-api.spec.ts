import { test, expect } from '@playwright/test';
import nodemailer from 'nodemailer';

type ContactRequest = {
  method: string;
  headers: Record<string, string>;
  body: unknown;
  socket: { remoteAddress: string };
};

type ContactResponse = {
  status(code: number): ContactResponse;
  setHeader(): ContactResponse;
  json(payload: unknown): ContactResponse;
};

type ResponseResult = {
  status?: number;
  body?: unknown;
};

type MockMailOptions = {
  from?: string;
  to?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
};

type MockMailResult = {
  messageId: string;
  accepted: Array<string | string[] | undefined>;
  rejected: string[];
  response: string;
  envelope: {
    from?: string;
    to: Array<string | string[] | undefined>;
  };
  envelopeTime: number;
  messageTime: number;
  messageSize: number;
};

const validBookingPayload = {
  lang: 'en',
  formStartedAt: Date.now() - 5000,
  name: 'Playwright Booker',
  email: 'test+api@example.com',
  confirmEmail: 'test+api@example.com',
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
  body: unknown,
  origin = 'http://127.0.0.1:5173',
  userAgent = 'Playwright Test Agent',
  remoteAddress = `127.0.0.${Math.floor(Math.random() * 200) + 1}`
): ContactRequest => ({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      'user-agent': userAgent,
    },
    body:
      body && typeof body === 'object' && !Array.isArray(body)
        ? { formStartedAt: Date.now() - 5000, ...body }
        : body,
    socket: { remoteAddress },
  });

const makeResponse = () => {
  const result: ResponseResult = {};
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    setHeader() {
      return this;
    },
    json(payload: unknown) {
      result.body = payload;
      return this;
    },
  } satisfies ContactResponse;
  return { result, res };
};

const loadContactModule = async () =>
  await import(new URL(`../api/contact.mjs?cache=${Date.now()}`, import.meta.url).href);

test('api/contact handles submission and sends both user and admin mail', async () => {
  const contactModule = await loadContactModule();
  const sentMessages: MockMailOptions[] = [];
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (options: MockMailOptions): Promise<MockMailResult> => {
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
  })) as unknown as typeof nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  const result: ResponseResult = {};
  const req: ContactRequest = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://127.0.0.1:5173',
      'user-agent': 'Playwright Test Agent',
    },
    body: validBookingPayload,
    socket: { remoteAddress: '127.0.0.1' },
  };

  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    setHeader() {
      return this;
    },
    json(payload: unknown) {
      result.body = payload;
      return this;
    },
  } satisfies ContactResponse;

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

test('api/contact keeps admin notification in English for localized submissions', async () => {
  const contactModule = await loadContactModule();
  const sentMessages: MockMailOptions[] = [];
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (options: MockMailOptions): Promise<MockMailResult> => {
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
  })) as unknown as typeof nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  try {
    const { result, res } = makeResponse();
    const req = makeRequest({
      ...validBookingPayload,
      lang: 'de',
      stayPurpose: 'Familienurlaub Test',
    });

    await contactModule.default(req, res);

    expect(result.status).toBe(200);
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[1].text).toContain('New submission from the website:');
    expect(sentMessages[1].text).toContain('Booking details');
    expect(sentMessages[1].text).toContain('Approvals');
    expect(sentMessages[1].text).not.toContain('Buchungsdetails');
    expect(sentMessages[1].text).not.toContain('Bestätigungen');
  } finally {
    nodemailer.createTransport = originalCreateTransport;
  }
});

test('api/contact normalizes pasted email values before sending mail', async () => {
  const contactModule = await loadContactModule();
  const sentMessages: MockMailOptions[] = [];
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (options: MockMailOptions): Promise<MockMailResult> => {
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
  })) as unknown as typeof nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  try {
    const { result, res } = makeResponse();
    const req = makeRequest({
      ...validBookingPayload,
      email: ' test+api@example.com\u200B ',
    });

    await contactModule.default(req, res);

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true });
    expect(sentMessages[0]).toMatchObject({
      to: 'test+api@example.com',
    });
  } finally {
    nodemailer.createTransport = originalCreateTransport;
  }
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
    sendMail: async (): Promise<MockMailResult> => ({
      messageId: 'mock',
      accepted: ['mock'],
      rejected: [],
      response: '250 OK',
      envelope: { from: 'mock', to: ['mock'] },
      envelopeTime: Date.now(),
      messageTime: Date.now(),
      messageSize: 0,
    }),
  })) as unknown as typeof nodemailer.createTransport;

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

test('api/contact allows submissions from the staging domain', async () => {
  const contactModule = await loadContactModule();
  const sentMessages: MockMailOptions[] = [];
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (options: MockMailOptions): Promise<MockMailResult> => {
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
  })) as unknown as typeof nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  delete process.env.CONTACT_ALLOWED_ORIGINS;

  try {
    const { result, res } = makeResponse();
    const req = makeRequest(
      validBookingPayload,
      'https://test.fyrrehaven-61.dk',
      'Playwright Test Agent',
      '127.0.0.201'
    );

    await contactModule.default(req, res);

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true });
    expect(sentMessages).toHaveLength(2);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
  }
});

test('api/contact allows submissions from Vercel project previews', async () => {
  const contactModule = await loadContactModule();
  const sentMessages: MockMailOptions[] = [];
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (options: MockMailOptions): Promise<MockMailResult> => {
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
  })) as unknown as typeof nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  delete process.env.CONTACT_ALLOWED_ORIGINS;

  try {
    const { result, res } = makeResponse();
    const req = makeRequest(
      validBookingPayload,
      'https://fyrrehaven-61-git-stage-rafy.vercel.app',
      'Playwright Test Agent',
      '127.0.0.202'
    );

    await contactModule.default(req, res);

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true });
    expect(sentMessages).toHaveLength(2);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
  }
});

test('api/contact enforces rate limits for repeated submissions', async () => {
  const originalRateLimit = process.env.CONTACT_RATE_LIMIT;
  const originalRateWindowMs = process.env.CONTACT_RATE_WINDOW_MS;
  process.env.CONTACT_RATE_LIMIT = '1';
  process.env.CONTACT_RATE_WINDOW_MS = '60000';
  const contactModule = await loadContactModule();
  const originalTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async (): Promise<MockMailResult> => ({
      messageId: 'mock',
      accepted: ['mock'],
      rejected: [],
      response: '250 OK',
      envelope: { from: 'mock', to: ['mock'] },
      envelopeTime: Date.now(),
      messageTime: Date.now(),
      messageSize: 0,
    }),
  })) as unknown as typeof nodemailer.createTransport;

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
    const remoteAddress = '127.0.0.250';
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
    if (originalRateLimit === undefined) delete process.env.CONTACT_RATE_LIMIT;
    else process.env.CONTACT_RATE_LIMIT = originalRateLimit;
    if (originalRateWindowMs === undefined) delete process.env.CONTACT_RATE_WINDOW_MS;
    else process.env.CONTACT_RATE_WINDOW_MS = originalRateWindowMs;
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
  })) as unknown as typeof nodemailer.createTransport;

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

test('api/contact reports SMTP authentication failures without leaking credentials detail', async () => {
  const contactModule = await loadContactModule();
  const originalCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = (() => ({
    verify: async (): Promise<true> => true,
    sendMail: async () => {
      throw new Error('Invalid login: 535 5.7.8 Error: authentication failed');
    },
  })) as unknown as typeof nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.mock.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'mock-user';
  process.env.SMTP_PASS = 'mock-pass';
  process.env.MAIL_FROM = 'no-reply@fyrrehaven-61.dk';
  process.env.MAIL_TO = 'host@fyrrehaven-61.dk';
  process.env.CONTACT_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';

  try {
    const { result, res } = makeResponse();
    const req = makeRequest(validBookingPayload);
    await contactModule.default(req, res);

    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({
      ok: false,
      error: 'MAIL_AUTH_FAILED',
      detail: 'Mail server authentication failed.',
    });
  } finally {
    nodemailer.createTransport = originalCreateTransport;
  }
});
