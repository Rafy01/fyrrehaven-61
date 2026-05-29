
/**
 * Tuya OpenAPI helper til serverless (Vercel/Node 20+).
 * - Enhanced signing (canonical string) for token + API-kald
 * - Simpel token- og scale-cache
 * - Hent ALLE datapunkter (status) og normaliser med scale
 */

type TuyaResp<T> = {
  success: boolean;
  t: number;
  code?: number | string;
  msg?: string;
  result: T;
};

export type StatusItem = { code: string; value: unknown };

type SpecFnOrStatus = { code: string; values?: string };
export type DeviceSpecs = {
  category: string;
  functions?: SpecFnOrStatus[];
  status?: SpecFnOrStatus[];
};

export type LogItem = {
  event_time?: number; // ms
  code?: string;
  value?: unknown;
  // Tuya returnerer flere felter – vi nøjes med de relevante
};

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
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

async function hmac256Hex(key: string, input: string): Promise<string> {
  const crypto = await import("node:crypto");
  return crypto.createHmac("sha256", key).update(input, "utf8").digest("hex");
}

/**
 * Canonical string:
 *   <METHOD>\n<SHA256(body)>\n<sign_headers>\n<path_with_query>
 * (vi bruger ingen sign_headers → tom linje)
 */
async function buildStringToSign(
  method: "GET" | "POST" | "PUT" | "DELETE",
  pathWithQuery: string,
  body: string
): Promise<string> {
  const bodyHash = await sha256Hex(body ?? "");
  return [method, bodyHash, "", pathWithQuery].join("\n");
}

/** Sign til TOKEN */
async function signForToken(t: string, stringToSign: string): Promise<string> {
  const raw = ACCESS_KEY + t + stringToSign;
  return (await hmac256Hex(SECRET, raw)).toUpperCase();
}

/** Sign til AUTHAUTH-kald */
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
    sign,
    t,
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
    sign,
    t,
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
// ALLE data – status, specs, logs, normalisering med scale
// ───────────────────────────────────────────────────────────────────────────────

const SCALE_CACHE = new Map<string, number>(); // key: `${deviceId}:${code}`

async function getScale(deviceId: string, code: string): Promise<number> {
  const key = `${deviceId}:${code}`;
  const hit = SCALE_CACHE.get(key);
  if (typeof hit === "number") return hit;

  const spec = await getDeviceSpecs(deviceId);

  const all: SpecFnOrStatus[] = ([] as SpecFnOrStatus[])
    .concat(spec.functions ?? [])
    .concat(spec.status ?? []);

  const item = all.find((x) => x.code === code);
  if (!item?.values) {
    SCALE_CACHE.set(key, 0);
    log("scale fallback 0 (no values)", { deviceId, code });
    return 0;
  }

  let parsed: { scale?: number };
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

export async function getDeviceStatus(deviceId: string): Promise<StatusItem[]> {
  return tuyaGet<StatusItem[]>(`/v1.0/iot-03/devices/${deviceId}/status`);
}

export async function getDeviceSpecs(deviceId: string): Promise<DeviceSpecs> {
  return tuyaGet<DeviceSpecs>(
    `/v1.0/iot-03/devices/${deviceId}/specifications`
  );
}

/** (Valgfri) hent logs for de sidste X timer – hvis endpointet ikke findes, returnér tom liste */
export async function getDeviceLogs(
  deviceId: string,
  hours = 6,
  pageSize = 100
): Promise<LogItem[]> {
  try {
    const end = Date.now();
    const start = end - hours * 3600 * 1000;
    // type=1 (status report), se Tuya docs. Ikke alle produkter eksponerer dette.
    const qs = `start_time=${start}&end_time=${end}&type=1&page_size=${pageSize}`;
    const r = await tuyaGet<{ logs?: LogItem[] }>(
      `/v1.0/iot-03/devices/${deviceId}/logs?${qs}`
    );
    return r.logs ?? [];
  } catch (e) {
    log("logs unavailable or error -> ignore", (e as Error)?.message);
    return [];
  }
}

/** Normaliser en status-liste ved at anvende scale */
export async function normalizeStatus(
  deviceId: string,
  items: StatusItem[]
): Promise<
  Array<{
    code: string;
    valueRaw: unknown;
    scale: number;
    value: number | unknown; // number hvis scale anvendes, ellers original
  }>
> {
  const out = await Promise.all(
    items.map(async (it) => {
      const valueRaw = it.value;
      // scale giver kun mening for numeriske DP’er
      const rawNum = Number(valueRaw);
      if (!Number.isFinite(rawNum)) {
        return { code: it.code, valueRaw, scale: 0, value: valueRaw };
      }
      const scale = await getScale(deviceId, it.code);
      const divisor = Math.pow(10, scale); // CORRECT: 10^scale
      const value = scale > 0 ? rawNum / divisor : rawNum;
      return { code: it.code, valueRaw, scale, value };
    })
  );
  return out;
}

/** Convenience: hent ALT samlet */
export async function getAllDeviceData(deviceId: string): Promise<{
  statusRaw: StatusItem[];
  status: Awaited<ReturnType<typeof normalizeStatus>>;
  specs: DeviceSpecs;
  logs: LogItem[];
  fetchedAt: string;
}> {
  const [statusRaw, specs, logs] = await Promise.all([
    getDeviceStatus(deviceId),
    getDeviceSpecs(deviceId),
    getDeviceLogs(deviceId).catch(() => [] as LogItem[]),
  ]);
  const status = await normalizeStatus(deviceId, statusRaw);
  return {
    statusRaw,
    status,
    specs,
    logs,
    fetchedAt: new Date().toISOString(),
  };
}

/** Temperatur-hjælper (bevarer din oprindelige funktionalitet) */
export async function getPoolTempC(
  deviceId: string,
  preferCode?: string
): Promise<number> {
  if (!deviceId || !/^[A-Za-z0-9]{16,64}$/.test(deviceId)) {
    throw new Error("Bad device id");
  }

  const list = await getDeviceStatus(deviceId);
  log("status codes", list);

  // 1) eksplicit code via query/env
  if (preferCode) {
    const hit = list.find((x) => x.code === preferCode);
    if (!hit) throw new Error(`Datapoint '${preferCode}' not found on device`);
    const raw = Number(hit.value);
    const scale = await getScale(deviceId, preferCode);
    const c = scale > 0 ? raw / Math.pow(10, scale) : raw;
    if (!Number.isFinite(c)) {
      throw new Error(`Temperature value not numeric for code=${preferCode}`);
    }
    log("temp", { code: preferCode, raw, scale, c });
    return c;
  }

  // 2) heuristik
  const pref = ["ch1_temp", "water_temp", "temp_current", "va_temperature"];
  const have = new Set(list.map((i) => i.code));
  const code = pref.find((p) => have.has(p));
  if (!code) throw new Error("No temperature datapoint found on device");

  const rawNum = Number(list.find((x) => x.code === code)!.value);
  const scale = await getScale(deviceId, code);
  const c = scale > 0 ? rawNum / Math.pow(10, scale) : rawNum;

  log("temp", { code, raw: rawNum, scale, c });
  return c;
}

// Valgfri named exports (til debugging/tests)
export const __tuyaDebug = {
  getAccessToken,
  tuyaGet,
  getScale,
  getDeviceStatus,
  getDeviceSpecs,
  getDeviceLogs,
  normalizeStatus,
  getAllDeviceData,
  BASE,
  ACCESS_KEY_MASKED: redact(ACCESS_KEY),
};
