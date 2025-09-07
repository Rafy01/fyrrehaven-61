// src/lib/tuya.ts
import TuyaContext from "@tuya/tuya-connector-nodejs";

/* ---- Response & spec types ---- */
type TuyaResp<T> = {
  success: boolean;
  t: number;
  code?: number | string;
  msg?: string;
  result: T;
};

type StatusItem = { code: string; value: unknown };
type StatusList = StatusItem[];
type SpecFn = { code: string; values?: string };
type DeviceSpec = { functions?: SpecFn[] };

/* ---- singleton ctx ---- */
let _ctx: TuyaContext | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getCtx(): TuyaContext {
  if (_ctx) return _ctx;
  // use bracket access to satisfy noPropertyAccessFromIndexSignature
  const baseUrl = process.env["TUYA_BASE_URL"] || "https://openapi.tuyaeu.com";
  const accessKey = requireEnv("TUYA_ACCESS_KEY");
  const secretKey = requireEnv("TUYA_SECRET");
  _ctx = new TuyaContext({ baseUrl, accessKey, secretKey });
  return _ctx;
}

/* ---- small request wrapper ---- */
async function tuyaGet<T>(path: string): Promise<T> {
  const ctx = getCtx();
  const res = await ctx.request<TuyaResp<T>>({ path, method: "GET" });
  if (!res?.success) {
    const code = res?.code ?? "E_TUYA";
    const msg = res?.msg ?? "Unknown Tuya error";
    throw new Error(`[tuya] ${code} ${msg}`);
  }
  return res.result;
}

/* ---- scale cache ---- */
const SCALE_CACHE = new Map<string, number>(); // key = `${deviceId}:${code}`

async function getScalePow(deviceId: string, code: string): Promise<number> {
  const key = `${deviceId}:${code}`;
  const hit = SCALE_CACHE.get(key);
  if (typeof hit === "number") return hit;

  const spec = await tuyaGet<DeviceSpec>(
    `/v1.0/iot-03/devices/${deviceId}/specifications`
  );
  const fn = spec.functions?.find((f) => f.code === code);
  if (!fn?.values) {
    SCALE_CACHE.set(key, 0);
    return 0;
  }
  try {
    const parsed = JSON.parse(fn.values) as { scale?: number };
    const pow = typeof parsed.scale === "number" ? parsed.scale : 0;
    SCALE_CACHE.set(key, pow);
    return pow;
  } catch {
    SCALE_CACHE.set(key, 0);
    return 0;
  }
}

export function isValidDeviceId(id: string): boolean {
  return /^[A-Za-z0-9]{16,64}$/.test(id);
}

/** Read a numeric DP (temperature-like) and return °C */
export async function getDpNumberC(
  deviceId: string,
  code: string
): Promise<number> {
  const list = await tuyaGet<StatusList>(
    `/v1.0/iot-03/devices/${deviceId}/status`
  );
  const item = list.find((x) => x.code === code);
  if (!item) throw new Error(`Datapoint ${code} not found`);

  const raw = Number(item.value);
  if (!Number.isFinite(raw)) throw new Error(`Invalid value for ${code}`);

  const scalePow = await getScalePow(deviceId, code);
  const value = raw / Math.pow(10, scalePow);
  if (!Number.isFinite(value))
    throw new Error(`Scaled value invalid for ${code}`);
  return value;
}

/**
 * Pool temperature in °C.
 * Priority:
 *   1) dpCode argument
 *   2) ENV TUYA_TEMP_DP
 *   3) fallback list (starts with ch1_temp)
 */
export async function getPoolTempC(
  deviceId: string,
  dpCode?: string
): Promise<number> {
  if (!isValidDeviceId(deviceId)) throw new Error("Bad device id format");

  const prefer = dpCode || process.env["TUYA_TEMP_DP"] || "";
  if (prefer) return getDpNumberC(deviceId, prefer);

  const candidates = [
    "ch1_temp",
    "temp_current",
    "va_temperature",
    "temperature",
    "temp_value",
    "temperature_current",
    "water_temp",
  ];

  for (const code of candidates) {
    try {
      return await getDpNumberC(deviceId, code);
    } catch {
      // try next
    }
  }
  throw new Error("Temperature datapoint not found");
}
