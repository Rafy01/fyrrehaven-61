import nodemailer from "nodemailer";
import Busboy from "busboy";

const reqEnv = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`ENV_MISSING:${k}`);
  return v;
};

const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const yn = (b, lang = "da") =>
  b ? (lang === "da" ? "Ja" : "Yes") : lang === "da" ? "Nej" : "No";

// Vercel handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const fields = {};
    const files = [];

    const busboy = Busboy({ headers: req.headers });

    busboy.on("file", (name, file, info) => {
      const buffers = [];
      file.on("data", (data) => buffers.push(data));
      file.on("end", () => {
        files.push({
          fieldname: name,
          filename: info.filename,
          contentType: info.mimeType,
          content: Buffer.concat(buffers),
        });
      });
    });

    busboy.on("field", (name, val) => {
      fields[name] = val;
    });

    busboy.on("finish", async () => {
      const {
        name,
        keycode,
        email,
        checkType,
        elReading,
        waterHouse,
        waterPool,
        comment,
        consent,
        lang = "da",
      } = fields;

      if (
        !name ||
        !email ||
        !checkType ||
        !elReading ||
        !waterHouse ||
        !consent
      ) {
        res.status(400).json({
          ok: false,
          error: "VALIDATION_ERROR",
          detail: "Missing required fields",
        });
        return;
      }

      // SMTP setup
      const host = reqEnv("SMTP_HOST");
      const port = Number(process.env.SMTP_PORT || 587);
      const user = reqEnv("SMTP_USER");
      const pass = reqEnv("SMTP_PASS");
      const from = reqEnv("MAIL_FROM");
      const to = reqEnv("MAIL_TO");

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const subject =
        lang === "da"
          ? `Tjek-${
              checkType === "checkin" ? "ind" : "ud"
            } aflæsning fra ${name}`
          : `Check-${
              checkType === "checkin" ? "in" : "out"
            } reading from ${name}`;

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>${esc(subject)}</h2>
          <p><b>Navn / Name:</b> ${esc(name)}</p>
          <p><b>Email:</b> ${esc(email)}</p>
          <p><b>Nøglekode / Keybox code:</b> ${esc(keycode)}</p>
          <p><b>Type:</b> ${
            checkType === "checkin"
              ? "Tjek-ind / Check-in"
              : "Tjek-ud / Check-out"
          }</p>
          <p><b>EL:</b> ${esc(elReading)}</p>
          <p><b>Vand (hus):</b> ${esc(waterHouse)}</p>
          ${
            typeof waterPool !== "undefined"
              ? `<p><b>Vand (pool):</b> ${esc(waterPool)}</p>`
              : ""
          }
          <p><b>Samtykke / Consent:</b> ${yn(Boolean(consent), lang)}</p>
          <p><b>Kommentar:</b></p>
          <pre style="background:#f6f6f6;padding:1em;border-radius:5px">${esc(
            comment || "—"
          )}</pre>
        </div>
      `;

      const text = `
Navn / Name: ${name}
Email: ${email}
Nøglekode / Keycode: ${keycode}
Type: ${checkType}
EL: ${elReading}
Vand (hus): ${waterHouse}
${waterPool ? `Vand (pool): ${waterPool}\n` : ""}
Consent: ${yn(Boolean(consent), lang)}
Kommentar: ${comment || "—"}
      `;

      await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
        attachments: files.map((file) => ({
          filename: file.filename,
          content: file.content,
          contentType: file.contentType,
        })),
      });

      res.status(200).json({ ok: true });
    });

    req.pipe(busboy);
  } catch (err) {
    console.error("MAIL_ERROR", err?.response || err);
    const msg =
      typeof err === "object" && err !== null && "message" in err
        ? String(err.message)
        : String(err);

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
