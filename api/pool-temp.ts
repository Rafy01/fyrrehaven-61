import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPoolTempC, isValidDeviceId } from "../src/lib/tuya";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const rawId = (
      typeof req.query.id === "string"
        ? req.query.id
        : process.env.TUYA_POOL_DEVICE_ID || ""
    ).trim();

    if (!rawId || !isValidDeviceId(rawId)) {
      return res.status(400).json({ ok: false, error: "Bad device id format" });
    }

    const dp =
      typeof req.query.dp === "string"
        ? req.query.dp
        : process.env.TUYA_TEMP_DP || undefined;

    const c = await getPoolTempC(rawId, dp);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=30"
    );
    return res.status(200).json({
      ok: true,
      celsius: c,
      dp: dp ?? "auto",
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[pool-temp] ERROR", err);
    const msg = err instanceof Error ? err.message : "Unknown server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
