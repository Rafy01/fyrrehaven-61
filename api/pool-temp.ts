import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPoolTempC } from "./_lib/tuya";

// Simpel validering af deviceId (Tuya-IDs er typisk 16–64 alfanumeriske)
function badId(id: string): boolean {
  return !/^[A-Za-z0-9]{16,64}$/.test(id);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // id via query > ENV fallback
    const rawId = (
      typeof req.query.id === "string"
        ? req.query.id
        : process.env.TUYA_POOL_DEVICE_ID || ""
    ).trim();

    if (!rawId || badId(rawId)) {
      return res.status(400).json({ ok: false, error: "Bad device id format" });
    }

    const c = await getPoolTempC(rawId);

    // CDN/edge cache – 30 sekunder
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
    const msg = err instanceof Error ? err.message : "Unknown server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
