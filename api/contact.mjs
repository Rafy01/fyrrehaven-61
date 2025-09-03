// /api/contact.mjs
import nodemailer from "nodemailer";

/** tiny helper to read a required env var */
const req = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`ENV_MISSING:${k}`);
  return v;
};

export default async function handler(req_, res) {
  try {
    if (req_.method !== "POST") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    /** ---- Parse & validate body ---- */
    const {
      lang,
      name,
      email,
      phone, // optional (may include +code)
      country, // optional label
      message,
      context = "contact",
    } = req_.body ?? {};

    if (!name || !email || !message) {
      res.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        detail: "Missing required fields",
      });
      return;
    }

    /** ---- SMTP config from env ---- */
    const host = req("SMTP_HOST"); // e.g. smtp.simply.com
    const port = Number(process.env.SMTP_PORT || 587); // 587 (STARTTLS) or 465 (SMTPS)
    const user = req("SMTP_USER"); // kontakt@...
    const pass = req("SMTP_PASS");
    const from = req("MAIL_FROM"); // 'Fyrrehaven 61 <kontakt@...>'
    const to = req("MAIL_TO"); // kontakt@...

    // Secure when 465 OR SMTP_SECURE=true
    const secure =
      String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
      port === 465;

    // Optional “relax TLS” (only if your provider needs it)
    const tlsInsecure =
      String(process.env.SMTP_TLS_INSECURE || "").toLowerCase() === "true";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true on 465, false on 587
      auth: { user, pass },
      requireTLS: !secure, // force STARTTLS on 587
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      tls: {
        minVersion: "TLSv1.2",
        ...(tlsInsecure ? { rejectUnauthorized: false } : {}),
      },
    });

    // Optional: early verify to surface clearer errors
    await transporter.verify();

    /** ---- Compose mail ---- */
    const subject =
      lang === "da"
        ? `Ny henvendelse (${context})`
        : `New message (${context})`;

    const intro =
      lang === "da"
        ? "Der er indsendt en ny henvendelse fra websitet:"
        : "A new message was submitted from the website:";

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">
        <p>${intro}</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 8px"><b>Navn / Name</b></td><td style="padding:4px 8px">${escapeHtml(
            name
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>E-mail</b></td><td style="padding:4px 8px">${escapeHtml(
            email
          )}</td></tr>
          ${
            phone
              ? `<tr><td style="padding:4px 8px"><b>Telefon / Phone</b></td><td style="padding:4px 8px">${escapeHtml(
                  phone
                )}</td></tr>`
              : ""
          }
          ${
            country
              ? `<tr><td style="padding:4px 8px"><b>Land / Country</b></td><td style="padding:4px 8px">${escapeHtml(
                  country
                )}</td></tr>`
              : ""
          }
          <tr><td style="padding:4px 8px"><b>Sprog / Lang</b></td><td style="padding:4px 8px">${
            lang || "n/a"
          }</td></tr>
          <tr><td style="padding:4px 8px"><b>Kontekst / Context</b></td><td style="padding:4px 8px">${context}</td></tr>
        </table>
        <p><b>Besked / Message</b></p>
        <pre style="white-space:pre-wrap;background:#f6f6f6;border:1px solid #eee;border-radius:6px;padding:12px">${escapeHtml(
          message
        )}</pre>
      </div>
    `;

    const text =
      `${intro}\n\n` +
      `Navn/Name: ${name}\n` +
      `E-mail: ${email}\n` +
      (phone ? `Telefon/Phone: ${phone}\n` : "") +
      (country ? `Land/Country: ${country}\n` : "") +
      `Sprog/Lang: ${lang || "n/a"}\n` +
      `Kontekst/Context: ${context}\n\n` +
      `Besked/Message:\n${message}\n`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      replyTo: email,
    });

    // Success response (include id for debugging)
    res.status(200).json({ ok: true, id: info.messageId || null });
  } catch (err) {
    // Log the precise error message to Vercel logs
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

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
