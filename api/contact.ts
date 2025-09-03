// api/contact.ts  (ESM)
import nodemailer from "nodemailer";

type Body = {
  lang?: "da" | "en";
  name: string;
  email: string;
  phone?: string;
  countryIso?: string;
  country?: string;
  message: string;
  context?: "contact" | string;
};

export const config = {
  runtime: "nodejs20",
};

/** Lille hjælper til ensartede JSON-svar */
function json(res: any, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  let body: Body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return json(res, 400, { ok: false, error: "BAD_JSON" });
  }

  // Simple validering
  const missing: string[] = [];
  if (!body?.name?.trim()) missing.push("name");
  if (!body?.email?.trim()) missing.push("email");
  if (!body?.message?.trim()) missing.push("message");
  // country er ikke påkrævet, men sendes hvis muligt

  if (missing.length) {
    return json(res, 400, {
      ok: false,
      error: "VALIDATION_ERROR",
      detail: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  // ---- ENV: understøt både dine og "standard" navne ----
  const SMTP_HOST = process.env.SMTP_HOST || "";
  const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
  const SMTP_USER = process.env.SMTP_USER || "";
  const SMTP_PASS = process.env.SMTP_PASS || "";

  const MAIL_FROM =
    process.env.MAIL_FROM || process.env.SMTP_FROM || SMTP_USER || "";
  const MAIL_TO =
    process.env.MAIL_TO || process.env.CONTACT_TO || SMTP_USER || "";

  const requiredEnv: Array<[string, string]> = [
    ["SMTP_HOST", SMTP_HOST],
    ["SMTP_PORT", String(SMTP_PORT)],
    ["SMTP_USER", SMTP_USER],
    ["SMTP_PASS", SMTP_PASS],
    ["MAIL_FROM/SMTP_FROM", MAIL_FROM],
    ["MAIL_TO/CONTACT_TO", MAIL_TO],
  ];
  const missingEnv = requiredEnv
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missingEnv.length) {
    return json(res, 500, {
      ok: false,
      error: "ENV_MISSING",
      detail: `Missing env: ${missingEnv.join(", ")}`,
    });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const lang = body.lang === "da" ? "da" : "en";
  const prettyCountry = body.country || body.countryIso || "";

  const subject =
    lang === "da"
      ? `[Kontakt] ${body.name}${prettyCountry ? ` – ${prettyCountry}` : ""}`
      : `[Contact] ${body.name}${prettyCountry ? ` – ${prettyCountry}` : ""}`;

  const lines = [
    lang === "da" ? "Ny henvendelse" : "New enquiry",
    "",
    `Navn: ${body.name}`,
    `E-mail: ${body.email}`,
    body.phone ? `Telefon: ${body.phone}` : "",
    prettyCountry ? `Land: ${prettyCountry}` : "",
    `Kontekst: ${body.context || "contact"}`,
    "",
    lang === "da" ? "Besked:" : "Message:",
    body.message,
  ].filter(Boolean);

  try {
    // Mail til jer
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: `${body.name} <${body.email}>`,
      subject,
      text: lines.join("\n"),
    });

    // Auto-kvittering til afsender
    const ackSubject =
      lang === "da"
        ? "Tak for din henvendelse"
        : "Thanks for your message";
    const ackText =
      lang === "da"
        ? `Hej ${body.name},

Tak for din henvendelse til Fyrrehaven 61. Vi vender tilbage hurtigst muligt.

Du skrev:
${body.message}

Venlig hilsen
Fyrrehaven 61`
        : `Hi ${body.name},

Thanks for contacting Fyrrehaven 61. We'll get back to you as soon as possible.

You wrote:
${body.message}

Best regards,
Fyrrehaven 61`;

    await transporter.sendMail({
      from: MAIL_FROM,
      to: body.email,
      subject: ackSubject,
      text: ackText,
    });

    return json(res, 200, { ok: true });
  } catch (err: unknown) {
    console.error("Mail send error:", err);
    return json(res, 500, { ok: false, error: "SERVER_ERROR" });
  }
}