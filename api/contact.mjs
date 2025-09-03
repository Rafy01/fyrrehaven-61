// /api/contact.mjs
import nodemailer from "nodemailer";

const requiredEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "MAIL_FROM",
  "MAIL_TO",
  "SITE_NAME",
];

function ensureEnv() {
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    return {
      ok: false,
      error: "ENV_MISSING",
      detail: `Missing env: ${missing.join(", ")}`,
    };
  }
  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  // JSON body
  let body;
  try {
    // Vercel edge/Node kan være forskellig – prøv begge
    body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body ?? (await req.json?.());
  } catch {
    return res.status(400).json({ ok: false, error: "BAD_JSON" });
  }

  const {
    lang,
    name,
    email,
    phone,
    message,
    countryIso, // forventet ISO2 (fx "DK")
    country, // fallback hvis iso mangler (tekst)
    context = "contact",
  } = body || {};

  // Tydelig validering
  const missing = [];
  if (!name?.trim()) missing.push("name");
  if (!email?.trim()) missing.push("email");
  if (!message?.trim()) missing.push("message");
  if (!countryIso?.trim() && !country?.trim())
    missing.push("country/countryIso");

  if (missing.length) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR",
      detail: { missing },
    });
  }

  const envOk = ensureEnv();
  if (!envOk.ok) return res.status(500).json(envOk);

  // Dry-run til test: ?dry=1 sender ikke mail men giver OK
  const isDry = req.query?.dry === "1";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // STARTTLS på 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const site = process.env.SITE_NAME || "Website";
  const from = process.env.MAIL_FROM;
  const to = process.env.MAIL_TO;

  const lines = [
    `Formål: ${context}`,
    `Sprog: ${lang || "ukendt"}`,
    `Navn: ${name}`,
    `Email: ${email}`,
    `Telefon: ${phone || "-"}`,
    `Land (ISO/tekst): ${countryIso || "-"} / ${country || "-"}`,
    "",
    "Besked:",
    message,
  ];

  const subjectDa = `Ny henvendelse fra ${site}`;
  const subjectEn = `New inquiry from ${site}`;
  const subject = lang === "en" ? subjectEn : subjectDa;

  const mailOptions = {
    from,
    to,
    replyTo: email,
    subject,
    text: lines.join("\n"),
  };

  if (isDry) {
    return res.status(200).json({ ok: true, dry: true });
  }

  try {
    await transporter.sendMail(mailOptions);

    // auto-kvittering til afsenderen
    await transporter.sendMail({
      from,
      to: email,
      subject:
        lang === "en"
          ? `We received your message – ${site}`
          : `Vi har modtaget din besked – ${site}`,
      text:
        lang === "en"
          ? `Thanks for your message!\n\nWe received:\n\n${lines.join(
              "\n"
            )}\n\nWe'll get back to you soon.\n\nBest,\n${site}`
          : `Tak for din besked!\n\nVi har modtaget følgende:\n\n${lines.join(
              "\n"
            )}\n\nVi vender tilbage hurtigst muligt.\n\nVenlig hilsen\n${site}`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("MAIL_ERROR", err);
    return res.status(500).json({ ok: false, error: "MAIL_ERROR" });
  }
}
