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

/** —— Din faste signatur (uforandret) —— */
const SIGNATURE_HTML = `... (uforandret, behold din nuværende SIGNATURE_HTML) ...`;

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
      selection, // { start, endExclusive, nights, baseNightsTotalDKK, cleaningFeeDKK, totalWithCleaningDKK, totalWithCleaningAndExtrasDKK, breakdown[] }

      // NEW: ekstra services
      extras, // { items: [{id, qty, unitPriceDKK, label:{da,en}}], totalDKK }
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

    // SMTP setup (uforandret)
    const host = reqEnv("SMTP_HOST");
    const port = Number(process.env.SMTP_PORT || 587);
    const user = reqEnv("SMTP_USER");
    const pass = reqEnv("SMTP_PASS");
    const from = reqEnv("MAIL_FROM");
    const to = reqEnv("MAIL_TO");

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
    });

    await transporter.verify();

    const introAdmin =
      lang === "da"
        ? "Ny indsendelse fra websitet:"
        : "New submission from the website:";
    const subjectAdmin =
      lang === "da"
        ? `Fyrrehaven 61 | ${name} (${intent})`
        : `Fyrrehaven 61 | ${name} (${intent})`;

    const countryShown = country || countryIso || "—";

    // Normaliser bookingfelter
    const startStr = fmtDate(selection?.start, lang);
    const endStr = fmtDate(selection?.endExclusive, lang);
    const nightsStr =
      typeof selection?.nights === "number" ? String(selection.nights) : "—";
    const nightsPriceStr = fmtMoney(selection?.baseNightsTotalDKK, lang);
    const cleaningStr = fmtMoney(selection?.cleaningFeeDKK, lang);
    const totalStr = fmtMoney(selection?.totalWithCleaningDKK, lang);

    // NEW: extras
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
      </table>
    `
        : "";

    const grandInclExtrasHtml =
      grandInclExtras != null
        ? `
      <p style="margin:8px 0 0"><b>${
        lang === "da"
          ? "Estimeret total inkl. ekstra"
          : "Estimated total incl. extras"
      }:</b> ${fmtMoney(grandInclExtras, lang)}</p>
    `
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

    // Godkendelser
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
      to,
      subject: subjectAdmin,
      html: htmlAdmin,
      text: textAdmin,
      replyTo: email,
    });

    /** Auto-reply til afsender (uforandret tekstligt) */
    const siteName = process.env.SITE_NAME || "Fyrrehaven 61";
    const subjectUser =
      lang === "da"
        ? `Tak for din henvendelse – ${siteName}`
        : `Thanks for your message – ${siteName}`;
    const bodyUser =
      lang === "da"
        ? `<p>Tak for din ${
            isBookingReq ? "bookingforespørgsel" : "henvendelse"
          }. Vi vender tilbage snarest muligt.</p>`
        : `<p>Thanks for your ${
            isBookingReq ? "booking request" : "message"
          }. We’ll get back to you shortly.</p>`;

    const htmlUser = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">
        ${bodyUser}
        ${SIGNATURE_HTML}
      </div>
    `;
    const textUser =
      lang === "da"
        ? `Tak for din ${
            isBookingReq ? "bookingforespørgsel" : "henvendelse"
          }. Vi vender tilbage snarest muligt.\n\n${siteName}\nhttps://fyrrehaven-61.dk`
        : `Thanks for your ${
            isBookingReq ? "booking request" : "message"
          }. We’ll get back to you shortly.\n\n${siteName}\nhttps://fyrrehaven-61.dk`;

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: subjectUser,
        html: htmlUser,
        text: textUser,
        replyTo: to,
      });
    } catch (autoErr) {
      console.error("MAIL_AUTOREPLY_ERROR", autoErr);
    }

    res.status(200).json({ ok: true, id: infoAdmin.messageId || null });
  } catch (err) {
    console.error("MAIL_ERROR", err);
    const msg = String(err && err.message ? err.message : err);

    if (msg.startsWith("ENV_MISSING:")) {
      res.status(500).json({
        ok: false,
        error: "ENV_MISSING",
        detail: msg.replace("ENV_MISSING:", "Missing env: "),
      });
      return;
    }
    res.status(500).json({ ok: false, error: "MAIL_ERROR", detail: msg });
  }
}
