import nodemailer from "nodemailer";
import Busboy from "busboy";
import { normalizeLang, t, yesNo } from "./_lib/i18n.mjs";

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
      const uiLang = normalizeLang(lang);

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

      const typeKey = checkType === "checkin" ? "checkin" : "checkout";
      const subject = t(uiLang, "checkin.subject", {
        type: t(uiLang, `checkin.type.${typeKey}`),
        name,
      });
      const typeLabel = t(uiLang, `checkin.type.${typeKey}Label`);

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>${esc(subject)}</h2>
          <p><b>${esc(t(uiLang, "checkin.fields.name"))}:</b> ${esc(name)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.email"))}:</b> ${esc(email)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.keycode"))}:</b> ${esc(keycode)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.type"))}:</b> ${esc(typeLabel)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.electricity"))}:</b> ${esc(elReading)}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.waterHouse"))}:</b> ${esc(waterHouse)}</p>
          ${
            typeof waterPool !== "undefined"
              ? `<p><b>${esc(t(uiLang, "checkin.fields.waterPool"))}:</b> ${esc(waterPool)}</p>`
              : ""
          }
          <p><b>${esc(t(uiLang, "checkin.fields.consent"))}:</b> ${esc(yesNo(Boolean(consent), uiLang))}</p>
          <p><b>${esc(t(uiLang, "checkin.fields.comment"))}:</b></p>
          <pre style="background:#f6f6f6;padding:1em;border-radius:5px">${esc(
            comment || "—"
          )}</pre>
        </div>
      `;

      const text = `
${t(uiLang, "checkin.fields.name")}: ${name}
${t(uiLang, "checkin.fields.email")}: ${email}
${t(uiLang, "checkin.fields.keycode")}: ${keycode}
${t(uiLang, "checkin.fields.type")}: ${typeLabel}
${t(uiLang, "checkin.fields.electricity")}: ${elReading}
${t(uiLang, "checkin.fields.waterHouse")}: ${waterHouse}
${waterPool ? `${t(uiLang, "checkin.fields.waterPool")}: ${waterPool}\n` : ""}
${t(uiLang, "checkin.fields.consent")}: ${yesNo(Boolean(consent), uiLang)}
${t(uiLang, "checkin.fields.comment")}: ${comment || "—"}
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
