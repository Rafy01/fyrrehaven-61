import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPoolTempC } from "../src/lib/tuya";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // deviceId: ?id=... (til test) ellers fra ENV
    const rawId = (
      typeof req.query.id === "string"
        ? req.query.id
        : process.env.TUYA_POOL_DEVICE_ID || ""
    ).trim();

    if (!rawId) {
      return res.status(400).json({ ok: false, error: "Bad device id format" });
    }

    const c = await getPoolTempC(rawId);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=30"
    );
    return res.status(200).json({
      ok: true,
      celsius: c,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Log til Vercel logs for nem fejlfinding
    console.error("[pool-temp] ERROR", err);
    const msg = err instanceof Error ? err.message : "Unknown server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
