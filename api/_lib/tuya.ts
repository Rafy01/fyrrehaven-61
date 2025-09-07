import { TuyaContext } from "@tuya/tuya-connector-nodejs";

/* ---------- Typer fra Tuya-respons ---------- */
type TuyaResp<T> = {
  success: boolean;
  t: number;
  code?: number | string;
  msg?: string;
  result: T;
};

type StatusItem = { code: string; value: unknown };
type DeviceStatusRes = { result: StatusItem[] };
type DeviceSpecRes = {
  result: {
    functions?: Array<{
      code: string;
      values?: string; // JSON-encoded string with {min,max,step,unit,scale?}
    }>;
  };
};

/* ---------- Singleton-kontekst + ENV ---------- */
let _ctx: TuyaContext | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getCtx(): TuyaContext {
  if (_ctx) return _ctx;
  // Default til EU hvis intet er sat
  const baseUrl = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";
  const accessKey = requireEnv("TUYA_ACCESS_KEY");
  const secretKey = requireEnv("TUYA_SECRET");
  _ctx = new TuyaContext({ baseUrl, accessKey, secretKey });
  return _ctx;
}

/* ---------- Lille helper til GET ---------- */
async function tuyaGet<T>(path: string): Promise<T> {
  const ctx = getCtx();
  const res = await ctx.request({ path, method: "GET" }) as TuyaResp<T>;
  if (!res.success) {
    const code = res.code ?? "E_TUYA";
    const msg = res.msg ?? "Unknown Tuya error";
    throw new Error(`[tuya] ${code} ${msg}`);
  }
  return res.result;
}

/* ---------- Scale-cache (deviceId+code) ---------- */
const SCALE_CACHE = new Map<string, number>(); // key: `${deviceId}:${code}`

async function getScalePow(deviceId: string, code: string): Promise<number> {
  const key = `${deviceId}:${code}`;
  const cached = SCALE_CACHE.get(key);
  if (cached !== undefined) return cached;

  // Hent specifikationer og find funktionsfeltet for koden
  const spec = await tuyaGet<DeviceSpecRes>(
    `/v1.0/iot-03/devices/${deviceId}/specifications`
  );
  const fn = spec.result.functions?.find((f) => f.code === code);
  let pow = 0;
  if (fn?.values) {
    try {
      const v = JSON.parse(fn.values) as { scale?: number };
      if (Number.isFinite(v.scale)) pow = Number(v.scale);
    } catch {
      // ignorer – brug 0
    }
  }
  SCALE_CACHE.set(key, pow);
  return pow;
}

/* ---------- Hent temperatur i °C for et device ---------- */
export async function getPoolTempC(deviceId: string): Promise<number> {
  // 1) Hent alle statuspunkter
  const st = await tuyaGet<DeviceStatusRes>(
    `/v1.0/iot-03/devices/${deviceId}/status`
  );
  const list = st.result || [];

  // 2) Vælg den mest relevante datapunkt-kode
  const preferred = [
    "ch1_temp", // <- din vigtigste
    "water_temp",
    "temp_current",
    "va_temperature",
    "temperature",
  ];
  const hit = list.find((x) => preferred.includes(x.code));
  if (!hit) throw new Error("Temperature datapoint not found");

  // 3) Scale (ofte er værdien i tiendedele)
  const scalePow = await getScalePow(deviceId, hit.code);

  const rawNum = Number(hit.value);
  const c = Number.isFinite(rawNum) ? rawNum / Math.pow(10, scalePow) : NaN;
  if (!Number.isFinite(c)) {
    throw new Error("Invalid temperature value");
  }
  return c;
}
