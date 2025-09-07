// src/lib/tuya.ts
import { TuyaContext } from "@tuya/tuya-connector-nodejs";

/** Tuya kontekst */
const baseUrl = (
  process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com"
).trim();
const accessKey = (process.env.TUYA_ACCESS_KEY || "").trim();
const secretKey = (process.env.TUYA_SECRET || "").trim();

if (!accessKey || !secretKey) {
  // Kast tidligt – så man ser fejlen tydeligt i logs
  throw new Error("Missing TUYA_ACCESS_KEY / TUYA_SECRET env vars");
}

export const tuya = new TuyaContext({
  baseUrl,
  accessKey,
  secretKey,
});


export type StatusItem = { code: string; value: unknown; t?: number };

type DeviceStatus = StatusItem[];
type SpecFunction = { code: string; type: string; values?: string };
type DeviceSpecifications = { functions: SpecFunction[] };

/* ─────────────────────── Helpers (typed) ─────────────────────── */

async function tuyaGet<T>(path: string): Promise<T> {
  const res = await tuya.request<{ success: boolean; t: number; tid: string; result: T; code?: number; msg?: string }>({
    path,
    method: "GET",
  });

  if (!res?.success) {
    const code = typeof res?.code === "number" ? res.code : undefined;
    const msg = res?.msg ?? "Unknown Tuya error";
    throw new Error(`[tuya] ${code ?? ""} ${msg}`.trim());
  }
  return res.result as T;
}

/* ───────────────── Temperature fetch ───────────────── */

const TEMP_DP_CANDIDATES = [
  "water_temp",
  "temp_current",
  "va_temperature",
  "temperature",
];

/**
 * Hent temperatur i °C for en given Tuya deviceId.
 * Håndterer scale (fx 286 -> 28.6 hvis scale=1).
 */
export async function getPoolTempC(deviceId: string): Promise<number> {
  // 1) Status (alle datapunkter)
  const list = await tuyaGet<DeviceStatus>(
    `/v1.0/iot-03/devices/${deviceId}/status`
  );

  // 2) Find et temp-agtigt datapunkt
  const hit = list.find((x) => TEMP_DP_CANDIDATES.includes(x.code));
  if (!hit) throw new Error("Temperature datapoint not found");

  // 3) Hent scale for det pågældende DP (valgfrit – men giver korrekt decimal)
  let scalePow = 0;
  try {
    const spec = await tuyaGet<DeviceSpecifications>(
      `/v1.0/iot-03/devices/${deviceId}/specifications`
    );
    const fn = (spec.functions || []).find((f) => f.code === hit.code);
    if (fn?.values) {
      // values er en JSON-string med fx: {"unit":"°C","min":0,"max":600,"scale":1,"step":1}
      const v = JSON.parse(fn.values) as { scale?: number };
      if (typeof v.scale === "number" && Number.isFinite(v.scale)) {
        scalePow = v.scale;
      }
    }
  } catch {
    // Ignorer – vi kan godt leve uden scale, men prøver at være præcis
  }

  // 4) Normaliser værdi
  const raw =
    typeof hit.value === "number"
      ? hit.value
      : typeof hit.value === "string"
      ? Number(hit.value)
      : NaN;

  const celsius = Number.isFinite(raw) ? raw / Math.pow(10, scalePow) : NaN;
  if (!Number.isFinite(celsius)) throw new Error("Invalid temperature value");

  return celsius;
}
