import nodemailer from "nodemailer";
import { getFirestoreDb, verifyAdminRequest } from "./_lib/firebaseAdmin.mjs";
import {
  createFormSubmission,
  updateFormSubmission,
} from "./_lib/formSubmissions.mjs";
import { validateExtraServiceBooking } from "./_lib/extraServiceBookingValidation.mjs";
import { deliverSubmissionEvent } from "./_lib/submissionIntegration.mjs";
import {
  checkRateLimit,
  getRequesterIp,
  normalizeEmail,
  validateContactHeaders,
  validateHumanSignals,
  validateContactPayload,
} from "./_lib/contactSecurity.mjs";
import { applySecurityHeaders, sendJson } from "./_lib/httpSecurity.mjs";
import { normalizeLang, t, yesNo } from "./_lib/i18n.mjs";

/** --- Utils ---------------------------------------------------- */
const reqEnv = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`ENV_MISSING:${k}`);
  return v;
};

const reqEnvAny = (...keys) => {
  for (const k of keys) {
    const v = process.env[k];
    if (v) return v;
  }
  throw new Error(`ENV_MISSING:${keys.join("|")}`);
};

const normalizeSmtpUser = (user, from) => {
  const normalized = String(user || "").trim();
  if (!normalized || normalized.includes("@")) return normalized;
  const domain = String(from || "").split("@")[1];
  return domain ? `${normalized}@${domain}` : normalized;
};

