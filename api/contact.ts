// api/contact.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

type Lang = "da" | "en";
type ISO2 =
  | "DK"
  | "SE"
  | "NO"
  | "FI"
  | "DE"
  | "GB"
  | "IE"
  | "NL"
  | "BE"
  | "FR"
  | "ES"
  | "IT"
  | "PT"
  | "AT"
  | "CH"
  | "PL"
  | "CZ";

interface ContactBody {
  lang: Lang;
  name: string;
  email: string;
  phone?: string; // inkl. +landekode hvis udfyldt
  countryIso: ISO2;
  message: string;
  purpose?: "contact" | "booking";
}

function isEmail(x: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

function safeTrim(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const body = req.body as Partial<ContactBody> | undefined;
  const lang: Lang = body?.lang === "en" ? "en" : "da";
  const name = safeTrim(body?.name);
  const email = safeTrim(body?.email).toLowerCase();
  const phone = safeTrim(body?.phone);
  const countryIso = (safeTrim(body?.countryIso) as ISO2) || "DK";
  const message = safeTrim(body?.message);
  const purpose = body?.purpose ?? "contact";

  if (!name || !email || !message || !isEmail(email)) {
    return res.status(400).json({ ok: false, error: "validation_failed" });
  }

  // ENV – udfyldes i Vercel (Settings → Environment Variables)
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM || `"Fyrrehaven 61" <info@fyrrehaven-61.dk>`;
  const to = process.env.SMTP_TO || "info@fyrrehaven-61.dk";

  if (!host || !user || !pass) {
    return res.status(500).json({ ok: false, error: "smtp_not_configured" });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Simply: 465 = SSL, 587 = STARTTLS
    auth: { user, pass }, 
  });

  // Admin-mail (til jer)
  const subjAdmin =
    purpose === "booking"
      ? `Bookingforespørgsel fra ${name}`
      : `Kontaktformular fra ${name}`;

  const textAdmin =
    `Navn: ${name}\n` +
    `E-mail: ${email}\n` +
    (phone ? `Telefon: ${phone}\n` : "") +
    `Land: ${countryIso}\n` +
    `Formål: ${purpose}\n\n` +
    `Besked:\n${message}\n`;

  const htmlAdmin =
    `<h2>${subjAdmin}</h2>` +
    `<p><b>Navn:</b> ${name}<br/>` +
    `<b>E-mail:</b> ${email}<br/>` +
    (phone ? `<b>Telefon:</b> ${phone}<br/>` : "") +
    `<b>Land:</b> ${countryIso}<br/>` +
    `<b>Formål:</b> ${purpose}</p>` +
    `<p style="white-space:pre-wrap">${message}</p>`;

  // Kvittering til afsender
  const subjUser =
    lang === "da"
      ? "Vi har modtaget din henvendelse – Fyrrehaven 61"
      : "We received your message – Fyrrehaven 61";

  const textUser =
    lang === "da"
      ? `Hej ${name}\n\nTak for din henvendelse. Vi vender tilbage hurtigst muligt.\n\nDin besked:\n${message}\n\nVenlig hilsen\nFyrrehaven 61`
      : `Hi ${name}\n\nThanks for your message. We’ll get back to you shortly.\n\nYour message:\n${message}\n\nBest regards\nFyrrehaven 61`;

  const htmlUser =
    lang === "da"
      ? `<p>Hej ${name}</p><p>Tak for din henvendelse. Vi vender tilbage hurtigst muligt.</p><p><b>Din besked:</b></p><p style="white-space:pre-wrap">${message}</p><p>Venlig hilsen<br/>Fyrrehaven 61</p>`
      : `<p>Hi ${name}</p><p>Thanks for your message. We’ll get back to you shortly.</p><p><b>Your message:</b></p><p style="white-space:pre-wrap">${message}</p><p>Best regards<br/>Fyrrehaven 61</p>`;

  try {
    // send til jer
    await transporter.sendMail({
      from,
      to,
      replyTo: email, // svar går direkte til afsender
      subject: subjAdmin,
      text: textAdmin,
      html: htmlAdmin,
    });

    // kvittering til bruger
    await transporter.sendMail({
      from,
      to: email,
      subject: subjUser,
      text: textUser,
      html: htmlUser,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SMTP error:", err);
    return res.status(500).json({ ok: false, error: "smtp_send_failed" });
  }
}
