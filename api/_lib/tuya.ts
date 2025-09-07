// api/_lib/tuya.ts
// ESM + Node 18/20+
// Denne fil har ekstra logging for at finde fejl – slå til med DEBUG_POOL_TEMP=1

const DEBUG =
  process.env.DEBUG_POOL_TEMP === "1" || process.env.DEBUG_POOL_TEMP === "true";

function log(...args: unknown[]) {
  if (DEBUG) console.log("[tuya]", ...args);
}
function red(str?: string) {
  if (!str) return "∅";
  return `${str.slice(0, 4)}…${str.slice(-4)}`;
}

/* ──────────────────────────────────────────────────────────────────
   Tuya auth + signing (simple helper)
   ────────────────────────────────────────────────────────────────── */

type TuyaResponse<T> = {
  success: boolean;
  t: number;
  code?: number | string;
  msg?: string;
  result: T;
};

type StatusItem = { code: string; value: unknown };

const BASE = (
  process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com"
).replace(/\/+$/, "");
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY || "";
const SECRET = process.env.TUYA_SECRET || "";

if (DEBUG) {
  log("env presence", {
    BASE: BASE,
    ACCESS_KEY_present: !!ACCESS_KEY,
    SECRET_present: !!SECRET,
  });
}

/**
 * Tuya REST: hent access_token (grant_type=1)
 * Vi cacher token i memory (Vercel cold starts vil reset’e den – det er ok).
 */
let _cachedToken: { token: string; expireAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expireAt > now + 5_000) {
    log("token cache hit; expires in ms", _cachedToken.expireAt - now);
    return _cachedToken.token;
  }

  const path = "/v1.0/token?grant_type=1";
  log("fetch token", { url: BASE + path });

  // Tuya-token-kald kræver sign = HMAC(accessKey + t)
  // Doc: https://developer.tuya.com/en/docs/cloud/openapi/authorization?id=Ka7adj2a7s6q9
  const t = String(Date.now());
  const stringToSign = ""; // tom for token-kald
  const signStr = ACCESS_KEY + t + stringToSign;
  const crypto = await import("node:crypto");
  const sign = crypto
    .createHmac("sha256", SECRET)
    .update(signStr, "utf8")
    .digest("hex")
    .toUpperCase();

  const headers: Record<string, string> = {
    client_id: ACCESS_KEY,
    sign: sign,
    t: t,
    sign_method: "HMAC-SHA256",
  };

  const r = await fetch(BASE + path, { method: "GET", headers });
  const txt = await r.text();
  log("token raw response", {
    status: r.status,
    len: txt.length,
    bodySample: txt.slice(0, 240),
  });

  const j: TuyaResponse<{ access_token: string; expire_time: number }> =
    JSON.parse(txt);

  if (!j?.success) {
    const c = j?.code;
    const m = j?.msg;
    throw new Error(`Tuya token error: ${c ?? ""} ${m ?? ""}`.trim());
  }

  const token = j.result.access_token;
  const ttlSec = Number(j.result.expire_time ?? 0);
  _cachedToken = {
    token,
    expireAt: Date.now() + Math.max(10_000, ttlSec * 1000),
  };
  log("token ok (cached)", { ttlSec });

  return token;
}

/**
 * Signede kald efter vi har token.
 */
async function tuyaGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();

  const t = String(Date.now());
  const method = "GET";
  const body = ""; // GET: tom krop
  const bodyHash = (await import("node:crypto"))
    .createHash("sha256")
    .update(body, "utf8")
    .digest("hex");

  const contentHeaders = ""; // vi bruger ikke custom signHeaders
  const stringToSign = [method, bodyHash, contentHeaders, path].join("\n");

  const toSign = ACCESS_KEY + token + t + stringToSign;
  const sign = (await import("node:crypto"))
    .createHmac("sha256", SECRET)
    .update(toSign, "utf8")
    .digest("hex")
    .toUpperCase();

  const headers: Record<string, string> = {
    client_id: ACCESS_KEY,
    access_token: token,
    sign: sign,
    t: t,
    sign_method: "HMAC-SHA256",
  };

  const url = BASE + path;
  log("GET", { url, headersPreview: { client_id: red(ACCESS_KEY), t } });

  const r = await fetch(url, { method: "GET", headers });
  const txt = await r.text();
  log("GET raw response", {
    status: r.status,
    len: txt.length,
    bodySample: txt.slice(0, 400),
  });

  const j: TuyaResponse<T> = JSON.parse(txt);

  if (!j?.success) {
    const c = j?.code;
    const m = j?.msg;
    throw new Error(`Tuya GET error: ${c ?? ""} ${m ?? ""} (path=${path})`);
  }
  return j.result;
}

