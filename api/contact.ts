// /api/contact.ts
export const runtime = "nodejs";

import nodemailer from "nodemailer";

type Lang = "da" | "en";
type Body = {
  lang: Lang;
  name: string;
  email: string;
  phone?: string;
  countryIso: string;
  message: string;
  purpose?: "contact" | "booking";
};

const ORIGIN = process.env.SITE_URL ?? "https://fyrrehaven-61.dk";
const CORS = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SMTP_HOST = process.env.SMTP_HOST ?? "mail.simply.com";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "465");
const SMTP_SECURE = SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER ?? "info@fyrrehaven-61.dk";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const CONTACT_TO = process.env.CONTACT_TO ?? "info@fyrrehaven-61.dk";
const FROM_NAME = process.env.FROM_NAME ?? "Fyrrehaven 61";

function badReq(msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
function serverErr(msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status: 500,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  let data: Body | null = null;
  try {
    data = (await req.json()) as Body;
  } catch {
    return badReq("invalid_json");
  }

  if (
    !data ||
    (data.lang !== "da" && data.lang !== "en") ||
    !data.name?.trim() ||
    !data.email?.includes("@") ||
    !data.message?.trim() ||
    !data.countryIso?.trim()
  ) {
    return badReq("invalid_payload");
  }

  if (!SMTP_PASS) {
    // Manglende secrets på Vercel = klassisk 500
    console.error("SMTP_PASS is missing");
    return serverErr("server_misconfigured");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const fullPhone = data.phone?.trim() ?? "";

  const adminSubject =
    data.lang === "da"
      ? `Ny henvendelse fra ${data.name}`
      : `New inquiry from ${data.name}`;

  const adminText =
    data.lang === "da"
      ? [
          `Navn: ${data.name}`,
          `Email: ${data.email}`,
          `Telefon: ${fullPhone || "-"}`,
          `Land: ${data.countryIso}`,
          `Formål: ${data.purpose ?? "contact"}`,
          "",
          data.message,
        ].join("\n")
      : [
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Phone: ${fullPhone || "-"}`,
          `Country: ${data.countryIso}`,
          `Purpose: ${data.purpose ?? "contact"}`,
          "",
          data.message,
        ].join("\n");

  const autoSubject =
    data.lang === "da"
      ? "Tak for din henvendelse – Fyrrehaven 61"
      : "Thanks for your message – Fyrrehaven 61";

  const lines =
    data.lang === "da"
      ? [
          "Tak for din henvendelse. Vi vender retur hurtigst muligt.",
          "",
          "Du sendte:",
          `Navn: ${data.name}`,
          `Email: ${data.email}`,
          `Telefon: ${fullPhone || "-"}`,
          `Land: ${data.countryIso}`,
          `Formål: ${data.purpose ?? "contact"}`,
          "",
          data.message,
          "",
          `— ${FROM_NAME} • ${ORIGIN}`,
        ]
      : [
          "Thanks for reaching out. We'll get back to you shortly.",
          "",
          "You sent:",
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Phone: ${fullPhone || "-"}`,
          `Country: ${data.countryIso}`,
          `Purpose: ${data.purpose ?? "contact"}`,
          "",
          data.message,
          "",
          `— ${FROM_NAME} • ${ORIGIN}`,
        ];
  const autoText = lines.join("\n");

  try {
    // til os
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: `"${data.name}" <${data.email}>`,
      subject: adminSubject,
      text: adminText,
    });

    // auto-svar til afsender
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to: data.email,
      subject: autoSubject,
      text: autoText,
    });

    return ok();
  } catch (e) {
    console.error("Mailer error:", e);
    return serverErr("mailer_failed");
  }
}
