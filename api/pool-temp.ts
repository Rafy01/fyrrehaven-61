// api/pool-temp.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPoolTempC } from "../src/lib/tuya"; // ⟵ RELATIV sti! ingen .ts-efternavn

function badId(id: string): boolean {
  return !/^[A-Za-z0-9]{16,64}$/.test(id);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // id via query ?id=... eller fra env TUYA_POOL_DEVICE_ID
    const rawId = (
      typeof req.query.id === "string"
        ? req.query.id
        : process.env.TUYA_POOL_DEVICE_ID ?? ""
    ).trim();

    if (!rawId || badId(rawId)) {
      return res.status(400).json({ ok: false, error: "Bad device id format" });
    }

    const celsius = await getPoolTempC(rawId);

    // let den cache 30s
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
    console.error("[pool-temp] handler error:", err);
    const msg = err instanceof Error ? err.message : "Unknown server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
