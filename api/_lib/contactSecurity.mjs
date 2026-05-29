const DEFAULT_ALLOWED_ORIGINS = [
  "https://fyrrehaven-61.dk",
  "https://www.fyrrehaven-61.dk",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const RATE_LIMIT_WINDOW_MS = Number(process.env.CONTACT_RATE_WINDOW_MS || 60 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.CONTACT_RATE_LIMIT || 10);

const requestCounts = new Map();

function getHeader(req, name) {
  return String(req.headers?.[name.toLowerCase()] ?? "").trim();
}

function isBlockedBotUserAgent(req) {
  const agent = getHeader(req, "user-agent");
  if (!agent) return false;
  return /\b(bot|crawl|spider|archiver|fetch|monitor|checker|validator|preview|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|discord|telegrambot|pinterest|embedly|quora\slink\spreview|vkshare|google-inspection-tool|googleweblight|bingbot)\b/i.test(agent);
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
  const origin = getHeader(req, "origin");
  if (origin && allowed.has(origin)) return true;

  const referer = getHeader(req, "referer");
  if (referer) {
    try {
      const url = new URL(referer);
      return allowed.has(url.origin);
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

  const email = String(body.email || "").trim();
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

  const message = String(body.message || "").trim();
  if (!message && !body.selection) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_MESSAGE",
      detail: "Message is required for non-booking contact forms.",
    };
  }
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

  return { ok: true };
}

export function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestCounts.get(ip);
  if (!record || record.expiresAt <= now) {
    requestCounts.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return {
      ok: false,
      retryAfter: Math.ceil((record.expiresAt - now) / 1000),
      allowed: RATE_LIMIT_MAX,
    };
  }

  record.count += 1;
  return { ok: true, remaining: RATE_LIMIT_MAX - record.count };
}
