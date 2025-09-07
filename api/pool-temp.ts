// api/pool-temp.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTempForCodeC, getPoolTempC } from "./_lib/tuya";

function badId(id: string): boolean {
  return !/^[A-Za-z0-9]{16,64}$/.test(id);
}
function badDp(dp: string): boolean {
  // tillad a-z0-9_ (Tuya DP codes)
  return !/^[a-z0-9_]{2,40}$/.test(dp);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const deviceId = (
      typeof req.query.id === "string"
        ? req.query.id
        : process.env.TUYA_POOL_DEVICE_ID || ""
    ).trim();

    if (!deviceId || badId(deviceId)) {
      return res.status(400).json({ ok: false, error: "Bad device id format" });
    }

    const dpQuery =
      typeof req.query.dp === "string" ? req.query.dp.trim() : undefined;

    const dp =
      dpQuery && !badDp(dpQuery)
        ? dpQuery
        : process.env.TUYA_TEMP_DP_CODE?.trim() || "ch1_temp";

    const c = dp
      ? await getTempForCodeC(deviceId, dp)
      : await getPoolTempC(deviceId);

    // CDN-cache på edge 30 sekunder
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=30"
    );

    return res.status(200).json({
      ok: true,
      celsius: c,
      dp,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
