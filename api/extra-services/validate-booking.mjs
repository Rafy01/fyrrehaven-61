import {
  getFirebaseAdminInitError,
  getFirestoreDb,
} from "../_lib/firebaseAdmin.mjs";
import { validateExtraServiceBooking } from "../_lib/extraServiceBookingValidation.mjs";
import { applySecurityHeaders, sendJson } from "../_lib/httpSecurity.mjs";

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const db = await getFirestoreDb();
  if (!db && getFirebaseAdminInitError()) {
    console.warn("EXTRA_SERVICE_BOOKING_DB_UNAVAILABLE", {
      detail: getFirebaseAdminInitError(),
    });
  }

  const result = await validateExtraServiceBooking({
    db,
    stayDate: req.body?.stayDate,
    name: req.body?.name,
  });

  if (!result.ok) {
    sendJson(res, result.status || 400, result);
    return;
  }

  sendJson(res, 200, result);
}