/* ──────────────────────────────────────────────────────────────────
   Offentlig API vi bruger i handleren
   ────────────────────────────────────────────────────────────────── */

const DP_PREF = [
  "ch1_temp",
  "water_temp",
  "temp_current",
  "va_temperature",
  "temperature",
];

/** scale-cache pr. device+dp-kode */
const SCALE_CACHE = new Map<string, number>();

/** find scale for dp kode (så 237 => 23.7 hvis scale=1) */
async function getScale(deviceId: string, code: string): Promise<number> {
  const key = `${deviceId}:${code}`;
  const cached = SCALE_CACHE.get(key);
  if (typeof cached === "number") {
    log("scale cache hit", { deviceId, code, scale: cached });
    return cached;
  }

  // henter spec
  const specPath = `/v1.0/iot-03/devices/${deviceId}/specifications`;
  const spec = await tuyaGet<{ functions?: unknown[]; status?: { code: string; type?: string; values?: string }[] }>(specPath);
  log("spec fetched", {
    hasFunctions: Array.isArray(spec.functions),
    hasStatus: Array.isArray(spec.status),
  });

  const statusList: Array<{ code: string; type?: string; values?: string }> =
    spec.status || [];
  const hit = statusList.find((s) => s.code === code);
  if (!hit?.values) {
    log("scale not found in spec; default=0", { code });
    SCALE_CACHE.set(key, 0);
    return 0;
  }

  // values er JSON-string med bl.a. "scale": 1
  let scale = 0;
  try {
    const parsed = JSON.parse(hit.values);
    // typisk {"unit":"°C","min":-400,"max":600,"scale":1,"step":1}
    if (Number.isFinite(parsed?.scale)) scale = Number(parsed.scale);
  } catch (e) {
    log("spec.values JSON parse error", { e });
  }

  log("scale resolved", { deviceId, code, scale });
  SCALE_CACHE.set(key, scale);
  return scale;
}

/** hovedfunktion – returnér grader C som number */
export async function getPoolTempC(deviceId: string): Promise<number> {
  console.time?.(`tuya:getStatus:${deviceId}`);
  const path = `/v1.0/iot-03/devices/${deviceId}/status`;
  const list = await tuyaGet<StatusItem[]>(path);
  console.timeEnd?.(`tuya:getStatus:${deviceId}`);

  log("status list size", list.length);

  // dump relevante DP’er
  const byCode = Object.fromEntries(list.map((s) => [s.code, s.value]));
  log(
    "interesting codes snapshot",
    DP_PREF.reduce((acc, c) => {
      acc[c] = byCode[c] ?? null;
      return acc;
    }, {} as Record<string, unknown>)
  );

  // 1) vælg foretrukken dp
  const foundCode = DP_PREF.find((c) => byCode[c] != null);
  if (!foundCode) {
    throw new Error(
      `No temperature datapoint found (looked for: ${DP_PREF.join(", ")})`
    );
  }

  const raw = Number(byCode[foundCode]);
  if (!Number.isFinite(raw)) {
    throw new Error(
      `Temperature value for ${foundCode} is not numeric: ${String(
        byCode[foundCode]
      )}`
    );
  }

  // 2) scale
  const scale = await getScale(deviceId, foundCode);
  const divisor = Math.pow(10, scale || 0);
  const c = divisor > 1 ? raw / divisor : raw;

  log("value", { code: foundCode, raw, scale, celsius: c });
  return c;
}
