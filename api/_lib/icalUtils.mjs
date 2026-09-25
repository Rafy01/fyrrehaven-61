export function unfoldIcs(icsText) {
  const lines = String(icsText || "").split(/\r?\n/);
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

export function parseIcsDate(value, tzid) {
  const val = String(value || "").trim();
  if (/^\d{8}$/.test(val)) {
    const year = Number(val.slice(0, 4));
    const month = Number(val.slice(4, 6)) - 1;
    const day = Number(val.slice(6, 8));
    return { date: new Date(year, month, day, 0, 0, 0), allDay: true };
  }

  const year = Number(val.slice(0, 4));
  const month = Number(val.slice(4, 6)) - 1;
  const day = Number(val.slice(6, 8));
  const hour = Number(val.slice(9, 11) || "0");
  const minute = Number(val.slice(11, 13) || "0");
  const second = Number(val.slice(13, 15) || "0");
  const isUtc = val.endsWith("Z");

  return {
    date: isUtc
      ? new Date(Date.UTC(year, month, day, hour, minute, second))
      : new Date(year, month, day, hour, minute, second),
    allDay: false,
    tzid: tzid || null,
  };
}

export function parseEvents(icsText) {
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
      if (cur?.dtstart && cur?.dtend) {
        events.push(cur);
      } else if (cur?.dtstart?.allDay) {
        const end = new Date(cur.dtstart.date.getTime());
        end.setDate(end.getDate() + 1);
        cur.dtend = { date: end, allDay: true };
        events.push(cur);
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const match = line.match(/^([^:;]+)(?:;([^:]+))?:(.*)$/);
    if (!match) continue;
    const [, key, paramStr = "", value] = match;

    const params = {};
    for (const chunk of paramStr ? paramStr.split(";") : []) {
      const [paramKey, paramValue] = chunk.split("=");
      if (paramKey && paramValue) params[paramKey.toUpperCase()] = paramValue;
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
      case "DTSTART":
        cur.dtstart = parseIcsDate(value, params.TZID || null);
        break;
      case "DTEND":
        cur.dtend = parseIcsDate(value, params.TZID || null);
        break;
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

  return events.map((event) => ({
    id: event.uid || `${event.summary || "event"}-${event.dtstart?.date?.toISOString()}`,
    title: event.summary || "",
    description: event.description || "",
    location: event.location || "",
    start: event.dtstart?.date?.toISOString() || null,
    end: event.dtend?.date?.toISOString() || null,
    allDay: Boolean(event.dtstart?.allDay),
    status: event.status || "",
    transp: event.transp || "",
  }));
}

export function filterByRange(events, startIso, endIso) {
  if (!startIso && !endIso) return events;
  const start = startIso
    ? new Date(String(startIso)).getTime()
    : Number.NEGATIVE_INFINITY;
  const end = endIso
    ? new Date(String(endIso)).getTime()
    : Number.POSITIVE_INFINITY;

  return events.filter((event) => {
    const eventStart = event.start ? new Date(event.start).getTime() : 0;
    const eventEnd = event.end ? new Date(event.end).getTime() : eventStart;
    return eventEnd > start && eventStart < end;
  });
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function currentAndFutureEvents(events, today = startOfToday()) {
  const minTime = today.getTime();
  return events.filter((event) => {
    const end = event.end ? new Date(event.end).getTime() : NaN;
    const start = event.start ? new Date(event.start).getTime() : NaN;
    const comparison = Number.isFinite(end) ? end : start;
    return Number.isFinite(comparison) && comparison > minTime;
  });
}

export function formatIcsDate(dateValue) {
  const text = String(dateValue || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.replace(/-/g, "");
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function foldIcsLine(line) {
  const text = String(line || "");
  if (text.length <= 74) return text;
  const chunks = [text.slice(0, 74)];
  for (let index = 74; index < text.length; index += 73) {
    chunks.push(` ${text.slice(index, index + 73)}`);
  }
  return chunks.join("\r\n");
}

export function buildCalendar({ name, description, events }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fyrrehaven 61//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(name)}`,
    `X-WR-CALDESC:${escapeIcsText(description)}`,
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcsText(event.uid)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${formatIcsDate(event.start)}`,
      `DTEND;VALUE=DATE:${formatIcsDate(event.end)}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      `DESCRIPTION:${escapeIcsText(event.description || "")}`,
      "TRANSP:OPAQUE",
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
