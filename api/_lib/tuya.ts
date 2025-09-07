// api/_lib/tuya.ts
/* eslint-disable no-console */

/**
 * Tuya OpenAPI helper til serverless (Vercel/Node 20+).
 * - Enhanced signing (canonical string) for token + API-kald
 * - Simpel token- og scale-cache
 * - Udtrækker °C fra "bedste" temperatur-DP
 */

type TuyaResp<T> = {
  success: boolean;
  t: number;
  code?: number | string;
  msg?: string;
  result: T;
};

type StatusItem = { code: string; value: unknown };

// ───────────────────────────────────────────────────────────────────────────────
// Konfiguration + debug
// ───────────────────────────────────────────────────────────────────────────────

const BASE = mustEnv("TUYA_BASE_URL").replace(/\/+$/, ""); // uden trailing slash
const ACCESS_KEY = mustEnv("TUYA_ACCESS_KEY");
const SECRET = mustEnv("TUYA_SECRET");

const DEBUG = process.env.DEBUG_POOL_TEMP === "1" || process.env.DEBUG === "1";

function log(...args: unknown[]) {
  if (DEBUG) console.log("[tuya]", ...args);
}

function mustEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function redact(s: string, keep = 4): string {
  if (!s) return "";
  if (s.length <= keep * 2) return "*".repeat(s.length);
  return s.slice(0, keep) + "…" + s.slice(-keep);
}

// ───────────────────────────────────────────────────────────────────────────────
// Signering (Tuya Enhanced Signatures)
// ───────────────────────────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  // Node 20+: brug node:crypto for konsistent serverless-udførsel
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

async function hmac256Hex(key: string, input: string): Promise<string> {
  const crypto = await import("node:crypto");
  return crypto.createHmac("sha256", key).update(input, "utf8").digest("hex");
}

/**
 * Canonical string til signering:
 *   <METHOD>\n<SHA256(body)>\n<sign_headers>\n<path_with_query>
 * Vi bruger ingen sign_headers → tom linje.
 */
async function buildStringToSign(
  method: "GET" | "POST" | "PUT" | "DELETE",
  pathWithQuery: string,
  body: string
): Promise<string> {
  const bodyHash = await sha256Hex(body ?? "");
  return [method, bodyHash, "", pathWithQuery].join("\n");
}

/** Sign til TOKEN: ACCESS_KEY + t + stringToSign (uden access_token) */
async function signForToken(t: string, stringToSign: string): Promise<string> {
  const raw = ACCESS_KEY + t + stringToSign;
  return (await hmac256Hex(SECRET, raw)).toUpperCase();
}

/** Sign til AUTHAUTH-kald: ACCESS_KEY + access_token + t + stringToSign */
async function signForApi(
  accessToken: string,
  t: string,
  stringToSign: string
): Promise<string> {
  const raw = ACCESS_KEY + accessToken + t + stringToSign;
  return (await hmac256Hex(SECRET, raw)).toUpperCase();
}

// ───────────────────────────────────────────────────────────────────────────────
// Token-cache
// ───────────────────────────────────────────────────────────────────────────────

let tokenCache: { token: string; expireAt: number /* ms epoch */ } | null =
  null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expireAt > now + 5_000) {
    log("token cache hit; ttl(ms) =", tokenCache.expireAt - now);
    return tokenCache.token;
  }

  const path = "/v1.0/token?grant_type=1";
  const url = BASE + path;

  const method = "GET" as const;
  const body = "";
  const stringToSign = await buildStringToSign(method, path, body);
  const t = String(Date.now());
  const sign = await signForToken(t, stringToSign);

  const headers: Record<string, string> = {
    client_id: ACCESS_KEY,
    sign: sign,
    t: t,
    sign_method: "HMAC-SHA256",
  };

  log("fetch token", {
    url,
    headers: { client_id: redact(ACCESS_KEY), t, sign: sign.slice(0, 8) + "…" },
  });

  const r = await fetch(url, { method, headers });
  const raw = await r.text();
  log("token response", { status: r.status, sample: raw.slice(0, 200) });

  let j: TuyaResp<{ access_token: string; expire_time: number }>;
  try {
    j = JSON.parse(raw);
  } catch {
    throw new Error(
      `Tuya token JSON parse error (status ${r.status}): ${raw.slice(0, 200)}`
    );
  }
  if (!j.success) {
    throw new Error(`Tuya token error: ${j.code ?? ""} ${j.msg ?? "unknown"}`);
  }

  const token = j.result.access_token;
  const ttlSec = Number(j.result.expire_time || 0);
  const expireAt = Date.now() + Math.max(10_000, ttlSec * 1000);

  tokenCache = { token, expireAt };
  log("token ok", { ttlSec });

  return token;
}

// ───────────────────────────────────────────────────────────────────────────────
// GET-helper (autoriseret)
// ───────────────────────────────────────────────────────────────────────────────

