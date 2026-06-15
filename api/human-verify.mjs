const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

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

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    res.status(500).json({ ok: false, error: "RECAPTCHA_NOT_CONFIGURED" });
    return;
  }

  const { token, website } = req.body || {};
  if (website || typeof token !== "string" || token.length < 20) {
    res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
    return;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  const remoteIp = getRequesterIp(req);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
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
