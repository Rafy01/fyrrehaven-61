// /api/ical.mjs
// Henter en ICS-kalender (Airbnb eller webcal), parser VEVENTs og returnerer JSON.
import {
  buildCalendar,
  currentAndFutureEvents,
  filterByRange,
  parseEvents,
  startOfToday,
} from "./_lib/icalUtils.mjs";
import { getFirestoreDb } from "./_lib/firebaseAdmin.mjs";
import { listFormSubmissions } from "./_lib/formSubmissions.mjs";

const REQ_TIMEOUT_MS = 15000;

function validIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function submissionBookingDates(submission) {
  const start = submission?.selection?.start;
  const end = submission?.selection?.endExclusive;
  if (validIsoDate(start) && validIsoDate(end) && end > start) {
    return { start, end };
  }
  return null;
}

function bookingSummary(submission) {
  const name = String(submission?.name || "Guest").trim() || "Guest";
  const bookingNumber = String(submission?.bookingNumber || submission?.id || "")
    .trim();
  return bookingNumber ? `${name} #${bookingNumber}` : name;
}

function bookingDescription(submission) {
  return [
    submission?.email ? `Email: ${submission.email}` : "",
    submission?.phone ? `Phone: ${submission.phone}` : "",
    submission?.guests?.total ? `Guests: ${submission.guests.total}` : "",
    submission?.stayPurpose ? `Purpose: ${submission.stayPurpose}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendBookingsIcal(req, res) {
  const requiredToken = String(process.env.BOOKINGS_ICAL_TOKEN || "").trim();
  if (!requiredToken || String(req.query?.token || "") !== requiredToken) {
    res.status(401).json({
      ok: false,
      error: "UNAUTHORIZED",
      detail: "The booking calendar token is missing or invalid.",
    });
    return;
  }

  const db = await getFirestoreDb();
  if (!db) {
    res.status(503).json({
      ok: false,
      error: "FIREBASE_ADMIN_NOT_CONFIGURED",
      detail: "Firebase server credentials are missing or invalid.",
    });
    return;
  }

  const today = startOfToday().toISOString().slice(0, 10);
  const submissions = await listFormSubmissions(db, 1000, { throwOnError: true });
  const events = submissions
    .filter((submission) => {
      const intent = String(submission?.intent || "").trim();
      return intent === "booking" && submission?.status !== "draft";
    })
    .map((submission) => {
      const dates = submissionBookingDates(submission);
      if (!dates || dates.end <= today) return null;
      return {
        uid: `fyrrehaven-61-booking-${submission.id}`,
        start: dates.start,
        end: dates.end,
        summary: bookingSummary(submission),
        description: bookingDescription(submission),
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  const calendar = buildCalendar({
    name: "Fyrrehaven 61 bookings",
    description: "Direct website bookings with guest names.",
    events,
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Cache-Control", "private, max-age=0");
  res.status(200).send(calendar);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    if (String(req.query?.feed || "").toLowerCase() === "bookings") {
      await sendBookingsIcal(req, res);
      return;
    }

    const rawUrl = process.env.ICAL_URL || process.env.BOOKING_ICAL_URL;
    if (!rawUrl) {
      res.status(500).json({ ok: false, error: "ICAL_URL_MISSING" });
      return;
    }

    // webcal:// -> https:// (Airbnb bruger https i forvejen)
    const url = rawUrl.replace(/^webcal:\/\//i, "https://");

    // Valgfri range: /api/ical?start=2025-09-01&end=2025-10-01
    const { start, end } = req.query ?? {};

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);

    const r = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Fyrrehaven-61/1.0; +https://fyrrehaven-61.dk)",
        Accept: "text/calendar, text/plain, */*",
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
    const events = currentAndFutureEvents(parseEvents(ics));
    const filtered = filterByRange(events, start, end);

    // Cache på edge i 15 min
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

    res.status(500).json({ ok: false, error: "ICAL_ERROR", detail: msg });
  }
}
