// /api/contact.mjs  (ESM på Vercel Node.js runtime)
export const config = { runtime: "nodejs" };

import nodemailer from "nodemailer";
import { URL } from "node:url";

const {
  SMTP_HOST = "smtp.simply.com",
  SMTP_PORT = "587", // 587 = STARTTLS, 465 = TLS
  SMTP_USER = "kontakt@fyrrehaven-61.dk",
  SMTP_PASSWORD = "",
  MAIL_FROM = "kontakt@fyrrehaven-61.dk",
  MAIL_TO = "kontakt@fyrrehaven-61.dk",
  SITE_NAME = "Fyrrehaven 61",
} = process.env;

function ensureEnv() {
  const miss = [];
  if (!SMTP_HOST) miss.push("SMTP_HOST");
  if (!SMTP_PORT) miss.push("SMTP_PORT");
  if (!SMTP_USER) miss.push("SMTP_USER");
  if (!SMTP_PASSWORD) miss.push("SMTP_PASSWORD");
  if (!MAIL_FROM) miss.push("MAIL_FROM");
  if (!MAIL_TO) miss.push("MAIL_TO");
  if (miss.length) {
    const msg = `Missing env: ${miss.join(", ")}`;
    return { ok: false, error: msg };
  }
  return { ok: true };
}

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

function makeTransporter() {
  const port = Number(SMTP_PORT);
  const secure = port === 465; // TLS på 465
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    requireTLS: !secure, // brug STARTTLS på 587
  });
}

export default async function handler(req, res) {
  // method guard
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  // env guard
  const envCheck = ensureEnv();
  if (!envCheck.ok) {
    return res
      .status(500)
      .json({ ok: false, error: "ENV_MISSING", detail: envCheck.error });
  }

  // query (for dry-run)
  const url = new URL(req.url, "http://localhost");
  const dry = url.searchParams.get("dry") === "1";

  try {
    // body parsing (Vercel leverer normalt allerede et objekt ved JSON)
    const raw = req.body ?? {};
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    const name = String(data?.name ?? "").trim();
    const email = String(data?.email ?? "").trim();
    const phone = data?.phone ? String(data.phone).trim() : "";
    const country = String(data?.country ?? "").trim();
    const message = String(data?.message ?? "").trim();
    const context = String(data?.context ?? "contact").trim();

    if (!name || !email || !country || !message) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "VALIDATION_ERROR",
          detail: "Missing required fields",
        });
    }
    if (!isEmail(email)) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "VALIDATION_ERROR",
          detail: "Invalid email",
        });
    }

    if (dry) {
      // Hurtig røgtest uden SMTP
      return res
        .status(200)
        .json({
          ok: true,
          dry: true,
          echo: {
            name,
            email,
            phone,
            country,
            context,
            messageLen: message.length,
          },
        });
    }

    const transporter = makeTransporter();

    // Verificér forbindelsen til SMTP (giver klare fejl hvis creds/port er forkerte)
    try {
      await transporter.verify();
    } catch (e) {
      return res
        .status(502)
        .json({
          ok: false,
          error: "SMTP_VERIFY_FAILED",
          detail: String(e?.message ?? e),
        });
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

    // Send til jer
    try {
      await transporter.sendMail({
        from: `"${SITE_NAME}" <${MAIL_FROM}>`,
        to: MAIL_TO,
        replyTo: email,
        subject: subjectOwner,
        text: textOwner,
        html: htmlOwner,
      });
    } catch (e) {
      return res
        .status(502)
        .json({
          ok: false,
          error: "SMTP_SEND_OWNER_FAILED",
          detail: String(e?.message ?? e),
        });
    }

    // Kvittering til afsender
    const subjectAck = "Tak for din henvendelse / Thanks for your message";
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

    try {
      await transporter.sendMail({
        from: `"${SITE_NAME}" <${MAIL_FROM}>`,
        to: email,
        replyTo: MAIL_FROM,
        subject: subjectAck,
        text: textAck,
        html: htmlAck,
      });
    } catch (e) {
      // Vi svarer stadig 200 (jeres mail er sendt), men med advarsel
      return res
        .status(200)
        .json({
          ok: true,
          warn: "SMTP_SEND_ACK_FAILED",
          detail: String(e?.message ?? e),
        });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .json({
        ok: false,
        error: "SERVER_EXCEPTION",
        detail: String(err?.message ?? err),
      });
  }
}
