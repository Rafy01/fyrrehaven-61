export function applySecurityHeaders(res, options = {}) {
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", options.cors ? "cross-origin" : "same-site");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (options.cors) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
  }
}

export function sendJson(res, status, payload, options = {}) {
  applySecurityHeaders(res, options);
  res.status(status).json(payload);
}
