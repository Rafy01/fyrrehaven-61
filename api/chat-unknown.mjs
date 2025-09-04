
// /api/chat-unknown.mjs  (Vercel Serverless Function – ESM)
import nodemailer from "nodemailer";

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

    const { q, lang, page } = req_.body ?? {};
    if (!q) {
      res.status(400).json({ ok: false, error: "VALIDATION_ERROR", detail: "q is required" });
      return;
    }

    const host = req("SMTP_HOST");
    const port = Number(process.env.SMTP_PORT || 587);
    const user = req("SMTP_USER");
    const pass = req("SMTP_PASS");
    const from = req("MAIL_FROM");
    const to = req("MAIL_TO");
    const site = process.env.SITE_NAME || "Fyrrehaven 61";

    const secure =
      String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
    const tlsInsecure =
      String(process.env.SMTP_TLS_INSECURE || "").toLowerCase() === "true";

    const transporter = nodemailer.createTransport({
      host, port, secure, auth: { user, pass },
      requireTLS: !secure,
      connectionTimeout: 15000, greetingTimeout: 10000, socketTimeout: 20000,
      tls: { minVersion: "TLSv1.2", ...(tlsInsecure ? { rejectUnauthorized: false } : {}) },
    });

    const subject = `${site} | Ukendt chatspørgsmål`;
    const text =
      `Ukendt chatspørgsmål:\n\n` +
      `Lang: ${lang || "n/a"}\n` +
      `Side: ${page || "n/a"}\n\n` +
      `Spørgsmål:\n${q}\n`;

    await transporter.sendMail({ from, to, subject, text });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("CHAT_UNKNOWN_ERROR", err);
    const msg = String(err && err.message ? err.message : err);
    if (msg.startsWith("ENV_MISSING:")) {
      res.status(500).json({ ok: false, error: "ENV_MISSING", detail: msg.replace("ENV_MISSING:", "Missing env: ") });
      return;
    }
    res.status(500).json({ ok: false, error: "MAIL_ERROR", detail: msg });
  }
}