// /api/contact.mjs  (ESM, ingen `exports`/`module.exports`)
export const config = { runtime: "nodejs" }; // tving Node-runtime (krævet for nodemailer)

import nodemailer from "nodemailer";

/** Konfig fra miljøvariabler (Vercel → Project → Settings → Environment Variables) */
const {
  SMTP_HOST = "smtp.simply.com",
  SMTP_PORT = "587",
  SMTP_USER = "kontakt@fyrrehaven-61.dk",
  SMTP_PASSWORD = "",
  MAIL_FROM = "kontakt@fyrrehaven-61.dk",
  MAIL_TO = "kontakt@fyrrehaven-61.dk",
  SITE_NAME = "Fyrrehaven 61",
} = process.env;

/** Genbrug transporteren mellem kald (varme invocations) */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false, // 587 = STARTTLS
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
});

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
}
function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const raw = req.body ?? {};
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    const name = String(data?.name ?? "");
    const email = String(data?.email ?? "");
    const phone = data?.phone ? String(data.phone) : "";
    const country = String(data?.country ?? "");
    const message = String(data?.message ?? "");
    const context = String(data?.context ?? "contact");

    if (!name || !email || !country || !message)
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    if (!isEmail(email))
      return res.status(400).json({ ok: false, error: "Invalid email" });

    const stamp = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", " UTC");
    const subjectOwner =
      (context === "booking"
        ? `Bookingforespørgsel fra ${name}`
        : `Ny henvendelse fra ${name}`) + ` – ${SITE_NAME}`;

    const textOwner = `${SITE_NAME} – ${subjectOwner}
Tid: ${stamp}

Navn: ${name}
Email: ${email}
Telefon: ${phone || "-"}
Land: ${country}
Type: ${context}

Besked:
${message}
`;

    const htmlOwner = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.55">
        <h2 style="margin:0 0 8px">${esc(SITE_NAME)} – ${esc(subjectOwner)}</h2>
        <p style="margin:0 0 12px;color:#555">Tid: ${esc(stamp)}</p>
        <table style="border-collapse:collapse;margin-bottom:12px">
          <tr><td style="padding:4px 8px;color:#666">Navn</td><td style="padding:4px 8px;font-weight:600">${esc(
            name
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Email</td><td style="padding:4px 8px">${esc(
            email
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Telefon</td><td style="padding:4px 8px">${esc(
            phone || "-"
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Land</td><td style="padding:4px 8px">${esc(
            country
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Type</td><td style="padding:4px 8px">${esc(
            context
          )}</td></tr>
        </table>
        <div style="padding:12px;border:1px solid #eee;border-radius:8px;background:#fafafa;white-space:pre-wrap">${esc(
          message
        )}</div>
      </div>
    `;

    // 1) Mail til jer
    await transporter.sendMail({
      from: `"${SITE_NAME}" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: email,
      subject: subjectOwner,
      text: textOwner,
      html: htmlOwner,
    });

    // 2) Auto-kvittering til afsender
    const subjectAck = "Tak for din henvendelse / Thanks for your message";
    const textAck = `Hej ${name},

Tak for din henvendelse til ${SITE_NAME}. Vi vender tilbage hurtigst muligt.
Her er en kopi af din besked:

${message}

— ${SITE_NAME}
kontakt@fyrrehaven-61.dk

—

Hi ${name},

Thanks for contacting ${SITE_NAME}. We'll get back to you as soon as possible.
Here’s a copy of your message:

${message}

— ${SITE_NAME}
kontakt@fyrrehaven-61.dk
`;

    const htmlAck = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
        <p>Hej ${esc(name)},</p>
        <p>Tak for din henvendelse til <strong>${esc(
          SITE_NAME
        )}</strong>. Vi vender tilbage hurtigst muligt.</p>
        <p><em>Her er en kopi af din besked:</em></p>
        <blockquote style="margin:0;padding:12px;border-left:4px solid #ddd;background:#fafafa;border-radius:6px;white-space:pre-wrap">${esc(
          message
        )}</blockquote>
        <p style="margin-top:16px">— ${esc(
          SITE_NAME
        )}<br/>kontakt@fyrrehaven-61.dk</p>
        <hr style="margin:20px 0;border:0;border-top:1px solid #eee"/>
        <p>Hi ${esc(name)},</p>
        <p>Thanks for contacting <strong>${esc(
          SITE_NAME
        )}</strong>. We'll get back to you as soon as possible.</p>
        <p><em>Here’s a copy of your message:</em></p>
        <blockquote style="margin:0;padding:12px;border-left:4px solid #ddd;background:#fafafa;border-radius:6px;white-space:pre-wrap">${esc(
          message
        )}</blockquote>
        <p style="margin-top:16px">— ${esc(
          SITE_NAME
        )}<br/>kontakt@fyrrehaven-61.dk</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${SITE_NAME}" <${MAIL_FROM}>`,
      to: email,
      replyTo: MAIL_FROM,
      subject: subjectAck,
      text: textAck,
      html: htmlAck,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
