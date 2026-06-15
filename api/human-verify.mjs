const CLASSIC_RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

function isDevelopment() {
  return process.env.NODE_ENV !== "production" && process.env.VERCEL_ENV !== "production";
}

function sendError(res, statusCode, error, detail) {
  res.status(statusCode).json({
    ok: false,
    error,
    ...(isDevelopment() && detail ? { detail } : {}),
  });
}

function getRequesterIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return (
    firstForwarded?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    ""
  );
}

function getAllowedHostnames() {
  const configured = process.env.RECAPTCHA_ALLOWED_HOSTNAMES;
  if (configured) {
    return configured
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
  }

  return ["fyrrehaven-61.dk", "www.fyrrehaven-61.dk", "localhost", "127.0.0.1"];
}

function isLocalIpAddress(ip) {
  return (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function getGoogleErrorMessage(result) {
  return (
    result?.error?.message ||
    result?.error_description ||
    result?.message ||
    result?.tokenProperties?.invalidReason ||
    ""
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED");
    return;
  }

  const { action, provider, token, website } = req.body || {};
  if (website || typeof token !== "string" || token.length < 20) {
    sendError(res, 400, "INVALID_REQUEST");
    return;
  }

  if (provider === "enterprise") {
    await verifyEnterpriseRecaptcha(req, res, { action, token });
    return;
  }

  await verifyClassicRecaptcha(req, res, token);
}

async function verifyClassicRecaptcha(req, res, token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    sendError(res, 500, "RECAPTCHA_NOT_CONFIGURED");
    return;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  const remoteIp = getRequesterIp(req);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(CLASSIC_RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const result = await response.json();
    const hostname = String(result.hostname || "").toLowerCase();
    const allowedHostnames = getAllowedHostnames();
    const hostnameAllowed = hostname && allowedHostnames.includes(hostname);

    if (!result.success || !hostnameAllowed) {
      sendError(res, 403, "RECAPTCHA_FAILED", {
        hostname,
        hostnameAllowed,
        success: Boolean(result.success),
        errorCodes: result["error-codes"],
      });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    sendError(res, 502, "RECAPTCHA_UNAVAILABLE");
  }
}

async function verifyEnterpriseRecaptcha(req, res, { action, token }) {
  const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
  const projectId = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID;
  const siteKey = process.env.RECAPTCHA_ENTERPRISE_SITE_KEY;
  const expectedAction = process.env.RECAPTCHA_ENTERPRISE_ACTION || "human_verification";
  const scoreThreshold = Number(process.env.RECAPTCHA_ENTERPRISE_SCORE_THRESHOLD || "0.5");

  if (!apiKey || !projectId || !siteKey) {
    sendError(res, 500, "RECAPTCHA_ENTERPRISE_NOT_CONFIGURED", {
      missing: {
        apiKey: !apiKey,
        projectId: !projectId,
        siteKey: !siteKey,
      },
    });
    return;
  }

  if (projectId.startsWith("your-")) {
    sendError(res, 500, "RECAPTCHA_ENTERPRISE_PROJECT_ID_PLACEHOLDER", {
      message: "Replace RECAPTCHA_ENTERPRISE_PROJECT_ID with your real Google Cloud project id.",
    });
    return;
  }

  if (apiKey === siteKey || apiKey.startsWith("6L")) {
    sendError(res, 500, "RECAPTCHA_ENTERPRISE_API_KEY_INVALID", {
      message:
        "RECAPTCHA_ENTERPRISE_API_KEY must be a Google Cloud API key, not the reCAPTCHA site key.",
    });
    return;
  }

  if (action !== expectedAction) {
    sendError(res, 400, "INVALID_ACTION", { received: action, expected: expectedAction });
    return;
  }

  const requestIp = getRequesterIp(req);
  const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/assessments?key=${encodeURIComponent(apiKey)}`;
  const event = {
    expectedAction,
    siteKey,
    token,
    userAgent: req.headers["user-agent"] || "",
  };

  if (!isLocalIpAddress(requestIp)) {
    event.userIpAddress = requestIp;
  }

  try {
    const response = await fetch(assessmentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ event }),
    });
    const result = await response.json();
    const tokenProperties = result.tokenProperties || {};
    const hostname = String(tokenProperties.hostname || "").toLowerCase();
    const allowedHostnames = getAllowedHostnames();
    const hostnameAllowed = hostname && allowedHostnames.includes(hostname);
    const validAction = tokenProperties.action === expectedAction;
    const score = Number(result.riskAnalysis?.score ?? 0);

    if (!response.ok) {
      sendError(res, 502, "RECAPTCHA_ENTERPRISE_API_ERROR", {
        status: response.status,
        statusText: response.statusText,
        message: getGoogleErrorMessage(result),
      });
      return;
    }

    if (!tokenProperties.valid || !hostnameAllowed || !validAction || score < scoreThreshold) {
      sendError(res, 403, "RECAPTCHA_ENTERPRISE_FAILED", {
        hostname,
        hostnameAllowed,
        invalidReason: tokenProperties.invalidReason,
        message: getGoogleErrorMessage(result),
        score,
        scoreThreshold,
        validAction,
      });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    sendError(res, 502, "RECAPTCHA_ENTERPRISE_UNAVAILABLE", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
