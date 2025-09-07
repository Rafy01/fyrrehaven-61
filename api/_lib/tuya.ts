// api/_lib/tuya.ts
import crypto from "node:crypto";

/** -- Miljø -- */
const BASE_URL = process.env.TUYA_BASE_URL ?? "https://openapi.tuyaeu.com";
const CLIENT_ID = process.env.TUYA_ACCESS_KEY!;
const SECRET = process.env.TUYA_SECRET!;

if (!CLIENT_ID || !SECRET) {
  throw new Error(
    "Missing TUYA_ACCESS_KEY / TUYA_SECRET env vars. Set them in your hosting environment."
  );
}

/** Token-cache i memory (serverless instans) */
let cachedToken: { token: string; expiresAt: number } | null = null;

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function hmac256Upper(key: string, data: string) {
  return crypto
    .createHmac("sha256", key)
    .update(data)
    .digest("hex")
    .toUpperCase();
}

/** Hent (og cache) access_token */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.token;
  }

  const t = String(now);
  const sign = hmac256Upper(SECRET, CLIENT_ID + t);

  const r = await fetch(`${BASE_URL}/v1.0/token?grant_type=1`, {
    method: "GET",
    headers: {
      client_id: CLIENT_ID,
      t: t,
      sign_method: "HMAC-SHA256",
      sign: sign,
    },
  });

  const j = await r.json();
  if (!j?.success) throw new Error(`Tuya token error: ${j?.msg ?? "unknown"}`);

  const token: string = j.result.access_token;
  const expiresSec: number = j.result.expire_time; // seconds
  cachedToken = {
    token,
    expiresAt: now + Math.max(30, expiresSec - 120) * 1000,
  };
  return token;
}

/** Signér og kald Tuya OpenAPI (V2-signature) */
async function tuyaRequest<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const accessToken = await getAccessToken();
  const t = String(Date.now());
  const bodyStr = body ? JSON.stringify(body) : "";
  const contentHash = sha256Hex(bodyStr);
  const stringToSign = [method.toUpperCase(), contentHash, "", path].join("\n");
  const signStr = CLIENT_ID + accessToken + t + stringToSign;
  const sign = hmac256Upper(SECRET, signStr);

  const r = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      client_id: CLIENT_ID,
      t: t,
      sign_method: "HMAC-SHA256",
      sign: sign,
      access_token: accessToken,
      "Content-Type": "application/json",
    },
    body: bodyStr || undefined,
  });

  const j = await r.json();
  if (!j?.success) {
    const code = j?.code ?? "E_TUYA";
    const msg = j?.msg ?? "Tuya request failed";
    throw new Error(`${code}: ${msg}`);
  }
  return j.result as T;
}

/** Læs va_temperature og divider med scale=1 → tiendedele grader */
export async function getPoolTempC(deviceId: string): Promise<number> {
  type StatusItem = { code: string; value: number | string };
  const list = await tuyaRequest<StatusItem[]>(
    `/v1.0/iot-03/devices/${deviceId}/status`,
    "GET"
  );

  const raw = Number(list.find((x) => x.code === "va_temperature")?.value);
  if (!Number.isFinite(raw)) throw new Error("Temperature datapoint not found");

  // Spec siger scale=1 → værdien er i tiendedele grader
  return raw / 10;
}
