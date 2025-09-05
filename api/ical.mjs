// /api/ical.mjs  (ESM – passer til din opsætning)
// Henter en offentlig iCloud/Apple Calendar (webcal://) ICS, parser VEVENTs og returnerer JSON.

const REQ_TIMEOUT_MS = 15000;

/** Kræv env-variabel */
function reqEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error(`ENV_MISSING:${k}`);
  return v;
}

/** Fold ICS-linjer (RFC5545: continuation lines begynder med space) */
function unfoldIcs(icsText) {
  const lines = icsText.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    if (/^[ \t]/.test(line) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Parse en ICS datoværdi til JS Date + allDay-flag */
function parseIcsDate(val, tzid) {
  // Eksempler:
  // - All day: 20250905
  // - Lokal tid: 20250905T140000
  // - UTC: 20250905T140000Z
  if (/^\d{8}$/.test(val)) {
    const y = Number(val.slice(0, 4));
    const m = Number(val.slice(4, 6)) - 1;
    const d = Number(val.slice(6, 8));
    return { date: new Date(y, m, d, 0, 0, 0), allDay: true };
  }
  const y = Number(val.slice(0, 4));
  const m = Number(val.slice(4, 6)) - 1;
  const d = Number(val.slice(6, 8));
  const hh = Number(val.slice(9, 11) || "0");
  const mm = Number(val.slice(11, 13) || "0");
  const ss = Number(val.slice(13, 15) || "0");
  const isUtc = val.endsWith("Z");

  // Uden Z og uden tz-bibliotek: tolker som lokal tid (typisk fint for Danmark).
  const date = isUtc
    ? new Date(Date.UTC(y, m, d, hh, mm, ss))
    : new Date(y, m, d, hh, mm, ss);

  return { date, allDay: false, tzid: tzid || null };
}

/** Parse ICS til events (kun de vigtigste felter) */
function parseEvents(icsText) {
  const lines = unfoldIcs(icsText);
  const events = [];
  let cur = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.dtstart && cur.dtend) {
        events.push(cur);
      } else if (cur && cur.dtstart) {
        // Nogle ICS har ikke DTEND for heldagsevents -> antag +1 dag
        const dt = cur.dtstart;
        if (dt.allDay) {
          const end = new Date(dt.date.getTime());
          end.setDate(end.getDate() + 1);
          cur.dtend = { date: end, allDay: true };
          events.push(cur);
        }
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    // Split key;params:value
    // Eksempel: DTSTART;TZID=Europe/Copenhagen:20250905T140000
    const m = line.match(/^([^:;]+)(?:;([^:]+))?:(.*)$/);
    if (!m) continue;
    const [, key, paramStr = "", value] = m;

    const params = {};
    if (paramStr) {
      for (const chunk of paramStr.split(";")) {
        const [pk, pv] = chunk.split("=");
        if (pk && pv) params[pk.toUpperCase()] = pv;
      }
    }

    switch (key.toUpperCase()) {
      case "UID":
        cur.uid = value;
        break;
      case "SUMMARY":
        cur.summary = value;
        break;
      case "DESCRIPTION":
        cur.description = value;
        break;
      case "LOCATION":
        cur.location = value;
        break;
      case "DTSTART": {
        const tzid = params.TZID || null;
        cur.dtstart = parseIcsDate(value, tzid);
        break;
      }
      case "DTEND": {
        const tzid = params.TZID || null;
        cur.dtend = parseIcsDate(value, tzid);
        break;
      }
      case "STATUS":
        cur.status = value;
        break;
      case "TRANSP":
        cur.transp = value;
        break;
      default:
        break;
    }
  }

  // Map til “rene” objekter
  return events.map((e) => ({
    id: e.uid || `${e.summary || "event"}-${e.dtstart?.date?.toISOString()}`,
    title: e.summary || "",
    description: e.description || "",
    location: e.location || "",
    start: e.dtstart?.date?.toISOString() || null,
    end: e.dtend?.date?.toISOString() || null,
    allDay: !!e.dtstart?.allDay,
    status: e.status || "",
    transp: e.transp || "",
  }));
}

/** Filtrér pr. dato-interval (ISO) */
function filterByRange(events, startIso, endIso) {
  if (!startIso && !endIso) return events;
  const start = startIso
    ? new Date(startIso).getTime()
    : Number.NEGATIVE_INFINITY;
  const end = endIso ? new Date(endIso).getTime() : Number.POSITIVE_INFINITY;

  return events.filter((e) => {
    const s = e.start ? new Date(e.start).getTime() : 0;
    const t = e.end ? new Date(e.end).getTime() : s;
    // Overlap?
    return t > start && s < end;
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const rawUrl = reqEnv("ICAL_URL"); // fx webcal://pXX-caldav.icloud.com/...
    const url = rawUrl.replace(/^webcal:\/\//i, "https://");

    // Valgfri range (mindsker payload): /api/ical?start=2025-09-01&end=2025-10-01
    const { start, end } = req.query ?? {};

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);

    const r = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Fyrrehaven-61/1.0 (+https://fyrrehaven-61.dk)",
      },
      signal: ctrl.signal,
    }).catch((err) => {
      throw new Error(
        `FETCH_FAILED:${String(err && err.message ? err.message : err)}`
      );
    });
    clearTimeout(to);

    if (!r.ok) {
      throw new Error(`UPSTREAM_${r.status}`);
    }

    const ics = await r.text();
    const events = parseEvents(ics);
    const filtered = filterByRange(events, start, end);

    // Sæt lidt caching for hurtighed (15 min på edge)
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=900");
    res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      count: filtered.length,
      events: filtered,
    });
  } catch (err) {
    console.error("ICAL_ERROR", err);
    const msg = String(err && err.message ? err.message : err);
    if (msg.startsWith("ENV_MISSING:")) {
      res
        .status(500)
        .json({
          ok: false,
          error: "ENV_MISSING",
          detail: msg.replace("ENV_MISSING:", "Missing env: "),
        });
      return;
    }
    res.status(500).json({ ok: false, error: "ICAL_ERROR", detail: msg });
  }
}
