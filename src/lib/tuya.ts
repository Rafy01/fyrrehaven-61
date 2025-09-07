// src/lib/tuya.ts
import { TuyaContext } from "@tuya/tuya-connector-nodejs";

/**
 * Required env vars:
 *  - TUYA_BASE_URL   (e.g. "https://openapi.tuyaeu.com")
 *  - TUYA_ACCESS_KEY
 *  - TUYA_SECRET
 */
const BASE_URL =
  process.env.TUYA_BASE_URL?.trim() || "https://openapi.tuyaeu.com";
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY!;
const SECRET_KEY = process.env.TUYA_SECRET!;

if (!ACCESS_KEY || !SECRET_KEY) {
  throw new Error(
    "[tuya] Missing TUYA_ACCESS_KEY and/or TUYA_SECRET environment variables"
  );
}

/** Shared Tuya client */
export const tuya = new TuyaContext({
  baseUrl: BASE_URL,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export type StatusItem = { code: string; value: unknown };

type SpecFunction = { code: string; type: string; values?: string };
type SpecStatus = { code: string; type: string; values?: string };

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/** Wrap TuyaContext.request and return the unwrapped `result` typed as T */
/* Helpers
   ------------------------------------------------------------------ */

type TuyaErr = { success: false; code?: string | number; msg?: string };
type TuyaOk<T> = { success?: true; result?: T }; // Tuya types sometimes omit success/result in d.ts

function isTuyaErr(x: unknown): x is TuyaErr {
  return !!x && typeof (x as { success?: boolean }).success === "boolean"
         && (x as { success?: boolean }).success === false;
}

/** Wrap TuyaContext.request and return the unwrapped `result` typed as T */
async function tuyaGet<T>(path: string): Promise<T> {
  const res = await tuya.request<T>({ path, method: "GET" });

  if (isTuyaErr(res)) {
    const code = res.code ?? "";
    const msg = res.msg ?? "Unknown Tuya error";
    throw new Error(`[tuya] ${code} ${msg}`.trim());
  }

  const ok = res as TuyaOk<T>;
  if (ok.result === undefined || ok.result === null) {
    throw new Error("[tuya] Missing result payload");
  }
  return ok.result as T;
}

/** Small error helper */
function fail(where: string, msg: string): never {
  throw new Error(`[tuya:${where}] ${msg}`);
}

/** Coerce unknown DP value to number */
function coerceNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

/** Cache scale (decimal places) per device+dp code */
const SCALE_CACHE = new Map<string, number>();

/** Read DP "scale" (decimal places) from device specifications, default 0 */
async function getDpScale(deviceId: string, code: string): Promise<number> {
  const key = `${deviceId}:${code}`;
  const cached = SCALE_CACHE.get(key);
  if (typeof cached === "number") return cached;

  const spec = await tuyaGet<{
    functions?: SpecFunction[];
    status?: SpecStatus[];
  }>(`/v1.0/iot-03/devices/${deviceId}/specifications`);

  const entry =
    (spec.functions ?? []).find((f) => f.code === code) ??
    (spec.status ?? []).find((s) => s.code === code);

  let scale = 0;
  if (entry?.values) {
    try {
      const parsed = JSON.parse(entry.values) as { scale?: number } | undefined;
      if (parsed && typeof parsed.scale === "number") scale = parsed.scale;
    } catch {
      /* ignore and keep scale=0 */
    }
  }

  SCALE_CACHE.set(key, scale);
  return scale;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Public API                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/** Fetch all datapoints (status) for a device */
export async function getDeviceStatus(deviceId: string): Promise<StatusItem[]> {
  const list = await tuyaGet<StatusItem[]>(
    `/v1.0/iot-03/devices/${deviceId}/status`
  );
  return Array.isArray(list) ? list : [];
}

/**
 * Find a temperature-like DP and return temperature in °C.
 * Respects the DP's `scale` if present.
 */
export async function getPoolTempC(deviceId: string): Promise<number> {
  const status = await getDeviceStatus(deviceId);
  if (!status.length) fail("status", "No datapoints returned for device");

  // Try common temperature codes
  const preferred = [
    "water_temp",
    "temp_current",
    "va_temperature",
    "temperature",
  ];
  const hit =
    status.find((s) => preferred.includes(s.code)) ??
    status.find((s) => /temp/i.test(s.code));

  if (!hit) {
    fail(
      "find-dp",
      `Temperature datapoint not found. Tried: ${preferred.join(", ")}`
    );
  }

  const scale = await getDpScale(deviceId, hit.code);
  const raw = coerceNumber(hit.value);
  if (!Number.isFinite(raw)) fail("parse", `Non-numeric value for ${hit.code}`);

  const tempC = scale ? raw / Math.pow(10, scale) : raw;

  // Sanity guard (adjust to your real-world range if needed)
  if (!Number.isFinite(tempC) || tempC < -40 || tempC > 90) {
    fail(
      "range",
      `Out-of-range temperature "${tempC}" from code "${hit.code}" (raw=${raw}, scale=${scale})`
    );
  }

  return tempC;
}
