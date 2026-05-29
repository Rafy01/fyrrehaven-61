// api/pool-temp.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPoolTempC } from "./_lib/tuya.js"; // <- BEVAR .js

const DEBUG =
  process.env.DEBUG_POOL_TEMP === "1" || process.env.DEBUG_POOL_TEMP === "true";

function log(...args: unknown[]) {
  if (DEBUG) console.log("[pool-temp]", ...args);
}

function badId(id: string) {
  return !/^[A-Za-z0-9]{16,64}$/.test(id);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startedAt = Date.now();
  try {
    log("incoming", { method: req.method, query: req.query });

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      log("405 Method Not Allowed");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // vælg deviceId: ?id=… eller env
    const envId = (
      process.env.TUYA_POOL_DEVICE_ID ||
      process.env.TUYA_DEVICE_ID ||
      ""
    ).trim();
    const qId = typeof req.query.id === "string" ? req.query.id.trim() : "";
    const deviceId = qId || envId;

    log("device id resolution", {
      fromQuery: qId || null,
      fromEnvPresent: Boolean(envId),
      final: deviceId || null,
    });

    if (!deviceId || badId(deviceId)) {
      log("400 bad device id format");
      return res.status(400).json({ ok: false, error: "Bad device id format" });
    }

    // env presence (ikke værdier!)
    log("env presence", {
      TUYA_BASE_URL: !!process.env.TUYA_BASE_URL,
      TUYA_ACCESS_KEY: !!process.env.TUYA_ACCESS_KEY,
      TUYA_SECRET: !!process.env.TUYA_SECRET,
    });

    console.time("getPoolTempC");
    const celsius = await getPoolTempC(deviceId);
    console.timeEnd("getPoolTempC");

    log("success", { celsius });

    // 30 sek cache i edge + SWR
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=30"
    );
    return res.status(200).json({
      ok: true,
      celsius,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const msg = err instanceof Error ? err.message : String(err);
    log("500 error", {
      elapsedMs: elapsed,
      message: msg,
      stack: err instanceof Error ? err.stack : null,
    });
    return res.status(500).json({ ok: false, error: msg });
  }
}
