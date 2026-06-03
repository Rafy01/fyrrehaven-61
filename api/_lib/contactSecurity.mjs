const DEFAULT_ALLOWED_ORIGINS = [
  "https://fyrrehaven-61.dk",
  "https://www.fyrrehaven-61.dk",
  "https://test.fyrrehaven-61.dk",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const requestCounts = new Map();

const getRateLimitWindowMs = () =>
  Number(process.env.CONTACT_RATE_WINDOW_MS || 60 * 60 * 1000);
const getRateLimitMax = () => Number(process.env.CONTACT_RATE_LIMIT || 10);

function getHeader(req, name) {
  return String(req.headers?.[name.toLowerCase()] ?? "").trim();
}

function isBlockedBotUserAgent(req) {
  const agent = getHeader(req, "user-agent");
  if (!agent) return false;
  return /\b(bot|crawl|spider|archiver|fetch|monitor|checker|validator|preview|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|discord|telegrambot|pinterest|embedly|quora\slink\spreview|vkshare|google-inspection-tool|googleweblight|bingbot)\b|bot(?=\/|$)/i.test(agent);
}

export function normalizeEmail(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

export function getRequesterIp(req) {
  const maybeForwarded = getHeader(req, "x-forwarded-for");
  if (maybeForwarded) {
    return maybeForwarded.split(",")[0].trim();
  }
  const remoteAddress = req.socket?.remoteAddress ?? "unknown";
  return String(remoteAddress).replace(/^::ffff:/, "");
}

export function getAllowedOrigins() {
  const env = String(process.env.CONTACT_ALLOWED_ORIGINS || "").trim();
  const list = env || DEFAULT_ALLOWED_ORIGINS.join(",");
  return list
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(req) {
  const allowed = new Set(getAllowedOrigins());
  const isTrustedOrigin = (origin) => {
    if (!origin) return false;
    if (allowed.has(origin)) return true;

    try {
      const url = new URL(origin);
      const hostname = url.hostname.toLowerCase();
      const isHttps = url.protocol === "https:";

      return (
        isHttps &&
        (hostname.endsWith(".fyrrehaven-61.dk") ||
          hostname === "fyrrehaven-61.vercel.app" ||
          (hostname.startsWith("fyrrehaven-61-") && hostname.endsWith(".vercel.app")))
      );
    } catch {
      return false;
    }
  };

  const origin = getHeader(req, "origin");
  if (isTrustedOrigin(origin)) return true;

  const referer = getHeader(req, "referer");
  if (referer) {
    try {
      const url = new URL(referer);
      return isTrustedOrigin(url.origin);
    } catch {
      return false;
    }
  }

  return false;
}

export function validateContactHeaders(req) {
  const contentType = getHeader(req, "content-type");
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      status: 415,
      error: "UNSUPPORTED_MEDIA_TYPE",
      detail: "Content-Type must be application/json",
    };
  }

  if (!isOriginAllowed(req)) {
    return {
      ok: false,
      status: 403,
      error: "FORBIDDEN_ORIGIN",
      detail:
        "Origin or Referer is not allowed for contact form submissions.",
    };
  }

  if (isBlockedBotUserAgent(req)) {
    return {
      ok: false,
      status: 403,
      error: "FORBIDDEN_USER_AGENT",
      detail: "Automated crawlers are not allowed to submit contact forms.",
    };
  }

  return { ok: true };
}

export function validateContactPayload(body) {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      status: 400,
      error: "INVALID_PAYLOAD",
      detail: "Request body must be a JSON object.",
    };
  }

  const email = normalizeEmail(body.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_EMAIL",
      detail: "Email must be a valid address.",
    };
  }

  const name = String(body.name || "").trim();
  if (!name || name.length < 2) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NAME",
      detail: "Name must be at least two characters.",
    };
  }

  const consent =
    body.consent === true || String(body.consent || "").toLowerCase() === "true";
  if (!consent) {
    return {
      ok: false,
      status: 400,
      error: "MISSING_CONSENT",
      detail: "Consent is required to process contact or booking requests.",
    };
  }

  const purpose = String(body.purpose || body.context || "").toLowerCase();
  const isBooking =
    purpose === "booking" ||
    Boolean(body.selection) ||
    Boolean(body.guests) ||
    Boolean(body.stayPurpose);

  const message = String(body.message || "").trim();
  if (!isBooking && !message) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_MESSAGE",
      detail: "Message is required for contact forms.",
    };
  }

  if (message) {
    if (message.length > 5000) {
      return {
        ok: false,
        status: 400,
        error: "MESSAGE_TOO_LONG",
        detail: "Message is too long.",
      };
    }
    const links = message.match(/https?:\/\//gi) || [];
    if (links.length > 3) {
      return {
        ok: false,
        status: 400,
        error: "TOO_MANY_LINKS",
        detail: "Message contains too many links.",
      };
    }
  }

  if (isBooking) {
    const parseIntValue = (value) => {
      if (typeof value === "number" && Number.isInteger(value)) return value;
      if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        return Number.parseInt(value.trim(), 10);
      }
      return null;
    };

    const parseNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    const isValidYmd = (value) => {
      if (typeof value !== "string") return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return false;
      const [year, month, day] = value.split("-").map(Number);
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
      );
    };

    const guests = body.guests;
    if (!guests || typeof guests !== "object") {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_GUESTS",
        detail: "Guest information is required for booking requests.",
      };
    }

    const adults = parseIntValue(guests.adults);
    const children = parseIntValue(guests.children) ?? 0;
    const babies = parseIntValue(guests.babies) ?? 0;
    if (adults === null || adults < 1) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_ADULTS",
        detail: "Booking requests must include at least one adult.",
      };
    }
    if (children < 0 || babies < 0) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_GUESTS",
        detail: "Guest counts must be valid non-negative numbers.",
      };
    }
    if (adults + children + babies > 10) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_GUEST_TOTAL",
        detail: "Booking requests may not exceed 10 guests.",
      };
    }

    const stayPurpose = String(body.stayPurpose || "").trim();
    if (!stayPurpose || stayPurpose.length < 5) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_STAY_PURPOSE",
        detail: "Please provide a short purpose for your stay.",
      };
    }

    const feesAccepted =
      body.feesAccepted === true ||
      String(body.feesAccepted || "").toLowerCase() === "true";
    if (!feesAccepted) {
      return {
        ok: false,
        status: 400,
        error: "MISSING_FEES_ACCEPTANCE",
        detail: "Fees acceptance is required for booking requests.",
      };
    }

    const selection = body.selection;
    if (!selection || typeof selection !== "object") {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_SELECTION",
        detail: "Booking requests must include a selected stay period.",
      };
    }

    const start = String(selection.start || "").trim();
    const endExclusive = String(selection.endExclusive || "").trim();
    const nights = parseIntValue(selection.nights);
    if (!isValidYmd(start) || !isValidYmd(endExclusive) || nights === null || nights < 1) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_SELECTION",
        detail: "Selected booking dates must be valid and include at least one night.",
      };
    }

    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${endExclusive}T00:00:00Z`);
    if (endDate <= startDate) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_DATES",
        detail: "Check-out must be after check-in.",
      };
    }

    const baseTotal = parseNumber(selection.baseNightsTotalDKK);
    const cleaningFee = parseNumber(selection.cleaningFeeDKK);
    const totalWithCleaning = parseNumber(selection.totalWithCleaningDKK);
    if (baseTotal === null || baseTotal < 0) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_TOTAL",
        detail: "Booking total must be a valid number.",
      };
    }
    if (cleaningFee === null || cleaningFee < 0) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_CLEANING_FEE",
        detail: "Cleaning fee must be a valid number.",
      };
    }
    if (
      totalWithCleaning !== null &&
      totalWithCleaning < baseTotal + cleaningFee
    ) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_BOOKING_TOTAL",
        detail: "Booking total must be at least the room total plus cleaning.",
      };
    }

    if (Array.isArray(selection.breakdown)) {
      for (const item of selection.breakdown) {
        if (
          !item ||
          typeof item !== "object" ||
          !isValidYmd(String(item.date || "")) ||
          parseNumber(item.price) === null
        ) {
          return {
            ok: false,
            status: 400,
            error: "INVALID_BOOKING_BREAKDOWN",
            detail: "Booking price breakdown is malformed.",
          };
        }
      }
    }
  }

  return { ok: true };
}

export function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = getRateLimitWindowMs();
  const max = getRateLimitMax();
  const record = requestCounts.get(ip);
  if (!record || record.expiresAt <= now) {
    requestCounts.set(ip, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  if (record.count >= max) {
    return {
      ok: false,
      retryAfter: Math.ceil((record.expiresAt - now) / 1000),
      allowed: max,
    };
  }

  record.count += 1;
  return { ok: true, remaining: max - record.count };
}
