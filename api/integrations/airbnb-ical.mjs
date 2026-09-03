import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";

const REQ_TIMEOUT_MS = 15000;

export default async function handler(req, res) {
  applySecurityHeaders(res, { cors: true });
  res.setHeader("Allow", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" }, { cors: true });
    return;
  }

  const rawUrl = String(req.query?.url || "").trim();
  if (!rawUrl) {
    sendJson(res, 400, { ok: false, error: "URL_REQUIRED", detail: "Missing url parameter" }, { cors: true });
    return;
  }

  let target;
  try {
    const normalizedUrl = rawUrl.replace(/^webcal:\/\//i, "https://");
    target = new URL(normalizedUrl);
  } catch {
    sendJson(res, 400, { ok: false, error: "INVALID_URL", detail: "The provided URL is not valid" }, { cors: true });
    return;
  }

  const hostname = target.hostname.toLowerCase();
  const isAirbnb =
    hostname === "airbnb.com" ||
    hostname === "airbnb.dk" ||
    hostname.endsWith(".airbnb.com") ||
    hostname.endsWith(".airbnb.dk");

  if (!isAirbnb) {
    sendJson(
      res,
      400,
      { ok: false, error: "UNSUPPORTED_HOST", detail: "Only Airbnb calendar URLs are supported" },
      { cors: true }
    );
    return;
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);

  try {
    const upstream = await fetch(target.href, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Stayflow/1.0)",
        Accept: "text/calendar, text/plain, */*",
      },
      signal: ctrl.signal,
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      sendJson(
        res,
        upstream.status,
        { ok: false, error: `UPSTREAM_${upstream.status}`, detail: `Airbnb returned ${upstream.status}` },
        { cors: true }
      );
      return;
    }

    const icsText = await upstream.text();
    applySecurityHeaders(res, { cors: true });
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    res.status(200).send(icsText);
  } catch (err) {
    clearTimeout(timeout);
    sendJson(
      res,
      502,
      {
        ok: false,
        error: "FETCH_FAILED",
        detail: err instanceof Error ? err.message : "Could not fetch upstream calendar",
      },
      { cors: true }
    );
  }
}
