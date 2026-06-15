const CLASSIC_RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const { action, provider, token, website } = req.body || {};
  if (website || typeof token !== "string" || token.length < 20) {
    res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
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
    res.status(500).json({ ok: false, error: "RECAPTCHA_NOT_CONFIGURED" });
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
      res.status(403).json({ ok: false, error: "RECAPTCHA_FAILED" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ ok: false, error: "RECAPTCHA_UNAVAILABLE" });
  }
}

async function verifyEnterpriseRecaptcha(req, res, { action, token }) {
  const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
  const projectId = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID;
  const siteKey = process.env.RECAPTCHA_ENTERPRISE_SITE_KEY;
  const expectedAction = process.env.RECAPTCHA_ENTERPRISE_ACTION || "human_verification";
  const scoreThreshold = Number(process.env.RECAPTCHA_ENTERPRISE_SCORE_THRESHOLD || "0.5");

  if (!apiKey || !projectId || !siteKey) {
    res.status(500).json({ ok: false, error: "RECAPTCHA_ENTERPRISE_NOT_CONFIGURED" });
    return;
  }

  if (action !== expectedAction) {
    res.status(400).json({ ok: false, error: "INVALID_ACTION" });
    return;
  }

  const requestIp = getRequesterIp(req);
  const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/assessments?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(assessmentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        event: {
          expectedAction,
          siteKey,
          token,
          userAgent: req.headers["user-agent"] || "",
          userIpAddress: requestIp,
        },
      }),
    });
    const result = await response.json();
    const tokenProperties = result.tokenProperties || {};
    const hostname = String(tokenProperties.hostname || "").toLowerCase();
    const allowedHostnames = getAllowedHostnames();
    const hostnameAllowed = hostname && allowedHostnames.includes(hostname);
    const validAction = tokenProperties.action === expectedAction;
    const score = Number(result.riskAnalysis?.score ?? 0);

    if (!tokenProperties.valid || !hostnameAllowed || !validAction || score < scoreThreshold) {
      res.status(403).json({ ok: false, error: "RECAPTCHA_ENTERPRISE_FAILED" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ ok: false, error: "RECAPTCHA_ENTERPRISE_UNAVAILABLE" });
  }
}
