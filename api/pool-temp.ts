import type { NextApiRequest, NextApiResponse } from "next"; // fjern hvis ikke Next
import { getPoolTempC } from "../src/lib/tuya";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const id = process.env.TUYA_DEVICE_ID_POOL!;
    const tempC = await getPoolTempC(id);

    // kort cache – Tuya har rate limits
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ ok: true, tempC });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? "Tuya error" });
  }
}
