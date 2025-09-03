import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer, { type Transporter } from "nodemailer";

type Locale = "da" | "en";

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  country: string;
  message: string;
  // “purpose” kan bruges til at skifte copy (fx “booking”)
  purpose?: "contact" | "booking";
  lang?: Locale;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isContactPayload(v: unknown): v is ContactPayload {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.name)) return false;
  if (!isNonEmptyString(o.email)) return false;
  if (!isNonEmptyString(o.country)) return false;
  if (!isNonEmptyString(o.message)) return false;
  if (o.phone && typeof o.phone !== "string") return false;
  if (o.purpose && o.purpose !== "contact" && o.purpose !== "booking")
    return false;
  if (o.lang && o.lang !== "da" && o.lang !== "en") return false;
  return true;
}

function boolFromEnv(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function numberFromEnv(v: string | undefined, fallback: number): number {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function buildTransporter(): Transporter {
  const host = process.env.SMTP_HOST ?? "";
  const port = numberFromEnv(process.env.SMTP_PORT, 465);
  const secure = boolFromEnv(process.env.SMTP_SECURE, port === 465); // 465=>true, 587=>false
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";

  if (!host || !user || !pass) {
    throw new Error("CONFIG_MISSING: SMTP_HOST/SMTP_USER/SMTP_PASS");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function siteUrl(): string {
  return process.env.SITE_URL ?? "https://fyrrehaven-61.dk";
}

function ownerTo(): string {
  // hvor du vil modtage henvendelsen
  return process.env.CONTACT_TO ?? "info@fyrrehaven-61.dk";
}

function fromIdentity(): string {
  // VIGTIGT for Simply: “from” skal være din egen mailbox!
  const fromAddr =
    process.env.FROM_ADDR ?? process.env.SMTP_USER ?? "info@fyrrehaven-61.dk";
  const fromName = process.env.FROM_NAME ?? "Fyrrehaven 61";
  return `"${fromName}" <${fromAddr}>`;
}

function textForOwner(p: ContactPayload): string {
  const lines = [
    `Ny henvendelse fra formularen (${p.purpose ?? "contact"})`,
    "",
    `Navn:    ${p.name}`,
    `Email:   ${p.email}`,
    `Tlf.:    ${p.phone ?? "-"}`,
    `Land:    ${p.country}`,
    "",
    "Besked:",
    p.message,
    "",
    `Modtaget via: ${siteUrl()}`,
  ];
  return lines.join("\n");
}

function textForSender(p: ContactPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const lang: Locale = p.lang ?? "da";
  const isBooking = p.purpose === "booking";

  const subject =
    lang === "da"
      ? isBooking
        ? "Vi har modtaget din bookingforespørgsel"
        : "Vi har modtaget din henvendelse"
      : isBooking
      ? "We received your booking request"
      : "We received your message";

  const introDa = isBooking
    ? "Tak for din bookingforespørgsel – vi vender tilbage hurtigst muligt."
    : "Tak for din henvendelse – vi vender tilbage hurtigst muligt.";
  const introEn = isBooking
    ? "Thanks for your booking request — we’ll get back to you shortly."
    : "Thanks for your message — we’ll get back to you shortly.";

  const label = (da: string, en: string) => (lang === "da" ? da : en);

  const rows = [
    [label("Navn", "Name"), p.name],
    ["Email", p.email],
    [label("Telefon", "Phone"), p.phone ?? "-"],
    [label("Land", "Country"), p.country],
    [label("Formål", "Purpose"), p.purpose ?? "contact"],
    [label("Besked", "Message"), p.message],
  ];

  const text =
    (lang === "da" ? introDa : introEn) +
    "\n\n" +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\n${label("Læs mere på", "More info:")} ${siteUrl()}`;

  const html =
    `<p>${lang === "da" ? introDa : introEn}</p>` +
    `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="font-weight:600">${k}</td><td>${String(v).replace(
            /\n/g,
            "<br/>"
          )}</td></tr>`
      )
      .join("") +
    `</table><p><a href="${siteUrl()}">${siteUrl()}</a></p>`;

  return { subject, text, html };
}

// CORS: tillad kun fra eget website
function allowCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin ?? "";
  const allowed = siteUrl();
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return false;
  }
  if (origin === allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!allowCors(req, res)) return;

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    // Body kan være string eller objekt
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!isContactPayload(raw)) {
      res.status(400).json({ ok: false, error: "INVALID_BODY" });
      return;
    }
    const data: ContactPayload = raw;

    // Byg transporter (kaster hvis config mangler)
    const transporter = buildTransporter();

    // 1) Mail til ejer
    const ownerMsg = {
      from: fromIdentity(), // ← må IKKE være gæstens email
      to: ownerTo(),
      replyTo: data.email, // ← så du kan “svar”
      subject:
        (data.lang ?? "da") === "da"
          ? "Ny henvendelse fra formularen"
          : "New message from contact form",
      text: textForOwner(data),
    };

    // 2) Kvittering til afsender
    const receipt = textForSender(data);
    const senderMsg = {
      from: fromIdentity(),
      to: data.email,
      subject: receipt.subject,
      text: receipt.text,
      html: receipt.html,
    };

    // Send i serie (eller Promise.all)
    const r1 = await transporter.sendMail(ownerMsg);
    const r2 = await transporter.sendMail(senderMsg);

    res.status(200).json({
      ok: true,
      messageIdOwner: r1.messageId,
      messageIdSender: r2.messageId,
    });
  } catch (err) {
    // Log ALT til Vercel logs (Deployment → Functions → request → Logs)
    // Typisk fejl her: “Invalid login”, “Message rejected”, netværk m.m.
    console.error("CONTACT_API_ERROR", {
      err,
      env: {
        hasHost: !!process.env.SMTP_HOST,
        hasUser: !!process.env.SMTP_USER,
        hasPass: !!process.env.SMTP_PASS,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        contactTo: process.env.CONTACT_TO,
      },
    });

    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
}
