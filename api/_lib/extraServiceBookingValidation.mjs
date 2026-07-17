import { listFormSubmissions } from "./formSubmissions.mjs";

const ICAL_TIMEOUT_MS = 12000;

function cleanString(value) {
  return String(value ?? "").trim();
}

function ymdToDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleanString(value));
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dateToYmd(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function unfoldIcs(icsText) {
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

function parseIcsDate(value) {
  if (/^\d{8}$/.test(value)) {
    return new Date(
      Number(value.slice(0, 4)),
      Number(value.slice(4, 6)) - 1,
      Number(value.slice(6, 8))
    );
  }

  const isUtc = value.endsWith("Z");
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(9, 11) || "0");
  const minute = Number(value.slice(11, 13) || "0");
  const second = Number(value.slice(13, 15) || "0");

  return isUtc
    ? new Date(Date.UTC(year, month, day, hour, minute, second))
    : new Date(year, month, day, hour, minute, second);
}

function parseIcsEvents(icsText) {
  const events = [];
  let current = null;

  for (const raw of unfoldIcs(icsText)) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.start) {
        events.push({
          id: current.id || `${current.title || "event"}-${current.start}`,
          title: current.title || "",
          start: current.start,
          end: current.end || addDays(current.start, 1),
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const match = line.match(/^([^:;]+)(?:;([^:]+))?:(.*)$/);
    if (!match) continue;
    const key = match[1].toUpperCase();
    const value = match[3];

    if (key === "UID") current.id = value;
    if (key === "SUMMARY") current.title = value;
    if (key === "DTSTART") current.start = parseIcsDate(value);
    if (key === "DTEND") current.end = parseIcsDate(value);
  }

  return events;
}

function looksLikeBooking(event) {
  const start = startOfDay(event.start);
  const end = startOfDay(event.end);
  const today = startOfDay(new Date());
  const isSingleDay = end.getTime() - start.getTime() === 24 * 60 * 60 * 1000;
  const title = cleanString(event.title).toLowerCase();
  const isNoCheckin =
    title.includes("not available") ||
    title.includes("unavailable") ||
    title.includes("blocked") ||
    title.includes("no check-in") ||
    title.includes("no checkin") ||
    title.includes("check-in not allowed") ||
    title.includes("checkin not allowed");

  return !(start.getTime() === today.getTime() && isSingleDay && isNoCheckin);
}

async function fetchCalendarBookings(stayDate) {
  const rawUrl = process.env.ICAL_URL || process.env.BOOKING_ICAL_URL;
  if (!rawUrl) {
    return { ok: false, error: "BOOKING_CALENDAR_NOT_CONFIGURED", bookings: [] };
  }

  const date = ymdToDate(stayDate);
  const rangeStart = addDays(date, -1);
  const rangeEnd = addDays(date, 2);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ICAL_TIMEOUT_MS);

  try {
    const response = await fetch(rawUrl.replace(/^webcal:\/\//i, "https://"), {
      headers: {
        "User-Agent": "Fyrrehaven-61/1.0 (+https://fyrrehaven-61.dk)",
        Accept: "text/calendar, text/plain, */*",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: `BOOKING_CALENDAR_HTTP_${response.status}`, bookings: [] };
    }

    const events = parseIcsEvents(await response.text())
      .filter(looksLikeBooking)
      .map((event) => ({
        id: event.id,
        title: event.title,
        start: startOfDay(event.start),
        end: startOfDay(event.end),
      }))
      .filter((booking) => booking.end > rangeStart && booking.start < rangeEnd);

    return { ok: true, bookings: events };
  } catch (error) {
    return {
      ok: false,
      error: `BOOKING_CALENDAR_ERROR:${String(error?.message || error)}`,
      bookings: [],
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeName(value) {
  return cleanString(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function namesMatch(left, right) {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

async function findStoredBookings(db, stayDate) {
  if (!db) return [];
  const submissions = await listFormSubmissions(db, 1000);
  return submissions.filter((submission) => {
    if (submission.intent !== "booking" || !submission.selection) return false;
    const start = cleanString(submission.selection.start);
    return start && start === stayDate;
  });
}

export async function validateExtraServiceBooking({ db, stayDate, name }) {
  const date = ymdToDate(stayDate);
  const guestName = cleanString(name);

  if (!date || !guestName) {
    return {
      ok: false,
      status: 400,
      error: "EXTRA_SERVICE_BOOKING_DETAILS_REQUIRED",
      detail: "Enter the booking name and date of stay.",
    };
  }

  const calendar = await fetchCalendarBookings(stayDate);
  if (!calendar.ok) {
    return {
      ok: false,
      status: 503,
      error: "BOOKING_CALENDAR_UNAVAILABLE",
      detail: "We could not verify the booking calendar right now. Please try again shortly.",
    };
  }

  const isBooked = calendar.bookings.some(
    (booking) => dateToYmd(booking.start) === dateToYmd(date)
  );
  if (!isBooked) {
    return {
      ok: false,
      status: 400,
      error: "EXTRA_SERVICE_DATE_NOT_BOOKED",
      detail:
        "We cannot find a booking starting on that date. Please choose your booking start date.",
    };
  }

  const storedBookings = await findStoredBookings(db, dateToYmd(date));
  if (
    storedBookings.length > 0 &&
    !storedBookings.some((booking) => namesMatch(guestName, booking.name))
  ) {
    return {
      ok: false,
      status: 400,
      error: "EXTRA_SERVICE_BOOKING_NAME_MISMATCH",
      detail:
        "The name does not match the booking we found for that date. Please use the same name as on the booking.",
    };
  }

  return {
    ok: true,
    dateBooked: true,
    checkedStoredBookingName: storedBookings.length > 0,
    matchedBookingId:
      storedBookings.find((booking) => namesMatch(guestName, booking.name))?.id || null,
  };
}