async function tuyaGet<T>(path: string): Promise<T> {
  const accessToken = await getAccessToken();

  const method = "GET" as const;
  const body = "";
  const stringToSign = await buildStringToSign(method, path, body);
  const t = String(Date.now());
  const sign = await signForApi(accessToken, t, stringToSign);

  const url = BASE + path;
  const headers: Record<string, string> = {
    client_id: ACCESS_KEY,
    access_token: accessToken,
    sign: sign,
    t: t,
    sign_method: "HMAC-SHA256",
  };

  log("GET", {
    path,
    headers: {
      client_id: redact(ACCESS_KEY),
      access_token: redact(accessToken),
      t,
      sign: sign.slice(0, 8) + "…",
    },
  });

  const r = await fetch(url, { method, headers });
  const raw = await r.text();

  log("GET response", { status: r.status, sample: raw.slice(0, 240) });

  let j: TuyaResp<T>;
  try {
    j = JSON.parse(raw);
  } catch {
    throw new Error(
      `Tuya GET JSON parse error (status ${r.status}): ${raw.slice(0, 240)}`
    );
  }
  if (!j.success) {
    throw new Error(`Tuya GET error: ${j.code ?? ""} ${j.msg ?? "unknown"}`);
  }
  return j.result;
}

// ───────────────────────────────────────────────────────────────────────────────
// Scale-cache pr. deviceId+code
// ───────────────────────────────────────────────────────────────────────────────

const SCALE_CACHE = new Map<string, number>(); // key: `${deviceId}:${code}`

async function getScale(deviceId: string, code: string): Promise<number> {
  const key = `${deviceId}:${code}`;
  const hit = SCALE_CACHE.get(key);
  if (typeof hit === "number") return hit;

  // v1.0/iot-03/devices/{device_id}/specifications
  const spec = await tuyaGet<{
    category: string;
    functions?: Array<{ code: string; values?: string }>;
    status?: Array<{ code: string; values?: string }>;
  }>(`/v1.0/iot-03/devices/${deviceId}/specifications`);

  const all = ([] as Array<{ code: string; values?: string }>)
    .concat(spec.functions ?? [])
    .concat(spec.status ?? []);

  const item = all.find((x) => x.code === code);
  if (!item?.values) {
    SCALE_CACHE.set(key, 0);
    log("scale fallback 0 (no values)", { deviceId, code });
    return 0;
  }

  let parsed: {
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    scale?: number;
  };
  try {
    parsed = JSON.parse(item.values);
  } catch {
    SCALE_CACHE.set(key, 0);
    log("scale parse failed; fallback 0", {
      deviceId,
      code,
      values: item.values,
    });
    return 0;
  }

  const scale = Number(parsed.scale ?? 0);
  const safe = Number.isFinite(scale) && scale >= 0 && scale <= 6 ? scale : 0;
  SCALE_CACHE.set(key, safe);

  log("scale", { deviceId, code, scale: safe });
  return safe;
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API: hent °C fra et device
// ───────────────────────────────────────────────────────────────────────────────

/** Vælg bedste temperatur-DP ud fra status-listen */
function pickTempCode(items: StatusItem[]): string | null {
  const pref = [
    "ch1_temp",
    "water_temp",
    "temp_current",
    "va_temperature",
    "temperature",
  ];
  const have = new Set(items.map((i) => i.code));
  const pick = pref.find((p) => have.has(p));
  return pick ?? null;
}

/** Returnerer temperatur i °C som number (kaster ved fejl) */
export async function getPoolTempC(deviceId: string): Promise<number> {
  if (!deviceId || !/^[A-Za-z0-9]{16,64}$/.test(deviceId)) {
    throw new Error("Bad device id");
  }

  // v1.0/iot-03/devices/{device_id}/status
  const list = await tuyaGet<StatusItem[]>(
    `/v1.0/iot-03/devices/${deviceId}/status`
  );

  log("status codes", list);

  const code = pickTempCode(list);
  if (!code) {
    throw new Error("No temperature datapoint found on device");
  }

  const rawItem = list.find((x) => x.code === code)!;
  const rawNum = Number(rawItem.value);
  if (!Number.isFinite(rawNum)) {
    throw new Error(`Temperature value not numeric for code=${code}`);
  }

  const scale = await getScale(deviceId, code);
  const divisor = Math.pow(100, scale);
  const c = scale > 0 ? rawNum / divisor : rawNum;

  log("temp", { code, raw: rawNum, scale, c });

  return c;
}

// Valgfri named exports (kan bruges i tests)
export const __tuyaDebug = {
  getAccessToken,
  tuyaGet,
  getScale,
  pickTempCode,
  BASE,
  ACCESS_KEY_MASKED: redact(ACCESS_KEY),
};
