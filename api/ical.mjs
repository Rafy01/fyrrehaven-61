// /api/ical.mjs  (ESM)
export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const ICAL_URL = process.env.ICAL_URL;
    if (!ICAL_URL) {
      res.status(500).json({ ok: false, error: "ENV_MISSING:ICAL_URL" });
      return;
    }

    // (valgfri) filtrering på interval – ellers henter vi hele feed’et
    const { from, to } = req.query ?? {};

    const r = await fetch(ICAL_URL);
    if (!r.ok) throw new Error(`Fetch iCal failed ${r.status}`);
    const ics = await r.text();

    // Minimal iCal parsing (VALUE=DATE og DATE-TIME)
    const events = [];
    let cur = null;

    const lines = ics
      .split(/\r?\n/)
      // fold continuation lines
      .reduce((acc, ln) => {
        if (/^[ \t]/.test(ln) && acc.length) {
          acc[acc.length - 1] += ln.slice(1);
        } else acc.push(ln);
        return acc;
      }, []);

    for (const ln of lines) {
      if (ln === "BEGIN:VEVENT") cur = {};
      else if (ln === "END:VEVENT") {
        if (cur?.start && cur?.end) events.push(cur);
        cur = null;
      } else if (cur) {
        if (ln.startsWith("DTSTART"))
          cur.start = parseIcsDate(extractValue(ln));
        else if (ln.startsWith("DTEND"))
          cur.end = parseIcsDate(extractValue(ln));
        else if (ln.startsWith("SUMMARY:")) cur.title = ln.slice(8).trim();
      }
    }

    // standard iCal er end eksklusiv (checkout-dato)
    // filter hvis der kom from/to
    const filtered =
      !from || !to
        ? events
        : events.filter((e) => overlapsRange(e.start, e.end, from, to));

    // returnér ISO-dage (yyyy-mm-dd)
    res.status(200).json({
      ok: true,
      bookings: filtered.map((e) => ({
        start: toIsoDate(e.start),
        end: toIsoDate(e.end),
        title: e.title ?? "",
      })),
    });
  } catch (err) {
    console.error("ICAL_ERROR", err);
    res.status(500).json({ ok: false, error: "ICAL_ERROR" });
  }
}

function extractValue(line) {
  const idx = line.indexOf(":");
  return idx >= 0 ? line.slice(idx + 1) : "";
}
function parseIcsDate(v) {
  // VALUE=DATE: YYYYMMDD
  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    return new Date(Date.UTC(y, m - 1, d));
  }
  // DATE-TIME (evt. Z)
  // Vi normaliserer til UTC
  return new Date(v);
}
function toIsoDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function overlapsRange(start, end, fromIso, toIso) {
  // [start, end) overlapper [from, to)
  return !(end <= fromIso || start >= toIso);
}
