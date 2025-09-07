// src/lib/tuya.ts
// Kræver miljøvariabler:
//  - TUYA_ACCESS_KEY
//  - TUYA_SECRET
//  - (valgfri) TUYA_BASE_URL  [default: https://openapi.tuyaeu.com]

import * as Tuya from "@tuya/tuya-connector-nodejs";

/** --------- Typer for Tuya-svar (minimale) --------- */
type TuyaResp<T> = {
  success: boolean;
  t: number;
  code?: number | string;
  msg?: string;
  result: T;
};

type StatusItem = { code: string; value: unknown };

type SpecFn = { code: string; values?: string };
type DeviceSpec = { functions?: SpecFn[] };

/** Minimal runtime-interface for TuyaContext vi bruger */
type TuyaRequestOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
};
interface ITuyaContext {
  request<T>(opts: TuyaRequestOptions): Promise<TuyaResp<T>>;
}
type TuyaContextCtor = new (opts: {
  baseUrl?: string;
  accessKey: string;
  secretKey: string;
}) => ITuyaContext;

/** Hent konstruktør fra pakken og cast til vores ctor-type */
const TuyaContext = (Tuya as unknown as { TuyaContext: TuyaContextCtor })
  .TuyaContext;

/** ---------- Context init + env ---------- */
let _ctx: ITuyaContext | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getCtx(): ITuyaContext {
  if (_ctx) return _ctx;
  const baseUrl = process.env["TUYA_BASE_URL"] || "https://openapi.tuyaeu.com";
  const accessKey = requireEnv("TUYA_ACCESS_KEY");
  const secretKey = requireEnv("TUYA_SECRET");
  _ctx = new TuyaContext({ baseUrl, accessKey, secretKey });
  return _ctx;
}

/** Wrap TuyaContext.request og returnér "result" typed som T */
async function tuyaGet<T>(path: string): Promise<T> {
  const ctx = getCtx();
  const res = await ctx.request({ path, method: "GET" }) as TuyaResp<T>;
  if (!res?.success) {
    const code = res?.code ?? "E_TUYA";
    const msg = res?.msg ?? "Unknown Tuya error";
    throw new Error(`[tuya] ${code} ${msg}`);
  }
  return res.result;
}

/** ---------- Scale-cache (deviceId+code -> scalePow) ---------- */
const SCALE_CACHE = new Map<string, number>(); // key = `${deviceId}:${code}`

async function getScalePow(deviceId: string, code: string): Promise<number> {
  const key = `${deviceId}:${code}`;
  const hit = SCALE_CACHE.get(key);
  if (typeof hit === "number") return hit;

  const spec = await tuyaGet<DeviceSpec>(
    `/v1.0/iot-03/devices/${deviceId}/specifications`
  );

  let pow = 0;
  const fn = spec?.functions?.find((f) => f.code === code);
  if (fn?.values) {
    try {
      const parsed = JSON.parse(fn.values) as { scale?: number };
      if (
        typeof parsed.scale === "number" &&
        Number.isFinite(parsed.scale) &&
        parsed.scale >= 0
      ) {
        pow = parsed.scale;
      }
    } catch {
      /* ignorer uparse-bare values */
    }
  }

  SCALE_CACHE.set(key, pow);
  return pow;
}

/** Læs første numeriske DP fra en liste af mulige koder, returnér [code, rawValue] */
async function readFirstNumberDp(
  deviceId: string,
  codes: readonly string[]
): Promise<{ code: string; raw: number }> {
  const list = await tuyaGet<StatusItem[]>(
    `/v1.0/iot-03/devices/${deviceId}/status`
  );

  for (const it of list ?? []) {
    if (!codes.includes(it.code)) continue;
    const n =
      typeof it.value === "number" ? it.value : Number(String(it.value));
    if (Number.isFinite(n)) {
      return { code: it.code, raw: n };
    }
  }
  throw new Error("Temperature datapoint not found");
}

/** Primær eksport: hent pool-temperatur i °C for et device-id */
const TEMP_CODES: readonly string[] = [
  "ch1_temp", // din sensor
  "temp_current",
  "va_temperature",
  "water_temp",
  "temperature",
];

export async function getPoolTempC(deviceId: string): Promise<number> {
  // Find rå-værdi + hvilken kode der blev ramt
  const { code, raw } = await readFirstNumberDp(deviceId, TEMP_CODES);

  // Hent scale (decimaler) for netop den DP-kode
  const pow = await getScalePow(deviceId, code);

  const c = raw / Math.pow(10, pow);
  if (!Number.isFinite(c)) throw new Error("Invalid temperature value");
  return c;
}
