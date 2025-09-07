// api/pool-dps.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getAllDeviceData,
} from "./_lib/tuya.js"; // <- vigtigt at bruge .js når du importerer fra TS i Vercel

function badId(id: string) {
  return !/^[A-Za-z0-9]{16,64}$/.test(id);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const envId = (
      process.env.TUYA_POOL_DEVICE_ID ||
      process.env.TUYA_DEVICE_ID ||
      ""
    ).trim();
    const qId = typeof req.query.id === "string" ? req.query.id.trim() : "";
    const deviceId = qId || envId;

    if (!deviceId || badId(deviceId)) {
      return res.status(400).json({ ok: false, error: "Bad device id format" });
    }

    const data = await getAllDeviceData(deviceId);

    // Kort cache – status ændrer sig relativt ofte
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=20, stale-while-revalidate=40"
    );
    return res.status(200).json({ ok: true, deviceId, ...data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: msg });
  }
}