import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

/** ––––– Konfig – læses fra env på Vercel ––––– */
const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.simply.com";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER ?? "contact@fyrrehaven-61.dk";
const SMTP_PASS = process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS ?? "";
const MAIL_FROM = process.env.MAIL_FROM ?? "contact@fyrrehaven-61.dk";
const MAIL_TO = process.env.MAIL_TO ?? "contact@fyrrehaven-61.dk";
const SITE_NAME = process.env.SITE_NAME ?? "Fyrrehaven 61";

/** Genbrug én transporter (Vercel kører funktionen koldt/varmt) */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // STARTTLS på 587
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

/** Simple valideringer */
function isEmail(x: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

type Payload = {
  name: string;
  email: string;
  phone?: string;
  country: string;
  message: string;
  context?: "contact" | "booking" | string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const bodyRaw = (req.body ?? {}) as unknown;
    const data: Payload =
      typeof bodyRaw === "string" ? JSON.parse(bodyRaw) : (bodyRaw as Payload);

    const { name, email, phone, country, message, context } = data;

    if (!name || !email || !country || !message) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

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
Telefon: ${phone ?? "-"}
Land: ${country}

Besked:
${message}
`;

    const htmlOwner = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">${SITE_NAME} – ${subjectOwner}</h2>
        <p style="margin:0 0 12px;color:#555">Tid: ${stamp}</p>
        <table style="border-collapse:collapse;margin-bottom:12px">
          <tr><td style="padding:4px 8px;color:#666">Navn</td><td style="padding:4px 8px;font-weight:600">${escapeHtml(
            name
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Email</td><td style="padding:4px 8px">${escapeHtml(
            email
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Telefon</td><td style="padding:4px 8px">${escapeHtml(
            phone ?? "-"
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Land</td><td style="padding:4px 8px">${escapeHtml(
            country
          )}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Type</td><td style="padding:4px 8px">${escapeHtml(
            context ?? "contact"
          )}</td></tr>
        </table>
        <div style="padding:12px;border:1px solid #eee;border-radius:8px;background:#fafafa;white-space:pre-wrap">${escapeHtml(
          message
        )}</div>
      </div>
    `;

    // 1) Mail til dig
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
contact@fyrrehaven-61.dk

—

Hi ${name},

Thanks for contacting ${SITE_NAME}. We'll get back to you as soon as possible.
Here’s a copy of your message:

${message}

— ${SITE_NAME}
contact@fyrrehaven-61.dk
`;

    const htmlAck = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
        <p>Hej ${escapeHtml(name)},</p>
        <p>Tak for din henvendelse til <strong>${SITE_NAME}</strong>. Vi vender tilbage hurtigst muligt.</p>
        <p><em>Her er en kopi af din besked:</em></p>
        <blockquote style="margin:0;padding:12px;border-left:4px solid #ddd;background:#fafafa;border-radius:6px;white-space:pre-wrap">${escapeHtml(
          message
        )}</blockquote>
        <p style="margin-top:16px">— ${SITE_NAME}<br/>contact@fyrrehaven-61.dk</p>
        <hr style="margin:20px 0;border:0;border-top:1px solid #eee"/>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for contacting <strong>${SITE_NAME}</strong>. We'll get back to you as soon as possible.</p>
        <p><em>Here’s a copy of your message:</em></p>
        <blockquote style="margin:0;padding:12px;border-left:4px solid #ddd;background:#fafafa;border-radius:6px;white-space:pre-wrap">${escapeHtml(
          message
        )}</blockquote>
        <p style="margin-top:16px">— ${SITE_NAME}<br/>contact@fyrrehaven-61.dk</p>
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

/** Lille HTML-escape helper */
function escapeHtml(str: string): string {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
