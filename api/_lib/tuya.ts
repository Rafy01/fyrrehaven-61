// api/_lib/tuya.ts
// Tuya v2 signering + simple helpers til at læse datapunkter (fx "ch1_temp") som °C

import { createHash, createHmac } from "crypto";

/** --------- ENV + konfiguration --------- */
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY ?? "";
const SECRET_KEY = process.env.TUYA_SECRET_KEY ?? "";
const REGION = (process.env.TUYA_REGION ?? "EU").toUpperCase();
const API_BASE =
  process.env.TUYA_API_BASE ??
  (REGION === "EU"
    ? "https://openapi.tuyaeu.com"
    : REGION === "US"
    ? "https://openapi.tuyaus.com"
    : REGION === "CN"
    ? "https://openapi.tuyacn.com"
    : REGION === "IN"
    ? "https://openapi.tuyain.com"
    : "https://openapi.tuyaeu.com");

const DBG = process.env.TUYA_DEBUG === "1";

/** --------- Hjælpere --------- */
function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
function hmacSha256Upper(key: string, content: string): string {
  return createHmac("sha256", key)
    .update(content, "utf8")
    .digest("hex")
    .toUpperCase();
}
function qstr(
  q?: Record<string, string | number | boolean | undefined>
): string {
  if (!q) return "";
  const parts = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null && `${v}` !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    );
  return parts.length ? `?${parts.join("&")}` : "";
}

/** --------- Token-cache i hukommelse --------- */
type TokenState = { token: string; expiresAt: number };
let tokenCache: TokenState | null = null;

type TuyaEnvelope<T> = {
  success: boolean;
  code: number;
  msg?: string;
  t?: number;
  tid?: string;
  result: T;
};

type TokenResult = {
  access_token: string;
  expire_time: number; // sekunder
};

async function fetchTuya<T>(
  method: "GET" | "POST",
  path: string,
  opts?: { query?: Record<string, string | number | boolean | undefined>; body?: unknown; withToken?: boolean }
): Promise<T> {
  const urlPath = path + qstr(opts?.query);
  const url = API_BASE + urlPath;
  const bodyJson = opts?.body ? JSON.stringify(opts.body) : "";
  const contentHash = sha256Hex(bodyJson);
  const t = Date.now().toString();

  const headers: Record<string, string> = {
    client_id: ACCESS_KEY,
    t: t,
    sign_method: "HMAC-SHA256",
    "Content-Type": "application/json",
  };

  let accessToken = "";
  if (opts?.withToken) {
    accessToken = await getAccessToken();
    headers["access_token"] = accessToken;
  }

  // Tuya v2 stringToSign
  const stringToSign = [method, contentHash, "", urlPath].join("\n");
  const signStr = `${ACCESS_KEY}${accessToken}${t}${stringToSign}`;
  headers["sign"] = hmacSha256Upper(SECRET_KEY, signStr);

  if (DBG) {
    console.log("[Tuya] fetch", {
      method,
      urlPath,
      withToken: !!opts?.withToken,
    });
  }

  const res = await fetch(url, {
    method,
    headers,
    body: bodyJson || undefined,
  });

  const text = await res.text();
  let parsed: TuyaEnvelope<T> | null = null;
  try {
    parsed = JSON.parse(text) as TuyaEnvelope<T>;
  } catch {
    throw new Error(
      `Tuya response not JSON (${res.status}): ${text.slice(0, 200)}`
    );
  }

  if (!parsed.success) {
    if (DBG) console.error("[Tuya] API error", parsed);
    throw new Error(
      `Tuya error ${parsed.code}: ${parsed.msg ?? "Unknown error"}`
    );
  }
  return parsed.result;
}

async function getAccessToken(): Promise<string> {
  // brug cache hvis gyldig
  if (tokenCache && tokenCache.expiresAt > Date.now() + 10_000) {
    return tokenCache.token;
  }
  if (!ACCESS_KEY || !SECRET_KEY) {
    throw new Error("Missing TUYA_ACCESS_KEY or TUYA_SECRET_KEY");
  }

  // Token-kald: med samme sign-procedure, men UDEN access_token
  const path = "/v1.0/token";
  const result = await fetchTuya<TokenResult>("GET", path, {
    query: { grant_type: 1 },
    withToken: false,
  });

  const ttlMs = Math.max(30_000, (result.expire_time ?? 3600) * 1000 - 60_000);
  tokenCache = { token: result.access_token, expiresAt: Date.now() + ttlMs };

  if (DBG) console.log("[Tuya] New token acquired, ttl(ms)=", ttlMs);
  return tokenCache.token;
}

/** --------- High-level helpers --------- */

type StatusItem = { code: string; value: unknown };

export async function getDeviceStatus(deviceId: string): Promise<StatusItem[]> {
  const path = `/v1.0/iot-03/devices/${deviceId}/status`;
  const result = await fetchTuya<StatusItem[]>("GET", path, {
    withToken: true,
  });
  if (DBG) console.log("[Tuya] status count", result.length);
  return result;
}

type SpecStatusItem = { code: string; type: string; values?: string };
type SpecResult = { status: SpecStatusItem[] };

async function getDeviceSpecifications(deviceId: string): Promise<SpecResult> {
  const path = `/v1.0/iot-03/devices/${deviceId}/specifications`;
  const result = await fetchTuya<SpecResult>("GET", path, { withToken: true });
  if (DBG) console.log("[Tuya] specs status count", result.status?.length ?? 0);
  return result;
}

function parseScale(values?: string): number {
  if (!values) return 0;
  try {
    const obj = JSON.parse(values) as { scale?: number };
    const s = typeof obj.scale === "number" ? obj.scale : 0;
    return Number.isFinite(s) ? s : 0;
  } catch {
    return 0;
  }
}

/** Find "scale" for et bestemt DP-code via specs.status[].values.scale */
export async function getScale(
  deviceId: string,
  code: string
): Promise<number> {
  const specs = await getDeviceSpecifications(deviceId);
  const st = specs.status?.find((s) => s.code === code);
  return parseScale(st?.values);
}

/** Læs °C for et bestemt datapunkt (fx "ch1_temp" eller "va_temperature") */
export async function getTempForCodeC(
  deviceId: string,
  code: string
): Promise<number> {
  const status = await getDeviceStatus(deviceId);
  const item = status.find((s) => s.code === code);
  if (!item) {
    throw new Error(`Datapoint "${code}" not found on device`);
  }

  const raw = Number(item.value);
  if (!Number.isFinite(raw)) {
    throw new Error(`Datapoint "${code}" value not numeric`);
  }

  // Bestem scale fra specs
  let scale = 0;
  try {
    scale = await getScale(deviceId, code);
  } catch (e) {
    if (DBG)
      console.warn(
        "[Tuya] getScale failed, fallback heuristic",
        (e as Error)?.message
      );
  }

  if (scale > 0) return raw / Math.pow(10, scale);
  // fallback: klassisk Tuya temperatur 241 => 24.1
  if (raw > 80 && raw < 2000) return raw / 10;
  return raw;
}

/** Convenience: pool-temperatur (default DP = ch1_temp, kan overrides via env) */
export async function getPoolTempC(deviceId: string): Promise<number> {
  const dp = process.env.TUYA_TEMP_DP_CODE?.trim() || "ch1_temp";
  return getTempForCodeC(deviceId, dp);
}