const randomBookingNumber = (hasBookingInfo) =>
  `${hasBookingInfo ? "9" : "7"}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

const fmtMoney = (n, lang = "da") => {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const uiLang = normalizeLang(lang);
  try {
    return new Intl.NumberFormat(
      uiLang === "da" ? "da-DK" : uiLang === "de" ? "de-DE" : "en-GB",
      {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 0,
      }
    ).format(Number(n));
  } catch {
    return `${Number(n).toFixed(0)} DKK`;
  }
};

const fmtDate = (iso, lang = "da") => {
  if (!iso) return "—";
  const uiLang = normalizeLang(lang);
  try {
    const d = new Date(`${iso}T00:00:00`);
    return new Intl.DateTimeFormat(
      uiLang === "da" ? "da-DK" : uiLang === "de" ? "de-DE" : "en-GB",
      {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      }
    ).format(d);
  } catch {
    return iso || "—";
  }
};

const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const OR_DASH = (v) => (v === 0 ? "0" : v ? String(v) : "—");
const SHOULD_EXPOSE_INTERNAL_ERRORS =
  String(process.env.EXPOSE_INTERNAL_API_ERRORS || "").toLowerCase() ===
  "true";

const sanitizeErrorMessage = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

/** —— Din faste signatur (uforandret) —— */
const SIGNATURE_HTML = `
<div data-spark-custom-html="true">
  <div dir="auto">
    <table cellpadding="0" style="border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="margin: 0.1px; padding: 10px 0px;">
            <img width="500" src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/best_regards.png" alt="Best regards," style="max-width: 100%; height: auto;">
          </td>
        </tr>
      </tbody>
    </table>
    <table cellpadding="0" width="500" style="border-collapse: collapse; font-size: 13.1px;">
      <tbody>
        <tr>
          <td style="margin: 0.1px; padding: 0px;">
            <table cellpadding="0" style="border-collapse: collapse;">
              <tbody>
                <tr>
                  <td valign="top" style="margin: 0.1px; padding: 0px 12px 0px 0px; cursor: pointer;">
                    <a href="https://fyrrehaven-61.dk" target="_blank" rel="noreferrer">
                      <img src="https://media.fyrrehaven-61.dk/logo_trans_white/" width="100" alt="" style="display: block; min-width: 100px; max-width: 100%; height: auto;">
                    </a>
                  </td>
                  <td valign="top" style="border-left: 1px solid rgb(126,119,38); margin: 0.1px; padding: 0 0 0 12px; font-family: Tahoma, Geneva, sans-serif; color: rgb(0,0,1);">
                    <table cellpadding="0" style="border-collapse: collapse;">
                      <tbody>
                        <tr>
                          <td style="padding: 0 0 8px; font-weight: 600; font-size: 17.1px; color: rgb(126,119,38);">Fyrrehaven 61</td>
                        </tr>
                        <tr style="cursor: pointer;">
                          <td><a href="mailto:kontakt@fyrrehaven-61.dk" target="_blank" style="color: rgb(126,119,38); text-decoration: none; font-family: Tahoma, Geneva, sans-serif;">kontakt@fyrrehaven-61.dk</a></td>
                        </tr>
                        <tr style="cursor: pointer;">
                          <td><span style="color: rgb(126,119,38);">Fjellerup Strand</span></td>
                        </tr>
                        <tr style="cursor: pointer;">
                          <td><a href="https://fyrrehaven-61.dk" target="_blank" style="color: rgb(126,119,38); text-decoration: none; font-family: Tahoma, Geneva, sans-serif;">fyrrehaven-61.dk</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0 0;">
                            <table cellpadding="0" style="border-collapse: collapse;">
                              <tbody>
                                <tr>
                                  <td style="padding: 0 5px 0 0; cursor: pointer;">
                                    <a href="https://www.facebook.com/fyrrehaven61" target="_blank" style="display:block;border-radius:15%;width:22px;height:22px;text-align:center;background-color:rgb(126,119,38);">
                                      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="position:relative;top:4.4px;width:13.2px;"><path d="M1024 512.329c0-282.951-229.23-512.329-512-512.329s-512 229.378-512 512.329c0 255.715 187.23 467.671 432 506.101v-358.005h-130v-148.096h130v-112.872c0-128.403 76.44-199.328 193.39-199.328 56 0 114.61 10.006 114.61 10.006v126.081h-64.56c-63.6 0-83.44 39.496-83.44 80.052v96.061h142l-22.7 148.096h-119.3v358.005c244.77-38.43 432-250.386 432-506.101z" fill="#FFFFFF"/></svg>
                                    </a>
                                  </td>
                                  <td style="padding: 0 5px 0 0; cursor: pointer;">
                                    <a href="https://www.instagram.com/fyrrehaven61/" target="_blank" style="display:block;border-radius:15%;width:22px;height:22px;text-align:center;background-color:rgb(126,119,38);">
                                      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="position:relative;top:4.4px;width:13.2px;"><path d="M682.653 512c0-93.991-76.659-170.654-170.654-170.654s-170.654 76.659-170.654 170.654c0 93.995 76.659 170.654 170.654 170.654s170.654-76.659 170.654-170.654zM774.646 512c0 145.323-117.325 262.645-262.645 262.645s-262.645-117.325-262.645-262.645c0-145.32 117.325-262.645 262.645-262.645s262.645 117.325 262.645 262.645zM846.641 238.688c0 33.997-27.331 61.328-61.328 61.328s-61.328-27.331-61.328-61.328c0-33.996 27.331-61.328 61.328-61.328s61.328 27.331 61.328 61.328v0zM512 92.033c-74.66 0-234.647-5.999-301.975 20.666-23.331 9.332-40.662 20.666-58.661 38.662s-29.33 35.33-38.662 58.661c-26.666 67.328-20.666 227.315-20.666 301.975s-5.999 234.647 20.666 301.975c9.332 23.331 20.666 40.662 38.662 58.661s35.33 29.33 58.661 38.662c67.328 26.666 227.315 20.666 301.975 20.666s234.647-5.999 301.975-20.666c23.331-9.332 40.662-20.666 58.661-38.662s29.33-35.33 38.662-58.661c26.666-67.328 20.666-227.315 20.666-301.975s-0.667-234.647 3.332-301.975c4-81.995 22.666-154.655 82.66-214.651s132.656-78.66 214.651-82.66c70.66-4 140.655-3.332 211.316-3.332s140.655-0.667 211.316 3.332c81.995 4 154.655 22.666 214.651 82.66s78.66 132.656 82.66 214.651c4 70.66 3.332 140.655 3.332 211.316z" fill="#FFFFFF"/></svg>
                                    </a>
                                  </td>
                                  <td style="padding: 0 5px 0 0; cursor: pointer;">
                                    <a href="https://www.tiktok.com/@fyrrehaven61" target="_blank" style="display:block;border-radius:15%;width:22px;height:22px;text-align:center;background-color:rgb(126,119,38);">
                                      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="position:relative;top:4.4px;width:13.2px;"><path d="M959.851 414.292c-8.556 0.813-17.146 1.239-25.742 1.277-94.288 0.013-182.228-46.466-233.877-123.613v420.932c0 171.822-142.425 311.111-318.116 311.111s-318.116-139.289-318.116-311.111c0-171.822 142.425-311.111 318.116-311.111 6.641 0 13.132 0.584 19.661 0.985v153.312c-6.529-0.766-12.945-1.934-19.661-1.934-89.669 0-162.36 71.09-162.36 158.785s72.691 158.785 162.36 158.785c89.686 0 168.888-69.103 168.888-156.814l1.567-714.895h149.974c14.142 131.528 122.584 234.263 257.455 243.905v170.387z" fill="#FFFFFF"/></svg>
                                    </a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <table width="500" cellspacing="0" cellpadding="0" border="0">
      <tbody><tr><td style="margin:0.1px;line-height:1px;font-size:1px;height:1px;">&nbsp;</td></tr></tbody>
    </table>
  </div>
