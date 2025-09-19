import nodemailer from "nodemailer";

/** --- Utils ---------------------------------------------------- */
const reqEnv = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`ENV_MISSING:${k}`);
  return v;
};

const fmtMoney = (n, lang = "da") => {
  if (n == null || Number.isNaN(Number(n))) return "—";
  try {
    return new Intl.NumberFormat(lang === "da" ? "da-DK" : "en-GB", {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 0,
    }).format(Number(n));
  } catch {
    return `${Number(n).toFixed(0)} DKK`;
  }
};

const fmtDate = (iso, lang = "da") => {
  if (!iso) return "—";
  try {
    const d = new Date(`${iso}T00:00:00`);
    return new Intl.DateTimeFormat(lang === "da" ? "da-DK" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return iso || "—";
  }
};

const yn = (b, lang = "da") =>
  b ? (lang === "da" ? "Ja" : "Yes") : lang === "da" ? "Nej" : "No";

const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const OR_DASH = (v) => (v === 0 ? "0" : v ? String(v) : "—");

/** —— Din faste signatur —— */
const SIGNATURE_HTML = `... (uændret – din lange signatur HTML her) ...`;

/** --- Handler -------------------------------------------------- */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    // Body
    const {
      lang = "da",
      name,
      email,
      phone,
      country,
      countryIso,
      message,
      purpose,
      context,
      consent = false,
      feesAccepted = false,
      guests,
      stayPurpose,
      selection,
      extras,
    } = req.body ?? {};

    const intent = String(purpose || context || "contact");
    const isBookingReq =
      intent === "booking" || !!selection || !!guests || !!stayPurpose;

    // Validering
    if (!name || !email) {
      res.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        detail: "Missing name or email",
      });
      return;
    }
    if (!isBookingReq && !message) {
      res.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        detail: "Missing message",
      });
      return;
    }

    // SMTP
    const host = reqEnv("SMTP_HOST");
    const port = Number(process.env.SMTP_PORT || 587);
    const user = reqEnv("SMTP_USER");
    const pass = reqEnv("SMTP_PASS");
    const from = reqEnv("MAIL_FROM"); // mailbox på eget domæne
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

    await transporter.verify();

    // -------- 1) SEND AUTO-REPLY TIL BRUGER MED DET SAMME --------
    const siteName = process.env.SITE_NAME || "Fyrrehaven 61";
    const subjectUser =
      lang === "da"
        ? `Tak for din henvendelse – ${siteName}`
        : `Thanks for your message – ${siteName}`;

    const userBodyDa = `
      <p>Hej ${esc(name)},</p>
      <p>Tak for din ${isBookingReq ? "bookingforespørgsel" : "henvendelse"}.
      Vi vender snarest tilbage (typisk inden for 24 timer).</p>
      ${
        isBookingReq
          ? `<p><b>Hurtigt overblik</b><br/>
             Periode: ${fmtDate(selection?.start, "da")} – ${fmtDate(
              selection?.endExclusive,
              "da"
            )} (${
              typeof selection?.nights === "number" ? selection.nights : "—"
            } nætter)<br/>
             Estimeret total: ${fmtMoney(
               selection?.totalWithCleaningDKK,
               "da"
             )}</p>`
          : ""
      }
      <p>Har du spørgsmål imens, kan du svare direkte på denne mail.</p>
    `;

    const userBodyEn = `
      <p>Hi ${esc(name)},</p>
      <p>Thanks for your ${isBookingReq ? "booking request" : "message"}.
      We’ll get back to you shortly (typically within 24 hours).</p>
      ${
        isBookingReq
          ? `<p><b>Quick summary</b><br/>
             Period: ${fmtDate(selection?.start, "en")} – ${fmtDate(
              selection?.endExclusive,
              "en"
            )} (${
              typeof selection?.nights === "number" ? selection.nights : "—"
            } nights)<br/>
             Estimated total: ${fmtMoney(
               selection?.totalWithCleaningDKK,
               "en"
             )}</p>`
          : ""
      }
      <p>If you have any questions meanwhile, just reply to this email.</p>
    `;

    const bodyUserHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
        ${lang === "da" ? userBodyDa : userBodyEn}
        ${SIGNATURE_HTML}
      </div>
    `;
    const bodyUserText =
      lang === "da"
        ? `Hej ${name},\n\nTak for din ${
            isBookingReq ? "bookingforespørgsel" : "henvendelse"
          }. Vi vender snarest tilbage (typisk inden for 24 timer).\n\n${
            isBookingReq
              ? `Periode: ${fmtDate(selection?.start, "da")} – ${fmtDate(
                  selection?.endExclusive,
                  "da"
                )} (${
                  typeof selection?.nights === "number" ? selection.nights : "—"
                } nætter)\nEstimeret total: ${fmtMoney(
                  selection?.totalWithCleaningDKK,
                  "da"
                )}\n\n`
              : ""
          }Svar blot på denne mail, hvis du har spørgsmål.\n\n${siteName}\nhttps://fyrrehaven-61.dk`
        : `Hi ${name},\n\nThanks for your ${
            isBookingReq ? "booking request" : "message"
          }. We’ll get back to you shortly (typically within 24 hours).\n\n${
            isBookingReq
              ? `Period: ${fmtDate(selection?.start, "en")} – ${fmtDate(
                  selection?.endExclusive,
                  "en"
                )} (${
                  typeof selection?.nights === "number" ? selection.nights : "—"
                } nights)\nEstimated total: ${fmtMoney(
                  selection?.totalWithCleaningDKK,
                  "en"
                )}\n\n`
              : ""
          }Just reply to this email if you have any questions.\n\n${siteName}\nhttps://fyrrehaven-61.dk`;

    const autoInfo = await transporter.sendMail({
      from, // DKIM/SPF på eget domæne
      sender: from,
      envelope: { from, to: email },
      to: email,
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

    console.info("AUTO_REPLY_SENT", {
      id: autoInfo?.messageId,
      accepted: autoInfo?.accepted,
      rejected: autoInfo?.rejected,
      response: autoInfo?.response,
    });

    // -------- 2) SEND ADMIN-NOTIFIKATION --------
    const introAdmin =
      lang === "da"
        ? "Ny indsendelse fra websitet:"
        : "New submission from the website:";
    const subjectAdmin =
      lang === "da"
        ? `Fyrrehaven 61 | ${name} (${intent})`
        : `Fyrrehaven 61 | ${name} (${intent})`;
    const countryShown = country || countryIso || "—";

    const startStr = fmtDate(selection?.start, lang);
    const endStr = fmtDate(selection?.endExclusive, lang);
    const nightsStr =
      typeof selection?.nights === "number" ? String(selection.nights) : "—";
    const nightsPriceStr = fmtMoney(selection?.baseNightsTotalDKK, lang);
    const cleaningStr = fmtMoney(selection?.cleaningFeeDKK, lang);
    const totalStr = fmtMoney(selection?.totalWithCleaningDKK, lang);

    const extrasItems = Array.isArray(extras?.items) ? extras.items : [];
    const extrasTotalStr =
      extras && typeof extras.totalDKK === "number"
        ? fmtMoney(extras.totalDKK, lang)
        : "—";

    const grandInclExtras =
      selection &&
      typeof selection.totalWithCleaningDKK === "number" &&
      extras &&
      typeof extras.totalDKK === "number"
        ? selection.totalWithCleaningDKK + extras.totalDKK
        : null;

    const extrasHtml =
      extrasItems.length > 0
        ? `
      <h3 style="margin:16px 0 8px;font-size:16px;">
        ${lang === "da" ? "Ekstra services" : "Extra services"}
      </h3>
      <table style="border-collapse:collapse">
        ${extrasItems
          .map((it) => {
            const label = lang === "da" ? it?.label?.da : it?.label?.en;
            const unit = fmtMoney(it?.unitPriceDKK, lang);
            const qty = Number(it?.qty || 0);
            const line =
              typeof it?.unitPriceDKK === "number"
                ? fmtMoney(qty * it.unitPriceDKK, lang)
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
            lang === "da" ? "Ekstra i alt" : "Extras total"
          }</b></td>
          <td style="padding:6px 8px; text-align:right"><b>${extrasTotalStr}</b></td>
        </tr>
      </table>`
        : "";

    const grandInclExtrasHtml =
      grandInclExtras != null
        ? `<p style="margin:8px 0 0"><b>${
            lang === "da"
              ? "Estimeret total inkl. ekstra"
              : "Estimated total incl. extras"
          }:</b> ${fmtMoney(grandInclExtras, lang)}</p>`
        : "";

    const adultsStr = OR_DASH(guests?.adults);
    const childrenStr = OR_DASH(guests?.children);
    const babiesStr = OR_DASH(guests?.babies);
    const stayPurposeStr = OR_DASH(stayPurpose);

    const bookingHtml = `
      <h3 style="margin:16px 0 8px;font-size:16px;">
        ${lang === "da" ? "Bookingoplysninger" : "Booking details"}
      </h3>
      <table style="border-collapse:collapse">
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Periode" : "Period"
          }</b></td>
          <td style="padding:4px 8px">${startStr} – ${endStr} · ${nightsStr} ${
      lang === "da" ? "nætter" : "nights"
    }</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Pris (overnatninger)" : "Price (nights)"
          }</b></td>
          <td style="padding:4px 8px">${nightsPriceStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Rengøring" : "Cleaning"
          }</b></td>
          <td style="padding:4px 8px">${cleaningStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Estimeret total" : "Estimated total"
          }</b></td>
          <td style="padding:4px 8px">${totalStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Gæster" : "Guests"
          }</b></td>
          <td style="padding:4px 8px">
            ${lang === "da" ? "Voksne" : "Adults"}: ${adultsStr},
            ${lang === "da" ? "Børn" : "Children"}: ${childrenStr},
            ${lang === "da" ? "Babyer" : "Babies"}: ${babiesStr}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Formål med opholdet" : "Purpose of stay"
          }</b></td>
          <td style="padding:4px 8px">${esc(stayPurposeStr)}</td>
        </tr>
      </table>
      ${extrasHtml}
      ${grandInclExtrasHtml}
    `;

    const approvalsHtml = `
      <h3 style="margin:16px 0 8px;font-size:16px;">
        ${lang === "da" ? "Godkendelser" : "Approvals"}
      </h3>
      <table style="border-collapse:collapse">
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Samtykke (GDPR)" : "Consent (GDPR)"
          }</b></td>
          <td style="padding:4px 8px">${yn(Boolean(consent), lang)}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px"><b>${
            lang === "da" ? "Gebyroversigt accepteret" : "Fee list accepted"
          }</b></td>
          <td style="padding:4px 8px">${yn(Boolean(feesAccepted), lang)}</td>
        </tr>
      </table>
    `;

    const messageForMail = isBookingReq ? OR_DASH(message) : message;

    const htmlAdmin = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">
        <p>${introAdmin}</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 8px"><b>Navn / Name</b></td><td style="padding:4px 8px">${esc(
            name || "—"
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>E-mail</b></td><td style="padding:4px 8px">${esc(
            email || "—"
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>Telefon / Phone</b></td><td style="padding:4px 8px">${esc(
            phone || "—"
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>Land / Country</b></td><td style="padding:4px 8px">${esc(
            countryShown
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>Sprog / Lang</b></td><td style="padding:4px 8px">${esc(
            lang
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>Kontekst / Context</b></td><td style="padding:4px 8px">${esc(
            intent
          )}</td></tr>
        </table>

        ${isBookingReq ? bookingHtml : ""}

        ${approvalsHtml}

        <h3 style="margin:16px 0 8px;font-size:16px;">${
          lang === "da" ? "Besked" : "Message"
        }</h3>
        <pre style="white-space:pre-wrap;background:#f6f6f6;border:1px solid #eee;border-radius:6px;padding:12px">${esc(
          messageForMail || "—"
        )}</pre>

        ${SIGNATURE_HTML}
      </div>
    `;

    const textAdmin =
      `${introAdmin}\n\n` +
      `Navn/Name: ${name || "—"}\n` +
      `E-mail: ${email || "—"}\n` +
      `Telefon/Phone: ${phone || "—"}\n` +
      `Land/Country: ${countryShown}\n` +
      `Sprog/Lang: ${lang}\n` +
      `Kontekst/Context: ${intent}\n` +
      (isBookingReq
        ? `\n— Booking —\n` +
          `Periode/Period: ${startStr} – ${endStr} · ${nightsStr} ${
            lang === "da" ? "nætter" : "nights"
          }\n` +
          `Pris (overnatninger)/Price (nights): ${nightsPriceStr}\n` +
          `Rengøring/Cleaning: ${cleaningStr}\n` +
          `Estimeret total/Estimated total: ${totalStr}\n` +
          (extrasItems.length > 0
            ? `\n— Ekstra services / Extras —\n` +
              extrasItems
                .map((it) => {
                  const label = lang === "da" ? it?.label?.da : it?.label?.en;
                  const unit = fmtMoney(it?.unitPriceDKK, lang);
                  const qty = Number(it?.qty || 0);
                  const line =
                    typeof it?.unitPriceDKK === "number"
                      ? fmtMoney(qty * it.unitPriceDKK, lang)
                      : "—";
                  return `• ${
                    label || it?.id || "—"
                  }: ${qty} × ${unit} = ${line}`;
                })
                .join("\n") +
              `\n${
                lang === "da" ? "Ekstra i alt" : "Extras total"
              }: ${extrasTotalStr}\n` +
              (grandInclExtras != null
                ? `${
                    lang === "da"
                      ? "Estimeret total inkl. ekstra"
                      : "Estimated total incl. extras"
                  }: ${fmtMoney(grandInclExtras, lang)}\n`
                : "")
            : ``) +
          `Gæster/Guests: Adults ${OR_DASH(guests?.adults)}, Children ${OR_DASH(
            guests?.children
          )}, Babies ${OR_DASH(guests?.babies)}\n` +
          `Formål/Purpose: ${OR_DASH(stayPurpose)}\n`
        : "") +
      `\n— Godkendelser / Approvals —\n` +
      `Samtykke (GDPR)/Consent: ${yn(Boolean(consent), lang)}\n` +
      `Fee list accepted: ${yn(Boolean(feesAccepted), lang)}\n\n` +
      `— Besked / Message —\n${messageForMail || "—"}\n`;

    const infoAdmin = await transporter.sendMail({
      from,
      sender: from,
      envelope: { from, to },
      to,
      subject: subjectAdmin,
      html: htmlAdmin,
      text: textAdmin,
      replyTo: email,
      headers: { "X-Campaign": "website-contact" },
    });

    // -------- 3) Response --------
    res.status(200).json({
      ok: true,
      autoReply: {
        id: autoInfo?.messageId || null,
        accepted: autoInfo?.accepted || [],
        rejected: autoInfo?.rejected || [],
        response: autoInfo?.response || null,
      },
      admin: {
        id: infoAdmin?.messageId || null,
        accepted: infoAdmin?.accepted || [],
        rejected: infoAdmin?.rejected || [],
        response: infoAdmin?.response || null,
      },
    });
  } catch (err) {
    console.error("MAIL_ERROR", err?.response || err);
    const msg = String(err && err.message ? err.message : err);

    if (msg.startsWith("ENV_MISSING:")) {
      res.status(500).json({
        ok: false,
        error: "ENV_MISSING",
        detail: msg.replace("ENV_MISSING:", "Missing env: "),
      });
      return;
    }

    // Marker eksplicit hvis autoresponsen fejlede
    if (
      msg.includes("ECONN") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("EAUTH") ||
      msg.includes("EENVELOPE") ||
      msg.includes("EADDR") ||
      msg.toLowerCase().includes("rejected") ||
      msg.toLowerCase().includes("relay")
    ) {
      res.status(502).json({
        ok: false,
        error: "MAIL_AUTOREPLY_FAILED",
        detail: msg,
      });
      return;
    }

    res.status(500).json({ ok: false, error: "MAIL_ERROR", detail: msg });
  }
}
