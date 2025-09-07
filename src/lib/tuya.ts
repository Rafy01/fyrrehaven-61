import { TuyaContext } from "@tuya/tuya-connector-nodejs";

export const tuya = new TuyaContext({
  baseUrl: process.env.TUYA_BASE_URL ?? "https://openapi.tuyaeu.com",
  accessKey: process.env.TUYA_ACCESS_KEY!,
  secretKey: process.env.TUYA_SECRET!,
});

type StatusItem = { code: string; value: unknown };

export async function getPoolTempC(deviceId: string): Promise<number> {
  // 1) Hent status (alle datapunkter)
  const st = await tuya.request<{ result: StatusItem[] }>({
    path: `/v1.0/iot-03/devices/${deviceId}/status`,
    method: "GET",
  });
  const list = st.result || [];

  // Find et felt der ligner temperatur
  const pref = ["water_temp", "temp_current", "va_temperature", "temperature"];
  const hit = list.find((x) => pref.includes(x.code));
  if (!hit) throw new Error("Temperature datapoint not found");

  // 2) Tjek scale (om værdien er i tiendedele)
  let scalePow = 0;
  try {
    const spec = await tuya.request<any>({
      path: `/v1.0/iot-03/devices/${deviceId}/specifications`,
      method: "GET",
    });
    const fn = (spec?.result?.functions || []).find(
      (f: any) => f.code === hit.code
    );
    if (fn?.values) {
      const v = JSON.parse(fn.values); // {min,max,step,unit,scale?}
      if (Number.isFinite(v.scale)) scalePow = Number(v.scale);
    }
  } catch {
    /* optional – fortsæt uden scale */
  }

  const raw = Number(hit.value);
  const tempC = Number.isFinite(raw) ? raw / Math.pow(10, scalePow) : NaN;
  if (!Number.isFinite(tempC)) throw new Error("Invalid temperature value");
  return tempC;
}