</div>
`;

/** --- Handler -------------------------------------------------- */
export default async function handler(req, res) {
  try {
    applySecurityHeaders(res);
    res.setHeader("Allow", "POST");

    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const requestIp = getRequesterIp(req);

    const headerValidation = validateContactHeaders(req);
    if (!headerValidation.ok) {
      sendJson(res, headerValidation.status, {
        ok: false,
        error: headerValidation.error,
        detail: headerValidation.detail,
      });
      return;
    }

    const rateLimit = checkRateLimit(requestIp, "contact");
    if (!rateLimit.ok) {
      res.setHeader("Retry-After", String(rateLimit.retryAfter || 60));
      sendJson(res, 429, {
        ok: false,
        error: "RATE_LIMIT_EXCEEDED",
        detail: `Too many submissions from this IP. Try again in ${rateLimit.retryAfter || 60} seconds.`,
      });
      return;
    }

    const humanValidation = validateHumanSignals(req.body);
    if (!humanValidation.ok) {
      sendJson(res, humanValidation.status, {
        ok: false,
        error: humanValidation.error,
        detail: humanValidation.detail,
      });
      return;
    }

    const payloadValidation = validateContactPayload(req.body);
    if (!payloadValidation.ok) {
      sendJson(res, payloadValidation.status, {
        ok: false,
        error: payloadValidation.error,
        detail: payloadValidation.detail,
      });
      return;
    }

    // Body
    const {
      lang = "da",

      // kontaktinfo
      name,
      email,
      phone,
      country, // label hvis sendt
      countryIso, // ISO fallback
      message,

      // kontekst
      purpose, // "booking" | "inquiry" | "other"
      context,

      // godkendelser
      consent = false,
      feesAccepted = false,

      // bookingfelter
      guests, // { adults, children, babies }
      stayPurpose,
      selection, // { start, endExclusive, nights, baseNightsTotalDKK, cleaningFeeDKK, totalWithCleaningDKK, airbnbServiceFeeSavingsDKK, totalAfterAirbnbDiscountDKK, breakdown[] }

      // NEW: ekstra services
      extras, // { stayDate, items: [{id, qty, unitPriceDKK, label:{da,en}}], totalDKK }
    } = req.body ?? {};
    const manualGuestOnly =
      req.body?.adminManualGuestOnly === true ||
      String(req.body?.adminManualGuestOnly || "").toLowerCase() === "true";
    if (manualGuestOnly) {
      const adminCheck = await verifyAdminRequest(req);
      if (!adminCheck.ok) {
        sendJson(res, adminCheck.status, {
          ok: false,
          error: adminCheck.error,
          detail: adminCheck.detail || null,
        });
        return;
      }
    }
    const uiLang = normalizeLang(lang);
    const replyEmail = normalizeEmail(email);
    const bookingType = t(uiLang, "contact.type.booking");
    const messageType = t(uiLang, "contact.type.message");
    const intent = String(purpose || context || "contact");
    const extrasItemsRaw = Array.isArray(extras?.items) ? extras.items : [];
    const isExtraServicesReq =
      intent === "extra-services" || extrasItemsRaw.length > 0;
    const hasRequestedExtras = extrasItemsRaw.length > 0;
    const isBookingReq =
      intent === "booking" || !!selection || !!guests || !!stayPurpose;

    // Validering
    if (!name || !email) {
      sendJson(res, 400, {
        ok: false,
        error: "VALIDATION_ERROR",
        detail: "Missing name or email",
      });
      return;
    }
    if (!isBookingReq && !isExtraServicesReq && !message) {
      sendJson(res, 400, {
        ok: false,
        error: "VALIDATION_ERROR",
        detail: "Missing message",
      });
      return;
    }

    const db = await getFirestoreDb();
    if (isExtraServicesReq && !manualGuestOnly) {
      const bookingValidation = await validateExtraServiceBooking({
        db,
        stayDate: extras?.stayDate,
        name,
      });

      if (!bookingValidation.ok) {
        sendJson(res, bookingValidation.status || 400, bookingValidation);
        return;
      }
    }

    const bookingNumber = randomBookingNumber(isBookingReq);
    const submissionRecord = {
      intent,
      bookingNumber,
      lang: uiLang,
      name: name?.trim?.() || "",
      email: replyEmail,
      phone: phone || "",
      country: country || null,
      countryIso: countryIso || null,
      message: message || "",
      consent: Boolean(consent),
      feesAccepted: Boolean(feesAccepted),
      stayPurpose: stayPurpose || null,
      guests: guests || null,
      selection: selection || null,
      extras:
        extras && typeof extras === "object"
          ? {
              stayDate: extras.stayDate || null,
              totalDKK:
                typeof extras.totalDKK === "number" ? extras.totalDKK : null,
              items: Array.isArray(extras.items) ? extras.items : [],
            }
          : null,
      source: "website",
      status: "pending",
      mailStatus: "pending",
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      requestMeta: {
        ip: requestIp || null,
        origin: req.headers.origin || null,
        referer: req.headers.referer || null,
        userAgent: req.headers["user-agent"] || null,
      },
    };

    let submissionRef = null;
    if (db) {
      try {
        submissionRef = await createFormSubmission(db, submissionRecord);
      } catch (storageError) {
        submissionRef = null;
        console.error("FIRESTORE_WRITE_FAILED", storageError);
      }
    }

    // SMTP setup
    const host = reqEnv("SMTP_HOST");
    const port = Number(process.env.SMTP_PORT || 587);
    const from = reqEnv("MAIL_FROM"); // mailbox på eget domæne
    const user = normalizeSmtpUser(process.env.SMTP_USER || from, from);
    const pass = reqEnvAny("SMTP_PASS", "SMTP_PASSWORD");
    const to = reqEnv("MAIL_TO");
    const autoBcc = process.env.MAIL_AUTOREPLY_BCC || "";

    const secure =
      String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
      port === 465;
    const tlsInsecure =
      String(process.env.SMTP_TLS_INSECURE || "").toLowerCase() === "true";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      requireTLS: !secure,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      tls: {
        minVersion: "TLSv1.2",
        ...(tlsInsecure ? { rejectUnauthorized: false } : {}),
      },
      ...(String(process.env.SMTP_DEBUG || "").toLowerCase() === "true"
        ? { logger: true, debug: true }
        : {}),
    });

    try {
      await transporter.verify();

      // -------- 1) AUTO-REPLY TIL BRUGER (sendes med det samme) --------
      const siteName = process.env.SITE_NAME || "Fyrrehaven 61";
      const subjectUser = isExtraServicesReq
        ? t(uiLang, "contact.extraServicesSubjectUser", { siteName })
        : t(uiLang, "contact.subjectUser", { siteName });

    const extraServicesUserBody = isExtraServicesReq
      ? `
      <p>${esc(
        t(
          uiLang,
          hasRequestedExtras
            ? "contact.extraServicesThanksWithItems"
            : "contact.extraServicesThanksNoItems"
        )
      )}</p>
      <p>${esc(t(uiLang, "contact.extraServicesApprovalNote"))}</p>
      `
      : "";

    const userBody = `
      <p>${esc(t(uiLang, "contact.greeting", { name }))}</p>
      ${
        isExtraServicesReq
          ? extraServicesUserBody
          : `<p>${esc(
              t(uiLang, "contact.thanks", {
                type: isBookingReq ? bookingType : messageType,
              })
            )}
            ${esc(t(uiLang, "contact.replySoon"))}</p>`
      }
      ${
        isBookingReq && !isExtraServicesReq
          ? `<p><b>${esc(t(uiLang, "contact.quickSummary"))}</b><br/>
             ${esc(t(uiLang, "contact.period"))}: ${fmtDate(
              selection?.start,
              uiLang
            )} – ${fmtDate(
              selection?.endExclusive,
              uiLang
            )} (${
              typeof selection?.nights === "number" ? selection.nights : "—"
            } ${esc(t(uiLang, "contact.nights"))})<br/>
             ${esc(t(uiLang, "contact.estimatedTotal"))}: ${fmtMoney(
               selection?.totalAfterAirbnbDiscountDKK ?? selection?.totalWithCleaningDKK,
               uiLang
             )}</p>`
          : ""
      }
      <p>${esc(t(uiLang, "contact.questions"))}</p>
    `;

    const bodyUserHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
        ${userBody}
        ${SIGNATURE_HTML}
      </div>
    `;
    const bodyUserText =
      `${t(uiLang, "contact.greeting", { name })}\n\n` +
      (isExtraServicesReq
        ? `${
            hasRequestedExtras
            ? t(uiLang, "contact.extraServicesThanksWithItems")
            : t(uiLang, "contact.extraServicesThanksNoItems")
          }\n\n${t(uiLang, "contact.extraServicesApprovalNote")}\n\n`
        : `${t(uiLang, "contact.thanks", {
            type: isBookingReq ? bookingType : messageType,
          })} ${t(uiLang, "contact.replySoon")}\n\n`) +
      (isBookingReq && !isExtraServicesReq
        ? `${t(uiLang, "contact.period")}: ${fmtDate(
            selection?.start,
            uiLang
          )} – ${fmtDate(selection?.endExclusive, uiLang)} (${
            typeof selection?.nights === "number" ? selection.nights : "—"
          } ${t(uiLang, "contact.nights")})\n${t(
            uiLang,
            "contact.estimatedTotal"
          )}: ${fmtMoney(
            selection?.totalAfterAirbnbDiscountDKK ?? selection?.totalWithCleaningDKK,
            uiLang
          )}\n\n`
        : "") +
      `${t(uiLang, "contact.replyText")}\n\n${siteName}\nhttps://fyrrehaven-61.dk`;

      const autoInfo = await transporter.sendMail({
      from, // DKIM/SPF på eget domæne
      sender: from,
      envelope: { from, to: replyEmail },
      to: replyEmail,
      ...(autoBcc ? { bcc: autoBcc } : {}),
      subject: subjectUser,
      html: bodyUserHtml,
      text: bodyUserText,
      replyTo: to, // svar går til jer
      headers: {
        "Auto-Submitted": "auto-replied",
        "X-Auto-Response-Suppress": "All",
        Precedence: "auto_reply",
      },
    });

    // -------- 2) ADMIN-NOTIFIKATION (til jer) --------
      const adminLang = "en";
      const adminT = (key, vars) => t(adminLang, key, vars);
      const introAdmin = adminT("contact.introAdmin");
      const subjectAdmin = `Fyrrehaven 61 | ${name} (${intent})`;
      const countryShown = country || countryIso || "—";

    // Normaliser bookingfelter
      const startStr = fmtDate(selection?.start, adminLang);
      const endStr = fmtDate(selection?.endExclusive, adminLang);
      const nightsStr =
        typeof selection?.nights === "number" ? String(selection.nights) : "—";
      const nightsPriceStr = fmtMoney(selection?.baseNightsTotalDKK, adminLang);
      const cleaningStr = fmtMoney(selection?.cleaningFeeDKK, adminLang);
      const airbnbSavingsStr =
        selection?.airbnbServiceFeeSavingsDKK != null
          ? `- ${fmtMoney(selection.airbnbServiceFeeSavingsDKK, adminLang)}`
          : "—";
      const totalStr = fmtMoney(
        selection?.totalAfterAirbnbDiscountDKK ?? selection?.totalWithCleaningDKK,
        adminLang
      );

    // Extras
      const extrasItems = extrasItemsRaw;
      const extraServicesArrivalStr = fmtDate(extras?.stayDate, adminLang);
      const extrasTotalStr =
        extras && typeof extras.totalDKK === "number"
          ? fmtMoney(extras.totalDKK, adminLang)
          : "—";

      const grandInclExtras =
        selection &&
        typeof (selection.totalAfterAirbnbDiscountDKK ?? selection.totalWithCleaningDKK) === "number" &&
        extras &&
        typeof extras.totalDKK === "number"
          ? (selection.totalAfterAirbnbDiscountDKK ?? selection.totalWithCleaningDKK) + extras.totalDKK
          : null;

      const extrasHtml =
      extrasItems.length > 0
        ? `
      <h3 style="margin:16px 0 8px;font-size:16px;">
        ${esc(adminT("contact.extraServices"))}
      </h3>
      <table style="border-collapse:collapse">
        ${extrasItems
          .map((it) => {
            const label = it?.label?.en ?? it?.label?.da;
            const unit = fmtMoney(it?.unitPriceDKK, adminLang);
            const qty = Number(it?.qty || 0);
            const line =
              typeof it?.unitPriceDKK === "number"
                ? fmtMoney(qty * it.unitPriceDKK, adminLang)
                : "—";
            return `<tr>
              <td style="padding:4px 8px">${esc(label || it?.id || "—")}</td>
              <td style="padding:4px 8px">${qty} × ${unit}</td>
              <td style="padding:4px 8px; text-align:right"><b>${line}</b></td>
            </tr>`;
          })
          .join("")}
        <tr>
          <td style="padding:6px 8px" colspan="2"><b>${
            esc(adminT("contact.extrasTotal"))
          }</b></td>
          <td style="padding:6px 8px; text-align:right"><b>${extrasTotalStr}</b></td>
        </tr>
      </table>
    `
        : "";

      const grandInclExtrasHtml =
      grandInclExtras != null
        ? `
      <p style="margin:8px 0 0"><b>${
        esc(adminT("contact.totalInclExtras"))
      }:</b> ${fmtMoney(grandInclExtras, adminLang)}</p>
    `
        : "";

      const adultsStr = OR_DASH(guests?.adults);
      const childrenStr = OR_DASH(guests?.children);
      const babiesStr = OR_DASH(guests?.babies);
      const stayPurposeStr = OR_DASH(stayPurpose);

      const bookingHtml = `
      <h3 style="margin:16px 0 8px;font-size:16px;">
        ${esc(adminT("contact.bookingDetails"))}
      </h3>
      <table style="border-collapse:collapse">
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.period"))
          }</b></td>
          <td style="padding:4px 8px">${startStr} – ${endStr} · ${nightsStr} ${
      esc(adminT("contact.nights"))
    }</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.priceNights"))
          }</b></td>
          <td style="padding:4px 8px">${nightsPriceStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.cleaning"))
          }</b></td>
          <td style="padding:4px 8px">${cleaningStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.airbnbServiceFeeSavings"))
          }</b></td>
          <td style="padding:4px 8px">${airbnbSavingsStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.totalAfterDiscount"))
          }</b></td>
          <td style="padding:4px 8px">${totalStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.guests"))
          }</b></td>
          <td style="padding:4px 8px">
            ${esc(adminT("contact.adults"))}: ${adultsStr},
            ${esc(adminT("contact.children"))}: ${childrenStr},
            ${esc(adminT("contact.babies"))}: ${babiesStr}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.purposeOfStay"))
          }</b></td>
          <td style="padding:4px 8px">${esc(stayPurposeStr)}</td>
        </tr>
      </table>
    `;

    // Godkendelser
      const approvalsHtml = `
      <h3 style="margin:16px 0 8px;font-size:16px;">
        ${esc(adminT("contact.approvals"))}
      </h3>
      <table style="border-collapse:collapse">
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.consentGdpr"))
          }</b></td>
          <td style="padding:4px 8px">${esc(yesNo(Boolean(consent), adminLang))}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            esc(adminT("contact.feeListAccepted"))
          }</b></td>
          <td style="padding:4px 8px">${esc(yesNo(Boolean(feesAccepted), adminLang))}</td>
        </tr>
      </table>
    `;

      const messageForMail = isBookingReq ? OR_DASH(message) : message;

      const htmlAdmin = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">
        <p>${introAdmin}</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 8px"><b>${esc(adminT("contact.fields.name"))}</b></td><td style="padding:4px 8px">${esc(
            name || "—"
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>${esc(adminT("contact.fields.email"))}</b></td><td style="padding:4px 8px">${esc(
            replyEmail || "—"
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>${esc(adminT("contact.fields.phone"))}</b></td><td style="padding:4px 8px">${esc(
            phone || "—"
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>${esc(adminT("contact.fields.country"))}</b></td><td style="padding:4px 8px">${esc(
            countryShown
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>${esc(adminT("contact.fields.language"))}</b></td><td style="padding:4px 8px">${esc(
            uiLang
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>${esc(adminT("contact.fields.context"))}</b></td><td style="padding:4px 8px">${esc(
            intent
          )}</td></tr>
          ${
            isExtraServicesReq
              ? `<tr><td style="padding:4px 8px"><b>${esc(
                  adminT("contact.arrivalDate")
                )}</b></td><td style="padding:4px 8px">${esc(
                  extraServicesArrivalStr
                )}</td></tr>`
              : ""
          }
        </table>

        ${isBookingReq ? bookingHtml : ""}
        ${extrasHtml}
        ${grandInclExtrasHtml}

        ${approvalsHtml}

        <h3 style="margin:16px 0 8px;font-size:16px;">${
          esc(adminT("contact.message"))
        }</h3>
        <pre style="white-space:pre-wrap;background:#f6f6f6;border:1px solid #eee;border-radius:6px;padding:12px">${esc(
          messageForMail || "—"
        )}</pre>

        ${SIGNATURE_HTML}
      </div>
    `;

      const textAdmin =
      `${introAdmin}\n\n` +
      `${adminT("contact.fields.name")}: ${name || "—"}\n` +
      `${adminT("contact.fields.email")}: ${replyEmail || "—"}\n` +
      `${adminT("contact.fields.phone")}: ${phone || "—"}\n` +
      `${adminT("contact.fields.country")}: ${countryShown}\n` +
      `${adminT("contact.fields.language")}: ${uiLang}\n` +
      `${adminT("contact.fields.context")}: ${intent}\n` +
      (isExtraServicesReq
        ? `${adminT("contact.arrivalDate")}: ${extraServicesArrivalStr}\n`
        : "") +
      (isBookingReq
        ? `\n— ${adminT("contact.bookingDetails")} —\n` +
          `${adminT("contact.period")}: ${startStr} – ${endStr} · ${nightsStr} ${adminT("contact.nights")}\n` +
          `${adminT("contact.priceNights")}: ${nightsPriceStr}\n` +
          `${adminT("contact.cleaning")}: ${cleaningStr}\n` +
          `${adminT("contact.estimatedTotal")}: ${totalStr}\n` +
          `${adminT("contact.guests")}: ${adminT("contact.adults")} ${OR_DASH(
            guests?.adults
          )}, ${adminT("contact.children")} ${OR_DASH(
            guests?.children
          )}, ${adminT("contact.babies")} ${OR_DASH(guests?.babies)}\n` +
          `${adminT("contact.purposeOfStay")}: ${OR_DASH(stayPurpose)}\n`
        : "") +
      (extrasItems.length > 0
        ? `\n— ${adminT("contact.extraServices")} —\n` +
          extrasItems
            .map((it) => {
              const label = it?.label?.en ?? it?.label?.da;
              const unit = fmtMoney(it?.unitPriceDKK, adminLang);
              const qty = Number(it?.qty || 0);
              const line =
                typeof it?.unitPriceDKK === "number"
                  ? fmtMoney(qty * it.unitPriceDKK, adminLang)
                  : "—";
              return `• ${label || it?.id || "—"}: ${qty} × ${unit} = ${line}`;
            })
            .join("\n") +
          `\n${adminT("contact.extrasTotal")}: ${extrasTotalStr}\n` +
          (grandInclExtras != null
            ? `${adminT("contact.totalInclExtras")}: ${fmtMoney(
                grandInclExtras,
                adminLang
              )}\n`
            : "")
        : ``) +
      `\n— ${adminT("contact.approvals")} —\n` +
      `${adminT("contact.consentGdpr")}: ${yesNo(Boolean(consent), adminLang)}\n` +
      `${adminT("contact.feeListAccepted")}: ${yesNo(
        Boolean(feesAccepted),
        adminLang
      )}\n\n` +
      `— ${adminT("contact.message")} —\n${messageForMail || "—"}\n`;

      let infoAdmin = null;
      if (!manualGuestOnly) {
        infoAdmin = await transporter.sendMail({
          from,
          sender: from,
          envelope: { from, to },
          to,
          subject: subjectAdmin,
          html: htmlAdmin,
          text: textAdmin,
          replyTo: replyEmail,
          headers: { "X-Campaign": "website-contact" },
        });
      }

      if (submissionRef) {
        const sentPatch = {
          status: "sent",
          mailStatus: "sent",
          updatedAtMs: Date.now(),
          autoReply: {
            id: autoInfo?.messageId || null,
            accepted: autoInfo?.accepted || [],
            rejected: autoInfo?.rejected || [],
            response: autoInfo?.response || null,
          },
          ...(manualGuestOnly
            ? { adminMailSkipped: true }
            : {
                adminMail: {
                  id: infoAdmin?.messageId || null,
                  accepted: infoAdmin?.accepted || [],
                  rejected: infoAdmin?.rejected || [],
                  response: infoAdmin?.response || null,
                },
              }),
        };
        await updateFormSubmission(submissionRef, sentPatch);
        await deliverSubmissionEvent(
          db,
          submissionRef,
          "submission.created",
          {
            id: submissionRef.id,
            ...submissionRecord,
            ...sentPatch,
          }
        );
      }

      sendJson(res, 200, {
        ok: true,
        stored: Boolean(submissionRef),
        submissionId: submissionRef?.id || null,
        mailStatus: "sent",
        autoReply: {
          id: autoInfo?.messageId || null,
          accepted: autoInfo?.accepted || [],
          rejected: autoInfo?.rejected || [],
          response: autoInfo?.response || null,
        },
        admin: manualGuestOnly
          ? null
          : {
              id: infoAdmin?.messageId || null,
              accepted: infoAdmin?.accepted || [],
              rejected: infoAdmin?.rejected || [],
              response: infoAdmin?.response || null,
            },
      });
    } catch (mailError) {
      if (submissionRef) {
        const failedPatch = {
          status: "mail_failed",
          mailStatus: "failed",
          mailError: sanitizeErrorMessage(mailError?.response || mailError),
          mailErrorCode: mailError?.code || null,
          updatedAtMs: Date.now(),
        };
        await updateFormSubmission(submissionRef, failedPatch);
        await deliverSubmissionEvent(
          db,
          submissionRef,
          "submission.created",
          {
            id: submissionRef.id,
            ...submissionRecord,
            ...failedPatch,
          }
        );

        sendJson(res, 200, {
          ok: true,
          stored: true,
          submissionId: submissionRef.id,
          mailStatus: "failed",
        });
        return;
      }

      throw mailError;
    }
  } catch (err) {
    console.error("MAIL_ERROR", err?.response || err);
    const msg = String(err && err.message ? err.message : err);
    const msgLower = msg.toLowerCase();

    if (msg.startsWith("ENV_MISSING:")) {
      sendJson(res, 500, {
        ok: false,
        error: "ENV_MISSING",
        detail: SHOULD_EXPOSE_INTERNAL_ERRORS
          ? msg.replace("ENV_MISSING:", "Missing env: ")
          : "The email service is not configured correctly.",
      });
      return;
    }

    if (
      msg.includes("535") ||
      msg.includes("EAUTH") ||
      msgLower.includes("invalid login") ||
      msgLower.includes("authentication failed")
    ) {
      sendJson(res, 502, {
        ok: false,
        error: "MAIL_AUTH_FAILED",
        detail: "Mail server authentication failed.",
      });
      return;
    }

    // Marker eksplicit hvis autoresponsen fejlede
    if (
      msg.includes("ECONN") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("EENVELOPE") ||
      msg.includes("EADDR") ||
      msgLower.includes("rejected") ||
      msgLower.includes("relay")
    ) {
      sendJson(res, 502, {
        ok: false,
        error: "MAIL_AUTOREPLY_FAILED",
        detail: "Mail delivery failed.",
      });
      return;
    }

    sendJson(res, 500, {
      ok: false,
      error: "MAIL_ERROR",
      detail: SHOULD_EXPOSE_INTERNAL_ERRORS
        ? msg
        : "Mail delivery failed.",
    });
  }
}
